/* Módulo Projetos — cadastro de projetos (dado comum do núcleo: projetos/<id>) e painel de horas/custos.
 * O futuro Gestor de Projetos vai ampliar este módulo. */
(function () {
  "use strict";
  var T = window.Trilha, $ = T.$, esc = T.esc;
  var S = { filtro: "ativo", editId: null };

  var html =
    "<div>" +
      '<div class="section-head"><h2 class="section-title">Projetos</h2><div class="form-actions">' +
        '<div class="segmented" id="proj-filter"><button class="seg-pill is-selected" data-f="ativo">Ativos</button><button class="seg-pill" data-f="pausado">Pausados</button><button class="seg-pill" data-f="concluido">Concluídos</button></div>' +
        '<button class="btn btn-small btn-primary" id="btn-new-proj">+ Novo projeto</button></div></div>' +
      '<div class="panel" id="proj-panel" hidden style="margin-bottom:14px"><h3 class="panel-title" id="proj-panel-title">Novo projeto</h3>' +
        '<form id="proj-form" class="grid-form" autocomplete="off">' +
          '<div class="field col-6"><label for="p-nome">Nome do projeto</label><input id="p-nome" required placeholder="Ex.: Residência Gustavo"></div>' +
          '<div class="field col-6"><label for="p-cliente">Cliente</label><input id="p-cliente"></div>' +
          '<div class="field col-3 keep"><label for="p-tipo">Tipo</label><select id="p-tipo"></select></div>' +
          '<div class="field col-3 keep"><label for="p-area">Área (m²)</label><input id="p-area" type="number" min="0" step="0.01" inputmode="decimal"></div>' +
          '<div class="field col-3 keep"><label for="p-hon">Honorário (R$)</label><input id="p-hon" type="number" min="0" step="0.01" inputmode="decimal"></div>' +
          '<div class="field col-3 keep"><label for="p-status">Situação</label><select id="p-status"><option value="ativo">Ativo</option><option value="pausado">Pausado</option><option value="concluido">Concluído</option></select></div>' +
          '<div class="col-12"><div class="hint" style="text-transform:uppercase;letter-spacing:.6px;font-size:11.5px">Horas previstas por etapa (opcional)</div></div>' +
          '<div class="col-12 grid-form" id="p-prev" style="gap:10px"></div>' +
          '<div class="col-12 form-actions"><button class="btn btn-primary" type="submit" id="p-save">Salvar projeto</button><button class="btn" type="button" id="p-cancel">Cancelar</button></div>' +
        "</form></div>" +
      '<div class="projects" id="projects"></div>' +
    "</div>";

  function stats(pid) {
    var s = { min: 0, custo: 0, custoOk: true, porEtapa: {} };
    if (!T.tempo) return s;
    T.tempo.lancAtivos().forEach(function (l) {
      if (l.tipo !== "projeto" || l.alvoId !== pid) return;
      s.min += l.min; var c = T.tempo.custoLanc(l); if (c == null) s.custoOk = false; else s.custo += c;
      s.porEtapa[l.etapaId] = (s.porEtapa[l.etapaId] || 0) + l.min;
    });
    return s;
  }
  function render() {
    var fmtNum = T.fmtNum, fmtBRL = T.fmtBRL;
    var list = T.state.projetos.filter(function (p) { return (p.status || "ativo") === S.filtro; }).sort(function (a, b) { return a.nome.localeCompare(b.nome); });
    $("projects").innerHTML = list.length ? list.map(function (p) {
      var s = stats(p.id), h = s.min / 60, prev = p.horasPrevistas || {};
      var custo = s.min ? (s.custoOk ? fmtBRL(s.custo) : "—") : fmtBRL(0);
      var margem = p.honorario != null && s.custoOk ? fmtBRL(p.honorario - s.custo) : "—";
      var meters = T.cfg().etapas.map(function (e) {
        var real = (s.porEtapa[e.id] || 0) / 60, pv = prev[e.id];
        if (!real && !pv) return "";
        var pct = pv ? real / pv * 100 : 100, cls = pv ? (pct > 100 ? " over" : pct >= 80 ? " near" : "") : "";
        return '<div class="meter-row" title="' + esc(e.nome) + ": " + fmtNum(real) + " h" + (pv ? " de " + fmtNum(pv) + " h previstas" : "") + '"><span class="m-label">' + esc(e.nome) + '</span><span class="meter' + cls + '"><i style="width:' + Math.min(100, pct) + '%"></i></span><span class="m-val">' + fmtNum(real) + (pv ? " / " + fmtNum(pv) : "") + " h</span></div>";
      }).join("");
      var sub = [p.cliente, T.tipoNome(p.tipo), p.area ? fmtNum(p.area) + " m²" : ""].filter(Boolean).join(" · ");
      return '<div class="card project"><div class="project-top"><div><div class="project-name">' + esc(p.nome) + '</div><div class="project-sub">' + esc(sub || "Sem detalhes") + '</div></div><button class="link" data-editp="' + p.id + '">Editar</button></div>' +
        '<div class="kv"><div><small>Horas</small><b>' + T.fmtH(s.min) + "</b></div><div><small>Custo</small><b>" + custo + "</b></div><div><small>" + (p.area ? "Horas/m²" : "Margem") + "</small><b>" + (p.area ? fmtNum(h / p.area, 2) : margem) + "</b></div></div>" +
        (p.area && p.honorario != null ? '<div class="kv"><div><small>Honorário</small><b>' + fmtBRL(p.honorario) + "</b></div><div><small>Margem</small><b>" + margem + "</b></div><div><small>Custo/m²</small><b>" + (s.custoOk && s.min ? fmtBRL(s.custo / p.area) : "—") + "</b></div></div>" : "") +
        (meters ? '<div class="meters">' + meters + "</div>" : '<div class="empty">Sem horas lançadas ainda.</div>') + "</div>";
    }).join("") : '<div class="empty">Nenhum projeto nesta situação. Use “+ Novo projeto” para cadastrar.</div>';
  }
  function openProj(p) {
    S.editId = p ? p.id : null;
    $("proj-panel-title").textContent = p ? "Editar projeto" : "Novo projeto";
    $("p-nome").value = p ? p.nome : ""; $("p-cliente").value = p ? p.cliente || "" : "";
    $("p-tipo").innerHTML = T.cfg().tipos.map(function (t) { return '<option value="' + esc(t.id) + '">' + esc(t.nome) + "</option>"; }).join("");
    $("p-tipo").value = p && p.tipo ? p.tipo : T.cfg().tipos[0].id;
    $("p-area").value = p && p.area != null ? p.area : ""; $("p-hon").value = p && p.honorario != null ? p.honorario : "";
    $("p-status").value = p ? p.status || "ativo" : "ativo";
    var prev = p && p.horasPrevistas || {};
    $("p-prev").innerHTML = T.cfg().etapas.map(function (e) {
      return '<div class="field col-4"><label for="pv-' + esc(e.id) + '">' + esc(e.nome) + ' (h)</label><input type="number" min="0" step="0.5" id="pv-' + esc(e.id) + '" data-etapa="' + esc(e.id) + '" value="' + (prev[e.id] != null ? prev[e.id] : "") + '"></div>';
    }).join("");
    $("proj-panel").hidden = false; $("p-nome").focus();
  }
  function init() {
    $("proj-filter").addEventListener("click", function (e) {
      var b = e.target.closest("[data-f]"); if (!b) return; S.filtro = b.dataset.f;
      Array.prototype.forEach.call(this.children, function (c) { c.classList.toggle("is-selected", c === b); });
      render();
    });
    $("btn-new-proj").addEventListener("click", function () { openProj(null); });
    $("p-cancel").addEventListener("click", function () { $("proj-panel").hidden = true; });
    $("projects").addEventListener("click", function (e) { var b = e.target.closest("[data-editp]"); if (b) openProj(T.projeto(b.dataset.editp)); });
    $("proj-form").addEventListener("submit", async function (e) {
      e.preventDefault();
      var prev = {};
      T.each("input", function (i) { var v = T.numOrNull(i.value); if (v != null) prev[i.dataset.etapa] = v; }, $("p-prev"));
      var body = { nome: $("p-nome").value.trim(), cliente: $("p-cliente").value.trim(), tipo: $("p-tipo").value, area: T.numOrNull($("p-area").value), honorario: T.numOrNull($("p-hon").value), status: $("p-status").value, horasPrevistas: prev };
      if (!body.nome) return;
      var ok = await T.saveWith($("p-save"), async function () {
        if (S.editId) await T.db.doc("projetos/" + S.editId).update(body);
        else { body.criadoEm = new Date().toISOString(); await T.db.collection("projetos").add(body); }
      });
      if (ok) setTimeout(function () { $("proj-panel").hidden = true; }, 600);
    });
  }

  T.register({
    id: "projetos", label: "Projetos", area: "admin", html: html, init: init, render: render,
    icon: '<path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-7h6v7"/>',
    desc: function () { var n = T.state.projetos.filter(function (p) { return (p.status || "ativo") === "ativo"; }).length; return n + (n === 1 ? " projeto ativo" : " projetos ativos"); }
  });
})();
