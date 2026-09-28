/* Módulo Meu trabalho (área da pessoa) — pranchas e tarefas de projeto atribuídas à pessoa, em todos os projetos,
 * com botão para iniciar o cronômetro já na prancha. Lê e grava pelo Trilha.gestor (dados em gp/<projetoId>). */
(function () {
  "use strict";
  var T = window.Trilha, $ = T.$, esc = T.esc;
  var S = { verProntas: false };

  function itensDa(pid) {
    var out = [];
    if (!T.gestor) return out;
    T.state.projetos.forEach(function (p) {
      var g = T.gestor.gp(p.id); if (!g || g.etapa === "encerrado") return;
      var pr = T.gestor.ordenarPranchas(g.pranchas || []), ids = T.gestor.idsPranchas(pr);
      var minhas = pr.filter(function (x) { return x.resp === pid && (S.verProntas || (x.sit !== "pronto" && x.sit !== "entregue")); });
      var tarefas = (g.tarefas || []).filter(function (t) { return t.resp === pid && !t.feita; });
      if (minhas.length || tarefas.length) out.push({ p: p, g: g, pr: minhas, ids: ids, tf: tarefas });
    });
    return out;
  }
  function render() {
    var pid = T.state.pessoaId, grupos = itensDa(pid), hoje = T.ymd(new Date()), timer = T.tempo && T.tempo.timers()[pid];
    var html = grupos.map(function (x) {
      var et = T.gestor.etapas[x.g.etapa] || {};
      return '<div class="card gp-box"><div class="section-head"><div><h3 class="panel-title" style="margin:0">' + esc(x.p.nome) + '</h3><div class="section-meta">' + esc(x.p.codigo || "") + " · " + esc(T.gestor.etapaNome(x.p.id)) + '</div></div><button class="link" data-abrir="' + esc(x.p.id) + '">Abrir projeto</button></div>' +
        x.pr.map(function (r) {
          var rodando = timer && timer.pranchaId === r.id;
          var podeTempo = !!(T.tempo && T.tempo.iniciar && T.gestor.etapas[r.etapa] && T.gestor.etapas[r.etapa].tempo);
          return '<div class="pr-row mt-row"><span class="pr-id num">' + x.ids[r.id] + '</span><span class="pr-tit">' + esc(r.titulo) + ' <em class="pr-et">' + (r.etapa === "ap" ? "AP" : "PE") + "</em></span>" +
            '<button class="sit-btn s-' + r.sit + '" data-msit="' + esc(x.p.id) + "|" + r.id + '">' + esc(T.gestor.sitNome(r.sit)) + "</button>" +
            (podeTempo ? '<button class="btn btn-small' + (rodando ? "" : " btn-primary") + '" data-play="' + esc(x.p.id) + "|" + r.id + '"' + (rodando ? " disabled" : "") + ">" + (rodando ? "● Em andamento" : "▶ Iniciar") + "</button>" : "") + "</div>";
        }).join("") +
        x.tf.map(function (t) {
          var atras = t.prazo && t.prazo < hoje;
          return '<div class="pr-row mt-row"><input type="checkbox" class="task-check" data-mtf="' + esc(x.p.id) + "|" + t.id + '" aria-label="Concluir tarefa"><span class="pr-tit">' + esc(t.txt) + "</span>" + (t.prazo ? '<span class="badge static' + (atras ? " is-overdue" : "") + '">' + T.fmtYmd(t.prazo) + "</span>" : "") + "</div>";
        }).join("") + "</div>";
    }).join("");
    $("mt-body").innerHTML = html || '<div class="empty">Nada atribuído a você nos projetos em andamento. As pranchas e tarefas aparecem aqui quando alguém escolhe você como responsável no Gestor de Projetos.</div>';
    $("mt-prontas").checked = S.verProntas;
  }
  var html = '<div class="section-head"><h2 class="section-title">Meu trabalho nos projetos</h2><label class="gp-check"><input type="checkbox" id="mt-prontas"> Mostrar pranchas prontas</label></div><div id="mt-body" class="mt-body"></div>';
  function init() {
    $("mt-prontas").addEventListener("change", function () { S.verProntas = this.checked; render(); });
    $("view-meutrabalho").addEventListener("click", function (e) {
      var b;
      if ((b = e.target.closest("[data-abrir]"))) { T.gestor.abrir(b.dataset.abrir); return; }
      if ((b = e.target.closest("[data-msit]"))) { var a = b.dataset.msit.split("|"); T.gestor.mudarPrancha(a[0], a[1], function (p) { p.sit = T.gestor.cicloSit(p.sit); }); return; }
      if ((b = e.target.closest("[data-play]"))) {
        var c = b.dataset.play.split("|"), g = T.gestor.gp(c[0]), pr = T.byId(g.pranchas || [], c[1]), ids = T.gestor.idsPranchas(T.gestor.ordenarPranchas(g.pranchas || []));
        T.tempo.iniciar({ tipo: "projeto", alvoId: c[0], etapaId: T.gestor.etapas[pr.etapa].tempo, topicoId: null, descricao: ids[pr.id] + " · " + pr.titulo, pranchaId: pr.id });
        if (pr.sit === "a_fazer") T.gestor.mudarPrancha(c[0], pr.id, function (p) { p.sit = "andamento"; });
        T.toast("Cronômetro iniciado em " + ids[pr.id], { label: "Ver no Tempo", fn: function () { T.go("pessoa", "tempo"); } });
      }
    });
    $("view-meutrabalho").addEventListener("change", function (e) {
      var t = e.target; if (!t.dataset.mtf) return; var a = t.dataset.mtf.split("|");
      T.gestor.salvar(a[0], function (x) { var tf = T.byId(x.tarefas || [], a[1]); if (tf) { tf.feita = true; tf.feitaEm = new Date().toISOString(); } });
      T.toast("Tarefa concluída");
    });
  }
  T.register({
    id: "meutrabalho", label: "Projetos", area: "pessoa", html: html, init: init, render: render
  });
})();
