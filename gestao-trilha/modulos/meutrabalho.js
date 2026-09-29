/* Módulo Meu trabalho (área da pessoa, aba "Projetos") — itens do Plano de Projeto atribuídos à pessoa,
 * vistos por projeto ou por prioridade, com cronômetro (iniciar, pausar, concluir) direto no item.
 * Lê e grava pelo Trilha.gestor (dados em gp/<projetoId>). As tarefas de projeto ficam na aba Tarefas. */
(function () {
  "use strict";
  var T = window.Trilha, $ = T.$, esc = T.esc;
  var S = { modo: T.ls("mt.modo") || "projeto", verProntas: false };

  function itensDa(pid) {
    var out = [];
    if (!T.gestor) return out;
    T.state.projetos.forEach(function (p) {
      var g = T.gestor.gp(p.id); if (!g || !T.gestor.ativo(g)) return;
      var cod = T.gestor.codigos(g);
      (g.itens || []).forEach(function (x) {
        if (x.resp !== pid || (!S.verProntas && T.gestor.feito(x))) return;
        out.push({ p: p, g: g, x: x, cod: cod[x.id] });
      });
    });
    return out;
  }
  function ordemItem(a, b) { return String(a.x.prazo || "9999").localeCompare(String(b.x.prazo || "9999")) || String(a.cod || "").localeCompare(String(b.cod || ""), "pt", { numeric: true }); }
  function linha(o, timer, mostrarProjeto) {
    var x = o.x, et = T.gestor.etapas[x.etapa] || {}, rodando = timer && timer.pranchaId === x.id, hoje = T.ymd(new Date()), atras = x.prazo && x.prazo < hoje && !T.gestor.feito(x);
    var chave = esc(o.p.id) + "|" + x.id;
    var tempo = T.tempo && T.tempo.iniciar && (et.tempo || []).length ? (rodando ? '<button class="btn btn-small btn-stop" data-pausar="1">❚❚ Pausar</button><button class="btn btn-small" data-concluir="' + chave + '">✓ Concluir</button>' : '<button class="btn btn-small btn-primary" data-play="' + chave + '">▶ Iniciar</button>') : "";
    return '<div class="it-row mt-row' + (x.prio ? " prio-" + x.prio : "") + (rodando ? " is-live" : "") + '">' +
      '<span class="it-cod num">' + esc(o.cod || "·") + "</span>" +
      '<span class="it-tit static"><span class="it-nome">' + (x.prio ? '<span class="prio-tag p' + x.prio + '">P' + x.prio + "</span> " : "") + esc(x.titulo) + '</span><em class="pr-et">' + esc(et.curto || et.nome || "") + (mostrarProjeto ? " · " + esc(o.p.codigo || o.p.nome) : "") + "</em>" + T.gestor.desenhosProg(x) + "</span>" +
      '<span class="it-ctl">' + (x.prazo ? '<span class="it-date static' + (atras ? " late" : "") + '">' + T.fmtYmd(x.prazo).slice(0, 5) + "</span>" : '<span class="it-date static empty">sem prazo</span>') +
      '<select class="sit-sel s-' + x.sit + '" data-msit="' + chave + '" aria-label="Situação">' + T.optHtml(T.gestor.SIT, x.sit) + "</select>" +
      '<span class="mt-timer">' + tempo + "</span></span></div>";
  }
  function render() {
    var pid = T.state.pessoaId, lista = itensDa(pid), timer = T.tempo && T.tempo.timers()[pid], html = "";
    T.each("#mt-modo [data-modo]", function (b) { b.classList.toggle("is-selected", b.dataset.modo === S.modo); });
    if (S.modo === "prioridade") {
      html = [[1, "P1 · mais urgente"], [2, "P2 · intermediária"], [3, "P3 · menos urgente"], [0, "Sem prioridade"]].map(function (n) {
        var its = lista.filter(function (o) { return (o.x.prio || 0) === n[0]; }).sort(ordemItem);
        return its.length ? '<div class="card gp-box"><div class="section-head"><h3 class="panel-title" style="margin:0">' + (n[0] ? '<span class="prio-tag p' + n[0] + '">P' + n[0] + "</span>" : "") + esc(n[1]) + '</h3><span class="section-meta">' + its.length + "</span></div>" + its.map(function (o) { return linha(o, timer, true); }).join("") + "</div>" : "";
      }).join("");
    } else {
      var porProj = {};
      lista.forEach(function (o) { (porProj[o.p.id] = porProj[o.p.id] || []).push(o); });
      html = Object.keys(porProj).map(function (k) {
        var its = porProj[k].sort(function (a, b) { return (a.x.prio || 9) - (b.x.prio || 9) || ordemItem(a, b); }), p = its[0].p;
        return '<div class="card gp-box"><div class="section-head"><div><h3 class="panel-title" style="margin:0">' + esc(p.nome) + '</h3><div class="section-meta">' + esc(p.codigo || "") + " · " + esc(T.gestor.etapaNome(p.id)) + '</div></div><button class="link" data-abrir="' + esc(p.id) + '">Abrir projeto</button></div>' + its.map(function (o) { return linha(o, timer, false); }).join("") + "</div>";
      }).join("");
    }
    $("mt-body").innerHTML = html || '<div class="empty">Nada atribuído a você nos projetos em andamento. Os itens aparecem aqui quando você é escolhido como responsável no Plano de Projeto.</div>';
    $("mt-prontas").checked = S.verProntas;
  }
  var html = '<div class="section-head"><h2 class="section-title">Meu trabalho nos projetos</h2><div class="form-actions"><div class="segmented" id="mt-modo"><button class="seg-pill" data-modo="projeto">Por projeto</button><button class="seg-pill" data-modo="prioridade">Por prioridade</button></div><label class="gp-check"><input type="checkbox" id="mt-prontas"> Mostrar prontos</label></div></div>' +
    '<p class="hint" style="margin:0 0 12px">As tarefas de projeto ficam na aba Tarefas, com o selo do projeto.</p><div id="mt-body" class="mt-body"></div>';
  function init() {
    $("mt-prontas").addEventListener("change", function () { S.verProntas = this.checked; render(); });
    $("mt-modo").addEventListener("click", function (e) { var b = e.target.closest("[data-modo]"); if (!b) return; S.modo = b.dataset.modo; T.ls("mt.modo", S.modo); render(); });
    $("view-meutrabalho").addEventListener("click", function (e) {
      var b;
      if ((b = e.target.closest("[data-abrir]"))) { T.gestor.abrir(b.dataset.abrir); return; }
      if (e.target.closest("[data-pausar]")) { T.tempo.parar("pausar"); return; }
      if ((b = e.target.closest("[data-concluir]"))) {
        var c2 = b.dataset.concluir.split("|"); T.tempo.parar("concluir");
        T.gestor.mudarItem(c2[0], c2[1], function (x) { if (!T.gestor.feito(x)) x.sit = "revisao"; });
        return;
      }
      if ((b = e.target.closest("[data-play]"))) {
        var c = b.dataset.play.split("|"), g = T.gestor.gp(c[0]), x = T.byId(g.itens || [], c[1]), cod = T.gestor.codigos(g)[x.id];
        T.tempo.iniciar({ tipo: "projeto", alvoId: c[0], etapaId: (T.gestor.etapas[x.etapa].tempo || [])[0] || null, topicoId: null, descricao: (cod ? cod + " · " : "") + x.titulo, pranchaId: x.id });
        if (x.sit === "a_fazer") T.gestor.mudarItem(c[0], x.id, function (it) { it.sit = "andamento"; });
        T.toast("Cronômetro iniciado", { label: "Ver no Tempo", fn: function () { T.go("pessoa", "tempo"); } });
      }
    });
    $("view-meutrabalho").addEventListener("change", function (e) {
      var t = e.target; if (!t.dataset.msit) return; var a = t.dataset.msit.split("|");
      T.gestor.mudarItem(a[0], a[1], function (x) { x.sit = t.value; if (T.gestor.feito(x)) (x.desenhos || []).forEach(function (d) { d.feito = true; }); });
    });
  }
  T.register({ id: "meutrabalho", label: "Projetos", area: "pessoa", html: html, init: init, render: render });
})();
