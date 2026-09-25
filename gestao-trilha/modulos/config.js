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
    LISTAS.forEach(function (l) { var box = $("cfg-" + l.k); if (box.dataset.dirty !== "1") box.innerHTML = (c[l.k] || []).map(listRow).join(""); });
  }
  function init() {
    var view = $("view-config");
    view.addEventListener("input", function (e) { var le = e.target.closest(".list-edit"); if (le) marcarAlterado(le); });
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
