/* Módulo Gestor Comercial — oportunidades, briefing, programa de necessidades, simulador de preço e funil.
 * Dados: com_oport/<id> (uma oportunidade por documento) e com_config/geral (fatores, horas, percentuais, mensagens).
 * Lê: contatos (Cadastros), gp_config (catálogo de ambientes, via Trilha.gestor), fin_config/geral (imposto),
 * config/escritorio (padrões de obra, prazos, pesos). Regras em COMERCIAL-PLANO.md e REGRAS.md.
 * Versão 1 (01/10/2026): sem IA, sem PDF de proposta e sem contrato — chegam nas próximas rodadas. */
(function () {
  "use strict";
  var T = window.Trilha, $ = T.$, esc = T.esc, BRL = T.fmtBRL;

  // ---------- etapas da oportunidade ----------
  // [id, nome, botão do próximo passo]
  var ETAPAS = [
    ["contato", "Contato", "Agendar reunião ou visita"],
    ["reuniao", "Reunião", "Enviar briefing"],
    ["briefing_enviado", "Briefing enviado", "Importar respostas"],
    ["briefing_recebido", "Briefing recebido", "Montar proposta"],
    ["proposta_revisao", "Proposta em revisão", "Aprovar e apresentar"],
    ["proposta_apresentada", "Proposta apresentada", "Cliente vai fechar"],
    ["contrato", "Contrato", "Contrato assinado"],
    ["fechado", "Fechado", "Virar projeto"]
  ];
  var IDX = {}; ETAPAS.forEach(function (e, k) { IDX[e[0]] = k; });
  function etapaNome(id) { return id === "perdido" ? "Perdido" : (ETAPAS[IDX[id]] || ["", id])[1]; }
  var TIPOS = [["RES", "Residência"], ["COM", "Comercial"], ["HOT", "Hotelaria"], ["REF", "Reforma"], ["INT", "Interiores"], ["MARC", "Marcenaria"], ["SERV", "Serviço"]];
  function tipoNome(t) { return (TIPOS.filter(function (x) { return x[0] === t; })[0] || ["", t || ""])[1]; }
  function doZero(t) { return ["RES", "COM", "HOT"].indexOf(t) >= 0; }
  var PERFIS = [["tranquilo", "Tranquilo"], ["normal", "Normal"], ["exigente", "Exigente"], ["indeciso", "Indeciso"]];
  var DIM = [["compacta", "Compacta"], ["confortavel", "Confortável"], ["espacosa", "Espaçosa"]];
  var DIF = [["baixa", "Baixa"], ["normal", "Normal"], ["dificil", "Difícil"], ["muito_dificil", "Muito difícil"]];
  var SETORES = [["social", "Social"], ["intimo", "Íntimo"], ["servico", "Serviço"], ["lazer", "Lazer"], ["externo", "Externo"]];

  // Ambientes que o catálogo do Gestor ainda não tem (entram no Gestor como "Outro ambiente" com nome e setor próprios).
  var EXTRA = [
    { id: "varanda", n: "Varanda", s: "social", a: 15 }, { id: "biblioteca", n: "Biblioteca", s: "social", a: 12 },
    { id: "despensa", n: "Despensa", s: "servico", a: 6 }, { id: "rouparia", n: "Rouparia", s: "servico", a: 4 },
    { id: "quarto_servico", n: "Quarto de serviço", s: "servico", a: 9 }, { id: "banho_servico", n: "Banheiro de serviço", s: "servico", a: 3 },
    { id: "sauna", n: "Sauna", s: "lazer", a: 5 }, { id: "hidro", n: "Hidromassagem", s: "lazer", a: 5 }, { id: "academia", n: "Academia", s: "lazer", a: 15 },
    { id: "jogos", n: "Sala de jogos", s: "lazer", a: 20 }, { id: "brinquedoteca", n: "Brinquedoteca", s: "lazer", a: 12 },
    { id: "fogueira", n: "Área de fogueira", s: "externo", a: null }, { id: "quadra", n: "Quadra / campo", s: "externo", a: null }
  ];

  // ---------- configurações do comercial (valores provisórios: revisar com o Luan) ----------
  var DEF = {
    provisorio: true,
    fatores: {
      padrao: { medio: 1, medio_alto: 1.15, alto_1: 1.3, alto_2: 1.5, luxo: 1.8 },
      dimensao: { compacta: 0.95, confortavel: 1, espacosa: 1.1 },
      terreno: { baixa: 1, normal: 1.05, dificil: 1.15, muito_dificil: 1.3 },
      cliente: { tranquilo: 0.95, normal: 1, exigente: 1.15, indeciso: 1.2 }
    },
    // horas de referência por ambiente (unidade; garagem = por vaga)
    horasAmb: { hall: 4, cozinha: 24, jantar: 10, estar: 12, cinema: 8, escritorio: 8, lavabo: 8, suite_master: 12, banho_master: 14, spa: 10, closet: 8, quarto: 8, banho: 10,
      garagem: 3, lavanderia: 8, deposito: 3, gourmet: 20, piscina: 16, escada: 12, quintal: 6, outro: 6, varanda: 8, biblioteca: 8, despensa: 4, rouparia: 3,
      quarto_servico: 6, banho_servico: 6, sauna: 10, hidro: 8, academia: 8, jogos: 8, brinquedoteca: 8, fogueira: 6, quadra: 6 },
    horasGerais: [
      { id: "implantacao", n: "Implantação, terreno e terraplenagem", h: 24 }, { id: "concepcao", n: "Concepção e volumetria", h: 40 },
      { id: "cortes", n: "Cortes e fachadas", h: 32 }, { id: "estudos", n: "Estudos de insolação, ventilação e visuais", h: 12 },
      { id: "imagens", n: "Imagens fotorrealistas e BIMx", h: 32 }, { id: "reunioes", n: "Reuniões e apresentações", h: 24 },
      { id: "compat", n: "Compatibilização dos complementares", h: 24 }, { id: "legal", n: "Projeto Legal (só quando há)", h: 24, legal: true }
    ],
    custoHoraPadrao: 35, impostoPct: 6, reservaPct: 10, lucroPct: 20, nfPct: 17, cauPct: 8, mercadoMin: 70, mercadoMax: 120,
    metaAnual: 300000, validadeDias: 30, admObraPct: 12, briefingDias: 5, followupDias: 7, propostaInicial: 81, linkBriefing: "",
    origens: ["Indicação", "Instagram", "Site", "Google", "Cliente antigo", "Outro"],
    motivos: ["Preço", "Prazo", "Escolheu outro escritório", "Desistiu ou adiou o projeto", "Sem retorno", "Outro"],
    msgs: {
      reuniao: "Olá, {nome}! Confirmando a nossa conversa em {data} às {hora}{local}. Até lá! Trilha Arquitetura Brasileira",
      briefing: "Olá, {nome}! Foi ótimo conversar com você. Para prepararmos a proposta do seu projeto, montamos um questionário: {link}\nResponda no seu tempo; qualquer dúvida, estamos por aqui. Trilha Arquitetura Brasileira",
      cobrarBriefing: "Olá, {nome}! Tudo bem? Passando para lembrar do questionário do seu projeto: {link}\nCom ele conseguimos preparar a sua proposta.",
      proposta: "Olá, {nome}! Segue a proposta do seu projeto. Ficamos à disposição para conversar. A proposta é válida até {validade}.",
      followup: "Olá, {nome}! Tudo bem? Conseguiu ver a proposta do seu projeto? Se quiser, marcamos uma conversa para tirar dúvidas."
    }
  };
  var S = { ops: [], cfg: null, fin: null, loaded: false, view: "lista", opId: null, tab: "resumo", acao: null, ed: null, dirty: false, ano: new Date().getFullYear(), verFim: false, imp: null, novo: null, cfgEd: null };

  function C() {
    var c = S.cfg || {}, o = Object.assign({}, DEF, c);
    o.fatores = {}; ["padrao", "dimensao", "terreno", "cliente"].forEach(function (k) { o.fatores[k] = Object.assign({}, DEF.fatores[k], (c.fatores || {})[k] || {}); });
    o.horasAmb = Object.assign({}, DEF.horasAmb, c.horasAmb || {});
    o.msgs = Object.assign({}, DEF.msgs, c.msgs || {});
    return o;
  }

  // ---------- utilidades ----------
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim(); }
  function hoje() { return T.ymd(new Date()); }
  function dias(iso) { if (!iso) return 0; return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)); }
  function op(id) { return T.byId(S.ops, id); }
  function r2(v) { return Math.round(v * 100) / 100; }
  function pct(v, d) { return v == null || isNaN(v) ? "—" : T.fmtNum(v, d == null ? 1 : d) + "%"; }
  function m2(v) { return v == null || isNaN(v) ? "—" : T.fmtNum(v, 1) + " m²"; }
  function horas(v) { return v == null || isNaN(v) ? "—" : T.fmtNum(Math.round(v), 0) + " h"; }
  function primeiroNome(n) { return String(n || "").trim().split(/\s+/)[0] || ""; }
  function fone(t) { var d = String(t || "").replace(/\D/g, ""); if (!d) return ""; if (d.length <= 11) d = "55" + d; return d; }
  function waLink(tel, msg) { var f = fone(tel); return f ? "https://wa.me/" + f + (msg ? "?text=" + encodeURIComponent(msg) : "") : ""; }
  function preencher(tpl, o, extra) {
    var x = Object.assign({ nome: primeiroNome(o.cliente && o.cliente.nome), link: C().linkBriefing || "(link do formulário)" }, extra || {});
    return String(tpl || "").replace(/\{(\w+)\}/g, function (m, k) { return x[k] != null ? x[k] : m; });
  }
  function dataExtenso(ymd) { if (!ymd) return ""; var d = T.parseYmd(ymd); return d.getDate() + " de " + T.MESES[d.getMonth()] + " de " + d.getFullYear(); }
  function addDiasYmd(n) { return T.ymd(T.addDays(new Date(), n)); }
  function catalogoGestor() { return T.gestor && T.gestor.catalogo ? T.gestor.catalogo() : []; }
  function catalogo() { var g = catalogoGestor(); return g.filter(function (t) { return t.id !== "outro"; }).concat(EXTRA.filter(function (e) { return !T.byId(g, e.id); })).concat([{ id: "outro", n: "Outro ambiente", s: "social", a: null }]); }
  function tipoAmb(id) { return T.byId(catalogo(), id) || { id: "outro", n: "Outro ambiente", s: "social", a: null, campos: [] }; }
  function novoAmb(tipo, extra) { var t = tipoAmb(tipo); return Object.assign({ id: T.novoId(), tipo: t.id, nome: t.n, setor: t.s, qtd: 1, area: t.a, cfg: {} }, extra || {}); }

  // valor em reais escrito pelo cliente: "500k", "R$ 1.200.000,00", "1,2 mi", "800 mil"
  function parseValor(s) {
    if (s == null || s === "") return null;
    var t = norm(s).replace(/r\$/g, "").replace(/\s/g, ""), m = t.match(/([\d.,]+)(k|mil|milhoes|milhao|mi|m)?/); if (!m) return null;
    var n = m[1];
    if (/,\d{1,2}$/.test(n)) n = n.replace(/\./g, "").replace(",", "."); else if (/\.\d{3}(\D|$)/.test(n) && !/,/.test(n)) n = n.replace(/\./g, ""); else n = n.replace(/\./g, "").replace(",", ".");
    var v = parseFloat(n); if (isNaN(v)) return null;
    if (m[2] === "k" || m[2] === "mil") v *= 1000; else if (m[2]) v *= 1000000;
    return v;
  }

  // ---------- cálculo do simulador ----------
  function custoHora() {
    var ps = T.pessoasAtivas().map(function (p) { return T.custoHoraTotal(p.id); }).filter(function (v) { return v != null && v > 0; });
    if (ps.length) return { v: ps.reduce(function (s, v) { return s + v; }, 0) / ps.length, src: "média da equipe (" + ps.length + (ps.length === 1 ? " pessoa" : " pessoas") + ", com rateio dos custos fixos)" };
    return { v: C().custoHoraPadrao, src: "valor provisório em Configurações do comercial (a equipe ainda não tem custo-hora)" };
  }
  function impostoPct() { return S.fin && S.fin.impostoPct != null ? { v: S.fin.impostoPct, src: "Financeiro" } : { v: C().impostoPct, src: "provisório" }; }
  function padraoDe(id) { return T.byId(T.padroes(), id); }
  function areaProg(o) { return ((o.programa || {}).amb || []).reduce(function (s, a) { return s + (+a.area || 0) * (+a.qtd || 1); }, 0); }
  function legalDe(o) { var s = o.sim || {}; return s.legal != null ? !!s.legal : doZero(o.tipo); }
  function pesosEtapas(o) {
    var p = Object.assign({}, T.DEFAULT_CONFIG.pesosEtapas, T.cfg().pesosEtapas || {}), ets = doZero(o.tipo) ? ["ep", "ap"].concat(legalDe(o) ? ["pl"] : []).concat(["pe"]) : ["ep", "pe"];
    var tot = ets.reduce(function (s, e) { return s + (+p[e] || 0); }, 0) || 1;
    return ets.map(function (e) { return { e: e, nome: { ep: "Estudo Preliminar", ap: "Anteprojeto", pl: "Projeto Legal", pe: "Projeto Executivo" }[e], peso: (+p[e] || 0) / tot }; });
  }
  function calc(o) {
    var c = C(), sim = o.sim || {}, cat = o.cat || {}, amb = (o.programa || {}).amb || [], r = {};
    r.areaAmb = areaProg(o); r.circ = r.areaAmb * 0.1; r.paredes = r.areaAmb * 0.1;
    r.area = sim.area || (r.areaAmb ? Math.round(r.areaAmb * 1.2 * 10) / 10 : null);
    var pad = padraoDe(cat.padrao); r.pad = pad;
    r.m2 = sim.custoM2 || (pad ? (pad.max ? (pad.min + pad.max) / 2 : Math.round(pad.min * 1.1)) : null);
    r.m2a = sim.custoM2Alto || (pad ? (pad.max || Math.round(pad.min * 1.25)) : null);
    r.obra = r.area && r.m2 ? r.area * r.m2 : null; r.obraAlta = r.area && r.m2a ? r.area * r.m2a : null;
    var legal = legalDe(o);
    r.hAmb = amb.reduce(function (s, a) { return s + (+c.horasAmb[a.tipo] || +c.horasAmb.outro || 0) * (+a.qtd || 1); }, 0);
    r.hGer = (c.horasGerais || []).filter(function (g) { return !g.legal || legal; }).reduce(function (s, g) { return s + (+g.h || 0); }, 0);
    r.hBase = amb.length ? r.hAmb + r.hGer : 0; // sem programa, sem preço
    r.f = { padrao: c.fatores.padrao[cat.padrao] || 1, dimensao: c.fatores.dimensao[cat.dimensao] || 1, terreno: c.fatores.terreno[cat.dificuldade] || 1, cliente: c.fatores.cliente[cat.cliente] || 1 };
    r.fTotal = r.f.padrao * r.f.dimensao * r.f.terreno * r.f.cliente;
    r.hAj = r.hBase * r.fTotal;
    r.ch = custoHora(); r.custo = r.hAj * r.ch.v;
    r.imp = impostoPct(); r.res = +c.reservaPct || 0; r.luc = +c.lucroPct || 0;
    var div = 1 - (r.imp.v + r.res + r.luc) / 100; r.tabela = div > 0 && r.custo ? r.custo / div : null;
    r.cau = r.obra ? r.obra * c.cauPct / 100 : null;
    r.merc = r.area ? [r.area * c.mercadoMin, r.area * c.mercadoMax] : null;
    r.valor = sim.meuValor || null; r.final = r.valor || r.tabela;
    r.pctObra = r.final && r.obra ? r.final / r.obra * 100 : null; r.pctObraTab = r.tabela && r.obra ? r.tabela / r.obra * 100 : null;
    r.m2proj = r.final && r.area ? r.final / r.area : null;
    r.lucroRes = r.final ? (1 - (r.imp.v + r.res) / 100 - r.custo / r.final) * 100 : null;
    r.dif = r.valor && r.tabela ? r.valor - r.tabela : null;
    r.etapas = pesosEtapas(o).map(function (x) { return Object.assign(x, { h: r.hAj * x.peso, v: r.final ? r.final * x.peso : null }); });
    r.disp = (o.dados || {}).valorDisponivel || null; r.razao = r.disp && r.obra ? r.obra / r.disp : null;
    r.alertaExp = r.razao != null && r.razao > 1.2;
    var ent = sim.entrada != null ? +sim.entrada : (r.final ? Math.round(r.final * 0.1) : null), np = +sim.parcelas || 0;
    r.entrada = ent; r.np = np; r.parcela = r.final && np ? (r.final - (ent || 0)) / np : null;
    return r;
  }
  function valorOp(o) { if (o.valor) return o.valor; var s = o.sim || {}; return s.meuValor || (o.programa && o.programa.amb && o.programa.amb.length ? calc(o).tabela : null); }

  // ---------- leitura do briefing (planilha de respostas do Google Forms) ----------
  // Aceita a linha do cliente colada junto com a linha de títulos (copiada do Google Sheets: separada por tabulação)
  // ou o CSV baixado. Sem tabela, guarda o texto como está.
  function lerDelimitado(txt, sep) {
    var rows = [], row = [], cell = "", q = false, i, ch;
    for (i = 0; i < txt.length; i++) {
      ch = txt[i];
      if (q) { if (ch === '"') { if (txt[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; continue; }
      if (ch === '"' && cell === "") { q = true; continue; }
      if (ch === sep) { row.push(cell); cell = ""; continue; }
      if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; continue; }
      if (ch !== "\r") cell += ch;
    }
    row.push(cell); rows.push(row);
    return rows.filter(function (r) { return r.some(function (c) { return String(c).trim(); }); });
  }
  function lerTabela(txt) {
    txt = String(txt || "").replace(/\r\n?/g, "\n").trim(); if (!txt) return null;
    var l0 = txt.split("\n")[0], sep = l0.indexOf("\t") >= 0 ? "\t" : (l0.split(";").length > l0.split(",").length ? ";" : ",");
    var rows = lerDelimitado(txt, sep);
    if (rows.length < 2 || rows[0].length < 5) return null;
    return { head: rows[0].map(function (h) { return String(h).trim(); }), rows: rows.slice(1) };
  }
  function respostas(tab, k) { var row = tab.rows[k] || []; return tab.head.map(function (p, i) { return { p: p, r: String(row[i] || "").trim() }; }).filter(function (x) { return x.r && x.p && !/^carimbo|^timestamp/i.test(x.p); }); }
  function rotuloLinha(tab, k) { var row = tab.rows[k] || [], iN = -1; tab.head.forEach(function (h, i) { if (iN < 0 && /nome/i.test(h)) iN = i; }); return (iN >= 0 ? row[iN] : row[1] || row[0] || "Linha " + (k + 1)) + (row[0] && /\d{2}\/\d{2}/.test(row[0]) ? " · " + String(row[0]).slice(0, 10) : ""); }

  function Q(resp) {
    var lista = resp.map(function (x) { return { p: norm(x.p), r: x.r }; });
    function q(re) { for (var i = 0; i < lista.length; i++) if (re.test(lista[i].p)) return lista[i].r; return ""; }
    q.grid = function (re) { var out = {}; lista.forEach(function (x) { var m = x.p.match(/^(.*)\[(.+)\]\s*$/); if (m && re.test(m[1])) out[norm(m[2])] = x.r; }); return out; };
    return q;
  }
  function casar(opts, r) {
    var nr = norm(r); if (!nr || !opts) return null;
    if (/^nao (quero|desejo|precisa)/.test(nr)) { var neg = opts.filter(function (o) { return /^(sem|nao)/.test(norm(o)); })[0]; if (neg) return neg; }
    var num = (nr.match(/\d+/) || [])[0], best = null, bs = 0;
    opts.forEach(function (o) {
      var no = norm(o), s = 0, cn = no.replace(/[^a-z0-9]/g, ""), cr = nr.replace(/[^a-z0-9]/g, "");
      if (no === nr || cn === cr) s = 10; else if (nr.indexOf(no) >= 0 || no.indexOf(nr) >= 0 || cr.indexOf(cn) >= 0 || cn.indexOf(cr) >= 0) s = 5;
      else { var to = no.split(/[^a-z0-9]+/).filter(function (w) { return w.length > 1; }), tr = nr.split(/[^a-z0-9]+/); var com = to.filter(function (w) { return tr.indexOf(w) >= 0; }).length; s = to.length ? com / to.length * 4 : 0; }
      if (num && (no.match(/\d+/) || [])[0] === num) s += 3;
      if (s > bs) { bs = s; best = o; }
    });
    return bs >= 2 ? best : null;
  }
  function valorCampo(c, r) {
    if (!r) return undefined;
    if (c.t === "bool") return /^(sim|com)\b/i.test(r) ? true : /^(n(a|ã)o|sem)\b/i.test(r) ? false : undefined;
    if (c.t === "num") { var n = parseFloat(String(r).replace(",", ".")); return isNaN(n) ? undefined : n; }
    if (c.t === "sel") return casar(c.o, r) || undefined;
    if (c.t === "multi") { var out = []; String(r).split(/,\s*/).forEach(function (x) { var m = casar(c.o, x); if (m && out.indexOf(m) < 0) out.push(m); }); return out.length ? out : undefined; }
    return r;
  }
  // pergunta do formulário → campo do ambiente (as perguntas do catálogo do Gestor nasceram deste formulário)
  var CFG_MAP = [
    ["cozinha", "ilha", /sobre a\s+cozinha/], ["cozinha", "agua_quente", /agua quente na cozinha/], ["cozinha", "exaustao", /sistema de exaustao/],
    ["cozinha", "equipamentos", /equipamentos deseja para a\s+cozinha/], ["cozinha", "itens_bancada", /^na bancada/], ["cozinha", "integracao", /como deve ser o setor social/],
    ["jantar", "lugares", /sala de jantar, mesa/], ["jantar", "aparador", /aparador/],
    ["estar", "tv", /sala de estar e\/ou tv, qual o tamanho/], ["estar", "assentos", /na sala de estar, assento/], ["cinema", "assentos", /na sala de tv, assento/],
    ["suite_master", "cama", /cama no dormitorio principal/], ["suite_master", "tv", /tv no dormitorio principal/],
    ["quarto", "cama", /demais dormitorios, qual o tamanho da cama/], ["quarto", "tv", /tv nos demais dormitorios/],
    ["banho", "agua_quente", /banheiros, alem do chuveiro/], ["banho_master", "agua_quente", /banheiros, alem do chuveiro/], ["lavabo", "agua_quente", /lavabo, deseja agua quente/],
    ["lavanderia", "passar", /passar roupa/],
    ["gourmet", "ilha", /sobre o espaco gourmet/], ["gourmet", "agua_quente", /gourmet - agua quente/], ["gourmet", "lugares", /gourmet - mesa/],
    ["gourmet", "sofas", /gourmet - deseja espaco com sofas/], ["gourmet", "tv", /gourmet - deseja tv/], ["gourmet", "equip_gourmet", /gourmet - quais equipamentos/], ["gourmet", "itens_bancada", /gourmet - na bancada/],
    ["piscina", "modelo_piscina", /piscina, qual o modelo/], ["piscina", "tamanho", /piscina - em relacao ao tamanho/], ["piscina", "aquecida", /piscina - deve ser aquecida/], ["piscina", "elementos", /piscina - deseja elementos/],
    ["garagem", "cobertura_garagem", /como deve ser a garagem/], ["garagem", "tomada_eletrico", /tomada para carro eletrico/]
  ];
  function cfgBanho(r, master) {
    var n = norm(r), c = {}; if (!n) return c;
    if (/esculpida/.test(n)) c.bancada_tipo = "Cuba esculpida"; else if (/cuba de louca|bancada com cuba/.test(n)) c.bancada_tipo = "Cuba de louça";
    if (/valvula/.test(n)) c.sanitario = "Válvula"; else if (/caixa acoplada/.test(n)) c.sanitario = "Caixa acoplada";
    if (/ducha higienica/.test(n)) c.ducha_higienica = true; if (/bide/.test(n)) c.bide = true; if (/toalheiro/.test(n)) c.toalheiro = true;
    if (/pre-aquecido|gas|boiler/.test(n)) c.tipo_chuveiro = "Pré-aquecido (gás, boiler…)"; else if (/chuveiro eletrico/.test(n)) c.tipo_chuveiro = "Elétrico";
    if (master) { if (/cuba dupla/.test(n)) c.cubas = "2"; if (/dois chuveiros/.test(n)) c.chuveiros = "2"; if (/hidromassagem/.test(n)) c.banheira = "Hidromassagem"; else if (/imersao/.test(n)) c.banheira = "Imersão"; }
    return c;
  }
  function qtdGrade(v) { var n = parseInt(v, 10); return isNaN(n) ? (/mais/i.test(v) ? 5 : 0) : n; }
  // Monta dados, diretrizes, categorias sugeridas e programa a partir das respostas.
  function interpretar(resp) {
    var q = Q(resp), out = { dados: {}, dir: {}, cat: {}, amb: [], avisos: [] };
    var d = out.dados;
    d.uso = q(/destina-se a residencia/); d.faixa = q(/metragem quadrada aproximada/); d.dimensao = q(/opcao espacial/);
    d.terreno = q(/terreno, qual o tamanho/); d.topografia = q(/topografia natural/); d.pavimentos = q(/organizacao vertical/);
    d.moradores = q(/quem mais vai morar/); d.valorTexto = q(/disponibilidade de investimento/); d.valorDisponivel = parseValor(d.valorTexto);
    d.padraoCliente = q(/padrao de investimento por m/); d.executa = q(/pretende executar/); d.financiamento = q(/financ/);
    d.endereco = q(/endereco do projeto/); d.telefone = q(/^contato/); d.email = q(/^e-?mail/); d.nome = q(/nome completo/); d.profissao = q(/profissao/);
    var dim = casar(DIM.map(function (x) { return x[1]; }), d.dimensao); if (dim) out.cat.dimensao = DIM.filter(function (x) { return x[1] === dim; })[0][0];
    var nums = (d.padraoCliente.replace(/\./g, "").match(/\d{3,}/g) || []).map(Number);
    if (nums.length) { var mid = nums.length > 1 ? (nums[0] + nums[1]) / 2 : nums[0] * 1.05; var p = T.padroes().filter(function (x) { return mid >= x.min && (x.max == null || mid < x.max); })[0]; if (p) out.cat.padrao = p.id; }
    var tp = norm(d.topografia); if (tp) out.cat.dificuldade = /^plano/.test(tp) ? "baixa" : /aclive|declive/.test(tp) && tp.length < 10 ? "normal" : "dificil";
    function linhas(l) { return l.filter(function (x) { return x[1]; }).map(function (x) { return x[0] + ": " + x[1]; }).join("\n"); }
    out.dir.uso = linhas([["Uso", d.uso], ["Moradores", d.moradores], ["Acessibilidade", q(/estrategias de acessibilidade/)], ["Necessidade", q(/deficiencia ou necessidade/)], ["Pavimentos", d.pavimentos], ["Metragem", d.faixa], ["Dimensão", d.dimensao], ["Terreno", d.terreno + (d.topografia ? " · " + d.topografia : "")]]);
    out.dir.expectativas = linhas([["A casa", q(/expectativas em relacao a futura casa/)], ["O projeto", q(/espera em relacao ao projeto/)], ["Mais", q(/tem algo mais/)], ["Ambiente mais importante", q(/ambiente mais importante/)],
      ["Social", q(/especificidades sobre o setor social/)], ["Íntimo", q(/especificidades sobre o setor intimo/) + (q(/especifique aqui o ambiente e quantidade/) ? " " + q(/especifique aqui o ambiente e quantidade/) : "")], ["Serviço", q(/especificidades sobre o setor de servicos/)],
      ["Lazer", q(/especificidades sobre o setor de lazer/)], ["Programa", q(/montamos o programa/)], ["Ambientes", q(/terminamos de configurar/)], ["Itens soltos", q(/devemos considerar algum desses itens/)], ["Considerações finais", q(/parabens, finalizamos/)]]);
    out.dir.estetica = linhas([["Expressão", q(/expresao estetica, qual|expressao estetica, qual/)], ["Materiais", q(/materais que te agradam|materiais que te agradam/)], ["Mais", q(/expresao estetica, se quiser|expressao estetica, se quiser/)]]);
    out.dir.relacao = linhas([["Relação com o exterior (1–5)", q(/importante a relacao com o exterior/)], ["Paisagismo (1–5)", q(/paisagismo/)], ["Rua", q(/relacao com a rua/)], ["Mais", q(/relacao espacial, se quiser/)]]);
    out.dir.sistemas = linhas([["Energia solar", q(/energial? solar/)], ["Reúso de chuva", q(/reuso/)], ["Ar-condicionado", q(/ar condicionado/)], ["Aquecimento de água", q(/^aquecimento de agua/)], ["Automação", q(/automacao/)], ["Mais", q(/questoes tecnicas, use/)]]);
    out.dir.execucao = linhas([["Tempo de execução", q(/tempo de execucao/)], ["Sistema construtivo", q(/sistema construtivo, deseja/)], ["Mais", q(/sistema construtivo, se quiser/)], ["Quem executa", d.executa], ["Investimento", d.valorTexto], ["Financiamento", d.financiamento], ["Padrão marcado", d.padraoCliente]]);
    // programa
    var amb = out.amb, cnt = {};
    function add(tipo, extra) { cnt[tipo] = (cnt[tipo] || 0) + 1; var a = novoAmb(tipo, extra); amb.push(a); return a; }
    function lista(r) { return String(r || "").split(/,\s*(?=[A-ZÀ-Ú])/).map(function (x) { return x.trim(); }).filter(Boolean); }
    lista(q(/ambientes deseja para compor o setor social/)).forEach(function (x) {
      var n = norm(x);
      if (/hall|chapelaria/.test(n)) add("hall"); else if (/^cozinha/.test(n)) add("cozinha"); else if (/sala de jantar/.test(n)) add("jantar");
      else if (/sala de estar/.test(n)) { if (!cnt.estar) add("estar"); } else if (/sala de tv/.test(n)) add("cinema"); else if (/escritorio/.test(n)) add("escritorio");
      else if (/biblioteca/.test(n)) add("biblioteca"); else if (/varanda/.test(n)) add("varanda"); else if (/lavabo/.test(n)) add("lavabo");
      else if (/^banheiro/.test(n)) add("banho", { setor: "social", nome: "Banheiro social" }); else add("outro", { nome: x.replace(/^outro:\s*/i, ""), area: null });
    });
    var gi = q.grid(/setor intimo/);
    Object.keys(gi).forEach(function (k) {
      var n = qtdGrade(gi[k]), i; if (!n) return;
      if (/master/.test(k)) for (i = 0; i < n; i++) { add("suite_master", { nome: n > 1 ? "Suíte master " + (i + 1) : "Suíte master" }); add("banho_master"); add("closet"); }
      else if (/suite/.test(k)) for (i = 0; i < n; i++) { add("quarto", { nome: "Suíte " + (i + 1) }); add("banho", { nome: "Banho suíte " + (i + 1) }); }
      else if (/quarto/.test(k)) for (i = 0; i < n; i++) add("quarto", { nome: "Quarto " + (i + 1) });
      else if (/banheiro/.test(k)) for (i = 0; i < n; i++) add("banho", { nome: "Banheiro " + (i + 1) });
    });
    lista(q(/ambientes deseja para compor o setor de servicos/)).forEach(function (x) {
      var n = norm(x);
      if (/lavanderia/.test(n)) add("lavanderia"); else if (/deposito/.test(n)) add("deposito"); else if (/despensa/.test(n)) add("despensa"); else if (/rouparia/.test(n)) add("rouparia");
      else if (/quarto servico/.test(n)) add("quarto_servico"); else if (/banheiro servico/.test(n)) add("banho_servico"); else add("outro", { nome: x.replace(/^outro:\s*/i, ""), setor: "servico", area: null });
    });
    var gg = q.grid(/garagem, quantas vagas/), med = 0, gra = 0, mot = 0, bic = 0;
    Object.keys(gg).forEach(function (k) { var n = qtdGrade(gg[k]); if (/medio/.test(k)) med = n; else if (/grande/.test(k)) gra = n; else if (/moto/.test(k)) mot = n; else if (/bicicleta/.test(k)) bic = n; });
    if (med + gra) add("garagem", { nome: "Garagem", qtd: med + gra, cfg: { carros_medios: med || undefined, carros_grandes: gra || undefined, motos: mot || undefined, bicicletas: bic || undefined } });
    if (/^sim/i.test(q(/teremos espacos de lazer/)) || q(/compor o setor de lazer/)) lista(q(/compor o setor de lazer/)).forEach(function (x) {
      var n = norm(x);
      if (/gourmet/.test(n)) add("gourmet"); else if (/jogos/.test(n)) add("jogos"); else if (/brinquedoteca/.test(n)) add("brinquedoteca"); else if (/academia/.test(n)) add("academia");
      else if (/piscina/.test(n)) add("piscina"); else if (/sauna/.test(n)) add("sauna"); else if (/hidromassagem/.test(n)) add("hidro"); else if (/fogueira/.test(n)) add("fogueira");
      else if (/campinho|quadra/.test(n)) add("quadra"); else add("outro", { nome: x.replace(/^outro:\s*/i, ""), setor: "lazer", area: null });
    });
    // "Outro" com o mesmo nome de um ambiente marcado em outro setor (ex.: "Piscina natural" + Piscina no lazer): fica só o do catálogo
    for (var ai = amb.length - 1; ai >= 0; ai--) { var ao = amb[ai]; if (ao.tipo !== "outro") continue; var nn = norm(ao.nome); var par = amb.filter(function (b) { return b.tipo !== "outro" && nn.indexOf(norm(tipoAmb(b.tipo).n).split(" ")[0]) === 0; })[0]; if (par) { par.obs = ao.nome; amb.splice(ai, 1); } }
    // configuração dos ambientes
    var cat = catalogo();
    CFG_MAP.forEach(function (m) {
      var r = q(m[2]); if (!r) return; var t = T.byId(cat, m[0]), campo = t && (t.campos || []).filter(function (c) { return c.k === m[1]; })[0]; if (!campo) return;
      var v = valorCampo(campo, r); if (v === undefined) return;
      amb.forEach(function (a) { if (a.tipo === m[0]) a.cfg[m[1]] = v; });
    });
    var bg = q(/como devemos configurar os banheiros gerais/), bm = q(/configuracao especial para o banheiro do dormitorio principal/), bl = q(/lavabo, como devemos configurar/);
    amb.forEach(function (a) {
      if (a.tipo === "banho") Object.assign(a.cfg, cfgBanho(bg));
      if (a.tipo === "banho_master") Object.assign(a.cfg, cfgBanho(bg), cfgBanho(bm, true));
      if (a.tipo === "lavabo") Object.assign(a.cfg, cfgBanho(bl));
    });
    var gl = q.grid(/sobre a lavanderia/), gm = q.grid(/modelo da maquina de lavar/);
    Object.keys(gl).forEach(function (k) { if (qtdGrade(gl[k])) amb.forEach(function (a) { if (a.tipo === "lavanderia") a.cfg.tanque = /grande/.test(k) ? "Inox grande" : /inox/.test(k) ? "Inox" : "Louça"; }); });
    Object.keys(gm).forEach(function (k) { if (qtdGrade(gm[k])) amb.forEach(function (a) { if (a.tipo === "lavanderia") a.cfg.maquina = /frontal/.test(k) ? "Abertura frontal" : "Abertura superior"; }); });
    amb.forEach(function (a) { Object.keys(a.cfg).forEach(function (k) { if (a.cfg[k] === undefined) delete a.cfg[k]; }); });
    if (!amb.length) out.avisos.push("Não reconheci os ambientes: monte o programa na aba Programa.");
    return out;
  }

  // ---------- gravação ----------
  async function salvarOp(id, fn) {
    var atual = op(id); if (!atual) throw new Error("Oportunidade não encontrada");
    var x = T.clone(atual); delete x.id; fn(x); x.atualizadoEm = new Date().toISOString();
    await T.db.doc("com_oport/" + id).set(x);
  }
  function hist(x, txt, extra) { x.hist = (x.hist || []).concat([Object.assign({ em: new Date().toISOString(), txt: txt }, extra || {})]); }
  function mudarEtapa(x, nova, txt) {
    var antes = x.etapa; x.etapa = nova; x.etapaEm = new Date().toISOString();
    if (IDX[nova] != null && (x.etapaMax == null || IDX[nova] > x.etapaMax)) x.etapaMax = IDX[nova];
    hist(x, txt || (etapaNome(antes) + " → " + etapaNome(nova)), { etapa: nova });
  }
  async function salvarConfig(patch) { var ref = T.db.doc("com_config/geral"); if (S.cfg) await ref.update(patch); else await ref.set(Object.assign({}, patch)); }

  // ---------- avisos ("Precisa de você hoje") ----------
  function pendencias() {
    var c = C(), out = [];
    S.ops.forEach(function (o) {
      var nome = esc(o.cliente && o.cliente.nome || o.titulo || "Oportunidade"), d = dias(o.etapaEm);
      if (o.etapa === "reuniao" && o.reuniao && o.reuniao.data && o.reuniao.data <= addDiasYmd(1) && o.reuniao.data >= hoje()) out.push(["", "<b>" + nome + "</b>: reunião " + (o.reuniao.data === hoje() ? "hoje" : "amanhã") + (o.reuniao.hora ? " às " + esc(o.reuniao.hora) : ""), o.id, "Abrir"]);
      if (o.etapa === "reuniao" && o.reuniao && o.reuniao.data && o.reuniao.data < hoje()) out.push(["warn", "<b>" + nome + "</b>: reunião feita — enviar o briefing", o.id, "Enviar briefing"]);
      if (o.etapa === "briefing_enviado" && d >= c.briefingDias) out.push(["warn", "<b>" + nome + "</b>: briefing enviado há " + d + " dias, sem resposta", o.id, "Cobrar"]);
      if (o.etapa === "briefing_recebido") out.push(["", "<b>" + nome + "</b>: briefing recebido — montar a proposta", o.id, "Montar proposta"]);
      if (o.etapa === "proposta_revisao" && o.programa && calc(o).alertaExp && !(o.expectativa && o.expectativa.alinhada)) out.push(["bad", "<b>" + nome + "</b>: expectativa do cliente fora da realidade — alinhar antes de seguir", o.id, "Ver"]);
      if (o.etapa === "proposta_apresentada") {
        var val = o.proposta && o.proposta.validadeAte;
        if (val && val < hoje()) out.push(["bad", "<b>" + nome + "</b>: proposta vencida em " + T.fmtYmd(val), o.id, "Ver"]);
        else if (val && val <= addDiasYmd(5)) out.push(["warn", "<b>" + nome + "</b>: proposta vence em " + T.fmtYmd(val), o.id, "Follow-up"]);
        else if (d >= c.followupDias) out.push(["warn", "<b>" + nome + "</b>: proposta sem resposta há " + d + " dias", o.id, "Follow-up"]);
      }
      if (o.etapa === "fechado" && !o.projetoId) out.push(["", "<b>" + nome + "</b>: contrato assinado — virar projeto", o.id, "Virar projeto"]);
    });
    return out;
  }

  // ---------- HTML base ----------
  var html = '<div id="com-lista"></div><div id="com-op" hidden></div><div id="com-cfg" hidden></div>';

  // ---------- lista (tela principal) ----------
  function abertas() { return S.ops.filter(function (o) { return o.etapa !== "perdido" && !(o.etapa === "fechado" && o.projetoId); }); }
  function renderLista() {
    var c = C(), ano = String(S.ano), mes = T.mesAtual();
    var ab = abertas(), negoc = ab.filter(function (o) { return IDX[o.etapa] >= IDX.proposta_revisao && IDX[o.etapa] <= IDX.contrato; });
    var fechAno = S.ops.filter(function (o) { return o.fechadoEm && o.fechadoEm.slice(0, 4) === ano; }), perdAno = S.ops.filter(function (o) { return o.etapa === "perdido" && o.perda && (o.perda.em || "").slice(0, 4) === ano; });
    var fechMes = S.ops.filter(function (o) { return o.fechadoEm && o.fechadoEm.slice(0, 7) === mes; });
    var somaV = function (l) { return l.reduce(function (s, o) { return s + (valorOp(o) || 0); }, 0); };
    var conv = fechAno.length + perdAno.length ? fechAno.length / (fechAno.length + perdAno.length) * 100 : null;
    var h = '<div class="section-head com-head"><div class="form-actions"><button class="btn btn-primary" data-act="novo">+ Nova oportunidade</button></div>' +
      '<div class="form-actions"><button class="btn btn-small" data-act="cfg">Configurações do comercial</button></div></div>';
    if (S.novo) h += formNovo();
    var pend = pendencias();
    h += '<div class="section-head"><h2 class="section-title">Precisa de você hoje</h2></div>' +
      (pend.length ? '<div class="gp-avisos com-pend">' + pend.map(function (p) { return '<button class="gp-aviso ' + p[0] + '" data-open="' + esc(p[2]) + '">' + p[1] + ' <span class="com-pend-acao">' + esc(p[3]) + " →</span></button>"; }).join("") + "</div>" : '<div class="empty">Nada pendente. Bom trabalho!</div>');
    h += '<div class="card gp-strip com-strip"><div><small>Em negociação</small><b>' + BRL(somaV(negoc)) + "</b><span>" + negoc.length + (negoc.length === 1 ? " proposta" : " propostas") + " em aberto</span></div>" +
      "<div><small>Fechados no mês</small><b>" + BRL(somaV(fechMes)) + "</b><span>" + fechMes.length + (fechMes.length === 1 ? " contrato" : " contratos") + "</span></div>" +
      "<div><small>Conversão em " + ano + "</small><b>" + pct(conv, 0) + "</b><span>" + fechAno.length + " fechadas · " + perdAno.length + " perdidas</span></div>" +
      "<div><small>Ticket médio " + ano + "</small><b>" + BRL(fechAno.length ? somaV(fechAno) / fechAno.length : null) + "</b><span>por contrato fechado</span></div></div>";
    // funil
    h += '<div class="section-head"><h2 class="section-title">Funil</h2><span class="section-meta">' + ab.length + (ab.length === 1 ? " oportunidade aberta" : " oportunidades abertas") + "</span></div>";
    if (!S.loaded && !S.ops.length) h += '<div class="empty">Carregando oportunidades…</div>';
    else if (!ab.length) h += '<div class="empty">Nenhuma oportunidade aberta. Use "+ Nova oportunidade".</div>';
    else h += '<div class="com-funil">' + ETAPAS.map(function (e) {
      var l = ab.filter(function (o) { return o.etapa === e[0]; }).sort(function (a, b) { return (a.etapaEm || "").localeCompare(b.etapaEm || ""); });
      var tot = somaV(l);
      return '<div class="com-col"><div class="com-col-h"><b>' + e[1] + "</b><span>" + l.length + (tot ? " · " + BRL(tot) : "") + "</span></div>" + (l.length ? l.map(cardOp).join("") : '<div class="com-col-vazia">—</div>') + "</div>";
    }).join("") + "</div>";
    // gráficos do ano
    h += '<div class="section-head"><h2 class="section-title">O ano no comercial</h2><div class="segmented">' + [S.ano - 1, S.ano].concat(S.ano < new Date().getFullYear() ? [S.ano + 1] : []).map(function (a) { return '<button class="seg-pill' + (a === S.ano ? " is-selected" : "") + '" data-ano="' + a + '">' + a + "</button>"; }).join("") + "</div></div>";
    var meta = +c.metaAnual || 0, fv = somaV(fechAno), pm = meta ? Math.min(100, fv / meta * 100) : 0;
    h += '<div class="com-graficos"><div class="card chart-card"><div class="chart-head"><div class="chart-title">Propostas apresentadas × fechadas por mês</div><div class="legend"><span><i style="background:var(--serie-b)"></i>Apresentadas</span><span><i style="background:var(--serie-a)"></i>Fechadas</span></div></div>' +
      '<div class="chart" id="com-chart"></div><div class="chart-tip" id="com-tip" hidden></div></div>' +
      '<div class="card com-side"><div class="chart-title">Valor fechado × meta ' + ano + '</div><div class="com-meta"><b>' + BRL(fv) + "</b><span>de " + BRL(meta) + (c.provisorio ? " (meta provisória)" : "") + '</span></div><div class="meter"><i style="width:' + pm + '%"></i></div><span class="hint">' + T.fmtNum(pm, 0) + "% da meta</span>" +
      '<div class="chart-title" style="margin-top:14px">Funil do ano</div>' + funilAno(ano) +
      '<div class="chart-title" style="margin-top:14px">Origem de quem fechou</div>' + origens(fechAno) + "</div></div>";
    // encerradas
    var fim = S.ops.filter(function (o) { return o.etapa === "perdido" || (o.etapa === "fechado" && o.projetoId); }).sort(function (a, b) { return (b.atualizadoEm || "").localeCompare(a.atualizadoEm || ""); });
    h += '<div class="section-head"><h2 class="section-title">Encerradas</h2><button class="btn btn-small" data-act="verfim">' + (S.verFim ? "Esconder" : "Mostrar") + " (" + fim.length + ")</button></div>";
    if (S.verFim) h += fim.length ? '<div class="gp-cards">' + fim.map(cardOp).join("") + "</div>" : '<div class="empty">Nenhuma ainda.</div>';
    $("com-lista").innerHTML = h;
    desenharGrafico(ano);
  }
  function cardOp(o) {
    var d = dias(o.etapaEm), v = valorOp(o), area = (o.sim && o.sim.area) || (o.programa && areaProg(o) ? Math.round(areaProg(o) * 1.2) : null);
    var cls = o.etapa === "perdido" || o.etapa === "fechado" ? "" : d >= 14 ? " danger" : d >= 7 ? " warn" : "";
    return '<button class="card com-card" data-open="' + esc(o.id) + '"><span class="com-card-n">' + esc(o.cliente && o.cliente.nome || o.titulo || "Sem nome") + "</span>" +
      '<span class="com-card-m">' + esc(tipoNome(o.tipo)) + (area ? " · " + T.fmtNum(area, 0) + " m²" : "") + (o.etapa === "perdido" ? " · perdido" + (o.perda && o.perda.motivo ? " (" + esc(o.perda.motivo) + ")" : "") : o.etapa === "fechado" ? " · virou projeto" : "") + "</span>" +
      '<span class="com-card-f"><b>' + (v ? BRL(v) : "—") + '</b><span class="pill' + cls + '">' + (o.etapa === "perdido" || o.etapa === "fechado" ? T.fmtData(o.atualizadoEm) : d + (d === 1 ? " dia" : " dias")) + "</span></span></button>";
  }
  function funilAno(ano) {
    var l = S.ops.filter(function (o) { return (o.criadoEm || "").slice(0, 4) === ano; }); if (!l.length) return '<div class="empty">Sem oportunidades em ' + ano + ".</div>";
    var marcos = [["Contatos", 0], ["Briefing recebido", IDX.briefing_recebido], ["Proposta apresentada", IDX.proposta_apresentada], ["Fechados", IDX.fechado]];
    return '<div class="meters">' + marcos.map(function (m) { var n = l.filter(function (o) { return (o.etapaMax != null ? o.etapaMax : IDX[o.etapa] || 0) >= m[1]; }).length, p = n / l.length * 100; return '<div class="meter-row"><span class="m-label">' + m[0] + '</span><div class="meter"><i style="width:' + p + '%"></i></div><span class="m-val">' + n + " · " + T.fmtNum(p, 0) + "%</span></div>"; }).join("") + "</div>";
  }
  function origens(l) {
    if (!l.length) return '<div class="empty">Nenhum fechamento ainda.</div>';
    var m = {}; l.forEach(function (o) { var k = o.origem || "Não informado"; m[k] = (m[k] || 0) + 1; });
    return '<div class="meters">' + Object.keys(m).sort(function (a, b) { return m[b] - m[a]; }).map(function (k) { var p = m[k] / l.length * 100; return '<div class="meter-row"><span class="m-label">' + esc(k) + '</span><div class="meter"><i style="width:' + p + '%"></i></div><span class="m-val">' + m[k] + "</span></div>"; }).join("") + "</div>";
  }
  function barPath(x, y, w, h) { if (h <= 0) return ""; var r = Math.min(4, h, w / 2); return "M" + x + "," + (y + h) + "V" + (y + r) + "Q" + x + "," + y + " " + (x + r) + "," + y + "H" + (x + w - r) + "Q" + (x + w) + "," + y + " " + (x + w) + "," + (y + r) + "V" + (y + h) + "Z"; }
  function desenharGrafico(ano) {
    var box = $("com-chart"); if (!box) return;
    var serie = T.MESES.map(function (n, i) { var mm = ano + "-" + T.pad(i + 1); return { mes: mm, nome: n, apr: S.ops.filter(function (o) { return o.proposta && (o.proposta.enviadaEm || "").slice(0, 7) === mm; }).length, fec: S.ops.filter(function (o) { return (o.fechadoEm || "").slice(0, 7) === mm; }).length }; });
    var W = Math.max(300, box.clientWidth || 600), H = 190, pl = 30, pr = 6, pt = 10, pb = 26, topo = Math.max(2, Math.max.apply(null, serie.map(function (m) { return Math.max(m.apr, m.fec); })));
    var nt = Math.min(4, topo), step = Math.ceil(topo / nt), max = step * nt, n = 12, bw = (W - pl - pr) / n, bar = Math.max(4, Math.min(16, (bw - 10) / 2)), ih = H - pt - pb;
    var y = function (v) { return pt + ih - v / max * ih; }, mesAt = T.mesAtual();
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Propostas apresentadas e fechadas por mês em ' + ano + '">';
    for (var t = 0; t <= nt; t++) { var yy = Math.round(y(step * t)) + 0.5; s += '<line class="grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + yy + '" y2="' + yy + '"/><text class="ax" x="' + (pl - 8) + '" y="' + (yy + 4) + '" text-anchor="end">' + step * t + "</text>"; }
    serie.forEach(function (m, i) {
      var x0 = pl + i * bw, cx = x0 + bw / 2, ha = m.apr / max * ih, hb = m.fec / max * ih;
      s += '<rect class="band" data-i="' + i + '" x="' + x0 + '" y="' + pt + '" width="' + bw + '" height="' + (ih + pb) + '"/>';
      s += '<path class="bb" pointer-events="none" d="' + barPath(cx - bar - 1, pt + ih - ha, bar, ha) + '"/><path class="ba" pointer-events="none" d="' + barPath(cx + 1, pt + ih - hb, bar, hb) + '"/>';
      var lab = m.nome.slice(0, 3); if (bw < 34 && i % 2) lab = "";
      s += '<text class="ax' + (m.mes === mesAt ? " cur" : "") + '" pointer-events="none" x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle">' + lab + "</text>";
    });
    box.innerHTML = s + "</svg>"; S.serie = serie;
  }
  function mostrarTip(i, band) {
    var m = S.serie && S.serie[i], tip = $("com-tip"); if (!m || !tip) return;
    T.each(".band.on", function (b) { b.classList.remove("on"); }, $("com-chart")); band.classList.add("on");
    tip.innerHTML = "<b>" + m.nome.charAt(0).toUpperCase() + m.nome.slice(1) + '</b><br><i style="background:var(--serie-b)"></i>Apresentadas ' + m.apr + '<br><i style="background:var(--serie-a)"></i>Fechadas ' + m.fec;
    tip.hidden = false;
    var card = tip.parentNode.getBoundingClientRect(), r = band.getBoundingClientRect(), left = r.left - card.left + r.width / 2 - tip.offsetWidth / 2;
    tip.style.left = Math.max(8, Math.min(card.width - tip.offsetWidth - 8, left)) + "px"; tip.style.top = "38px";
  }

  // ---------- nova oportunidade ----------
  function formNovo() {
    var n = S.novo, c = C(), cls = T.cadastros ? T.cadastros.contatos("cliente") : [];
    return '<form class="card com-novo" id="com-novo-f"><h3 class="panel-title">Nova oportunidade</h3><div class="grid-form">' +
      '<div class="field col-12"><span class="label">Tipo</span><div class="segmented">' + TIPOS.map(function (t) { return '<button type="button" class="seg-pill' + (n.tipo === t[0] ? " is-selected" : "") + '" data-ntipo="' + t[0] + '">' + t[1] + "</button>"; }).join("") + "</div></div>" +
      '<div class="field col-6"><label for="cn-cli">Cliente já cadastrado</label><select id="cn-cli"><option value="">— Novo cliente —</option>' + cls.map(function (x) { return '<option value="' + esc(x.id) + '"' + (n.clienteId === x.id ? " selected" : "") + ">" + esc(x.nome) + "</option>"; }).join("") + "</select></div>" +
      '<div class="field col-6"><label for="cn-nome">Nome do cliente</label><input id="cn-nome" value="' + esc(n.nome || "") + '" placeholder="Ex.: Gustavo James" required></div>' +
      '<div class="field col-4"><label for="cn-tel">Telefone (WhatsApp)</label><input id="cn-tel" inputmode="tel" value="' + esc(n.tel || "") + '" placeholder="(32) 9 9999-9999"></div>' +
      '<div class="field col-4"><label for="cn-email">E-mail</label><input id="cn-email" type="email" value="' + esc(n.email || "") + '"></div>' +
      '<div class="field col-4"><label for="cn-origem">Origem</label><select id="cn-origem"><option value="">—</option>' + c.origens.map(function (x) { return "<option>" + esc(x) + "</option>"; }).join("") + "</select></div>" +
      '<div class="field col-6"><label for="cn-ind">Quem indicou</label><input id="cn-ind" placeholder="Se veio por indicação"></div>' +
      '<div class="field col-6"><label for="cn-end">Endereço / local do projeto</label><input id="cn-end"></div>' +
      '<div class="field col-12"><label for="cn-obs">Primeiras informações</label><textarea id="cn-obs" rows="2" placeholder="O que o cliente contou no primeiro contato"></textarea></div>' +
      '<div class="col-12 form-actions"><button class="btn btn-primary" id="cn-salvar" type="submit">Criar oportunidade</button><button class="btn" type="button" data-act="novo-x">Cancelar</button></div></div></form>';
  }
  async function criarOp() {
    var n = S.novo, nome = $("cn-nome").value.trim(); if (!nome) { T.toast("Informe o nome do cliente."); return; }
    var tel = $("cn-tel").value.trim(), email = $("cn-email").value.trim(), cliId = $("cn-cli").value, novoId = null;
    await T.saveWith($("cn-salvar"), async function () {
      if (!cliId && T.cadastros) cliId = await T.cadastros.criarContato({ tipos: ["cliente"], nome: nome, contato: tel, email: email, categoria: "Comercial", endereco: $("cn-end").value.trim() });
      var agora = new Date().toISOString(), obs = $("cn-obs").value.trim();
      var body = { tipo: n.tipo, etapa: "contato", etapaEm: agora, etapaMax: 0, criadoEm: agora, atualizadoEm: agora, clienteId: cliId || null, cliente: { nome: nome, telefone: tel, email: email },
        endereco: $("cn-end").value.trim(), origem: $("cn-origem").value, indicadoPor: $("cn-ind").value.trim(), notas: obs, cat: { dimensao: "confortavel", cliente: "normal" },
        hist: [{ em: agora, txt: "Oportunidade criada" + (obs ? ": " + obs : ""), etapa: "contato" }] };
      novoId = (await T.db.collection("com_oport").add(body)).id;
    });
    if (novoId) { S.novo = null; abrir(novoId); }
  }

  // ---------- oportunidade ----------
  var ABAS = [["resumo", "Resumo"], ["briefing", "Briefing"], ["programa", "Programa"], ["simulador", "Simulador"], ["proposta", "Proposta"], ["historico", "Histórico"]];
  function abrir(id, tab) { S.view = "op"; S.opId = id; S.tab = tab || "resumo"; S.acao = null; S.ed = null; S.dirty = false; S.imp = null; render(); window.scrollTo(0, 0); }
  function ed() { var o = op(S.opId); if (!o) return null; if (!S.ed || S.ed.id !== o.id) S.ed = T.clone(o); return S.ed; }
  function renderOp() {
    var o = op(S.opId); if (!o) { $("com-op").innerHTML = '<div class="empty">' + (S.loaded ? "Oportunidade não encontrada." : "Carregando…") + '</div><button class="btn" data-act="voltar">← Comercial</button>'; return; }
    var x = S.dirty ? ed() : (S.ed = T.clone(o)), r = calc(x), nome = o.cliente && o.cliente.nome || "Sem nome", wa = waLink(o.cliente && o.cliente.telefone);
    var fim = o.etapa === "perdido" || o.etapa === "fechado" && o.projetoId;
    var h = '<div class="gp-p-head"><button class="link" data-act="voltar">← Comercial</button>' +
      '<div class="gp-p-nav"><div><h2 class="gp-p-name">' + esc(nome) + '</h2><div class="hint">' + esc(tipoNome(o.tipo)) + (o.endereco ? " · " + esc(o.endereco) : "") + (o.origem ? " · " + esc(o.origem) : "") + "</div></div>" +
      '<div class="form-actions">' + (o.cliente && o.cliente.telefone ? '<span class="hint">' + esc(o.cliente.telefone) + "</span>" + (wa ? '<a class="btn btn-small" href="' + esc(wa) + '" target="_blank" rel="noopener">WhatsApp</a>' : "") : "") + "</div></div>" +
      '<div class="card gp-strip com-strip"><div><small>Etapa</small><b>' + esc(etapaNome(o.etapa)) + "</b><span>há " + dias(o.etapaEm) + (dias(o.etapaEm) === 1 ? " dia" : " dias") + "</span></div>" +
      "<div><small>Valor</small><b>" + BRL(r.final) + "</b><span>" + (r.valor ? "meu valor" : r.tabela ? "pela tabela de horas" : "monte o programa") + "</span></div>" +
      "<div><small>Área estimada</small><b>" + m2(r.area) + "</b><span>" + ((x.programa && x.programa.amb || []).length) + " ambientes</span></div>" +
      "<div><small>% da obra</small><b>" + pct(r.pctObra, 2) + "</b><span>" + (r.obra ? "obra " + BRL(r.obra) : "defina o padrão") + "</span></div></div>" +
      (fim ? "" : trilha(o)) + proximoPasso(o, r) + "</div>";
    h += '<div class="segmented com-abas">' + ABAS.map(function (a) { return '<button class="seg-pill' + (S.tab === a[0] ? " is-selected" : "") + '" data-tab="' + a[0] + '">' + a[1] + "</button>"; }).join("") + "</div>";
    h += '<div id="com-tab">' + aba(o, x, r) + "</div>";
    $("com-op").innerHTML = h;
  }
  function trilha(o) { var i = IDX[o.etapa]; return '<div class="com-trilha">' + ETAPAS.map(function (e, k) { return '<span class="' + (k < i ? "on" : k === i ? "cur" : "") + '" title="' + e[1] + '"><i></i><small>' + e[1] + "</small></span>"; }).join("") + "</div>"; }
  function proximoPasso(o, r) {
    if (o.etapa === "perdido") return '<div class="card gp-box com-next"><p><b>Oportunidade perdida</b>' + (o.perda ? " · " + esc(o.perda.motivo || "") + (o.perda.nota ? " — " + esc(o.perda.nota) : "") : "") + '</p><div class="form-actions"><button class="btn" data-act="reabrir">Reabrir</button></div></div>';
    if (o.etapa === "fechado" && o.projetoId) { var p = T.projeto(o.projetoId); return '<div class="card gp-box com-next"><p><b>Virou projeto</b>: ' + esc(p ? p.nome : "projeto") + '</p><div class="form-actions">' + (T.gestor && T.gestor.gp(o.projetoId) ? '<button class="btn btn-primary" data-act="ir-gestor">Abrir no Gestor de Projetos</button>' : "") + "</div></div>"; }
    var e = ETAPAS[IDX[o.etapa]], acao = S.acao, h = '<div class="card gp-box com-next"><div class="com-next-h"><div><small class="hint">Próximo passo</small><div class="com-next-t">' + esc(e[2]) + "</div></div>" +
      '<div class="form-actions"><button class="btn btn-primary" data-act="passo">' + esc(e[2]) + "</button>" +
      (o.etapa === "proposta_apresentada" ? '<button class="btn" data-act="perder">Perdido</button>' : '<button class="btn btn-small" data-act="perder">Perdido</button>') + "</div></div>";
    if (acao) h += '<div class="gp-avanco">' + formAcao(o, r, acao) + "</div>";
    return h + "</div>";
  }
  function msgBox(id, txt, tel) {
    var wa = waLink(tel, txt);
    return '<div class="field"><label for="' + id + '">Mensagem</label><textarea id="' + id + '" rows="4">' + esc(txt) + '</textarea></div><div class="form-actions"><button class="btn btn-small" type="button" data-copiar="' + id + '">Copiar mensagem</button>' + (wa ? '<a class="btn btn-small" data-wa="' + id + '" href="' + esc(wa) + '" target="_blank" rel="noopener">Abrir no WhatsApp</a>' : '<span class="hint">Cadastre o telefone para abrir o WhatsApp.</span>') + "</div>";
  }
  function formAcao(o, r, a) {
    var c = C(), tel = o.cliente && o.cliente.telefone;
    if (a === "agendar") return '<div class="grid-form"><div class="field col-4"><label for="ca-data">Data</label><input type="date" id="ca-data" value="' + esc((o.reuniao || {}).data || addDiasYmd(2)) + '"></div><div class="field col-3"><label for="ca-hora">Hora</label><input type="time" id="ca-hora" value="' + esc((o.reuniao || {}).hora || "10:00") + '"></div>' +
      '<div class="field col-5"><label for="ca-local">Local</label><input id="ca-local" value="' + esc((o.reuniao || {}).local || "") + '" placeholder="Escritório, visita ao terreno, on-line…"></div>' +
      '<div class="col-12 hint">' + (T.mcp ? "A reunião entra na Agenda Google do escritório." : "Esta visualização não tem a Agenda Google: a data fica registrada aqui.") + '</div><div class="col-12 form-actions"><button class="btn btn-primary" data-act="ok-agendar">Agendar</button><button class="btn" data-act="cancelar">Cancelar</button></div></div>';
    if (a === "briefing") return '<div class="field"><label for="ca-imp">O que você sentiu desse cliente?</label><textarea id="ca-imp" rows="4" placeholder="História, terreno, vista, desejos, preocupações. Vira a base do texto da proposta e a descrição do projeto.">' + esc(o.impressoes || "") + "</textarea></div>" +
      (c.linkBriefing ? "" : '<p class="hint warn">Cadastre o link do formulário em Configurações do comercial.</p>') + msgBox("ca-msg", preencher(c.msgs.briefing, o), tel) +
      '<div class="form-actions"><button class="btn btn-primary" data-act="ok-briefing">Briefing enviado</button><button class="btn" data-act="cancelar">Cancelar</button></div>';
    if (a === "cobrar") return msgBox("ca-msg", preencher(c.msgs.cobrarBriefing, o), tel) + '<div class="form-actions"><button class="btn btn-primary" data-act="ok-cobrar">Registrar cobrança</button><button class="btn" data-act="cancelar">Fechar</button></div>';
    if (a === "apresentar") {
      var falta = []; if (!r.final) falta.push("valor da proposta (aba Simulador)"); if (!(o.demanda || "").trim()) falta.push("texto \"Sua demanda\" (aba Proposta)");
      var exp = r.alertaExp && !(o.expectativa && o.expectativa.alinhada);
      return (falta.length ? '<p class="hint warn">Antes de apresentar: ' + falta.join(" e ") + ".</p>" : "") +
        (exp ? '<div class="gp-aviso bad">O cliente informou ' + BRL(r.disp) + " para a obra; a estimativa é " + BRL(r.obra) + " (" + T.fmtNum(r.razao, 1) + "×). Alinhe a expectativa com o cliente antes de apresentar (aba Simulador).</div>" : "") +
        '<div class="grid-form"><div class="field col-4"><label for="ca-num">Nº da proposta</label><input id="ca-num" type="number" min="1" value="' + proxNumero() + '"></div><div class="field col-4"><label for="ca-dt">Apresentada em</label><input type="date" id="ca-dt" value="' + hoje() + '"></div><div class="field col-4"><label for="ca-val">Válida até</label><input type="date" id="ca-val" value="' + addDiasYmd(c.validadeDias) + '"></div></div>' +
        '<p class="hint">O PDF da proposta chega na próxima versão; por enquanto, a proposta segue pelo Canva com os números do Simulador.</p>' +
        msgBox("ca-msg", preencher(c.msgs.proposta, o, { validade: T.fmtYmd(addDiasYmd(c.validadeDias)) }), tel) +
        '<div class="form-actions"><button class="btn btn-primary" data-act="ok-apresentar"' + (falta.length ? " disabled" : "") + '>Proposta apresentada</button><button class="btn" data-act="cancelar">Cancelar</button></div>';
    }
    if (a === "followup") return msgBox("ca-msg", preencher(c.msgs.followup, o), tel) + '<div class="form-actions"><button class="btn btn-primary" data-act="ok-followup">Registrar follow-up</button><button class="btn" data-act="cancelar">Fechar</button></div>';
    if (a === "assinado") return '<div class="grid-form"><div class="field col-4"><label for="ca-cnum">Nº do contrato</label><input id="ca-cnum" placeholder="nº do projeto + DDMMAA"></div><div class="field col-4"><label for="ca-cdt">Data</label><input type="date" id="ca-cdt" value="' + hoje() + '"></div><div class="field col-4"><label for="ca-ccid">Cidade</label><input id="ca-ccid" value="Juiz de Fora/MG"></div>' +
      '<div class="field col-6"><label for="ca-cval">Valor fechado (R$)</label><input id="ca-cval" type="number" min="0" step="0.01" value="' + (r.final ? r2(r.final) : "") + '"></div>' +
      '<p class="hint col-12">O contrato .docx preenchido e as parcelas no Financeiro chegam na próxima versão.</p><div class="col-12 form-actions"><button class="btn btn-primary" data-act="ok-assinado">Contrato assinado</button><button class="btn" data-act="cancelar">Cancelar</button></div></div>';
    if (a === "perder") return '<div class="grid-form"><div class="field col-12"><span class="label">Motivo</span><div class="segmented">' + c.motivos.map(function (m) { return '<button type="button" class="seg-pill" data-motivo="' + esc(m) + '">' + esc(m) + "</button>"; }).join("") + '</div></div><div class="field col-12"><label for="ca-pnota">Observação (opcional)</label><input id="ca-pnota"></div><div class="col-12 form-actions"><button class="btn" data-act="cancelar">Cancelar</button></div></div>';
    if (a === "virar") {
      var dz = doZero(o.tipo) || o.tipo === "REF" || o.tipo === "INT";
      if (!dz) return '<p>' + (o.tipo === "MARC" ? "A marcenaria entra no projeto de arquitetura existente: ative-a no Gestor de Projetos (Configurações do projeto › Marcenaria contratada)." : "Serviços menores viram um projeto simples em Cadastros, para as horas serem lançadas no Tempo.") + '</p><div class="form-actions">' + (o.tipo === "SERV" ? '<button class="btn btn-primary" data-act="ok-virar">Criar projeto simples</button>' : '<button class="btn btn-primary" data-act="marc-feito">Marcar como concluído</button>') + '<button class="btn" data-act="cancelar">Cancelar</button></div>';
      var am = (o.programa || {}).amb || [];
      return '<p>Cria o projeto no Gestor de Projetos (Abertura) com o programa (' + am.length + " ambientes), as categorias, as diretrizes do briefing, a descrição e os prazos contratados" + (legalDe(o) ? ", com Projeto Legal" + (o.sim && o.sim.cond ? " (condomínio e prefeitura)" : "") : "") + ".</p>" +
        '<div class="grid-form"><div class="field col-6"><label for="cv-nome">Nome do projeto</label><input id="cv-nome" value="' + esc("Casa " + (String(nome0(o)).split(/\s+/).slice(-1)[0] || "")) + '"></div>' +
        '<div class="field col-6"><label for="cv-pavs">Pavimentos (separados por vírgula)</label><input id="cv-pavs" value="' + esc(((o.programa || {}).pavs || ["Térreo"]).join(", ")) + '"></div></div>' +
        '<div class="form-actions"><button class="btn btn-primary" data-act="ok-virar">Criar projeto</button><button class="btn" data-act="cancelar">Cancelar</button></div>';
    }
    return "";
  }
  function nome0(o) { return o.cliente && o.cliente.nome || o.titulo || ""; }
  function proxNumero() { var c = C(), m = S.ops.reduce(function (s, o) { var n = o.proposta && +o.proposta.numero; return n && n > s ? n : s; }, 0); return m ? m + 1 : c.propostaInicial; }

  // ---------- abas ----------
  function aba(o, x, r) {
    if (S.tab === "briefing") return abaBriefing(o);
    if (S.tab === "programa") return abaPrograma(x, r);
    if (S.tab === "simulador") return abaSimulador(x, r);
    if (S.tab === "proposta") return abaProposta(o, x, r);
    if (S.tab === "historico") return abaHistorico(o);
    return abaResumo(o, x, r);
  }
  function abaResumo(o, x, r) {
    var c = C(), cl = o.cliente || {}, d = o.dados || {};
    return '<div class="gp-cols"><form class="card gp-box" id="cr-form"><h3 class="panel-title">Cliente e oportunidade</h3><div class="grid-form">' +
      '<div class="field col-6"><label for="cr-nome">Nome</label><input id="cr-nome" value="' + esc(cl.nome || "") + '"></div><div class="field col-6"><label for="cr-tel">Telefone</label><input id="cr-tel" value="' + esc(cl.telefone || "") + '"></div>' +
      '<div class="field col-6"><label for="cr-email">E-mail</label><input id="cr-email" value="' + esc(cl.email || "") + '"></div><div class="field col-6"><label for="cr-tipo">Tipo</label><select id="cr-tipo">' + T.optHtml(TIPOS, o.tipo) + "</select></div>" +
      '<div class="field col-12"><label for="cr-end">Endereço do projeto</label><input id="cr-end" value="' + esc(o.endereco || "") + '"></div>' +
      '<div class="field col-6"><label for="cr-origem">Origem</label><select id="cr-origem">' + T.optHtml([["", "—"]].concat(c.origens.map(function (k) { return [k, k]; })), o.origem || "") + '</select></div><div class="field col-6"><label for="cr-ind">Quem indicou</label><input id="cr-ind" value="' + esc(o.indicadoPor || "") + '"></div>' +
      '<div class="field col-6"><label for="cr-resp">Responsável</label><select id="cr-resp">' + T.optHtml([["", "—"]].concat(T.pessoasAtivas().map(function (p) { return [p.id, p.nome]; })), o.responsavel || "") + "</select></div>" +
      '<div class="field col-12"><label for="cr-imp">Impressões do arquiteto</label><textarea id="cr-imp" rows="4" placeholder="O que você sentiu desse cliente: história, terreno, vista, desejos, preocupações">' + esc(o.impressoes || "") + "</textarea></div>" +
      '<div class="field col-12"><label for="cr-notas">Notas</label><textarea id="cr-notas" rows="2">' + esc(o.notas || "") + '</textarea></div>' +
      '<div class="col-12 form-actions"><button class="btn btn-primary" id="cr-salvar" type="submit">Salvar</button>' + (o.clienteId && T.cadastros ? '<span class="hint">Contato em Cadastros</span>' : "") + "</div></div></form>" +
      '<div class="gp-box"><div class="card gp-box"><h3 class="panel-title">Números</h3>' +
      kv("Padrão", r.pad ? T.padraoRotulo(r.pad) : "—") + kv("Custo estimado da obra", BRL(r.obra)) + kv("Valor da proposta", BRL(r.final)) + kv("% do custo da obra", pct(r.pctObra, 2)) + kv("Horas estimadas", horas(r.hAj)) + kv("Lucro resultante", pct(r.lucroRes)) + "</div>" +
      (d.valorDisponivel || d.padraoCliente ? '<div class="card gp-box"><h3 class="panel-title">O que o cliente informou</h3>' + kv("Investimento disponível", d.valorTexto || BRL(d.valorDisponivel)) + kv("Padrão marcado no briefing", d.padraoCliente || "—") + kv("Dimensão", d.dimensao || "—") + kv("Terreno", [d.terreno, d.topografia].filter(Boolean).join(" · ") || "—") +
        (r.alertaExp ? '<div class="gp-aviso ' + (o.expectativa && o.expectativa.alinhada ? "ok" : "bad") + '">' + (o.expectativa && o.expectativa.alinhada ? "Expectativa alinhada com o cliente ✓" : "Obra estimada em " + T.fmtNum(r.razao, 1) + "× o valor informado: alinhar a expectativa antes de seguir.") + "</div>" : "") + "</div>" : "") + "</div></div>";
  }
  function kv(l, v) { return '<div class="kv-row"><span>' + esc(l) + "</span><b>" + (v == null || v === "" ? "—" : v) + "</b></div>"; }

  function abaBriefing(o) {
    var b = o.briefing || {}, h = "";
    if (S.imp) {
      var t = S.imp.tab, k = S.imp.k, resp = t ? respostas(t, k) : null;
      h += '<div class="card gp-box"><h3 class="panel-title">Conferir antes de importar</h3>' +
        (t ? (t.rows.length > 1 ? '<div class="field"><label for="cb-linha">Linha (cliente)</label><select id="cb-linha">' + t.rows.map(function (rw, i) { return '<option value="' + i + '"' + (i === k ? " selected" : "") + ">" + esc(rotuloLinha(t, i)) + "</option>"; }).join("") + "</select></div>" : "") +
          '<p class="hint">' + resp.length + " respostas reconhecidas. O app monta o programa, as categorias sugeridas e as diretrizes; você revisa nas abas Programa e Simulador.</p>" +
          '<div class="com-resp">' + resp.slice(0, 8).map(function (x) { return "<div><small>" + esc(x.p) + "</small><span>" + esc(x.r) + "</span></div>"; }).join("") + (resp.length > 8 ? '<div class="hint">… e mais ' + (resp.length - 8) + "</div>" : "") + "</div>"
          : '<p class="hint warn">Não reconheci uma tabela (linha de títulos + linha de respostas). O texto será guardado como está, e o programa é montado à mão.</p>') +
        '<div class="form-actions"><button class="btn btn-primary" id="cb-ok" data-act="imp-ok">Importar</button><button class="btn" data-act="imp-x">Cancelar</button></div></div>';
    } else {
      h += '<div class="card gp-box"><h3 class="panel-title">' + (b.resp ? "Importar de novo" : "Importar respostas") + "</h3>" +
        '<p class="hint">Na planilha de respostas do formulário (Google Sheets), selecione a <b>linha de títulos</b> e a <b>linha do cliente</b>, copie e cole aqui. Também aceita o arquivo CSV.</p>' +
        '<div class="field"><label for="cb-txt">Respostas</label><textarea id="cb-txt" rows="5" placeholder="Cole aqui a linha de títulos e a linha do cliente"></textarea></div>' +
        '<div class="form-actions"><button class="btn btn-primary" data-act="imp-ler">Ler respostas</button><label class="btn btn-small com-file">Enviar CSV<input type="file" id="cb-csv" accept=".csv,.tsv,.txt" hidden></label></div></div>';
    }
    if (b.resp && b.resp.length) h += '<div class="card gp-box"><div class="section-head" style="margin:0"><h3 class="panel-title" style="margin:0">Respostas do cliente</h3><span class="section-meta">importadas em ' + T.fmtData(b.recebidoEm) + "</span></div>" +
      '<div class="com-resp">' + b.resp.map(function (x) { return "<div><small>" + esc(x.p) + "</small><span>" + esc(x.r) + "</span></div>"; }).join("") + "</div></div>";
    else if (!S.imp) h += '<div class="empty">Ainda sem respostas importadas.' + (b.enviadoEm ? " Briefing enviado em " + T.fmtData(b.enviadoEm) + "." : "") + "</div>";
    return h;
  }

  function abaPrograma(x, r) {
    var p = x.programa || (x.programa = { pavs: ["Térreo"], amb: [] }), c = C();
    var h = '<div class="card gp-box"><div class="section-head" style="margin:0"><h3 class="panel-title" style="margin:0">Programa de necessidades</h3><div class="form-actions">' +
      (x.briefing && x.briefing.resp ? '<button class="btn btn-small" data-act="prog-brief">Refazer pelo briefing</button>' : "") + '<button class="btn btn-small" data-act="prog-padrao">Residência padrão</button></div></div>' +
      '<div class="grid-form"><div class="field col-12"><label for="cp-pavs">Pavimentos (separados por vírgula)</label><input id="cp-pavs" data-prog="pavs" value="' + esc((p.pavs || []).join(", ")) + '"></div></div>';
    if (!p.amb.length) h += '<div class="empty">Sem ambientes. Importe o briefing ou comece pela residência padrão.</div>';
    SETORES.forEach(function (s) {
      var l = p.amb.map(function (a, i) { return { a: a, i: i }; }).filter(function (o) { return (o.a.setor || "social") === s[0]; }); if (!l.length) return;
      var sub = l.reduce(function (t, o) { return t + (+o.a.area || 0) * (+o.a.qtd || 1); }, 0);
      h += '<div class="com-setor"><div class="com-setor-h"><b>' + s[1] + "</b><span>" + m2(sub) + '</span></div><div class="table-wrap as-list"><table class="com-tab"><thead><tr><th>Ambiente</th><th>Qtd.</th><th>Área (m²)</th><th>Total</th><th>Horas</th><th></th></tr></thead><tbody>' +
        l.map(function (o) {
          var a = o.a, hr = (+c.horasAmb[a.tipo] || +c.horasAmb.outro || 0) * (+a.qtd || 1), cfg = resumoCfg(a);
          return '<tr><td data-l="Ambiente"><input class="ctl com-in-n" data-amb="' + o.i + '" data-k="nome" value="' + esc(a.nome) + '" aria-label="Nome do ambiente">' + (cfg ? '<div class="hint com-cfg">' + esc(cfg) + "</div>" : "") + "</td>" +
            '<td data-l="Qtd."><input class="ctl com-in-q" type="number" min="1" data-amb="' + o.i + '" data-k="qtd" value="' + (a.qtd || 1) + '" aria-label="Quantidade"></td>' +
            '<td data-l="Área"><input class="ctl com-in-q" type="number" min="0" step="0.5" data-amb="' + o.i + '" data-k="area" value="' + (a.area != null ? a.area : "") + '" placeholder="x" aria-label="Área (m²)"></td>' +
            '<td data-l="Total" class="num">' + (a.area != null ? T.fmtNum((+a.area || 0) * (+a.qtd || 1), 1) : "x") + '</td><td data-l="Horas" class="num">' + hr + ' h</td><td class="acts"><button class="link danger" data-rmamb="' + o.i + '">Remover</button></td></tr>';
        }).join("") + "</tbody></table></div></div>";
    });
    var ops = catalogo().map(function (t) { return [t.id, t.n + " (" + (SETORES.filter(function (s) { return s[0] === t.s; })[0] || ["", ""])[1] + ")"]; });
    h += '<div class="form-actions"><select class="ctl" id="cp-add">' + T.optHtml(ops, "") + '</select><button class="btn btn-small" data-act="prog-add">+ Ambiente</button></div>';
    h += '<div class="com-tot" id="cp-tot">' + totaisProg(r) + "</div>";
    h += '<div class="form-actions"><button class="btn btn-primary" id="cp-salvar" data-act="prog-salvar">Salvar programa</button>' + (S.dirty ? '<span class="save-state dirty">Alterações não salvas</span>' : "") + "</div>";
    return h + '<p class="hint">Áreas de referência do catálogo de Ambientes padrão (dimensão Confortável); horas de referência em Configurações do comercial. A configuração de cada ambiente vem do briefing e se ajusta no Gestor de Projetos, depois de virar projeto.</p></div>';
  }
  function resumoCfg(a) { var c = a.cfg || {}; return Object.keys(c).map(function (k) { var v = c[k]; return v === true ? k.replace(/_/g, " ") : v === false ? "" : Array.isArray(v) ? v.join(", ") : String(v); }).filter(Boolean).join(" · "); }
  function totaisProg(r) {
    return kv("Soma dos ambientes", m2(r.areaAmb)) + kv("+ 10% circulação", m2(r.circ)) + kv("+ 10% paredes e estrutura", m2(r.paredes)) + '<div class="kv-row com-tot-final"><span>Total estimado</span><b>' + m2(r.areaAmb * 1.2) + "</b></div>";
  }

  function abaSimulador(x, r) {
    var s = x.sim || (x.sim = {}), cat = x.cat || (x.cat = {}), c = C(), d = x.dados || {}, pz = x.prazos || {};
    var pzPad = Object.assign({}, T.DEFAULT_CONFIG.prazosPadrao, T.cfg().prazosPadrao || {}), ref = !doZero(x.tipo);
    function num(id, k, v, ph, extra) { return '<input type="number" id="' + id + '" data-sim="' + k + '" value="' + (v != null ? v : "") + '"' + (ph != null ? ' placeholder="' + esc(ph) + '"' : "") + (extra || ' min="0" step="any"') + ">"; }
    function selC(id, k, opts, v) { return '<select id="' + id + '" data-cat="' + k + '">' + T.optHtml([["", "—"]].concat(opts), v || "") + "</select>"; }
    var h = '<div class="gp-cols"><div class="card gp-box" id="cs-in"><h3 class="panel-title">Entradas</h3><div class="grid-form">' +
      '<div class="field col-6"><label for="cs-area">Área estimada (m²)</label>' + num("cs-area", "area", s.area, r.areaAmb ? T.fmtNum(r.areaAmb * 1.2, 1).replace(/\./g, "") : "") + '<span class="hint">Vazio = total do programa</span></div>' +
      '<div class="field col-6"><label for="cs-pad">Padrão da obra</label>' + selC("cs-pad", "padrao", T.padraoOpts(), cat.padrao) + (d.padraoCliente ? '<span class="hint">Cliente marcou: ' + esc(d.padraoCliente) + "</span>" : "") + "</div>" +
      '<div class="field col-6"><label for="cs-m2">Custo da obra (R$/m²)</label>' + num("cs-m2", "custoM2", s.custoM2, r.pad ? Math.round(r.m2) : "") + "</div>" +
      '<div class="field col-6"><label for="cs-m2a">Banda pra cima (R$/m²)</label>' + num("cs-m2a", "custoM2Alto", s.custoM2Alto, r.pad ? Math.round(r.m2a) : "") + "</div>" +
      '<div class="field col-4"><label for="cs-dim">Dimensão</label>' + selC("cs-dim", "dimensao", DIM, cat.dimensao) + "</div>" +
      '<div class="field col-4"><label for="cs-dif">Terreno</label>' + selC("cs-dif", "dificuldade", DIF, cat.dificuldade) + "</div>" +
      '<div class="field col-4"><label for="cs-cli">Perfil do cliente</label>' + selC("cs-cli", "cliente", PERFIS, cat.cliente) + '<span class="hint">Interno, nunca vai à proposta</span></div>' +
      (doZero(x.tipo) ? '<div class="field col-6"><label class="gp-check"><input type="checkbox" data-simb="legal"' + (legalDe(x) ? " checked" : "") + "> Projeto Legal</label></div>" +
        '<div class="field col-6"><label class="gp-check"><input type="checkbox" data-simb="cond"' + (s.cond ? " checked" : "") + (legalDe(x) ? "" : " disabled") + "> Há condomínio (dois projetos)</label></div>" : "") +
      '<div class="field col-12 com-meu"><label for="cs-meu">Meu valor (R$)</label>' + num("cs-meu", "meuValor", s.meuValor, r.tabela ? Math.round(r.tabela) : "") + '<span class="hint">Vazio = preço pela tabela de horas</span></div>' +
      '<div class="field col-6"><label for="cs-ent">Entrada (R$)</label>' + num("cs-ent", "entrada", s.entrada, r.final ? Math.round(r.final * 0.1) : "") + "</div>" +
      '<div class="field col-6"><label for="cs-np">Parcelas (quantas)</label>' + num("cs-np", "parcelas", s.parcelas, "9", ' min="0" step="1"') + "</div>" +
      '<div class="col-12 cfg-pesos-t">Prazos (dias úteis)</div>' +
      (ref ? [["ep", "Estudo Preliminar", pzPad.refEp], ["pe", "Executivo", pzPad.refPe]] : [["ep", "Estudo Preliminar", pzPad.ep], ["ap", "Anteprojeto", pzPad.ap], ["pe", "Executivo", pzPad.pe]].concat(legalDe(x) ? [["plDev", "Legal (desenvolver)", pzPad.plDev]] : [])).map(function (p) {
        return '<div class="field col-3"><label for="cs-pz-' + p[0] + '">' + p[1] + '</label><input type="number" min="1" step="1" id="cs-pz-' + p[0] + '" data-pz="' + p[0] + '" value="' + (pz[p[0]] || "") + '" placeholder="' + (p[2] || "") + '"></div>';
      }).join("") +
      '<div class="col-12 form-actions"><button class="btn btn-primary" id="cs-salvar" data-act="sim-salvar">Salvar simulação</button>' + (S.dirty ? '<span class="save-state dirty">Alterações não salvas</span>' : "") + "</div></div></div>" +
      '<div id="cs-out">' + saidaSim(x, r) + "</div></div>";
    return h;
  }
  function saidaSim(x, r) {
    var c = C(), h = "";
    if (r.disp) {
      var al = x.expectativa && x.expectativa.alinhada;
      h += '<div class="card gp-box"><h3 class="panel-title">Expectativa do cliente</h3>' + kv("Investimento informado", BRL(r.disp)) + kv("Custo estimado da obra", BRL(r.obra) + (r.obraAlta ? " a " + BRL(r.obraAlta) : "")) +
        (r.alertaExp ? '<div class="gp-aviso ' + (al ? "ok" : "bad") + '">' + (al ? "Expectativa alinhada com o cliente ✓" : "A obra estimada é " + T.fmtNum(r.razao, 1) + "× o valor informado. Converse com o cliente sobre área, padrão ou etapas antes de apresentar a proposta.") + "</div>" +
          '<label class="gp-check"><input type="checkbox" id="cs-exp"' + (al ? " checked" : "") + "> Expectativa alinhada com o cliente</label>" : '<p class="hint">Dentro do esperado.</p>') + "</div>";
    }
    h += '<div class="card gp-box com-res"><h3 class="panel-title">Preço do projeto</h3>' +
      '<div class="com-destaque"><small>Investimento no projeto</small><b>' + BRL(r.final) + "</b><span>" + pct(r.pctObra, 2) + " do custo estimado da obra" + (r.valor && r.tabela ? " · tabela " + BRL(r.tabela) + " (" + pct(r.pctObraTab, 2) + ")" : "") + "</span></div>" +
      regua(r) +
      kv("R$/m² de projeto", r.m2proj ? BRL(r.m2proj) : "—") +
      kv("Lucro resultante", pct(r.lucroRes) + (r.valor ? " (meta " + T.fmtNum(r.luc, 0) + "%)" : "")) +
      (r.dif != null ? kv("Diferença para a tabela", (r.dif >= 0 ? "+" : "") + BRL(r.dif)) : "") +
      (r.parcela ? kv("Pagamento", "entrada de " + BRL(r.entrada) + " + " + r.np + " × " + BRL(r.parcela)) : "") +
      kv("Com nota fiscal (+" + T.fmtNum(c.nfPct, 0) + "%)", r.final ? BRL(r.final * (1 + c.nfPct / 100)) : "—") + "</div>";
    h += '<div class="card gp-box"><h3 class="panel-title">Como o preço foi calculado</h3>' +
      kv("Horas dos ambientes", horas(r.hAmb)) + kv("Horas gerais", horas(r.hGer)) +
      kv("Fatores", "padrão " + T.fmtNum(r.f.padrao, 2) + " · dimensão " + T.fmtNum(r.f.dimensao, 2) + " · terreno " + T.fmtNum(r.f.terreno, 2) + " · cliente " + T.fmtNum(r.f.cliente, 2) + " = ×" + T.fmtNum(r.fTotal, 2)) +
      kv("Horas ajustadas", horas(r.hAj)) + kv("Custo-hora", BRL(r.ch.v)) + '<p class="hint">' + esc(r.ch.src) + "</p>" + kv("Custo das horas", BRL(r.custo)) +
      kv("Impostos · reserva · lucro", T.fmtNum(r.imp.v, 1) + "% (" + r.imp.src + ") · " + T.fmtNum(r.res, 0) + "% · " + T.fmtNum(r.luc, 0) + "%") + kv("Preço pela tabela de horas", BRL(r.tabela)) +
      kv("Referência CAU (" + T.fmtNum(c.cauPct, 1) + "% da obra)", BRL(r.cau)) + kv("Mercado (" + BRL(c.mercadoMin) + "–" + BRL(c.mercadoMax) + "/m²)", r.merc ? BRL(r.merc[0]) + " a " + BRL(r.merc[1]) : "—") +
      '<div class="cfg-pesos-t" style="margin-top:8px">Por etapa</div>' + r.etapas.map(function (e) { return kv(e.nome, horas(e.h) + (e.v ? " · " + BRL(e.v) : "")); }).join("") +
      (c.provisorio ? '<p class="hint warn">Horas, fatores e percentuais são provisórios (Configurações do comercial).</p>' : "") + "</div>";
    return h;
  }
  // Régua: os valores de referência lado a lado (horas, CAU, mercado, meu valor) numa mesma escala.
  function regua(r) {
    var pts = [["Tabela de horas", r.tabela], ["CAU", r.cau], ["Mercado", r.merc ? (r.merc[0] + r.merc[1]) / 2 : null], ["Meu valor", r.valor]].filter(function (p) { return p[1]; });
    if (!pts.length) return "";
    var max = Math.max.apply(null, pts.map(function (p) { return p[1]; }).concat(r.merc ? [r.merc[1]] : [])) * 1.08;
    var band = r.merc ? '<span class="com-r-band" style="left:' + (r.merc[0] / max * 100) + "%;width:" + ((r.merc[1] - r.merc[0]) / max * 100) + '%" title="Faixa de mercado"></span>' : "";
    return '<div class="com-regua" role="img" aria-label="Comparativo de valores"><div class="com-r-track">' + band + pts.map(function (p) { return '<span class="com-r-pt' + (p[0] === "Meu valor" ? " meu" : "") + '" style="left:' + (p[1] / max * 100) + '%"></span>'; }).join("") + "</div>" +
      '<div class="com-r-leg">' + pts.sort(function (a, b) { return a[1] - b[1]; }).map(function (p) { return '<span class="' + (p[0] === "Meu valor" ? "meu" : "") + '"><i></i>' + p[0] + " <b>" + BRL(p[1]) + "</b></span>"; }).join("") + "</div></div>";
  }

  function abaProposta(o, x, r) {
    var p = o.proposta || {}, am = (x.programa || {}).amb || [];
    return '<div class="gp-cols"><form class="card gp-box" id="cpp-form"><h3 class="panel-title">Sua demanda</h3><p class="hint">Texto da proposta sobre o cliente e a casa (3ª pessoa, no jeito Trilha). Vira também a descrição do projeto no Gestor. A redação pela IA chega na próxima versão.</p>' +
      '<div class="field"><label for="cpp-dem">Texto</label><textarea id="cpp-dem" rows="12" placeholder="Residência para moradia…">' + esc(o.demanda || "") + "</textarea></div>" +
      '<div class="form-actions"><button class="btn btn-primary" id="cpp-salvar" type="submit">Salvar texto</button></div>' +
      (o.impressoes ? '<div class="cfg-pesos-t">Impressões do arquiteto</div><p class="hint">' + esc(o.impressoes) + "</p>" : "") + "</form>" +
      '<div class="card gp-box"><h3 class="panel-title">Resumo para a proposta</h3>' + kv("Nº", p.numero ? p.numero + "_" + (p.enviadaEm ? p.enviadaEm.slice(8, 10) + p.enviadaEm.slice(5, 7) + p.enviadaEm.slice(2, 4) : "") : "definido ao apresentar") +
      kv("Área estimada", m2(r.area)) + kv("Ambientes", am.length) + kv("Padrão", r.pad ? T.padraoRotulo(r.pad) : "—") + kv("Custo da obra", r.obra ? BRL(r.obra) + (r.obraAlta ? " a " + BRL(r.obraAlta) : "") : "—") +
      r.etapas.map(function (e) { return kv(e.nome, horas(e.h)); }).join("") + kv("Investimento", BRL(r.final) + (r.valor && r.tabela && r.valor < r.tabela ? " (de " + BRL(r.tabela) + ")" : "")) +
      kv("% do custo da obra", pct(r.pctObra, 2)) + (r.parcela ? kv("Pagamento", "entrada de " + BRL(r.entrada) + " + " + r.np + " × " + BRL(r.parcela)) : "") + kv("Válida até", p.validadeAte ? T.fmtYmd(p.validadeAte) : "—") + "</div></div>";
  }
  function abaHistorico(o) {
    return '<div class="card gp-box"><form class="form-actions" id="ch-form"><input class="ctl com-in-n" id="ch-txt" placeholder="Registrar uma conversa, ligação, decisão…" aria-label="Novo registro"><button class="btn btn-small btn-primary" id="ch-salvar" type="submit">Registrar</button></form>' +
      '<div class="gp-hist">' + (o.hist || []).slice().reverse().map(function (h) { return '<div class="com-hist"><small>' + T.fmtDataHora(h.em) + "</small><span>" + esc(h.txt) + "</span></div>"; }).join("") + "</div></div>";
  }

  // ---------- configurações do comercial ----------
  function renderCfg() {
    var c = S.cfgEd || (S.cfgEd = T.clone(C())), cat = catalogo();
    function n(k, l, step, hint) { return '<div class="field col-3"><label for="cc-' + k + '">' + l + '</label><input type="number" step="' + (step || "any") + '" min="0" id="cc-' + k + '" data-cc="' + k + '" value="' + (c[k] != null ? c[k] : "") + '">' + (hint ? '<span class="hint">' + hint + "</span>" : "") + "</div>"; }
    function fat(g, l, opts) { return '<div class="col-12 cfg-pesos-t">' + l + "</div>" + opts.map(function (o) { return '<div class="field col-3"><label for="cf-' + g + o[0] + '">' + esc(o[1]) + '</label><input type="number" step="0.01" min="0" id="cf-' + g + o[0] + '" data-fat="' + g + "|" + o[0] + '" value="' + (c.fatores[g][o[0]] != null ? c.fatores[g][o[0]] : "") + '"></div>'; }).join(""); }
    var h = '<div class="gp-p-head"><button class="link" data-act="voltar">← Comercial</button><h2 class="gp-p-name">Configurações do comercial</h2>' +
      (c.provisorio ? '<div class="gp-aviso warn">Valores <b>provisórios</b>, preenchidos pelo Claude para testar. Revise e salve: ao salvar, o aviso some.</div>' : "") + "</div>";
    h += '<form class="card gp-box" id="cc-form"><h3 class="panel-title">Percentuais e valores</h3><div class="grid-form">' +
      n("custoHoraPadrao", "Custo-hora reserva (R$)", "0.01", "Usado só enquanto a equipe não tem custo-hora") + n("impostoPct", "Impostos (%)", "0.1", S.fin && S.fin.impostoPct != null ? "O Financeiro manda: " + S.fin.impostoPct + "%" : "Enquanto o Financeiro não tiver") +
      n("reservaPct", "Reserva (%)", "0.1") + n("lucroPct", "Lucro (%)", "0.1") + n("nfPct", "Acréscimo com nota fiscal (%)", "0.1") + n("cauPct", "Referência CAU (% da obra)", "0.1") +
      n("mercadoMin", "Mercado: de (R$/m² de projeto)", "1") + n("mercadoMax", "Mercado: até (R$/m² de projeto)", "1") + n("metaAnual", "Meta anual (R$)", "100") + n("validadeDias", "Validade da proposta (dias)", "1") +
      n("admObraPct", "Administração de obra (%)", "0.1") + n("briefingDias", "Cobrar briefing após (dias)", "1") + n("followupDias", "Follow-up da proposta após (dias)", "1") + n("propostaInicial", "Nº da próxima proposta (se não houver)", "1") +
      '<div class="field col-12"><label for="cc-link">Link do formulário de briefing (residência)</label><input id="cc-link" data-cct="linkBriefing" value="' + esc(c.linkBriefing || "") + '" placeholder="https://forms.gle/…"></div></div>' +
      '<div class="cfg-pesos-t">Fatores de ajuste das horas</div><div class="grid-form">' + fat("padrao", "Padrão", T.padroes().map(function (p) { return [p.id, T.padraoRotulo(p)]; })) + fat("dimensao", "Dimensão", DIM) + fat("terreno", "Terreno", DIF) + fat("cliente", "Perfil do cliente (interno)", PERFIS) + "</div>" +
      '<div class="cfg-pesos-t">Horas gerais do projeto</div><div class="com-hg">' + c.horasGerais.map(function (g, i) { return '<input class="ctl com-in-n" data-hg="' + i + '" data-k="n" value="' + esc(g.n) + '" aria-label="Item"><input class="ctl com-in-q" type="number" min="0" data-hg="' + i + '" data-k="h" value="' + g.h + '" aria-label="Horas de ' + esc(g.n) + '"><span class="hint">' + (g.legal ? "só com Legal" : "h") + "</span>"; }).join("") + "</div>" +
      '<div class="cfg-pesos-t">Horas de referência por ambiente</div><div class="com-ha">' + cat.map(function (t) { return '<label class="com-ha-i"><span>' + esc(t.n) + (t.id === "garagem" ? " (por vaga)" : "") + '</span><input class="ctl com-in-q" type="number" min="0" data-ha="' + t.id + '" value="' + (c.horasAmb[t.id] != null ? c.horasAmb[t.id] : "") + '"></label>'; }).join("") + "</div>" +
      '<div class="cfg-pesos-t">Mensagens de WhatsApp</div><p class="hint">Use {nome}, {link}, {data}, {hora}, {local} e {validade}.</p><div class="grid-form">' + [["briefing", "Enviar briefing"], ["cobrarBriefing", "Cobrar briefing"], ["proposta", "Enviar proposta"], ["followup", "Follow-up da proposta"], ["reuniao", "Confirmar reunião"]].map(function (m) { return '<div class="field col-6"><label for="cm-' + m[0] + '">' + m[1] + '</label><textarea rows="3" id="cm-' + m[0] + '" data-msg="' + m[0] + '">' + esc(c.msgs[m[0]] || "") + "</textarea></div>"; }).join("") + "</div>" +
      '<div class="grid-form"><div class="field col-6"><label for="cc-origens">Origens (uma por linha)</label><textarea rows="5" id="cc-origens">' + esc(c.origens.join("\n")) + '</textarea></div><div class="field col-6"><label for="cc-motivos">Motivos de perda (um por linha)</label><textarea rows="5" id="cc-motivos">' + esc(c.motivos.join("\n")) + "</textarea></div></div>" +
      '<div class="form-actions"><button class="btn btn-primary" id="cc-salvar" type="submit">Salvar configurações</button></div>' +
      '<p class="hint">Faixas de R$/m² dos padrões de obra: Configurações › Padrões de obra. Custo-hora da equipe: Configurações › Pessoas. Imposto: Financeiro.</p></form>';
    $("com-cfg").innerHTML = h;
  }
  async function salvarCfg() {
    var c = S.cfgEd, body = {};
    T.each("[data-cc]", function (i) { body[i.dataset.cc] = T.numOrNull(i.value); });
    body.linkBriefing = $("cc-link").value.trim();
    body.fatores = T.clone(c.fatores); T.each("[data-fat]", function (i) { var k = i.dataset.fat.split("|"); body.fatores[k[0]][k[1]] = T.numOrNull(i.value) || 1; });
    body.horasGerais = c.horasGerais.map(function (g, k) { var o = T.clone(g); T.each('[data-hg="' + k + '"]', function (i) { o[i.dataset.k] = i.dataset.k === "h" ? (T.numOrNull(i.value) || 0) : i.value.trim(); }); return o; });
    body.horasAmb = {}; T.each("[data-ha]", function (i) { var v = T.numOrNull(i.value); if (v != null) body.horasAmb[i.dataset.ha] = v; });
    body.msgs = {}; T.each("[data-msg]", function (i) { body.msgs[i.dataset.msg] = i.value; });
    body.origens = $("cc-origens").value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
    body.motivos = $("cc-motivos").value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
    body.provisorio = false;
    var ok = await T.saveWith($("cc-salvar"), function () { return salvarConfig(body); });
    if (ok) S.cfgEd = null;
  }

  // ---------- ações ----------
  async function passo() {
    var o = op(S.opId); if (!o) return;
    var mapa = { contato: "agendar", reuniao: "briefing", proposta_revisao: "apresentar", proposta_apresentada: null, contrato: "assinado", fechado: "virar" };
    if (o.etapa === "briefing_enviado") { S.tab = "briefing"; S.acao = null; render(); return; }
    if (o.etapa === "briefing_recebido") { try { await salvarOp(o.id, function (x) { mudarEtapa(x, "proposta_revisao", "Montagem da proposta iniciada"); }); } catch (err) { T.showError(err); return; } S.tab = (o.programa && o.programa.amb && o.programa.amb.length) ? "simulador" : "programa"; S.acao = null; S.ed = null; S.dirty = false; renderOp(); return; }
    if (o.etapa === "proposta_apresentada") { if (await T.confirmar({ titulo: "O cliente vai fechar?", texto: "A oportunidade passa para Contrato.", ok: "Seguir para o contrato" })) { try { await salvarOp(o.id, function (x) { mudarEtapa(x, "contrato", "Cliente aceitou a proposta"); }); } catch (err) { T.showError(err); } renderOp(); } return; }
    S.acao = mapa[o.etapa]; renderOp();
  }
  async function confirmarAcao(a) {
    var o = op(S.opId); if (!o) return; var c = C(), btn = document.querySelector('[data-act="' + a + '"]');
    if (a === "ok-agendar") {
      var dt = $("ca-data").value, hr = $("ca-hora").value, loc = $("ca-local").value.trim(); if (!dt) { T.toast("Escolha a data."); return; }
      var ok = await T.saveWith(btn, function () { return salvarOp(o.id, function (x) { x.reuniao = { data: dt, hora: hr, local: loc }; mudarEtapa(x, "reuniao", "Reunião agendada para " + T.fmtYmd(dt) + (hr ? " às " + hr : "") + (loc ? " · " + loc : "")); }); });
      if (ok && T.mcp) {
        var p = dt.split("-").map(Number), hh = (hr || "10:00").split(":").map(Number), ini = new Date(p[0], p[1] - 1, p[2], hh[0], hh[1]), fim = new Date(ini.getTime() + 3600000);
        var fmt = function (d) { return T.ymd(d) + "T" + T.hm(d) + ":00"; };
        T.mcp.callTool("Google Calendar", "create_event", { summary: "Reunião · " + nome0(o), startTime: fmt(ini), endTime: fmt(fim), timeZone: "America/Sao_Paulo", calendarId: "trilha@trilhaarq.com.br", description: (loc ? "Local: " + loc + "\n" : "") + "Gestor Comercial · " + tipoNome(o.tipo) }).then(function () { T.toast("Reunião na Agenda Google ✓"); }).catch(function () { T.toast("Não foi possível criar o evento na Agenda Google."); });
      }
      if (ok) S.acao = null; return;
    }
    if (a === "ok-briefing") {
      var imp = $("ca-imp").value.trim();
      if (await T.saveWith(btn, function () { return salvarOp(o.id, function (x) { x.impressoes = imp; x.briefing = Object.assign({}, x.briefing || {}, { enviadoEm: new Date().toISOString() }); mudarEtapa(x, "briefing_enviado", "Briefing enviado ao cliente"); }); })) S.acao = null;
      return;
    }
    if (a === "ok-cobrar" || a === "ok-followup") { if (await T.saveWith(btn, function () { return salvarOp(o.id, function (x) { hist(x, a === "ok-cobrar" ? "Cobrança do briefing enviada" : "Follow-up da proposta enviado"); x.etapaEm = new Date().toISOString(); }); })) S.acao = null; return; }
    if (a === "ok-apresentar") {
      var r = calc(o), num = +$("ca-num").value, dta = $("ca-dt").value || hoje(), val = $("ca-val").value;
      if (r.alertaExp && !(o.expectativa && o.expectativa.alinhada) && !(await T.confirmar({ titulo: "Expectativa ainda não alinhada", texto: "O cliente informou " + BRL(r.disp) + " e a obra está estimada em " + BRL(r.obra) + ". Apresentar mesmo assim?", ok: "Apresentar" }))) return;
      if (await T.saveWith(btn, function () { return salvarOp(o.id, function (x) { x.proposta = Object.assign({}, x.proposta || {}, { numero: num, enviadaEm: dta, validadeAte: val, valorTabela: r.tabela ? Math.round(r.tabela) : null, valorFinal: r.final ? Math.round(r.final) : null }); x.valor = r.final ? Math.round(r.final) : null; mudarEtapa(x, "proposta_apresentada", "Proposta nº " + num + " apresentada: " + BRL(r.final)); }); })) S.acao = null;
      return;
    }
    if (a === "ok-assinado") {
      var cn = $("ca-cnum").value.trim(), cd = $("ca-cdt").value || hoje(), cc = $("ca-ccid").value.trim(), cv = T.numOrNull($("ca-cval").value);
      if (await T.saveWith(btn, function () { return salvarOp(o.id, function (x) { x.contrato = { numero: cn, data: cd, cidade: cc }; if (cv) x.valor = cv; x.fechadoEm = new Date(cd + "T12:00:00").toISOString(); mudarEtapa(x, "fechado", "Contrato assinado" + (cn ? " nº " + cn : "") + (cv ? ": " + BRL(cv) : "")); }); })) S.acao = null;
      return;
    }
    if (a === "marc-feito") { if (await T.saveWith(btn, function () { return salvarOp(o.id, function (x) { x.projetoId = x.projetoId || "marcenaria"; hist(x, "Marcenaria ativada no projeto existente"); }); })) S.acao = null; return; }
    if (a === "ok-virar") { await virarProjeto(o, btn); return; }
  }
  async function virarProjeto(o, btn) {
    var nomeP = ($("cv-nome") || {}).value, pid = null;
    var ok = await T.saveWith(btn, async function () {
      if (o.tipo === "SERV") {
        var body = { nome: nome0(o) + " · serviço", tipo: "out", clienteIds: o.clienteId ? [o.clienteId] : [], cliente: nome0(o), status: "ativo", criadoEm: new Date().toISOString() };
        if (o.contrato) body.contrato = { numero: o.contrato.numero || "", data: o.contrato.data || null, cidade: o.contrato.cidade || "" };
        pid = (await T.db.collection("projetos").add(body)).id;
      } else {
        if (!T.gestor || !T.gestor.criar) throw new Error("Gestor de Projetos indisponível");
        nomeP = String(nomeP || "").trim(); if (!nomeP) throw new Error("Dê um nome ao projeto");
        var r = calc(o), dir = (o.briefing && o.briefing.dir) || {}, sig = o.tipo, pz = Object.assign({}, o.prazos || {});
        var pavs = ($("cv-pavs").value || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
        var amb = ((o.programa || {}).amb || []).map(function (a) { var t = T.byId(catalogoGestor(), a.tipo); return { tipo: t ? a.tipo : "outro", nome: a.nome, setor: a.setor, qtd: a.qtd, area: a.area, cfg: a.cfg }; });
        pid = await T.gestor.criar({ nome: nomeP, sigla: sig, clienteIds: o.clienteId ? [o.clienteId] : [], endereco: o.endereco, categorias: { padrao: (o.cat || {}).padrao || null, dimensao: (o.cat || {}).dimensao || null, dificuldade: (o.cat || {}).dificuldade || null },
          pavs: pavs, ambientes: amb, areaTotal: r.area, legal: legalDe(o), cond: !!(o.sim && o.sim.cond), prazos: pz, descricao: (o.demanda || o.impressoes || "").trim(), diretrizes: dir, origem: { comercial: o.id, proposta: o.proposta && o.proposta.numero || null } });
        if (o.contrato) await T.db.doc("projetos/" + pid).update({ contrato: { numero: o.contrato.numero || "", data: o.contrato.data || null, cidade: o.contrato.cidade || "" } });
      }
      await salvarOp(o.id, function (x) { x.projetoId = pid; hist(x, "Virou projeto: " + (nomeP || nome0(o))); });
    });
    if (ok) { S.acao = null; T.toast("Projeto criado ✓", T.gestor && T.gestor.gp(pid) ? { label: "Abrir no Gestor", fn: function () { T.gestor.abrir(pid); } } : null); }
  }

  // ---------- eventos ----------
  function campoProg(el) {
    var x = ed(), p = x.programa || (x.programa = { pavs: ["Térreo"], amb: [] });
    if (el.dataset.prog === "pavs") p.pavs = el.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    else if (el.dataset.amb != null) { var a = p.amb[+el.dataset.amb], k = el.dataset.k; if (!a) return; a[k] = k === "nome" ? el.value : T.numOrNull(el.value); if (k === "qtd" && !a[k]) a[k] = 1; }
    S.dirty = true; var t = $("cp-tot"); if (t) t.innerHTML = totaisProg(calc(x));
    var row = el.closest("tr"); if (row && el.dataset.amb != null) { var aa = p.amb[+el.dataset.amb], c = C(); row.querySelector('[data-l="Total"]').textContent = aa.area != null ? T.fmtNum((+aa.area || 0) * (+aa.qtd || 1), 1) : "x"; row.querySelector('[data-l="Horas"]').textContent = (+c.horasAmb[aa.tipo] || +c.horasAmb.outro || 0) * (+aa.qtd || 1) + " h"; }
  }
  function campoSim(el) {
    var x = ed(); x.sim = x.sim || {}; x.cat = x.cat || {}; x.prazos = x.prazos || {};
    if (el.dataset.sim) x.sim[el.dataset.sim] = T.numOrNull(el.value);
    if (el.dataset.cat) x.cat[el.dataset.cat] = el.value || null;
    if (el.dataset.simb) { x.sim[el.dataset.simb] = el.checked; if (el.dataset.simb === "legal") { var cb = document.querySelector('[data-simb="cond"]'); if (cb) { cb.disabled = !el.checked; if (!el.checked) { cb.checked = false; x.sim.cond = false; } } } }
    if (el.dataset.pz) x.prazos[el.dataset.pz] = T.numOrNull(el.value);
    if (el.id === "cs-exp") { x.expectativa = { alinhada: el.checked, em: new Date().toISOString() }; }
    S.dirty = true;
    if (el.dataset.cat === "padrao") { x.sim.custoM2 = null; x.sim.custoM2Alto = null; var r0 = calc(x); ["cs-m2", "cs-m2a"].forEach(function (id) { var i = $(id); if (i) { i.value = ""; i.placeholder = r0.pad ? Math.round(id === "cs-m2" ? r0.m2 : r0.m2a) : ""; } }); }
    var r = calc(x), out = $("cs-out"); if (out) out.innerHTML = saidaSim(x, r);
    var meu = $("cs-meu"); if (meu && r.tabela) meu.placeholder = Math.round(r.tabela);
  }
  async function importar() {
    var o = op(S.opId), t = S.imp.tab, resp = t ? respostas(t, S.imp.k) : [{ p: "Respostas (texto colado)", r: S.imp.txt }];
    var it = t ? interpretar(resp) : null;
    var ok = await T.saveWith($("cb-ok"), function () {
      return salvarOp(o.id, function (x) {
        x.briefing = Object.assign({}, x.briefing || {}, { resp: resp, recebidoEm: new Date().toISOString(), fonte: t ? "planilha" : "texto" });
        if (it) {
          x.briefing.dir = it.dir; x.dados = it.dados; x.cat = Object.assign({}, x.cat || {}, it.cat);
          if (!x.endereco && it.dados.endereco) x.endereco = it.dados.endereco;
          x.cliente = x.cliente || {}; if (!x.cliente.telefone && it.dados.telefone) x.cliente.telefone = it.dados.telefone; if (!x.cliente.email && it.dados.email) x.cliente.email = it.dados.email;
          if (it.amb.length && !((x.programa || {}).amb || []).length) x.programa = { pavs: (x.programa || {}).pavs || ["Térreo"], amb: it.amb };
        }
        if (IDX[x.etapa] < IDX.briefing_recebido) mudarEtapa(x, "briefing_recebido", "Respostas do briefing importadas (" + resp.length + ")");
        else hist(x, "Respostas do briefing importadas de novo (" + resp.length + ")");
      });
    });
    if (ok) { S.imp = null; S.dirty = false; S.ed = null; if (it && it.avisos.length) T.toast(it.avisos[0]); }
  }
  function lerImport(txt) {
    var tab = lerTabela(txt), o = op(S.opId), k = 0;
    if (tab) { var alvo = norm(o && o.cliente && o.cliente.nome).split(" ")[0]; k = tab.rows.length - 1; tab.rows.forEach(function (rw, i) { if (alvo && norm(rotuloLinha(tab, i)).indexOf(alvo) >= 0) k = i; }); }
    S.imp = { tab: tab, k: k, txt: txt }; renderOp();
  }

  function init() {
    var v = $("view-comercial");
    v.addEventListener("click", async function (e) {
      var t = e.target.closest("button, a"); if (!t) return;
      if (t.dataset.open) { abrir(t.dataset.open); return; }
      if (t.dataset.tab) { if (S.dirty && !(await T.confirmar({ titulo: "Sair sem salvar?", texto: "As alterações desta aba ainda não foram salvas.", ok: "Sair sem salvar", perigo: true }))) return; S.tab = t.dataset.tab; S.dirty = false; S.ed = null; renderOp(); return; }
      if (t.dataset.ano) { S.ano = +t.dataset.ano; renderLista(); return; }
      if (t.dataset.ntipo) { S.novo.tipo = t.dataset.ntipo; T.each("[data-ntipo]", function (b) { b.classList.toggle("is-selected", b === t); }); return; }
      if (t.dataset.copiar) { var ta = $(t.dataset.copiar); try { await navigator.clipboard.writeText(ta.value); T.toast("Mensagem copiada ✓"); } catch (x) { ta.select(); T.toast("Selecione e copie a mensagem."); } return; }
      if (t.dataset.wa) { var ta2 = $(t.dataset.wa), o0 = op(S.opId); t.href = waLink(o0 && o0.cliente && o0.cliente.telefone, ta2.value); return; }
      if (t.dataset.motivo) {
        var o1 = op(S.opId), mot = t.dataset.motivo, nota = ($("ca-pnota") || {}).value || "";
        if (await T.confirmar({ titulo: "Marcar como perdida?", texto: "Motivo: " + esc(mot) + ". A oportunidade sai do funil (dá para reabrir).", ok: "Marcar como perdida", perigo: true })) {
          try { await salvarOp(o1.id, function (x) { x.perda = { motivo: mot, nota: nota.trim(), em: new Date().toISOString(), etapa: x.etapa }; mudarEtapa(x, "perdido", "Perdida: " + mot + (nota.trim() ? " — " + nota.trim() : "")); }); S.acao = null; renderOp(); } catch (err) { T.showError(err); }
        }
        return;
      }
      if (t.dataset.rmamb != null) { var x = ed(); x.programa.amb.splice(+t.dataset.rmamb, 1); S.dirty = true; renderOp(); return; }
      var a = t.dataset.act; if (!a) return;
      if (a === "novo") { S.novo = { tipo: "RES" }; renderLista(); var nn = $("cn-nome"); if (nn) nn.focus(); return; }
      if (a === "novo-x") { S.novo = null; renderLista(); return; }
      if (a === "cfg") { S.view = "cfg"; S.cfgEd = null; render(); window.scrollTo(0, 0); return; }
      if (a === "voltar") { if (S.dirty && !(await T.confirmar({ titulo: "Sair sem salvar?", texto: "As alterações ainda não foram salvas.", ok: "Sair sem salvar", perigo: true }))) return; S.view = "lista"; S.opId = null; S.dirty = false; S.ed = null; S.acao = null; S.imp = null; render(); window.scrollTo(0, 0); return; }
      if (a === "verfim") { S.verFim = !S.verFim; renderLista(); return; }
      if (a === "passo") { await passo(); return; }
      if (a === "perder") { S.acao = "perder"; renderOp(); return; }
      if (a === "cancelar") { S.acao = null; renderOp(); return; }
      if (a === "reabrir") { var o2 = op(S.opId); if (await T.confirmar({ titulo: "Reabrir a oportunidade?", texto: "Volta para " + etapaNome((o2.perda && o2.perda.etapa) || "contato") + ".", ok: "Reabrir" })) { try { await salvarOp(o2.id, function (x) { mudarEtapa(x, (x.perda && x.perda.etapa) || "contato", "Oportunidade reaberta"); delete x.perda; }); } catch (err) { T.showError(err); } renderOp(); } return; }
      if (a === "ir-gestor") { var o3 = op(S.opId); T.gestor.abrir(o3.projetoId); return; }
      if (a.indexOf("ok-") === 0 || a === "marc-feito") { await confirmarAcao(a); if (!S.acao) renderOp(); return; }
      if (a === "imp-ler") { var txt = $("cb-txt").value; if (!txt.trim()) { T.toast("Cole as respostas primeiro."); return; } lerImport(txt); return; }
      if (a === "imp-x") { S.imp = null; renderOp(); return; }
      if (a === "imp-ok") { await importar(); if (!S.imp) renderOp(); return; }
      if (a === "prog-add") { var x2 = ed(); x2.programa = x2.programa || { pavs: ["Térreo"], amb: [] }; x2.programa.amb.push(novoAmb($("cp-add").value)); S.dirty = true; renderOp(); return; }
      if (a === "prog-padrao" || a === "prog-brief") {
        var x3 = ed(), tem = ((x3.programa || {}).amb || []).length;
        if (tem && !(await T.confirmar({ titulo: "Substituir o programa?", texto: "Os " + tem + " ambientes atuais serão trocados.", ok: "Substituir", perigo: true }))) return;
        var amb = [];
        if (a === "prog-padrao") { var pr = (T.gestor && T.gestor.padraoRes) || {}; Object.keys(pr).forEach(function (k) { if (k === "garagem") amb.push(novoAmb(k, { nome: "Garagem", qtd: pr[k] })); else for (var i = 0; i < pr[k]; i++) amb.push(novoAmb(k, pr[k] > 1 ? { nome: tipoAmb(k).n + " " + (i + 1) } : {})); }); }
        else amb = interpretar(x3.briefing.resp).amb;
        x3.programa = { pavs: (x3.programa || {}).pavs || ["Térreo"], amb: amb }; S.dirty = true; renderOp(); return;
      }
      if (a === "prog-salvar" || a === "sim-salvar") {
        var x4 = ed(), o4 = op(S.opId), ok = await T.saveWith(t, function () { return salvarOp(o4.id, function (y) { if (a === "prog-salvar") y.programa = x4.programa; else { y.sim = x4.sim; y.cat = x4.cat; y.prazos = x4.prazos; y.expectativa = x4.expectativa; } }); });
        if (ok) { S.dirty = false; S.ed = null; }
        return;
      }
    });
    v.addEventListener("input", function (e) {
      var el = e.target;
      if (el.dataset.prog || el.dataset.amb != null) { campoProg(el); return; }
      if (el.closest("#cs-in") || el.id === "cs-exp") { campoSim(el); return; }
    });
    v.addEventListener("change", function (e) {
      var el = e.target;
      if (el.id === "cs-exp" || el.dataset.simb || (el.tagName === "SELECT" && el.closest("#cs-in"))) { campoSim(el); return; }
      if (el.id === "cb-linha") { S.imp.k = +el.value; renderOp(); return; }
      if (el.id === "cb-csv" && el.files && el.files[0]) { var fr = new FileReader(); fr.onload = function () { lerImport(String(fr.result || "")); }; fr.readAsText(el.files[0]); return; }
      if (el.id === "cn-cli") { var cl = T.cadastros && T.cadastros.contato(el.value); if (cl) { $("cn-nome").value = cl.nome || ""; $("cn-tel").value = cl.contato || ""; $("cn-email").value = cl.email || ""; } S.novo.clienteId = el.value; }
    });
    v.addEventListener("submit", async function (e) {
      e.preventDefault(); var f = e.target, o = op(S.opId);
      if (f.id === "com-novo-f") { await criarOp(); return; }
      if (f.id === "cc-form") { await salvarCfg(); return; }
      if (f.id === "cr-form") {
        await T.saveWith($("cr-salvar"), function () { return salvarOp(o.id, function (x) { x.cliente = Object.assign({}, x.cliente || {}, { nome: $("cr-nome").value.trim(), telefone: $("cr-tel").value.trim(), email: $("cr-email").value.trim() }); x.tipo = $("cr-tipo").value; x.endereco = $("cr-end").value.trim(); x.origem = $("cr-origem").value; x.indicadoPor = $("cr-ind").value.trim(); x.responsavel = $("cr-resp").value || null; x.impressoes = $("cr-imp").value.trim(); x.notas = $("cr-notas").value.trim(); }); });
        return;
      }
      if (f.id === "cpp-form") { await T.saveWith($("cpp-salvar"), function () { return salvarOp(o.id, function (x) { x.demanda = $("cpp-dem").value.trim(); }); }); return; }
      if (f.id === "ch-form") { var tx = $("ch-txt").value.trim(); if (!tx) return; if (await T.saveWith($("ch-salvar"), function () { return salvarOp(o.id, function (x) { hist(x, tx); }); })) $("ch-txt").value = ""; return; }
    });
    v.addEventListener("mousemove", function (e) {
      var b = e.target.closest && e.target.closest("#com-chart .band"), tip = $("com-tip");
      if (b) mostrarTip(+b.dataset.i, b); else if (tip && !tip.hidden) { tip.hidden = true; T.each("#com-chart .band.on", function (x) { x.classList.remove("on"); }); }
    });
    window.addEventListener("resize", function () { if (T.state.sub === "comercial" && S.view === "lista") T.scheduleRender(); });
  }

  // ---------- render ----------
  function render() {
    var lista = S.view === "lista", isOp = S.view === "op", cfg = S.view === "cfg";
    $("com-lista").hidden = !lista; $("com-op").hidden = !isOp; $("com-cfg").hidden = !cfg;
    // não redesenhar enquanto alguém digita num formulário desta tela
    var foco = document.activeElement, dentro = foco && foco !== document.body && $("view-comercial").contains(foco) && /INPUT|TEXTAREA|SELECT/.test(foco.tagName);
    if (lista) { if (!(dentro && S.novo)) renderLista(); }
    else if (isOp) { if (!dentro) renderOp(); }
    else if (cfg) { if (!dentro) renderCfg(); }
  }

  T.comercial = { oportunidades: function () { return S.ops; }, calc: calc, interpretar: interpretar, lerTabela: lerTabela, respostas: respostas, parseValor: parseValor, abrir: function (id) { T.go("admin", "comercial"); abrir(id); } };
  T.register({
    id: "comercial", label: "Gestor Comercial", area: "admin", html: html, init: init, render: render,
    icon: '<path d="M4 7h16v12H4z"/><path d="M9 7V5h6v2"/><path d="M4 12h16"/><path d="M11 12v2h2v-2"/>',
    desc: function () { var n = abertas().length; return n ? n + (n === 1 ? " oportunidade aberta" : " oportunidades abertas") : "Oportunidades, briefing e propostas"; },
    connect: function (db) {
      db.collection("com_oport").onSnapshot(function (s) { S.ops = T.snapList(s); if (!s.metadata || !s.metadata.fromCache) S.loaded = true; T.loaded("com_oport", s); T.scheduleRender(); }, T.onErr);
      db.doc("com_config/geral").onSnapshot(function (d) { S.cfg = d.exists ? T.clone(d.data()) : null; T.scheduleRender(); }, T.onErr);
      db.doc("fin_config/geral").onSnapshot(function (d) { S.fin = d.exists ? d.data() : null; }, function () {});
    }
  });
})();
