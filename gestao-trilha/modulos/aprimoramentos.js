/* Dúvidas e aprimoramentos — caixa na capa para registrar ajustes, dúvidas e ideias percebidos no uso do app.
 * Regra: o app só RECEBE. Nada é respondido nem processado aqui (sem IA, sem custo de uso). A análise acontece no chat
 * do Claude, quando o Luan pedir; o Claude grava a resposta e o andamento no próprio registro.
 * Dados: aprimoramentos/<AAAA-MM> { itens[] } — um documento por mês. Cada item: id, texto, app, pessoaId, criadoEm,
 * status ("registrado" | "analise" | "respondido" | "aprovado" | "feito" | "recusado"), resposta, atualizadoEm. */
(function () {
  "use strict";
  var T = window.Trilha, $ = T.$, esc = T.esc;
  var STATUS = { registrado: "Registrado", analise: "Em análise", respondido: "Respondido", aprovado: "Aprovado", feito: "Feito ✓", recusado: "Não será feito" };
  var S = { docs: {}, ver: false, pessoa: T.ls("trilha.aprim.pessoa") || "" };

  function itens() {
    var out = [];
    Object.keys(S.docs).forEach(function (m) { (S.docs[m] || []).forEach(function (x) { out.push(Object.assign({ mes: m }, x)); }); });
    return out.sort(function (a, b) { return String(b.criadoEm).localeCompare(String(a.criadoEm)); });
  }
  function apps() {
    return [["geral", "Geral"]].concat(T.modules.filter(function (m) { return m.area === "admin" || m.area === "pessoa"; }).map(function (m) { return [m.id, m.label === "Projetos" ? "Projetos (área da pessoa)" : m.label]; }));
  }
  function appNome(id) { var a = apps().filter(function (x) { return x[0] === id; })[0]; return a ? a[1] : id; }

  function caixa() {
    return '<div class="card gp-box com-chat apr-box"><div class="com-chat-h"><b>Dúvidas e aprimoramentos · Registre aqui</b><span class="hint">Um ajuste, uma dúvida ou uma ideia. Fica guardado para o Luan analisar com o Claude; nada é respondido nem alterado automaticamente.</span></div>' +
      '<div class="apr-quem" id="apr-quem"></div>' +
      '<div class="com-chat-in"><textarea class="ctl" id="apr-txt" rows="2" placeholder="Escreva ou dite pelo microfone do teclado…" aria-label="Dúvida ou aprimoramento"></textarea>' +
      '<span class="hint apr-dica">Dica: no computador, use o microfone com <kbd aria-label="tecla Windows"><svg class="apr-win" viewBox="0 0 16 16" aria-hidden="true"><path d="M0 0h7.5v7.5H0zM8.5 0H16v7.5H8.5zM0 8.5h7.5V16H0zM8.5 8.5H16V16H8.5z"/></svg> Win</kbd> + <kbd>H</kbd> · no celular, o microfone do teclado.</span>' +
      '<select class="ctl" id="apr-app" aria-label="Sobre qual parte do app"></select><button type="button" class="btn btn-small btn-primary" id="apr-ok">Registrar</button></div>' +
      '<div class="apr-rodape"><span class="hint" id="apr-resumo"></span><button type="button" class="link" id="apr-ver" hidden></button></div>' +
      '<div id="apr-lista" hidden></div></div>';
  }
  function renderQuem() {
    var box = $("apr-quem"); if (!box) return;
    var ps = T.pessoasAtivas();
    if (!S.pessoa && ps[0]) S.pessoa = ps[0].id;
    box.innerHTML = '<span class="hint">Quem registra:</span>' + ps.map(function (p) { return '<button type="button" class="seg-pill' + (p.id === S.pessoa ? " is-selected" : "") + '" data-aprp="' + esc(p.id) + '">' + esc(p.nome) + "</button>"; }).join("");
    var sel = $("apr-app");
    if (sel && !sel.options.length) sel.innerHTML = T.optHtml(apps(), "geral");
  }
  function renderLista() {
    var l = itens(), ab = l.filter(function (x) { return x.status !== "feito" && x.status !== "recusado"; }).length;
    var res = $("apr-resumo"), ver = $("apr-ver"), lista = $("apr-lista"); if (!res) return;
    res.textContent = l.length ? (ab ? ab + (ab === 1 ? " registro em aberto" : " registros em aberto") : "Tudo resolvido") + " · " + l.length + " no total" : "Nenhum registro ainda.";
    ver.hidden = !l.length; ver.textContent = S.ver ? "Ocultar registros" : "Ver registros";
    lista.hidden = !S.ver || !l.length;
    if (lista.hidden) return;
    lista.innerHTML = l.slice(0, 40).map(function (x) {
      var p = T.pessoa(x.pessoaId);
      return '<div class="apr-item"><div class="apr-meta"><span class="pill apr-st apr-' + esc(x.status || "registrado") + '">' + esc(STATUS[x.status] || STATUS.registrado) + '</span><span class="hint">' + esc(p ? p.nome : "") + " · " + esc(appNome(x.app)) + " · " + T.fmtDataHora(x.criadoEm) + "</span>" +
        ((x.status || "registrado") === "registrado" ? '<button type="button" class="link danger" data-aprdel="' + esc(x.mes + "|" + x.id) + '">Excluir</button>' : "") + "</div>" +
        '<div class="apr-txt">' + esc(x.texto) + "</div>" + (x.resposta ? '<div class="apr-resp"><b>Resposta:</b> ' + esc(x.resposta) + "</div>" : "") + "</div>";
    }).join("");
  }
  function render() { renderQuem(); renderLista(); }

  async function registrar(btn) {
    var txt = $("apr-txt").value.trim(); if (!txt) { T.toast("Escreva o que quer registrar."); return; }
    if (!S.pessoa) { T.toast("Escolha quem está registrando."); return; }
    var mes = T.mesAtual(), item = { id: T.novoId(), texto: txt, app: $("apr-app").value || "geral", pessoaId: S.pessoa, criadoEm: new Date().toISOString(), status: "registrado" };
    var ok = await T.saveWith(btn, async function () {
      var ref = T.db.doc("aprimoramentos/" + mes);
      if (S.docs[mes]) await ref.update({ itens: T.clone(S.docs[mes]).concat([item]) });
      else await ref.set({ mes: mes, itens: [item] });
    });
    if (ok) { $("apr-txt").value = ""; S.docs[mes] = (S.docs[mes] || []).concat([item]); renderLista(); T.toast("Registrado ✓ — fica guardado para análise."); }
  }
  async function excluir(chave) {
    var k = chave.split("|"), mes = k[0], id = k[1];
    if (!(await T.confirmar({ titulo: "Excluir o registro?", texto: "Ele ainda não foi analisado. Não dá para desfazer.", ok: "Excluir", perigo: true }))) return;
    try { await T.db.doc("aprimoramentos/" + mes).update({ itens: (S.docs[mes] || []).filter(function (x) { return x.id !== id; }).map(T.clone) }); T.toast("Registro excluído"); } catch (e) { T.showError(e); }
  }

  function init() {
    var home = $("home-extra"); if (!home) return;
    home.innerHTML = caixa();
    home.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.aprp) { S.pessoa = b.dataset.aprp; T.ls("trilha.aprim.pessoa", S.pessoa); renderQuem(); return; }
      if (b.dataset.aprdel) { excluir(b.dataset.aprdel); return; }
      if (b.id === "apr-ver") { S.ver = !S.ver; renderLista(); return; }
      if (b.id === "apr-ok") registrar(b);
    });
    render();
  }

  T.register({
    id: "aprimoramentos", label: "Dúvidas e aprimoramentos", area: "capa", html: "", init: init, render: render,
    connect: function (db) {
      db.collection("pessoas").onSnapshot(function () { setTimeout(renderQuem, 0); }, function () {});
      db.collection("aprimoramentos").onSnapshot(function (s) { S.docs = T.arrDocs(s); renderLista(); }, T.onErr);
    }
  });
})();
