/* Gestão Trilha — núcleo
 * Tudo que é comum aos módulos: utilidades, banco de dados, pessoas, projetos,
 * configurações, custos, navegação e capa. Regras em CONTRATO.md.
 * Cada módulo chama Trilha.register({...}) — ver o contrato para os campos. */
(function () {
  "use strict";
  var T = window.Trilha = {};
  T.state = { view: "home", sub: null, pessoaId: null, pessoas: [], projetos: [], config: null, loaded: {} };
  T.modules = [];
  T.db = null; T.downloads = null; T.mcp = null;

  T.DEFAULT_CONFIG = {
    etapas: [
      { id: "ep", nome: "Estudo Preliminar" }, { id: "ap", nome: "Anteprojeto" },
      { id: "pl", nome: "Projeto Legal" }, { id: "comp", nome: "Compatibilização" },
      { id: "ex", nome: "Projeto Executivo" }, { id: "obra", nome: "Obra" }
    ],
    areas: [
      { id: "adm", nome: "Administrativo" }, { id: "mkt", nome: "Marketing" },
      { id: "com", nome: "Comercial e captação" }, { id: "cap", nome: "Capacitação" }
    ],
    obraTopicos: [
      { id: "orc-prel", nome: "Orçamento preliminar" }, { id: "orc-exec", nome: "Orçamento executivo" },
      { id: "planej", nome: "Planejamento de obra" }, { id: "crono", nome: "Cronograma de obra" },
      { id: "fin", nome: "Controle financeiro" }, { id: "gestao", nome: "Controle de gestão" },
      { id: "exec", nome: "Execução de obra" }
    ],
    tipos: [
      { id: "res", nome: "Residencial" }, { id: "comr", nome: "Comercial" },
      { id: "int", nome: "Interiores" }, { id: "ref", nome: "Reforma" }, { id: "out", nome: "Outro" }
    ],
    custosFixosMensais: null, horasProdutivasMes: 112
  };
  T.MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

  // ---------- utilidades ----------
  var $ = T.$ = function (id) { return document.getElementById(id); };
  T.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var pad = T.pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var ymd = T.ymd = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  T.parseYmd = function (s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); };
  var hm = T.hm = function (d) { return pad(d.getHours()) + ":" + pad(d.getMinutes()); };
  T.fmtH = function (min) { min = Math.round(min || 0); var h = Math.floor(min / 60), m = min % 60; return h + "h" + pad(m); };
  T.fmtClock = function (ms) { var s = Math.max(0, Math.floor(ms / 1000)); return Math.floor(s / 3600) + ":" + pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60); };
  T.fmtBRL = function (v) { return v == null || isNaN(v) ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); };
  T.fmtNum = function (v, d) { return v == null || isNaN(v) ? "—" : v.toLocaleString("pt-BR", { maximumFractionDigits: d == null ? 1 : d }); };
  T.fmtDia = function (d) { return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }); };
  T.fmtData = function (iso) { return iso ? new Date(iso).toLocaleDateString("pt-BR") : ""; };
  T.fmtDataHora = function (iso) { if (!iso) return ""; var d = new Date(iso); return d.toLocaleDateString("pt-BR") + " às " + hm(d); };
  T.fmtYmd = function (s) { if (!s) return ""; var p = s.split("-"); return p[2] + "/" + p[1] + "/" + p[0]; };
  T.fmtDur = function (ms) {
    var t = Math.round(ms / 60000), d = Math.floor(t / 1440), h = Math.floor(t % 1440 / 60), m = t % 60;
    if (d) return d + (d === 1 ? " dia" : " dias") + (h ? " e " + h + "h" : "");
    if (h) return h + "h" + (m ? pad(m) : "");
    return m + " min";
  };
  T.mesNome = function (mes) { return T.MESES[+mes.slice(5, 7) - 1] + " de " + mes.slice(0, 4); };
  T.numOrNull = function (v) { if (v === "" || v == null) return null; var n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? null : n; };
  T.weekStart = function (d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return x; };
  T.addDays = function (d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; };
  T.mesAtual = function () { return ymd(new Date()).slice(0, 7); };
  T.mesAnterior = function () { var d = new Date(); return ymd(new Date(d.getFullYear(), d.getMonth() - 1, 1)).slice(0, 7); };
  T.slug = function (s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || ("x" + Date.now()); };
  T.novoId = function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };
  T.clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  T.each = function (sel, fn, root) { Array.prototype.forEach.call((root || document).querySelectorAll(sel), fn); };
  T.ls = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
  T.byId = function (list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; };
  T.snapList = function (snap) { return snap.docs.map(function (d) { var o = Object.assign({}, d.data()); o.id = d.id; return o; }); };
  T.arrDocs = function (snap) { var m = {}; snap.docs.forEach(function (d) { var b = d.data(); m[d.id] = Array.isArray(b.itens) ? b.itens : []; }); return m; };
  T.optHtml = function (opts, sel) { return opts.map(function (o) { return '<option value="' + T.esc(o[0]) + '"' + (String(o[0]) === String(sel) ? " selected" : "") + ">" + T.esc(o[1]) + "</option>"; }).join(""); };

  // ---------- dados comuns ----------
  T.cfg = function () {
    var c = T.state.config || T.DEFAULT_CONFIG;
    if (!c.obraTopicos) c = Object.assign({}, c, { obraTopicos: T.DEFAULT_CONFIG.obraTopicos });
    return c;
  };
  T.pessoa = function (id) { return T.byId(T.state.pessoas, id); };
  T.pessoasAtivas = function () { return T.state.pessoas.filter(function (p) { return p.ativo !== false; }); };
  T.projeto = function (id) { return T.byId(T.state.projetos, id); };
  T.etapaNome = function (id) { if (id === "obra") return "Obra"; var e = T.byId(T.cfg().etapas, id); return e ? e.nome : (id ? "Etapa removida" : ""); };
  T.areaNome = function (id) { var a = T.byId(T.cfg().areas, id); return a ? a.nome : "Área removida"; };
  T.topicoNome = function (id) { var a = T.byId(T.cfg().obraTopicos, id); return a ? a.nome : (id ? "Tópico removido" : ""); };
  T.tipoNome = function (id) { var t = T.byId(T.cfg().tipos, id); return t ? t.nome : ""; };
  // custo-hora total da pessoa = custo-hora próprio + rateio dos custos fixos pelas horas produtivas
  T.rateioHora = function () {
    var c = T.cfg(), n = T.pessoasAtivas().length || 1;
    if (c.custosFixosMensais == null || !c.horasProdutivasMes) return null;
    return c.custosFixosMensais / (c.horasProdutivasMes * n);
  };
  T.custoHoraTotal = function (pid) { var p = T.pessoa(pid), r = T.rateioHora(); if (!p || p.custoHora == null) return null; return p.custoHora + (r || 0); };
  T.saveConfig = async function (patch) {
    var ref = T.db.doc("config/escritorio");
    if (T.state.config) await ref.update(patch);
    else { var full = T.clone(T.DEFAULT_CONFIG); Object.keys(patch).forEach(function (k) { full[k] = patch[k]; }); await ref.set(full); }
  };

  // ---------- aparelho ----------
  // Cada navegador ganha um id fixo e um nome legível ("Windows · Chrome"), usado para saber de onde o cronômetro foi parado.
  (function () {
    var id = T.ls("trilha.aparelho");
    if (!id) { id = T.novoId(); T.ls("trilha.aparelho", id); }
    var ua = navigator.userAgent || "", so = /iPhone|iPad/.test(ua) ? "iPhone/iPad" : /Android/.test(ua) ? "Android" : /Mac/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "Aparelho";
    var nav = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "navegador";
    if (/Claude/i.test(ua)) nav = "app Claude";
    T.device = { id: id, nome: so + " · " + nav };
  })();

  // ---------- módulos ----------
  // register({ id, label, area: "pessoa"|"admin", icon, desc(), html, init(T), connect(db), render(),
  //            homeStats(pid), homeState(pid) })
  // A capa só tem botões: pessoas (com o resumo de Tempo/Tarefas) e os apps do escritório. Nenhum app manda avisos ou dados para ela.
  T.register = function (m) { T.modules.push(m); };
  T.mod = function (id) { return T.byId(T.modules, id); };
  function modsDaArea(area) { return T.modules.filter(function (m) { return m.area === area; }); }
  function call(name, args) { var out = []; T.modules.forEach(function (m) { if (typeof m[name] === "function") { var r = m[name].apply(m, args || []); if (r != null) out = out.concat(r); } }); return out; }

  // ---------- navegação ----------
  T.go = function (view, sub, pid) {
    var s = T.state; s.view = view; if (pid) s.pessoaId = pid;
    if (view !== "home") { var mods = modsDaArea(view); if (!sub || !T.mod(sub) || T.mod(sub).area !== view) sub = mods[0].id; s.sub = sub; }
    $("home").hidden = view !== "home"; $("app").hidden = view === "home";
    if (view !== "home") {
      // Área da pessoa: abas Tempo e Tarefas. Apps do escritório: cada um é "um app dentro do app" — só o botão de voltar;
      // os outros apps se abrem pela capa.
      $("tabs").innerHTML = '<button class="tab back" data-home="1" aria-label="Voltar ao início">← Início</button>' +
        (view === "pessoa" ? modsDaArea(view).map(function (m) { return '<button class="tab' + (m.id === s.sub ? " is-selected" : "") + '" data-sub="' + m.id + '">' + T.esc(m.label) + "</button>"; }).join("") : "");
      var p = T.pessoa(s.pessoaId);
      $("app-title").textContent = view === "pessoa" ? (p ? p.nome : "") : T.mod(s.sub).label;
    }
    T.modules.forEach(function (m) { var v = $("view-" + m.id); if (v) v.hidden = view === "home" || m.id !== s.sub; });
    window.scrollTo(0, 0);
    T.render();
  };

  // ---------- capa ----------
  var FUTUROS = [
    { t: "Gestor de projetos", d: "Fases, entregas e prazos de cada projeto", icon: '<path d="M4 5h16"/><path d="M4 12h10"/><path d="M4 19h6"/><circle cx="18" cy="17" r="3"/>' },
    { t: "Gestor de obras", d: "Orçamentos, execução e custo real das obras", icon: '<path d="M3 20h18"/><path d="M5 20v-6a7 7 0 0 1 14 0v6"/><path d="M12 7V4"/><path d="M9 14h6"/>' }
  ];
  function renderHome() {
    var s = T.state;
    $("cover-date").textContent = T.fmtDia(new Date()).replace(/^./, function (c) { return c.toUpperCase(); });
    $("user-tiles").innerHTML = T.pessoasAtivas().map(function (p) {
      var st = call("homeState", [p.id])[0] || '<div class="tile-state">&nbsp;</div>';
      var stats = call("homeStats", [p.id]);
      return '<button class="tile-btn" data-user="' + T.esc(p.id) + '"><div class="tile-top"><span class="avatar">' + T.esc(p.nome.charAt(0)) + '</span><div><div class="tile-name">' + T.esc(p.nome) + "</div>" + st + "</div></div>" +
        '<div class="tile-stats">' + stats.map(function (x) { return "<div><small>" + T.esc(x.label) + '</small><b class="' + (x.alert ? "alert" : "") + '">' + T.esc(x.value) + "</b></div>"; }).join("") + "</div></button>";
    }).join("") || '<div class="empty">Carregando pessoas…</div>';
    $("admin-tiles").innerHTML = modsDaArea("admin").map(function (m) {
      return '<button class="tile-btn admin-tile" data-go="' + m.id + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + m.icon + '</svg><span><span class="t">' + T.esc(m.label) + '</span><span class="d">' + T.esc(m.desc ? m.desc() : "") + "</span></span></button>";
    }).join("") + FUTUROS.map(function (f) {
      return '<div class="tile-btn admin-tile soon" aria-disabled="true"><svg viewBox="0 0 24 24" aria-hidden="true">' + f.icon + '</svg><span><span class="t">' + f.t + '<span class="soon-pill">Em breve</span></span><span class="d">' + f.d + "</span></span></div>";
    }).join("");
  }
  $("home") && document.addEventListener("click", function (e) {
    if (T.state.view === "home" && e.target.closest("#home")) {
      var u = e.target.closest("[data-user]"); if (u) { T.go("pessoa", null, u.dataset.user); return; }
      var a = e.target.closest("[data-go]"); if (a) { T.go("admin", a.dataset.go); return; }
      return;
    }
    if (e.target.closest("[data-home]")) { T.go("home"); return; }
    var t = e.target.closest("#tabs [data-sub]"); if (t) T.go(T.state.view, t.dataset.sub);
  });

  // ---------- render ----------
  T.render = function () {
    if (T.state.view === "home") renderHome();
    else { var m = T.mod(T.state.sub); if (m && m.render) m.render(); }
  };
  var queued = false;
  T.scheduleRender = function () { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; T.render(); }); };

  // ---------- avisos ----------
  var toastTimer = null;
  T.toast = function (msg, action) {
    var t = $("toast"), b = $("toast-btn");
    $("toast-msg").textContent = msg; t.hidden = false;
    b.hidden = !action; b.onclick = null;
    if (action) { b.textContent = action.label; b.onclick = function () { t.hidden = true; action.fn(); }; }
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, action ? 10000 : 2600);
  };
  T.showError = function (e) {
    var code = e && e.code;
    T.toast(code === "quota_exceeded" ? "O banco de dados atingiu o limite de registros." : code === "revoked" || code === "not_granted" ? "Este acesso não permite salvar dados." : "Não foi possível salvar. Tente de novo em instantes.");
  };
  // Salvar com retorno visível ao lado do botão: "Salvando…" → "Salvo ✓" (ou o erro).
  T.saveWith = async function (btn, fn) {
    var st = btn.parentNode.querySelector(".save-state");
    if (!st) { st = document.createElement("span"); st.className = "save-state"; btn.parentNode.appendChild(st); }
    btn.disabled = true; st.className = "save-state"; st.textContent = "Salvando…";
    try { await fn(); st.className = "save-state ok"; st.textContent = "Salvo ✓"; setTimeout(function () { if (st.textContent === "Salvo ✓") st.textContent = ""; }, 2500); return true; }
    catch (e) { st.className = "save-state err"; st.textContent = e && e.message && !e.code ? e.message : "Não foi possível salvar"; return false; }
    finally { btn.disabled = false; }
  };
  function setStatus(msg, danger) { var s = $("status"); s.hidden = !msg; s.textContent = msg || ""; s.classList.toggle("danger", !!danger); }
  T.loaded = function (key, snap) { if (!snap.metadata || !snap.metadata.fromCache) { T.state.loaded[key] = true; call("onLoaded", [key]); } };
  T.onErr = function (e) { if (e && (e.code === "revoked" || e.code === "not_granted")) setStatus("O acesso a este app foi alterado. Recarregue a página.", true); };

  // ---------- inicialização ----------
  T.start = function () {
    var views = $("views");
    T.modules.forEach(function (m) {
      var sec = document.createElement("section"); sec.className = "view"; sec.id = "view-" + m.id; sec.hidden = true; sec.innerHTML = m.html || "";
      views.appendChild(sec);
      if (m.init) m.init(T);
    });
    T.go("home");
    setStatus("Conectando ao banco de dados…");
    (async function () {
      var use = window.claude && window.claude.use ? window.claude.use.bind(window.claude) : null;
      try { T.downloads = use ? await use("downloads") : null; } catch (e) { T.downloads = null; }
      try { T.db = use ? await use("db") : null; } catch (e) { T.db = null; }
      if (!T.db) { setStatus("O banco de dados não está disponível nesta visualização. Abra o app pelo claude.ai.", true); return; }
      setStatus("");
      var db = T.db;
      db.collection("pessoas").onSnapshot(function (s) { T.state.pessoas = T.snapList(s).sort(function (a, b) { return (a.ordem || 0) - (b.ordem || 0); }); T.loaded("pessoas", s); T.scheduleRender(); }, T.onErr);
      db.collection("projetos").onSnapshot(function (s) { T.state.projetos = T.snapList(s); T.scheduleRender(); }, T.onErr);
      db.doc("config/escritorio").onSnapshot(function (d) { T.state.config = d.exists ? d.data() : null; T.scheduleRender(); }, T.onErr);
      T.modules.forEach(function (m) { if (m.connect) m.connect(db); });
      try { T.mcp = use ? await use("mcp") : null; } catch (e) { T.mcp = null; }
    })();
  };
})();
