/* Módulo Relatórios — relatórios de tempo e fechamento mensal (automático, com aviso na capa).
 * Dados: fechamentos/<pessoa>_<AAAA-MM>. Lê os lançamentos via Trilha.tempo. */
(function () {
  "use strict";
  var T = window.Trilha, $ = T.$, esc = T.esc, ymd = T.ymd, fmtH = T.fmtH;
  var S = { fech: {}, sel: null, running: false };

  var html =
    '<div class="card grid-form">' +
      '<div class="field col-4"><label for="r-periodo">Período</label><select id="r-periodo"><option value="semana">Esta semana</option><option value="mes" selected>Este mês</option><option value="mesant">Mês anterior</option><option value="ano">Este ano</option><option value="custom">Personalizado</option></select></div>' +
      '<div class="field col-3 keep" id="r-de-wrap" hidden><label for="r-de">De</label><input type="date" id="r-de"></div>' +
      '<div class="field col-3 keep" id="r-ate-wrap" hidden><label for="r-ate">Até</label><input type="date" id="r-ate"></div>' +
      '<div class="field col-4"><label for="r-pessoa">Pessoa</label><select id="r-pessoa"></select></div>' +
      '<div class="col-12 form-actions"><span class="hint" id="r-range"></span><button class="btn btn-small" id="btn-csv">Exportar lançamentos (CSV)</button></div>' +
    "</div>" +
    '<div class="tiles" id="r-tiles"></div>' +
    sec("Por pessoa", "", "r-pessoas") + sec("Por projeto", "", "r-projetos") + sec("Por etapa", "Soma de todos os projetos no período", "r-etapas") +
    sec("Obra", "Horas por tópico de obra", "r-obra") + sec("Gestão", "Áreas internas, tempo não faturável", "r-areas") + sec("Por atividade", "Descrições mais frequentes", "r-ativ") +
    "<div>" +
      '<div class="section-head"><h2 class="section-title">Fechamento mensal</h2><div class="form-actions">' +
        '<select id="f-pessoa" class="btn btn-small" aria-label="Pessoa do fechamento"></select>' +
        '<input type="month" id="f-mes" class="btn btn-small" aria-label="Mês do fechamento">' +
        '<button class="btn btn-small" id="btn-fech-csv">Exportar (CSV)</button></div></div>' +
      '<div id="f-status" class="hint" style="margin-bottom:10px"></div><div id="r-fech"></div>' +
    "</div>";
  function sec(t, meta, id) { return '<div><div class="section-head"><h2 class="section-title">' + t + "</h2>" + (meta ? '<span class="section-meta">' + meta + "</span>" : "") + '</div><div id="' + id + '"></div></div>'; }

  function L0() { return T.tempo ? T.tempo.lancAtivos() : []; }
  function periodo() {
    var v = $("r-periodo").value, hoje = new Date(), de, ate;
    if (v === "semana") { de = T.weekStart(hoje); ate = T.addDays(de, 6); }
    else if (v === "mes") { de = new Date(hoje.getFullYear(), hoje.getMonth(), 1); ate = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0); }
    else if (v === "mesant") { de = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1); ate = new Date(hoje.getFullYear(), hoje.getMonth(), 0); }
    else if (v === "ano") { de = new Date(hoje.getFullYear(), 0, 1); ate = new Date(hoje.getFullYear(), 11, 31); }
    else { de = $("r-de").value ? T.parseYmd($("r-de").value) : new Date(hoje.getFullYear(), hoje.getMonth(), 1); ate = $("r-ate").value ? T.parseYmd($("r-ate").value) : hoje; }
    return { de: ymd(de), ate: ymd(ate) };
  }
  function filtrados() {
    var p = periodo(), pid = $("r-pessoa").value;
    return L0().filter(function (l) { var d = ymd(new Date(l.inicio)); return d >= p.de && d <= p.ate && (!pid || l.pessoaId === pid); });
  }
  function group(list, keyFn) {
    var m = {};
    list.forEach(function (l) { var k = keyFn(l); if (k == null) return; var g = m[k] || (m[k] = { key: k, min: 0, custo: 0, custoOk: true, n: 0, dias: {} }); g.min += l.min; g.n++; g.dias[ymd(new Date(l.inicio))] = 1; var c = T.tempo.custoLanc(l); if (c == null) g.custoOk = false; else g.custo += c; });
    return Object.keys(m).map(function (k) { return m[k]; }).sort(function (a, b) { return b.min - a.min; });
  }
  function barTable(rows, cols, total) {
    if (!rows.length) return '<div class="empty">Sem lançamentos no período.</div>';
    var max = rows[0].min || 1;
    var h = '<div class="table-wrap"><table><thead><tr>' + cols.map(function (c) { return "<th" + (c.r ? ' class="r"' : "") + ">" + c.t + "</th>"; }).join("") + "</tr></thead><tbody>";
    rows.forEach(function (r) {
      h += "<tr>" + cols.map(function (c) {
        if (c.bar) return '<td class="barcell"><div class="hbar" title="' + fmtH(r.min) + '"><i style="width:' + (r.min / max * 100) + '%"></i></div></td>';
        return "<td" + (c.r ? ' class="r"' : c.name ? ' class="name"' : "") + ">" + c.f(r) + "</td>";
      }).join("") + "</tr>";
    });
    if (total) h += '<tr class="total">' + cols.map(function (c) { return "<td" + (c.r ? ' class="r"' : "") + ">" + (c.tot ? c.tot() : "") + "</td>"; }).join("") + "</tr>";
    return h + "</tbody></table></div>";
  }
  var BAR = { t: "", bar: 1 };
  function H() { return { t: "Horas", r: 1, f: function (r) { return fmtH(r.min); } }; }
  function render() {
    var sel = $("r-pessoa"), cur = sel.value;
    sel.innerHTML = '<option value="">Todas</option>' + T.state.pessoas.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.nome) + "</option>"; }).join("");
    sel.value = cur;
    var p = periodo(); $("r-range").textContent = T.parseYmd(p.de).toLocaleDateString("pt-BR") + " a " + T.parseYmd(p.ate).toLocaleDateString("pt-BR");
    var L = filtrados(), totMin = L.reduce(function (s, l) { return s + l.min; }, 0);
    var projMin = L.filter(function (l) { return l.tipo === "projeto"; }).reduce(function (s, l) { return s + l.min; }, 0);
    var custoOk = L.every(function (l) { return T.tempo.custoLanc(l) != null; }), custo = L.reduce(function (s, l) { return s + (T.tempo.custoLanc(l) || 0); }, 0);
    var nProj = {}; L.forEach(function (l) { if (l.tipo === "projeto") nProj[l.alvoId] = 1; });
    $("r-tiles").innerHTML =
      '<div class="card tile"><small>Horas no período</small><b>' + fmtH(totMin) + "</b><span>" + L.length + " lançamentos</span></div>" +
      '<div class="card tile"><small>Projetos e obras</small><b>' + (totMin ? Math.round(projMin / totMin * 100) : 0) + "%</b><span>" + fmtH(projMin) + " faturáveis</span></div>" +
      '<div class="card tile"><small>Projetos com horas</small><b>' + Object.keys(nProj).length + "</b><span>no período</span></div>" +
      '<div class="card tile"><small>Custo das horas</small><b>' + (L.length && !custoOk ? "—" : T.fmtBRL(custo)) + "</b><span>" + (L.length && !custoOk ? "Preencha o custo-hora em Configurações" : "com rateio dos custos fixos") + "</span></div>";
    $("r-pessoas").innerHTML = barTable(group(L, function (l) { return l.pessoaId; }), [
      { t: "Pessoa", name: 1, f: function (r) { var x = T.pessoa(r.key); return esc(x ? x.nome : r.key); } }, H(),
      { t: "Dias", r: 1, f: function (r) { return Object.keys(r.dias).length; } },
      { t: "Média/dia", r: 1, f: function (r) { return fmtH(r.min / Object.keys(r.dias).length); } },
      { t: "Faturável", r: 1, f: function (r) { var pm = L.filter(function (l) { return l.pessoaId === r.key && l.tipo === "projeto"; }).reduce(function (s, l) { return s + l.min; }, 0); return Math.round(pm / r.min * 100) + "%"; } },
      { t: "A pagar", r: 1, f: function (r) { var x = T.pessoa(r.key); return x && x.valorHora != null ? T.fmtBRL(x.valorHora * r.min / 60) : "—"; } }, BAR
    ]);
    $("r-projetos").innerHTML = barTable(group(L, function (l) { return l.tipo === "projeto" ? l.alvoId : null; }), [
      { t: "Projeto", name: 1, f: function (r) { var x = T.projeto(r.key); return esc(x ? x.nome : "Projeto removido"); } },
      { t: "Horas", r: 1, f: function (r) { return fmtH(r.min); }, tot: function () { return fmtH(projMin); } },
      { t: "Custo", r: 1, f: function (r) { return r.custoOk ? T.fmtBRL(r.custo) : "—"; } },
      { t: "Horas/m²", r: 1, f: function (r) { var x = T.projeto(r.key); return x && x.area ? T.fmtNum(r.min / 60 / x.area, 2) : "—"; } }, BAR
    ], true);
    $("r-etapas").innerHTML = barTable(group(L, function (l) { return l.tipo === "projeto" ? l.etapaId : null; }), [
      { t: "Etapa", name: 1, f: function (r) { return esc(T.etapaNome(r.key)); } }, H(),
      { t: "% em projetos", r: 1, f: function (r) { return projMin ? Math.round(r.min / projMin * 100) + "%" : "—"; } },
      { t: "Custo", r: 1, f: function (r) { return r.custoOk ? T.fmtBRL(r.custo) : "—"; } }, BAR
    ]);
    $("r-obra").innerHTML = barTable(group(L, function (l) { return l.etapaId === "obra" ? (l.topicoId || "sem") : null; }), [
      { t: "Tópico", name: 1, f: function (r) { return esc(r.key === "sem" ? "Sem tópico" : T.topicoNome(r.key)); } }, H(),
      { t: "Custo", r: 1, f: function (r) { return r.custoOk ? T.fmtBRL(r.custo) : "—"; } }, BAR
    ]);
    $("r-areas").innerHTML = barTable(group(L, function (l) { return l.tipo === "area" ? l.alvoId : null; }), [
      { t: "Área", name: 1, f: function (r) { return esc(T.areaNome(r.key)); } }, H(),
      { t: "% do total", r: 1, f: function (r) { return totMin ? Math.round(r.min / totMin * 100) + "%" : "—"; } }, BAR
    ]);
    var nomeAtiv = {}; L.forEach(function (l) { if (l.descricao) nomeAtiv[l.descricao.trim().toLowerCase()] = l.descricao.trim(); });
    $("r-ativ").innerHTML = barTable(group(L, function (l) { return l.descricao ? l.descricao.trim().toLowerCase() : null; }).slice(0, 15), [
      { t: "Atividade", name: 1, f: function (r) { return esc(nomeAtiv[r.key]); } }, H(),
      { t: "Vezes", r: 1, f: function (r) { return r.n; } }, BAR
    ]);
    renderFechamento();
  }

  // ---------- fechamento mensal ----------
  function calcFechamento(pid, mes) {
    var y = +mes.slice(0, 4), m = +mes.slice(5, 7) - 1, fimMes = new Date(y, m + 1, 0).getDate(), rows = [], tot = 0;
    var L = L0().filter(function (l) { return l.pessoaId === pid && T.tempo.doMes(l, mes); });
    for (var d = 1; d <= fimMes; d++) {
      var dt = new Date(y, m, d), key = ymd(dt);
      var dl = L.filter(function (l) { return ymd(new Date(l.inicio)) === key; }).sort(function (a, b) { return a.inicio < b.inicio ? -1 : 1; });
      if (!dl.length) continue;
      var min = dl.reduce(function (s, l) { return s + l.min; }, 0); tot += min;
      var ultimo = dl.reduce(function (mx, l) { return l.fim > mx ? l.fim : mx; }, dl[0].fim);
      rows.push({ dt: dt, entrada: T.hm(new Date(dl[0].inicio)), saida: T.hm(new Date(ultimo)), min: min, n: dl.length, ajustado: dl.some(function (l) { return l.ajustes && l.ajustes.length; }) });
    }
    var p = T.pessoa(pid), vh = p && p.valorHora != null ? p.valorHora : null;
    return { pessoaId: pid, mes: mes, rows: rows, min: Math.round(tot * 10) / 10, dias: rows.length, mediaMin: rows.length ? Math.round(tot / rows.length) : 0, valorHora: vh, valor: vh != null ? Math.round(vh * tot / 60 * 100) / 100 : null };
  }
  function fechBody(F) { return { pessoaId: F.pessoaId, mes: F.mes, min: F.min, dias: F.dias, mediaMin: F.mediaMin, valorHora: F.valorHora, valor: F.valor }; }
  // No primeiro acesso de cada mês, grava o fechamento do mês anterior de cada pessoa (só depois que os dados chegaram do servidor).
  async function ensureFechamentos() {
    var L = T.state.loaded;
    if (S.running || !T.db || !L.lanc || !L.fech || !L.pessoas) return;
    S.running = true;
    var mes = T.mesAnterior();
    try {
      var ps = T.pessoasAtivas();
      for (var i = 0; i < ps.length; i++) {
        var id = ps[i].id + "_" + mes; if (S.fech[id]) continue;
        var F = calcFechamento(ps[i].id, mes); if (!F.dias) continue;
        var body = fechBody(F); body.geradoEm = new Date().toISOString(); body.conferido = false;
        S.fech[id] = Object.assign({ id: id }, body);
        await T.db.doc("fechamentos/" + id).set(body);
      }
    } catch (e) { /* tenta de novo na próxima atualização */ }
    S.running = false; T.scheduleRender();
  }
  async function conferir(id) { try { await T.db.doc("fechamentos/" + id).update({ conferido: true, conferidoEm: new Date().toISOString() }); T.toast("Fechamento marcado como conferido"); } catch (e) { T.showError(e); } }
  function renderFechamento() {
    var fp = $("f-pessoa");
    if (S.sel) { fp.dataset.v = S.sel.pid; $("f-mes").value = S.sel.mes; S.sel = null; }
    var cur = fp.dataset.v || fp.value || T.state.pessoaId || (T.state.pessoas[0] && T.state.pessoas[0].id);
    fp.innerHTML = T.state.pessoas.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.nome) + "</option>"; }).join("");
    fp.value = cur; fp.dataset.v = "";
    if (!$("f-mes").value) $("f-mes").value = T.mesAtual();
    if (!fp.value) { $("r-fech").innerHTML = ""; return; }
    var F = calcFechamento(fp.value, $("f-mes").value), snap = S.fech[fp.value + "_" + F.mes], st = "";
    if (snap) {
      st = "Fechamento gerado automaticamente em " + T.fmtData(snap.geradoEm) + (snap.conferido ? " · conferido em " + T.fmtData(snap.conferidoEm) : ' · <button class="link" data-conferir-r="' + esc(snap.id) + '">Marcar como conferido</button>');
      if (Math.abs(snap.min - F.min) > 0.05 || snap.valorHora !== F.valorHora) st += ' · <span style="color:var(--danger)">houve alterações depois do fechamento</span> <button class="link" data-atualizar="' + esc(snap.id) + '">Atualizar fechamento</button>';
    } else if (F.mes >= T.mesAtual()) st = "Mês em andamento: o fechamento é gerado automaticamente no início do próximo mês.";
    $("f-status").innerHTML = st;
    var vh = F.valorHora;
    var h = '<div class="table-wrap"><table><thead><tr><th>Data</th><th>Dia</th><th class="r">Entrada</th><th class="r">Saída</th><th class="r">Lançamentos</th><th class="r">Horas</th><th></th></tr></thead><tbody>';
    F.rows.forEach(function (r) {
      h += "<tr><td>" + r.dt.toLocaleDateString("pt-BR") + "</td><td>" + r.dt.toLocaleDateString("pt-BR", { weekday: "short" }) + '</td><td class="r">' + r.entrada + '</td><td class="r">' + r.saida + '</td><td class="r">' + r.n + '</td><td class="r">' + fmtH(r.min) + "</td><td>" + (r.ajustado ? '<span class="pill danger">Ajustado</span>' : "") + "</td></tr>";
    });
    h += '<tr class="total"><td colspan="5">Total · ' + F.dias + (F.dias === 1 ? " dia" : " dias") + " · média " + fmtH(F.mediaMin) + " por dia" + (vh != null ? " · valor-hora " + T.fmtBRL(vh) : "") + '</td><td class="r">' + fmtH(F.min) + "</td><td>" + (vh != null ? T.fmtBRL(F.valor) : "") + "</td></tr>";
    $("r-fech").innerHTML = F.rows.length ? h + "</tbody></table></div>" + (vh == null ? '<div class="hint" style="margin-top:8px">Preencha o valor-hora de pagamento em Configurações para calcular o valor a pagar.</div>' : "") : '<div class="empty">Sem lançamentos neste mês.</div>';
  }

  // ---------- exportação ----------
  function csvCell(v) { v = v == null ? "" : String(v); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function dec(n) { return n.toFixed(2).replace(".", ","); }
  async function saveCsv(name, rows) {
    if (!T.downloads) { T.toast("Exportação indisponível nesta visualização."); return; }
    var text = "﻿" + rows.map(function (r) { return r.map(csvCell).join(";"); }).join("\n");
    try { await T.downloads.save({ filename: name, data: text }); } catch (e) { if (e && e.code !== "declined") T.toast("Não foi possível exportar."); }
  }

  function init() {
    ["r-periodo", "r-de", "r-ate", "r-pessoa"].forEach(function (id) {
      $(id).addEventListener("change", function () { var c = $("r-periodo").value === "custom"; $("r-de-wrap").hidden = !c; $("r-ate-wrap").hidden = !c; render(); });
    });
    $("f-pessoa").addEventListener("change", renderFechamento);
    $("f-mes").addEventListener("change", renderFechamento);
    $("f-status").addEventListener("click", async function (e) {
      var c = e.target.closest("[data-conferir-r]"); if (c) { conferir(c.dataset.conferirR); return; }
      var a = e.target.closest("[data-atualizar]"); if (!a) return;
      var f = S.fech[a.dataset.atualizar], body = fechBody(calcFechamento(f.pessoaId, f.mes));
      body.atualizadoEm = new Date().toISOString(); body.conferido = false;
      try { await T.db.doc("fechamentos/" + f.id).update(body); T.toast("Fechamento atualizado"); } catch (err) { T.showError(err); }
    });
    $("btn-csv").addEventListener("click", function () {
      var p = periodo(), rows = [["Data", "Início", "Fim", "Horas", "Pessoa", "Tipo", "Projeto/Área", "Etapa", "Tópico de obra", "Descrição", "Origem", "Custo (R$)", "Ajustes"]];
      filtrados().sort(function (a, b) { return a.inicio < b.inicio ? -1 : 1; }).forEach(function (l) {
        var ini = new Date(l.inicio), c = T.tempo.custoLanc(l), x = T.pessoa(l.pessoaId);
        rows.push([ini.toLocaleDateString("pt-BR"), T.hm(ini), T.hm(new Date(l.fim)), dec(l.min / 60), x ? x.nome : l.pessoaId, T.tempo.CAT_LABEL[T.tempo.catDe(l)], T.tempo.alvoNome(l), T.etapaNome(l.etapaId), T.topicoNome(l.topicoId), l.descricao, l.origem, c == null ? "" : dec(c), (l.ajustes || []).map(function (a) { return a.motivo; }).join(" | ")]);
      });
      saveCsv("lancamentos_" + p.de + "_a_" + p.ate + ".csv", rows);
    });
    $("btn-fech-csv").addEventListener("click", function () {
      var F = calcFechamento($("f-pessoa").value, $("f-mes").value), p = T.pessoa(F.pessoaId), rows = [["Data", "Dia", "Entrada", "Saída", "Lançamentos", "Horas"]];
      F.rows.forEach(function (r) { rows.push([r.dt.toLocaleDateString("pt-BR"), r.dt.toLocaleDateString("pt-BR", { weekday: "short" }), r.entrada, r.saida, r.n, dec(r.min / 60)]); });
      rows.push(["Total", F.dias + " dias", "", "", "", dec(F.min / 60)]);
      rows.push(["Média por dia", "", "", "", "", dec(F.mediaMin / 60)]);
      if (F.valor != null) rows.push(["Valor a pagar (R$)", "", "", "", "", dec(F.valor)]);
      saveCsv("fechamento_" + T.slug(p ? p.nome : "pessoa") + "_" + F.mes + ".csv", rows);
    });
    if (!T.downloads) { /* verificado de novo depois da conexão */ }
  }

  // Leitura para outros módulos (Financeiro): fechamentos gravados e cálculo do mês.
  T.relatorios = { fechamentos: function () { return S.fech; }, calcFechamento: calcFechamento };

  T.register({
    id: "relatorios", label: "Relatórios", area: "admin", html: html, init: init, render: render,
    icon: '<path d="M4 20h16"/><path d="M7 16V10"/><path d="M12 16V5"/><path d="M17 16v-3"/>',
    desc: function () { return "Horas, custos e fechamentos"; },
    connect: function (db) {
      db.collection("fechamentos").onSnapshot(function (s) { var m = {}; T.snapList(s).forEach(function (f) { m[f.id] = f; }); S.fech = m; T.loaded("fech", s); T.scheduleRender(); }, T.onErr);
    },
    onLoaded: function () { ensureFechamentos(); },
    notes: function () {
      return Object.keys(S.fech).map(function (k) { return S.fech[k]; }).filter(function (f) { return !f.conferido; }).sort(function (a, b) { return a.mes < b.mes ? -1 : 1; }).map(function (f) {
        var p = T.pessoa(f.pessoaId);
        return '<div class="note"><div><div class="note-title">Fechamento de ' + esc(T.mesNome(f.mes)) + " · " + esc(p ? p.nome : f.pessoaId) + '</div><div class="note-body"><b>' + fmtH(f.min) + "</b> em " + f.dias + (f.dias === 1 ? " dia" : " dias") + " · média <b>" + fmtH(f.mediaMin) + "</b> por dia · a pagar <b>" + (f.valor != null ? T.fmtBRL(f.valor) : "defina o valor-hora") + '</b></div></div><div class="form-actions"><button class="btn btn-small" data-verfech="' + esc(f.id) + '">Ver detalhes</button><button class="btn btn-small btn-primary" data-conferir="' + esc(f.id) + '">Conferido</button></div></div>';
      });
    },
    onHomeClick: function (e) {
      var v = e.target.closest("[data-verfech]"); if (v) { var f = S.fech[v.dataset.verfech]; S.sel = { pid: f.pessoaId, mes: f.mes }; T.go("admin", "relatorios"); return; }
      var c = e.target.closest("[data-conferir]"); if (c) conferir(c.dataset.conferir);
    }
  });
})();
