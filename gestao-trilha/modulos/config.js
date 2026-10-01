/* Módulo Configurações — pessoas, custos do escritório e listas (etapas, gestão, tópicos de obra, tipos).
 * Dados: pessoas/<id>, config/escritorio. Todo "Salvar" mostra "Salvando…" → "Salvo ✓" ao lado do botão. */
(function () {
  "use strict";
  var T = window.Trilha, $ = T.$, esc = T.esc;
  var LISTAS = [
    { k: "etapas", t: "Etapas de projeto", add: "+ Etapa" },
    { k: "areas", t: "Gestão (áreas internas)", add: "+ Área" },
    { k: "obraTopicos", t: "Tópicos de obra", add: "+ Tópico" },
    { k: "tipos", t: "Tipos de projeto", add: "+ Tipo" }
  ];

  var PESOS_ARQ = [["ep", "Estudo Preliminar"], ["ap", "Anteprojeto"], ["pl", "Projeto Legal"], ["pe", "Projeto Executivo"]];
  var PESOS_MARC = [["mep", "Estudo Preliminar"], ["mex", "Executivo"]];
  var PRAZOS = [["Projeto arquitetônico", [["ep", "Estudo Preliminar"], ["ap", "Anteprojeto"], ["pe", "Projeto Executivo"]]],
    ["Projeto de marcenaria", [["mep", "Estudo Preliminar"], ["mex", "Executivo"]]],
    ["Projeto Legal (condomínio e prefeitura)", [["plDev", "Desenvolver e protocolar"], ["plExig", "Atender cada exigência"]]]];
  function prazosAtuais() { return Object.assign({}, T.DEFAULT_CONFIG.prazosPadrao, T.cfg().prazosPadrao || {}); }
  function campoPeso(o) { return '<div class="field col-3"><label for="pw-' + o[0] + '">' + o[1] + ' (%)</label><input type="number" min="0" max="100" step="1" id="pw-' + o[0] + '" data-peso="' + o[0] + '"></div>'; }
  function pesosAtuais() { return Object.assign({}, T.DEFAULT_CONFIG.pesosEtapas, T.cfg().pesosEtapas || {}); }
  function somaPesos() {
    function soma(l) { return l.reduce(function (s, o) { return s + (T.numOrNull($("pw-" + o[0]).value) || 0); }, 0); }
    var a = soma(PESOS_ARQ), m = soma(PESOS_MARC);
    $("cfg-pesos-soma").textContent = "Arquitetônico soma " + a + "% · marcenaria soma " + m + "%" + (a !== 100 || m !== 100 ? " (o app ajusta a proporção para 100%)" : "");
  }

  var html =
    '<div><div class="section-head"><h2 class="section-title">Pessoas</h2><span class="section-meta">Valores usados nos custos e no fechamento</span></div>' +
      '<div class="card" style="display:flex;flex-direction:column;gap:14px"><div id="cfg-people" style="display:flex;flex-direction:column;gap:14px"></div>' +
      '<div class="form-actions"><button class="btn btn-small" id="btn-add-person">+ Adicionar pessoa</button></div>' +
      '<div class="hint">Custo-hora: quanto a hora da pessoa custa ao escritório (salário, pró-labore, encargos). Valor-hora de pagamento: usado no fechamento mensal. Os dois podem ficar vazios por enquanto.</div></div></div>' +
    '<div><div class="section-head"><h2 class="section-title">Escritório</h2><span class="section-meta" id="cfg-office-meta"></span></div>' +
      '<div class="card grid-form">' +
        '<div class="field col-4"><label for="c-fixos">Custos fixos mensais (R$)</label><input type="number" id="c-fixos" min="0" step="0.01" inputmode="decimal" placeholder="Aluguel, softwares, contador…"></div>' +
        '<div class="field col-4"><label for="c-horas">Horas produtivas por pessoa / mês</label><input type="number" id="c-horas" min="1" step="1" placeholder="112"></div>' +
        '<div class="col-4 form-actions"><button class="btn btn-primary" id="btn-save-office">Salvar</button></div>' +
        '<div class="col-12 hint">Referência de mercado: de 160 h disponíveis, cerca de 70% (112 h) são produtivas. O custo fixo é dividido pelas horas produtivas e somado ao custo-hora de cada pessoa.</div>' +
      "</div></div>" +
    '<div><div class="section-head"><h2 class="section-title">Peso das etapas</h2><span class="section-meta">% concluído dos projetos no Gestor</span></div>' +
      '<div class="card grid-form" id="cfg-pesos">' +
        '<div class="col-12 cfg-pesos-t">Projeto arquitetônico</div>' + PESOS_ARQ.map(campoPeso).join("") +
        '<div class="col-12 cfg-pesos-t">Projeto de marcenaria</div>' + PESOS_MARC.map(campoPeso).join("") +
        '<div class="col-12 form-actions"><button class="btn btn-primary" id="btn-save-pesos">Salvar pesos</button><span class="hint" id="cfg-pesos-soma"></span></div>' +
        '<div class="col-12 hint">A Abertura não conta. Etapa encerrada vale o peso inteiro; etapa em curso vale a parte dos itens prontos. Quando o projeto não tem uma etapa (Reforma e Interiores não têm Anteprojeto nem Legal), os pesos das outras são redistribuídos na mesma proporção. Ajuste quando houver horas reais registradas.</div>' +
      "</div></div>" +
    '<div><div class="section-head"><h2 class="section-title">Prazos padrão</h2><span class="section-meta">Dias úteis · valem para os projetos novos</span></div>' +
      '<div class="card grid-form" id="cfg-prazos">' + PRAZOS.map(function (gr) { return '<div class="col-12 cfg-pesos-t">' + gr[0] + "</div>" + gr[1].map(function (o) { return '<div class="field col-3"><label for="pz-' + o[0] + '">' + o[1] + ' (d.u.)</label><input type="number" min="1" step="1" id="pz-' + o[0] + '" data-pz="' + o[0] + '"></div>'; }).join(""); }).join("") +
        '<div class="col-12 form-actions"><button class="btn btn-primary" id="btn-save-prazos">Salvar prazos</button></div>' +
        '<div class="col-12 hint">Cada projeto guarda os prazos que tinha ao ser criado (ou ao ativar a marcenaria); mudar aqui não altera projetos em andamento. Para mudar o prazo de um projeto: Gestor › projeto › Configurações. Aviso de prazo: 10 d.u. antes do fim; no Projeto Legal, 5 d.u.</div>' +
      "</div></div>" +
    '<div class="grid-form" style="gap:28px">' + LISTAS.map(function (l) {
      return '<div class="col-6"><div class="section-head"><h2 class="section-title">' + l.t + '</h2></div><div class="card"><div class="list-edit" id="cfg-' + l.k + '"></div>' +
        '<div class="form-actions" style="margin-top:10px"><button class="btn btn-small" data-add="' + l.k + '">' + l.add + '</button><button class="btn btn-small btn-primary" data-save="' + l.k + '">Salvar</button><span class="save-state" id="st-' + l.k + '"></span></div></div></div>';
    }).join("") + "</div>";

  function listRow(it) { return '<div class="list-edit-row field" data-id="' + esc(it.id || "") + '"><input aria-label="Nome" value="' + esc(it.nome) + '"><button type="button" class="link danger" data-rm="1">Remover</button></div>'; }
  function marcarAlterado(box) {
    box.dataset.dirty = "1";
    var st = $("st-" + box.id.slice(4)); if (st) { st.className = "save-state dirty"; st.textContent = "Alterações não salvas"; }
  }
  function render() {
    var fmtBRL = T.fmtBRL;
    if (!$("cfg-people").contains(document.activeElement)) $("cfg-people").innerHTML = T.state.pessoas.map(function (p) {
      var ct = T.custoHoraTotal(p.id), i = esc(p.id);
      return '<div class="person-row" data-pid="' + i + '">' +
        '<div class="field"><label for="pn-' + i + '">Nome</label><input id="pn-' + i + '" data-k="nome" value="' + esc(p.nome) + '"></div>' +
        '<div class="field"><label for="pp-' + i + '">Perfil</label><select id="pp-' + i + '" data-k="perfil"><option value="socio"' + (p.perfil !== "colaborador" ? " selected" : "") + '>Sócio(a)</option><option value="colaborador"' + (p.perfil === "colaborador" ? " selected" : "") + ">Colaborador(a)</option></select></div>" +
        '<div class="field"><label for="pc-' + i + '">Custo-hora (R$)</label><input id="pc-' + i + '" data-k="custoHora" type="number" min="0" step="0.01" value="' + (p.custoHora != null ? p.custoHora : "") + '"></div>' +
        '<div class="field"><label for="pvh-' + i + '">Valor-hora pagamento (R$)</label><input id="pvh-' + i + '" data-k="valorHora" type="number" min="0" step="0.01" value="' + (p.valorHora != null ? p.valorHora : "") + '"></div>' +
        '<div class="form-actions"><button class="btn btn-small btn-primary" data-savep="' + i + '">Salvar</button></div>' +
        '<div class="hint" style="grid-column:1/-1">' + (ct != null ? "Custo-hora total com rateio: <b>" + fmtBRL(ct) + "</b>" : "Sem custo-hora definido") + "</div></div>";
    }).join("");
    var c = T.cfg(), r = T.rateioHora();
    if (document.activeElement !== $("c-fixos")) $("c-fixos").value = c.custosFixosMensais != null ? c.custosFixosMensais : "";
    if (document.activeElement !== $("c-horas")) $("c-horas").value = c.horasProdutivasMes || "";
    $("cfg-office-meta").innerHTML = r != null ? "Rateio dos custos fixos: <b>" + fmtBRL(r) + "</b> por hora" : "Preencha para calcular o custo fixo por hora";
    var pw = pesosAtuais();
    if (!$("cfg-pesos").contains(document.activeElement) && $("cfg-pesos").dataset.dirty !== "1") { T.each("[data-peso]", function (i) { i.value = pw[i.dataset.peso] != null ? pw[i.dataset.peso] : ""; }); somaPesos(); }
    var pzs = prazosAtuais();
    if (!$("cfg-prazos").contains(document.activeElement) && $("cfg-prazos").dataset.dirty !== "1") T.each("[data-pz]", function (i) { i.value = pzs[i.dataset.pz] != null ? pzs[i.dataset.pz] : ""; });
    LISTAS.forEach(function (l) { var box = $("cfg-" + l.k); if (box.dataset.dirty !== "1") box.innerHTML = (c[l.k] || []).map(listRow).join(""); });
  }
  function init() {
    var view = $("view-config");
    view.addEventListener("input", function (e) { var le = e.target.closest(".list-edit"); if (le) marcarAlterado(le); if (e.target.dataset.peso) { $("cfg-pesos").dataset.dirty = "1"; somaPesos(); } if (e.target.dataset.pz) $("cfg-prazos").dataset.dirty = "1"; });
    view.addEventListener("click", async function (e) {
      var t = e.target.closest("button"); if (!t) return;
      if (t.dataset.rm) { var le = t.closest(".list-edit"); t.closest(".list-edit-row").remove(); marcarAlterado(le); return; }
      if (t.dataset.add) { var box = $("cfg-" + t.dataset.add); box.insertAdjacentHTML("beforeend", listRow({ id: "", nome: "" })); marcarAlterado(box); box.lastElementChild.querySelector("input").focus(); return; }
      if (t.dataset.save) {
        var k = t.dataset.save, box2 = $("cfg-" + k), used = {};
        var items = Array.prototype.map.call(box2.querySelectorAll(".list-edit-row"), function (row) {
          var nome = row.querySelector("input").value.trim(); if (!nome) return null;
          var id = row.dataset.id || T.slug(nome); while (used[id]) id += "-2"; used[id] = 1;
          row.dataset.id = id; return { id: id, nome: nome };
        }).filter(Boolean);
        var ok = await T.saveWith(t, async function () {
          if (!items.length) throw new Error("Mantenha ao menos um item");
          var patch = {}; patch[k] = items; await T.saveConfig(patch);
        });
        if (ok) { box2.dataset.dirty = ""; }
        return;
      }
      if (t.dataset.savep) {
        var body = {};
        T.each("[data-k]", function (i) { body[i.dataset.k] = i.dataset.k === "nome" || i.dataset.k === "perfil" ? i.value.trim() : T.numOrNull(i.value); }, t.closest("[data-pid]"));
        if (!body.nome) return;
        await T.saveWith(t, function () { return T.db.doc("pessoas/" + t.dataset.savep).update(body); });
        return;
      }
      if (t.id === "btn-add-person") {
        await T.saveWith(t, function () { return T.db.doc("pessoas/pessoa-" + Date.now().toString(36)).set({ nome: "Nova pessoa", perfil: "colaborador", custoHora: null, valorHora: null, ativo: true, ordem: T.state.pessoas.length + 1 }); });
        return;
      }
      if (t.id === "btn-save-prazos") {
        var pz = {}, at = prazosAtuais(), mud = [], falta = false;
        T.each("[data-pz]", function (i) { var v = T.numOrNull(i.value); if (!v || v < 1) falta = true; pz[i.dataset.pz] = Math.round(v || 0); if (pz[i.dataset.pz] !== at[i.dataset.pz]) mud.push(({ ep: "Estudo Preliminar", ap: "Anteprojeto", pe: "Projeto Executivo", mep: "EP da marcenaria", mex: "Executivo da marcenaria", plDev: "Legal · desenvolver e protocolar", plExig: "Legal · atender exigência" })[i.dataset.pz] + ": " + at[i.dataset.pz] + " → " + pz[i.dataset.pz] + " d.u."); });
        if (falta) { T.toast("Preencha todos os prazos com 1 dia útil ou mais."); return; }
        if (!mud.length) { T.toast("Nada mudou."); return; }
        if (!(await T.confirmar({ titulo: "Mudar os prazos padrão?", texto: '<ul class="cf-list">' + mud.map(function (m) { return "<li>" + T.esc(m) + "</li>"; }).join("") + "</ul>Valem para os projetos novos.", ok: "Salvar prazos" }))) return;
        var okz = await T.saveWith(t, function () { return T.saveConfig({ prazosPadrao: pz }); });
        if (okz) $("cfg-prazos").dataset.dirty = "";
        return;
      }
      if (t.id === "btn-save-pesos") {
        var pw = {}; T.each("[data-peso]", function (i) { pw[i.dataset.peso] = Math.max(0, T.numOrNull(i.value) || 0); });
        var okp = await T.saveWith(t, function () { return T.saveConfig({ pesosEtapas: pw }); });
        if (okp) $("cfg-pesos").dataset.dirty = "";
        return;
      }
      if (t.id === "btn-save-office") {
        await T.saveWith(t, function () { return T.saveConfig({ custosFixosMensais: T.numOrNull($("c-fixos").value), horasProdutivasMes: T.numOrNull($("c-horas").value) || 112 }); });
      }
    });
  }

  T.register({
    id: "config", label: "Configurações", area: "admin", html: html, init: init, render: render,
    icon: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    desc: function () { return "Pessoas, custos e listas"; }
  });
})();
