/* Módulo Tempo — cronômetro, atividades e lançamentos de horas por pessoa.
 * Dados: lancamentos/<pessoa>_<AAAA-MM> {itens[]}, atividades/<pessoa> {itens[]}, timers/<pessoa>.
 * Expõe Trilha.tempo para outros módulos (relatórios, projetos). */
(function () {
  "use strict";
  var T = window.Trilha, $ = T.$, esc = T.esc, hm = T.hm, ymd = T.ymd, fmtH = T.fmtH;
  var S = { lancDocs: {}, lanc: [], ativDocs: {}, timers: {}, cat: T.ls("tempo.cat") || "projeto", eCat: "projeto", dia: ymd(new Date()), editEntryId: null, delEntryId: null, confirm: null };
  var CAT_LABEL = { projeto: "Projeto", gestao: "Gestão", obra: "Obra" };

  // ---------- consultas (usadas também por outros módulos) ----------
  function lancAtivos() { return S.lanc.filter(function (l) { return !l.excluido; }); }
  function alvoNome(l) { if (l.tipo === "area") return T.areaNome(l.alvoId); var p = T.projeto(l.alvoId); return p ? p.nome : "Projeto removido"; }
  function catDe(l) { return l.tipo === "area" ? "gestao" : l.etapaId === "obra" ? "obra" : "projeto"; }
  function rotulo(l) {
    var c = catDe(l);
    if (c === "obra") return alvoNome(l) + " · Obra" + (l.topicoId ? " · " + T.topicoNome(l.topicoId) : "");
    return alvoNome(l) + (l.etapaId ? " · " + T.etapaNome(l.etapaId) : "");
  }
  function custoLanc(l) { var ch = T.custoHoraTotal(l.pessoaId); return ch == null ? null : ch * l.min / 60; }
  function doMes(l, mes) { return ymd(new Date(l.inicio)).slice(0, 7) === mes; }
  function isLocked(iniIso) { return new Date(iniIso) < T.weekStart(new Date()); }
  function ativs(pid) { return S.ativDocs[pid] || []; }
  function minAtiv(id) { return lancAtivos().reduce(function (s, l) { return s + (l.atividadeId === id ? l.min : 0); }, 0); }
  function statsMes(pid) {
    var mes = T.mesAtual(), min = 0, dias = {};
    lancAtivos().forEach(function (l) { if (l.pessoaId === pid && doMes(l, mes)) { min += l.min; dias[ymd(new Date(l.inicio))] = 1; } });
    return { min: min, dias: Object.keys(dias).length };
  }
  T.tempo = { lancAtivos: lancAtivos, alvoNome: alvoNome, catDe: catDe, rotulo: rotulo, custoLanc: custoLanc, doMes: doMes, CAT_LABEL: CAT_LABEL, timers: function () { return S.timers; } };

  // ---------- gravação agrupada ----------
  function mesDoc(pid, iniIso) { return pid + "_" + ymd(new Date(iniIso)).slice(0, 7); }
  function itensDoc(docId) { return T.clone(S.lancDocs[docId] || []); }
  async function gravarDoc(docId, pid, itens) {
    S.lancDocs[docId] = itens; flattenLanc();
    await T.db.doc("lancamentos/" + docId).set({ pessoaId: pid, mes: docId.slice(-7), itens: itens });
  }
  async function addLanc(l) { l.id = T.novoId(); var docId = mesDoc(l.pessoaId, l.inicio), itens = itensDoc(docId); itens.push(l); await gravarDoc(docId, l.pessoaId, itens); return l.id; }
  async function updateLanc(id, patch) {
    var old = T.byId(S.lanc, id); if (!old) return;
    var novo = Object.assign({}, old, patch); delete novo._doc;
    var docOld = old._doc, docNew = mesDoc(novo.pessoaId, novo.inicio);
    var itensOld = itensDoc(docOld).filter(function (x) { return x.id !== id; });
    if (docOld === docNew) { itensOld.push(novo); await gravarDoc(docOld, novo.pessoaId, itensOld); }
    else { var itensNew = itensDoc(docNew); itensNew.push(novo); await gravarDoc(docNew, novo.pessoaId, itensNew); await gravarDoc(docOld, old.pessoaId, itensOld); }
  }
  async function removeLanc(id) { var old = T.byId(S.lanc, id); if (!old) return; await gravarDoc(old._doc, old.pessoaId, itensDoc(old._doc).filter(function (x) { return x.id !== id; })); }
  function flattenLanc() {
    var out = [];
    Object.keys(S.lancDocs).forEach(function (docId) { S.lancDocs[docId].forEach(function (x) { var o = Object.assign({}, x); o._doc = docId; out.push(o); }); });
    S.lanc = out;
  }
  async function saveAtivs(pid, itens) {
    var limite = Date.now() - 60 * 86400000;
    itens = itens.filter(function (a) { return a.status !== "concluida" || new Date(a.concluidoEm) > limite; });
    S.ativDocs[pid] = itens;
    await T.db.doc("atividades/" + pid).set({ pessoaId: pid, itens: itens });
  }

  // ---------- seletores ----------
  function fillAlvo(sel, cat, current) {
    var html = '<option value="">Escolha…</option>';
    if (cat === "gestao") T.cfg().areas.forEach(function (a) { html += '<option value="' + esc(a.id) + '">' + esc(a.nome) + "</option>"; });
    else T.state.projetos.filter(function (p) { return p.status !== "concluido" || p.id === current; }).sort(function (a, b) { return a.nome.localeCompare(b.nome); })
      .forEach(function (p) { html += '<option value="' + esc(p.id) + '">' + esc(p.nome) + (p.status === "concluido" ? " (concluído)" : "") + "</option>"; });
    sel.innerHTML = html; sel.value = current || "";
  }
  function fillLista(sel, lista, current) { sel.innerHTML = '<option value="">Escolha…</option>' + lista.map(function (e) { return '<option value="' + esc(e.id) + '">' + esc(e.nome) + "</option>"; }).join(""); sel.value = current || ""; }
  function fillEtapa(sel, current) { fillLista(sel, T.cfg().etapas.filter(function (e) { return e.id !== "obra"; }), current); }
  function fillTopico(sel, current) { fillLista(sel, T.cfg().obraTopicos, current); }
  function syncCatUI(p, cat) {
    T.each("#" + p + "-cat .seg-pill", function (b) { b.classList.toggle("is-selected", b.dataset.cat === cat); });
    $(p + "-alvo-label").textContent = cat === "gestao" ? "Área de gestão" : cat === "obra" ? "Obra (projeto)" : "Projeto";
    $(p + "-etapa-wrap").hidden = cat !== "projeto";
    $(p + "-topico-wrap").hidden = cat !== "obra";
  }
  function readCombo(p, cat) {
    var alvo = $(p + "-alvo").value, etapa = $(p + "-etapa").value, top = $(p + "-topico").value;
    if (!alvo) return { erro: cat === "gestao" ? "Escolha a área de gestão." : "Escolha o projeto." };
    if (cat === "projeto" && !etapa) return { erro: "Escolha a etapa do projeto." };
    if (cat === "obra" && !top) return { erro: "Escolha o tópico da obra." };
    return { tipo: cat === "gestao" ? "area" : "projeto", alvoId: alvo, etapaId: cat === "projeto" ? etapa : cat === "obra" ? "obra" : null, topicoId: cat === "obra" ? top : null, descricao: $(p + "-desc").value.trim() };
  }

  // ---------- cronômetro ----------
  function myTimer() { return T.state.pessoaId ? S.timers[T.state.pessoaId] : null; }
  function mesmaAtiv(a, c) {
    return a.tipo === c.tipo && a.alvoId === c.alvoId && (a.etapaId || null) === (c.etapaId || null) && (a.topicoId || null) === (c.topicoId || null) &&
      (a.descricao || "").trim().toLowerCase() === (c.descricao || "").trim().toLowerCase();
  }
  function aparelho() { return { id: T.device.id, nome: T.device.nome, em: new Date().toISOString() }; }

  async function stopTimer(modo) {
    var pid = T.state.pessoaId, t = myTimer(); if (!t || !T.db) return;
    var fim = new Date(), min = (fim - new Date(t.inicio)) / 60000, lancId = null, ativAntes = null;
    delete S.timers[pid]; S.confirm = null; T.scheduleRender();
    try {
      if (min >= 1) {
        lancId = await addLanc({ pessoaId: pid, atividadeId: t.atividadeId || null, tipo: t.tipo, alvoId: t.alvoId, etapaId: t.etapaId || null, topicoId: t.topicoId || null, descricao: t.descricao || "",
          inicio: t.inicio, fim: fim.toISOString(), min: Math.round(min * 10) / 10, origem: "cronometro", motivo: modo, paradoEm: aparelho(), criadoEm: fim.toISOString(), excluido: false, ajustes: [] });
      }
      var itens = T.clone(ativs(pid)), a = t.atividadeId ? T.byId(itens, t.atividadeId) : null;
      if (a) {
        ativAntes = T.clone(a);
        a.status = modo === "concluir" ? "concluida" : "pausada"; a.ultimoUso = fim.toISOString(); a.pausadoEm = aparelho();
        if (modo === "concluir") a.concluidoEm = fim.toISOString();
        await saveAtivs(pid, itens);
      }
      await T.db.doc("timers/" + pid).delete();
      if (modo !== "trocar") {
        T.toast((modo === "concluir" ? "Concluída" : "Pausada") + (min >= 1 ? " · " + fmtH(min) + " salvos" : " · menos de 1 minuto, tempo não salvo"),
          { label: "Desfazer", fn: function () { desfazer(pid, t, lancId, ativAntes); } });
      }
    } catch (e) { T.showError(e); }
  }
  // Volta o cronômetro a correr do horário original, como se a pausa não tivesse acontecido.
  async function desfazer(pid, t, lancId, ativAntes) {
    try {
      if (lancId) await removeLanc(lancId);
      if (ativAntes) { var itens = T.clone(ativs(pid)).filter(function (x) { return x.id !== ativAntes.id; }); ativAntes.status = "andamento"; delete ativAntes.concluidoEm; itens.push(ativAntes); await saveAtivs(pid, itens); }
      S.timers[pid] = t; T.scheduleRender();
      await T.db.doc("timers/" + pid).set(t);
      T.toast("Cronômetro retomado");
    } catch (e) { T.showError(e); }
  }
  async function startAtividade(combo, ativId) {
    if (!T.db || !T.state.pessoaId) return;
    var pid = T.state.pessoaId;
    if (myTimer()) await stopTimer("trocar");
    var itens = T.clone(ativs(pid)), agora = new Date().toISOString(), a = ativId ? T.byId(itens, ativId) : null;
    if (!a) a = itens.filter(function (x) { return x.status !== "concluida" && mesmaAtiv(x, combo); })[0];
    if (!a) { a = { id: T.novoId(), tipo: combo.tipo, alvoId: combo.alvoId, etapaId: combo.etapaId || null, topicoId: combo.topicoId || null, descricao: combo.descricao || "", criadoEm: agora }; itens.push(a); }
    a.status = "andamento"; a.ultimoUso = agora; delete a.concluidoEm;
    var t = { pessoaId: pid, atividadeId: a.id, tipo: a.tipo, alvoId: a.alvoId, etapaId: a.etapaId || null, topicoId: a.topicoId || null, descricao: a.descricao || "", inicio: agora, dispositivo: { id: T.device.id, nome: T.device.nome } };
    S.timers[pid] = t; T.scheduleRender();
    try { await saveAtivs(pid, itens); await T.db.doc("timers/" + pid).set(t); } catch (e) { T.showError(e); }
  }
  async function setAtivStatus(id, status) {
    var pid = T.state.pessoaId, itens = T.clone(ativs(pid)), a = T.byId(itens, id); if (!a) return;
    a.status = status; if (status === "concluida") a.concluidoEm = new Date().toISOString(); else delete a.concluidoEm;
    try { await saveAtivs(pid, itens); T.scheduleRender(); T.toast(status === "concluida" ? "Atividade concluída" : "Atividade reaberta em “Continuar de onde parou”"); } catch (e) { T.showError(e); }
  }
  // Pausar/Concluir: se o cronômetro foi iniciado em outro aparelho, pede confirmação antes.
  function pedirParada(modo) {
    var t = myTimer(); if (!t) return;
    if (t.dispositivo && t.dispositivo.id !== T.device.id) { S.confirm = modo; renderTimer(); return; }
    stopTimer(modo);
  }

  // ---------- HTML ----------
  var catRow = function (id, type) { return '<div class="cat-row" id="' + id + '" role="group" aria-label="Tipo de trabalho">' + ["projeto", "gestao", "obra"].map(function (c) { return '<button type="' + type + '" class="seg-pill" data-cat="' + c + '">' + CAT_LABEL[c] + "</button>"; }).join("") + "</div>"; };
  var html =
    '<div class="card timer-card" id="timer-card">' +
      '<div id="timer-running" class="timer-running" hidden>' +
        '<div class="running-what"><div class="running-where" id="run-where"></div><div class="running-desc" id="run-desc"></div><div class="running-since" id="run-since"></div></div>' +
        '<div class="elapsed" id="run-elapsed">0:00:00</div>' +
        '<div class="ctrl">' +
          '<button type="button" class="btn icon-btn" id="btn-pause" title="Pausar: a atividade fica em “Continuar de onde parou”"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2" width="3.5" height="12" rx="1"/><rect x="9.5" y="2" width="3.5" height="12" rx="1"/></svg>Pausar</button>' +
          '<button type="button" class="btn btn-primary icon-btn" id="btn-done" title="Concluir: a atividade vai para a lista de concluídas"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.2 11.6 2.8 8.2l-1.3 1.3 4.7 4.7 8.3-8.3-1.3-1.3z"/></svg>Concluir</button>' +
        "</div>" +
      "</div>" +
      '<div id="timer-confirm" hidden></div>' +
      catRow("t-cat", "button") +
      '<form id="timer-form" class="grid-form" autocomplete="off">' +
        '<div class="field col-4"><label for="t-alvo" id="t-alvo-label">Projeto</label><select id="t-alvo"></select></div>' +
        '<div class="field col-4" id="t-etapa-wrap"><label for="t-etapa">Etapa</label><select id="t-etapa"></select></div>' +
        '<div class="field col-4" id="t-topico-wrap" hidden><label for="t-topico">Tópico da obra</label><select id="t-topico"></select></div>' +
        '<div class="field col-4"><label for="t-desc">O que está fazendo</label><input id="t-desc" list="desc-list" placeholder="Ex.: Detalhamento banheiro Paula e Bruno"></div>' +
        '<div class="col-12 form-actions"><button class="btn btn-primary" id="btn-start" type="submit">Iniciar cronômetro</button><span class="hint" id="t-hint"></span></div>' +
      "</form>" +
      '<div><div class="hint" style="margin-bottom:8px">Continuar de onde parou</div><div class="chips" id="paused"></div></div>' +
      '<div class="others" id="others" hidden></div>' +
    "</div>" +
    '<div><div class="section-head"><h2 class="section-title">Semana</h2><div class="section-meta" id="week-meta"></div></div><div class="week" id="week"></div></div>' +
    '<div class="info3" id="info3"></div>' +
    "<div>" +
      '<div class="section-head"><h2 class="section-title" id="day-title">Hoje</h2><div class="form-actions"><span class="section-meta" id="day-meta"></span><button class="btn btn-small" id="btn-manual">+ Lançamento manual</button></div></div>' +
      '<div class="panel" id="entry-panel" hidden><h3 class="panel-title" id="entry-panel-title">Lançamento manual</h3>' +
        '<form id="entry-form" class="grid-form" autocomplete="off">' +
          '<div class="col-12">' + catRow("e-cat", "button") + "</div>" +
          '<div class="field col-4"><label for="e-data">Data</label><input type="date" id="e-data" required></div>' +
          '<div class="field col-3 keep"><label for="e-ini">Início</label><input type="time" id="e-ini" required></div>' +
          '<div class="field col-3 keep"><label for="e-fim">Fim</label><input type="time" id="e-fim" required></div>' +
          '<div class="field col-4"><label for="e-alvo" id="e-alvo-label">Projeto</label><select id="e-alvo"></select></div>' +
          '<div class="field col-4" id="e-etapa-wrap"><label for="e-etapa">Etapa</label><select id="e-etapa"></select></div>' +
          '<div class="field col-4" id="e-topico-wrap" hidden><label for="e-topico">Tópico da obra</label><select id="e-topico"></select></div>' +
          '<div class="field col-4"><label for="e-desc">O que foi feito</label><input id="e-desc" list="desc-list"></div>' +
          '<div class="field col-12" id="e-just-wrap" hidden><label for="e-just">Justificativa (semana já fechada)</label><input id="e-just" placeholder="Por que este ajuste está sendo feito?"></div>' +
          '<div class="col-12 form-actions"><button class="btn btn-primary" type="submit">Salvar</button><button class="btn" type="button" id="e-cancel">Cancelar</button><span class="hint" id="e-hint"></span></div>' +
        "</form></div>" +
      '<div class="panel" id="del-panel" hidden><h3 class="panel-title">Excluir lançamento</h3><div class="grid-form">' +
        '<div class="col-12 hint" id="del-info"></div>' +
        '<div class="field col-12" id="del-just-wrap"><label for="del-just">Justificativa (semana já fechada)</label><input id="del-just"></div>' +
        '<div class="col-12 form-actions"><button class="btn btn-stop" id="del-confirm">Excluir</button><button class="btn" id="del-cancel">Cancelar</button><span class="hint warn" id="del-hint"></span></div>' +
      "</div></div>" +
      '<div class="entries" id="entries" style="margin-top:12px"></div>' +
    "</div>" +
    '<div><div class="section-head"><h2 class="section-title">Concluídas</h2><span class="section-meta">Atividades concluídas nos últimos 60 dias</span></div><div class="entries" id="done-acts"></div></div>' +
    '<datalist id="desc-list"></datalist>';

  // ---------- render ----------
  function renderTimer() {
    var t = myTimer();
    $("timer-card").classList.toggle("is-running", !!t);
    $("timer-running").hidden = !t;
    $("btn-start").textContent = t ? "Trocar para esta atividade" : "Iniciar cronômetro";
    if (t) {
      $("run-where").innerHTML = '<span class="dot-live"></span>' + esc(rotulo(t));
      $("run-desc").textContent = t.descricao || "Sem descrição";
      $("run-since").textContent = "Desde " + hm(new Date(t.inicio)) + (t.dispositivo ? " · iniciado em " + t.dispositivo.nome + (t.dispositivo.id === T.device.id ? " (este aparelho)" : "") : "");
      tick();
    }
    var cf = $("timer-confirm");
    cf.hidden = !(t && S.confirm);
    if (t && S.confirm) cf.innerHTML = '<div class="confirm-box"><span>Este cronômetro foi iniciado em <b>' + esc(t.dispositivo.nome) + "</b>. " + (S.confirm === "concluir" ? "Concluir" : "Pausar") + ' daqui mesmo assim?</span><button class="btn btn-small btn-stop" id="cf-sim">Sim</button><button class="btn btn-small" id="cf-nao">Cancelar</button></div>';
    syncCatUI("t", S.cat);
    fillAlvo($("t-alvo"), S.cat, $("t-alvo").value); fillEtapa($("t-etapa"), $("t-etapa").value); fillTopico($("t-topico"), $("t-topico").value);
    var pausadas = ativs(T.state.pessoaId).filter(function (a) { return a.status === "pausada" || (a.status === "andamento" && (!t || t.atividadeId !== a.id)); })
      .sort(function (a, b) { return (b.ultimoUso || "") < (a.ultimoUso || "") ? -1 : 1; });
    $("paused").innerHTML = pausadas.length ? pausadas.map(function (a) {
      var tip = a.pausadoEm ? "Pausada às " + hm(new Date(a.pausadoEm.em)) + " de " + T.fmtData(a.pausadoEm.em) + " em " + a.pausadoEm.nome + ". Clique para retomar." : "Clique para retomar";
      return '<span class="chip" style="padding-right:4px"><button type="button" class="link" style="color:inherit;padding:0" data-resume="' + esc(a.id) + '" title="' + esc(tip) + '"><b>' + esc(rotulo(a)) + "</b>" + (a.descricao ? " <span>· " + esc(a.descricao) + "</span>" : "") + ' <span class="num">· ' + fmtH(minAtiv(a.id)) + '</span></button><button type="button" class="link" data-concluir="' + esc(a.id) + '" title="Concluir sem retomar" aria-label="Concluir">✓</button></span>';
    }).join("") : '<span class="empty">As atividades que você pausar aparecem aqui para retomar com um clique.</span>';
    var outros = Object.keys(S.timers).filter(function (pid) { return pid !== T.state.pessoaId; });
    $("others").hidden = !outros.length;
    $("others").innerHTML = outros.map(function (pid) {
      var o = S.timers[pid], p = T.pessoa(pid);
      return '<div><span class="dot-live"></span><b>' + esc(p ? p.nome : pid) + "</b> está em " + esc(rotulo(o)) + (o.descricao ? " — " + esc(o.descricao) : "") + " desde " + hm(new Date(o.inicio)) + "</div>";
    }).join("");
  }
  function tick() { var t = myTimer(); if (t && T.state.view === "pessoa" && T.state.sub === "tempo") $("run-elapsed").textContent = T.fmtClock(Date.now() - new Date(t.inicio)); }
  setInterval(tick, 1000);

  function renderWeek() {
    var ws = T.weekStart(new Date()), totals = [], total = 0, max = 0;
    var mine = lancAtivos().filter(function (l) { return l.pessoaId === T.state.pessoaId; });
    for (var i = 0; i < 7; i++) {
      var d = T.addDays(ws, i), key = ymd(d), m = 0;
      mine.forEach(function (l) { if (ymd(new Date(l.inicio)) === key) m += l.min; });
      totals.push({ d: d, key: key, m: m }); total += m; if (m > max) max = m;
    }
    var scale = Math.max(max, 480), nomes = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    $("week").innerHTML = totals.map(function (t, i) {
      return '<button class="day' + (t.key === S.dia ? " is-selected" : "") + '" data-d="' + t.key + '" title="' + fmtH(t.m) + " em " + t.d.toLocaleDateString("pt-BR") + '">' +
        '<span class="day-name">' + nomes[i] + '</span><span class="day-date">' + T.pad(t.d.getDate()) + "/" + T.pad(t.d.getMonth() + 1) + "</span>" +
        '<span class="day-hours">' + (t.m ? fmtH(t.m) : "—") + '</span><span class="day-bar"><i style="width:' + Math.min(100, t.m / scale * 100) + '%"></i></span></button>';
    }).join("");
    var dias = totals.filter(function (t) { return t.m > 0; }).length;
    $("week-meta").innerHTML = 'Total <b class="num">' + fmtH(total) + "</b>" + (dias ? ' · média <b class="num">' + fmtH(total / dias) + "</b> por dia trabalhado" : "");
  }
  function renderInfo3() {
    var s = statsMes(T.state.pessoaId), mes = T.mesAtual(), A = ativs(T.state.pessoaId), nomeMes = T.MESES[new Date().getMonth()];
    var andamento = A.filter(function (a) { return a.status !== "concluida"; }).length;
    var concl = A.filter(function (a) { return a.status === "concluida" && a.concluidoEm && ymd(new Date(a.concluidoEm)).slice(0, 7) === mes; }).length;
    $("info3").innerHTML =
      '<div class="card tile"><small>Horas em ' + nomeMes + "</small><b>" + fmtH(s.min) + "</b><span>" + (s.dias ? "média " + fmtH(s.min / s.dias) + " em " + s.dias + (s.dias === 1 ? " dia" : " dias") : "nenhum dia lançado ainda") + "</span></div>" +
      '<div class="card tile"><small>Em andamento</small><b>' + andamento + "</b><span>" + (andamento === 1 ? "atividade aberta" : "atividades abertas") + "</span></div>" +
      '<div class="card tile"><small>Concluídas em ' + nomeMes + "</small><b>" + concl + "</b><span>" + (concl === 1 ? "atividade finalizada" : "atividades finalizadas") + "</span></div>";
  }
  function renderDay() {
    var hoje = ymd(new Date()) === S.dia;
    $("day-title").textContent = hoje ? "Hoje" : T.fmtDia(T.parseYmd(S.dia));
    var list = lancAtivos().filter(function (l) { return l.pessoaId === T.state.pessoaId && ymd(new Date(l.inicio)) === S.dia; }).sort(function (a, b) { return a.inicio < b.inicio ? -1 : 1; });
    var tot = list.reduce(function (s, l) { return s + l.min; }, 0);
    $("day-meta").innerHTML = list.length ? '<b class="num">' + fmtH(tot) + "</b> em " + list.length + (list.length === 1 ? " lançamento" : " lançamentos") : "";
    $("entries").innerHTML = list.length ? list.map(function (l) {
      var flags = [], c = catDe(l);
      if (c !== "projeto") flags.push('<span class="pill">' + CAT_LABEL[c] + "</span>");
      if (l.origem === "manual") flags.push('<span class="pill">Manual</span>');
      if (l.ajustes && l.ajustes.length) flags.push('<span class="pill danger" title="' + esc(l.ajustes.map(function (a) { return T.fmtData(a.em) + ": " + a.motivo; }).join("\n")) + '">Ajustado</span>');
      if (isLocked(l.inicio)) flags.push('<span class="pill">Semana fechada</span>');
      if (l.paradoEm) flags.push('<span class="pill" title="' + esc((l.motivo === "concluir" ? "Concluído" : l.motivo === "trocar" ? "Trocado de atividade" : "Pausado") + " em " + l.paradoEm.nome) + '">' + esc(l.paradoEm.nome) + "</span>");
      return '<div class="entry"><div class="entry-time">' + hm(new Date(l.inicio)) + "–" + hm(new Date(l.fim)) + "<small>" + fmtH(l.min) + "</small></div>" +
        '<div class="entry-main"><div class="entry-where">' + esc(rotulo(l)) + "</div>" + (l.descricao ? '<div class="entry-desc">' + esc(l.descricao) + "</div>" : "") +
        (flags.length ? '<div class="entry-flags">' + flags.join("") + "</div>" : "") + "</div>" +
        '<div class="entry-actions"><button class="link" data-edit="' + l.id + '">Editar</button><button class="link danger" data-del="' + l.id + '">Excluir</button></div></div>';
    }).join("") : '<div class="empty">Nenhum lançamento neste dia.</div>';
  }
  function renderDoneActs() {
    var list = ativs(T.state.pessoaId).filter(function (a) { return a.status === "concluida"; }).sort(function (a, b) { return (b.concluidoEm || "") < (a.concluidoEm || "") ? -1 : 1; });
    $("done-acts").innerHTML = list.length ? list.map(function (a) {
      return '<div class="entry"><div class="entry-time">' + fmtH(minAtiv(a.id)) + "<small>" + T.fmtData(a.concluidoEm) + '</small></div><div class="entry-main"><div class="entry-where">' + esc(rotulo(a)) + "</div>" + (a.descricao ? '<div class="entry-desc">' + esc(a.descricao) + "</div>" : "") +
        '</div><div class="entry-actions"><button class="link" data-reabrir="' + esc(a.id) + '">Reabrir</button></div></div>';
    }).join("") : '<div class="empty">Quando você concluir uma atividade no cronômetro, ela aparece aqui.</div>';
  }
  function renderDatalist() {
    var seen = {}, opts = [];
    lancAtivos().slice().sort(function (a, b) { return b.inicio < a.inicio ? -1 : 1; }).forEach(function (l) {
      var d = (l.descricao || "").trim(); if (d && !seen[d.toLowerCase()] && opts.length < 60) { seen[d.toLowerCase()] = 1; opts.push(d); }
    });
    $("desc-list").innerHTML = opts.map(function (d) { return '<option value="' + esc(d) + '">'; }).join("");
  }

  // ---------- lançamento manual ----------
  function syncJust() {
    var need = false, d = $("e-data").value;
    if (d && T.parseYmd(d) < T.weekStart(new Date())) need = true;
    if (S.editEntryId) { var l = T.byId(S.lanc, S.editEntryId); if (l && isLocked(l.inicio)) need = true; }
    $("e-just-wrap").hidden = !need; return need;
  }
  function openEntry(l) {
    S.editEntryId = l ? l.id : null;
    $("entry-panel-title").textContent = l ? "Editar lançamento" : "Lançamento manual";
    S.eCat = l ? catDe(l) : S.cat; syncCatUI("e", S.eCat);
    $("e-data").value = l ? ymd(new Date(l.inicio)) : S.dia;
    $("e-ini").value = l ? hm(new Date(l.inicio)) : ""; $("e-fim").value = l ? hm(new Date(l.fim)) : "";
    fillAlvo($("e-alvo"), S.eCat, l ? l.alvoId : ""); fillEtapa($("e-etapa"), l && l.etapaId !== "obra" ? l.etapaId : ""); fillTopico($("e-topico"), l ? l.topicoId : "");
    $("e-desc").value = l ? l.descricao || "" : ""; $("e-just").value = ""; $("e-hint").textContent = "";
    syncJust(); $("del-panel").hidden = true; $("entry-panel").hidden = false; $("e-data").focus();
  }

  // ---------- eventos ----------
  function init() {
    $("t-cat").addEventListener("click", function (e) {
      var b = e.target.closest("[data-cat]"); if (!b) return; S.cat = b.dataset.cat; T.ls("tempo.cat", S.cat);
      syncCatUI("t", S.cat); fillAlvo($("t-alvo"), S.cat, ""); fillEtapa($("t-etapa"), ""); fillTopico($("t-topico"), "");
    });
    $("e-cat").addEventListener("click", function (e) {
      var b = e.target.closest("[data-cat]"); if (!b) return; S.eCat = b.dataset.cat;
      syncCatUI("e", S.eCat); fillAlvo($("e-alvo"), S.eCat, ""); fillEtapa($("e-etapa"), ""); fillTopico($("e-topico"), "");
    });
    $("timer-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var c = readCombo("t", S.cat);
      if (c.erro) { $("t-hint").textContent = c.erro; return; }
      $("t-hint").textContent = ""; $("t-desc").value = ""; $("btn-start").blur();
      startAtividade(c, null);
    });
    // blur(): o botão não fica com o foco, então um Enter ou espaço depois não pausa sem querer
    $("btn-pause").addEventListener("click", function () { this.blur(); pedirParada("pausar"); });
    $("btn-done").addEventListener("click", function () { this.blur(); pedirParada("concluir"); });
    $("timer-confirm").addEventListener("click", function (e) {
      if (e.target.id === "cf-sim") { var m = S.confirm; S.confirm = null; stopTimer(m); }
      if (e.target.id === "cf-nao") { S.confirm = null; renderTimer(); }
    });
    $("paused").addEventListener("click", function (e) {
      var c = e.target.closest("[data-concluir]"); if (c) { c.blur(); setAtivStatus(c.dataset.concluir, "concluida"); return; }
      var r = e.target.closest("[data-resume]"); if (r) { r.blur(); startAtividade(null, r.dataset.resume); }
    });
    $("done-acts").addEventListener("click", function (e) { var b = e.target.closest("[data-reabrir]"); if (b) setAtivStatus(b.dataset.reabrir, "pausada"); });
    $("week").addEventListener("click", function (e) { var b = e.target.closest("[data-d]"); if (!b) return; S.dia = b.dataset.d; renderWeek(); renderDay(); });

    $("e-data").addEventListener("change", syncJust);
    $("btn-manual").addEventListener("click", function () { openEntry(null); });
    $("e-cancel").addEventListener("click", function () { $("entry-panel").hidden = true; });
    $("entry-form").addEventListener("submit", async function (e) {
      e.preventDefault();
      var c = readCombo("e", S.eCat);
      if (c.erro) { $("e-hint").textContent = c.erro; return; }
      var d = $("e-data").value, a = $("e-ini").value, b = $("e-fim").value;
      if (!d || !a || !b) { $("e-hint").textContent = "Preencha data, início e fim."; return; }
      var ini = new Date(d + "T" + a), fim = new Date(d + "T" + b);
      if (fim <= ini) fim = T.addDays(fim, 1); // passou da meia-noite
      var min = Math.round((fim - ini) / 6000) / 10;
      if (min > 16 * 60) { $("e-hint").textContent = "Confira os horários: mais de 16 horas num lançamento."; return; }
      var need = syncJust(), just = $("e-just").value.trim();
      if (need && just.length < 5) { $("e-hint").textContent = "Escreva a justificativa para ajustar uma semana fechada."; return; }
      var agora = new Date().toISOString(), pid = T.state.pessoaId;
      var body = { pessoaId: pid, tipo: c.tipo, alvoId: c.alvoId, etapaId: c.etapaId, topicoId: c.topicoId, descricao: c.descricao, inicio: ini.toISOString(), fim: fim.toISOString(), min: min };
      try {
        if (S.editEntryId) {
          var old = T.byId(S.lanc, S.editEntryId), ajustes = (old.ajustes || []).slice();
          if (need) ajustes.push({ em: agora, por: pid, acao: "edicao", motivo: just, antes: { inicio: old.inicio, fim: old.fim, alvoId: old.alvoId, etapaId: old.etapaId, topicoId: old.topicoId || null, descricao: old.descricao } });
          body.pessoaId = old.pessoaId; body.ajustes = ajustes; body.editadoEm = agora;
          await updateLanc(S.editEntryId, body); T.toast("Lançamento atualizado");
        } else {
          body.origem = "manual"; body.criadoEm = agora; body.excluido = false; body.atividadeId = null;
          body.ajustes = need ? [{ em: agora, por: pid, acao: "inclusao", motivo: just }] : [];
          await addLanc(body); T.toast("Lançamento salvo: " + fmtH(min));
        }
        $("entry-panel").hidden = true; S.dia = ymd(ini); T.scheduleRender();
      } catch (err) { T.showError(err); }
    });
    $("entries").addEventListener("click", function (e) {
      var ed = e.target.closest("[data-edit]"), dl = e.target.closest("[data-del]");
      if (ed) openEntry(T.byId(S.lanc, ed.dataset.edit));
      if (dl) {
        var l = T.byId(S.lanc, dl.dataset.del); S.delEntryId = l.id;
        $("del-info").textContent = hm(new Date(l.inicio)) + "–" + hm(new Date(l.fim)) + " · " + rotulo(l) + (l.descricao ? " · " + l.descricao : "");
        $("del-just-wrap").hidden = !isLocked(l.inicio); $("del-just").value = ""; $("del-hint").textContent = "";
        $("entry-panel").hidden = true; $("del-panel").hidden = false;
      }
    });
    $("del-cancel").addEventListener("click", function () { $("del-panel").hidden = true; });
    $("del-confirm").addEventListener("click", async function () {
      var l = T.byId(S.lanc, S.delEntryId); if (!l) return;
      var locked = isLocked(l.inicio), just = $("del-just").value.trim();
      if (locked && just.length < 5) { $("del-hint").textContent = "Escreva a justificativa."; return; }
      try {
        if (locked) { var aj = (l.ajustes || []).slice(); aj.push({ em: new Date().toISOString(), por: T.state.pessoaId, acao: "exclusao", motivo: just }); await updateLanc(l.id, { excluido: true, ajustes: aj }); }
        else await removeLanc(l.id);
        $("del-panel").hidden = true; T.toast("Lançamento excluído");
      } catch (err) { T.showError(err); }
    });
  }

  T.register({
    id: "tempo", label: "Tempo", area: "pessoa", html: html, init: init,
    connect: function (db) {
      db.collection("lancamentos").onSnapshot(function (s) { S.lancDocs = T.arrDocs(s); flattenLanc(); T.loaded("lanc", s); T.scheduleRender(); }, T.onErr);
      db.collection("atividades").onSnapshot(function (s) { S.ativDocs = T.arrDocs(s); T.scheduleRender(); }, T.onErr);
      db.collection("timers").onSnapshot(function (s) { var t = {}; T.snapList(s).forEach(function (x) { t[x.id] = x; }); S.timers = t; T.scheduleRender(); }, T.onErr);
    },
    render: function () { renderTimer(); renderWeek(); renderInfo3(); renderDay(); renderDoneActs(); renderDatalist(); },
    homeState: function (pid) {
      var t = S.timers[pid];
      return t ? '<div class="tile-state live"><span class="dot-live"></span>' + esc(rotulo(t)) + " desde " + hm(new Date(t.inicio)) + "</div>" : '<div class="tile-state">Cronômetro parado</div>';
    },
    homeStats: function (pid) { return [{ label: "Horas em " + T.MESES[new Date().getMonth()].slice(0, 3), value: fmtH(statsMes(pid).min) }]; }
  });
})();
