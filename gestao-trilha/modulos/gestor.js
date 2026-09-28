/* Módulo Gestor de Projetos — processo de projeto (etapas, portões, pranchas, tarefas, programa de necessidades).
 * Dados: gp/<projetoId> (um documento por projeto). Dados básicos do projeto ficam em projetos/<id> (núcleo).
 * Regras: manual-trilha/MAPEAMENTO.md e processo-trilha.json. Expõe Trilha.gestor para os outros módulos. */
(function () {
  "use strict";
  var T = window.Trilha, $ = T.$, esc = T.esc;

  // ---------- constantes do processo ----------
  var SIGLAS = [["RES", "Residencial"], ["COM", "Comercial"], ["HOT", "Hotelaria"], ["REF", "Reforma"], ["INT", "Interiores"]];
  var TIPO_ANTIGO = { RES: "res", COM: "comr", HOT: "hot", REF: "ref", INT: "int" };
  var ETAPAS = {
    briefing: { nome: "Briefing", curto: "Briefing" },
    ep: { nome: "Estudo Preliminar", curto: "EP", prazo: 40, tempo: "ep", termo: "Termo de Encerramento de Etapa" },
    ap: { nome: "Anteprojeto", curto: "AP", prazo: 70, tempo: "ap", termo: "Termo de Encerramento de Etapa", fases: ["Revisão e lançamentos", "Compatibilização", "Definições"] },
    pe: { nome: "Projeto Executivo", curto: "PE", prazo: 60, tempo: "ex", termo: "Termo de Encerramento de Projeto", fases: ["Desenhos base", "Mapeamentos e detalhamento"] },
    encerrado: { nome: "Encerrado", curto: "Fim" }
  };
  function fluxo(sigla) { return sigla === "REF" || sigla === "INT" ? ["briefing", "ep", "pe", "encerrado"] : ["briefing", "ep", "ap", "pe", "encerrado"]; }
  function temLegal(g) { return g.legal && g.legal !== "nao_se_aplica"; }
  var LEGAL = [["nao_iniciado", "Não iniciado"], ["em_preparo", "Em preparo"], ["protocolado", "Protocolado"], ["aprovado", "Aprovado"], ["nao_se_aplica", "Não se aplica"]];
  var SIT = [["a_fazer", "A fazer"], ["andamento", "Em andamento"], ["revisao", "Revisão interna"], ["pronto", "Pronto"], ["entregue", "Entregue"]];
  var QUEM = [["cliente", "cliente"], ["engenheiro", "engenheiro"], ["condominio", "condomínio"], ["prefeitura", "prefeitura"]];
  var MARCO = [["contrato", "Contrato assinado"], ["parcela", "1ª parcela paga"], ["topografico", "Topográfico entregue"], ["documentos", "Documentos do cliente"]];
  var SERIES = [
    [100, "Implantação, plantas e cobertura", "ap"], [200, "Cortes", "ap"], [300, "Elevações", "ap"], [400, "Mapeamentos", "ap"],
    [500, "Ampliações", "pe"], [600, "Esquadrias", "pe"], [700, "Marmoraria", "pe"], [800, "Detalhamentos construtivos", "pe"],
    [900, "Marcenaria", "pe"], [1000, "Documentos", "pe"]
  ];
  var PADRAO = [["medio", "Médio (R$ 3.000–3.500/m²)"], ["medio_alto", "Médio Alto (R$ 3.500–4.500/m²)"], ["alto_1", "Alto (R$ 4.500–5.500/m²)"], ["alto_2", "Alto (R$ 5.500–7.000/m²)"], ["luxo", "Luxo (acima de R$ 7.000/m²)"]];
  var DIMENSAO = [["compacta", "Compacta"], ["confortavel", "Confortável"], ["espacosa", "Espaçosa"]];
  var DIFICULDADE = [["baixa", "Baixa"], ["normal", "Normal"], ["dificil", "Difícil"], ["muito_dificil", "Muito difícil"]];

  // ---------- programa de necessidades: campos e catálogo (nomes do briefing) ----------
  var TV = ["Sem TV", "40\"", "43\"", "50\"", "55\"", "65\"", "75\"", "85\""], LUG = ["4", "6", "8", "10", "12"];
  var CAMPOS = {
    ilha: { l: "Ilha", t: "bool" }, agua_quente: { l: "Água quente", t: "bool" },
    exaustao: { l: "Exaustão", t: "sel", o: ["Coifa", "Depurador de teto", "Depurador de bancada", "Não precisa"] },
    equipamentos: { l: "Equipamentos", t: "multi", o: ["Geladeira comum", "Geladeira side by side", "Geladeira embutida", "Freezer", "Freezer embutido", "Fogão 4 bocas", "Fogão 6 bocas", "Cooktop 4 bocas", "Cooktop 5 bocas", "Cooktop 6 bocas", "Forno comum", "Forno de embutir", "Micro-ondas comum", "Micro-ondas de embutir", "Filtro soft", "Filtro de bancada", "Lava-louças", "Adega climatizada"] },
    itens_bancada: { l: "Na bancada", t: "multi", o: ["Cuba inox simples", "Cuba inox grande", "Cuba inox dupla", "Calha úmida", "Lixeira embutida", "Triturador de alimentos"] },
    integracao: { l: "Integração", t: "sel", o: ["Estar, jantar e cozinha integrados", "Jantar e cozinha integrados", "Estar e jantar integrados", "Nenhum ambiente integrado"] },
    lugares: { l: "Mesa (lugares)", t: "sel", o: LUG }, aparador: { l: "Aparador", t: "bool" }, cristaleira: { l: "Cristaleira", t: "bool" },
    assentos: { l: "Assentos", t: "sel", o: LUG }, tv: { l: "TV", t: "sel", o: TV },
    tv_ou_projetor: { l: "Tela", t: "sel", o: ["TV", "Projetor"] },
    cama: { l: "Cama", t: "sel", o: ["Solteiro", "Casal comum (1,38×1,88)", "Queen size (1,58×1,98)", "King size (1,93×2,03)"] },
    closet: { l: "Closet", t: "bool" },
    bancada_tipo: { l: "Bancada", t: "sel", o: ["Cuba de louça", "Cuba esculpida"] }, cubas: { l: "Cubas", t: "sel", o: ["1", "2"] },
    sanitario: { l: "Sanitário", t: "sel", o: ["Caixa acoplada", "Válvula"] }, ducha_higienica: { l: "Ducha higiênica", t: "bool" },
    bide: { l: "Bidê", t: "bool" }, toalheiro: { l: "Toalheiro aquecido", t: "bool" },
    chuveiros: { l: "Chuveiros", t: "sel", o: ["1", "2"] }, tipo_chuveiro: { l: "Chuveiro", t: "sel", o: ["Elétrico", "Pré-aquecido (gás, boiler…)"] },
    banheira: { l: "Banheira", t: "sel", o: ["Não", "Hidromassagem", "Imersão", "Em anexo (SPA)"] },
    carros_medios: { l: "Carros médios", t: "num" }, carros_grandes: { l: "Carros grandes", t: "num" }, motos: { l: "Motos", t: "num" }, bicicletas: { l: "Bicicletas", t: "num" },
    cobertura_garagem: { l: "Garagem", t: "sel", o: ["Coberta", "Descoberta", "Mista"] }, tomada_eletrico: { l: "Tomada carro elétrico", t: "bool" }, armario: { l: "Armário/depósito", t: "bool" },
    tanque: { l: "Tanque", t: "sel", o: ["Louça", "Inox", "Inox grande"] }, maquina: { l: "Máquina", t: "sel", o: ["Abertura superior", "Abertura frontal", "Lava e seca"] },
    passar: { l: "Passar roupa na lavanderia", t: "bool" },
    sofas: { l: "Sofás (lugares)", t: "sel", o: ["Não", "4", "6", "8", "10"] },
    equip_gourmet: { l: "Equipamentos", t: "multi", o: ["Churrasqueira a carvão", "Churrasqueira elétrica", "Churrasqueira a gás", "Forno de pizza", "Fogão a lenha", "Geladeira", "Freezer vertical", "Freezer horizontal", "Cervejeira", "Chopeira", "Adega climatizada", "Cooktop", "Forno", "Micro-ondas", "Filtro", "Lava-louças"] },
    modelo_piscina: { l: "Modelo", t: "sel", o: ["Convencional", "Borda infinita", "Desbordante", "Borda infinita + desbordante", "Aspecto natural"] },
    tamanho: { l: "Tamanho", t: "sel", o: ["Pequena", "Média", "Grande"] }, aquecida: { l: "Aquecida", t: "bool" },
    elementos: { l: "Elementos", t: "multi", o: ["Prainha", "Hidromassagem", "Bar submerso", "Raia", "Cascata", "Deck"] },
    tipo_escada: { l: "Tipo", t: "sel", o: ["Reta", "Em L", "Em U", "Helicoidal", "Outra"] }, material: { l: "Material", t: "txt" }
  };
  var BANHO = ["agua_quente", "bancada_tipo", "cubas", "sanitario", "ducha_higienica", "bide", "toalheiro", "chuveiros", "tipo_chuveiro"];
  var CATALOGO = [
    { id: "hall", n: "Hall / chapelaria", s: "social", a: 4 },
    { id: "cozinha", n: "Cozinha", s: "social", a: 30, amp: 1, banc: 1, c: ["ilha", "agua_quente", "exaustao", "equipamentos", "itens_bancada", "integracao"] },
    { id: "jantar", n: "Jantar", s: "social", a: 20, c: ["lugares", "aparador", "cristaleira"] },
    { id: "estar", n: "Estar", s: "social", a: 30, c: ["assentos", "tv"] },
    { id: "cinema", n: "Sala de TV / cinema", s: "social", a: 10, c: ["assentos", "tv_ou_projetor", "tv"] },
    { id: "escritorio", n: "Escritório", s: "social", a: 14 },
    { id: "lavabo", n: "Lavabo", s: "social", a: 2.5, amp: 1, banc: 1, c: ["agua_quente", "bancada_tipo", "sanitario", "ducha_higienica"] },
    { id: "suite_master", n: "Suíte master", s: "intimo", a: 16, c: ["cama", "tv", "closet"] },
    { id: "banho_master", n: "Banho master", s: "intimo", a: 5, amp: 1, banc: 1, c: BANHO.concat(["banheira"]) },
    { id: "spa", n: "SPA / banheira", s: "intimo", a: 6, amp: 1 },
    { id: "closet", n: "Closet", s: "intimo", a: 8 },
    { id: "quarto", n: "Quarto", s: "intimo", a: 14, c: ["cama", "tv"] },
    { id: "banho", n: "Banheiro", s: "intimo", a: 3.5, amp: 1, banc: 1, c: BANHO },
    { id: "garagem", n: "Garagem (vaga)", s: "servico", a: 18, c: ["carros_medios", "carros_grandes", "motos", "bicicletas", "cobertura_garagem", "tomada_eletrico", "armario"] },
    { id: "lavanderia", n: "Lavanderia", s: "servico", a: 8, amp: 1, banc: 1, c: ["tanque", "maquina", "passar"] },
    { id: "deposito", n: "Depósito", s: "servico", a: 6 },
    { id: "gourmet", n: "Espaço gourmet", s: "lazer", a: null, amp: 1, banc: 1, c: ["ilha", "agua_quente", "lugares", "sofas", "tv", "equip_gourmet", "itens_bancada"] },
    { id: "piscina", n: "Piscina", s: "lazer", a: null, amp: 1, c: ["modelo_piscina", "tamanho", "aquecida", "elementos"] },
    { id: "escada", n: "Escada", s: "servico", a: null, amp: 1, c: ["tipo_escada", "material"] },
    { id: "quintal", n: "Quintal / área externa", s: "externo", a: null },
    { id: "outro", n: "Outro ambiente", s: "social", a: null }
  ];
  var SETORES = [["social", "Social"], ["intimo", "Íntimo"], ["servico", "Serviço"], ["lazer", "Lazer"], ["externo", "Externo"]];
  var PADRAO_RES = { hall: 1, cozinha: 1, jantar: 1, estar: 1, lavabo: 1, suite_master: 1, banho_master: 1, closet: 1, quarto: 2, banho: 1, garagem: 2, lavanderia: 1 };
  function tipoAmb(id) { return T.byId(CATALOGO, id) || T.byId(CATALOGO, "outro"); }
  function areaRef(tipo) { var t = tipoAmb(tipo); return t.a; } // só Confortável existe por enquanto (catálogo)

  // ---------- estado ----------
  var S = { gp: {}, view: "lista", projId: null, tab: "geral", filtro: "todos", busca: "", serieFiltro: "todas", openAmb: null, wiz: null, confirmDel: null };

  // ---------- datas: dias úteis ----------
  function dia(d) { d = new Date(d); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function du(a, b) { var x = dia(a), y = dia(b), n = 0; while (x < y) { x.setDate(x.getDate() + 1); var w = x.getDay(); if (w && w < 6) n++; } return n; }
  function voltaDu(n, base) { var x = dia(base || new Date()), passo = n < 0 ? 1 : -1; n = Math.abs(n); while (n > 0) { x.setDate(x.getDate() + passo); var w = x.getDay(); if (w && w < 6) n--; } return x; }
  function hojeIso() { return T.ymd(new Date()); }

  // ---------- leitura ----------
  function G(pid) { return S.gp[pid] || null; }
  function proj(pid) { return T.projeto(pid) || { id: pid, nome: "Projeto removido" }; }
  function projetosGestor() { return T.state.projetos.filter(function (p) { return !!S.gp[p.id]; }); }
  function clientesNomes(p) {
    var ids = p.clienteIds || [], nomes = ids.map(function (id) { var c = T.cadastros && T.cadastros.contato(id); return c ? c.nome : null; }).filter(Boolean);
    return nomes.length ? nomes.join(" e ") : (p.cliente || "");
  }
  function esperaAberta(g) { var e = (g.esperas || []).filter(function (x) { return !x.fim; }); return e[e.length - 1] || null; }
  function prazoInfo(g) {
    var et = ETAPAS[g.etapa], info = g.etapas && g.etapas[g.etapa];
    if (!et || !et.prazo || !info || !info.inicio) return null;
    var ini = new Date(info.inicio), agora = new Date(), pausa = 0;
    (g.esperas || []).forEach(function (e) {
      var s = new Date(Math.max(ini, new Date(e.inicio))), f = e.fim ? new Date(e.fim) : agora;
      if (f > s) pausa += du(s, f);
    });
    var usados = Math.max(0, du(ini, agora) - pausa);
    return { usados: usados, prazo: et.prazo, resta: et.prazo - usados, pausado: !!esperaAberta(g) };
  }
  function situacao(g) {
    if (g.etapa === "encerrado") return { k: "fim", txt: "Encerrado" };
    if (g.suspenso) return { k: "bad", txt: "Suspenso desde " + T.fmtYmd(g.suspenso.desde) };
    var e = esperaAberta(g);
    if (e) { var d = du(e.inicio, new Date()); return { k: e.quem === "cliente" && d >= 15 ? "bad" : "wait", txt: "Aguardando " + nomeQuem(e.quem) + " · " + d + " d.u.", dias: d, quem: e.quem }; }
    var pz = prazoInfo(g);
    if (pz && pz.resta < 0) return { k: "bad", txt: "Prazo vencido há " + (-pz.resta) + " d.u." };
    return { k: "ok", txt: "Em dia" };
  }
  function nomeQuem(q) { var x = QUEM.filter(function (o) { return o[0] === q; })[0]; return x ? x[1] : q; }
  function marcoOk(g) { var m = g.marco || {}; return !!(m.contrato && m.parcela && m.topografico); }
  function horasProj(pid) { if (!T.tempo) return 0; var min = 0; T.tempo.lancAtivos().forEach(function (l) { if (l.tipo === "projeto" && l.alvoId === pid) min += l.min; }); return min; }
  function pranchasEtapa(g, etapa) { return (g.pranchas || []).filter(function (x) { return !etapa || x.etapa === etapa; }); }
  function prontas(list) { return list.filter(function (x) { return x.sit === "pronto" || x.sit === "entregue"; }).length; }
  function idsPranchas(pr) {
    var cont = {}, out = {};
    pr.forEach(function (x) { cont[x.serie] = (cont[x.serie] || 0) + 1; out[x.id] = x.serie + cont[x.serie]; });
    return out;
  }
  function ordenarPranchas(pr) { return pr.slice().sort(function (a, b) { return a.serie - b.serie || (a.ord || 0) - (b.ord || 0); }); }

  // ---------- plano de projeto (gerado a partir do cadastro) ----------
  function novaPrancha(serie, titulo, etapa, extra) { return Object.assign({ id: T.novoId(), serie: serie, titulo: titulo, etapa: etapa, sit: "a_fazer", resp: null, rev: "R00" }, extra || {}); }
  function gerarPlano(o) {
    var pavs = o.pavs && o.pavs.length ? o.pavs : ["Térreo"], semAp = fluxo(o.sigla).indexOf("ap") < 0, pr = [];
    function et(e) { return semAp ? "pe" : e; }
    function add(s, t, e, x) { pr.push(novaPrancha(s, t, et(e), x)); }
    add(100, "Implantação", "ap");
    pavs.forEach(function (p) { add(100, "Planta baixa – " + p, "ap"); });
    add(100, "Planta de cobertura", "ap");
    add(200, "Cortes AA e BB", "ap"); add(200, "Cortes CC e DD", "ap");
    add(300, "Fachadas 01 e 02", "ap"); add(300, "Fachadas 03 e 04", "ap");
    add(400, "Topografia e terraplenagem", "ap");
    ["Piso e acabamento", "Hidrossanitário", "Elétrica", "Forro e iluminação"].forEach(function (m) { pavs.forEach(function (p) { add(400, m + " – " + p, "ap"); }); });
    add(400, "Mapeamento de cobertura", "ap");
    var amp = 0, bancadas = [];
    (o.ambientes || []).forEach(function (a) {
      var t = tipoAmb(a.tipo);
      if (t.amp) { amp++; add(500, "amp" + (amp < 10 ? "0" : "") + amp + " – " + a.nome, "pe", { ambId: a.id }); }
      if (t.banc) bancadas.push(a);
    });
    add(600, "Esquadrias de alumínio e vidro", "pe"); add(600, "Esquadrias de madeira", "pe"); add(600, "Guarda-corpo e corrimão", "pe");
    if (bancadas.length) { pavs.forEach(function (p) { add(700, "Planta de marmoraria – " + p, "pe"); }); bancadas.forEach(function (a) { add(700, "Bancada – " + a.nome, "pe", { ambId: a.id, banc: true }); }); }
    add(800, "Detalhe construtivo (exemplo)", "pe");
    if (o.marcenaria) { pavs.forEach(function (p) { add(900, "Mapa de marcenaria – " + p, "pe"); }); }
    ["Terraplenagem", "Revestimentos: especificação e quantitativo", "Louças e metais", "Equipamentos", "Tomadas e interruptores", "Iluminação"].forEach(function (d) { add(1000, d, "pe"); });
    var ord = {}; pr.forEach(function (x) { ord[x.serie] = (ord[x.serie] || 0) + 1; x.ord = ord[x.serie]; });
    return pr;
  }
  function novoAmbiente(tipo, extra) {
    var t = tipoAmb(tipo);
    return Object.assign({ id: T.novoId(), tipo: t.id, nome: t.n, setor: t.s, pav: null, qtd: 1, area: t.a, cfg: {}, obs: "", origem: "cadastro" }, extra || {});
  }
  function ambientesDeQtd(qtd, pav0) {
    var out = [];
    CATALOGO.forEach(function (t) {
      var n = +qtd[t.id] || 0; if (!n) return;
      if (t.id === "garagem") { out.push(novoAmbiente(t.id, { qtd: n, pav: pav0, nome: "Garagem" })); return; }
      for (var i = 1; i <= n; i++) out.push(novoAmbiente(t.id, { pav: pav0, nome: n > 1 ? t.n + " " + i : t.n }));
    });
    return out;
  }

  // ---------- gravação ----------
  async function salvar(pid, fn) {
    var cur = T.clone(S.gp[pid] || {}); fn(cur); cur.atualizadoEm = new Date().toISOString();
    S.gp[pid] = cur; T.scheduleRender();
    try { await T.db.doc("gp/" + pid).set(cur); } catch (e) { T.showError(e); }
  }
  async function salvarProjeto(pid, patch) { try { await T.db.doc("projetos/" + pid).update(patch); } catch (e) { T.showError(e); } }

  // ---------- componentes ----------
  function trilha(g) {
    var f = fluxo(g.sigla), i = f.indexOf(g.etapa);
    return '<span class="gp-trail" title="' + esc(ETAPAS[g.etapa] ? ETAPAS[g.etapa].nome : "") + '">' + f.map(function (e, k) { return '<i class="' + (k < i ? "on" : k === i ? "cur" : "") + '"></i>'; }).join("") + "</span>";
  }
  function sitPill(g) { var s = situacao(g); return '<span class="gp-sit ' + s.k + '">' + esc(s.txt) + "</span>"; }
  function avatarPessoa(id, small) { var p = T.pessoa(id); return p ? '<span class="avatar' + (small ? " av-s" : "") + '" title="' + esc(p.nome) + '">' + esc(p.nome.charAt(0)) + "</span>" : ""; }
  function optPessoas(sel, vazio) { return (vazio ? '<option value="">' + esc(vazio) + "</option>" : "") + T.pessoasAtivas().map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === sel ? " selected" : "") + ">" + esc(p.nome) + "</option>"; }).join(""); }
  function etapaLinha(g) { var et = ETAPAS[g.etapa] || {}; return esc(et.nome || "") + (et.fases && g.fase ? " · fase " + g.fase : ""); }

  // ---------- lista (visão geral) ----------
  function avisos() {
    var out = [];
    projetosGestor().forEach(function (p) {
      var g = G(p.id); if (g.etapa === "encerrado") return;
      var s = situacao(g), nome = '<b>' + esc(p.codigo || p.nome) + "</b>";
      if (s.quem === "cliente" && s.dias >= 20) out.push(["bad", nome + " aguarda o cliente há " + s.dias + " dias úteis. Pela regra, o projeto vai para suspenso.", p.id]);
      else if (s.quem === "cliente" && s.dias >= 15) out.push(["warn", nome + " aguarda o cliente há " + s.dias + " dias úteis · suspende em " + (20 - s.dias), p.id]);
      if (g.etapa === "briefing" && marcoOk(g)) out.push(["ok", nome + " cumpriu o marco zero: pronto para iniciar o Estudo Preliminar", p.id]);
      var pz = prazoInfo(g); if (pz && !pz.pausado && pz.resta >= 0 && pz.resta <= 5) out.push(["warn", nome + ": faltam " + pz.resta + " d.u. no prazo de " + ETAPAS[g.etapa].nome, p.id]);
      var pe = pranchasEtapa(g, g.etapa); if ((g.etapa === "ap" || g.etapa === "pe") && pe.length && prontas(pe) === pe.length) out.push(["ok", nome + ": todas as pranchas da etapa prontas. Pronto para o termo", p.id]);
    });
    return out;
  }
  function cardProjeto(p) {
    var g = G(p.id), pr = g.pranchas || [], pz = prazoInfo(g), h = horasProj(p.id);
    var legal = temLegal(g) && g.etapa !== "briefing" && g.etapa !== "encerrado" ? '<div class="gp-legal">Legal: ' + esc((LEGAL.filter(function (o) { return o[0] === g.legal; })[0] || ["", ""])[1]) + "</div>" : "";
    return '<button class="tile-btn gp-card" data-open="' + esc(p.id) + '">' +
      '<div class="gp-top"><span class="gp-sig">' + esc(g.sigla || "") + '</span><div class="gp-names"><div class="gp-name">' + esc(p.nome) + '</div><div class="gp-clients">' + esc(clientesNomes(p) || "Sem cliente") + "</div></div>" + avatarPessoa(g.resp, true) + "</div>" +
      '<div class="gp-etapa">' + trilha(g) + "<span>" + etapaLinha(g) + "</span></div>" +
      sitPill(g) +
      '<div class="gp-next">' + (g.proximo ? "Próximo: " + esc(g.proximo) : '<span class="muted">Sem próximo passo definido</span>') + "</div>" + legal +
      '<div class="tile-stats"><div><small>Pranchas</small><b>' + (pr.length ? prontas(pr) + "/" + pr.length : "—") + "</b></div>" +
      "<div><small>Prazo</small><b>" + (pz ? (pz.pausado ? "pausado" : pz.resta >= 0 ? pz.resta + " d.u." : "vencido") : "—") + "</b></div>" +
      "<div><small>Horas</small><b>" + (h ? T.fmtH(h) : "—") + "</b></div></div></button>";
  }
  function renderLista() {
    var list = projetosGestor();
    var q = S.busca.trim().toLowerCase();
    if (q) list = list.filter(function (p) { return (p.nome + " " + (p.codigo || "") + " " + clientesNomes(p)).toLowerCase().indexOf(q) >= 0; });
    var pid = null;
    list = list.filter(function (p) {
      var g = G(p.id), s = situacao(g);
      if (S.filtro === "aguardando") return s.k === "wait" || (s.k === "bad" && s.quem);
      if (S.filtro === "suspensos") return !!g.suspenso;
      if (S.filtro === "meus") return !!T.state.pessoaId ? g.resp === T.state.pessoaId : true;
      return true;
    });
    var todos = projetosGestor(), n = { and: 0, ag: 0, sus: 0, prop: 0 };
    todos.forEach(function (p) { var g = G(p.id); if (g.etapa === "encerrado") return; if (g.etapa === "briefing") n.prop++; else n.and++; if (g.suspenso) n.sus++; else if (esperaAberta(g)) n.ag++; });
    $("gp-resumo").innerHTML = [["Em andamento", n.and], ["Aguardando", n.ag], ["Suspensos", n.sus], ["Em proposta", n.prop]].map(function (x) { return '<div class="tile"><small>' + x[0] + "</small><b>" + x[1] + "</b></div>"; }).join("");
    var av = avisos();
    $("gp-avisos").innerHTML = av.map(function (a) { return '<button class="gp-aviso ' + a[0] + '" data-open="' + esc(a[2]) + '">' + a[1] + "</button>"; }).join("");
    var grupos = [["briefing", "Em proposta · Briefing"], ["ep", "Estudo Preliminar"], ["ap", "Anteprojeto"], ["pe", "Projeto Executivo"]];
    function urg(p) { var s = situacao(G(p.id)); return s.k === "bad" ? 0 : s.k === "wait" ? 1 : 2; }
    var html = grupos.map(function (gr) {
      var itens = list.filter(function (p) { return G(p.id).etapa === gr[0]; }).sort(function (a, b) { return urg(a) - urg(b) || a.nome.localeCompare(b.nome); });
      if (!itens.length) return "";
      return '<div class="gp-group"><h3 class="cover-label">' + esc(gr[1]) + " · " + itens.length + '</h3><div class="gp-cards">' + itens.map(cardProjeto).join("") + "</div></div>";
    }).join("");
    var enc = list.filter(function (p) { return G(p.id).etapa === "encerrado"; });
    if (enc.length) html += '<details class="gp-group"><summary class="cover-label">Encerrados · ' + enc.length + '</summary><div class="gp-cards">' + enc.map(cardProjeto).join("") + "</div></details>";
    if (!todos.length) html = '<div class="card gp-empty"><h3 class="panel-title">Nenhum projeto no Gestor ainda</h3><p>Crie o primeiro projeto com “+ Novo projeto”. Para ver o app funcionando, carregue os projetos de exemplo: eles podem ser apagados depois.</p><div class="form-actions"><button class="btn btn-primary" id="gp-seed">Carregar projetos de exemplo</button></div></div>';
    else if (!html) html = '<div class="empty">Nenhum projeto neste filtro.</div>';
    $("gp-grupos").innerHTML = html;
  }

  // ---------- painel do projeto ----------
  var ABAS = [["geral", "Visão geral"], ["pranchas", "Pranchas"], ["tarefas", "Tarefas"], ["programa", "Programa"], ["ficha", "Ficha"]];
  function renderProjeto() {
    var p = proj(S.projId), g = G(S.projId);
    if (!g) { S.view = "lista"; return render(); }
    $("gp-p-head").innerHTML = '<button class="link" data-voltar="1">← Todos os projetos</button>' +
      '<div class="gp-p-title"><span class="gp-sig">' + esc(g.sigla) + '</span><div><h2 class="gp-name gp-p-name">' + esc(p.nome) + '</h2><div class="section-meta">' + esc(p.codigo || "") + " · " + esc(clientesNomes(p) || "sem cliente") + "</div></div>" + sitPill(g) + "</div>" +
      '<div class="segmented gp-abas">' + ABAS.map(function (a) { return '<button class="seg-pill' + (S.tab === a[0] ? " is-selected" : "") + '" data-tab="' + a[0] + '">' + a[1] + "</button>"; }).join("") + "</div>";
    var body = S.tab === "pranchas" ? abaPranchas(g) : S.tab === "tarefas" ? abaTarefas(g) : S.tab === "programa" ? abaPrograma(g, p) : S.tab === "ficha" ? abaFicha(g, p) : abaGeral(g, p);
    $("gp-p-body").innerHTML = body;
  }
  function abaGeral(g, p) {
    var f = fluxo(g.sigla), i = f.indexOf(g.etapa), et = ETAPAS[g.etapa] || {};
    var steps = '<div class="gp-steps">' + f.map(function (e, k) {
      var info = (g.etapas || {})[e] || {}, cls = k < i ? "done" : k === i ? "cur" : "";
      var sub = k < i ? (info.termoEm ? "termo " + T.fmtYmd(info.termoEm) : "concluída") : k === i ? (e === "encerrado" ? T.fmtYmd(info.inicio) : "em curso") : "";
      return '<div class="gp-step ' + cls + '"><i>' + (k < i ? "✓" : k + 1) + "</i><b>" + esc(ETAPAS[e].nome) + "</b><small>" + esc(sub) + "</small></div>";
    }).join("") + "</div>";
    var pz = prazoInfo(g), pr = pranchasEtapa(g, g.etapa);
    var fase = et.fases ? '<div class="field"><label for="gp-fase">Fase</label><select id="gp-fase">' + et.fases.map(function (n, k) { return '<option value="' + (k + 1) + '"' + (+g.fase === k + 1 ? " selected" : "") + ">" + (k + 1) + " · " + esc(n) + "</option>"; }).join("") + "</select></div>" : "";
    var avanco = g.etapa === "encerrado" ? '<p class="hint">Projeto encerrado. Obras e acompanhamento ficam no futuro app de obra.</p>' : blocoAvanco(g);
    var e = esperaAberta(g);
    var sit = '<div class="card gp-box"><h3 class="panel-title">Situação</h3>' +
      (g.suspenso ? '<p>Suspenso desde ' + T.fmtYmd(g.suspenso.desde) + '. Sai da lista de prioridades até ser reativado.</p><div class="form-actions"><button class="btn btn-small btn-primary" data-act="reativar">Reativar projeto</button></div>' :
        e ? "<p>Aguardando <b>" + esc(nomeQuem(e.quem)) + "</b> desde " + T.fmtYmd(e.inicio) + (e.previsto ? " · retorno previsto " + T.fmtYmd(e.previsto) : "") + ". O prazo está pausado.</p>" +
          '<div class="form-actions"><button class="btn btn-small btn-primary" data-act="retomar">Retomou: voltar a em dia</button>' + (e.quem === "cliente" ? '<button class="btn btn-small" data-act="suspender">Suspender</button>' : "") + "</div>" :
          '<p class="hint">Em dia. Marque quando o projeto parar esperando alguém: o prazo pausa sozinho.</p><div class="gp-wait-form"><select id="gp-quem">' + QUEM.map(function (q) { return '<option value="' + q[0] + '">Aguardando ' + q[1] + "</option>"; }).join("") + '</select><input type="date" id="gp-previsto" title="Retorno previsto (opcional)"><button class="btn btn-small" data-act="aguardar">Marcar</button></div>'
      ) + "</div>";
    var legal = temLegal(g) || g.legal === "nao_se_aplica" ? '<div class="card gp-box"><h3 class="panel-title">Projeto Legal</h3><select id="gp-legal">' + T.optHtml(LEGAL, g.legal) + '</select><p class="hint">Corre em paralelo ao Anteprojeto. O Executivo só abre com o Legal aprovado.</p></div>' : "";
    var marco = '<div class="card gp-box"><h3 class="panel-title">Marco zero</h3>' + MARCO.map(function (m) { var on = (g.marco || {})[m[0]]; return '<label class="gp-check"><input type="checkbox" data-marco="' + m[0] + '"' + (on ? " checked" : "") + "> " + esc(m[1]) + "</label>"; }).join("") + '<p class="hint">Pelo contrato, o prazo começa com contrato, 1ª parcela e topográfico.</p></div>';
    var numeros = '<div class="tiles gp-nums"><div class="tile"><small>Prazo da etapa</small><b>' + (pz ? pz.usados + " / " + pz.prazo + " d.u." : "—") + "</b><span>" + (pz ? (pz.pausado ? "pausado" : pz.resta >= 0 ? "restam " + pz.resta : "vencido") : "sem prazo nesta etapa") + "</span></div>" +
      '<div class="tile"><small>Pranchas da etapa</small><b>' + (pr.length ? prontas(pr) + " / " + pr.length : "—") + "</b><span>prontas</span></div>" +
      '<div class="tile"><small>Horas no projeto</small><b>' + T.fmtH(horasProj(p.id)) + "</b><span>pelo cronômetro</span></div></div>";
    return steps + numeros +
      '<div class="gp-cols"><div class="card gp-box"><h3 class="panel-title">' + esc(et.nome || "") + "</h3>" + fase +
      '<div class="field"><label for="gp-proximo">Próximo passo</label><input id="gp-proximo" value="' + esc(g.proximo || "") + '" placeholder="Ex.: apresentar o Estudo Preliminar"></div>' +
      '<div class="field"><label for="gp-resp">Responsável</label><select id="gp-resp">' + optPessoas(g.resp, "Sem responsável") + "</select></div>" + avanco + "</div>" +
      '<div class="gp-side">' + sit + legal + (g.etapa === "briefing" ? marco : "") + "</div></div>" +
      historico(g);
  }
  function blocoAvanco(g) {
    var f = fluxo(g.sigla), prox = f[f.indexOf(g.etapa) + 1], falta = [], bloqueio = false, rotulo;
    if (g.etapa === "briefing") {
      rotulo = "Iniciar Estudo Preliminar (marco zero)";
      MARCO.slice(0, 3).forEach(function (m) { if (!(g.marco || {})[m[0]]) falta.push(m[1]); });
    } else {
      rotulo = "Registrar " + ETAPAS[g.etapa].termo + (prox === "encerrado" ? "" : " e abrir " + ETAPAS[prox].nome);
      if (prox === "pe" && temLegal(g) && g.legal !== "aprovado") { falta.push("Projeto Legal aprovado"); bloqueio = true; }
    }
    var txt = falta.length ? '<p class="hint warn">Falta: ' + esc(falta.join(", ")) + ".</p>" : "";
    if (bloqueio) return '<div class="gp-avanco">' + txt + '<p class="hint">O Executivo só abre com o Projeto Legal aprovado. Sem exceção.</p></div>';
    var antecip = falta.length ? '<label class="gp-check"><input type="checkbox" id="gp-antecipa"> Antecipação autorizada pela direção, com Termo de Ciência assinado pelo cliente</label>' : "";
    return '<div class="gp-avanco">' + txt + antecip + '<div class="form-actions"><input type="date" id="gp-termo-data" value="' + hojeIso() + '" aria-label="Data"><button class="btn btn-primary btn-small" data-act="avancar">' + esc(rotulo) + "</button></div></div>";
  }
  function historico(g) {
    var ev = (g.eventos || []).slice(-8).reverse();
    if (!ev.length) return "";
    return '<div class="card gp-box"><h3 class="panel-title">Registro</h3><ul class="gp-log">' + ev.map(function (x) { return "<li><span>" + T.fmtYmd(x.data) + "</span>" + esc(x.txt) + "</li>"; }).join("") + "</ul></div>";
  }
  function evento(g, txt, data) { g.eventos = g.eventos || []; g.eventos.push({ data: data || hojeIso(), txt: txt }); }

  function abaPranchas(g) {
    var pr = ordenarPranchas(g.pranchas || []), ids = idsPranchas(pr), fil = S.serieFiltro;
    var filtros = '<div class="segmented">' + [["todas", "Todas"], ["ap", "Anteprojeto"], ["pe", "Executivo"], ["pendentes", "Pendentes"]].map(function (x) { return '<button class="seg-pill' + (fil === x[0] ? " is-selected" : "") + '" data-sfil="' + x[0] + '">' + x[1] + "</button>"; }).join("") + "</div>";
    var html = SERIES.map(function (s) {
      var itens = pr.filter(function (x) { return x.serie === s[0]; });
      var vis = itens.filter(function (x) { return fil === "todas" || (fil === "pendentes" ? x.sit !== "pronto" && x.sit !== "entregue" : x.etapa === fil); });
      if (!itens.length && s[0] === 900) return '<div class="gp-serie"><div class="gp-serie-h"><b>900</b> Marcenaria <span class="hint">só quando o serviço for contratado</span><button class="link" data-addserie="900">+ Ativar série</button></div></div>';
      if (!vis.length && fil !== "todas") return "";
      return '<div class="gp-serie"><div class="gp-serie-h"><b>' + s[0] + "</b> " + esc(s[1]) + ' <span class="hint">' + prontas(itens) + "/" + itens.length + " prontas</span></div>" +
        vis.map(function (x) {
          var k = itens.indexOf(x);
          return '<div class="pr-row"><span class="pr-id num">' + ids[x.id] + '</span><span class="pr-tit">' + esc(x.titulo) + ' <em class="pr-et">' + (x.etapa === "ap" ? "AP" : "PE") + " · " + esc(x.rev || "R00") + "</em></span>" +
            '<select class="pr-resp" data-presp="' + x.id + '" aria-label="Responsável">' + optPessoas(x.resp, "—") + "</select>" +
            '<button class="sit-btn s-' + x.sit + '" data-psit="' + x.id + '" title="Clique para avançar a situação">' + esc(sitNome(x.sit)) + "</button>" +
            '<span class="pr-act"><button class="link" data-pmove="' + x.id + '" data-dir="-1"' + (k === 0 ? " disabled" : "") + ' aria-label="Subir">↑</button><button class="link" data-pmove="' + x.id + '" data-dir="1"' + (k === itens.length - 1 ? " disabled" : "") + ' aria-label="Descer">↓</button><button class="link danger" data-pdel="' + x.id + '" aria-label="Remover">✕</button></span></div>';
        }).join("") +
        (fil === "todas" ? '<form class="pr-add" data-addp="' + s[0] + '"><input placeholder="+ nova prancha na série ' + s[0] + '" aria-label="Nova prancha"><button class="btn btn-small">Adicionar</button></form>' : "") + "</div>";
    }).join("");
    return '<div class="section-head"><div class="section-meta">Número = série + posição. Mover, incluir ou remover renumera a série.</div>' + filtros + "</div>" + html;
  }
  function sitNome(k) { var x = SIT.filter(function (o) { return o[0] === k; })[0]; return x ? x[1] : k; }

  function abaTarefas(g) {
    var tf = (g.tarefas || []).slice().sort(function (a, b) { return (a.feita ? 1 : 0) - (b.feita ? 1 : 0) || String(a.prazo || "9").localeCompare(String(b.prazo || "9")); });
    var pr = ordenarPranchas(g.pranchas || []), ids = idsPranchas(pr);
    var form = '<form class="card gp-box grid-form" id="gp-tf-form"><div class="field col-6"><label for="tf-txt">Tarefa</label><input id="tf-txt" required placeholder="Ex.: ajustar layout da suíte após reunião"></div>' +
      '<div class="field col-3"><label for="tf-resp">Responsável</label><select id="tf-resp">' + optPessoas(g.resp, "—") + "</select></div>" +
      '<div class="field col-3"><label for="tf-prazo">Prazo</label><input type="date" id="tf-prazo"></div>' +
      '<div class="field col-9"><label for="tf-pr">Prancha (opcional)</label><select id="tf-pr"><option value="">Da etapa, sem prancha</option>' + pr.map(function (x) { return '<option value="' + x.id + '">' + ids[x.id] + " · " + esc(x.titulo) + "</option>"; }).join("") + "</select></div>" +
      '<div class="col-3 form-actions" style="align-self:end"><button class="btn btn-primary">Adicionar tarefa</button></div></form>';
    var hoje = hojeIso();
    var lista = tf.length ? tf.map(function (t) {
      var atras = !t.feita && t.prazo && t.prazo < hoje, p = t.prancha ? T.byId(pr, t.prancha) : null;
      return '<div class="task' + (t.feita ? " is-done" : "") + '"><div class="task-top"><input type="checkbox" class="task-check" data-tfdone="' + t.id + '"' + (t.feita ? " checked" : "") + ' aria-label="Concluir"><div class="task-main"><div class="task-title-row"><span class="task-title">' + esc(t.txt) + '</span><button class="link danger" data-tfdel="' + t.id + '" aria-label="Excluir">✕</button></div>' +
        '<div class="task-badges"><span class="badge static">' + esc((T.pessoa(t.resp) || { nome: "Sem responsável" }).nome) + "</span>" + (t.prazo ? '<span class="badge static' + (atras ? " is-overdue" : "") + '">' + T.fmtYmd(t.prazo) + (atras ? " · atrasada" : "") + "</span>" : "") + (p ? '<span class="badge static">' + ids[p.id] + " · " + esc(p.titulo) + "</span>" : "") + "</div></div></div></div>";
    }).join("") : '<div class="empty">Nenhuma tarefa neste projeto.</div>';
    return form + '<div class="task-list">' + lista + "</div>";
  }

  function abaPrograma(g, p) {
    var amb = g.ambientes || [], pavs = g.pavs || ["Térreo"], dim = (p.categorias || {}).dimensao || "confortavel";
    var tot = 0, porSetor = {};
    amb.forEach(function (a) { var ar = (+a.area || 0) * (+a.qtd || 1); tot += ar; porSetor[a.setor] = (porSetor[a.setor] || 0) + ar; });
    var resumo = '<div class="tiles gp-nums">' + SETORES.filter(function (s) { return porSetor[s[0]]; }).map(function (s) { return '<div class="tile"><small>' + s[1] + "</small><b>" + T.fmtNum(porSetor[s[0]]) + " m²</b></div>"; }).join("") +
      '<div class="tile"><small>Total estimado</small><b>' + T.fmtNum(tot * 1.2) + " m²</b><span>" + T.fmtNum(tot) + " m² + 10% circulação + 10% paredes</span></div></div>";
    var add = '<form class="pr-add" id="gp-amb-add"><select id="amb-tipo" aria-label="Tipo de ambiente">' + CATALOGO.map(function (t) { return '<option value="' + t.id + '">' + esc(t.n) + "</option>"; }).join("") + '</select><button class="btn btn-small">+ Ambiente</button><button type="button" class="btn btn-small" data-act="sync-plano">Atualizar pranchas pelo programa</button></form>';
    var html = SETORES.map(function (s) {
      var itens = amb.filter(function (a) { return a.setor === s[0]; }); if (!itens.length) return "";
      return '<div class="gp-serie"><div class="gp-serie-h"><b>' + s[1] + "</b></div>" + itens.map(function (a) {
        var t = tipoAmb(a.tipo), open = S.openAmb === a.id, resumoCfg = resumoConfig(a);
        return '<div class="amb' + (open ? " open" : "") + '"><button class="amb-row" data-amb="' + a.id + '"><span class="amb-n">' + esc(a.nome) + (a.qtd > 1 ? " ×" + a.qtd : "") + '</span><span class="amb-m">' + esc(a.pav || "—") + " · " + (a.area != null ? T.fmtNum(a.area) + " m²" : "área a definir") + (t.amp ? " · ampliação" : "") + '</span><span class="amb-c">' + esc(resumoCfg || "Sem configuração") + "</span></button>" +
          (open ? editorAmb(a, t, pavs) : "") + "</div>";
      }).join("") + "</div>";
    }).join("") || '<div class="empty">Programa vazio. Adicione os ambientes do projeto.</div>';
    return '<div class="section-head"><div class="section-meta">Dimensão: <b>' + esc((DIMENSAO.filter(function (d) { return d[0] === dim; })[0] || ["", "—"])[1]) + "</b> · áreas de referência do catálogo (Confortável). Clique num ambiente para ver e editar a configuração.</div></div>" + resumo + add + html;
  }
  function resumoConfig(a) {
    var c = a.cfg || {}, t = tipoAmb(a.tipo);
    return (t.c || []).map(function (k) {
      var v = c[k], d = CAMPOS[k]; if (v == null || v === "" || (Array.isArray(v) && !v.length) || v === false) return null;
      if (d.t === "bool") return d.l; if (Array.isArray(v)) return d.l + ": " + v.join(", "); return d.l + ": " + v;
    }).filter(Boolean).join(" · ");
  }
  function editorAmb(a, t, pavs) {
    var c = a.cfg || {};
    var campos = (t.c || []).map(function (k) {
      var d = CAMPOS[k], v = c[k], id = "ac-" + k;
      if (d.t === "bool") return '<label class="gp-check"><input type="checkbox" data-cfg="' + k + '"' + (v ? " checked" : "") + "> " + esc(d.l) + "</label>";
      if (d.t === "multi") return '<div class="field col-12"><span class="label">' + esc(d.l) + '</span><div class="gp-multi">' + d.o.map(function (o) { return '<label class="gp-check"><input type="checkbox" data-cfgm="' + k + '" value="' + esc(o) + '"' + ((v || []).indexOf(o) >= 0 ? " checked" : "") + "> " + esc(o) + "</label>"; }).join("") + "</div></div>";
      if (d.t === "sel") return '<div class="field col-4"><label for="' + id + '">' + esc(d.l) + '</label><select id="' + id + '" data-cfg="' + k + '"><option value="">—</option>' + d.o.map(function (o) { return "<option" + (v === o ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("") + "</select></div>";
      if (d.t === "num") return '<div class="field col-3"><label for="' + id + '">' + esc(d.l) + '</label><input type="number" min="0" id="' + id + '" data-cfg="' + k + '" value="' + (v != null ? v : "") + '"></div>';
      return '<div class="field col-6"><label for="' + id + '">' + esc(d.l) + '</label><input id="' + id + '" data-cfg="' + k + '" value="' + esc(v || "") + '"></div>';
    }).join("");
    return '<div class="amb-ed grid-form" data-ambed="' + a.id + '">' +
      '<div class="field col-4"><label for="ae-nome">Nome</label><input id="ae-nome" data-af="nome" value="' + esc(a.nome) + '"></div>' +
      '<div class="field col-3"><label for="ae-pav">Pavimento</label><select id="ae-pav" data-af="pav"><option value="">—</option>' + pavs.map(function (p) { return "<option" + (a.pav === p ? " selected" : "") + ">" + esc(p) + "</option>"; }).join("") + "</select></div>" +
      '<div class="field col-2"><label for="ae-qtd">Qtd.</label><input id="ae-qtd" type="number" min="1" data-af="qtd" value="' + (a.qtd || 1) + '"></div>' +
      '<div class="field col-3"><label for="ae-area">Área (m²)</label><input id="ae-area" type="number" min="0" step="0.5" data-af="area" value="' + (a.area != null ? a.area : "") + '"></div>' +
      campos +
      '<div class="field col-12"><label for="ae-obs">Pedido do cliente / observações</label><textarea id="ae-obs" rows="2" data-af="obs">' + esc(a.obs || "") + "</textarea></div>" +
      '<div class="col-12 form-actions"><button class="btn btn-small btn-primary" data-ambsave="' + a.id + '">Salvar ambiente</button><button class="link danger" data-ambdel="' + a.id + '">Remover ambiente</button></div></div>';
  }

  function abaFicha(g, p) {
    var cat = p.categorias || {}, dir = g.diretrizes || {}, clientes = (T.cadastros ? T.cadastros.contatos("cliente") : []);
    var cl = clientes.length ? clientes.map(function (c) { return '<label class="gp-check"><input type="checkbox" data-fcli="' + esc(c.id) + '"' + ((p.clienteIds || []).indexOf(c.id) >= 0 ? " checked" : "") + "> " + esc(c.nome) + "</label>"; }).join("") : '<span class="hint">Nenhum cliente cadastrado. Cadastre em Cadastros → Contatos.</span>';
    function sel(id, opts, v) { return '<select id="' + id + '">' + T.optHtml([["", "—"]].concat(opts), v || "") + "</select>"; }
    function ta(k, l) { return '<div class="field col-6"><label for="fd-' + k + '">' + l + '</label><textarea id="fd-' + k + '" rows="3">' + esc(dir[k] || "") + "</textarea></div>"; }
    return '<form class="card gp-box grid-form" id="gp-ficha">' +
      '<div class="field col-6"><label for="f-nome">Nome do projeto</label><input id="f-nome" value="' + esc(p.nome) + '" required></div>' +
      '<div class="field col-3"><label for="f-cod">Código</label><input id="f-cod" value="' + esc(p.codigo || "") + '"></div>' +
      '<div class="field col-3"><label for="f-sig">Tipo</label>' + sel("f-sig", SIGLAS.map(function (s) { return [s[0], s[0] + " · " + s[1]]; }), g.sigla) + "</div>" +
      '<div class="field col-12"><span class="label">Clientes</span><div class="gp-multi">' + cl + "</div></div>" +
      '<div class="field col-4"><label for="f-pad">Padrão</label>' + sel("f-pad", PADRAO, cat.padrao) + "</div>" +
      '<div class="field col-4"><label for="f-dim">Dimensão</label>' + sel("f-dim", DIMENSAO, cat.dimensao) + "</div>" +
      '<div class="field col-4"><label for="f-dif">Dificuldade do terreno</label>' + sel("f-dif", DIFICULDADE, cat.dificuldade) + "</div>" +
      '<div class="field col-6"><label for="f-end">Endereço da obra</label><input id="f-end" value="' + esc(p.endereco || "") + '"></div>' +
      '<div class="field col-6"><label for="f-pavs">Pavimentos (um por linha)</label><textarea id="f-pavs" rows="2">' + esc((g.pavs || []).join("\n")) + "</textarea></div>" +
      '<div class="field col-6"><label for="f-pasta">Pasta do projeto (link)</label><input id="f-pasta" value="' + esc(g.pasta || "") + '"></div>' +
      '<div class="field col-6"><label for="f-bimx">BIMx (link)</label><input id="f-bimx" value="' + esc(g.bimx || "") + '"></div>' +
      '<div class="col-12"><label class="gp-check"><input type="checkbox" id="f-marc"' + (g.marcenaria ? " checked" : "") + "> Marcenaria contratada (ativa a série 900)</label></div>" +
      '<div class="col-12"><div class="hint" style="text-transform:uppercase;letter-spacing:.6px;font-size:11.5px">Diretrizes do briefing</div></div>' +
      ta("uso", "Uso, moradores e pets, acessibilidade") + ta("expectativas", "Expectativas do cliente") + ta("estetica", "Estética e materiais") + ta("relacao", "Relação com exterior, paisagismo e rua") + ta("sistemas", "Sistemas (solar, reúso, ar, aquecimento, automação)") + ta("execucao", "Sistema construtivo e execução da obra") +
      '<div class="col-12 form-actions"><button class="btn btn-primary" id="f-save">Salvar ficha</button><button type="button" class="link danger" data-act="apagar">Apagar projeto do Gestor</button></div></form>' +
      (S.confirmDel === p.id ? '<div class="confirm-box">Apagar o projeto do Gestor? As horas lançadas continuam no Tempo. <button class="btn btn-small btn-stop" data-act="apagar-ok">Apagar</button><button class="btn btn-small" data-act="apagar-nao">Cancelar</button></div>' : "");
  }

  // ---------- novo projeto (assistente) ----------
  function wizInicial() {
    return { step: 1, sigla: "RES", nome: "", codigo: "", codManual: false, clienteIds: [], novoCli: { nome: "", contato: "", email: "" }, padrao: "", dimensao: "confortavel", dificuldade: "", npav: 1, pavs: ["Térreo"], marcenaria: false, resp: T.pessoasAtivas()[0] ? T.pessoasAtivas()[0].id : null, qtd: T.clone(PADRAO_RES) };
  }
  function codigoDe(sigla, nome) { return sigla + "-" + String(nome || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, ""); }
  function renderNovo() {
    var w = S.wiz, h = '<div class="card gp-box"><div class="gp-wiz-steps">' + ["Projeto e cliente", "Pavimentos", "Programa de necessidades"].map(function (n, k) { return '<span class="' + (w.step === k + 1 ? "cur" : w.step > k + 1 ? "done" : "") + '">' + (k + 1) + " · " + n + "</span>"; }).join("") + "</div>";
    if (w.step === 1) {
      var clientes = T.cadastros ? T.cadastros.contatos("cliente") : [];
      h += '<div class="grid-form">' +
        '<div class="field col-12"><span class="label">Tipo</span><div class="segmented">' + SIGLAS.map(function (s) { return '<button type="button" class="seg-pill' + (w.sigla === s[0] ? " is-selected" : "") + '" data-wsig="' + s[0] + '">' + s[0] + " · " + s[1] + "</button>"; }).join("") + "</div></div>" +
        '<div class="field col-6"><label for="w-nome">Nome do projeto</label><input id="w-nome" data-w="nome" value="' + esc(w.nome) + '" placeholder="Ex.: Casa Duarte"></div>' +
        '<div class="field col-6"><label for="w-cod">Código</label><input id="w-cod" data-w="codigo" value="' + esc(w.codigo || codigoDe(w.sigla, w.nome)) + '"><span class="hint">Sigla + nome, sem acentos. Pode ajustar.</span></div>' +
        '<div class="field col-12"><span class="label">Clientes cadastrados</span><div class="gp-multi">' + (clientes.length ? clientes.map(function (c) { return '<label class="gp-check"><input type="checkbox" data-wcli="' + esc(c.id) + '"' + (w.clienteIds.indexOf(c.id) >= 0 ? " checked" : "") + "> " + esc(c.nome) + "</label>"; }).join("") : '<span class="hint">Nenhum cliente cadastrado ainda.</span>') + "</div></div>" +
        '<div class="field col-4"><label for="w-cn">+ Novo cliente: nome</label><input id="w-cn" data-wn="nome" value="' + esc(w.novoCli.nome) + '"></div>' +
        '<div class="field col-4"><label for="w-cc">Contato</label><input id="w-cc" data-wn="contato" value="' + esc(w.novoCli.contato) + '"></div>' +
        '<div class="field col-4"><label for="w-ce">E-mail</label><input id="w-ce" data-wn="email" value="' + esc(w.novoCli.email) + '"></div>' +
        '<div class="field col-4"><label for="w-pad">Padrão</label><select id="w-pad" data-w="padrao">' + T.optHtml([["", "—"]].concat(PADRAO), w.padrao) + "</select></div>" +
        '<div class="field col-4"><label for="w-dim">Dimensão</label><select id="w-dim" data-w="dimensao">' + T.optHtml(DIMENSAO, w.dimensao) + "</select></div>" +
        '<div class="field col-4"><label for="w-dif">Dificuldade do terreno</label><select id="w-dif" data-w="dificuldade">' + T.optHtml([["", "A definir após a visita"]].concat(DIFICULDADE), w.dificuldade) + "</select></div></div>";
    } else if (w.step === 2) {
      h += '<div class="grid-form"><div class="field col-3"><label for="w-npav">Pavimentos</label><input id="w-npav" type="number" min="1" max="12" value="' + w.npav + '"></div>' +
        '<div class="field col-9"><span class="label">Nome de cada pavimento</span><div class="gp-pavs">' + w.pavs.map(function (p, k) { return '<input data-wpav="' + k + '" value="' + esc(p) + '" aria-label="Pavimento ' + (k + 1) + '">'; }).join("") + "</div></div>" +
        '<div class="field col-6"><label for="w-resp">Responsável</label><select id="w-resp" data-w="resp">' + optPessoas(w.resp, "—") + "</select></div>" +
        '<div class="col-6" style="align-self:end"><label class="gp-check"><input type="checkbox" id="w-marc"' + (w.marcenaria ? " checked" : "") + "> Marcenaria contratada</label></div></div>";
    } else {
      h += '<p class="hint">Quantidade de cada ambiente. A área vem da referência (Confortável) e pode ser ajustada depois, assim como a configuração de cada ambiente.</p><div class="gp-qtd">' +
        SETORES.map(function (s) {
          var ts = CATALOGO.filter(function (t) { return t.s === s[0] && t.id !== "outro"; }); if (!ts.length) return "";
          return '<div><div class="gp-serie-h"><b>' + s[1] + "</b></div>" + ts.map(function (t) { return '<label class="gp-qrow"><span>' + esc(t.n) + (t.a ? ' <em>' + T.fmtNum(t.a) + " m²</em>" : "") + '</span><input type="number" min="0" max="20" data-wq="' + t.id + '" value="' + (w.qtd[t.id] || 0) + '"></label>'; }).join("") + "</div>";
        }).join("") + '</div><div class="note" id="w-prev"></div>';
    }
    h += '<div class="form-actions" style="margin-top:16px">' + (w.step > 1 ? '<button class="btn" data-wstep="-1">Voltar</button>' : '<button class="btn" data-wcancel="1">Cancelar</button>') +
      (w.step < 3 ? '<button class="btn btn-primary" data-wstep="1">Próximo</button>' : '<button class="btn btn-primary" id="w-criar">Criar projeto</button>') + "</div></div>";
    $("gp-novo").innerHTML = h;
    if (w.step === 3) previewWiz();
  }
  function previewWiz() {
    var w = S.wiz, amb = ambientesDeQtd(w.qtd, w.pavs[0]), pr = gerarPlano({ sigla: w.sigla, pavs: w.pavs, ambientes: amb, marcenaria: w.marcenaria });
    var area = amb.reduce(function (s, a) { return s + (+a.area || 0) * (+a.qtd || 1); }, 0), cont = {};
    pr.forEach(function (x) { cont[x.serie] = (cont[x.serie] || 0) + 1; });
    var el = $("w-prev"); if (!el) return;
    el.innerHTML = '<div><div class="note-title">Prévia do projeto</div><div class="note-body">' + amb.length + " ambientes · <b>" + T.fmtNum(area * 1.2) + " m²</b> estimados · <b>" + pr.length + " pranchas</b> no plano (" + Object.keys(cont).map(function (s) { return s + ": " + cont[s]; }).join(" · ") + ")</div></div>";
  }
  async function criarProjeto() {
    var w = S.wiz, nome = w.nome.trim(); if (!nome) { w.step = 1; renderNovo(); T.toast("Dê um nome ao projeto."); return; }
    var btn = $("w-criar");
    await T.saveWith(btn, async function () {
      var ids = w.clienteIds.slice();
      if (w.novoCli.nome.trim() && T.cadastros) ids.push(await T.cadastros.criarContato({ tipos: ["cliente"], nome: w.novoCli.nome.trim(), contato: w.novoCli.contato.trim(), email: w.novoCli.email.trim() }));
      var amb = ambientesDeQtd(w.qtd, w.pavs[0]), area = amb.reduce(function (s, a) { return s + (+a.area || 0) * (+a.qtd || 1); }, 0);
      var nomesCli = ids.map(function (id) { var c = T.cadastros && T.cadastros.contato(id); return c ? c.nome : ""; }).filter(Boolean);
      var ref = await T.db.collection("projetos").add({ nome: nome, codigo: (w.codigo || codigoDe(w.sigla, nome)).trim(), sigla: w.sigla, tipo: TIPO_ANTIGO[w.sigla], cliente: nomesCli.join(" e "), clienteIds: ids,
        categorias: { padrao: w.padrao || null, dimensao: w.dimensao, dificuldade: w.dificuldade || null }, area: Math.round(area * 1.2), status: "ativo", criadoEm: new Date().toISOString() });
      var g = { sigla: w.sigla, etapa: "briefing", fase: null, etapas: { briefing: { inicio: new Date().toISOString() } }, resp: w.resp || null, proximo: "Receber o briefing e montar a proposta",
        legal: fluxo(w.sigla).indexOf("ap") >= 0 ? "nao_iniciado" : "nao_se_aplica", marco: {}, esperas: [], pavs: w.pavs, marcenaria: w.marcenaria, ambientes: amb, pranchas: gerarPlano({ sigla: w.sigla, pavs: w.pavs, ambientes: amb, marcenaria: w.marcenaria }), tarefas: [], eventos: [{ data: hojeIso(), txt: "Projeto criado no briefing" }], criadoEm: new Date().toISOString() };
      S.gp[ref.id] = g;
      await T.db.doc("gp/" + ref.id).set(g);
      S.wiz = null; S.view = "projeto"; S.projId = ref.id; S.tab = "geral";
    });
    T.scheduleRender();
  }

  // ---------- ações ----------
  async function avancar() {
    var g = G(S.projId), f = fluxo(g.sigla), prox = f[f.indexOf(g.etapa) + 1], data = ($("gp-termo-data") || {}).value || hojeIso();
    var faltaMarco = g.etapa === "briefing" && !marcoOk(g), antecipa = $("gp-antecipa") && $("gp-antecipa").checked;
    if (faltaMarco && !antecipa) { T.toast("Marque o marco zero ou a antecipação autorizada."); return; }
    if (prox === "pe" && temLegal(g) && g.legal !== "aprovado") return;
    var iso = new Date(data + "T12:00:00").toISOString();
    await salvar(S.projId, function (x) {
      x.etapas = x.etapas || {}; x.etapas[x.etapa] = Object.assign({}, x.etapas[x.etapa], { fim: iso, termoEm: x.etapa === "briefing" ? null : data });
      evento(x, x.etapa === "briefing" ? (antecipa && faltaMarco ? "Estudo Preliminar iniciado por antecipação (termo de ciência)" : "Marco zero: Estudo Preliminar iniciado") : ETAPAS[x.etapa].termo + " registrado (" + ETAPAS[x.etapa].nome + ")", data);
      x.etapa = prox; x.fase = ETAPAS[prox].fases ? 1 : null; x.etapas[prox] = { inicio: iso };
      x.proximo = prox === "encerrado" ? "" : x.proximo;
      if (prox === "encerrado") { x.esperas = (x.esperas || []).map(function (e) { if (!e.fim) e.fim = iso; return e; }); }
    });
    if (prox === "encerrado") await salvarProjeto(S.projId, { status: "concluido" });
    T.toast(prox === "encerrado" ? "Projeto encerrado" : ETAPAS[prox].nome + " aberto");
  }
  function cicloSit(k) { var i = SIT.map(function (o) { return o[0]; }).indexOf(k); return SIT[(i + 1) % SIT.length][0]; }
  function mudarPrancha(pid, id, fn) { return salvar(pid, function (x) { var pr = T.byId(x.pranchas || [], id); if (pr) fn(pr, x); }); }
  function moverPrancha(id, dir) {
    salvar(S.projId, function (x) {
      var p = T.byId(x.pranchas, id), mesmos = ordenarPranchas(x.pranchas).filter(function (y) { return y.serie === p.serie; });
      mesmos.forEach(function (y, k) { y.ord = k + 1; });
      var k = mesmos.indexOf(p), o = mesmos[k + dir]; if (!o) return;
      var t = p.ord; p.ord = o.ord; o.ord = t;
    });
  }
  function syncPlano() {
    var g = G(S.projId), tem = {}; (g.pranchas || []).forEach(function (x) { if (x.ambId) tem[x.ambId + (x.banc ? "b" : "a")] = true; });
    var novas = [], amp = (g.pranchas || []).filter(function (x) { return x.serie === 500; }).length;
    (g.ambientes || []).forEach(function (a) {
      var t = tipoAmb(a.tipo), et = fluxo(g.sigla).indexOf("ap") < 0 ? "pe" : "pe";
      if (t.amp && !tem[a.id + "a"]) { amp++; novas.push(novaPrancha(500, "amp" + (amp < 10 ? "0" : "") + amp + " – " + a.nome, et, { ambId: a.id, ord: 900 + amp })); }
      if (t.banc && !tem[a.id + "b"]) novas.push(novaPrancha(700, "Bancada – " + a.nome, et, { ambId: a.id, banc: true, ord: 900 + novas.length }));
    });
    if (!novas.length) { T.toast("O plano já tem todas as ampliações e bancadas do programa."); return; }
    salvar(S.projId, function (x) { x.pranchas = x.pranchas.concat(novas); evento(x, novas.length + " prancha(s) incluídas a partir do programa"); });
    T.toast(novas.length + (novas.length === 1 ? " prancha incluída" : " pranchas incluídas"));
  }

  // ---------- exemplos ----------
  async function carregarExemplos(btn) {
    await T.saveWith(btn, async function () {
      var db = T.db;
      if (!T.state.pessoas.length) {
        await db.doc("pessoas/luan").set({ nome: "Luan", perfil: "socio", custoHora: null, valorHora: null, ativo: true, ordem: 1 });
        await db.doc("pessoas/elisa").set({ nome: "Elisa", perfil: "socio", custoHora: null, valorHora: null, ativo: true, ordem: 2 });
      }
      var L = T.state.pessoas[0] ? T.state.pessoas[0].id : "luan", E = T.state.pessoas[1] ? T.state.pessoas[1].id : "elisa";
      var C = T.cadastros;
      var c1 = await C.criarContato({ tipos: ["cliente"], nome: "Marina Duarte (exemplo)", contato: "(32) 90000-0001", email: "marina@exemplo.com", descricao: "Cliente de exemplo" });
      var c2 = await C.criarContato({ tipos: ["cliente"], nome: "Rafael Duarte (exemplo)", contato: "(32) 90000-0002", email: "rafael@exemplo.com" });
      var c3 = await C.criarContato({ tipos: ["cliente"], nome: "Carlos Menezes (exemplo)", contato: "(32) 90000-0003", email: "carlos@exemplo.com" });
      var c4 = await C.criarContato({ tipos: ["cliente"], nome: "Pousada Vale Verde (exemplo)", empresa: "Vale Verde Turismo Ltda", contato: "(32) 90000-0004", email: "contato@valeverde.exemplo" });
      var c5 = await C.criarContato({ tipos: ["cliente"], nome: "Helena Souza (exemplo)", contato: "(32) 90000-0005" });
      await C.criarContato({ tipos: ["parceiro"], categoria: "Engenheiro estrutural", nome: "Tiago Rocha (exemplo)", empresa: "Rocha Estruturas", contato: "(32) 90000-0010" });
      await C.criarContato({ tipos: ["parceiro"], categoria: "Projetos elétrico e hidrossanitário", nome: "Beatriz Alves (exemplo)", contato: "(32) 90000-0011" });
      await C.criarContato({ tipos: ["fornecedor"], categoria: "Marmoraria", nome: "Marmoraria Pedra Fina (exemplo)", contato: "(32) 90000-0020" });
      await C.criarContato({ tipos: ["maodeobra"], categoria: "Pedreiro", nome: "João Batista (exemplo)", contato: "(32) 90000-0030" });
      function iso(n) { return voltaDu(n).toISOString(); }
      function ymdDu(n) { return T.ymd(voltaDu(n)); }
      async function criar(pj, g) {
        var ref = await db.collection("projetos").add(Object.assign({ status: "ativo", criadoEm: new Date().toISOString() }, pj));
        var amb = ambientesDeQtd(g.qtd || {}, g.pavs[0]); delete g.qtd;
        var pr = gerarPlano({ sigla: g.sigla, pavs: g.pavs, ambientes: amb, marcenaria: g.marcenaria });
        (g.prontas || []).forEach(function (n) { pr.filter(function (x) { return x.serie === n[0]; }).slice(0, n[1]).forEach(function (x) { x.sit = n[2] || "pronto"; x.resp = n[3] || null; }); });
        delete g.prontas;
        amb.forEach(function (a) { if (a.tipo === "banho_master") a.cfg = { agua_quente: true, bancada_tipo: "Cuba esculpida", cubas: "2", sanitario: "Caixa acoplada", ducha_higienica: true, chuveiros: "2", tipo_chuveiro: "Pré-aquecido (gás, boiler…)", banheira: "Em anexo (SPA)" }; if (a.tipo === "cozinha") a.cfg = { ilha: true, agua_quente: true, exaustao: "Coifa", equipamentos: ["Geladeira side by side", "Cooktop 5 bocas", "Forno de embutir", "Lava-louças"], itens_bancada: ["Cuba inox dupla", "Lixeira embutida"], integracao: "Estar, jantar e cozinha integrados" }; if (a.tipo === "estar") a.cfg = { assentos: "8", tv: "65\"" }; });
        await db.doc("gp/" + ref.id).set(Object.assign({ ambientes: amb, pranchas: pr, tarefas: [], esperas: [], eventos: [], marco: {}, criadoEm: new Date().toISOString() }, g));
        return ref.id;
      }
      await criar({ nome: "Casa Duarte", codigo: "RES-CASADUARTE", sigla: "RES", tipo: "res", cliente: "Marina Duarte e Rafael Duarte", clienteIds: [c1, c2], categorias: { padrao: "medio_alto", dimensao: "confortavel", dificuldade: "dificil" }, area: 280 },
        { sigla: "RES", etapa: "ep", fase: null, resp: L, pavs: ["Garagem/Acesso", "1º pavimento", "2º pavimento"], qtd: PADRAO_RES, legal: "nao_iniciado", marco: { contrato: true, parcela: true, topografico: true, documentos: true },
          etapas: { briefing: { inicio: iso(45), fim: iso(28) }, ep: { inicio: iso(28) } }, esperas: [{ quem: "cliente", inicio: iso(16), fim: null }], proximo: "Receber a lista de ajustes da 1ª rodada",
          tarefas: [{ id: T.novoId(), txt: "Cobrar retorno da apresentação do EP", resp: L, prazo: ymdDu(-2), feita: false }],
          eventos: [{ data: ymdDu(45), txt: "Projeto criado no briefing" }, { data: ymdDu(28), txt: "Marco zero: Estudo Preliminar iniciado" }, { data: ymdDu(17), txt: "Apresentação do Estudo Preliminar" }] });
      await criar({ nome: "Casa Menezes", codigo: "RES-CASAMENEZES", sigla: "RES", tipo: "res", cliente: "Carlos Menezes", clienteIds: [c3], categorias: { padrao: "alto_1", dimensao: "espacosa", dificuldade: "normal" }, area: 320 },
        { sigla: "RES", etapa: "ap", fase: 2, resp: L, pavs: ["Térreo", "Superior"], qtd: { hall: 1, cozinha: 1, jantar: 1, estar: 1, lavabo: 1, suite_master: 1, banho_master: 1, closet: 1, quarto: 3, banho: 2, garagem: 3, lavanderia: 1, gourmet: 1, piscina: 1, escada: 1 },
          legal: "protocolado", marco: { contrato: true, parcela: true, topografico: true, documentos: true },
          etapas: { briefing: { inicio: iso(120), fim: iso(100) }, ep: { inicio: iso(100), fim: iso(38), termoEm: ymdDu(38) }, ap: { inicio: iso(38) } },
          esperas: [{ quem: "engenheiro", inicio: iso(20), fim: iso(12) }], proximo: "Compatibilizar o hidrossanitário (2ª rodada)",
          prontas: [[100, 5, "pronto", E], [200, 2, "pronto", E], [300, 2, "revisao", E], [400, 4, "andamento", L]],
          tarefas: [{ id: T.novoId(), txt: "Enviar interferências ao projeto elétrico", resp: L, prazo: ymdDu(-1), feita: false }, { id: T.novoId(), txt: "Revisar quadro de áreas", resp: E, prazo: ymdDu(1), feita: false }],
          eventos: [{ data: ymdDu(38), txt: "Termo de Encerramento de Etapa registrado (Estudo Preliminar)" }, { data: ymdDu(12), txt: "Estrutural recebido e sobreposto" }] });
      await criar({ nome: "Pousada Vale Verde", codigo: "HOT-VALEVERDE", sigla: "HOT", tipo: "hot", cliente: "Pousada Vale Verde", clienteIds: [c4], categorias: { padrao: "alto_1", dimensao: "confortavel", dificuldade: "muito_dificil" }, area: 0 },
        { sigla: "HOT", etapa: "briefing", fase: null, resp: L, pavs: ["Térreo"], qtd: {}, legal: "nao_iniciado", marco: { contrato: true },
          etapas: { briefing: { inicio: iso(10) } }, proximo: "Apresentar a proposta ao cliente", eventos: [{ data: ymdDu(10), txt: "Projeto criado no briefing" }] });
      await criar({ nome: "Apartamento Centro", codigo: "INT-APTOCENTRO", sigla: "INT", tipo: "int", cliente: "Helena Souza", clienteIds: [c5], categorias: { padrao: "medio_alto", dimensao: "compacta", dificuldade: "baixa" }, area: 95 },
        { sigla: "INT", etapa: "pe", fase: 2, resp: E, pavs: ["Apartamento"], qtd: { cozinha: 1, estar: 1, jantar: 1, suite_master: 1, banho_master: 1, quarto: 1, banho: 1, lavanderia: 1 }, marcenaria: true, legal: "nao_se_aplica", marco: { contrato: true, parcela: true, topografico: true },
          etapas: { briefing: { inicio: iso(90), fim: iso(80) }, ep: { inicio: iso(80), fim: iso(35), termoEm: ymdDu(35) }, pe: { inicio: iso(35) } }, proximo: "Detalhar marcenaria da cozinha",
          prontas: [[100, 3, "entregue", E], [200, 2, "pronto", E], [300, 2, "pronto", E], [400, 5, "pronto", E], [500, 2, "andamento", E], [900, 1, "andamento", E]],
          eventos: [{ data: ymdDu(35), txt: "Termo de Encerramento de Etapa registrado (Estudo Preliminar)" }] });
    });
  }

  // ---------- render e eventos ----------
  function render() {
    $("gp-lista").hidden = S.view !== "lista"; $("gp-proj").hidden = S.view !== "projeto"; $("gp-novo").hidden = S.view !== "novo";
    if (S.view === "lista") renderLista(); else if (S.view === "projeto") renderProjeto(); else if (S.wiz) renderNovo();
  }
  var html =
    '<div id="gp-lista"><div class="section-head"><h2 class="section-title">Projetos em andamento</h2><div class="form-actions"><input id="gp-busca" class="gp-busca" placeholder="Buscar projeto ou cliente" aria-label="Buscar"><button class="btn btn-small btn-primary" id="gp-novo-btn">+ Novo projeto</button></div></div>' +
      '<div class="segmented" id="gp-filtros" style="margin-bottom:14px">' + [["todos", "Todos"], ["aguardando", "Aguardando"], ["suspensos", "Suspensos"]].map(function (f, k) { return '<button class="seg-pill' + (k ? "" : " is-selected") + '" data-f="' + f[0] + '">' + f[1] + "</button>"; }).join("") + "</div>" +
      '<div class="gp-avisos" id="gp-avisos"></div><div class="tiles gp-resumo" id="gp-resumo"></div><div id="gp-grupos"></div></div>' +
    '<div id="gp-proj" hidden><div id="gp-p-head" class="gp-p-head"></div><div id="gp-p-body"></div></div>' +
    '<div id="gp-novo" hidden></div>';

  function init() {
    var v = $("view-gestor");
    $("gp-busca").addEventListener("input", function () { S.busca = this.value; renderLista(); });
    $("gp-novo-btn").addEventListener("click", function () { api.novo(); });
    $("gp-filtros").addEventListener("click", function (e) {
      var b = e.target.closest("[data-f]"); if (!b) return; S.filtro = b.dataset.f;
      T.each("[data-f]", function (x) { x.classList.toggle("is-selected", x === b); }, this); renderLista();
    });
    v.addEventListener("click", async function (e) {
      var t = e.target, b;
      if ((b = t.closest("[data-open]"))) { api.abrir(b.dataset.open); return; }
      if (t.closest("#gp-seed")) { carregarExemplos(t.closest("#gp-seed")); return; }
      if (t.closest("[data-voltar]")) { S.view = "lista"; S.confirmDel = null; render(); window.scrollTo(0, 0); return; }
      if ((b = t.closest("[data-tab]"))) { S.tab = b.dataset.tab; S.confirmDel = null; render(); return; }
      if ((b = t.closest("[data-sfil]"))) { S.serieFiltro = b.dataset.sfil; render(); return; }
      if ((b = t.closest("[data-psit]"))) { mudarPrancha(S.projId, b.dataset.psit, function (p) { p.sit = cicloSit(p.sit); }); return; }
      if ((b = t.closest("[data-pmove]"))) { moverPrancha(b.dataset.pmove, +b.dataset.dir); return; }
      if ((b = t.closest("[data-pdel]"))) {
        var antes = T.clone(G(S.projId).pranchas), pid = S.projId;
        salvar(pid, function (x) { x.pranchas = x.pranchas.filter(function (y) { return y.id !== b.dataset.pdel; }); });
        T.toast("Prancha removida", { label: "Desfazer", fn: function () { salvar(pid, function (x) { x.pranchas = antes; }); } }); return;
      }
      if ((b = t.closest("[data-addserie]"))) { salvar(S.projId, function (x) { x.marcenaria = true; (x.pavs || ["Térreo"]).forEach(function (p, k) { x.pranchas.push(novaPrancha(900, "Mapa de marcenaria – " + p, "pe", { ord: k + 1 })); }); }); return; }
      if ((b = t.closest("[data-tfdel]"))) { salvar(S.projId, function (x) { x.tarefas = x.tarefas.filter(function (y) { return y.id !== b.dataset.tfdel; }); }); return; }
      if ((b = t.closest("[data-amb]"))) { S.openAmb = S.openAmb === b.dataset.amb ? null : b.dataset.amb; render(); return; }
      if ((b = t.closest("[data-ambsave]"))) { salvarAmb(b.dataset.ambsave); return; }
      if ((b = t.closest("[data-ambdel]"))) { var id = b.dataset.ambdel; salvar(S.projId, function (x) { x.ambientes = x.ambientes.filter(function (a) { return a.id !== id; }); }); S.openAmb = null; return; }
      if ((b = t.closest("[data-wsig]"))) { S.wiz.sigla = b.dataset.wsig; if (!S.wiz.codManual) S.wiz.codigo = ""; S.wiz.qtd = b.dataset.wsig === "RES" ? T.clone(PADRAO_RES) : {}; renderNovo(); return; }
      if ((b = t.closest("[data-wstep]"))) { S.wiz.step += +b.dataset.wstep; renderNovo(); window.scrollTo(0, 0); return; }
      if (t.closest("[data-wcancel]")) { S.wiz = null; S.view = "lista"; render(); return; }
      if (t.closest("#w-criar")) { criarProjeto(); return; }
      if ((b = t.closest("[data-act]"))) {
        var act = b.dataset.act, pid2 = S.projId;
        if (act === "avancar") avancar();
        else if (act === "aguardar") { var quem = $("gp-quem").value, prev = $("gp-previsto").value || null; salvar(pid2, function (x) { x.esperas = x.esperas || []; x.esperas.push({ quem: quem, inicio: new Date().toISOString(), fim: null, previsto: prev }); evento(x, "Aguardando " + nomeQuem(quem)); }); }
        else if (act === "retomar") salvar(pid2, function (x) { var e2 = esperaAberta(x); if (e2) { e2.fim = new Date().toISOString(); evento(x, "Retomado após " + du(e2.inicio, new Date()) + " d.u. aguardando " + nomeQuem(e2.quem)); } });
        else if (act === "suspender") salvar(pid2, function (x) { var e3 = esperaAberta(x); if (e3) e3.fim = new Date().toISOString(); x.suspenso = { desde: hojeIso() }; x.esperas.push({ quem: "cliente", inicio: new Date().toISOString(), fim: null, suspenso: true }); evento(x, "Projeto suspenso por falta de retorno do cliente"); });
        else if (act === "reativar") salvar(pid2, function (x) { var e4 = esperaAberta(x); if (e4) e4.fim = new Date().toISOString(); delete x.suspenso; evento(x, "Projeto reativado"); });
        else if (act === "sync-plano") syncPlano();
        else if (act === "apagar") { S.confirmDel = pid2; render(); }
        else if (act === "apagar-nao") { S.confirmDel = null; render(); }
        else if (act === "apagar-ok") { try { await T.db.doc("gp/" + pid2).delete(); delete S.gp[pid2]; S.confirmDel = null; S.view = "lista"; render(); T.toast("Projeto removido do Gestor"); } catch (err) { T.showError(err); } }
      }
    });
    v.addEventListener("change", function (e) {
      var t = e.target, pid = S.projId;
      if (t.id === "gp-fase") salvar(pid, function (x) { x.fase = +t.value; evento(x, "Fase " + t.value + " de " + ETAPAS[x.etapa].nome); });
      else if (t.id === "gp-proximo") salvar(pid, function (x) { x.proximo = t.value.trim(); });
      else if (t.id === "gp-resp") salvar(pid, function (x) { x.resp = t.value || null; });
      else if (t.id === "gp-legal") salvar(pid, function (x) { x.legal = t.value; evento(x, "Projeto Legal: " + (LEGAL.filter(function (o) { return o[0] === t.value; })[0] || [0, t.value])[1]); });
      else if (t.dataset.marco) salvar(pid, function (x) { x.marco = x.marco || {}; x.marco[t.dataset.marco] = t.checked; });
      else if (t.dataset.presp != null) mudarPrancha(pid, t.dataset.presp, function (p) { p.resp = t.value || null; });
      else if (t.dataset.tfdone) salvar(pid, function (x) { var tf = T.byId(x.tarefas, t.dataset.tfdone); if (tf) { tf.feita = t.checked; tf.feitaEm = t.checked ? new Date().toISOString() : null; } });
      else if (t.dataset.wcli) { var ids = S.wiz.clienteIds, i = ids.indexOf(t.dataset.wcli); if (t.checked && i < 0) ids.push(t.dataset.wcli); if (!t.checked && i >= 0) ids.splice(i, 1); }
      else if (t.id === "w-npav") { var n = Math.max(1, Math.min(12, +t.value || 1)); S.wiz.npav = n; var ps = S.wiz.pavs.slice(0, n); while (ps.length < n) ps.push(ps.length === 0 ? "Térreo" : n === 2 ? "Superior" : (ps.length) + "º pavimento"); S.wiz.pavs = ps; renderNovo(); }
      else if (t.id === "w-marc") S.wiz.marcenaria = t.checked;
      else if (t.dataset.w) S.wiz[t.dataset.w] = t.value;
    });
    v.addEventListener("input", function (e) {
      var t = e.target; if (!S.wiz) return;
      if (t.dataset.w) { S.wiz[t.dataset.w] = t.value; if (t.dataset.w === "codigo") S.wiz.codManual = true; if (t.dataset.w === "nome" && !S.wiz.codManual) { S.wiz.codigo = codigoDe(S.wiz.sigla, t.value); var c = $("w-cod"); if (c) c.value = S.wiz.codigo; } }
      else if (t.dataset.wn) S.wiz.novoCli[t.dataset.wn] = t.value;
      else if (t.dataset.wpav != null) S.wiz.pavs[+t.dataset.wpav] = t.value;
      else if (t.dataset.wq) { S.wiz.qtd[t.dataset.wq] = +t.value || 0; previewWiz(); }
    });
    v.addEventListener("submit", function (e) {
      var f = e.target; e.preventDefault();
      if (f.dataset.addp) { var inp = f.querySelector("input"), tit = inp.value.trim(); if (!tit) return; var serie = +f.dataset.addp, et = SERIES.filter(function (s) { return s[0] === serie; })[0][2];
        if (fluxo(G(S.projId).sigla).indexOf("ap") < 0) et = "pe";
        salvar(S.projId, function (x) { var n = x.pranchas.filter(function (y) { return y.serie === serie; }).length; x.pranchas.push(novaPrancha(serie, tit, et, { ord: 1000 + n })); }); return; }
      if (f.id === "gp-tf-form") { var txt = $("tf-txt").value.trim(); if (!txt) return; var tf = { id: T.novoId(), txt: txt, resp: $("tf-resp").value || null, prazo: $("tf-prazo").value || null, prancha: $("tf-pr").value || null, feita: false, criadaEm: new Date().toISOString() };
        salvar(S.projId, function (x) { x.tarefas = (x.tarefas || []).concat([tf]); }); return; }
      if (f.id === "gp-amb-add") { var tipo = $("amb-tipo").value, g = G(S.projId), a = novoAmbiente(tipo, { pav: (g.pavs || [])[0] || null }); salvar(S.projId, function (x) { x.ambientes = (x.ambientes || []).concat([a]); }); S.openAmb = a.id; return; }
      if (f.id === "gp-ficha") salvarFicha();
    });
  }
  function salvarAmb(id) {
    var ed = document.querySelector('[data-ambed="' + id + '"]'); if (!ed) return;
    salvar(S.projId, function (x) {
      var a = T.byId(x.ambientes, id); if (!a) return;
      T.each("[data-af]", function (i) { var k = i.dataset.af; a[k] = k === "qtd" ? Math.max(1, +i.value || 1) : k === "area" ? T.numOrNull(i.value) : i.value; }, ed);
      a.pav = a.pav || null; a.cfg = a.cfg || {};
      T.each("[data-cfg]", function (i) { var d = CAMPOS[i.dataset.cfg]; a.cfg[i.dataset.cfg] = d.t === "bool" ? i.checked : d.t === "num" ? T.numOrNull(i.value) : i.value; }, ed);
      var multi = {}; T.each("[data-cfgm]", function (i) { multi[i.dataset.cfgm] = multi[i.dataset.cfgm] || []; if (i.checked) multi[i.dataset.cfgm].push(i.value); }, ed);
      Object.keys(multi).forEach(function (k) { a.cfg[k] = multi[k]; });
      if (x.etapa !== "briefing") evento(x, "Ambiente alterado: " + a.nome + " (" + ETAPAS[x.etapa].nome + ")");
    });
    S.openAmb = null; T.toast("Ambiente salvo");
  }
  async function salvarFicha() {
    var pid = S.projId, cli = []; T.each("[data-fcli]", function (i) { if (i.checked) cli.push(i.dataset.fcli); });
    var sig = $("f-sig").value || G(pid).sigla, nomes = cli.map(function (id) { var c = T.cadastros && T.cadastros.contato(id); return c ? c.nome : ""; }).filter(Boolean);
    await T.saveWith($("f-save"), async function () {
      await T.db.doc("projetos/" + pid).update({ nome: $("f-nome").value.trim(), codigo: $("f-cod").value.trim(), sigla: sig, tipo: TIPO_ANTIGO[sig], clienteIds: cli, cliente: nomes.join(" e "), endereco: $("f-end").value.trim(),
        categorias: { padrao: $("f-pad").value || null, dimensao: $("f-dim").value || null, dificuldade: $("f-dif").value || null } });
      var pavs = $("f-pavs").value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
      var dir = {}; ["uso", "expectativas", "estetica", "relacao", "sistemas", "execucao"].forEach(function (k) { dir[k] = $("fd-" + k).value.trim(); });
      await salvar(pid, function (x) { x.sigla = sig; x.pavs = pavs.length ? pavs : x.pavs; x.pasta = $("f-pasta").value.trim(); x.bimx = $("f-bimx").value.trim(); x.marcenaria = $("f-marc").checked; x.diretrizes = dir; });
    });
  }

  var api = T.gestor = {
    abrir: function (pid) { if (T.state.view !== "admin" || T.state.sub !== "gestor") T.go("admin", "gestor"); S.view = "projeto"; S.projId = pid; S.tab = "geral"; S.openAmb = null; render(); window.scrollTo(0, 0); },
    novo: function () { if (T.state.view !== "admin" || T.state.sub !== "gestor") T.go("admin", "gestor"); S.wiz = wizInicial(); S.view = "novo"; render(); window.scrollTo(0, 0); },
    gp: G, etapaNome: function (pid) { var g = G(pid); return g ? etapaLinha(g) : ""; }, situacao: function (pid) { var g = G(pid); return g ? situacao(g) : null; },
    idsPranchas: idsPranchas, ordenarPranchas: ordenarPranchas, sitNome: sitNome, cicloSit: cicloSit, mudarPrancha: mudarPrancha, salvar: salvar, etapas: ETAPAS
  };

  T.register({
    id: "gestor", label: "Gestor de Projetos", area: "admin", html: html, init: init, render: render,
    icon: '<path d="M4 5h16"/><path d="M4 12h10"/><path d="M4 19h6"/><circle cx="18" cy="17" r="3"/>',
    desc: function () { var n = projetosGestor().filter(function (p) { return G(p.id).etapa !== "encerrado"; }).length; return n ? n + (n === 1 ? " projeto no processo" : " projetos no processo") : "Etapas, pranchas e prazos de cada projeto"; },
    connect: function (db) { db.collection("gp").onSnapshot(function (s) { var m = {}; s.docs.forEach(function (d) { m[d.id] = d.data(); }); S.gp = m; T.loaded("gp", s); T.scheduleRender(); }, T.onErr); },
    notes: function () {
      var av = avisos().filter(function (a) { return a[0] !== "ok"; });
      return av.length ? '<div class="note"><div><div class="note-title">Gestor de Projetos</div><div class="note-body">' + av.map(function (a) { return a[1]; }).join("<br>") + '</div></div><button class="btn btn-small" data-go="gestor">Abrir</button></div>' : null;
    }
  });
})();
