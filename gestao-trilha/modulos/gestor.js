/* Módulo Gestor de Projetos — processo de projeto: etapas e portões, Plano de Projeto (itens com desenhos,
 * checklists, prazo, prioridade e situação), marcenaria como segunda trilha do mesmo projeto, reuniões (lançadas no
 * Tempo), histórico fiel, termos em PDF, notificações, suspensão e arquivamento automáticos.
 * Dados: gp/<projetoId> (um documento por projeto) e gp_config/geral (modelo de móvel). Dados básicos em
 * projetos/<id> (núcleo). Regras: manual-trilha/MAPEAMENTO.md, processo-trilha.json, AJUSTES-TESTE.md, TERMOS.md.
 * Expõe Trilha.gestor. */
(function () {
  "use strict";
  var T = window.Trilha, $ = T.$, esc = T.esc;

  // ---------- processo ----------
  var SIGLAS = [["RES", "Residencial"], ["COM", "Comercial"], ["HOT", "Hotelaria"], ["REF", "Reforma"], ["INT", "Interiores"]];
  var TIPO_ANTIGO = { RES: "res", COM: "comr", HOT: "hot", REF: "ref", INT: "int" };
  // tempo: etapa da aba Tempo em que as horas são lançadas; prazo: dias úteis padrão (editável por projeto na Ficha)
  var ETAPAS = {
    abertura: { nome: "Abertura", curto: "Abertura", tempo: ["ab"] },
    ep: { nome: "Estudo Preliminar", curto: "Estudo Preliminar", prazo: 40, tempo: ["ep"], termo: "etapa", clausula: "2.1.7" },
    ap: { nome: "Anteprojeto", curto: "Anteprojeto", prazo: 70, tempo: ["ap", "comp"], termo: "etapa", clausula: "2.2.9", fases: ["Revisão e lançamentos", "Compatibilização", "Definições"] },
    pl: { nome: "Projeto Legal", curto: "Projeto Legal", tempo: ["pl"] },
    pe: { nome: "Projeto Executivo", curto: "Executivo", prazo: 60, tempo: ["ex"], termo: "projeto", clausula: "2.4.8", fases: ["Desenhos base", "Mapeamentos e detalhamento"] },
    mep: { nome: "Estudo Preliminar da marcenaria", curto: "EP Marcenaria", prazo: 30, tempo: ["mc-ep"], termo: "etapa", marc: true },
    mex: { nome: "Executivo da marcenaria", curto: "Executivo Marcenaria", prazo: 40, tempo: ["mc-ex"], termo: "projeto", marc: true },
    encerrado: { nome: "Encerrado", curto: "Encerrado" }
  };
  function doZero(sigla) { return !(sigla === "REF" || sigla === "INT"); }
  function fluxo(sigla) { return doZero(sigla) ? ["abertura", "ep", "ap", "pe", "encerrado"] : ["abertura", "ep", "pe", "encerrado"]; }
  function temLegal(g) { return g.legal && g.legal !== "nao_se_aplica"; }
  function marcAtiva(g) { return !!(g.marc && g.marc.ativo); }
  function marcAberta(g) { return marcAtiva(g) && g.marc.etapa !== "fim"; }
  function etapasPlano(g) { var e = ["abertura", "ep"]; if (doZero(g.sigla)) e.push("ap"); if (temLegal(g)) e.push("pl"); e.push("pe"); if (marcAtiva(g)) e.push("mep", "mex"); return e; }
  var LEGAL = [["nao_iniciado", "Não iniciado"], ["em_preparo", "Em preparo"], ["protocolado", "Protocolado"], ["aprovado", "Aprovado"], ["nao_se_aplica", "Não se aplica"]];
  var SIT = [["a_fazer", "A fazer"], ["andamento", "Em andamento"], ["revisao", "Revisão interna"], ["rev_cliente", "Revisão Cliente"], ["pronto", "Pronto"], ["entregue", "Entregue"]];
  // Espera/pausa por trilha (arquitetura ou marcenaria). Condomínio e prefeitura ficam no quadro do Projeto Legal.
  var QUEM = [["cliente", "cliente"], ["engenheiro", "engenheiro / complementar"], ["interna", "pausa interna"], ["condominio", "condomínio"], ["prefeitura", "prefeitura"]];
  var QUEM_OPC = [["cliente", "Aguardando cliente"], ["engenheiro", "Aguardando engenheiro / complementar"], ["interna", "Pausa interna (decisão da Trilha)"]];
  // Projeto Legal: condomínio (opcional) e prefeitura (padrão), cada um com o mesmo trâmite.
  var ORGAOS = { cond: { nome: "Projeto de condomínio", curto: "Condomínio", orgao: "condomínio", cod: "PC" }, pref: { nome: "Projeto de prefeitura", curto: "Prefeitura", orgao: "prefeitura", cod: "PL" } };
  var LEG_SIT = [["nao_iniciado", "Não iniciado"], ["preparo", "Em preparo"], ["protocolado", "Protocolado · em análise"], ["exigencia", "Em exigência"], ["aprovado", "Aprovado"]];
  var LEGAL_AVISO = 5;
  var TIPOS_TAREFA = [["tarefa", "Tarefa"], ["demanda", "Demanda"], ["prioridade", "Prioridade"], ["compromisso", "Compromisso"]];
  var TIPOS_REUNIAO = ["Apresentação ao cliente", "Ajustes com o cliente", "Complementares / engenheiros", "Reunião interna", "Entrega", "Outra"];
  var PADRAO = [["medio", "Médio (R$ 3.000–3.500/m²)"], ["medio_alto", "Médio Alto (R$ 3.500–4.500/m²)"], ["alto_1", "Alto (R$ 4.500–5.500/m²)"], ["alto_2", "Alto (R$ 5.500–7.000/m²)"], ["luxo", "Luxo (acima de R$ 7.000/m²)"]];
  var DIMENSAO = [["compacta", "Compacta"], ["confortavel", "Confortável"], ["espacosa", "Espaçosa"]];
  var DIFICULDADE = [["baixa", "Baixa"], ["normal", "Normal"], ["dificil", "Difícil"], ["muito_dificil", "Muito difícil"]];
  var MARCO = [["contrato", "Contrato assinado"], ["parcela", "1ª parcela paga"], ["topografico", "Topográfico entregue"], ["documentos", "Documentos do cliente"]];
  var ESPERA_AVISO = 15, ESPERA_SUSPENDE = 20, SUSPENSO_ARQUIVA = 60, PRAZO_AVISO = 10;

  // Grupos do Plano de Projeto por etapa. cod: "serie" (série + posição), sigla + posição, ou nenhum.
  var SERIES = { 100: "Implantação, plantas e cobertura", 200: "Cortes", 300: "Elevações", 400: "Mapeamentos", 500: "Ampliações", 600: "Esquadrias", 700: "Marmoraria", 800: "Detalhamentos construtivos", 900: "Marcenaria", 1000: "Documentos" };
  function grupos(etapa, g) {
    function serie(n) { return { k: "s" + n, n: n + " · " + SERIES[n], cod: "serie", serie: n }; }
    if (etapa === "abertura") return [{ k: "abertura", n: "Abertura do projeto" }];
    if (etapa === "ep") return [{ k: "ep-estudos", n: "Estudos e concepção" }, { k: "ep-apres", n: "Material da apresentação", cod: "AP" }, { k: "ep-entrega", n: "Apresentação e aprovação" }];
    if (etapa === "ap") return [100, 200, 300, 400].map(serie).concat([{ k: "ap-comp", n: "Complementares" }, { k: "ap-def", n: "Definições com o cliente" }, { k: "ap-fecha", n: "Encerramento do Anteprojeto" }]);
    if (etapa === "pl") return (g && g.leg && g.leg.cond ? [{ k: "pl-cond", n: ORGAOS.cond.nome, cod: "PC" }] : []).concat([{ k: "pl-pref", n: ORGAOS.pref.nome, cod: "PL" }]);
    if (etapa === "pe") return [100, 200, 300, 400, 500, 600, 700, 800, 1000].map(serie).concat([{ k: "pe-fecha", n: "Fechamento e entrega" }]);
    if (etapa === "mep") return [{ k: "mep", n: "Estudo Preliminar da marcenaria", cod: "EM" }];
    if (etapa === "mex") return [serie(900)];
    return [];
  }

  // ---------- programa de necessidades (nomes do briefing) ----------
  var TV = ["Sem TV", "40\"", "43\"", "50\"", "55\"", "65\"", "75\"", "85\""], LUG = ["4", "6", "8", "10", "12"];
  var CAMPOS = {
    ilha: { l: "Ilha", t: "bool" }, agua_quente: { l: "Água quente", t: "bool" },
    exaustao: { l: "Exaustão", t: "sel", o: ["Coifa", "Depurador de teto", "Depurador de bancada", "Não precisa"] },
    equipamentos: { l: "Equipamentos", t: "multi", o: ["Geladeira comum", "Geladeira side by side", "Geladeira embutida", "Freezer", "Freezer embutido", "Fogão 4 bocas", "Fogão 6 bocas", "Cooktop 4 bocas", "Cooktop 5 bocas", "Cooktop 6 bocas", "Forno comum", "Forno de embutir", "Micro-ondas comum", "Micro-ondas de embutir", "Filtro soft", "Filtro de bancada", "Lava-louças", "Adega climatizada"] },
    itens_bancada: { l: "Na bancada", t: "multi", o: ["Cuba inox simples", "Cuba inox grande", "Cuba inox dupla", "Calha úmida", "Lixeira embutida", "Triturador de alimentos"] },
    integracao: { l: "Integração", t: "sel", o: ["Estar, jantar e cozinha integrados", "Jantar e cozinha integrados", "Estar e jantar integrados", "Nenhum ambiente integrado"] },
    lugares: { l: "Mesa (lugares)", t: "sel", o: LUG }, aparador: { l: "Aparador", t: "bool" }, cristaleira: { l: "Cristaleira", t: "bool" },
    assentos: { l: "Assentos", t: "sel", o: LUG }, tv: { l: "TV", t: "sel", o: TV }, tv_ou_projetor: { l: "Tela", t: "sel", o: ["TV", "Projetor"] },
    cama: { l: "Cama", t: "sel", o: ["Solteiro", "Casal comum (1,38×1,88)", "Queen size (1,58×1,98)", "King size (1,93×2,03)"] }, closet: { l: "Closet", t: "bool" },
    bancada_tipo: { l: "Bancada", t: "sel", o: ["Cuba de louça", "Cuba esculpida"] }, cubas: { l: "Cubas", t: "sel", o: ["1", "2"] },
    sanitario: { l: "Sanitário", t: "sel", o: ["Caixa acoplada", "Válvula"] }, ducha_higienica: { l: "Ducha higiênica", t: "bool" },
    bide: { l: "Bidê", t: "bool" }, toalheiro: { l: "Toalheiro aquecido", t: "bool" },
    chuveiros: { l: "Chuveiros", t: "sel", o: ["1", "2"] }, tipo_chuveiro: { l: "Chuveiro", t: "sel", o: ["Elétrico", "Pré-aquecido (gás, boiler…)"] },
    banheira: { l: "Banheira", t: "sel", o: ["Não", "Hidromassagem", "Imersão", "Em anexo (SPA)"] },
    carros_medios: { l: "Carros médios", t: "num" }, carros_grandes: { l: "Carros grandes", t: "num" }, motos: { l: "Motos", t: "num" }, bicicletas: { l: "Bicicletas", t: "num" },
    cobertura_garagem: { l: "Garagem", t: "sel", o: ["Coberta", "Descoberta", "Mista"] }, tomada_eletrico: { l: "Tomada carro elétrico", t: "bool" }, armario: { l: "Armário/depósito", t: "bool" },
    tanque: { l: "Tanque", t: "sel", o: ["Louça", "Inox", "Inox grande"] }, maquina: { l: "Máquina", t: "sel", o: ["Abertura superior", "Abertura frontal", "Lava e seca"] }, passar: { l: "Passar roupa na lavanderia", t: "bool" },
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
  // Ambientes padrão da Trilha: guardados em gp_config/geral.ambientes (editáveis; nascem deste catálogo do briefing).
  // Cada ambiente tem as suas perguntas (campos) com as próprias opções.
  function catalogoPadrao() { return CATALOGO.map(function (t) { return { id: t.id, n: t.n, s: t.s, a: t.a, amp: t.amp || 0, banc: t.banc || 0, campos: (t.c || []).map(function (k) { var d = CAMPOS[k]; return { k: k, l: d.l, t: d.t, o: d.o ? d.o.slice() : null }; }) }; }); }
  function catalogo() { var c = S.cfg && S.cfg.ambientes; return c && c.length ? c : catalogoPadrao(); }
  function tipoAmb(id) { var c = catalogo(); return T.byId(c, id) || T.byId(c, "outro") || { id: "outro", n: "Outro ambiente", s: "social", a: null, campos: [] }; }
  function camposDe(a) { return a.campos || tipoAmb(a.tipo).campos || []; }
  function campoDef(a, k) { return camposDe(a).filter(function (d) { return d.k === k; })[0] || CAMPOS[k] || { l: k, t: "txt" }; }

  // Modelo de móvel (marcenaria): editável em Plano › Marcenaria › "Modelo de móvel". Fica em gp_config/geral.
  var MODELO_MOVEL = {
    guia: "",
    desenhos: [
      { nome: "Planta (vista superior)", checklist: [] },
      { nome: "Vistas frontais", checklist: [] },
      { nome: "Cortes", checklist: [] },
      { nome: "Detalhes (ferragens, puxadores, encaixes)", checklist: [] },
      { nome: "Tabela de materiais e acabamentos", checklist: [] }
    ],
    checklist: ["Medidas conferidas com o projeto / a obra", "Cotas totais e parciais", "Materiais, cores e fitas indicados", "Ferragens e puxadores especificados", "Eletros e equipamentos com medidas do fabricante", "Pontos elétricos e hidráulicos compatibilizados", "Folgas, rodapés e tamponamentos", "Revisão interna"]
  };

  // ---------- estado ----------
  var S = { gp: {}, cfg: null, fin: null, loaded: false, view: "lista", projId: null, tab: "geral", filtro: "ativos", foco: null, busca: "", planoEtapa: null, pendentes: false,
    open: {}, openDes: {}, addGrupo: null, openAmb: null, wiz: null, auto: {}, modal: null, editModelo: false };

  // ---------- datas: dias úteis ----------
  function dia(d) { d = new Date(d); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function du(a, b) { var x = dia(a), y = dia(b), n = 0; while (x < y) { x.setDate(x.getDate() + 1); var w = x.getDay(); if (w && w < 6) n++; } return n; }
  function somaDu(n, base) { var x = dia(base || new Date()), passo = n < 0 ? -1 : 1; n = Math.abs(n); while (n > 0) { x.setDate(x.getDate() + passo); var w = x.getDay(); if (w && w < 6) n--; } return x; }
  function hojeIso() { return T.ymd(new Date()); }
  function amanhaIso() { return T.ymd(T.addDays(new Date(), 1)); }
  function isoDeData(ymd) { return new Date(ymd + "T12:00:00").toISOString(); }
  function dataExtenso(s) { var d = T.parseYmd(s); return d.getDate() + " de " + T.MESES[d.getMonth()] + " de " + d.getFullYear(); }

  // ---------- leitura ----------
  function G(pid) { return S.gp[pid] || null; }
  // Os documentos chegam do banco somente-leitura: copiar antes de ajustar formatos antigos.
  function normalizar(g) {
    if (g.etapa === "briefing") g.etapa = "abertura";
    (g.itens || []).forEach(function (x) { if (x.etapa === "pl" && (x.grupo === "pl-pranchas" || x.grupo === "pl-tramite")) { if (x.grupo === "pl-tramite") x.ord = (x.ord || 0) + 50; x.grupo = "pl-pref"; } });
    return g;
  }
  function proj(pid) { return T.projeto(pid) || { id: pid, nome: "Projeto removido" }; }
  function projetosGestor() { return T.state.projetos.filter(function (p) { return !!S.gp[p.id]; }); }
  function clientes(p) { return (p.clienteIds || []).map(function (id) { return T.cadastros && T.cadastros.contato(id); }).filter(Boolean); }
  function clientesNomes(p) { var c = clientes(p).map(function (x) { return x.nome; }); return c.length ? c.join(" e ") : (p.cliente || ""); }
  function esperaAberta(g, tr) { var e = (g.esperas || []).filter(function (x) { return !x.fim && (x.trilha || "arq") === (tr || "arq"); }); return e[e.length - 1] || null; }
  function esperaAlguma(g) { return esperaAberta(g, "arq") || (marcAberta(g) ? esperaAberta(g, "marc") : null); }
  function ativo(g) { return !g.suspenso && !g.arquivado; }
  function etapaLista(g) { return g.etapa === "encerrado" && marcAberta(g) ? "marc" : g.etapa; }
  function prazoPadrao(k) { var c = T.cfg().prazosPadrao || {}, d = T.DEFAULT_CONFIG.prazosPadrao || {}; return c[k] != null ? c[k] : d[k] != null ? d[k] : (ETAPAS[k] || {}).prazo || null; }
  // Prazo da etapa no projeto: o da Configurações do projeto; senão o da ativação da marcenaria (antigo); senão o padrão.
  function prazoEtapa(g, e) { var info = (g.etapas || {})[e] || {}; if (info.prazo) return info.prazo; if (ETAPAS[e].marc && ((g.marc || {}).prazos || {})[e]) return g.marc.prazos[e]; return prazoPadrao(e); }
  function trilhaDe(e) { return ETAPAS[e] && ETAPAS[e].marc ? "marc" : "arq"; }
  function calcPrazo(g, e) {
    var info = (g.etapas || {})[e], prazo = prazoEtapa(g, e);
    if (!prazo || !info || !info.inicio || info.fim) return null;
    var ini = new Date(info.inicio), agora = new Date(), pausa = 0, tr = trilhaDe(e);
    // só as esperas desta trilha pausam o prazo (a suspensão do projeto pausa as duas)
    (g.esperas || []).forEach(function (x) { if ((x.trilha || "arq") !== tr && !x.suspenso) return; var s = new Date(Math.max(ini, new Date(x.inicio))), f = x.fim ? new Date(x.fim) : agora; if (f > s) pausa += du(s, f); });
    var usados = Math.max(0, du(ini, agora) - pausa), resta = prazo - usados;
    return { etapa: e, usados: usados, prazo: prazo, resta: resta, pausado: !!esperaAberta(g, tr) || !!g.suspenso, fim: somaDu(resta), pct: Math.min(100, Math.round(usados / prazo * 100)) };
  }
  // Prazo mostrado no cartão: o da arquitetura; depois do Executivo, o da marcenaria.
  function prazoInfo(g) { var a = ETAPAS[g.etapa] && ETAPAS[g.etapa].prazo ? calcPrazo(g, g.etapa) : null; if (a) return a; if (marcAberta(g) && (g.marc.etapa === "mep" || g.marc.etapa === "mex")) return calcPrazo(g, g.marc.etapa); return null; }
  function prazosAbertos(g) { var out = []; if (ETAPAS[g.etapa] && ETAPAS[g.etapa].prazo) { var a = calcPrazo(g, g.etapa); if (a) out.push(a); } if (marcAberta(g) && (g.marc.etapa === "mep" || g.marc.etapa === "mex")) { var m = calcPrazo(g, g.marc.etapa); if (m) out.push(m); } orgaosLegal(g).forEach(function (o) { var l = prazoLegal(g, o); if (l) out.push(l); }); return out; }
  // ---------- Projeto Legal (condomínio e prefeitura) ----------
  function orgaosLegal(g) { if (!temLegal(g) || !doZero(g.sigla)) return []; return g.leg && g.leg.cond ? ["cond", "pref"] : ["pref"]; }
  function legalDe(g, o) {
    var l = (g.leg || {})[o]; if (l) return l;
    if (o !== "pref") return { sit: "nao_iniciado", hist: [] };
    var mapa = { nao_iniciado: "nao_iniciado", em_preparo: "preparo", protocolado: "protocolado", aprovado: "aprovado" };
    return { sit: mapa[g.legal] || "nao_iniciado", hist: [] };
  }
  function legSitNome(k) { var x = LEG_SIT.filter(function (o) { return o[0] === k; })[0]; return x ? x[1] : k; }
  function legalAprovado(g) { var os = orgaosLegal(g); return !os.length || os.every(function (o) { return legalDe(g, o).sit === "aprovado"; }); }
  // Desenvolvimento: de "Em preparo" até o 1º protocolo. Protocolado: tempo do órgão (não conta). Em exigência: prazo da Trilha.
  function prazoLegal(g, o) {
    var l = legalDe(g, o), h = l.hist || [], ini = null, prazo = null;
    if (l.sit === "preparo" && !h.some(function (x) { return x.sit === "protocolado"; })) { var p0 = h.filter(function (x) { return x.sit === "preparo"; })[0]; ini = p0 && p0.em; prazo = l.prazoDev || prazoPadrao("plDev"); }
    else if (l.sit === "exigencia") { var ex = h.filter(function (x) { return x.sit === "exigencia"; }); ini = ex.length && ex[ex.length - 1].em; prazo = l.prazoExig || prazoPadrao("plExig"); }
    if (!ini || !prazo) return null;
    var usados = du(ini, new Date()), resta = prazo - usados;
    return { etapa: "pl", orgao: o, nome: ORGAOS[o].curto + (l.sit === "exigencia" ? " · exigência" : " · desenvolvimento"), usados: usados, prazo: prazo, resta: resta, pausado: false, fim: somaDu(resta), pct: Math.min(100, Math.round(usados / prazo * 100)), aviso: LEGAL_AVISO };
  }
  function resumoLegal(g) {
    var os = orgaosLegal(g); if (!os.length) return g.legal === "nao_se_aplica" ? "nao_se_aplica" : g.legal;
    var ss = os.map(function (o) { return legalDe(g, o).sit; });
    if (ss.every(function (x) { return x === "aprovado"; })) return "aprovado";
    if (ss.some(function (x) { return x === "protocolado" || x === "exigencia" || x === "aprovado"; })) return "protocolado";
    if (ss.some(function (x) { return x === "preparo"; })) return "em_preparo";
    return "nao_iniciado";
  }
  function corPrazo(pct) { return pct < 30 ? "ok" : pct < 60 ? "mid" : "late"; }
  function nomeQuem(q) { var x = QUEM.filter(function (o) { return o[0] === q; })[0]; return x ? x[1] : q; }
  function situacao(g) {
    if (g.arquivado) return { k: "fim", txt: "Arquivado desde " + T.fmtYmd(g.arquivado.desde) };
    if (g.suspenso) return { k: "bad", txt: "Suspenso desde " + T.fmtYmd(g.suspenso.desde) };
    if (g.etapa === "encerrado" && !marcAberta(g)) return { k: "fim", txt: "Encerrado" };
    var e = g.etapa !== "encerrado" ? esperaAberta(g, "arq") : esperaAberta(g, "marc");
    if (e) { var d = du(e.inicio, new Date()); return { k: e.quem === "cliente" && d >= ESPERA_AVISO ? "bad" : "wait", txt: (e.quem === "interna" ? "Pausa interna" : "Aguardando " + nomeQuem(e.quem)) + " · " + d + " d.u.", dias: d, quem: e.quem }; }
    var pz = g.etapa !== "encerrado" ? prazoArq(g) : prazoMarc(g);
    if (pz && pz.resta < 0 && !pz.pausado) return { k: "bad", txt: "Prazo vencido há " + (-pz.resta) + " d.u." };
    if (g.etapa === "encerrado") return { k: "ok", txt: "Arquitetura entregue · marcenaria em andamento" };
    return { k: "ok", txt: "Em dia" };
  }
  function itensDe(g, etapa) { return (g.itens || []).filter(function (x) { return !etapa || x.etapa === etapa; }); }
  function feito(x) { return x.sit === "pronto" || x.sit === "entregue"; }
  function prontos(list) { return list.filter(feito).length; }
  // % concluído com peso por etapa (Configurações › Peso das etapas). Abertura não conta. Etapa já encerrada = 100%;
  // etapa em curso ou futura = itens prontos ÷ itens da etapa. Etapas que o projeto não tem (REF/INT sem Anteprojeto e
  // Legal; Legal "não se aplica") saem da conta e os pesos restantes são redistribuídos na mesma proporção.
  function pesos() { return Object.assign({}, T.DEFAULT_CONFIG.pesosEtapas, T.cfg().pesosEtapas || {}); }
  function progEtapa(g, e) {
    if (ETAPAS[e] && ETAPAS[e].marc) {
      var mi = ["aguardando", "mep", "espera", "mex", "fim"].indexOf((g.marc || {}).etapa);
      if (e === "mep" ? mi >= 2 : mi >= 4) return 1;
    } else {
      if (g.etapa === "encerrado") return 1;
      if (e === "pl-cond" || e === "pl-pref") { var o = e.slice(3); if (legalDe(g, o).sit === "aprovado") return 1; var li = itensDe(g, "pl").filter(function (x) { return x.grupo === e; }); return li.length ? prontos(li) / li.length : 0; }
      if (e === "pl") { if (legalAprovado(g)) return 1; }
      else { var f = fluxo(g.sigla); if (f.indexOf(e) < f.indexOf(g.etapa)) return 1; }
    }
    var it = itensDe(g, e); return it.length ? prontos(it) / it.length : 0;
  }
  function pctPonderado(g, ets) {
    var w = pesos(), tot = 0, soma = 0;
    ets.forEach(function (e) { var p = +w[e] || 0; if (e === "pl") { var os = orgaosLegal(g); os.forEach(function (o) { tot += p / os.length; soma += p / os.length * progEtapa(g, "pl-" + o); }); return; } tot += p; soma += p * progEtapa(g, e); });
    return tot ? Math.round(soma / tot * 100) : 0;
  }
  function etapasArq(g) { var e = ["ep"]; if (doZero(g.sigla)) e.push("ap"); if (doZero(g.sigla) && temLegal(g)) e.push("pl"); e.push("pe"); return e; }
  function pctProjeto(g) { return pctPonderado(g, etapasArq(g)); }
  function pctMarc(g) { return marcAtiva(g) ? pctPonderado(g, ["mep", "mex"]) : null; }
  function prazoMarc(g) { return marcAberta(g) && (g.marc.etapa === "mep" || g.marc.etapa === "mex") ? calcPrazo(g, g.marc.etapa) : null; }
  function prazoArq(g) { return ETAPAS[g.etapa] && ETAPAS[g.etapa].prazo ? calcPrazo(g, g.etapa) : null; }
  function marco(g, k) { if (k === "topografico" || k === "documentos") { var it = itensDe(g, "abertura").filter(function (x) { return x.chave === k; })[0]; if (it) return feito(it); } return !!(g.marco || {})[k]; }
  function lancDoProj(pid) { return T.tempo ? T.tempo.lancAtivos().filter(function (l) { return l.tipo === "projeto" && l.alvoId === pid; }) : []; }
  function horasProj(pid) { return lancDoProj(pid).reduce(function (s, l) { return s + l.min; }, 0); }
  function horasEtapa(pid, e) { var ids = ETAPAS[e] && ETAPAS[e].tempo || []; return lancDoProj(pid).reduce(function (s, l) { return ids.indexOf(l.etapaId) >= 0 ? s + l.min : s; }, 0); }
  function ordenar(list) { return list.slice().sort(function (a, b) { return (a.ord || 0) - (b.ord || 0); }); }
  function codigos(g) {
    var out = {};
    etapasPlano(g).forEach(function (et) {
      grupos(et, g).forEach(function (gr) {
        if (!gr.cod) return;
        ordenar(itensDe(g, et).filter(function (x) { return x.grupo === gr.k; })).forEach(function (x, i) { out[x.id] = gr.cod === "serie" ? String(gr.serie + i + 1) : gr.cod + (i < 9 ? "0" : "") + (i + 1); });
      });
    });
    return out;
  }
  function sitNome(k) { var x = SIT.filter(function (o) { return o[0] === k; })[0]; return x ? x[1] : k; }
  function ehSocio(pid) { var p = T.pessoa(pid); return !p || p.perfil !== "colaborador"; }
  function tarefasDoProjeto(pid) {
    var out = [], docs = T.tarefas ? T.tarefas.todas() : {};
    Object.keys(docs).forEach(function (pes) { (docs[pes] || []).forEach(function (t) { if (t.projetoId === pid) out.push({ pes: pes, t: t }); }); });
    return out.sort(function (a, b) { return (a.t.status === "done") - (b.t.status === "done") || String(a.t.dueDate || "9").localeCompare(String(b.t.dueDate || "9")); });
  }
  // Quem tem trabalho pendente no projeto: item do Plano ou tarefa não concluídos.
  function envolvidos(pid, g) {
    var m = {};
    (g.itens || []).forEach(function (x) { if (x.resp && !feito(x)) m[x.resp] = (m[x.resp] || 0) + 1; });
    tarefasDoProjeto(pid).forEach(function (o) { if (o.t.status !== "done") m[o.pes] = (m[o.pes] || 0) + 1; });
    return Object.keys(m).filter(function (id) { return T.pessoa(id); }).sort(function (a, b) { return m[b] - m[a]; });
  }
  // Modelo de móvel por etapa: EP da marcenaria e Executivo (série 900). Vale para todos os projetos.
  var MODELO_MOVEL_EP = { guia: "", desenhos: [{ nome: "Fase 1 · Modelo básico com dimensões gerais", checklist: [] }, { nome: "Fase 2 · Estudo para apresentação", checklist: [] }], checklist: [] };
  function modelo(et) {
    var ms = S.cfg && S.cfg.modelos || {};
    if (et === "mep") return ms.mep && ms.mep.desenhos ? ms.mep : MODELO_MOVEL_EP;
    if (ms.mex && ms.mex.desenhos) return ms.mex;
    var c = S.cfg && S.cfg.modeloMovel; return c && c.desenhos ? c : MODELO_MOVEL;
  }

  // ---------- Plano de Projeto: geração ----------
  function des(nomes, ck) { return (nomes || []).map(function (n) { return { id: T.novoId(), nome: n, feito: false, checklist: (ck && ck[n] || []).map(function (t) { return { t: t, ok: false }; }), guia: "" }; }); }
  var CK_PLANTA = ["Cotas gerais e parciais", "Níveis", "Nomes e áreas dos ambientes", "Indicação de cortes e fachadas", "Esquadrias identificadas"];
  var CK_CORTE = ["Cotas verticais", "Níveis", "Hachuras e materiais", "Esquadrias identificadas"];
  function desenhosDe(titulo) {
    var t = titulo.toLowerCase(), m, ck = {};
    if (t === "implantação") return des(["Implantação", "Quadro de informações gerais", "Quadro de áreas"]);
    if ((m = titulo.match(/^Planta baixa – (.+)$/))) { ck["Planta baixa – " + m[1]] = CK_PLANTA; return des(["Planta baixa – " + m[1], "Quadro de esquadrias"], ck); }
    if (t === "planta de cobertura") return des(["Planta de cobertura"]);
    if ((m = titulo.match(/^Cortes (\w+) e (\w+)$/))) { ck["Corte " + m[1]] = CK_CORTE; ck["Corte " + m[2]] = CK_CORTE; return des(["Corte " + m[1], "Corte " + m[2], "Quadro de esquadrias", "Legenda de hachuras"], ck); }
    if ((m = titulo.match(/^Fachadas (\w+) e (\w+)$/))) return des(["Fachada " + m[1], "Fachada " + m[2], "Quadro de esquadrias", "Legenda de hachuras"]);
    if (t.indexOf("topografia") === 0) return des(["Planta de terraplenagem", "Cortes do terreno", "Perspectiva 3D", "Quadro de corte e aterro (m³)"]);
    if ((m = titulo.match(/^(Piso e acabamento|Hidrossanitário|Elétrica|Forro e iluminação) – (.+)$/))) return des([m[1] + " – " + m[2], "Legenda e quadro"]);
    if ((m = titulo.match(/^amp(\d+) – (.+)$/))) return des(["amp" + m[1] + " – " + m[2] + " – planta baixa", "amp" + m[1] + " – " + m[2] + " – elevações"]);
    if (t.indexOf("bancada – ") === 0) return des([titulo + " – planta", titulo + " – vistas e cortes"]);
    return [];
  }
  function novoItem(etapa, grupo, titulo, extra) { return Object.assign({ id: T.novoId(), etapa: etapa, grupo: grupo, titulo: titulo, sit: "a_fazer", resp: null, prazo: null, prio: null, rev: grupo.charAt(0) === "s" ? "R00" : null, desenhos: desenhosDe(titulo) }, extra || {}); }
  function novoMovel(etapa, grupo, titulo, extra) {
    var md = modelo(etapa), ck = md.checklist || [];
    var d = (md.desenhos || []).map(function (z) { return { id: T.novoId(), nome: z.nome, feito: false, checklist: (z.checklist && z.checklist.length ? z.checklist : ck).map(function (t) { return { t: t, ok: false }; }), guia: md.guia || "" }; });
    return novoItem(etapa, grupo, titulo, Object.assign({ desenhos: d, movel: true }, extra || {}));
  }
  // Termos não são itens: viram botão no fim da etapa (geram o PDF).
  function gerarPlano(o) {
    var pavs = o.pavs && o.pavs.length ? o.pavs : ["Térreo"], zero = doZero(o.sigla), legal = zero && o.legal !== "nao_se_aplica", out = [];
    function add(e, gr, t, x) { out.push(novoItem(e, gr, t, x)); }
    add("abertura", "abertura", "Receber o levantamento topográfico", { chave: "topografico" });
    add("abertura", "abertura", "Receber documentos do cliente (pessoais, registro, IPTU)", { chave: "documentos" });
    ["Duplicar a pasta padrão", "Criar o arquivo ArchiCAD pelo template", "Preencher dados do cliente e do terreno", "Análise de legislação"].forEach(function (t) { add("abertura", "abertura", t); });
    add("abertura", "abertura", "Modelar o terreno", { desenhos: des(["Importar o topográfico", "Curvas e platôs", "Conferir níveis e divisas"]) });
    add("ep", "ep-estudos", "Análise do terreno e condicionantes", { desenhos: des(["Insolação", "Ventilação", "Chuva", "Visuais", "Legislação aplicada"]) });
    ["Estudo de concepção (partido)", "Modelo 3D", "Estrutura preliminar"].forEach(function (t) { add("ep", "ep-estudos", t); });
    ["Estudo de concepção", "Implantação / cobertura"].concat(pavs.map(function (p) { return "Planta – " + p; }))
      .concat(["Corte AA", "Perspectiva explodida", "Estudo de insolação", "Estudo de ventilação", "Estudo de visuais", "Perspectiva estrutural", "Perspectiva de terraplenagem", "Imagens fotorrealistas", "Animação (bônus)", "Modelo BIMx"])
      .forEach(function (t) { add("ep", "ep-apres", t); });
    add("ep", "ep-entrega", "Montar a apresentação (PDF widescreen)", { desenhos: des(["Capa", "Imagem impactante", "Análise do terreno", "Estudos esquemáticos de concepção", "Imagens", "Plantas e cortes", "Mais imagens", "Esquemas e diagramas", "Imagens finais"]) });
    ["Revisão interna", "Reunião de apresentação", "Rodada de ajustes 1", "Rodada de ajustes 2"].forEach(function (t) { add("ep", "ep-entrega", t); });
    // Séries 100 a 400: criadas no Anteprojeto e desenvolvidas de novo no Executivo (muda o checklist)
    function base(e) {
      add(e, "s100", "Implantação"); pavs.forEach(function (p) { add(e, "s100", "Planta baixa – " + p); }); add(e, "s100", "Planta de cobertura");
      add(e, "s200", "Cortes AA e BB"); add(e, "s200", "Cortes CC e DD");
      add(e, "s300", "Fachadas 01 e 02"); add(e, "s300", "Fachadas 03 e 04");
      add(e, "s400", "Topografia e terraplenagem");
      ["Piso e acabamento", "Hidrossanitário", "Elétrica", "Forro e iluminação"].forEach(function (m) { pavs.forEach(function (p) { add(e, "s400", m + " – " + p); }); });
      add(e, "s400", "Mapeamento de cobertura");
    }
    if (zero) {
      base("ap");
      ["Estrutural (fundação e estrutura)", "Hidrossanitário", "Elétrico (iluminação de apoio, rede, automação)", "SPDA", "Climatização"].forEach(function (t) { add("ap", "ap-comp", t, { desenhos: des(["Envio ao complementar", "Reunião 1", "Reunião 2", "Conclusão do complementar"]) }); });
      ["Acabamentos e revestimentos", "Louças e metais", "Equipamentos", "Forro e iluminação final", "Bancadas", "Esquadrias"].forEach(function (t) { add("ap", "ap-def", t); });
      ["Revisão interna", "Reunião final com o cliente"].forEach(function (t) { add("ap", "ap-fecha", t); });
    }
    if (legal) out = out.concat(itensLegal("pref", pavs));
    base("pe");
    var amp = 0, bancadas = [];
    (o.ambientes || []).forEach(function (a) { var t = tipoAmb(a.tipo); if (t.amp) { amp++; add("pe", "s500", "amp" + (amp < 10 ? "0" : "") + amp + " – " + a.nome, { ambId: a.id }); } if (t.banc) bancadas.push(a); });
    ["Esquadrias de alumínio e vidro", "Esquadrias de madeira", "Guarda-corpo e corrimão"].forEach(function (t) { add("pe", "s600", t); });
    if (bancadas.length) { pavs.forEach(function (p) { add("pe", "s700", "Planta de marmoraria – " + p); }); bancadas.forEach(function (a) { add("pe", "s700", "Bancada – " + a.nome, { ambId: a.id, banc: true }); }); }
    add("pe", "s800", "Detalhe construtivo (exemplo)");
    ["Terraplenagem", "Revestimentos: especificação e quantitativo", "Louças e metais", "Equipamentos", "Tomadas e interruptores", "Iluminação"].forEach(function (t) { add("pe", "s1000", t); });
    ["Revisão final das pranchas", "Guia de Projeto", "Imagens renderizadas atualizadas", "Modelo BIMx atualizado", "Reunião de entrega (abrir as pranchas)", "Entrega física"].forEach(function (t) { add("pe", "pe-fecha", t); });
    var ord = {}; out.forEach(function (x) { var k = x.etapa + x.grupo; ord[k] = (ord[k] || 0) + 1; x.ord = ord[k]; });
    return out;
  }
  // Itens padrão de um projeto legal (condomínio ou prefeitura): pranchas e trâmite. Ajustáveis no Plano.
  function itensLegal(o, pavs) {
    var gr = "pl-" + o, out = [], tram = o === "cond" ? ["Organizar documentos do cliente", "Protocolo no condomínio", "Atender exigências", "Aprovação no condomínio"] : ["Organizar documentos do cliente", "Protocolo na prefeitura", "Atender exigências", "Aprovação / alvará"];
    ["Situação / implantação", "Planta de cobertura"].concat((pavs && pavs.length ? pavs : ["Térreo"]).map(function (p) { return "Planta – " + p; })).concat(["Plantas de áreas", "Corte longitudinal", "Corte transversal"]).concat(tram)
      .forEach(function (t, k) { out.push(novoItem("pl", gr, t, { ord: k + 1 })); });
    return out;
  }
  function novoAmbiente(tipo, extra) { var t = tipoAmb(tipo); return Object.assign({ id: T.novoId(), tipo: t.id, nome: t.n, setor: t.s, pav: null, qtd: 1, area: t.a, cfg: {}, obs: "", origem: "cadastro" }, extra || {}); }
  function ambientesDeQtd(qtd, pav0, areas) {
    var out = [];
    catalogo().forEach(function (t) {
      var n = +qtd[t.id] || 0; if (!n) return;
      var ar = areas && areas[t.id] != null && areas[t.id] !== "" ? +areas[t.id] : t.a;
      if (t.id === "garagem") { out.push(novoAmbiente(t.id, { qtd: n, pav: pav0, nome: "Garagem", area: ar })); return; }
      for (var i = 1; i <= n; i++) out.push(novoAmbiente(t.id, { pav: pav0, nome: n > 1 ? t.n + " " + i : t.n, area: ar }));
    });
    return out;
  }

  // ---------- gravação ----------
  async function salvar(pid, fn) {
    var cur = T.clone(S.gp[pid] || {}); fn(cur); cur.atualizadoEm = new Date().toISOString();
    // Limite do banco: 256 KB por documento. Acima de 245 KB não grava (avisa); acima de 200 KB, só avisa.
    var tam = JSON.stringify(cur).length;
    if (tam > 245000) { T.toast("O projeto chegou ao limite de tamanho do banco. Nada foi salvo: avise o Claude para dividir o projeto."); return; }
    if (tam > 200000 && !S.avisoTam) { S.avisoTam = 1; T.toast("Este projeto está perto do limite de tamanho do banco (" + Math.round(tam / 1024) + " de 256 KB)."); }
    S.gp[pid] = cur; T.scheduleRender();
    try { await T.db.doc("gp/" + pid).set(cur); } catch (e) { T.showError(e); }
  }
  function marcarConclusao(it, antes) { var ag = feito(it); if (ag && !antes) it.concluidoEm = new Date().toISOString(); if (!ag) delete it.concluidoEm; }
  function mudarItem(pid, id, fn) { return salvar(pid, function (x) { var it = T.byId(x.itens || [], id); if (it) { var antes = feito(it); fn(it, x); marcarConclusao(it, antes); } }); }
  // Histórico: registro fiel com dia e hora. Não se edita nem se apaga (correção = novo registro).
  function evento(g, txt, data, extra) { g.eventos = g.eventos || []; g.eventos.push(Object.assign({ data: data || hojeIso(), em: new Date().toISOString(), por: T.state.pessoaId || null, txt: txt }, extra || {})); }
  async function statusProjeto(pid, status) { try { await T.db.doc("projetos/" + pid).update({ status: status }); } catch (e) { T.showError(e); } }

  // ---------- regras automáticas: suspensão (20 d.u. sem retorno do cliente) e arquivamento (60 d.u. suspenso) ----------
  function autoRegras() {
    if (!S.loaded || !T.db) return;
    Object.keys(S.gp).forEach(function (pid) {
      var g = S.gp[pid]; if (!g || S.auto[pid]) return;
      var e = esperaAberta(g);
      if (!g.suspenso && !g.arquivado && g.etapa !== "encerrado" && e && e.quem === "cliente" && du(e.inicio, new Date()) >= ESPERA_SUSPENDE) {
        S.auto[pid] = 1; var desde = T.ymd(somaDu(ESPERA_SUSPENDE, e.inicio));
        salvar(pid, function (x) { x.suspenso = { desde: desde, auto: true }; evento(x, "Projeto suspenso automaticamente: " + ESPERA_SUSPENDE + " dias úteis sem retorno do cliente (cláusula 3.4)", desde, { tipo: "suspensao" }); })
          .then(function () { return statusProjeto(pid, "pausado"); }).then(function () { S.auto[pid] = 0; });
      } else if (g.suspenso && !g.arquivado && du(g.suspenso.desde, new Date()) > SUSPENSO_ARQUIVA) {
        S.auto[pid] = 1; var em = T.ymd(somaDu(SUSPENSO_ARQUIVA + 1, g.suspenso.desde));
        salvar(pid, function (x) { x.arquivado = { desde: em, auto: true }; evento(x, "Projeto arquivado automaticamente: mais de " + SUSPENSO_ARQUIVA + " dias úteis suspenso", em, { tipo: "arquivamento" }); })
          .then(function () { S.auto[pid] = 0; });
      }
    });
  }

  // ---------- notificações ----------
  // [nível, texto, projetoId]. pessoaId = null: todas (capa e Gestor); senão, só o que a pessoa deve ver
  // (sócios veem tudo; colaborador vê os projetos em que tem trabalho pendente ou reunião).
  function avisos(pessoaId) {
    autoRegras();
    var out = [], hoje = hojeIso(), amanha = amanhaIso();
    projetosGestor().forEach(function (p) {
      var g = G(p.id); if (!ativo(g) || (g.etapa === "encerrado" && !marcAberta(g))) return;
      var socio = !pessoaId || ehSocio(pessoaId), meu = socio || envolvidos(p.id, g).indexOf(pessoaId) >= 0;
      var nome = "<b>" + esc(p.codigo || p.nome) + "</b>";
      (g.reunioes || []).forEach(function (r) {
        if (r.status !== "marcada" || (r.data !== amanha && r.data !== hoje)) return;
        if (!socio && (r.participantes || []).indexOf(pessoaId) < 0) return;
        out.push(["warn", nome + ": reunião " + (r.data === hoje ? "hoje" : "amanhã") + (r.hora ? " às " + esc(r.hora) : "") + " · " + esc(r.tipo || "Reunião") + (r.pauta ? " · " + esc(r.pauta) : ""), p.id]);
      });
      if (!meu) return;
      prazosAbertos(g).forEach(function (pz) {
        if (pz.pausado || pz.resta > (pz.aviso || PRAZO_AVISO)) return;
        var en = esc(pz.nome || ETAPAS[pz.etapa].curto);
        out.push(["bad", nome + (pz.resta >= 0 ? ": faltam " + pz.resta + " d.u. para o fim do prazo de " + en + " (" + T.fmtYmd(T.ymd(pz.fim)) + ")" : ": prazo de " + en + " vencido há " + (-pz.resta) + " d.u."), p.id]);
      });
      ["arq", "marc"].forEach(function (tr) {
        if (tr === "marc" && !marcAberta(g)) return;
        var e = esperaAberta(g, tr); if (!e || e.quem !== "cliente") return;
        var d = du(e.inicio, new Date()); if (d < ESPERA_AVISO) return;
        if (tr === "arq" && d < ESPERA_SUSPENDE) out.push(["warn", nome + " aguarda o cliente há " + d + " dias úteis · vai para Suspensos em " + (ESPERA_SUSPENDE - d), p.id]);
        if (tr === "marc") out.push(["warn", nome + ": marcenaria aguarda o cliente há " + d + " dias úteis", p.id]);
      });
      if (!socio) return;
      var ab = itensDe(g, "abertura");
      if (g.etapa === "abertura" && marco(g, "contrato") && marco(g, "parcela") && !ab.some(function (x) { return x.sit !== "a_fazer"; })) out.push(["ok", nome + ": contrato e 1ª parcela ok · pronto para iniciar", p.id]);
      if (g.etapa === "abertura" && ab.length && prontos(ab) === ab.length) out.push(["ok", nome + ": Abertura concluída · liberado para a concepção", p.id]);
      var ie = itensDe(g, g.etapa); if (ETAPAS[g.etapa] && ETAPAS[g.etapa].termo && ie.length && prontos(ie) === ie.length) out.push(["ok", nome + ": todos os itens de " + esc(ETAPAS[g.etapa].curto) + " prontos · pronto para o termo", p.id]);
      if (marcAberta(g) && (g.marc.etapa === "mep" || g.marc.etapa === "mex")) { var im = itensDe(g, g.marc.etapa); if (im.length && prontos(im) === im.length) out.push(["ok", nome + ": itens de " + esc(ETAPAS[g.marc.etapa].curto) + " prontos · pronto para o termo", p.id]); }
    });
    var ordem = { bad: 0, warn: 1, ok: 2 };
    return out.sort(function (a, b) { return ordem[a[0]] - ordem[b[0]]; });
  }
  function avisoHtml(a) { return '<button class="gp-aviso ' + a[0] + '" data-gpopen="' + esc(a[2]) + '">' + a[1] + "</button>"; }

  // ---------- componentes ----------
  function trilha(g) { var f = fluxo(g.sigla), i = f.indexOf(g.etapa); return '<span class="gp-trail">' + f.map(function (e, k) { return '<i class="' + (k < i ? "on" : k === i ? "cur" : "") + '"></i>'; }).join("") + "</span>"; }
  function sitPill(g) { var s = situacao(g); return '<span class="gp-sit ' + s.k + '">' + esc(s.txt) + "</span>"; }
  function avatarPessoa(id, small) { var p = T.pessoa(id); return p ? '<span class="avatar' + (small ? " av-s" : "") + '" title="' + esc(p.nome) + '">' + esc(p.nome.charAt(0)) + "</span>" : ""; }
  function avatares(pid, g) { var ids = envolvidos(pid, g); if (!ids.length) return ""; return '<span class="gp-avs" title="Com trabalho pendente: ' + esc(ids.map(function (i) { return T.pessoa(i).nome; }).join(", ")) + '">' + ids.slice(0, 3).map(function (i) { return avatarPessoa(i, true); }).join("") + (ids.length > 3 ? '<span class="avatar av-s av-more">+' + (ids.length - 3) + "</span>" : "") + "</span>"; }
  function optPessoas(sel, vazio) { return (vazio != null ? '<option value="">' + esc(vazio) + "</option>" : "") + T.pessoasAtivas().map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === sel ? " selected" : "") + ">" + esc(p.nome) + "</option>"; }).join(""); }
  function etapaLinha(g) {
    if (g.etapa === "encerrado" && marcAberta(g)) return "Marcenaria · " + esc(ETAPAS[g.marc.etapa] ? ETAPAS[g.marc.etapa].curto : "aguardando");
    var et = ETAPAS[g.etapa] || {}; return esc(et.nome || "") + (et.fases && g.fase ? " · fase " + g.fase : "") + (marcAberta(g) && g.marc.etapa === "mep" ? " + marcenaria" : "");
  }
  function barraPrazo(pz) {
    if (!pz) return '<div class="gp-pbar none"><i style="width:0"></i></div>';
    return '<div class="gp-pbar ' + corPrazo(pz.pct) + (pz.pausado ? " paused" : "") + '" title="' + pz.usados + " de " + pz.prazo + " dias úteis" + (pz.pausado ? " · pausado" : "") + '"><i style="width:' + pz.pct + '%"></i></div>';
  }
  function prioSel(it, attr) { return '<select class="prio-sel p' + (it.prio || 0) + '" ' + attr + '="' + it.id + '" aria-label="Prioridade" title="Prioridade">' + T.optHtml([["", "P–"], ["1", "P1"], ["2", "P2"], ["3", "P3"]], it.prio || "") + "</select>"; }
  function sitSel(it, attr) { return '<select class="sit-sel s-' + it.sit + '" ' + attr + '="' + it.id + '" aria-label="Situação">' + T.optHtml(SIT, it.sit) + "</select>"; }
  function desenhosProg(it) { var d = it.desenhos || []; if (!d.length) return ""; var f = d.filter(function (x) { return x.feito; }).length; return '<span class="it-prog" title="Desenhos concluídos"><span class="mini"><i style="width:' + Math.round(f / d.length * 100) + '%"></i></span>' + f + "/" + d.length + "</span>"; }
  function fmtDataCurta(ymd) { if (!ymd) return ""; var p = ymd.split("-"); return p[2] + "/" + p[1]; }

  // ---------- lista (visão geral de todos) ----------
  function cardProjeto(p) {
    var g = G(p.id), it = itensDe(g), pz = prazoInfo(g), h = horasProj(p.id), pct = pctProjeto(g), pm = pctMarc(g);
    var pa = prazoArq(g), pzm = prazoMarc(g), dois = marcAtiva(g);
    function vbar(v, rot, tit, cls) { return '<div class="gp-vbar' + (cls || "") + '" title="' + tit + " " + v + '% concluído"><i style="height:' + v + '%"></i><b>' + v + "%</b>" + (rot ? "<small>" + rot + "</small>" : "") + "</div>"; }
    function linhaPrazo(z, rot) { return '<div class="gp-prazo-row">' + (rot ? '<span class="gp-prazo-rot">' + rot + "</span>" : "") + '<span class="num">' + (z ? T.fmtYmd(T.ymd(z.fim)) : "sem prazo") + "</span>" + barraPrazo(z) + "</div>"; }
    var legal = orgaosLegal(g).length && ["ap", "pe"].indexOf(g.etapa) >= 0 ? '<div class="gp-legal">Legal: ' + orgaosLegal(g).map(function (o) { return esc(ORGAOS[o].curto + " " + legSitNome(legalDe(g, o).sit).toLowerCase()); }).join(" · ") + "</div>" : "";
    return '<button class="tile-btn gp-card" data-open="' + esc(p.id) + '">' +
      (dois ? '<div class="gp-vbars">' + vbar(pct, "Arq.", "Projeto arquitetônico") + vbar(pm, "Marc.", "Projeto de marcenaria", " marc") + "</div>" : vbar(pct, "", "Projeto")) +
      '<div class="gp-card-main"><div class="gp-top"><span class="gp-sig">' + esc(g.sigla || "") + '</span><div class="gp-names"><div class="gp-name">' + esc(p.nome) + '</div><div class="gp-clients">' + esc(clientesNomes(p) || "Sem cliente") + "</div></div>" + avatares(p.id, g) + "</div>" +
      '<div class="gp-etapa">' + trilha(g) + "<span>" + etapaLinha(g) + "</span></div>" + sitPill(g) +
      '<div class="gp-next">' + (g.proximo ? "Próximo: " + esc(g.proximo) : '<span class="muted">Sem próximo passo definido</span>') + "</div>" + legal +
      '<div class="tile-stats"><div><small>Plano</small><b>' + (it.length ? prontos(it) + "/" + it.length : "—") + "</b></div>" +
      "<div><small>Prazo</small><b>" + (pz ? (pz.pausado ? "pausado" : pz.resta >= 0 ? pz.resta + " d.u." : "vencido") : "—") + "</b></div>" +
      "<div><small>Horas</small><b>" + (h ? T.fmtH(h) : "—") + "</b></div></div>" +
      (dois ? (g.etapa !== "encerrado" ? linhaPrazo(pa, "Arq.") : "") + (marcAberta(g) ? linhaPrazo(pzm, "Marc.") : "") : linhaPrazo(pz, "")) + "</div></button>";
  }
  var GRUPOS_LISTA = [["abertura", "Abertura"], ["ep", "Estudo Preliminar"], ["ap", "Anteprojeto"], ["pe", "Executivo"], ["marc", "Marcenaria"]];
  function renderLista() {
    var todos = projetosGestor(), q = S.busca.trim().toLowerCase();
    var n = { ativos: 0, aguardando: 0, suspensos: 0, arquivados: 0 };
    todos.forEach(function (p) { var g = G(p.id); if (g.arquivado) n.arquivados++; else if (g.suspenso) n.suspensos++; else { if (g.etapa !== "encerrado" || marcAberta(g)) n.ativos++; if (esperaAlguma(g)) n.aguardando++; } });
    $("gp-resumo").innerHTML = [["ativos", "Em andamento"], ["aguardando", "Aguardando"], ["suspensos", "Suspensos"], ["arquivados", "Arquivados"]].map(function (x) {
      return '<button class="gp-kpi' + (S.filtro === x[0] ? " is-selected" : "") + '" data-f="' + x[0] + '"><small>' + x[1] + "</small><b>" + n[x[0]] + "</b></button>";
    }).join("");
    $("gp-avisos").innerHTML = avisos(null).map(avisoHtml).join("");
    var list = todos.filter(function (p) {
      var g = G(p.id);
      if (S.filtro === "suspensos") return !!g.suspenso && !g.arquivado;
      if (S.filtro === "arquivados") return !!g.arquivado;
      if (!ativo(g)) return false;
      if (S.filtro === "aguardando") return !!esperaAlguma(g);
      return true;
    });
    if (q) list = list.filter(function (p) { return (p.nome + " " + (p.codigo || "") + " " + clientesNomes(p)).toLowerCase().indexOf(q) >= 0; });
    var cont = {}; list.forEach(function (p) { var k = etapaLista(G(p.id)); cont[k] = (cont[k] || 0) + 1; });
    var mostraEtapas = S.filtro === "ativos" || S.filtro === "aguardando";
    $("gp-etapas").innerHTML = mostraEtapas ? GRUPOS_LISTA.map(function (x) { return '<button class="gp-ebtn' + (S.foco === x[0] ? " is-selected" : "") + '" data-foco="' + x[0] + '"' + (cont[x[0]] ? "" : " disabled") + ">" + x[1] + ' <b class="num">' + (cont[x[0]] || 0) + "</b></button>"; }).join("") : "";
    function urg(p) { var s = situacao(G(p.id)); return s.k === "bad" ? 0 : s.k === "wait" ? 1 : 2; }
    var ordem = GRUPOS_LISTA.slice(); if (S.foco) ordem.sort(function (a, b) { return (b[0] === S.foco) - (a[0] === S.foco); });
    var html;
    if (mostraEtapas) {
      html = ordem.map(function (x) {
        var itens = list.filter(function (p) { return etapaLista(G(p.id)) === x[0]; }).sort(function (a, b) { return urg(a) - urg(b) || a.nome.localeCompare(b.nome); });
        return itens.length ? '<div class="gp-group' + (S.foco === x[0] ? " is-foco" : "") + '"><h3 class="cover-label">' + esc(x[1]) + " · " + itens.length + '</h3><div class="gp-cards">' + itens.map(cardProjeto).join("") + "</div></div>" : "";
      }).join("");
      var enc = list.filter(function (p) { return etapaLista(G(p.id)) === "encerrado"; });
      if (enc.length) html += '<details class="gp-group"><summary class="cover-label">Encerrados · ' + enc.length + '</summary><div class="gp-cards">' + enc.map(cardProjeto).join("") + "</div></details>";
    } else html = list.length ? '<div class="gp-cards">' + list.map(cardProjeto).join("") + "</div>" : "";
    if (!todos.length) html = '<div class="card gp-empty"><h3 class="panel-title">Nenhum projeto no Gestor ainda</h3><p>Crie o primeiro com “+ Novo projeto”. Projetos já em andamento entram direto na etapa em que estão; os que já existem em Cadastros › Projetos podem ser levados ao Gestor por lá.</p></div>';
    else if (!html) html = '<div class="empty">Nenhum projeto neste filtro.</div>';
    $("gp-grupos").innerHTML = html;
  }

  // ---------- painel do projeto ----------
  var ABAS = [["geral", "Visão geral"], ["plano", "Plano de Projeto"], ["tarefas", "Tarefas"], ["historico", "Histórico"], ["programa", "Programa"], ["info", "Informações"], ["config", "Configurações"]];
  function renderProjeto() {
    var p = proj(S.projId), g = G(S.projId);
    if (!g) { S.view = "lista"; return render(); }
    var pct = pctProjeto(g), pm = pctMarc(g);
    function hprog(v, rot, cls) { return '<div class="gp-hprog' + (cls || "") + '" title="Etapas com peso (Configurações › Peso das etapas)"><span>' + rot + '</span><div class="gp-hbar"><i style="width:' + v + '%"></i></div><b class="num">' + v + "%</b></div>"; }
    var acoes = g.arquivado ? '<button class="btn btn-small" data-act="desarquivar">Desarquivar</button>' :
      g.suspenso ? '<button class="btn btn-small btn-primary" data-act="reativar">Reativar</button><button class="btn btn-small" data-act="arquivar">Arquivar</button>' :
        '<button class="btn btn-small" data-act="suspender">Suspender</button><button class="btn btn-small" data-act="arquivar">Arquivar</button>';
    $("gp-p-head").innerHTML = '<div class="gp-p-nav"><button class="link" data-voltar="1">← Todos os projetos</button><div class="form-actions gp-p-acts">' + acoes + "</div></div>" +
      '<div class="gp-p-title"><span class="gp-sig">' + esc(g.sigla) + '</span><div><h2 class="gp-name gp-p-name">' + esc(p.nome) + '</h2><div class="section-meta">' + esc(p.codigo || "") + " · " + esc(clientesNomes(p) || "sem cliente") + "</div></div>" + sitPill(g) + "</div>" +
      '<div class="segmented gp-abas">' + ABAS.map(function (a) { return '<button class="seg-pill' + (S.tab === a[0] ? " is-selected" : "") + '" data-tab="' + a[0] + '">' + a[1] + "</button>"; }).join("") + "</div>" +
      (pm != null ? '<div class="gp-hprogs">' + hprog(pct, "Projeto arquitetônico concluído") + hprog(pm, "Projeto de marcenaria concluído", " marc") + "</div>" : hprog(pct, "Projeto concluído"));
    // Formulário com alterações ainda não salvas (Ficha, ambiente, inclusão): não redesenhar por baixo de quem digita.
    if (S.sujo && S.sujo === S.projId + "|" + S.tab && document.querySelector("#gp-p-body form, #gp-p-body .amb-ed")) return;
    S.sujo = null;
    $("gp-p-body").innerHTML = S.tab === "plano" ? abaPlano(g) : S.tab === "tarefas" ? abaTarefas(g) : S.tab === "historico" ? abaHistorico(g, p) : S.tab === "programa" ? abaPrograma(g, p) : S.tab === "info" ? abaInfo(g, p) : S.tab === "config" ? abaConfig(g, p) : abaGeral(g, p);
  }
  function passos(g, pid) {
    var f = fluxo(g.sigla), i = f.indexOf(g.etapa), lista = f.filter(function (e) { return e !== "encerrado"; }).map(function (e) { return { e: e, k: f.indexOf(e), trilha: "arq" }; });
    if (marcAtiva(g)) ["mep", "mex"].forEach(function (e) { lista.push({ e: e, trilha: "marc" }); });
    var mi = marcAtiva(g) ? ["aguardando", "mep", "espera", "mex", "fim"].indexOf(g.marc.etapa) : -1;
    return '<div class="gp-steps">' + lista.map(function (s, n) {
      var info = (g.etapas || {})[s.e] || {}, done, cur;
      if (s.trilha === "arq") { done = s.k < i; cur = s.k === i; } else { done = s.e === "mep" ? mi >= 2 : mi >= 4; cur = s.e === "mep" ? mi === 1 : mi === 3; }
      var h = horasEtapa(pid, s.e), sub = done ? (info.termoEm ? "termo " + T.fmtYmd(info.termoEm) : "concluída") : cur ? "em curso" : s.e === "mex" && mi === 2 ? "aguarda a arquitetura" : "";
      return '<div class="gp-step ' + (done ? "done" : cur ? "cur" : "") + (s.trilha === "marc" ? " marc" : "") + '"><i>' + (done ? "✓" : n + 1) + "</i><b>" + esc(ETAPAS[s.e].curto) + "</b><small>" + esc(sub) + '</small><span class="gp-step-h" title="Horas lançadas nesta etapa">' + (h ? T.fmtH(h) : "—") + "</span></div>";
    }).join("") + "</div>";
  }
  // Visão geral organizada por trilha contratada (arquitetura, marcenaria): quadros iguais, cada um com etapa, situação,
  // números, próximo passo, espera/pausa própria e o encerramento da etapa. O Projeto Legal tem quadros próprios.
  function horasTrilha(pid, tr) { var ids = []; Object.keys(ETAPAS).forEach(function (e) { if (ETAPAS[e].tempo && trilhaDe(e) === tr) ids = ids.concat(ETAPAS[e].tempo); }); return lancDoProj(pid).reduce(function (s, l) { return ids.indexOf(l.etapaId) >= 0 ? s + l.min : s; }, 0); }
  function numerosTrilha(g, pid, tr, pz, ie, et) {
    var semIni = !pz && et && ETAPAS[et] && ETAPAS[et].prazo && !((g.etapas || {})[et] || {}).inicio;
    return '<div class="gp-strip gp-strip-in"><div><small>Prazo</small><b>' + (pz ? pz.usados + " / " + pz.prazo + " d.u." : "—") + "</b><span>" + (pz ? (pz.pausado ? "pausado" : pz.resta >= 0 ? "restam " + pz.resta : "vencido há " + (-pz.resta)) : semIni ? 'sem data de início · <button class="link" data-tab="config">Configurações</button>' : "sem prazo nesta etapa") + "</span></div>" +
      "<div><small>Data final</small><b>" + (pz ? T.fmtYmd(T.ymd(pz.fim)) : "—") + "</b><span>" + (pz ? (pz.pausado ? "avança enquanto pausado" : "em dias úteis") : "") + "</span></div>" +
      "<div><small>Itens da etapa</small><b>" + (ie.length ? prontos(ie) + " / " + ie.length : "—") + "</b><span>prontos</span></div>" +
      "<div><small>Horas</small><b>" + T.fmtH(horasTrilha(pid, tr)) + "</b><span>" + (tr === "marc" ? "na marcenaria" : "na arquitetura") + "</span></div>" +
      '<div class="gp-strip-bar">' + barraPrazo(pz) + "</div></div>";
  }
  function controleEspera(g, tr) {
    var e = esperaAberta(g, tr);
    if (g.suspenso || g.arquivado) return "";
    if (e) return '<div class="gp-espera on"><p><b>' + (e.quem === "interna" ? "Pausa interna" : "Aguardando " + esc(nomeQuem(e.quem))) + "</b> desde " + T.fmtYmd(T.ymd(new Date(e.inicio))) + " · " + du(e.inicio, new Date()) + " d.u." + (e.motivo ? " · " + esc(e.motivo) : "") + (e.previsto ? " · retorno previsto " + T.fmtYmd(e.previsto) : "") + ". Prazo pausado." +
      (e.quem === "cliente" && tr === "arq" ? " Com " + ESPERA_SUSPENDE + " d.u. sem retorno, o projeto vai sozinho para Suspensos." : "") + '</p><div class="form-actions"><button class="btn btn-small btn-primary" data-act="retomar" data-tr="' + tr + '">Retomou: voltar a em dia</button></div></div>';
    return '<div class="gp-espera"><span class="label">Espera ou pausa</span><div class="gp-wait-form"><select data-quem="' + tr + '" aria-label="Tipo de espera">' + T.optHtml(QUEM_OPC, "cliente") + '</select><input type="date" data-previsto="' + tr + '" title="Retorno previsto (opcional)" aria-label="Retorno previsto"><input data-motivo="' + tr + '" placeholder="Motivo (obrigatório na pausa interna)" aria-label="Motivo"><button class="btn btn-small" data-act="aguardar" data-tr="' + tr + '">Pausar prazo</button></div></div>';
  }
  function quadroArq(g, p) {
    var et = ETAPAS[g.etapa] || {}, enc = g.etapa === "encerrado", pz = enc ? null : prazoArq(g), ie = enc ? [] : itensDe(g, g.etapa);
    var e = esperaAberta(g, "arq"), sit = enc ? { k: "fim", txt: "Entregue" } : e ? { k: "wait", txt: e.quem === "interna" ? "Pausa interna" : "Aguardando " + nomeQuem(e.quem) } : pz && pz.resta < 0 ? { k: "bad", txt: "Prazo vencido" } : { k: "ok", txt: "Em dia" };
    var fase = et.fases && !enc ? '<div class="field"><label for="gp-fase">Fase</label><select id="gp-fase">' + et.fases.map(function (n, k) { return '<option value="' + (k + 1) + '"' + (+g.fase === k + 1 ? " selected" : "") + ">" + (k + 1) + " · " + esc(n) + "</option>"; }).join("") + "</select></div>" : "";
    return '<div class="card gp-box gp-trilha"><div class="gp-trilha-h"><div><small class="gp-trilha-k">Arquitetura</small><h3 class="panel-title">' + esc(enc ? "Arquitetura entregue" : et.nome || "") + (g.fase && et.fases && !enc ? ' <span class="hint">· fase ' + g.fase + "</span>" : "") + '</h3></div><span class="gp-sit ' + sit.k + '">' + esc(sit.txt) + "</span></div>" +
      (enc ? '<p class="hint">Arquitetura encerrada.' + (marcAberta(g) ? " A marcenaria continua no quadro ao lado." : "") + "</p>" :
        numerosTrilha(g, p.id, "arq", pz, ie, g.etapa) + '<div class="gp-trilha-campos">' + fase + '<div class="field"><label for="gp-proximo">Próximo passo</label><input id="gp-proximo" value="' + esc(g.proximo || "") + '" placeholder="Ex.: apresentar o Estudo Preliminar"></div></div>' +
        controleEspera(g, "arq") + blocoAvanco(g)) + "</div>";
  }
  function quadroMarc(g, p) {
    var m = g.marc, et = m.etapa, emCurso = et === "mep" || et === "mex", pz = emCurso ? calcPrazo(g, et) : null, ie = emCurso ? itensDe(g, et) : [];
    var nomeEt = et === "aguardando" ? "Aguardando início" : et === "espera" ? "EP encerrado · aguarda o Executivo arquitetônico" : et === "fim" ? "Marcenaria entregue" : ETAPAS[et].nome.replace(" da marcenaria", "");
    var e = esperaAberta(g, "marc"), sit = et === "fim" ? { k: "fim", txt: "Entregue" } : !emCurso ? { k: "wait", txt: et === "espera" ? "Aguardando a arquitetura" : "Aguardando contrato" } : e ? { k: "wait", txt: e.quem === "interna" ? "Pausa interna" : "Aguardando " + nomeQuem(e.quem) } : pz && pz.resta < 0 ? { k: "bad", txt: "Prazo vencido" } : { k: "ok", txt: "Em dia" };
    var acao = "";
    if (et === "aguardando") acao = '<div class="form-actions"><label class="gp-check"><input type="checkbox" data-marcmarco="contrato"' + (m.contratoOk ? " checked" : "") + '> Contrato assinado</label><label class="gp-check"><input type="checkbox" data-marcmarco="parcela"' + (m.parcela ? " checked" : "") + '> 1ª parcela paga</label></div>' + (m.contratoOk && m.parcela ? '<div class="form-actions"><button class="btn btn-small btn-primary" data-act="marc-iniciar">Iniciar o EP da marcenaria</button></div>' : "");
    else if (emCurso) acao = '<div class="gp-avanco"><div class="form-actions"><button class="btn btn-small btn-termo" data-termo="' + et + '">Gerar ' + (et === "mep" ? "Termo de Encerramento de Etapa" : "Termo de Encerramento de Projeto") + ' (PDF)</button></div><div class="form-actions"><input type="date" id="gp-marc-data" value="' + hojeIso() + '" aria-label="Data"><button class="btn btn-small btn-primary" data-act="marc-avancar">Termo assinado: ' + (et === "mep" ? "encerrar o EP da marcenaria" : "encerrar a marcenaria") + "</button></div></div>";
    return '<div class="card gp-box gp-trilha marc"><div class="gp-trilha-h"><div><small class="gp-trilha-k">Marcenaria</small><h3 class="panel-title">' + esc(nomeEt) + '</h3></div><span class="gp-sit ' + sit.k + '">' + esc(sit.txt) + "</span></div>" +
      (et === "fim" ? '<p class="hint">Marcenaria encerrada.</p>' : numerosTrilha(g, p.id, "marc", pz, ie, et) +
        '<div class="gp-trilha-campos"><div class="field"><label for="gp-mproximo">Próximo passo</label><input id="gp-mproximo" value="' + esc(m.proximo || "") + '" placeholder="Ex.: apresentar os móveis do 1º pavimento"></div></div>' +
        (emCurso ? controleEspera(g, "marc") : "") + acao) + "</div>";
  }
  function quadroLegal(g, o) {
    var l = legalDe(g, o), h = l.hist || [], ult = h[h.length - 1], pz = prazoLegal(g, o), info = ORGAOS[o];
    var rod = h.filter(function (x) { return x.sit === "exigencia"; }).length, comOrgao = 0, comTrilha = 0;
    h.forEach(function (x, k) { var fim = h[k + 1] ? h[k + 1].em : (l.sit === "aprovado" ? x.em : new Date().toISOString()), d = du(x.em, fim); if (x.sit === "protocolado") comOrgao += d; else if (x.sit === "preparo" || x.sit === "exigencia") comTrilha += d; });
    var k = l.sit === "aprovado" ? "fim" : l.sit === "protocolado" ? "wait" : pz && pz.resta < 0 ? "bad" : l.sit === "nao_iniciado" ? "wait" : "ok";
    var prox = { nao_iniciado: ["preparo"], preparo: ["protocolado"], protocolado: ["exigencia", "aprovado"], exigencia: ["protocolado"], aprovado: [] }[l.sit] || [];
    var aviso = o === "pref" && orgaosLegal(g).length > 1 && legalDe(g, "cond").sit !== "aprovado" && l.sit !== "aprovado" ? '<p class="hint warn">O protocolo na prefeitura vem depois do condomínio aprovado.</p>' : "";
    return '<div class="card gp-box gp-legal-box"><div class="gp-trilha-h"><div><small class="gp-trilha-k">Projeto Legal</small><h3 class="panel-title">' + esc(info.nome) + '</h3></div><span class="gp-sit ' + k + '">' + esc(legSitNome(l.sit)) + "</span></div>" +
      '<p class="hint">' + (ult ? "Desde " + T.fmtYmd(T.ymd(new Date(ult.em))) + " · " + du(ult.em, new Date()) + " d.u." : "Sem movimentação registrada.") + (rod ? " · " + rod + (rod === 1 ? " rodada" : " rodadas") + " de exigência" : "") + (h.length ? " · com o " + info.orgao + ": " + comOrgao + " d.u. · com a Trilha: " + comTrilha + " d.u." : "") + "</p>" +
      (pz ? '<div class="gp-prazo-row"><span class="num">' + pz.usados + " / " + pz.prazo + " d.u. · " + T.fmtYmd(T.ymd(pz.fim)) + "</span>" + barraPrazo(pz) + "</div>" : l.sit === "protocolado" ? '<p class="hint">Em análise pelo ' + info.orgao + ": o prazo não corre para a Trilha.</p>" : "") + aviso +
      (prox.length ? '<div class="form-actions"><input type="date" data-legdata="' + o + '" value="' + hojeIso() + '" aria-label="Data">' + prox.map(function (n) { return '<button class="btn btn-small' + (n === "aprovado" ? " btn-primary" : "") + '" data-legsit="' + o + "|" + n + '">' + esc(n === "protocolado" && rod ? "Protocolado de novo" : legSitNome(n).replace(" · em análise", "")) + "</button>"; }).join("") + "</div>" : "") +
      (h.length ? '<button class="link" data-legvolta="' + o + '">Desfazer a última mudança</button>' : "") + "</div>";
  }
  function abaGeral(g, p) {
    var banner = g.arquivado ? '<div class="notice">Arquivado desde ' + T.fmtYmd(g.arquivado.desde) + ". Fica fora da lista principal.</div>" :
      g.suspenso ? '<div class="notice danger">Suspenso desde ' + T.fmtYmd(g.suspenso.desde) + (g.suspenso.auto ? " (automático, cláusula 3.4)" : "") + ". Os prazos estão pausados. Depois de " + SUSPENSO_ARQUIVA + " dias úteis suspenso, vai sozinho para Arquivados.</div>" : "";
    var marcoBox = g.etapa === "abertura" ? '<div class="card gp-box"><h3 class="panel-title">Marco zero</h3>' + MARCO.map(function (m) {
      var auto = m[0] === "topografico" || m[0] === "documentos";
      return '<label class="gp-check"><input type="checkbox" data-marco="' + m[0] + '"' + (marco(g, m[0]) ? " checked" : "") + (auto ? " disabled" : "") + "> " + esc(m[1]) + (auto ? ' <span class="hint">(pela Abertura)</span>' : "") + "</label>";
    }).join("") + '<p class="hint">Pelo contrato, o prazo começa com contrato, 1ª parcela e topográfico.</p></div>' : "";
    var trilhas = '<div class="gp-trilhas' + (marcAtiva(g) ? " dois" : "") + '">' + quadroArq(g, p) + (marcAtiva(g) ? quadroMarc(g, p) : "") + "</div>";
    var legais = orgaosLegal(g).length ? '<div class="gp-trilhas' + (orgaosLegal(g).length > 1 ? " dois" : "") + '">' + orgaosLegal(g).map(function (o) { return quadroLegal(g, o); }).join("") + "</div>" : "";
    return banner + passos(g, p.id) + trilhas + legais + '<div class="gp-cols"><div class="gp-main">' + marcoBox + reunioesBox(g) + "</div>" + '<div class="gp-side">' + ultimos(g) + "</div></div>";
  }
  function blocoAvanco(g) {
    var f = fluxo(g.sigla), prox = f[f.indexOf(g.etapa) + 1], falta = [], bloqueio = false, rotulo, et = ETAPAS[g.etapa];
    if (g.etapa === "abertura") { rotulo = "Base pronta: iniciar o Estudo Preliminar (marco zero)"; if (!marco(g, "contrato")) falta.push("contrato assinado"); if (!marco(g, "parcela")) falta.push("1ª parcela paga"); if (!marco(g, "topografico")) falta.push("topográfico"); var ab = itensDe(g, "abertura"); if (prontos(ab) < ab.length) falta.push((ab.length - prontos(ab)) + " item(ns) da Abertura"); }
    else { rotulo = "Termo assinado: " + (prox === "encerrado" ? "encerrar a arquitetura" : "abrir " + ETAPAS[prox].nome); if (prox === "pe" && !legalAprovado(g)) { orgaosLegal(g).forEach(function (o) { if (legalDe(g, o).sit !== "aprovado") falta.push(ORGAOS[o].nome + " aprovado"); }); bloqueio = true; } }
    var txt = falta.length ? '<p class="hint warn">Falta: ' + esc(falta.join(", ")) + ".</p>" : "";
    var termo = et.termo ? '<button class="btn btn-small btn-termo" data-termo="' + g.etapa + '">' + (et.termo === "projeto" ? "Gerar Termo de Encerramento de Projeto (PDF)" : "Gerar Termo de Encerramento de Etapa (PDF)") + "</button>" : "";
    if (bloqueio) return '<div class="gp-avanco">' + txt + '<p class="hint">O Executivo só abre com o Projeto Legal aprovado' + (orgaosLegal(g).length > 1 ? " (condomínio e prefeitura)" : "") + '. Sem exceção.</p><div class="form-actions">' + termo + "</div></div>";
    var antecip = falta.length ? '<label class="gp-check"><input type="checkbox" id="gp-antecipa"> Antecipação autorizada pela direção, com Termo de Ciência assinado pelo cliente</label><div class="form-actions"><button class="btn btn-small btn-termo" data-termo="ciencia">Gerar Termo de Ciência de Antecipação (PDF)</button></div>' : "";
    return '<div class="gp-avanco">' + txt + antecip + (termo ? '<div class="form-actions">' + termo + "</div>" : "") + '<div class="form-actions"><input type="date" id="gp-termo-data" value="' + hojeIso() + '" aria-label="Data"><button class="btn btn-primary btn-small" data-act="avancar">' + esc(rotulo) + "</button></div></div>";
  }
  function ultimos(g) { var ev = (g.eventos || []).slice(-5).reverse(); return '<div class="card gp-box"><div class="section-head" style="margin:0"><h3 class="panel-title" style="margin:0">Últimos registros</h3><button class="link" data-tab="historico">Histórico completo</button></div>' + (ev.length ? '<ul class="gp-log">' + ev.map(function (x) { return "<li><span>" + T.fmtYmd(x.data) + "</span>" + esc(x.txt) + "</li>"; }).join("") + "</ul>" : '<p class="hint">Nada registrado ainda.</p>') + "</div>"; }

  // ---------- reuniões (marcar → aviso na véspera → registrar com a duração, que vai para o Tempo e o Histórico) ----------
  function reunioesBox(g) {
    var rs = (g.reunioes || []).slice().sort(function (a, b) { return (a.data + (a.hora || "")).localeCompare(b.data + (b.hora || "")); });
    var marc = rs.filter(function (r) { return r.status === "marcada"; }), feitas = rs.filter(function (r) { return r.status === "realizada"; });
    var tot = feitas.reduce(function (s, r) { return s + (r.duracao || 0) * ((r.participantes || []).length || 1); }, 0);
    function linha(r) {
      var pes = (r.participantes || []).map(function (id) { var p = T.pessoa(id); return p ? p.nome : ""; }).filter(Boolean).join(", ");
      return '<div class="rn-row' + (r.status === "realizada" ? " is-done" : "") + '"><span class="rn-d num">' + fmtDataCurta(r.data) + (r.hora ? " " + esc(r.hora) : "") + '</span><span class="rn-t"><b>' + esc(r.tipo || "Reunião") + "</b>" + (r.pauta ? " · " + esc(r.pauta) : "") + '<small>' + esc(pes || "sem participantes") + (r.status === "realizada" ? " · " + T.fmtH(r.duracao) : "") + "</small></span>" +
        (r.status === "marcada" ? '<button class="btn btn-small" data-rnreg="' + r.id + '">Registrar</button>' : "") + "</div>";
    }
    return '<div class="card gp-box"><div class="section-head" style="margin:0"><h3 class="panel-title" style="margin:0">Reuniões</h3><button class="btn btn-small btn-primary" data-act="reuniao">+ Reunião</button></div>' +
      (rs.length ? (marc.length ? '<div class="rn-list">' + marc.map(linha).join("") + "</div>" : "") + (feitas.length ? '<div class="rn-list">' + feitas.slice(-4).reverse().map(linha).join("") + '</div><p class="hint">' + feitas.length + (feitas.length === 1 ? " reunião realizada" : " reuniões realizadas") + " · " + T.fmtH(tot) + " de equipe</p>" : "") : '<p class="hint">Marque a reunião antes (aviso na véspera) ou registre uma que já aconteceu. A duração vai para o Tempo de cada participante.</p>') + "</div>";
  }
  function modalReuniao(g, r) {
    var novo = !r; r = r || { tipo: TIPOS_REUNIAO[0], data: hojeIso(), hora: "", participantes: [T.state.pessoaId || ((T.pessoasAtivas()[0] || {}).id)], pauta: "", duracao: 60, decisoes: "", etapa: g.etapa === "encerrado" ? (marcAberta(g) ? g.marc.etapa : "pe") : g.etapa };
    var ets = etapasPlano(g).filter(function (e) { return ETAPAS[e].tempo; });
    return '<h2 class="section-title">' + (novo ? "Reunião" : "Registrar reunião") + '</h2><form class="grid-form" id="rn-form" data-rn="' + (r.id || "") + '">' +
      '<div class="field col-6"><label for="rn-tipo">Tipo</label><select id="rn-tipo">' + TIPOS_REUNIAO.map(function (t) { return "<option" + (t === r.tipo ? " selected" : "") + ">" + esc(t) + "</option>"; }).join("") + "</select></div>" +
      '<div class="field col-6"><label for="rn-et">Etapa (para as horas)</label><select id="rn-et">' + ets.map(function (e) { return '<option value="' + e + '"' + (e === r.etapa ? " selected" : "") + ">" + esc(ETAPAS[e].nome) + "</option>"; }).join("") + "</select></div>" +
      '<div class="field col-4"><label for="rn-data">Data</label><input type="date" id="rn-data" required value="' + esc(r.data) + '"></div>' +
      '<div class="field col-4"><label for="rn-hora">Horário</label><input type="time" id="rn-hora" value="' + esc(r.hora || "") + '"></div>' +
      '<div class="field col-4"><label for="rn-dur">Duração (min)</label><input type="number" id="rn-dur" min="0" step="15" value="' + (r.duracao || 60) + '"></div>' +
      '<div class="field col-12"><span class="label">Participantes da Trilha</span><div class="gp-multi">' + T.pessoasAtivas().map(function (p) { return '<label class="gp-check"><input type="checkbox" data-rnp="' + esc(p.id) + '"' + ((r.participantes || []).indexOf(p.id) >= 0 ? " checked" : "") + "> " + esc(p.nome) + "</label>"; }).join("") + "</div></div>" +
      '<div class="field col-12"><label for="rn-pauta">Pauta</label><input id="rn-pauta" value="' + esc(r.pauta || "") + '" placeholder="Ex.: apresentação do Estudo Preliminar"></div>' +
      '<div class="field col-12"><label for="rn-dec">Decisões e observações (depois da reunião)</label><textarea id="rn-dec" rows="3">' + esc(r.decisoes || "") + "</textarea></div>" +
      '<div class="col-12 form-actions">' + (novo ? '<button class="btn btn-primary" data-rnmodo="marcar">Marcar (vai para a agenda)</button><button class="btn" data-rnmodo="realizada">Já aconteceu: registrar</button>' : '<button class="btn btn-primary" data-rnmodo="realizada">Registrar como realizada</button>') + '<button type="button" class="btn" data-close="1">Cancelar</button><span class="save-state" id="rn-st"></span></div>' +
      '<p class="hint col-12">Ao registrar, a duração entra no Tempo de cada participante (projeto e etapa escolhidos) e a reunião fica no Histórico.</p></form>';
  }
  async function salvarReuniao(modo) {
    var pid = S.projId, g = G(pid), f = $("rn-form"), id = f.dataset.rn || T.novoId(), part = [];
    T.each("[data-rnp]", function (i) { if (i.checked) part.push(i.dataset.rnp); }, f);
    var r = { id: id, tipo: $("rn-tipo").value, etapa: $("rn-et").value, data: $("rn-data").value, hora: $("rn-hora").value || "", duracao: Math.max(0, +$("rn-dur").value || 0), participantes: part, pauta: $("rn-pauta").value.trim(), decisoes: $("rn-dec").value.trim() };
    var st = $("rn-st");
    if (!r.data) { st.className = "save-state err"; st.textContent = "Escolha a data"; return; }
    if (modo === "realizada" && (!r.duracao || !part.length)) { st.className = "save-state err"; st.textContent = "Informe a duração e os participantes"; return; }
    var antiga = T.byId(g.reunioes || [], id);
    st.className = "save-state"; st.textContent = "Salvando…";
    try {
      if (modo === "marcar") {
        r.status = "marcada"; r.criadaEm = new Date().toISOString();
        await salvar(pid, function (x) { x.reunioes = (x.reunioes || []).concat([r]); evento(x, "Reunião marcada para " + T.fmtYmd(r.data) + (r.hora ? " às " + r.hora : "") + ": " + r.tipo + (r.pauta ? " · " + r.pauta : ""), hojeIso(), { tipo: "reuniao" }); });
        if (T.tarefas) for (var i = 0; i < part.length; i++) await T.tarefas.criar(part[i], { title: r.tipo + (r.pauta ? " · " + r.pauta : "") + " (" + (proj(pid).codigo || proj(pid).nome) + ")", subdivision: "compromisso", dueDate: r.data, dueTime: r.hora || null, durationMinutes: r.duracao || 60, projetoId: pid, reuniaoId: id });
      } else {
        r.status = "realizada"; r.registradaEm = new Date().toISOString();
        var ini = new Date(r.data + "T" + (r.hora || "09:00") + ":00"), fim = new Date(ini.getTime() + r.duracao * 60000), tempoId = (ETAPAS[r.etapa].tempo || [])[0] || null;
        if (T.tempo && T.tempo.lancar) for (var k = 0; k < part.length; k++) {
          await T.tempo.lancar({ pessoaId: part[k], tipo: "projeto", alvoId: pid, etapaId: tempoId, topicoId: null, pranchaId: null, descricao: "Reunião: " + r.tipo + (r.pauta ? " · " + r.pauta : ""), inicio: ini.toISOString(), fim: fim.toISOString(), min: r.duracao,
            origem: "reuniao", reuniaoId: id, criadoEm: new Date().toISOString(), excluido: false, atividadeId: null, ajustes: ini < T.weekStart(new Date()) ? [{ em: new Date().toISOString(), por: T.state.pessoaId || part[k], acao: "inclusao", motivo: "Reunião registrada no Gestor de Projetos" }] : [] });
        }
        await salvar(pid, function (x) { x.reunioes = (x.reunioes || []).filter(function (y) { return y.id !== id; }).concat([Object.assign({}, antiga || {}, r)]); evento(x, "Reunião realizada (" + T.fmtH(r.duracao) + ", " + part.length + (part.length === 1 ? " pessoa" : " pessoas") + "): " + r.tipo + (r.pauta ? " · " + r.pauta : "") + (r.decisoes ? " — " + r.decisoes : ""), r.data, { tipo: "reuniao", min: r.duracao * part.length }); });
      }
      fecharModal(); T.toast(modo === "marcar" ? "Reunião marcada" : "Reunião registrada: " + T.fmtH(r.duracao * part.length) + " no Tempo");
    } catch (e) { st.className = "save-state err"; st.textContent = "Não foi possível salvar"; }
  }

  // ---------- Plano de Projeto ----------
  // Situação de uma etapa do Plano: finalizada, em andamento ou aguardando.
  function etapaEstado(g, et) {
    if (et === "pl") { if (legalAprovado(g)) return "fim"; return orgaosLegal(g).some(function (o) { return legalDe(g, o).sit !== "nao_iniciado"; }) ? "cur" : "wait"; }
    if (ETAPAS[et] && ETAPAS[et].marc) { var mi = ["aguardando", "mep", "espera", "mex", "fim"].indexOf((g.marc || {}).etapa); if (et === "mep") return mi >= 2 ? "fim" : mi === 1 ? "cur" : "wait"; return mi >= 4 ? "fim" : mi === 3 ? "cur" : "wait"; }
    if (et === "marc") { if (!marcAtiva(g)) return "wait"; var ms = [etapaEstado(g, "mep"), etapaEstado(g, "mex")]; return ms[1] === "fim" ? "fim" : ms.indexOf("cur") >= 0 ? "cur" : "wait"; }
    if (g.etapa === "encerrado") return "fim";
    var f = fluxo(g.sigla), i = f.indexOf(et), c = f.indexOf(g.etapa); return i < c ? "fim" : i === c ? "cur" : "wait";
  }
  var ESTADO_NOME = { fim: "Finalizada", cur: "Em andamento", wait: "Aguardando" };
  function contagemSit(list) {
    return '<span class="gp-contagem">' + [["andamento", "Em andamento"], ["revisao", "Revisão interna"], ["rev_cliente", "Revisão Cliente"], ["pronto", "Pronto"]].map(function (s2) { return '<span class="cs-' + s2[0] + '">' + s2[1] + " <b>" + list.filter(function (x) { return x.sit === s2[0]; }).length + "</b></span>"; }).join("") + "</span>";
  }
  function cabecalhoEtapa(g, et, nome) {
    var list = itensDe(g, et), st = etapaEstado(g, et), k = st === "fim" ? "fim" : st === "cur" ? "ok" : "wait";
    return '<div class="gp-ethead"><div class="gp-ethead-t"><b>' + esc(nome || ETAPAS[et].nome) + '</b><span class="gp-sit ' + k + '">' + ESTADO_NOME[st] + "</span>" + contagemSit(list) + "</div>" +
      (list.length ? '<div class="gp-ethead-r"><select data-etresp="' + et + '" aria-label="Responsável da etapa">' + optPessoas(T.state.pessoaId, null) + '</select><button class="btn btn-small" data-etrespok="' + et + '">Atribuir a etapa</button></div>' : "") + "</div>";
  }
  function etapaPlanoPadrao(g) { if (g.etapa === "encerrado") return marcAtiva(g) ? "marc" : "pe"; return etapasPlano(g).indexOf(g.etapa) >= 0 ? g.etapa : "abertura"; }
  function abasPlano(g) { return etapasPlano(g).filter(function (e) { return !ETAPAS[e].marc; }).concat(["marc"]); }
  function abaPlano(g) {
    var ets = abasPlano(g), et = ets.indexOf(S.planoEtapa) >= 0 ? S.planoEtapa : etapaPlanoPadrao(g), cod = codigos(g);
    S.planoEtapa = et;
    var tabs = '<div class="gp-etabs">' + ets.map(function (e) {
      var l = e === "marc" ? itensDe(g, "mep").concat(itensDe(g, "mex")) : itensDe(g, e), nome = e === "marc" ? "Marcenaria" : ETAPAS[e].nome, cur = e === "marc" ? g.etapa === "encerrado" && marcAberta(g) : e === g.etapa;
      var ok = etapaEstado(g, e) === "fim" && (e !== "marc" || marcAtiva(g));
      return '<button class="gp-etab' + (e === et ? " is-selected" : "") + (cur ? " is-cur" : "") + (e === "marc" && !marcAtiva(g) ? " is-off" : "") + '" data-pet="' + e + '"><b>' + (ok ? '<i class="gp-etab-ok" aria-label="Concluída">✓</i>' : "") + esc(nome) + "</b><small>" + (e === "marc" && !marcAtiva(g) ? "não contratada" : prontos(l) + "/" + l.length) + "</small></button>";
    }).join("") + "</div>";
    if (et === "marc") return tabs + planoMarcenaria(g, cod);
    var tool = '<div class="section-head gp-tool"><div class="section-meta">Clique no nome para abrir desenhos e checklists.</div><label class="gp-check"><input type="checkbox" id="gp-pend"' + (S.pendentes ? " checked" : "") + "> Só pendentes</label></div>";
    var rel = et === "ap" || et === "pe" ? '<div class="form-actions gp-rel-btn"><button class="btn btn-small btn-termo" data-relpdf="' + et + '">Relatório de andamento do ' + esc(ETAPAS[et].nome) + ' (PDF)</button><span class="hint">Para o cliente ou para reuniões internas: números e gráficos da fase.</span></div>' : "";
    return tabs + tool + cabecalhoEtapa(g, et) + grupos(et, g).map(function (gr) { return grupoHtml(g, et, gr, cod); }).join("") + rel;
  }
  function grupoHtml(g, et, gr, cod, extraBtn) {
    var todos = ordenar(itensDe(g, et).filter(function (x) { return x.grupo === gr.k; }));
    var vis = S.pendentes ? todos.filter(function (x) { return !feito(x); }) : todos;
    var add = S.addGrupo === et + "|" + gr.k ? '<form class="pr-add" data-addg="' + gr.k + '" data-adde="' + et + '"><input id="gp-add-in" placeholder="' + (extraBtn ? "Nome do móvel (ex.: Armário da cozinha)" : "Nome do item") + '" aria-label="Nome do novo item">' + (extraBtn ? '<label class="gp-check"><input type="checkbox" id="gp-add-mod" checked> É um móvel: entra no EP e no Executivo, cada um com o seu modelo</label>' : "") + '<button class="btn btn-small btn-primary">Adicionar</button><button type="button" class="btn btn-small" data-addcancel="1">Cancelar</button></form>' : '<button class="gp-add-btn" data-addopen="' + gr.k + '" data-adde="' + et + '">' + (extraBtn || "+ Adicionar item") + "</button>";
    return '<div class="gp-serie"><div class="gp-serie-h"><b>' + esc(gr.n) + '</b><span class="hint">' + prontos(todos) + "/" + todos.length + ' prontos</span><span class="mini gp-gprog"><i style="width:' + (todos.length ? Math.round(prontos(todos) / todos.length * 100) : 0) + '%"></i></span></div>' +
      vis.map(function (x) { return linhaItem(x, cod[x.id], todos); }).join("") + add + "</div>";
  }
  function planoMarcenaria(g, cod) {
    if (!marcAtiva(g)) {
      if (S.modal !== "marc-ativar") return '<div class="card gp-box gp-marc-off"><h3 class="panel-title">Marcenaria (Interiores)</h3><p>Serviço contratado à parte, junto com a arquitetura ou depois. Fica dentro deste projeto, com duas etapas: <b>Estudo Preliminar</b> (em paralelo à arquitetura) e <b>Executivo</b> (depois do Executivo arquitetônico e do EP da marcenaria aprovado).</p><div class="form-actions"><button class="btn btn-go" data-act="marc-form">✓ Marcenaria contratada</button></div></div>';
      return '<form class="card gp-box grid-form" id="marc-form"><h3 class="panel-title col-12">Ativar a marcenaria</h3>' +
        '<div class="field col-4"><label for="mc-num">Nº do contrato</label><input id="mc-num"></div><div class="field col-4"><label for="mc-data">Data do contrato</label><input type="date" id="mc-data" value="' + hojeIso() + '"></div>' +
        '<div class="field col-4" style="align-self:end"><label class="gp-check"><input type="checkbox" id="mc-parc"> 1ª parcela paga</label></div>' +
        '<div class="field col-4"><label for="mc-pep">Prazo do EP (dias úteis)</label><input type="number" id="mc-pep" min="1" value="' + (prazoPadrao("mep") || "") + '"></div><div class="field col-4"><label for="mc-pex">Prazo do Executivo (dias úteis)</label><input type="number" id="mc-pex" min="1" value="' + (prazoPadrao("mex") || "") + '"></div>' +
        '<div class="field col-4"><label for="mc-ini">Início do EP (se já começou)</label><input type="date" id="mc-ini"></div>' +
        '<div class="col-12 hint">Os móveis não são gerados sozinhos: vocês lançam cada um (com o modelo de desenhos e checklist). Prazos vêm do padrão de Configurações e podem ser ajustados agora ou depois em Configurações do projeto.</div>' +
        '<div class="col-12 form-actions"><button class="btn btn-go">Ativar marcenaria</button><button type="button" class="btn" data-act="marc-cancel">Cancelar</button></div></form>';
    }
    var m = g.marc;
    var head = '<div class="section-head gp-tool"><div class="section-meta">Contrato ' + esc(m.contrato && m.contrato.numero || "s/ nº") + (m.contrato && m.contrato.data ? " de " + T.fmtYmd(m.contrato.data) : "") + " · prazos: EP " + (prazoEtapa(g, "mep") || "—") + " d.u., Executivo " + (prazoEtapa(g, "mex") || "—") + ' d.u. (Configurações do projeto)</div><button class="link" data-act="modelo">' + (S.editModelo ? "Fechar modelo de móvel" : "Modelo de móvel") + "</button></div>";
    return head + (S.editModelo ? editorModelo() : "") + cabecalhoEtapa(g, "mep") + grupoHtml(g, "mep", grupos("mep")[0], cod, "+ Adicionar móvel / item") + cabecalhoEtapa(g, "mex") + grupoHtml(g, "mex", grupos("mex")[0], cod, "+ Adicionar móvel / item") +
      '<div class="form-actions gp-rel-btn"><button class="btn btn-small btn-termo" data-relpdf="mex">Relatório de andamento do Executivo da marcenaria (PDF)</button><span class="hint">Conta só o Executivo da marcenaria.</span></div>';
  }
  function linhasModelo(md) { return (md.desenhos || []).map(function (d) { var ck = d.checklist && d.checklist.length ? d.checklist : []; return d.nome + (ck.length ? ": " + ck.join("; ") : ""); }).join("\n"); }
  function lerModelo(txt, ckComum, guia) {
    var ds = txt.split("\n").map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) { var k = l.indexOf(":"); return k > 0 ? { nome: l.slice(0, k).trim(), checklist: l.slice(k + 1).split(";").map(function (c) { return c.trim(); }).filter(Boolean) } : { nome: l, checklist: [] }; });
    return { guia: guia || "", desenhos: ds, checklist: ckComum || [] };
  }
  function editorModelo() {
    var mp = modelo("mep"), mx = modelo("mex");
    return '<form class="card gp-box grid-form" id="modelo-form"><h3 class="panel-title col-12">Modelos de móvel (série 900)</h3><p class="hint col-12">Valem para os próximos móveis, em todos os projetos; os móveis já lançados não mudam. Um desenho por linha. Para o checklist de um desenho, use dois-pontos e ponto e vírgula: <i>Planta baixa: cotas gerais; níveis; materiais</i>. Também dá para salvar um móvel já configurado como modelo (botão dentro do móvel).</p>' +
      '<div class="field col-6"><label for="md-mep">Estudo Preliminar da marcenaria</label><textarea id="md-mep" rows="7">' + esc(linhasModelo(mp)) + "</textarea></div>" +
      '<div class="field col-6"><label for="md-des">Executivo da marcenaria</label><textarea id="md-des" rows="7">' + esc(linhasModelo(mx)) + "</textarea></div>" +
      '<div class="field col-6"><label for="md-ck">Checklist comum do Executivo (desenhos sem checklist próprio; um por linha)</label><textarea id="md-ck" rows="5">' + esc((mx.checklist || []).join("\n")) + "</textarea></div>" +
      '<div class="field col-6"><label for="md-guia">Link do PDF "Como fazer marcenaria na Trilha"</label><input id="md-guia" value="' + esc(mx.guia || "") + '"></div>' +
      '<div class="col-12 form-actions"><button class="btn btn-primary" id="md-save">Salvar modelos</button></div></form>';
  }
  function linhaItem(x, codigo, irmaos) {
    var k = irmaos.indexOf(x), open = !!S.open[x.id], atras = x.prazo && x.prazo < hojeIso() && !feito(x);
    var row = '<div class="it-row' + (x.prio ? " prio-" + x.prio : "") + (open ? " open" : "") + (feito(x) ? " is-done" : "") + '">' +
      '<span class="it-cod num">' + esc(codigo || "·") + "</span>" +
      '<button class="it-tit" data-itopen="' + x.id + '"><span class="car">' + (open ? "▾" : "▸") + '</span><span class="it-nome">' + esc(x.titulo) + "</span>" + (x.rev ? ' <em class="pr-et">' + esc(x.rev) + "</em>" : "") + desenhosProg(x) + "</button>" +
      '<span class="it-ctl"><label class="it-date' + (atras ? " late" : "") + (x.prazo ? "" : " empty") + '" title="Prazo"><span>' + (x.prazo ? fmtDataCurta(x.prazo) : "prazo") + '</span><input type="date" data-iprazo="' + x.id + '" value="' + (x.prazo || "") + '" aria-label="Prazo"></label>' +
      '<select class="pr-resp" data-iresp="' + x.id + '" aria-label="Responsável">' + optPessoas(x.resp, "—") + "</select>" +
      sitSel(x, "data-isit") + prioSel(x, "data-iprio") +
      '<span class="pr-act"><button class="link" data-imove="' + x.id + '" data-dir="-1"' + (k === 0 ? " disabled" : "") + ' aria-label="Subir">↑</button><button class="link" data-imove="' + x.id + '" data-dir="1"' + (k === irmaos.length - 1 ? " disabled" : "") + ' aria-label="Descer">↓</button><button class="link danger" data-idel="' + x.id + '" aria-label="Remover">✕</button></span></span></div>';
    if (!open) return row;
    return row + corpoItem(S.projId, x, { plano: true });
  }
  // Corpo do item: desenhos/subitens (renomear, reordenar, concluir) e checklists (marcar, renomear, reordenar).
  // Usado no Plano e na área da pessoa (Meu trabalho); data-pid diz a qual projeto as ações se referem.
  function corpoItem(pid, x, o) {
    o = o || {};
    var ds = x.desenhos || [];
    var d = ds.map(function (z, k) {
      var ck = z.checklist || [], okc = ck.filter(function (c) { return c.ok; }).length, od = !!S.openDes[z.id], ch = x.id + "|" + z.id;
      return '<div class="ds-row' + (z.feito ? " is-done" : "") + '"><input type="checkbox" data-dfeito="' + ch + '"' + (z.feito ? " checked" : "") + ' aria-label="Desenho concluído">' +
        '<input class="ds-in" data-dren="' + ch + '" value="' + esc(z.nome) + '" aria-label="Nome do desenho">' +
        '<button class="link ds-ckbtn" data-dopen="' + z.id + '">' + (ck.length ? "checklist " + okc + "/" + ck.length : "checklist") + (od ? " ▾" : " ▸") + "</button>" +
        (z.guia ? '<a class="link" href="' + esc(z.guia) + '" target="_blank" rel="noopener">Guia ↗</a>' : "") +
        '<span class="pr-act"><button class="link" data-dmove="' + ch + '|-1"' + (k === 0 ? " disabled" : "") + ' aria-label="Subir desenho">↑</button><button class="link" data-dmove="' + ch + '|1"' + (k === ds.length - 1 ? " disabled" : "") + ' aria-label="Descer desenho">↓</button><button class="link danger" data-ddel="' + ch + '" aria-label="Remover desenho">✕</button></span></div>' +
        (od ? '<div class="ds-ck">' + ck.map(function (c, i) {
          var ci = ch + "|" + i;
          return '<div class="ck-row"><input type="checkbox" data-ck="' + ci + '"' + (c.ok ? " checked" : "") + ' aria-label="Feito"><input class="ck-in" data-ckren="' + ci + '" value="' + esc(c.t) + '" aria-label="Item do checklist">' +
            '<span class="pr-act"><button class="link" data-ckmove="' + ci + '|-1"' + (i === 0 ? " disabled" : "") + ' aria-label="Subir">↑</button><button class="link" data-ckmove="' + ci + '|1"' + (i === ck.length - 1 ? " disabled" : "") + ' aria-label="Descer">↓</button><button class="link danger" data-ckdel="' + ci + '" aria-label="Remover item do checklist">✕</button></span></div>';
        }).join("") +
          '<form class="pr-add" data-ckadd="' + ch + '"><input placeholder="+ item do checklist" aria-label="Novo item do checklist"><button class="btn btn-small">Adicionar</button></form>' +
          (o.plano ? '<div class="gp-wait-form"><input class="gp-guia" data-guia="' + ch + '" value="' + esc(z.guia || "") + '" placeholder="Link do PDF-guia deste desenho (procedimento)" aria-label="Link do guia"></div>' : "") + "</div>" : "");
    }).join("");
    var mov = o.plano && x.movel && (x.etapa === "mep" || x.etapa === "mex") ? '<div class="form-actions it-mod"><button type="button" class="btn btn-small" data-modelomob="' + x.id + '">Usar este móvel como modelo dos outros móveis desta etapa</button><button type="button" class="btn btn-small" data-salvamod="' + x.id + '">Salvar como modelo de móvel (' + (x.etapa === "mep" ? "EP" : "Executivo") + ")</button></div>" : "";
    return '<div class="it-body" data-pid="' + esc(pid) + '">' + (o.plano ? '<div class="gp-wait-form"><input class="gp-guia" data-iren="' + x.id + '" value="' + esc(x.titulo) + '" aria-label="Nome do item"><span class="hint">Nome do item' + (x.movel && x.mob ? " (muda também no " + (x.etapa === "mep" ? "Executivo" : "EP") + ")" : "") + "</span></div>" : "") +
      '<div class="ds-list">' + (d || '<div class="hint">Nenhum desenho ou subitem.</div>') + "</div>" +
      '<form class="pr-add" data-dadd="' + x.id + '"><input placeholder="+ desenho / subitem" aria-label="Novo desenho"><button class="btn btn-small">Adicionar</button></form>' + mov + "</div>";
  }

  // ---------- Tarefas (moram na agenda de cada pessoa, com projetoId) ----------
  function abaTarefas(g) {
    if (!T.tarefas) return '<div class="empty">O módulo Tarefas não está disponível.</div>';
    var cod = codigos(g), itens = etapasPlano(g).reduce(function (a, e) { return a.concat(ordenar(itensDe(g, e))); }, []);
    var form = '<form class="card gp-box" id="gp-tf-form"><div class="section-head" style="margin:0"><h3 class="panel-title" style="margin:0">Nova tarefa do projeto</h3><div class="segmented" id="tf-tipo">' + TIPOS_TAREFA.map(function (t, k) { return '<button type="button" class="seg-pill' + (k === 0 ? " is-selected" : "") + '" data-tft="' + t[0] + '">' + t[1] + "</button>"; }).join("") + "</div></div>" +
      '<div class="grid-form"><div class="field col-12"><label for="tf-txt">Tarefa</label><input id="tf-txt" required placeholder="Ex.: ajustar layout da suíte após reunião"></div>' +
      '<div class="field col-4"><label for="tf-resp">Responsável</label><select id="tf-resp" required>' + optPessoas(T.state.pessoaId || (T.pessoasAtivas()[0] || {}).id) + "</select></div>" +
      '<div class="field col-4"><label for="tf-prazo" id="tf-prazo-l">Prazo</label><input type="date" id="tf-prazo"></div>' +
      '<div class="field col-4" id="tf-hora-w" hidden><label for="tf-hora">Horário</label><input type="time" id="tf-hora"></div>' +
      '<div class="field col-12"><label for="tf-it">Item do Plano de Projeto (opcional)</label><select id="tf-it"><option value="">Sem item</option>' + itens.map(function (x) { return '<option value="' + x.id + '">' + esc(ETAPAS[x.etapa].curto + " · " + (cod[x.id] ? cod[x.id] + " " : "") + x.titulo) + "</option>"; }).join("") + "</select></div>" +
      '<div class="col-12 form-actions"><button class="btn btn-primary">Adicionar tarefa</button><span class="hint">Vai para a aba Tarefas do responsável. Compromissos com data vão para a Agenda Google.</span></div></div></form>';
    var hoje = hojeIso(), lista = tarefasDoProjeto(S.projId), abertas = lista.filter(function (o) { return o.t.status !== "done"; }), feitas = lista.filter(function (o) { return o.t.status === "done"; });
    function card(o) {
      var t = o.t, done = t.status === "done", atras = !done && t.dueDate && t.dueDate < hoje, it = t.itemId ? T.byId(g.itens || [], t.itemId) : null;
      return '<div class="task gp-task' + (done ? " is-done" : "") + (t.subdivision === "prioridade" ? " prio" : "") + '"><div class="task-top"><input type="checkbox" class="task-check" data-tfdone="' + esc(o.pes) + "|" + t.id + '"' + (done ? " checked" : "") + ' aria-label="Concluir"><div class="task-main"><div class="task-title-row"><span class="task-title">' + esc(t.title) + '</span><button class="link danger" data-tfdel="' + esc(o.pes) + "|" + t.id + '" aria-label="Excluir tarefa">✕</button></div>' +
        '<div class="task-badges"><span class="badge static">' + esc((TIPOS_TAREFA.filter(function (x) { return x[0] === t.subdivision; })[0] || ["", "Tarefa"])[1]) + '</span><select class="pr-resp tf-mv" data-tfmv="' + esc(o.pes) + "|" + t.id + '" aria-label="Responsável">' + optPessoas(o.pes) + "</select>" +
        (t.dueDate ? '<span class="badge static' + (atras ? " is-overdue" : "") + '">' + T.fmtYmd(t.dueDate) + (t.dueTime ? " " + t.dueTime : "") + (atras ? " · atrasada" : "") + "</span>" : "") + (it ? '<span class="badge static">' + esc((cod[it.id] ? cod[it.id] + " · " : "") + it.titulo) + "</span>" : "") + "</div></div></div></div>";
    }
    return form + '<div class="section-head"><h3 class="tsec-title">A fazer · ' + abertas.length + '</h3></div><div class="task-list">' + (abertas.map(card).join("") || '<div class="empty">Nenhuma tarefa em aberto neste projeto.</div>') + "</div>" +
      (feitas.length ? '<details class="gp-group" style="margin-top:18px"><summary class="tsec-title">Concluídas · ' + feitas.length + '</summary><div class="task-list">' + feitas.map(card).join("") + "</div></details>" : "");
  }

  // ---------- Histórico (registro fiel: dia e hora; não se edita) ----------
  function abaHistorico(g, p) {
    var cod = codigos(g), linhas = [];
    (g.eventos || []).forEach(function (e) { linhas.push({ em: e.em || isoDeData(e.data), data: e.data, txt: e.txt, tipo: e.tipo || "evento", hora: !!e.em, por: e.por }); });
    (g.itens || []).forEach(function (x) { if (x.concluidoEm) linhas.push({ em: x.concluidoEm, data: T.ymd(new Date(x.concluidoEm)), txt: "Concluído: " + (cod[x.id] ? cod[x.id] + " · " : "") + x.titulo + " (" + ETAPAS[x.etapa].curto + ")" + (x.resp && T.pessoa(x.resp) ? " — " + T.pessoa(x.resp).nome : ""), tipo: "item", hora: true }); });
    linhas.sort(function (a, b) { return a.em < b.em ? 1 : -1; });
    var fmtEm = function (l) { var d = new Date(l.em); return T.fmtYmd(l.data || T.ymd(d)) + (l.hora ? " " + T.hm(d) : ""); };
    var lista = linhas.length ? '<ul class="gp-hist">' + linhas.map(function (l) { return '<li class="h-' + l.tipo + '"><span class="num">' + fmtEm(l) + "</span><div>" + esc(l.txt) + (l.por && T.pessoa(l.por) ? ' <small class="hint">· ' + esc(T.pessoa(l.por).nome) + "</small>" : "") + "</div></li>"; }).join("") + "</ul>" : '<div class="empty">Nada registrado ainda.</div>';
    // horas por item do Plano, por etapa e por pessoa (pelo cronômetro e pelas reuniões)
    var ls = lancDoProj(p.id), porItem = {}, porEt = {}, porPes = {}, semItem = 0, total = 0;
    ls.forEach(function (l) { total += l.min; if (l.pranchaId && T.byId(g.itens || [], l.pranchaId)) porItem[l.pranchaId] = (porItem[l.pranchaId] || 0) + l.min; else semItem += l.min; porEt[l.etapaId || "—"] = (porEt[l.etapaId || "—"] || 0) + l.min; porPes[l.pessoaId] = (porPes[l.pessoaId] || 0) + l.min; });
    var itemRows = Object.keys(porItem).map(function (id) { return T.byId(g.itens, id); }).sort(function (a, b) { return porItem[b.id] - porItem[a.id]; }).map(function (x) {
      return "<tr><td class=\"num\">" + esc(cod[x.id] || "") + '</td><td class="name">' + esc(x.titulo) + "</td><td>" + esc(ETAPAS[x.etapa].curto) + "</td><td>" + (x.concluidoEm ? T.fmtYmd(T.ymd(new Date(x.concluidoEm))) : '<span class="hint">em aberto</span>') + '</td><td class="num">' + T.fmtH(porItem[x.id]) + "</td></tr>";
    }).join("");
    var mini = function (obj, nome) { return Object.keys(obj).sort(function (a, b) { return obj[b] - obj[a]; }).map(function (k) { return '<div class="kv-row"><span>' + esc(nome(k)) + '</span><b class="num">' + T.fmtH(obj[k]) + "</b></div>"; }).join(""); };
    var horas = '<div class="card gp-box"><h3 class="panel-title">Horas do projeto · ' + T.fmtH(total) + "</h3>" +
      '<div class="gp-hist-cols"><div><div class="hint gp-cap">Por etapa</div>' + (mini(porEt, function (k) { return T.etapaNome(k) || "Sem etapa"; }) || '<p class="hint">Sem horas lançadas.</p>') + '</div><div><div class="hint gp-cap">Por pessoa</div>' + (mini(porPes, function (k) { var pe = T.pessoa(k); return pe ? pe.nome : "Pessoa removida"; }) || '<p class="hint">—</p>') + "</div></div>" +
      '<div class="hint gp-cap">Por item do Plano (cronômetro no item)</div>' + (itemRows ? '<div class="table-wrap as-list"><table><thead><tr><th>Cód.</th><th>Item</th><th>Etapa</th><th>Concluído</th><th>Horas</th></tr></thead><tbody>' + itemRows + "</tbody></table></div>" : '<p class="hint">Nenhuma hora lançada em itens ainda. Use ▶ Iniciar no item (área da pessoa › Projetos) ou escolha o item no cronômetro.</p>') +
      (semItem ? '<p class="hint">' + T.fmtH(semItem) + " sem item do Plano (reuniões, tarefas livres).</p>" : "") + "</div>";
    return '<p class="hint" style="margin:0 0 12px">Registro fiel do projeto, com dia e hora. Nada aqui é editado ou apagado: correções entram como novos registros. Análises e gráficos entre projetos ficam em Relatórios.</p>' + horas + '<div class="card gp-box"><h3 class="panel-title">Linha do tempo</h3>' + lista + "</div>";
  }

  // ---------- Programa ----------
  function abaPrograma(g, p) {
    var amb = g.ambientes || [], pavs = g.pavs || ["Térreo"], dim = (p.categorias || {}).dimensao || "confortavel", tot = 0, porSetor = {};
    amb.forEach(function (a) { var ar = (+a.area || 0) * (+a.qtd || 1); tot += ar; porSetor[a.setor] = (porSetor[a.setor] || 0) + ar; });
    var resumo = '<div class="card gp-strip">' + SETORES.filter(function (s) { return porSetor[s[0]]; }).map(function (s) { return "<div><small>" + s[1] + "</small><b>" + T.fmtNum(porSetor[s[0]]) + " m²</b></div>"; }).join("") +
      "<div><small>Total estimado</small><b>" + T.fmtNum(tot * 1.2) + " m²</b><span>" + T.fmtNum(tot) + " m² + 20% (circulação e paredes)</span></div></div>";
    var add = '<form class="pr-add" id="gp-amb-add"><select id="amb-tipo" aria-label="Tipo de ambiente">' + catalogo().map(function (t) { return '<option value="' + t.id + '">' + esc(t.n) + "</option>"; }).join("") + '</select><button class="btn btn-small">+ Ambiente</button><button type="button" class="btn btn-small" data-act="sync-plano">Atualizar o Plano pelo programa</button></form>';
    var html = SETORES.map(function (s) {
      var itens = amb.filter(function (a) { return a.setor === s[0]; }); if (!itens.length) return "";
      return '<div class="gp-serie"><div class="gp-serie-h"><b>' + s[1] + "</b></div>" + itens.map(function (a) {
        var t = tipoAmb(a.tipo), open = S.openAmb === a.id;
        return '<div class="amb' + (open ? " open" : "") + '"><button class="amb-row" data-amb="' + a.id + '"><span class="amb-n">' + esc(a.nome) + (a.qtd > 1 ? " ×" + a.qtd : "") + '</span><span class="amb-m">' + esc(a.pav || "—") + " · " + (a.area != null ? T.fmtNum(a.area) + " m²" : "área a definir") + (t.amp ? " · ampliação" : "") + '</span><span class="amb-c">' + esc(resumoConfig(a) || "Sem configuração") + "</span></button>" + (open ? editorAmb(a, t, pavs) : "") + "</div>";
      }).join("") + "</div>";
    }).join("") || '<div class="empty">Programa vazio. Adicione os ambientes do projeto.</div>';
    var pavForm = '<form class="card gp-box gp-pavs-box" id="gp-pavs-form"><div class="field"><label for="f-pavs">Pavimentos (um por linha, de baixo para cima)</label><textarea id="f-pavs" rows="' + Math.max(2, pavs.length) + '">' + esc((g.pavs || []).join("\n")) + '</textarea></div><div class="form-actions"><button class="btn btn-small btn-primary" id="f-pavs-save">Salvar pavimentos</button><span class="hint">O Plano acompanha: inclui, renomeia e (com confirmação) retira os itens de cada pavimento.</span></div></form>';
    return '<div class="section-head"><div class="section-meta">Dimensão: <b>' + esc((DIMENSAO.filter(function (d) { return d[0] === dim; })[0] || ["", "—"])[1]) + "</b> · clique num ambiente para editar área e configuração.</div></div>" + pavForm + resumo + add + html;
  }
  function resumoConfig(a) {
    var c = a.cfg || {};
    return camposDe(a).map(function (d) { var k = d.k, v = c[k]; if (v == null || v === "" || (Array.isArray(v) && !v.length) || v === false) return null; if (d.t === "bool") return d.l; if (Array.isArray(v)) return d.l + ": " + v.join(", "); return d.l + ": " + v; }).filter(Boolean).join(" · ");
  }
  function editorAmb(a, t, pavs) {
    var c = a.cfg || {};
    function addOpt(k) { return '<span class="amb-opt"><input data-optin="' + k + '" placeholder="+ outra opção" aria-label="Nova opção"><button type="button" class="btn btn-small" data-optadd="' + a.id + "|" + k + '">+</button></span>'; }
    var campos = camposDe(a).map(function (d) {
      var k = d.k, v = c[k], id = "ac-" + k;
      if (d.t === "bool") return '<label class="gp-check col-4"><input type="checkbox" data-cfg="' + k + '"' + (v ? " checked" : "") + "> " + esc(d.l) + "</label>";
      if (d.t === "multi") return '<div class="field col-12"><span class="label">' + esc(d.l) + '</span><div class="gp-multi">' + (d.o || []).map(function (o) { return '<label class="gp-check"><input type="checkbox" data-cfgm="' + k + '" value="' + esc(o) + '"' + ((v || []).indexOf(o) >= 0 ? " checked" : "") + "> " + esc(o) + "</label>"; }).join("") + addOpt(k) + "</div></div>";
      if (d.t === "sel") return '<div class="field col-4"><label for="' + id + '">' + esc(d.l) + '</label><select id="' + id + '" data-cfg="' + k + '"><option value="">—</option>' + (d.o || []).map(function (o) { return "<option" + (v === o ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("") + "</select>" + addOpt(k) + "</div>";
      if (d.t === "num") return '<div class="field col-3"><label for="' + id + '">' + esc(d.l) + '</label><input type="number" min="0" id="' + id + '" data-cfg="' + k + '" value="' + (v != null ? v : "") + '"></div>';
      return '<div class="field col-6"><label for="' + id + '">' + esc(d.l) + '</label><input id="' + id + '" data-cfg="' + k + '" value="' + esc(v || "") + '"></div>';
    }).join("");
    var novaPerg = '<div class="field col-12"><span class="label">+ Outra pergunta para este ambiente</span><div class="amb-extra"><input data-npq="l" placeholder="Pergunta (ex.: Coifa de ilha)" aria-label="Pergunta"><select data-npq="t" aria-label="Tipo de resposta">' + T.optHtml([["bool", "Sim / não"], ["sel", "Uma opção"], ["multi", "Várias opções"], ["num", "Número"], ["txt", "Texto"]], "bool") + '</select><input data-npq="o" placeholder="Opções separadas por vírgula" aria-label="Opções"><button type="button" class="btn btn-small" data-npqadd="' + a.id + '">Incluir pergunta</button></div></div>';
    var padrao = T.byId(catalogo(), a.tipo), difere = a.campos && padrao && JSON.stringify(a.campos) !== JSON.stringify(padrao.campos);
    return '<div class="amb-ed grid-form" data-ambed="' + a.id + '"><div class="field col-4"><label for="ae-nome">Nome</label><input id="ae-nome" data-af="nome" value="' + esc(a.nome) + '"></div>' +
      '<div class="field col-3"><label for="ae-pav">Pavimento</label><select id="ae-pav" data-af="pav"><option value="">—</option>' + pavs.map(function (p) { return "<option" + (a.pav === p ? " selected" : "") + ">" + esc(p) + "</option>"; }).join("") + "</select></div>" +
      '<div class="field col-2"><label for="ae-qtd">Qtd.</label><input id="ae-qtd" type="number" min="1" data-af="qtd" value="' + (a.qtd || 1) + '"></div>' +
      '<div class="field col-3"><label for="ae-area">Área (m²)</label><input id="ae-area" type="number" min="0" step="0.5" data-af="area" value="' + (a.area != null ? a.area : "") + '"></div>' + campos + novaPerg +
      '<div class="field col-12"><label for="ae-obs">Pedido do cliente / observações</label><textarea id="ae-obs" rows="2" data-af="obs">' + esc(a.obs || "") + "</textarea></div>" +
      '<div class="col-12 form-actions"><button class="btn btn-small btn-primary" data-ambsave="' + a.id + '">Salvar ambiente</button>' +
      (a.tipo === "outro" ? '<button type="button" class="btn btn-small" data-ambpad="' + a.id + '">Criar ambiente padrão com este</button>' : difere ? '<button type="button" class="btn btn-small" data-ambpad="' + a.id + '">Salvar perguntas no padrão da Trilha</button>' : "") +
      '<button class="link danger" data-ambdel="' + a.id + '">Remover ambiente</button></div>' +
      (difere || a.tipo === "outro" ? '<p class="hint col-12">' + (a.tipo === "outro" ? "Ambiente fora do padrão: depois de configurado, pode virar um ambiente padrão da Trilha." : "Este ambiente tem perguntas ou opções a mais que o padrão da Trilha. Salvando no padrão, os próximos projetos já nascem com elas.") + "</p>" : "") + "</div>";
  }
  // Lê o editor aberto para o ambiente (valores ainda não salvos não se perdem ao incluir opção ou pergunta).
  function lerEditorAmb(a, ed) {
    T.each("[data-af]", function (i) { var k = i.dataset.af; a[k] = k === "qtd" ? Math.max(1, +i.value || 1) : k === "area" ? T.numOrNull(i.value) : i.value; }, ed);
    a.pav = a.pav || null; a.cfg = a.cfg || {};
    T.each("[data-cfg]", function (i) { var d = campoDef(a, i.dataset.cfg); a.cfg[i.dataset.cfg] = d.t === "bool" ? i.checked : d.t === "num" ? T.numOrNull(i.value) : i.value; }, ed);
    var multi = {}; T.each("[data-cfgm]", function (i) { multi[i.dataset.cfgm] = multi[i.dataset.cfgm] || []; if (i.checked) multi[i.dataset.cfgm].push(i.value); }, ed);
    Object.keys(multi).forEach(function (k) { a.cfg[k] = multi[k]; });
  }
  function mudarAmb(id, fn) {
    var ed = document.querySelector('[data-ambed="' + id + '"]');
    S.sujo = null;
    return salvar(S.projId, function (x) { var a = T.byId(x.ambientes, id); if (!a) return; if (ed) lerEditorAmb(a, ed); a.campos = T.clone(camposDe(a)); fn(a); });
  }
  function addOpcao(id, k) {
    var inp = document.querySelector('[data-ambed="' + id + '"] [data-optin="' + k + '"]'), v = inp && inp.value.trim(); if (!v) return;
    mudarAmb(id, function (a) { var d = a.campos.filter(function (c) { return c.k === k; })[0]; if (d && (d.o || []).indexOf(v) < 0) d.o = (d.o || []).concat([v]); });
  }
  function addPergunta(id) {
    var ed = document.querySelector('[data-ambed="' + id + '"]'), l = ed.querySelector('[data-npq="l"]').value.trim(), t = ed.querySelector('[data-npq="t"]').value, o = ed.querySelector('[data-npq="o"]').value.split(",").map(function (x) { return x.trim(); }).filter(Boolean);
    if (!l) { T.toast("Escreva a pergunta."); return; }
    if ((t === "sel" || t === "multi") && !o.length) { T.toast("Informe as opções, separadas por vírgula."); return; }
    mudarAmb(id, function (a) { var k = T.slug(l).replace(/-/g, "_"); while (a.campos.some(function (c) { return c.k === k; })) k += "_2"; a.campos.push({ k: k, l: l, t: t, o: t === "sel" || t === "multi" ? o : null }); });
  }
  // Leva as perguntas do ambiente para o padrão da Trilha (ou cria um ambiente padrão novo a partir de "Outro ambiente").
  async function ambienteParaPadrao(id) {
    var g = G(S.projId), a = T.byId(g.ambientes || [], id); if (!a) return;
    var cat = T.clone(catalogo()), novo = a.tipo === "outro", alvo = novo ? null : T.byId(cat, a.tipo);
    var campos = T.clone(camposDe(a));
    if (!(await T.confirmar({ titulo: novo ? "Criar ambiente padrão?" : "Salvar no padrão da Trilha?", texto: novo ? "<b>" + esc(a.nome) + "</b> passa a ser um ambiente padrão, com " + campos.length + " pergunta(s), para todos os próximos projetos." : "As perguntas e opções deste ambiente passam a valer para <b>" + esc(alvo.n) + "</b> em todos os próximos projetos. Os projetos existentes não mudam.", ok: novo ? "Criar ambiente padrão" : "Salvar no padrão" }))) return;
    if (novo) { var nid = T.slug(a.nome).replace(/-/g, "_"); while (T.byId(cat, nid)) nid += "_2"; cat.splice(cat.length - 1, 0, { id: nid, n: a.nome, s: a.setor || "social", a: a.area, amp: 0, banc: 0, campos: campos }); }
    else { alvo.campos = campos; }
    S.cfg = Object.assign({}, S.cfg || {}, { ambientes: cat });
    try {
      await T.db.doc("gp_config/geral").set(S.cfg);
      if (novo) await salvar(S.projId, function (x) { var a2 = T.byId(x.ambientes, id); if (a2) { a2.tipo = cat.filter(function (c) { return c.n === a.nome; })[0].id; delete a2.campos; } });
      else await salvar(S.projId, function (x) { var a2 = T.byId(x.ambientes, id); if (a2) delete a2.campos; });
      T.toast(novo ? "Ambiente padrão criado ✓" : "Padrão da Trilha atualizado ✓");
    } catch (e) { T.showError(e); }
  }

  // ---------- Informações (consulta de todos) ----------
  // Dados de cadastro (nome, clientes, contrato) só para leitura: alteram-se em Cadastros › Projetos.
  function abaInfo(g, p) {
    var cat = p.categorias || {}, dir = g.diretrizes || {}, ct = p.contrato || {}, mc = g.marc && g.marc.contrato || {};
    function sel(id, opts, v) { return '<select id="' + id + '">' + T.optHtml([["", "—"]].concat(opts), v || "") + "</select>"; }
    function ta(k, l) { return '<div class="field col-6"><label for="fd-' + k + '">' + l + '</label><textarea id="fd-' + k + '" rows="3">' + esc(dir[k] || "") + "</textarea></div>"; }
    function sec(t, corpo, extra) { return '<section class="ficha-sec"><div class="ficha-h-row"><h3 class="ficha-h">' + t + "</h3>" + (extra || "") + '</div><div class="grid-form">' + corpo + "</div></section>"; }
    function kv(l, v) { return '<div class="info-kv col-4"><small>' + l + "</small><b>" + (v ? esc(v) : '<span class="muted">—</span>') + "</b></div>"; }
    var cls = clientes(p);
    var cli = cls.length ? cls.map(function (c) { return '<div class="info-cli"><b>' + esc(c.nome) + "</b>" + [c.contato, c.email].filter(Boolean).map(function (x) { return '<span class="hint">' + esc(x) + "</span>"; }).join("") + "</div>"; }).join("") : '<span class="hint">' + esc(p.cliente || "Nenhum cliente vinculado.") + "</span>";
    return '<form id="gp-info" class="ficha">' +
      sec("Projeto", kv("Nome", p.nome) + kv("Código", p.codigo) + kv("Tipo", (SIGLAS.filter(function (x) { return x[0] === g.sigla; })[0] || ["", g.sigla])[1]) +
        '<div class="info-kv col-12"><small>Clientes</small><div class="info-clis">' + cli + "</div></div>" + kv("Endereço da obra", p.endereco) +
        kv("Contrato", ct.numero ? "nº " + ct.numero + (ct.data ? " de " + T.fmtYmd(ct.data) : "") : "") + kv("Cidade (termos)", ct.cidade) +
        (marcAtiva(g) ? kv("Contrato da marcenaria", mc.numero || mc.data ? "nº " + (mc.numero || "s/ nº") + (mc.data ? " de " + T.fmtYmd(mc.data) : "") : "") + kv("Valor da marcenaria", g.marc.valor != null ? T.fmtBRL(g.marc.valor) : "") : ""),
        '<button type="button" class="btn btn-small" data-act="cad-edit">Editar em Cadastros</button>') +
      sec("Descrição do projeto", '<div class="field col-12"><label for="f-desc">O que o cliente trouxe e o que a Trilha observou da casa e do terreno</label><textarea id="f-desc" rows="6">' + esc(g.descricao || "") + "</textarea></div>") +
      sec("Categorias", '<div class="field col-4"><label for="f-pad">Padrão</label>' + sel("f-pad", PADRAO, cat.padrao) + "</div>" +
        '<div class="field col-4"><label for="f-dim">Dimensão</label>' + sel("f-dim", DIMENSAO, cat.dimensao) + "</div>" +
        '<div class="field col-4"><label for="f-dif">Dificuldade do terreno</label>' + sel("f-dif", DIFICULDADE, cat.dificuldade) + "</div>") +
      sec("Diretrizes do briefing", ta("uso", "Uso, moradores e pets, acessibilidade") + ta("expectativas", "Expectativas do cliente") + ta("estetica", "Estética e materiais") + ta("relacao", "Relação com exterior, paisagismo e rua") + ta("sistemas", "Sistemas (solar, reúso, ar, aquecimento, automação)") + ta("execucao", "Sistema construtivo e execução da obra")) +
      sec("Links", '<div class="field col-6"><label for="f-pasta">Pasta do projeto</label><input id="f-pasta" value="' + esc(g.pasta || "") + '"></div><div class="field col-6"><label for="f-bimx">BIMx</label><input id="f-bimx" value="' + esc(g.bimx || "") + '"></div>') +
      '<div class="form-actions ficha-save"><button class="btn btn-primary" id="f-save">Salvar informações</button></div></form>';
  }
  async function salvarInfo() {
    var pid = S.projId, dir = {};
    ["uso", "expectativas", "estetica", "relacao", "sistemas", "execucao"].forEach(function (k) { dir[k] = $("fd-" + k).value.trim(); });
    var cat = { padrao: $("f-pad").value || null, dimensao: $("f-dim").value || null, dificuldade: $("f-dif").value || null }, desc = $("f-desc").value.trim(), pasta = $("f-pasta").value.trim(), bimx = $("f-bimx").value.trim();
    S.sujo = null;
    var ok = await T.saveWith($("f-save"), async function () {
      await T.db.doc("projetos/" + pid).update({ categorias: cat });
      await salvar(pid, function (x) { x.diretrizes = dir; x.descricao = desc; x.pasta = pasta; x.bimx = bimx; });
    });
    if (ok) T.toast("Informações salvas ✓");
  }

  // ---------- Configurações do projeto (datas, prazos, Projeto Legal; futuramente restrita) ----------
  function abaConfig(g, p) {
    function sec(t, corpo) { return '<section class="ficha-sec"><h3 class="ficha-h">' + t + '</h3><div class="grid-form">' + corpo + "</div></section>"; }
    var ets = etapasPlano(g).filter(function (e) { return e !== "pl" && (!ETAPAS[e].marc || marcAtiva(g)); });
    var datas = ets.map(function (e) {
      var info = (g.etapas || {})[e] || {}, atual = e === g.etapa || (g.marc && g.marc.etapa === e);
      return '<div class="ficha-et"><b>' + esc(ETAPAS[e].curto) + '</b><label>Início<input type="date" data-fet="' + e + '|inicio" value="' + (info.inicio ? T.ymd(new Date(info.inicio)) : "") + '"></label><label>Fim / termo<input type="date" data-fet="' + e + '|fim" value="' + (info.fim ? T.ymd(new Date(info.fim)) : "") + '"' + (atual ? ' disabled title="Etapa em curso: o fim é registrado pelo botão do termo assinado, na Visão geral. Depois de encerrada, a data pode ser corrigida aqui."' : "") + '></label>' +
        (ETAPAS[e].prazo ? '<label>Prazo (d.u.)<input type="number" min="1" data-fet="' + e + '|prazo" value="' + (prazoEtapa(g, e) || "") + '" placeholder="' + (prazoPadrao(e) || "") + '"></label>' : "<span></span>") + "</div>";
    }).join("");
    var legDatas = orgaosLegal(g).map(function (o) { var l = legalDe(g, o); return '<div class="ficha-et"><b>' + esc(ORGAOS[o].curto) + '</b><label>Desenvolvimento (d.u.)<input type="number" min="1" data-legpz="' + o + '|prazoDev" value="' + (l.prazoDev || prazoPadrao("plDev")) + '"></label><label>Atender exigência (d.u.)<input type="number" min="1" data-legpz="' + o + '|prazoExig" value="' + (l.prazoExig || prazoPadrao("plExig")) + '"></label><span></span></div>'; }).join("");
    var legal = doZero(g.sigla) ? '<div class="field col-4"><label for="c-temleg">Projeto Legal</label><select id="c-temleg">' + T.optHtml([["sim", "Tem Projeto Legal (prefeitura)"], ["nao", "Não se aplica"]], temLegal(g) ? "sim" : "nao") + '</select></div><div class="col-8" style="align-self:end"><label class="gp-check"><input type="checkbox" id="c-cond"' + (g.leg && g.leg.cond ? " checked" : "") + (temLegal(g) ? "" : " disabled") + '> Este projeto também tem projeto de condomínio</label></div>' : '<p class="hint col-12">Reforma e Interiores não têm Projeto Legal.</p>';
    return '<form id="gp-cfg" class="ficha"><p class="hint">Mudanças aqui afetam prazos e avisos: o app pede confirmação mostrando o que muda, e tudo fica no Histórico.</p>' +
      sec("Datas e prazos das etapas", '<div class="col-12 ficha-ets">' + datas + legDatas + '</div><p class="hint col-12">Prazo em dias úteis a partir do início; pausa quando a trilha aguarda alguém de fora ou está em pausa interna. Campo vazio = prazo padrão de Configurações (' + ets.filter(function (e) { return ETAPAS[e].prazo; }).map(function (e) { return ETAPAS[e].curto + " " + prazoPadrao(e); }).join(", ") + " d.u.).</p>") +
      sec("Projeto Legal", legal) +
      sec("Tipo do projeto", '<div class="field col-4"><label for="c-sig">Tipo</label><select id="c-sig">' + T.optHtml(SIGLAS.map(function (x) { return [x[0], x[0] + " · " + x[1]]; }), g.sigla) + '</select></div><p class="hint col-8" style="align-self:end">Reforma e Interiores pulam Anteprojeto e Projeto Legal.</p>') +
      '<div class="form-actions ficha-save"><button class="btn btn-primary" id="c-save">Salvar configurações</button></div></form>';
  }
  async function salvarConfig() {
    var pid = S.projId, g0 = G(pid), mud = [], datas = {}, legpz = {};
    T.each("[data-fet]", function (i) { var a = split(i.dataset.fet); datas[a[0]] = datas[a[0]] || {}; datas[a[0]][a[1]] = i.value; });
    T.each("[data-legpz]", function (i) { var a = split(i.dataset.legpz); legpz[a[0]] = legpz[a[0]] || {}; legpz[a[0]][a[1]] = T.numOrNull(i.value); });
    var temLeg = $("c-temleg") ? $("c-temleg").value === "sim" : temLegal(g0), cond = $("c-cond") ? $("c-cond").checked && temLeg : !!(g0.leg && g0.leg.cond), sig = $("c-sig").value;
    Object.keys(datas).forEach(function (e) {
      var d = datas[e], cur = (g0.etapas || {})[e] || {};
      if ((cur.inicio ? T.ymd(new Date(cur.inicio)) : "") !== (d.inicio || "")) mud.push(ETAPAS[e].curto + " · início: " + (cur.inicio ? T.fmtYmd(T.ymd(new Date(cur.inicio))) : "—") + " → " + (d.inicio ? T.fmtYmd(d.inicio) : "—"));
      if (d.fim !== undefined && (cur.fim ? T.ymd(new Date(cur.fim)) : "") !== (d.fim || "") && !(e === g0.etapa || (g0.marc && g0.marc.etapa === e))) mud.push(ETAPAS[e].curto + " · fim: " + (cur.fim ? T.fmtYmd(T.ymd(new Date(cur.fim))) : "—") + " → " + (d.fim ? T.fmtYmd(d.fim) : "—"));
      if (d.prazo !== undefined) { var nv = T.numOrNull(d.prazo) || prazoPadrao(e), at = prazoEtapa(g0, e); if (nv !== at) mud.push(ETAPAS[e].curto + " · prazo: " + at + " → " + nv + " d.u."); }
    });
    Object.keys(legpz).forEach(function (o) { var l = legalDe(g0, o); [["prazoDev", "desenvolvimento", "plDev"], ["prazoExig", "exigência", "plExig"]].forEach(function (k) { var at = l[k[0]] || prazoPadrao(k[2]), nv = legpz[o][k[0]] || prazoPadrao(k[2]); if (at !== nv) mud.push(ORGAOS[o].curto + " · prazo de " + k[1] + ": " + at + " → " + nv + " d.u."); }); });
    if (temLeg !== temLegal(g0) && doZero(g0.sigla)) mud.push("Projeto Legal: " + (temLeg ? "passa a ter" : "não se aplica (itens não iniciados saem do Plano)"));
    if (cond !== !!(g0.leg && g0.leg.cond)) mud.push("Projeto de condomínio: " + (cond ? "incluído (quadro na Visão geral e grupo no Plano)" : "retirado (itens não iniciados saem do Plano)"));
    if (sig !== g0.sigla) mud.push("Tipo: " + g0.sigla + " → " + sig);
    if (!mud.length) { T.toast("Nada mudou."); return; }
    if (!(await T.confirmar({ titulo: "Confirmar as mudanças?", texto: "<ul class=\"cf-list\">" + mud.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + "</ul>Ficam registradas no Histórico.", ok: "Salvar mudanças" }))) return;
    S.sujo = null;
    var ok = await T.saveWith($("c-save"), async function () {
      if (sig !== g0.sigla) await T.db.doc("projetos/" + pid).update({ sigla: sig, tipo: TIPO_ANTIGO[sig] });
      await salvar(pid, function (x) {
        x.etapas = x.etapas || {}; x.sigla = sig;
        Object.keys(datas).forEach(function (e) {
          var d = datas[e], cur = x.etapas[e] = x.etapas[e] || {}, atual = e === x.etapa || (x.marc && x.marc.etapa === e);
          if ((cur.inicio ? T.ymd(new Date(cur.inicio)) : "") !== (d.inicio || "")) cur.inicio = d.inicio ? isoDeData(d.inicio) : null;
          if (d.fim !== undefined && !atual && (cur.fim ? T.ymd(new Date(cur.fim)) : "") !== (d.fim || "")) { cur.fim = d.fim ? isoDeData(d.fim) : null; cur.termoEm = ETAPAS[e].termo ? d.fim || null : null; }
          // prazo fica guardado no projeto (um lugar só, inclusive para a marcenaria); vazio = padrão de Configurações
          if (d.prazo !== undefined) { cur.prazo = T.numOrNull(d.prazo) || null; if (x.marc && x.marc.prazos) delete x.marc.prazos[e]; }
        });
        Object.keys(legpz).forEach(function (o) { x.leg = x.leg || {}; var l = x.leg[o] = T.clone(legalDe(x, o)); l.prazoDev = legpz[o].prazoDev || null; l.prazoExig = legpz[o].prazoExig || null; });
        if (doZero(sig)) {
          if (!temLeg && temLegal(x)) { x.legal = "nao_se_aplica"; x.itens = x.itens.filter(function (it) { return !(it.etapa === "pl" && !iniciado(it)); }); }
          if (temLeg && !temLegal(x)) { x.legal = "nao_iniciado"; x.leg = x.leg || {}; x.leg.pref = x.leg.pref || { sit: "nao_iniciado", hist: [] }; if (!itensDe(x, "pl").some(function (it) { return it.grupo === "pl-pref"; })) x.itens = x.itens.concat(itensLegal("pref", x.pavs)); }
          if (temLeg) {
            x.leg = x.leg || {}; if (!x.leg.pref) x.leg.pref = legalDe(x, "pref");
            if (cond && !x.leg.cond) { x.leg.cond = { sit: "nao_iniciado", hist: [] }; if (!itensDe(x, "pl").some(function (it) { return it.grupo === "pl-cond"; })) x.itens = x.itens.concat(itensLegal("cond", x.pavs)); }
            if (!cond && x.leg.cond) { delete x.leg.cond; x.itens = x.itens.filter(function (it) { return !(it.grupo === "pl-cond" && !iniciado(it)); }); }
            x.legal = resumoLegal(x);
          }
        }
        evento(x, "Configurações do projeto alteradas: " + mud.join("; "), hojeIso(), { tipo: "etapa" });
      });
    });
    if (ok) T.toast("Configurações salvas ✓");
  }
  // Pavimentos (aba Programa): o Plano acompanha (inclui, renomeia e, com confirmação, retira itens não iniciados).
  async function salvarPavs() {
    var pid = S.projId, g0 = G(pid), pavs = $("f-pavs").value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
    if (!pavs.length) { T.toast("Informe ao menos um pavimento."); return; }
    if (JSON.stringify(pavs) === JSON.stringify(g0.pavs || [])) { T.toast("Nada mudou."); return; }
    var mud = mudancaPavs(g0, g0.pavs || [], pavs);
    if (mud.remover.length && !(await T.confirmar({ titulo: "Retirar pavimento?", texto: "Sai(em) do Plano " + mud.remover.length + " item(ns) ainda não iniciado(s) de <b>" + esc(mud.saem.join(", ")) + "</b>." + (mud.ficam ? " " + mud.ficam + " item(ns) já iniciado(s) ou pronto(s) continuam no Plano." : "") + " Não dá para desfazer.", ok: "Salvar e retirar", perigo: true }))) return;
    S.sujo = null;
    var ok = await T.saveWith($("f-pavs-save"), function () { return salvar(pid, function (x) { aplicarPavs(x, x.pavs || [], pavs); }); });
    if (ok) T.toast("Pavimentos salvos ✓");
  }

  // ---------- termos em PDF ----------
  function contratoDe(g, p, etapa) { if (ETAPAS[etapa] && ETAPAS[etapa].marc) return (g.marc && g.marc.contrato) || {}; return p.contrato || {}; }
  function modalTermo(tipo) {
    var g = G(S.projId), p = proj(S.projId), et = tipo === "ciencia" ? g.etapa : tipo, info = ETAPAS[et] || {};
    var titulo = tipo === "ciencia" ? "Termo de Ciência de Antecipação" : info.termo === "projeto" ? "Termo de Encerramento de Projeto" : "Termo de Encerramento de Etapa";
    var anot = tipo === "ciencia" || info.termo === "etapa", ct = contratoDe(g, p, et), falta = [];
    if (!ct.numero) falta.push("nº do contrato"); if (!clientes(p).length) falta.push("clientes cadastrados");
    var prox = tipo === "ciencia" ? proxEtapa(g) : "";
    return '<h2 class="section-title">' + esc(titulo) + '</h2><form class="grid-form" id="termo-form" data-tipo="' + tipo + '"><p class="hint col-12">' + esc(p.nome) + (tipo === "ciencia" ? "" : " · " + esc(info.nome)) + "</p>" +
      (falta.length ? '<p class="hint warn col-12">Falta na Ficha/Cadastros: ' + esc(falta.join(", ")) + ". O termo sai com espaço em branco.</p>" : "") +
      (tipo === "ciencia" ? '<div class="field col-12"><label for="tm-oq">O que será antecipado</label><input id="tm-oq" required value="' + esc(prox ? "o " + prox : "") + '"></div><div class="field col-12"><label for="tm-pre">Pré-requisito previsto no contrato</label><input id="tm-pre" value="' + esc(prereq(g)) + '"></div>' : "") +
      (anot ? '<div class="field col-12"><label for="tm-anot">Anotações (opcional)</label><textarea id="tm-anot" rows="4" placeholder="Ex.: rever a posição do pilar da sala junto com a estrutura"></textarea><span class="hint">' + (tipo === "ciencia" ? "" : "As anotações não reabrem a etapa: são pontos para a próxima etapa.") + "</span></div>" : "") +
      '<div class="field col-6"><label for="tm-data">Data do termo</label><input type="date" id="tm-data" value="' + hojeIso() + '"></div>' +
      '<div class="col-12 form-actions"><button class="btn btn-primary" id="tm-pdf">Gerar PDF</button><button type="button" class="btn" data-close="1">Fechar</button><span class="save-state" id="tm-st"></span></div></form>';
  }
  function proxEtapa(g) { var f = fluxo(g.sigla), n = f[f.indexOf(g.etapa) + 1]; return n && ETAPAS[n] && n !== "encerrado" ? ETAPAS[n].nome : ""; }
  function prereq(g) { if (g.etapa === "abertura") return "contrato assinado, 1ª parcela paga e levantamento topográfico entregue"; if (g.etapa === "ep") return "Termo de Encerramento de Etapa do Estudo Preliminar assinado"; if (g.etapa === "ap") return "Termo de Encerramento de Etapa do Anteprojeto assinado e aprovação dos projetos necessários"; return ""; }
  function loadScript(src) { return new Promise(function (ok, fail) { var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s); }); }
  async function logo() {
    if (S.logo) return S.logo;
    var img = new Image(); img.src = "logo.png"; await img.decode();
    var cv = document.createElement("canvas"); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
    var cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(img, 0, 0);
    S.logo = { url: cv.toDataURL("image/jpeg", 0.92), w: img.naturalWidth, h: img.naturalHeight }; return S.logo;
  }
  function textoTermo(tipo, g, p, dados) {
    var et = tipo === "ciencia" ? g.etapa : tipo, info = ETAPAS[et] || {}, marc = !!info.marc, cls = "o(s) CONTRATANTE(s) acima identificado(s)";
    if (tipo === "ciencia") return ["Pelo presente termo, " + cls + " solicita(m) que " + (dados.oq || "________________") + " seja iniciado antes do momento previsto no contrato, que tem como pré-requisito " + (dados.pre || "________________") + ".",
      "Declara(m) estar ciente(s) de que:", "• a antecipação é feita a seu pedido;", "• informações ainda não definidas podem mudar e exigir que partes do projeto sejam refeitas;", "• o retrabalho causado pela antecipação será cobrado como adicional de contrato, conforme a cláusula 9.1;", "• os prazos das etapas seguintes podem ser afetados."];
    if (info.termo === "etapa") {
      var prox = marc ? "Executivo da marcenaria" : ETAPAS[fluxo(g.sigla)[fluxo(g.sigla).indexOf(et) + 1]].nome;
      return ["Pelo presente termo, " + cls + " declara(m) que recebeu(ram) o " + info.nome + " do projeto " + p.nome + ", desenvolvido pela Trilha Arquitetura Brasileira conforme o contrato acima.",
        "Declara(m) que todo o conteúdo previsto para esta etapa foi apresentado, ajustado e entregue, e dá(ão) seu ACEITE, encerrando a etapa e autorizando o início do " + prox + (info.clausula ? ", conforme a cláusula " + info.clausula + " do contrato." : "."),
        "Declara(m) estar ciente(s) de que qualquer revisão desta etapa, depois de encerrada, será tratada como adicional de contrato" + (marc ? "." : ", conforme a cláusula 9.1.")];
    }
    if (marc) return ["Pelo presente termo, " + cls + " declara(m) que recebeu(ram) o Executivo da marcenaria do projeto " + p.nome + ", entregue em meio digital pela Trilha Arquitetura Brasileira em " + T.fmtYmd(dados.data) + ".",
      "Declara(m) que todo o conteúdo previsto no contrato da marcenaria foi entregue, e dá(ão) seu ACEITE, encerrando o projeto de marcenaria e os serviços contratados.",
      "Declara(m) estar ciente(s) de que alterações a partir deste momento serão tratadas como novo serviço ou adicional de contrato."];
    return ["Pelo presente termo, " + cls + " declara(m) que recebeu(ram) o Projeto Executivo completo do projeto arquitetônico " + p.nome + ", entregue em meio digital pela Trilha Arquitetura Brasileira em " + T.fmtYmd(dados.data) + ", conforme a cláusula 2.4.8 do contrato (Termo de Finalização de Projeto).",
      "Declara(m) que todo o conteúdo previsto no contrato e no Plano de Projeto foi entregue, e dá(ão) seu ACEITE, encerrando o projeto arquitetônico e os serviços contratados neste contrato.",
      "Declara(m) estar ciente(s) de que alterações no projeto a partir deste momento serão tratadas como novo serviço ou adicional de contrato, conforme as cláusulas 2.4.2 e 9.1, e de que a disponibilização do material aos executores e o seu uso em obra são de sua responsabilidade (cláusulas 2.4.5 a 2.4.7)."];
  }
  async function gerarTermo() {
    var f = $("termo-form"), tipo = f.dataset.tipo, g = G(S.projId), p = proj(S.projId), st = $("tm-st");
    var et = tipo === "ciencia" ? g.etapa : tipo, info = ETAPAS[et] || {}, ct = contratoDe(g, p, et);
    var dados = { data: $("tm-data").value || hojeIso(), anot: $("tm-anot") ? $("tm-anot").value.trim() : "", oq: $("tm-oq") ? $("tm-oq").value.trim() : "", pre: $("tm-pre") ? $("tm-pre").value.trim() : "" };
    var titulo = tipo === "ciencia" ? "TERMO DE CIÊNCIA DE ANTECIPAÇÃO" : info.termo === "projeto" ? "TERMO DE ENCERRAMENTO DE PROJETO" : "TERMO DE ENCERRAMENTO DE ETAPA";
    if (!T.downloads) { st.className = "save-state err"; st.textContent = "Este acesso não permite baixar arquivos"; return; }
    st.className = "save-state"; st.textContent = "Gerando PDF…";
    try {
      if (!window.jspdf) await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
      var doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" }), L = await logo(), x = 22, W = 166, y = 20;
      var verde = [111, 148, 80], tinta = [31, 42, 26], cinza = [111, 125, 102];
      function quebra(h) { if (y + h > 262) { doc.addPage(); y = 22; } }
      function par(txt, tam, estilo, cor) { doc.setFont("helvetica", estilo || "normal"); doc.setFontSize(tam || 11); doc.setTextColor.apply(doc, cor || tinta); var ls = doc.splitTextToSize(txt, W); quebra(ls.length * tam * 0.53); doc.text(ls, x, y, { lineHeightFactor: 1.45 }); y += ls.length * (tam || 11) * 0.51 + 3.5; }
      var lh = 12, lw = L.w / L.h * lh; if (lw > 64) { lw = 64; lh = lw * L.h / L.w; }
      doc.addImage(L.url, "JPEG", x, y, lw, lh); y += lh + 7;
      doc.setDrawColor.apply(doc, verde); doc.setLineWidth(0.7); doc.line(x, y, x + W, y); y += 9;
      doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor.apply(doc, tinta); doc.text(titulo, x, y); y += 9;
      var cab = [["Contrato", ct.numero ? "Contrato de Prestação de Serviço nº " + ct.numero + (ct.data ? ", de " + T.fmtYmd(ct.data) : "") : "________________"],
        ["Contratante(s)", clientes(p).map(function (c) { return c.nome + (c.doc ? " (CPF/CNPJ " + c.doc + ")" : ""); }).join("; ") || clientesNomes(p) || "________________"],
        ["Projeto", p.nome + (p.codigo ? " (" + p.codigo + ")" : "") + (p.endereco ? " · " + p.endereco : "")],
        ["Etapa", tipo === "ciencia" ? (ETAPAS[g.etapa] || {}).nome || "" : info.nome + ((g.etapas || {})[et] && g.etapas[et].inicio ? " · início " + T.fmtYmd(T.ymd(new Date(g.etapas[et].inicio))) : "") + " · entrega " + T.fmtYmd(dados.data)]];
      doc.setFontSize(10);
      cab.forEach(function (c) { var ls = doc.splitTextToSize(c[1], W - 36); quebra(ls.length * 5); doc.setFont("helvetica", "normal"); doc.setTextColor.apply(doc, cinza); doc.text(c[0], x, y); doc.setTextColor.apply(doc, tinta); doc.text(ls, x + 36, y, { lineHeightFactor: 1.35 }); y += ls.length * 4.8 + 2; });
      y += 5;
      textoTermo(tipo, g, p, dados).forEach(function (t) { par(t, 11); });
      if (tipo === "ciencia" || info.termo === "etapa") {
        y += 2; quebra(34);
        doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor.apply(doc, tinta); doc.text(tipo === "ciencia" ? "Anotações" : "Anotações para a próxima etapa", x, y); y += 3;
        var corpo = dados.anot || "Sem anotações.", ls2 = doc.splitTextToSize(corpo, W - 8), alt = Math.max(22, ls2.length * 5.2 + 12);
        quebra(alt); doc.setDrawColor(136, 172, 103); doc.setLineWidth(0.3); doc.setFillColor(246, 249, 242); doc.roundedRect(x, y, W, alt, 2, 2, "FD");
        var yy = y + 7; if (tipo !== "ciencia") { doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor.apply(doc, cinza); doc.text("As anotações não reabrem a etapa encerrada: são pontos combinados para a próxima etapa.", x + 4, yy); yy += 6; alt += 0; }
        doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor.apply(doc, tinta); doc.text(ls2, x + 4, yy, { lineHeightFactor: 1.4 }); y += alt + 8;
      }
      quebra(60); y += 4;
      par((ct.cidade ? ct.cidade + ", " : (S.fin && S.fin.recibo && S.fin.recibo.cidade ? S.fin.recibo.cidade + ", " : "")) + dataExtenso(dados.data) + ".", 11);
      y += 16; var assin = clientes(p).map(function (c) { return c.nome; }); if (!assin.length) assin = ["CONTRATANTE"]; assin.push("Trilha Arquitetura Brasileira (CONTRATADO)");
      for (var i = 0; i < assin.length; i += 2) {
        quebra(22);
        [assin[i], assin[i + 1]].forEach(function (n, k) { if (!n) return; var cx = x + (k ? W / 2 + 6 : 0), cw = W / 2 - 6; doc.setDrawColor.apply(doc, tinta); doc.setLineWidth(0.3); doc.line(cx, y, cx + cw, y); doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor.apply(doc, tinta); doc.text(doc.splitTextToSize(n, cw), cx + cw / 2, y + 5, { align: "center" }); });
        y += 22;
      }
      var np = doc.getNumberOfPages();
      for (var pg = 1; pg <= np; pg++) { doc.setPage(pg); doc.setDrawColor(217, 224, 210); doc.setLineWidth(0.3); doc.line(x, 280, x + W, 280); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor.apply(doc, cinza); doc.text("trilha arquitetura brasileira · www.trilhaarq.com.br · trilha@trilhaarq.com.br", x + W / 2, 285, { align: "center" }); }
      var nome = T.slug(titulo.toLowerCase()) + "-" + T.slug(p.codigo || p.nome) + (tipo !== "ciencia" ? "-" + T.slug(ETAPAS[et].curto) : "") + ".pdf";
      st.textContent = "";
      await T.downloads.save({ filename: nome, data: doc.output("arraybuffer") });
      st.className = "save-state ok"; st.textContent = "PDF salvo ✓";
      salvar(S.projId, function (x2) { evento(x2, (tipo === "ciencia" ? "Termo de Ciência de Antecipação" : titulo.charAt(0) + titulo.slice(1).toLowerCase() + " (" + info.nome + ")") + " gerado em PDF" + (dados.anot ? ". Anotações: " + dados.anot : ""), dados.data, { tipo: "termo" }); });
    } catch (e) { if (window.console) console.error(e); st.className = "save-state err"; st.textContent = e && e.code === "declined" ? "Download cancelado" : "Não foi possível gerar o PDF"; }
  }

  // ---------- relatório de andamento da fase (PDF para o cliente ou reuniões internas) ----------
  // Só o nome do projeto como dado externo; o resto são números e gráficos do Plano de Projeto da fase.
  async function gerarRelatorio(et) {
    var g = G(S.projId), p = proj(S.projId), cod = codigos(g), itens = ordenar(itensDe(g, et));
    if (!T.downloads) { T.toast("Este acesso não permite baixar arquivos."); return; }
    if (!itens.length) { T.toast("Esta fase ainda não tem itens no Plano."); return; }
    T.toast("Gerando o relatório…");
    try {
      if (!window.jspdf) await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
      var doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" }), L = await logo(), x = 18, W = 174, y = 16, agora = new Date();
      var verde = [111, 148, 80], claro = [136, 172, 103], tinta = [31, 42, 26], cinza = [111, 125, 102], trilho = [232, 237, 228];
      var CORES = { a_fazer: [214, 220, 208], andamento: [176, 133, 44], revisao: [111, 148, 80], rev_cliente: [74, 120, 192], pronto: [136, 172, 103], entregue: [70, 98, 50] };
      function txt(t, xx, yy, tam, est, cor, op) { doc.setFont("helvetica", est || "normal"); doc.setFontSize(tam); doc.setTextColor.apply(doc, cor || tinta); doc.text(String(t), xx, yy, op || {}); }
      function quebra(h) { if (y + h > 272) { doc.addPage(); y = 18; } }
      function titulo(t) { quebra(14); y += 4; txt(t, x, y, 11.5, "bold"); y += 2; doc.setDrawColor.apply(doc, trilho); doc.setLineWidth(0.4); doc.line(x, y, x + W, y); y += 6; }
      var lh = 10, lw = L.w / L.h * lh; if (lw > 52) { lw = 52; lh = lw * L.h / L.w; }
      doc.addImage(L.url, "JPEG", x, y, lw, lh); txt("Relatório de andamento", x + W, y + 4, 9, "normal", cinza, { align: "right" }); txt("Gerado em " + agora.toLocaleDateString("pt-BR") + " às " + T.hm(agora), x + W, y + 9, 9, "normal", cinza, { align: "right" });
      y += lh + 5; doc.setDrawColor.apply(doc, verde); doc.setLineWidth(0.7); doc.line(x, y, x + W, y); y += 10;
      var nomeFase = et === "mex" ? "Executivo da marcenaria" : ETAPAS[et].nome;
      txt(p.nome, x, y, 19, "bold"); y += 7; txt(nomeFase, x, y, 12, "normal", verde); y += 9;
      // números principais
      var tot = itens.length, ok = prontos(itens), pct = Math.round(ok / tot * 100), pz = et === "mex" ? (g.marc && g.marc.etapa === "mex" ? calcPrazo(g, "mex") : null) : (g.etapa === et ? calcPrazo(g, et) : null);
      var est = etapaEstado(g, et), info = (g.etapas || {})[et] || {};
      var cards = [["Concluído", pct + "%", ok + " de " + tot + " itens"], ["Situação da fase", ESTADO_NOME[est], info.inicio ? "início " + T.fmtYmd(T.ymd(new Date(info.inicio))) : ""],
        ["Prazo", pz ? pz.usados + " de " + pz.prazo + " d.u." : est === "fim" ? "concluída" : "—", pz ? (pz.pausado ? "pausado" : pz.resta >= 0 ? "restam " + pz.resta + " d.u." : "vencido há " + (-pz.resta) + " d.u.") : ""],
        ["Data prevista", pz ? T.fmtYmd(T.ymd(pz.fim)) : info.fim ? T.fmtYmd(T.ymd(new Date(info.fim))) : "—", pz ? "em dias úteis" : info.fim ? "encerramento" : ""]];
      var cw = (W - 9) / 4;
      cards.forEach(function (c, k) { var cx = x + k * (cw + 3); doc.setDrawColor.apply(doc, trilho); doc.setFillColor(248, 250, 246); doc.roundedRect(cx, y, cw, 24, 2, 2, "FD"); txt(c[0].toUpperCase(), cx + 4, y + 6, 7.5, "normal", cinza); txt(c[1], cx + 4, y + 14.5, k === 0 ? 16 : 12, "bold", k === 0 ? verde : tinta); txt(c[2], cx + 4, y + 20.5, 8, "normal", cinza); });
      y += 32;
      // gráfico 1: rosca do % concluído + barra empilhada por situação
      titulo("Itens por situação");
      var cont = {}; SIT.forEach(function (s2) { cont[s2[0]] = itens.filter(function (it) { return it.sit === s2[0]; }).length; });
      var cxr = x + 20, cyr = y + 18, r = 16, a0 = -Math.PI / 2;
      doc.setDrawColor.apply(doc, trilho); doc.setLineWidth(5.5); doc.circle(cxr, cyr, r, "S");
      doc.setDrawColor.apply(doc, claro); var passos2 = Math.max(1, Math.round(pct / 2)); for (var k = 0; k < passos2; k++) { var t1 = a0 + (k / 50) * Math.PI * 2, t2 = a0 + ((k + 1) / 50) * Math.PI * 2; if ((k + 1) * 2 > pct + 1) t2 = a0 + pct / 100 * Math.PI * 2; doc.line(cxr + r * Math.cos(t1), cyr + r * Math.sin(t1), cxr + r * Math.cos(t2), cyr + r * Math.sin(t2)); }
      if (!pct) { doc.setDrawColor.apply(doc, trilho); }
      txt(pct + "%", cxr, cyr + 2, 13, "bold", tinta, { align: "center" }); txt("concluído", cxr, cyr + 7, 7, "normal", cinza, { align: "center" });
      var bx = x + 48, bw = W - 48, by = y + 6, acc = 0; doc.setLineWidth(0.2);
      SIT.forEach(function (s2) { var n = cont[s2[0]]; if (!n) return; var w2 = bw * n / tot; doc.setFillColor.apply(doc, CORES[s2[0]]); doc.rect(bx + acc, by, w2, 9, "F"); if (w2 > 7) txt(String(n), bx + acc + w2 / 2, by + 6, 8, "bold", s2[0] === "a_fazer" ? tinta : [255, 255, 255], { align: "center" }); acc += w2; });
      var ly = by + 17, lx = bx;
      SIT.forEach(function (s2, k2) { var col = k2 % 3, row = Math.floor(k2 / 3), xx = lx + col * (bw / 3), yy = ly + row * 7; doc.setFillColor.apply(doc, CORES[s2[0]]); doc.rect(xx, yy - 3, 3.2, 3.2, "F"); txt(s2[1] + " · " + cont[s2[0]], xx + 5, yy, 8.5, "normal", tinta); });
      y += 42;
      // gráfico 2: andamento por grupo / série
      var grs = (et === "mex" ? grupos("mex") : grupos(et, g)).map(function (gr) { var l = itens.filter(function (it) { return it.grupo === gr.k; }); return { n: gr.n, t: l.length, ok: prontos(l), and: l.filter(function (it) { return ["andamento", "revisao", "rev_cliente"].indexOf(it.sit) >= 0; }).length }; }).filter(function (o) { return o.t; });
      titulo("Andamento por " + (et === "pl" ? "projeto" : "série"));
      grs.forEach(function (o) {
        quebra(10); var lw2 = 62, bw2 = W - lw2 - 26;
        txt(doc.splitTextToSize(o.n, lw2 - 2)[0], x, y + 4, 9, "normal", tinta);
        doc.setFillColor.apply(doc, trilho); doc.roundedRect(x + lw2, y, bw2, 5.5, 1.2, 1.2, "F");
        if (o.ok) { doc.setFillColor.apply(doc, claro); doc.roundedRect(x + lw2, y, Math.max(2.4, bw2 * o.ok / o.t), 5.5, 1.2, 1.2, "F"); }
        if (o.and) { doc.setFillColor.apply(doc, CORES.andamento); doc.rect(x + lw2 + bw2 * o.ok / o.t, y, bw2 * o.and / o.t, 5.5, "F"); }
        txt(o.ok + "/" + o.t + "  " + Math.round(o.ok / o.t * 100) + "%", x + W, y + 4, 9, "bold", tinta, { align: "right" }); y += 9;
      });
      txt("Verde: pronto ou entregue · âmbar: em andamento, em revisão interna ou com o cliente.", x, y + 1, 7.5, "italic", cinza); y += 6;
      // gráfico 3: prazo
      if (pz) {
        titulo("Prazo da fase");
        var pw = W - 30, usado = Math.min(pz.usados, pz.prazo), cor = pz.pct < 30 ? claro : pz.pct < 60 ? CORES.andamento : [179, 89, 63];
        doc.setFillColor.apply(doc, trilho); doc.roundedRect(x, y, pw, 7, 1.5, 1.5, "F"); doc.setFillColor.apply(doc, cor); doc.roundedRect(x, y, Math.max(3, pw * usado / pz.prazo), 7, 1.5, 1.5, "F");
        txt(pz.pct + "%", x + W, y + 5, 10, "bold", tinta, { align: "right" }); y += 12;
        txt(pz.usados + " dias úteis usados de " + pz.prazo + " · " + (pz.resta >= 0 ? "restam " + pz.resta : "vencido há " + (-pz.resta)) + " · data prevista " + T.fmtYmd(T.ymd(pz.fim)) + (pz.pausado ? " · pausado no momento" : ""), x, y, 9, "normal", cinza); y += 6;
      }
      // listas
      function lista(tit, l, fn) { if (!l.length) return; titulo(tit + " · " + l.length); l.forEach(function (it) { quebra(6); var t3 = (cod[it.id] ? cod[it.id] + "  " : "") + it.titulo; txt(doc.splitTextToSize(t3, W - 30)[0], x + 2, y, 9, "normal", tinta); txt(fn(it), x + W, y, 8.5, "normal", cinza, { align: "right" }); y += 5.6; }); y += 2; }
      lista("Com o cliente para revisão", itens.filter(function (it) { return it.sit === "rev_cliente"; }), function () { return "Revisão Cliente"; });
      lista("Em andamento", itens.filter(function (it) { return it.sit === "andamento" || it.sit === "revisao"; }), function (it) { return sitNome(it.sit); });
      lista("Concluídos recentemente", itens.filter(function (it) { return feito(it) && it.concluidoEm; }).sort(function (a, b) { return a.concluidoEm < b.concluidoEm ? 1 : -1; }).slice(0, 12), function (it) { return T.fmtYmd(T.ymd(new Date(it.concluidoEm))); });
      var np = doc.getNumberOfPages();
      for (var pg = 1; pg <= np; pg++) { doc.setPage(pg); doc.setDrawColor(217, 224, 210); doc.setLineWidth(0.3); doc.line(x, 283, x + W, 283); txt("trilha arquitetura brasileira · www.trilhaarq.com.br", x, 288, 8, "normal", cinza); txt(p.nome + " · " + nomeFase + " · página " + pg + " de " + np, x + W, 288, 8, "normal", cinza, { align: "right" }); }
      var nome = "relatorio-" + T.slug(p.codigo || p.nome) + "-" + T.slug(nomeFase) + "-" + T.ymd(agora) + ".pdf";
      await T.downloads.save({ filename: nome, data: doc.output("arraybuffer") });
      T.toast("Relatório salvo ✓");
      salvar(S.projId, function (x2) { evento(x2, "Relatório de andamento gerado (" + nomeFase + ": " + pct + "% concluído)", hojeIso(), { tipo: "termo" }); });
    } catch (e) { if (window.console) console.error(e); T.toast(e && e.code === "declined" ? "Download cancelado" : "Não foi possível gerar o relatório"); }
  }

  // ---------- janela (reunião, termo) ----------
  function abrirModal(html) { S.modal = true; $("gp-modal-box").innerHTML = html; $("gp-overlay").hidden = false; var f = $("gp-modal-box").querySelector("input,select,textarea"); if (f) f.focus(); }
  function fecharModal() { S.modal = null; $("gp-overlay").hidden = true; $("gp-modal-box").innerHTML = ""; }

  // ---------- novo projeto (assistente) ----------
  function wizInicial(pj) {
    var w = { step: 1, sigla: "RES", nome: "", codigo: "", codManual: false, clienteIds: [], novoCli: { nome: "", contato: "", email: "" }, padrao: "", dimensao: "confortavel", dificuldade: "", npav: 1, pavs: ["Térreo"],
      qtd: T.clone(PADRAO_RES), areas: {}, inicio: "novo", etapaAtual: "ep", fase: 1, dataEtapa: hojeIso(), legal: "nao_iniciado", projetoId: null };
    if (pj) { w.projetoId = pj.id; w.nome = pj.nome; w.codManual = !!pj.codigo; w.codigo = pj.codigo || ""; w.clienteIds = (pj.clienteIds || []).slice(); var sg = { res: "RES", comr: "COM", hot: "HOT", ref: "REF", int: "INT" }[pj.tipo]; if (sg) w.sigla = sg; w.inicio = "andamento"; if (w.sigla !== "RES") w.qtd = {}; }
    return w;
  }
  function codigoDe(sigla, nome) { return sigla + "-" + String(nome || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, ""); }
  var desenhando = false;
  function renderNovo() {
    // trocar o HTML tira o foco do campo, o que dispara "change" e pediria outro desenho no meio deste
    if (desenhando) { setTimeout(renderNovo, 0); return; }
    desenhando = true; try { desenharNovo(); } finally { desenhando = false; }
  }
  function desenharNovo() {
    var w = S.wiz; if (!w) return; var h = '<div class="card gp-box"><div class="section-head" style="margin:0"><h2 class="section-title" style="margin:0">' + (w.projetoId ? "Levar projeto ao Gestor" : "Novo projeto") + '</h2></div><div class="gp-wiz-steps">' + ["Projeto e cliente", "Pavimentos e situação", "Programa de necessidades"].map(function (n, k) { return '<span class="' + (w.step === k + 1 ? "cur" : w.step > k + 1 ? "done" : "") + '">' + (k + 1) + " · " + n + "</span>"; }).join("") + "</div>";
    if (w.step === 1) {
      var cls = T.cadastros ? T.cadastros.contatos("cliente") : [];
      h += '<div class="grid-form"><div class="field col-12"><span class="label">Tipo</span><div class="segmented">' + SIGLAS.map(function (s) { return '<button type="button" class="seg-pill' + (w.sigla === s[0] ? " is-selected" : "") + '" data-wsig="' + s[0] + '">' + s[0] + " · " + s[1] + "</button>"; }).join("") + "</div></div>" +
        '<div class="field col-6"><label for="w-nome">Nome do projeto</label><input id="w-nome" data-w="nome" value="' + esc(w.nome) + '" placeholder="Ex.: Casa Duarte"></div>' +
        '<div class="field col-6"><label for="w-cod">Código</label><input id="w-cod" data-w="codigo" value="' + esc(w.codigo || codigoDe(w.sigla, w.nome)) + '"><span class="hint">Sigla + nome, sem acentos. Pode ajustar.</span></div>' +
        '<div class="field col-12"><span class="label">Clientes cadastrados</span><div class="gp-multi">' + (cls.length ? cls.map(function (c) { return '<label class="gp-check"><input type="checkbox" data-wcli="' + esc(c.id) + '"' + (w.clienteIds.indexOf(c.id) >= 0 ? " checked" : "") + "> " + esc(c.nome) + "</label>"; }).join("") : '<span class="hint">Nenhum cliente cadastrado ainda.</span>') + "</div></div>" +
        '<div class="field col-4"><label for="w-cn">+ Novo cliente: nome</label><input id="w-cn" data-wn="nome" value="' + esc(w.novoCli.nome) + '"></div><div class="field col-4"><label for="w-cc">Contato</label><input id="w-cc" data-wn="contato" value="' + esc(w.novoCli.contato) + '"></div><div class="field col-4"><label for="w-ce">E-mail</label><input id="w-ce" data-wn="email" value="' + esc(w.novoCli.email) + '"></div>' +
        '<div class="field col-4"><label for="w-pad">Padrão</label><select id="w-pad" data-w="padrao">' + T.optHtml([["", "—"]].concat(PADRAO), w.padrao) + '</select></div><div class="field col-4"><label for="w-dim">Dimensão</label><select id="w-dim" data-w="dimensao">' + T.optHtml(DIMENSAO, w.dimensao) + '</select></div><div class="field col-4"><label for="w-dif">Dificuldade do terreno</label><select id="w-dif" data-w="dificuldade">' + T.optHtml([["", "A definir após a visita"]].concat(DIFICULDADE), w.dificuldade) + "</select></div></div>";
    } else if (w.step === 2) {
      var ets = fluxo(w.sigla).filter(function (e) { return e !== "abertura" && e !== "encerrado"; }), fs = (ETAPAS[w.etapaAtual] || {}).fases;
      h += '<div class="grid-form"><div class="field col-3"><label for="w-npav">Pavimentos</label><input id="w-npav" type="number" min="1" max="12" value="' + w.npav + '"></div><div class="field col-9"><span class="label">Nome de cada pavimento</span><div class="gp-pavs">' + w.pavs.map(function (p, k) { return '<input data-wpav="' + k + '" value="' + esc(p) + '" aria-label="Pavimento ' + (k + 1) + '">'; }).join("") + "</div></div>" +
        '<div class="field col-12"><span class="label">Situação do projeto</span><div class="segmented"><button type="button" class="seg-pill' + (w.inicio === "novo" ? " is-selected" : "") + '" data-winicio="novo">Novo: começa na Abertura</button><button type="button" class="seg-pill' + (w.inicio === "andamento" ? " is-selected" : "") + '" data-winicio="andamento">Já em andamento</button></div></div>' +
        (w.inicio === "andamento" ? '<div class="field col-4"><label for="w-et">Etapa atual</label><select id="w-et" data-w="etapaAtual">' + ets.map(function (e) { return '<option value="' + e + '"' + (e === w.etapaAtual ? " selected" : "") + ">" + esc(ETAPAS[e].nome) + "</option>"; }).join("") + "</select></div>" +
          (fs ? '<div class="field col-4"><label for="w-fase">Fase</label><select id="w-fase" data-w="fase">' + fs.map(function (n, k) { return '<option value="' + (k + 1) + '"' + (+w.fase === k + 1 ? " selected" : "") + ">" + (k + 1) + " · " + esc(n) + "</option>"; }).join("") + "</select></div>" : "") +
          '<div class="field col-4"><label for="w-dt">Início da etapa atual</label><input type="date" id="w-dt" data-w="dataEtapa" value="' + esc(w.dataEtapa) + '"></div>' +
          (doZero(w.sigla) ? '<div class="field col-4"><label for="w-leg">Projeto Legal</label><select id="w-leg" data-w="legal">' + T.optHtml(LEGAL, w.legal) + "</select></div>" : "") +
          '<p class="hint col-12">As etapas anteriores entram como concluídas, com os itens prontos. Ajuste datas e itens depois, se precisar.</p>' : "") + "</div>";
    } else {
      h += '<p class="hint">Quantidade e área de cada ambiente. A área já vem da referência (Confortável) e pode ser mudada aqui; a configuração de cada ambiente é feita depois, na aba Programa.</p><div class="gp-qtd">' + SETORES.map(function (s) {
        var ts = catalogo().filter(function (t) { return t.s === s[0] && t.id !== "outro"; }); if (!ts.length) return "";
        return '<div><div class="gp-serie-h"><b>' + s[1] + '</b><span class="hint gp-qh">qtd. · m²</span></div>' + ts.map(function (t) { var ar = w.areas[t.id] != null ? w.areas[t.id] : t.a; return '<label class="gp-qrow"><span>' + esc(t.n) + '</span><span class="gp-qin"><input type="number" min="0" max="20" data-wq="' + t.id + '" value="' + (w.qtd[t.id] || 0) + '" aria-label="Quantidade de ' + esc(t.n) + '"><input type="number" min="0" step="0.5" class="gp-qa" data-wa="' + t.id + '" value="' + (ar != null ? ar : "") + '" placeholder="m²" aria-label="Área de ' + esc(t.n) + ' (m²)"></span></label>'; }).join("") + "</div>";
      }).join("") + '</div><div class="note" id="w-prev"></div>';
    }
    h += '<div class="form-actions" style="margin-top:16px">' + (w.step > 1 ? '<button class="btn" data-wstep="-1">Voltar</button>' : '<button class="btn" data-wcancel="1">Cancelar</button>') + (w.step < 3 ? '<button class="btn btn-primary" data-wstep="1">Próximo</button>' : '<button class="btn btn-primary" id="w-criar">' + (w.projetoId ? "Levar ao Gestor" : "Criar projeto") + "</button>") + "</div></div>";
    $("gp-novo").innerHTML = h;
    if (w.step === 3) previewWiz();
  }
  function previewWiz() {
    var w = S.wiz, amb = ambientesDeQtd(w.qtd, w.pavs[0], w.areas), it = gerarPlano({ sigla: w.sigla, pavs: w.pavs, ambientes: amb });
    var area = amb.reduce(function (s, a) { return s + (+a.area || 0) * (+a.qtd || 1); }, 0), cont = {};
    it.forEach(function (x) { cont[x.etapa] = (cont[x.etapa] || 0) + 1; });
    var el = $("w-prev"); if (el) el.innerHTML = '<div><div class="note-title">Prévia do projeto</div><div class="note-body">' + amb.length + " ambientes · <b>" + T.fmtNum(area * 1.2) + " m²</b> estimados · <b>" + it.length + " itens</b> no Plano de Projeto (" + Object.keys(cont).map(function (e) { return ETAPAS[e].curto + ": " + cont[e]; }).join(" · ") + ")</div></div>";
  }
  // Monta o documento do Gestor. Em andamento: etapas anteriores concluídas (itens prontos) até a etapa atual.
  function montarGp(o) {
    var legal = doZero(o.sigla) ? o.legal || "nao_iniciado" : "nao_se_aplica", amb = o.ambientes || [];
    var itens = gerarPlano({ sigla: o.sigla, pavs: o.pavs, ambientes: amb, legal: legal }), agora = new Date().toISOString();
    var g = { sigla: o.sigla, etapa: "abertura", fase: null, etapas: { abertura: { inicio: agora } }, proximo: "", legal: legal, marco: {}, esperas: [], pavs: o.pavs, ambientes: amb, itens: itens, reunioes: [], eventos: [], criadoEm: agora };
    fluxo(o.sigla).forEach(function (e) { if (ETAPAS[e].prazo) { g.etapas[e] = g.etapas[e] || {}; g.etapas[e].prazo = prazoPadrao(e); } });
    if (legal !== "nao_se_aplica") { var ls0 = { nao_iniciado: "nao_iniciado", em_preparo: "preparo", protocolado: "protocolado", aprovado: "aprovado" }[legal] || "nao_iniciado"; g.leg = { pref: { sit: ls0, hist: ls0 === "nao_iniciado" ? [] : [{ sit: ls0, em: agora }] } }; }
    if (o.inicio === "andamento") {
      var f = fluxo(o.sigla), alvo = f.indexOf(o.etapaAtual), ini = isoDeData(o.dataEtapa || hojeIso());
      g.etapa = o.etapaAtual; g.fase = ETAPAS[o.etapaAtual].fases ? +o.fase || 1 : null; g.marco = { contrato: true, parcela: true }; g.etapas = {};
      var pzs = g.etapas; g.etapas = {};
      f.slice(0, alvo).forEach(function (e) { g.etapas[e] = { inicio: null, fim: null, termoEm: null }; }); // datas reais anteriores ao app: ajustar em Configurações do projeto
      g.etapas[o.etapaAtual] = { inicio: ini };
      Object.keys(pzs).forEach(function (e) { if (pzs[e].prazo) { g.etapas[e] = g.etapas[e] || {}; g.etapas[e].prazo = pzs[e].prazo; } });
      var feitas = f.slice(0, alvo); if (legal === "aprovado") feitas.push("pl");
      itens.forEach(function (x) { if (feitas.indexOf(x.etapa) >= 0) { x.sit = "pronto"; x.desenhos.forEach(function (d) { d.feito = true; }); } });
      evento(g, "Projeto incluído no Gestor já em andamento: " + ETAPAS[o.etapaAtual].nome + (g.fase ? ", fase " + g.fase : "") + " (etapas anteriores concluídas antes do app)", hojeIso(), { tipo: "etapa" });
    } else evento(g, "Projeto criado no Gestor: Abertura", hojeIso(), { tipo: "etapa" });
    return g;
  }
  async function criarProjeto() {
    var w = S.wiz, nome = w.nome.trim(); if (!nome) { w.step = 1; renderNovo(); T.toast("Dê um nome ao projeto."); return; }
    await T.saveWith($("w-criar"), async function () {
      var ids = w.clienteIds.slice();
      if (w.novoCli.nome.trim() && T.cadastros) ids.push(await T.cadastros.criarContato({ tipos: ["cliente"], nome: w.novoCli.nome.trim(), contato: w.novoCli.contato.trim(), email: w.novoCli.email.trim() }));
      var amb = ambientesDeQtd(w.qtd, w.pavs[0], w.areas), area = amb.reduce(function (s, a) { return s + (+a.area || 0) * (+a.qtd || 1); }, 0);
      var nomesCli = ids.map(function (id) { var c = T.cadastros && T.cadastros.contato(id); return c ? c.nome : ""; }).filter(Boolean);
      var body = { nome: nome, codigo: (w.codigo || codigoDe(w.sigla, nome)).trim(), sigla: w.sigla, tipo: TIPO_ANTIGO[w.sigla], clienteIds: ids, categorias: { padrao: w.padrao || null, dimensao: w.dimensao, dificuldade: w.dificuldade || null }, status: "ativo" };
      if (nomesCli.length) body.cliente = nomesCli.join(" e ");
      var pid;
      if (w.projetoId) { pid = w.projetoId; if (!(T.projeto(pid) || {}).area && area) body.area = Math.round(area * 1.2); await T.db.doc("projetos/" + pid).update(body); }
      else { body.area = Math.round(area * 1.2); body.criadoEm = new Date().toISOString(); pid = (await T.db.collection("projetos").add(body)).id; }
      var g = montarGp({ sigla: w.sigla, pavs: w.pavs, ambientes: amb, inicio: w.inicio, etapaAtual: w.etapaAtual, fase: w.fase, dataEtapa: w.dataEtapa, legal: w.legal });
      S.gp[pid] = g; await T.db.doc("gp/" + pid).set(g);
      S.wiz = null; S.view = "projeto"; S.projId = pid; S.tab = "geral";
    });
    T.scheduleRender();
  }

  // ---------- ações ----------
  async function avancar() {
    var g = G(S.projId), f = fluxo(g.sigla), prox = f[f.indexOf(g.etapa) + 1], data = ($("gp-termo-data") || {}).value || hojeIso();
    var falta = g.etapa === "abertura" && !(marco(g, "contrato") && marco(g, "parcela") && marco(g, "topografico"));
    var antecipa = $("gp-antecipa") && $("gp-antecipa").checked;
    if (falta && !antecipa) { T.toast("Complete o que falta ou marque a antecipação autorizada."); return; }
    if (prox === "pe" && !legalAprovado(g)) return;
    var ok = await T.confirmar({ titulo: prox === "encerrado" ? "Encerrar a arquitetura?" : "Abrir " + ETAPAS[prox].nome + "?", texto: g.etapa === "abertura" ? "Marca o marco zero em " + T.fmtYmd(data) + " e começa a contar o prazo do Estudo Preliminar." : "Registra o termo de " + esc(ETAPAS[g.etapa].nome) + " assinado em " + T.fmtYmd(data) + (prox === "encerrado" ? "." : " e abre a próxima etapa."), ok: prox === "encerrado" ? "Encerrar" : "Abrir etapa" });
    if (!ok) return;
    var iso = isoDeData(data);
    await salvar(S.projId, function (x) {
      x.etapas = x.etapas || {}; x.etapas[x.etapa] = Object.assign({}, x.etapas[x.etapa], { fim: iso, termoEm: ETAPAS[x.etapa].termo ? data : null });
      evento(x, x.etapa === "abertura" ? "Marco zero: Estudo Preliminar iniciado" + (antecipa && falta ? " (antecipação com Termo de Ciência)" : "") : "Termo de " + (ETAPAS[x.etapa].termo === "projeto" ? "Encerramento de Projeto" : "Encerramento de Etapa") + " assinado (" + ETAPAS[x.etapa].nome + ")", data, { tipo: "etapa" });
      x.etapa = prox; x.fase = ETAPAS[prox].fases ? 1 : null; x.etapas[prox] = Object.assign({}, x.etapas[prox], { inicio: iso });
      if (prox === "encerrado") {
        if (!marcAberta(x)) x.esperas = (x.esperas || []).map(function (e) { if (!e.fim) e.fim = iso; return e; });
        else if (x.marc.etapa === "espera") { x.marc.etapa = "mex"; x.etapas.mex = Object.assign({}, x.etapas.mex, { inicio: iso }); evento(x, "Executivo da marcenaria iniciado (arquitetura entregue e EP da marcenaria aprovado)", data, { tipo: "etapa" }); }
      }
    });
    S.planoEtapa = null;
    if (prox === "encerrado" && !marcAberta(G(S.projId))) await statusProjeto(S.projId, "concluido");
    T.toast(prox === "encerrado" ? "Arquitetura encerrada" : ETAPAS[prox].nome + " aberta");
  }
  // Projeto Legal: cada mudança de situação fica no histórico do órgão (bate-bola protocolado ⇄ exigência até aprovado).
  async function mudarLegal(o, sit) {
    var pid = S.projId, g = G(pid), dEl = document.querySelector('[data-legdata="' + o + '"]'), data = (dEl && dEl.value) || hojeIso(), info = ORGAOS[o], l = legalDe(g, o);
    var primeiro = sit === "protocolado" && !(l.hist || []).some(function (x) { return x.sit === "protocolado"; });
    var txt = { preparo: "Começa a contar o prazo de desenvolvimento (" + (l.prazoDev || prazoPadrao("plDev")) + " d.u.).", protocolado: primeiro ? "Registra o protocolo: a fase de desenvolver e protocolar fica concluída e o prazo para de contar (análise do " + info.orgao + ")." : "Registra o novo protocolo: o prazo para de contar (análise do " + info.orgao + ").", exigencia: "Volta a contar o prazo da Trilha para atender (" + (l.prazoExig || prazoPadrao("plExig")) + " d.u.).", aprovado: "Encerra o " + info.nome.toLowerCase() + "." }[sit];
    if (o === "pref" && sit === "protocolado" && orgaosLegal(g).length > 1 && legalDe(g, "cond").sit !== "aprovado") txt += " Atenção: o condomínio ainda não está aprovado.";
    if (!(await T.confirmar({ titulo: info.curto + ": " + legSitNome(sit).replace(" · em análise", "") + "?", texto: txt + " Data: " + T.fmtYmd(data) + ".", ok: "Registrar" }))) return;
    await salvar(pid, function (x) {
      x.leg = x.leg || {}; var cur = x.leg[o] = T.clone(legalDe(x, o)); cur.hist = cur.hist || [];
      cur.hist.push({ sit: sit, em: isoDeData(data) }); cur.sit = sit;
      evento(x, info.nome + ": " + legSitNome(sit) + (primeiro ? " (desenvolvimento e protocolo concluídos)" : ""), data, { tipo: "etapa" });
      x.legal = resumoLegal(x);
    });
    T.toast(info.curto + ": " + legSitNome(sit));
  }
  async function desfazerLegal(o) {
    var pid = S.projId, l = legalDe(G(pid), o), h = l.hist || []; if (!h.length) return;
    var ult = h[h.length - 1], ant = h[h.length - 2];
    if (!(await T.confirmar({ titulo: "Desfazer a última mudança?", texto: ORGAOS[o].nome + ": tira o registro <b>" + esc(legSitNome(ult.sit)) + "</b> de " + T.fmtYmd(T.ymd(new Date(ult.em))) + " e volta para <b>" + esc(legSitNome(ant ? ant.sit : "nao_iniciado")) + "</b>. Fica anotado no Histórico.", ok: "Desfazer", perigo: true }))) return;
    await salvar(pid, function (x) { var cur = x.leg[o]; cur.hist.pop(); cur.sit = cur.hist.length ? cur.hist[cur.hist.length - 1].sit : "nao_iniciado"; evento(x, ORGAOS[o].nome + ": desfeito o registro \"" + legSitNome(ult.sit) + "\" de " + T.fmtYmd(T.ymd(new Date(ult.em))), hojeIso(), { tipo: "etapa" }); x.legal = resumoLegal(x); });
  }
  async function marcAvancar() {
    var g = G(S.projId), m = g.marc, data = ($("gp-marc-data") || {}).value || hojeIso(), iso = isoDeData(data), et = m.etapa;
    var ok = await T.confirmar({ titulo: et === "mep" ? "Encerrar o EP da marcenaria?" : "Encerrar a marcenaria?", texto: "Registra o termo assinado em " + T.fmtYmd(data) + "." + (et === "mep" ? (g.etapa === "encerrado" ? " O Executivo da marcenaria começa em seguida." : " O Executivo da marcenaria começa quando o Executivo arquitetônico for entregue.") : ""), ok: "Registrar" });
    if (!ok) return;
    await salvar(S.projId, function (x) {
      x.etapas = x.etapas || {}; x.etapas[et] = Object.assign({}, x.etapas[et], { fim: iso, termoEm: data });
      evento(x, "Termo de " + (et === "mep" ? "Encerramento de Etapa" : "Encerramento de Projeto") + " assinado (" + ETAPAS[et].nome + ")", data, { tipo: "etapa" });
      if (et === "mep") { if (x.etapa === "encerrado") { x.marc.etapa = "mex"; x.etapas.mex = Object.assign({}, x.etapas.mex, { inicio: iso }); evento(x, "Executivo da marcenaria iniciado", data, { tipo: "etapa" }); } else x.marc.etapa = "espera"; }
      else { x.marc.etapa = "fim"; if (x.etapa === "encerrado") x.esperas = (x.esperas || []).map(function (e) { if (!e.fim) e.fim = iso; return e; }); }
    });
    var g2 = G(S.projId); if (g2.etapa === "encerrado" && !marcAberta(g2)) await statusProjeto(S.projId, "concluido");
  }
  async function marcAtivar() {
    var num = $("mc-num").value.trim(), dt = $("mc-data").value || null, parc = $("mc-parc").checked, pep = T.numOrNull($("mc-pep").value), pex = T.numOrNull($("mc-pex").value), ini = $("mc-ini").value || null;
    await salvar(S.projId, function (x) {
      var comeca = parc && (dt || ini), inicio = ini || dt || hojeIso();
      x.marc = { ativo: true, contrato: { numero: num, data: dt }, contratoOk: !!dt, parcela: parc, etapa: comeca ? "mep" : "aguardando", ativadaEm: new Date().toISOString() };
      x.etapas = x.etapas || {}; x.etapas.mep = { prazo: pep || prazoPadrao("mep") }; x.etapas.mex = { prazo: pex || prazoPadrao("mex") }; if (comeca) x.etapas.mep.inicio = isoDeData(inicio);
      evento(x, "Marcenaria contratada" + (num ? " (contrato " + num + ")" : "") + (comeca ? ": Estudo Preliminar da marcenaria iniciado em " + T.fmtYmd(inicio) : ": aguardando contrato e 1ª parcela"), dt || hojeIso(), { tipo: "etapa" });
    });
    S.modal = null; T.toast("Marcenaria ativada");
  }
  function moverItem(id, dir) {
    salvar(S.projId, function (x) {
      var it = T.byId(x.itens, id), irm = ordenar(x.itens.filter(function (y) { return y.etapa === it.etapa && y.grupo === it.grupo; }));
      irm.forEach(function (y, k) { y.ord = k + 1; });
      var o = irm[irm.indexOf(it) + dir]; if (!o) return; var t = it.ord; it.ord = o.ord; o.ord = t;
      if (it.movel && it.mob && ETAPAS[it.etapa].marc) espelharOrdem(x, it.etapa);
    });
  }
  // ---------- móveis da marcenaria: EP e Executivo vinculados (mesmo "mob"); desenhos e checklists independentes ----------
  function vinculados(g, it) { if (!it || !it.movel || !it.mob) return []; return (g.itens || []).filter(function (y) { return y.id !== it.id && y.mob === it.mob && y.movel; }); }
  function espelharOrdem(x, de) {
    var para = de === "mep" ? "mex" : "mep", gp2 = grupos(para)[0].k;
    var ordem = ordenar(x.itens.filter(function (y) { return y.etapa === de && y.movel && y.mob; })).map(function (y) { return y.mob; });
    var alvo = ordenar(x.itens.filter(function (y) { return y.etapa === para && y.grupo === gp2; }));
    var movs = alvo.filter(function (y) { return y.movel && y.mob && ordem.indexOf(y.mob) >= 0; }).sort(function (a, b) { return ordem.indexOf(a.mob) - ordem.indexOf(b.mob); });
    var resto = alvo.filter(function (y) { return movs.indexOf(y) < 0; });
    movs.concat(resto).forEach(function (y, k) { y.ord = k + 1; });
  }
  function copiaDesenhos(ds) { return (ds || []).map(function (z) { return { id: T.novoId(), nome: z.nome, feito: false, checklist: (z.checklist || []).map(function (c) { return { t: c.t, ok: false }; }), guia: z.guia || "" }; }); }
  async function usarComoModelo(id) {
    var pid = S.projId, g = G(pid), src = T.byId(g.itens, id); if (!src) return;
    var alvos = (g.itens || []).filter(function (y) { return y.etapa === src.etapa && y.movel && y.id !== src.id; }), livres = alvos.filter(function (y) { return !iniciado(y); });
    if (!livres.length) { T.toast("Não há outros móveis ainda não iniciados nesta etapa."); return; }
    if (!(await T.confirmar({ titulo: "Usar como modelo?", texto: "Os desenhos, subitens e checklists de <b>" + esc(src.titulo) + "</b> vão para os outros <b>" + livres.length + "</b> móveis do " + esc(ETAPAS[src.etapa].nome) + " (substituindo os atuais)." + (alvos.length > livres.length ? " " + (alvos.length - livres.length) + " móvel(is) já iniciado(s) ficam como estão." : "") + " Apresentação, revisão e bônus não são móveis e não mudam.", ok: "Aplicar aos móveis" }))) return;
    var antes = T.clone(g.itens), ids = livres.map(function (y) { return y.id; });
    await salvar(pid, function (x) { var s2 = T.byId(x.itens, id); x.itens.forEach(function (y) { if (ids.indexOf(y.id) >= 0) y.desenhos = copiaDesenhos(s2.desenhos); }); evento(x, "Modelo aplicado: " + s2.titulo + " → " + ids.length + " móvel(is) do " + ETAPAS[s2.etapa].nome, hojeIso(), { tipo: "plano" }); });
    T.toast("Modelo aplicado a " + ids.length + " móveis", { label: "Desfazer", fn: function () { salvar(pid, function (x) { x.itens = antes; }); } });
  }
  async function salvarComoModelo(id) {
    var g = G(S.projId), src = T.byId(g.itens, id); if (!src) return;
    if (!(await T.confirmar({ titulo: "Salvar como modelo de móvel?", texto: "Os desenhos e checklists de <b>" + esc(src.titulo) + "</b> passam a ser o modelo do " + esc(ETAPAS[src.etapa].nome) + " para os próximos móveis, em todos os projetos.", ok: "Salvar modelo" }))) return;
    var ms = Object.assign({}, S.cfg && S.cfg.modelos || {}); if (!ms.mex && S.cfg && S.cfg.modeloMovel) ms.mex = S.cfg.modeloMovel;
    ms[src.etapa] = { guia: (modelo(src.etapa) || {}).guia || "", desenhos: (src.desenhos || []).map(function (z) { return { nome: z.nome, checklist: (z.checklist || []).map(function (c) { return c.t; }) }; }), checklist: [] };
    S.cfg = Object.assign({}, S.cfg || {}, { modelos: ms });
    try { await T.db.doc("gp_config/geral").set(S.cfg); T.toast("Modelo de móvel salvo ✓"); } catch (e) { T.showError(e); }
  }
  async function atribuirEtapa(et) {
    var pid = S.projId, g = G(pid), sel = document.querySelector('[data-etresp="' + et + '"]'), pes = sel && sel.value, pe = T.pessoa(pes);
    var alvo = itensDe(g, et).filter(function (x) { return !feito(x); });
    if (!pe || !alvo.length) { T.toast("Nenhum item em aberto nesta etapa."); return; }
    if (!(await T.confirmar({ titulo: "Atribuir a etapa a " + esc(pe.nome) + "?", texto: "Os <b>" + alvo.length + "</b> itens ainda não prontos de " + esc(ETAPAS[et].nome) + " ficam com " + esc(pe.nome) + ". Depois dá para trocar item a item.", ok: "Atribuir" }))) return;
    var antes = T.clone(g.itens), ids = alvo.map(function (x) { return x.id; });
    await salvar(pid, function (x) { x.itens.forEach(function (y) { if (ids.indexOf(y.id) >= 0) y.resp = pes; }); evento(x, ETAPAS[et].nome + ": " + ids.length + " itens atribuídos a " + pe.nome, hojeIso(), { tipo: "plano" }); });
    T.toast(ids.length + " itens com " + pe.nome, { label: "Desfazer", fn: function () { salvar(pid, function (x) { x.itens = antes; }); } });
  }
  // Ações dentro do corpo do item (Plano e área da pessoa). O projeto vem de data-pid.
  function ligarCorpo(root) {
    function pidDe(t) { var w = t.closest("[data-pid]"); return w ? w.dataset.pid : S.projId; }
    function redesenhar() { T.render(); }
    function mudarDesenho(pid, a, fn) { return mudarItem(pid, a[0], function (it) { var d = T.byId(it.desenhos || [], a[1]); if (d) fn(d, it); }); }
    root.addEventListener("click", function (e) {
      var t = e.target, b; if (!t.closest(".it-body")) return;
      var pid = pidDe(t), a;
      if ((b = t.closest("[data-dopen]"))) { e.corpo = 1; S.openDes[b.dataset.dopen] = !S.openDes[b.dataset.dopen]; redesenhar(); return; }
      if ((b = t.closest("[data-dmove]"))) { e.corpo = 1; a = split(b.dataset.dmove); mudarItem(pid, a[0], function (it) { var ds = it.desenhos, k = ds.findIndex(function (z) { return z.id === a[1]; }), n = k + (+a[2]); if (k < 0 || n < 0 || n >= ds.length) return; var tmp = ds[k]; ds[k] = ds[n]; ds[n] = tmp; }); return; }
      if ((b = t.closest("[data-ddel]"))) { e.corpo = 1; a = split(b.dataset.ddel); var it = T.byId(G(pid).itens || [], a[0]), antes = T.clone(it.desenhos || []), z0 = T.byId(antes, a[1]);
        mudarItem(pid, a[0], function (it2) { it2.desenhos = it2.desenhos.filter(function (d) { return d.id !== a[1]; }); });
        T.toast("Desenho removido: " + (z0 ? z0.nome : ""), { label: "Desfazer", fn: function () { mudarItem(pid, a[0], function (it2) { it2.desenhos = antes; }); } }); return; }
      if ((b = t.closest("[data-ckmove]"))) { e.corpo = 1; a = split(b.dataset.ckmove); mudarDesenho(pid, a, function (d) { var c = d.checklist, k = +a[2], n = k + (+a[3]); if (n < 0 || n >= c.length) return; var tmp = c[k]; c[k] = c[n]; c[n] = tmp; }); return; }
      if ((b = t.closest("[data-ckdel]"))) { e.corpo = 1; a = split(b.dataset.ckdel); var it3 = T.byId(G(pid).itens || [], a[0]), dz = T.byId(it3.desenhos || [], a[1]), antesCk = T.clone(dz.checklist || []), txt = (antesCk[+a[2]] || {}).t;
        mudarDesenho(pid, a, function (d) { d.checklist.splice(+a[2], 1); });
        T.toast("Item do checklist removido: " + (txt || ""), { label: "Desfazer", fn: function () { mudarDesenho(pid, a, function (d) { d.checklist = antesCk; }); } }); return; }
    }, true);
    root.addEventListener("change", function (e) {
      var t = e.target; if (!t.closest(".it-body")) return;
      var pid = pidDe(t), a;
      if (t.dataset.iren) { e.corpo = 1; var nv = t.value.trim(); if (nv) salvar(pid, function (x) { var it = T.byId(x.itens, t.dataset.iren); if (!it) return; vinculados(x, it).forEach(function (y) { y.titulo = nv; }); it.titulo = nv; }); }
      else if (t.dataset.dfeito) { e.corpo = 1; a = split(t.dataset.dfeito); mudarDesenho(pid, a, function (d, it) { d.feito = t.checked; if (it.desenhos.some(function (z) { return z.feito; }) && it.sit === "a_fazer") it.sit = "andamento"; }); }
      else if (t.dataset.dren) { e.corpo = 1; a = split(t.dataset.dren); var nm = t.value.trim(); if (nm) mudarDesenho(pid, a, function (d) { d.nome = nm; }); }
      else if (t.dataset.ck) { e.corpo = 1; a = split(t.dataset.ck); mudarDesenho(pid, a, function (d) { if (d.checklist[+a[2]]) d.checklist[+a[2]].ok = t.checked; }); }
      else if (t.dataset.ckren) { e.corpo = 1; a = split(t.dataset.ckren); var tx = t.value.trim(); if (tx) mudarDesenho(pid, a, function (d) { if (d.checklist[+a[2]]) d.checklist[+a[2]].t = tx; }); }
      else if (t.dataset.guia) { e.corpo = 1; a = split(t.dataset.guia); mudarDesenho(pid, a, function (d) { d.guia = t.value.trim(); }); }
    }, true);
    root.addEventListener("submit", function (e) {
      var f = e.target; if (!f.closest(".it-body")) return;
      var pid = pidDe(f), a; e.preventDefault(); S.sujo = null;
      if (f.dataset.dadd) { e.corpo = 1; var nm = f.querySelector("input").value.trim(); if (nm) mudarItem(pid, f.dataset.dadd, function (it) { it.desenhos = (it.desenhos || []).concat(des([nm])); }); }
      else if (f.dataset.ckadd) { e.corpo = 1; a = split(f.dataset.ckadd); var ct = f.querySelector("input").value.trim(); if (ct) mudarDesenho(pid, a, function (d) { d.checklist.push({ t: ct, ok: false }); }); }
    }, true);
  }
  function syncPlano() {
    var g = G(S.projId), tem = {}; (g.itens || []).forEach(function (x) { if (x.ambId) tem[x.ambId + (x.banc ? "b" : "a")] = true; });
    var novas = [], amp = itensDe(g, "pe").filter(function (x) { return x.grupo === "s500"; }).length;
    (g.ambientes || []).forEach(function (a) {
      var t = tipoAmb(a.tipo);
      if (t.amp && !tem[a.id + "a"]) { amp++; novas.push(novoItem("pe", "s500", "amp" + (amp < 10 ? "0" : "") + amp + " – " + a.nome, { ambId: a.id, ord: 900 + amp })); }
      if (t.banc && !tem[a.id + "b"]) novas.push(novoItem("pe", "s700", "Bancada – " + a.nome, { ambId: a.id, banc: true, ord: 900 + novas.length }));
    });
    if (!novas.length) { T.toast("O Plano já tem todas as ampliações e bancadas do programa."); return; }
    salvar(S.projId, function (x) { x.itens = x.itens.concat(novas); evento(x, novas.length + " item(ns) incluído(s) no Executivo a partir do programa"); });
    T.toast(novas.length + (novas.length === 1 ? " item incluído" : " itens incluídos") + " no Executivo");
  }
  async function situacaoProjeto(act) {
    var pid = S.projId, p = proj(pid), msgs = {
      suspender: ["Suspender o projeto?", "O projeto sai da lista principal e o prazo fica pausado. Depois de " + SUSPENSO_ARQUIVA + " dias úteis suspenso, vai sozinho para Arquivados.", "Suspender"],
      arquivar: ["Arquivar o projeto?", "O projeto sai da lista principal e fica na aba Arquivados. Nada é apagado.", "Arquivar"],
      reativar: ["Reativar o projeto?", "O projeto volta para a lista principal e o prazo volta a contar.", "Reativar"],
      desarquivar: ["Desarquivar o projeto?", "O projeto volta para a lista principal.", "Desarquivar"] };
    var m = msgs[act]; if (!(await T.confirmar({ titulo: m[0], texto: "<b>" + esc(p.nome) + "</b>: " + m[1], ok: m[2], perigo: act === "suspender" || act === "arquivar" }))) return;
    var agora = new Date().toISOString();
    await salvar(pid, function (x) {
      if (act === "suspender") { x.suspenso = { desde: hojeIso() }; if (!esperaAberta(x)) x.esperas = (x.esperas || []).concat([{ quem: "cliente", inicio: agora, fim: null, suspenso: true }]); evento(x, "Projeto suspenso", hojeIso(), { tipo: "suspensao" }); }
      else if (act === "arquivar") { x.arquivado = { desde: hojeIso() }; evento(x, "Projeto arquivado", hojeIso(), { tipo: "arquivamento" }); }
      else { var e = esperaAberta(x); if (e) e.fim = agora; delete x.suspenso; delete x.arquivado; evento(x, act === "reativar" ? "Projeto reativado" : "Projeto desarquivado", hojeIso(), { tipo: "etapa" }); }
    });
    await statusProjeto(pid, act === "suspender" || act === "arquivar" ? "pausado" : "ativo");
    T.toast(m[2] === "Suspender" ? "Projeto suspenso" : m[2] === "Arquivar" ? "Projeto arquivado" : "Projeto de volta à lista");
  }

  // ---------- render e eventos ----------
  function render() {
    $("gp-lista").hidden = S.view !== "lista"; $("gp-proj").hidden = S.view !== "projeto"; $("gp-novo").hidden = S.view !== "novo";
    if (S.view === "lista") renderLista(); else if (S.view === "projeto") renderProjeto(); else if (S.wiz) renderNovo();
  }
  var html =
    '<div id="gp-lista"><div class="section-head"><h2 class="section-title">Projetos</h2><div class="form-actions"><input id="gp-busca" class="gp-busca" placeholder="Buscar projeto ou cliente" aria-label="Buscar"><button class="btn btn-small btn-primary" id="gp-novo-btn">+ Novo projeto</button></div></div>' +
      '<div class="card gp-resumo" id="gp-resumo"></div><div class="gp-avisos" id="gp-avisos"></div><div class="gp-etapas" id="gp-etapas"></div><div id="gp-grupos"></div></div>' +
    '<div id="gp-proj" hidden><div id="gp-p-head" class="gp-p-head"></div><div id="gp-p-body"></div></div><div id="gp-novo" hidden></div>' +
    '<div class="overlay" id="gp-overlay" hidden><div class="modal" role="dialog" aria-modal="true" id="gp-modal-box"></div></div>';

  function split(v) { return String(v).split("|"); }
  function init() {
    var v = $("view-gestor");
    $("gp-busca").addEventListener("input", function () { S.busca = this.value; renderLista(); });
    $("gp-novo-btn").addEventListener("click", function () { api.novo(); });
    // notificações abrem o projeto de qualquer tela (capa, área da pessoa, Gestor)
    document.addEventListener("click", function (e) { var b = e.target.closest("[data-gpopen]"); if (b) { api.abrir(b.dataset.gpopen); return; } b = e.target.closest("#pnotes [data-go]"); if (b) T.go("admin", b.dataset.go); });
    $("gp-overlay").addEventListener("click", function (e) {
      if (e.target === this || e.target.closest("[data-close]")) { fecharModal(); return; }
      var b = e.target.closest("[data-rnmodo]"); if (b) { e.preventDefault(); salvarReuniao(b.dataset.rnmodo); return; }
      if (e.target.closest("#tm-pdf")) { e.preventDefault(); gerarTermo(); }
    });
    $("gp-overlay").addEventListener("submit", function (e) { e.preventDefault(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("gp-overlay").hidden) fecharModal(); });
    ligarCorpo(v);
    v.addEventListener("click", async function (e) {
      var t = e.target, b, pid = S.projId;
      if (t.closest("#gp-overlay") || e.corpo) return;
      if (!t.closest("input, select, textarea, label")) S.sujo = null;
      if ((b = t.closest("[data-f]"))) { S.filtro = b.dataset.f; S.foco = null; renderLista(); return; }
      if ((b = t.closest("[data-foco]"))) { S.foco = S.foco === b.dataset.foco ? null : b.dataset.foco; renderLista(); var gr = document.querySelector(".gp-group.is-foco"); if (gr) gr.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
      if ((b = t.closest("[data-open]"))) { api.abrir(b.dataset.open); return; }
      if (t.closest("[data-voltar]")) { S.view = "lista"; render(); window.scrollTo(0, 0); return; }
      if ((b = t.closest("[data-tab]"))) { S.tab = b.dataset.tab; render(); return; }
      if ((b = t.closest("[data-pet]"))) { S.planoEtapa = b.dataset.pet; S.addGrupo = null; render(); return; }
      if ((b = t.closest("[data-itopen]"))) { S.open[b.dataset.itopen] = !S.open[b.dataset.itopen]; render(); return; }
      if ((b = t.closest("[data-addopen]"))) { S.addGrupo = b.dataset.adde + "|" + b.dataset.addopen; render(); var i = $("gp-add-in"); if (i) i.focus(); return; }
      if (t.closest("[data-addcancel]")) { S.addGrupo = null; render(); return; }
      if ((b = t.closest("[data-imove]"))) { moverItem(b.dataset.imove, +b.dataset.dir); return; }
      if ((b = t.closest("[data-idel]"))) {
        var antes = T.clone(G(pid).itens), idd = b.dataset.idel, it0 = T.byId(antes, idd), par = it0 && vinculados(G(pid), it0).map(function (y) { return y.id; }) || [];
        salvar(pid, function (x) { x.itens = x.itens.filter(function (y) { return y.id !== idd && par.indexOf(y.id) < 0; }); });
        T.toast(par.length ? "Móvel removido do EP e do Executivo" : "Item removido", { label: "Desfazer", fn: function () { salvar(pid, function (x) { x.itens = antes; }); } }); return;
      }
      if ((b = t.closest("[data-modelomob]"))) { usarComoModelo(b.dataset.modelomob); return; }
      if ((b = t.closest("[data-salvamod]"))) { salvarComoModelo(b.dataset.salvamod); return; }
      if ((b = t.closest("[data-etrespok]"))) { atribuirEtapa(b.dataset.etrespok); return; }
      if ((b = t.closest("[data-relpdf]"))) { gerarRelatorio(b.dataset.relpdf); return; }
      if ((b = t.closest("[data-tft]"))) { T.each("#tf-tipo [data-tft]", function (x) { x.classList.toggle("is-selected", x === b); }); var comp = b.dataset.tft === "compromisso"; $("tf-hora-w").hidden = !comp; $("tf-prazo-l").textContent = comp ? "Data" : "Prazo"; return; }
      if ((b = t.closest("[data-tfdel]"))) { var d2 = split(b.dataset.tfdel); if (await T.confirmar({ titulo: "Excluir a tarefa?", texto: "Ela sai da agenda da pessoa.", ok: "Excluir", perigo: true })) T.tarefas.remover(d2[0], d2[1]).then(function () { T.toast("Tarefa excluída"); }, T.showError); return; }
      if ((b = t.closest("[data-amb]"))) { S.openAmb = S.openAmb === b.dataset.amb ? null : b.dataset.amb; render(); return; }
      if ((b = t.closest("[data-ambsave]"))) { salvarAmb(b.dataset.ambsave); return; }
      if ((b = t.closest("[data-optadd]"))) { var oa = split(b.dataset.optadd); addOpcao(oa[0], oa[1]); return; }
      if ((b = t.closest("[data-npqadd]"))) { addPergunta(b.dataset.npqadd); return; }
      if ((b = t.closest("[data-ambpad]"))) { ambienteParaPadrao(b.dataset.ambpad); return; }
      if ((b = t.closest("[data-ambdel]"))) { var id = b.dataset.ambdel; if (await T.confirmar({ titulo: "Remover o ambiente?", ok: "Remover", perigo: true })) { salvar(pid, function (x) { x.ambientes = x.ambientes.filter(function (a2) { return a2.id !== id; }); }); S.openAmb = null; } return; }
      if ((b = t.closest("[data-wsig]"))) { S.wiz.sigla = b.dataset.wsig; if (!S.wiz.codManual) S.wiz.codigo = ""; S.wiz.qtd = b.dataset.wsig === "RES" ? T.clone(PADRAO_RES) : {}; if (!doZero(S.wiz.sigla) && ["ap"].indexOf(S.wiz.etapaAtual) >= 0) S.wiz.etapaAtual = "ep"; renderNovo(); return; }
      if ((b = t.closest("[data-winicio]"))) { S.wiz.inicio = b.dataset.winicio; renderNovo(); return; }
      if ((b = t.closest("[data-wstep]"))) { S.wiz.step += +b.dataset.wstep; renderNovo(); window.scrollTo(0, 0); return; }
      if (t.closest("[data-wcancel]")) { S.wiz = null; S.view = "lista"; render(); return; }
      if (t.closest("#w-criar")) { criarProjeto(); return; }
      if ((b = t.closest("[data-termo]"))) { abrirModal(modalTermo(b.dataset.termo)); return; }
      if ((b = t.closest("[data-legsit]"))) { mudarLegal(split(b.dataset.legsit)[0], split(b.dataset.legsit)[1]); return; }
      if ((b = t.closest("[data-legvolta]"))) { desfazerLegal(b.dataset.legvolta); return; }
      if ((b = t.closest("[data-rnreg]"))) { abrirModal(modalReuniao(G(pid), T.byId(G(pid).reunioes || [], b.dataset.rnreg))); return; }
      if ((b = t.closest("[data-act]"))) {
        var act = b.dataset.act;
        if (act === "avancar") avancar();
        else if (act === "marc-avancar") marcAvancar();
        else if (act === "marc-form") { S.modal = "marc-ativar"; render(); }
        else if (act === "marc-cancel") { S.modal = null; render(); }
        else if (act === "marc-iniciar") salvar(pid, function (x) { x.marc.etapa = "mep"; x.etapas = x.etapas || {}; x.etapas.mep = Object.assign({}, x.etapas.mep, { inicio: new Date().toISOString() }); evento(x, "Estudo Preliminar da marcenaria iniciado (contrato e 1ª parcela ok)", hojeIso(), { tipo: "etapa" }); });
        else if (act === "modelo") { S.editModelo = !S.editModelo; render(); }
        else if (act === "reuniao") abrirModal(modalReuniao(G(pid)));
        else if (act === "aguardar") {
          var tr = b.dataset.tr || "arq", quem = document.querySelector('[data-quem="' + tr + '"]').value, prev = document.querySelector('[data-previsto="' + tr + '"]').value || null, mot = document.querySelector('[data-motivo="' + tr + '"]').value.trim(), nomeTr = tr === "marc" ? "Marcenaria" : "Arquitetura";
          if (quem === "interna" && !mot) { T.toast("Escreva o motivo da pausa interna."); document.querySelector('[data-motivo="' + tr + '"]').focus(); return; }
          salvar(pid, function (x) { x.esperas = x.esperas || []; x.esperas.push({ trilha: tr, quem: quem, inicio: new Date().toISOString(), fim: null, previsto: prev, motivo: mot || null }); evento(x, nomeTr + ": " + (quem === "interna" ? "pausa interna" + (mot ? " (" + mot + ")" : "") : "aguardando " + nomeQuem(quem) + (mot ? " (" + mot + ")" : "")) + " · prazo pausado", hojeIso(), { tipo: "espera" }); });
        }
        else if (act === "retomar") { var tr2 = b.dataset.tr || "arq"; salvar(pid, function (x) { var e2 = esperaAberta(x, tr2); if (e2) { e2.fim = new Date().toISOString(); evento(x, (tr2 === "marc" ? "Marcenaria" : "Arquitetura") + ": retomado após " + du(e2.inicio, new Date()) + " d.u. " + (e2.quem === "interna" ? "em pausa interna" : "aguardando " + nomeQuem(e2.quem)), hojeIso(), { tipo: "espera" }); } }); }
        else if (["suspender", "arquivar", "reativar", "desarquivar"].indexOf(act) >= 0) situacaoProjeto(act);
        else if (act === "sync-plano") syncPlano();
        else if (act === "cad-edit") { if (T.cadastros && T.cadastros.editarProjeto) T.cadastros.editarProjeto(pid); }
      }
    });
    v.addEventListener("change", function (e) {
      var t = e.target, pid = S.projId, a;
      if (t.closest("#gp-overlay") || e.corpo) return;
      if (t.id === "gp-fase") salvar(pid, function (x) { x.fase = +t.value; evento(x, ETAPAS[x.etapa].nome + ": fase " + t.value + " · " + ETAPAS[x.etapa].fases[+t.value - 1], hojeIso(), { tipo: "etapa" }); });
      else if (t.id === "gp-proximo") salvar(pid, function (x) { x.proximo = t.value.trim(); });
      else if (t.id === "gp-mproximo") salvar(pid, function (x) { x.marc.proximo = t.value.trim(); });
      else if (t.id === "gp-legal") salvar(pid, function (x) { x.legal = t.value; evento(x, "Projeto Legal: " + (LEGAL.filter(function (o) { return o[0] === t.value; })[0] || [0, t.value])[1], hojeIso(), { tipo: "etapa" }); });
      else if (t.id === "gp-pend") { S.pendentes = t.checked; render(); }
      else if (t.dataset.marco) salvar(pid, function (x) { x.marco = x.marco || {}; x.marco[t.dataset.marco] = t.checked; if (t.checked) evento(x, "Marco zero: " + MARCO.filter(function (m) { return m[0] === t.dataset.marco; })[0][1].toLowerCase(), hojeIso(), { tipo: "etapa" }); });
      else if (t.dataset.marcmarco) salvar(pid, function (x) { if (t.dataset.marcmarco === "contrato") x.marc.contratoOk = t.checked; else x.marc.parcela = t.checked; });
      else if (t.dataset.iresp != null) mudarItem(pid, t.dataset.iresp, function (it) { it.resp = t.value || null; });
      else if (t.dataset.isit) mudarItem(pid, t.dataset.isit, function (it) { it.sit = t.value; if (feito(it)) (it.desenhos || []).forEach(function (d) { d.feito = true; }); });
      else if (t.dataset.iprio != null) mudarItem(pid, t.dataset.iprio, function (it) { it.prio = t.value ? +t.value : null; });
      else if (t.dataset.iprazo != null) mudarItem(pid, t.dataset.iprazo, function (it) { it.prazo = t.value || null; });
      else if (t.dataset.tfdone) { a = split(t.dataset.tfdone); T.tarefas.concluir(a[0], a[1], t.checked).catch(T.showError); }
      else if (t.dataset.tfmv) { a = split(t.dataset.tfmv); T.tarefas.mover(a[0], t.value, a[1]).then(function () { T.toast("Tarefa enviada para " + (T.pessoa(t.value) || {}).nome); }, T.showError); }
      else if (t.dataset.wcli) { var ids = S.wiz.clienteIds, i = ids.indexOf(t.dataset.wcli); if (t.checked && i < 0) ids.push(t.dataset.wcli); if (!t.checked && i >= 0) ids.splice(i, 1); }
      else if (t.id === "w-npav") { var n = Math.max(1, Math.min(12, +t.value || 1)); S.wiz.npav = n; var ps = S.wiz.pavs.slice(0, n); while (ps.length < n) ps.push(ps.length === 0 ? "Térreo" : n === 2 ? "Superior" : ps.length + "º pavimento"); S.wiz.pavs = ps; renderNovo(); }
      else if (t.id === "w-et") { S.wiz.etapaAtual = t.value; S.wiz.fase = 1; renderNovo(); }
      else if (t.dataset.w) S.wiz[t.dataset.w] = t.value;
    });
    function marcaSujo(e) { var t = e.target; if (S.view === "projeto" && t.closest("#gp-p-body") && t.closest("form, .amb-ed")) S.sujo = S.projId + "|" + S.tab; }
    v.addEventListener("input", marcaSujo);
    v.addEventListener("change", marcaSujo);
    v.addEventListener("input", function (e) {
      var t = e.target; if (!S.wiz || t.closest("#gp-overlay")) return;
      if (t.dataset.w) { S.wiz[t.dataset.w] = t.value; if (t.dataset.w === "codigo") S.wiz.codManual = true; if (t.dataset.w === "nome" && !S.wiz.codManual) { S.wiz.codigo = codigoDe(S.wiz.sigla, t.value); var c = $("w-cod"); if (c) c.value = S.wiz.codigo; } }
      else if (t.dataset.wn) S.wiz.novoCli[t.dataset.wn] = t.value;
      else if (t.dataset.wpav != null) S.wiz.pavs[+t.dataset.wpav] = t.value;
      else if (t.dataset.wq) { S.wiz.qtd[t.dataset.wq] = +t.value || 0; previewWiz(); }
      else if (t.dataset.wa) { S.wiz.areas[t.dataset.wa] = t.value === "" ? "" : +t.value; previewWiz(); }
    });
    v.addEventListener("submit", function (e) {
      var f = e.target, pid = S.projId, a; e.preventDefault();
      if (f.closest("#gp-overlay") || e.corpo) return;
      if (["gp-info", "gp-cfg", "gp-pavs-form"].indexOf(f.id) < 0) S.sujo = null;
      if (f.dataset.addg) {
        var tit = f.querySelector("#gp-add-in").value.trim(); if (!tit) return; var gk = f.dataset.addg, et = f.dataset.adde, usaMod = $("gp-add-mod") && $("gp-add-mod").checked;
        salvar(pid, function (x) {
          var n = x.itens.filter(function (y) { return y.etapa === et && y.grupo === gk; }).length;
          if (usaMod && ETAPAS[et].marc) {
            var mob = T.novoId(), outra = et === "mep" ? "mex" : "mep", go = grupos(outra)[0].k, n2 = x.itens.filter(function (y) { return y.etapa === outra && y.grupo === go; }).length;
            x.itens.push(novoMovel(et, gk, tit, { ord: 1000 + n, mob: mob }), novoMovel(outra, go, tit, { ord: 1000 + n2, mob: mob }));
          } else x.itens.push(usaMod ? novoMovel(et, gk, tit, { ord: 1000 + n }) : novoItem(et, gk, tit, { ord: 1000 + n })); if (ETAPAS[et].marc || ["briefing", "abertura"].indexOf(x.etapa) < 0) evento(x, "Item incluído no Plano: " + tit + " (" + ETAPAS[et].curto + ")", hojeIso(), { tipo: "plano" }); });
        S.addGrupo = null; return;
      }
      if (f.id === "gp-tf-form") {
        var txt = $("tf-txt").value.trim(), resp = $("tf-resp").value; if (!txt || !resp) return;
        var tipo = (document.querySelector("#tf-tipo .is-selected") || {}).dataset.tft || "tarefa";
        T.tarefas.criar(resp, { title: txt, subdivision: tipo, dueDate: $("tf-prazo").value || null, dueTime: tipo === "compromisso" ? $("tf-hora").value || null : null, projetoId: pid, itemId: $("tf-it").value || null })
          .then(function () { T.toast("Tarefa enviada para " + (T.pessoa(resp) || {}).nome); }, T.showError);
        return;
      }
      if (f.id === "gp-amb-add") { var g = G(pid), am = novoAmbiente($("amb-tipo").value, { pav: (g.pavs || [])[0] || null }); salvar(pid, function (x) { x.ambientes = (x.ambientes || []).concat([am]); }); S.openAmb = am.id; return; }
      if (f.id === "marc-form") { marcAtivar(); return; }
      if (f.id === "modelo-form") { salvarModelo(); return; }
      if (f.id === "gp-info") salvarInfo();
      if (f.id === "gp-cfg") salvarConfig();
      if (f.id === "gp-pavs-form") salvarPavs();
    });
  }
  async function salvarModelo() {
    var ck = $("md-ck").value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean), guia = $("md-guia").value.trim();
    var ms = { mep: lerModelo($("md-mep").value, [], guia), mex: lerModelo($("md-des").value, ck, guia) };
    S.sujo = null;
    await T.saveWith($("md-save"), async function () { S.cfg = Object.assign({}, S.cfg || {}, { modelos: ms }); await T.db.doc("gp_config/geral").set(S.cfg); });
  }
  function salvarAmb(id) {
    var ed = document.querySelector('[data-ambed="' + id + '"]'); if (!ed) return;
    S.sujo = null;
    salvar(S.projId, function (x) {
      var a = T.byId(x.ambientes, id); if (!a) return;
      lerEditorAmb(a, ed);
      if (x.etapa !== "abertura") evento(x, "Ambiente alterado: " + a.nome + " (" + ETAPAS[x.etapa].nome + ")", hojeIso(), { tipo: "plano" });
    });
    S.openAmb = null; T.toast("Ambiente salvo");
  }
  // ---------- pavimentos × Plano ----------
  // Itens que dependem do pavimento (título terminando em " – <pavimento>") e onde nascem.
  var PAV_MODELOS = [
    { e: "ep", gr: "ep-apres", t: "Planta – ", depois: /^Implantação|^Planta – / },
    { e: "ap", gr: "s100", t: "Planta baixa – ", depois: /^Implantação|^Planta baixa – / },
    { e: "ap", gr: "s400", t: "Piso e acabamento – ", depois: /^Topografia|^Piso e acabamento – / },
    { e: "ap", gr: "s400", t: "Hidrossanitário – ", depois: /^Piso e acabamento – |^Hidrossanitário – / },
    { e: "ap", gr: "s400", t: "Elétrica – ", depois: /^Hidrossanitário – |^Elétrica – / },
    { e: "ap", gr: "s400", t: "Forro e iluminação – ", depois: /^Elétrica – |^Forro e iluminação – / },
    { e: "pl", gr: "pl-cond", t: "Planta – ", depois: /^Situação|^Planta de cobertura|^Planta – / },
    { e: "pl", gr: "pl-pref", t: "Planta – ", depois: /^Situação|^Planta de cobertura|^Planta – / },
    { e: "pe", gr: "s100", t: "Planta baixa – ", depois: /^Implantação|^Planta baixa – / },
    { e: "pe", gr: "s400", t: "Piso e acabamento – ", depois: /^Topografia|^Piso e acabamento – / },
    { e: "pe", gr: "s400", t: "Hidrossanitário – ", depois: /^Piso e acabamento – |^Hidrossanitário – / },
    { e: "pe", gr: "s400", t: "Elétrica – ", depois: /^Hidrossanitário – |^Elétrica – / },
    { e: "pe", gr: "s400", t: "Forro e iluminação – ", depois: /^Elétrica – |^Forro e iluminação – / },
    { e: "pe", gr: "s700", t: "Planta de marmoraria – ", depois: /^Planta de marmoraria – /, soComGrupo: true }
  ];
  function etapaAberta(x, e) {
    if (x.etapa === "encerrado") return false;
    if (e === "pl") return temLegal(x) && !legalAprovado(x);
    var f = fluxo(x.sigla); return f.indexOf(e) >= f.indexOf(x.etapa) && f.indexOf(e) >= 0;
  }
  function doPav(it, pav) { return it.titulo.slice(-(pav.length + 3)) === " – " + pav; }
  function iniciado(it) { return it.sit !== "a_fazer" || (it.desenhos || []).some(function (d) { return d.feito || (d.checklist || []).some(function (c) { return c.ok; }); }); }
  // Pavimentos comparados pela posição: nome diferente = renomear; a mais = incluir; a menos = retirar.
  function mudancaPavs(g, antes, depois) {
    var saem = antes.slice(depois.length), remover = [], ficam = 0;
    saem.forEach(function (pv) { (g.itens || []).forEach(function (it) { if (doPav(it, pv)) { if (iniciado(it)) ficam++; else remover.push(it.id); } }); });
    return { saem: saem, remover: remover, ficam: ficam };
  }
  function aplicarPavs(x, antes, depois) {
    var mudou = [], i;
    for (i = 0; i < Math.min(antes.length, depois.length); i++) if (antes[i] !== depois[i]) {
      var de = antes[i], para = depois[i];
      (x.itens || []).forEach(function (it) {
        if (doPav(it, de)) it.titulo = it.titulo.slice(0, -de.length) + para;
        (it.desenhos || []).forEach(function (d) { if (d.nome.slice(-(de.length + 3)) === " – " + de) d.nome = d.nome.slice(0, -de.length) + para; });
      });
      (x.ambientes || []).forEach(function (a) { if (a.pav === de) a.pav = para; });
      mudou.push(de + " → " + para);
    }
    var novos = depois.slice(antes.length), saem = antes.slice(depois.length), incl = 0, tirados = 0;
    novos.forEach(function (pv) {
      PAV_MODELOS.forEach(function (m) {
        if (!etapaAberta(x, m.e)) return;
        var irmaos = ordenar((x.itens || []).filter(function (it) { return it.etapa === m.e && it.grupo === m.gr; }));
        if (m.soComGrupo && !irmaos.length) return;
        if (m.e === "pl" && !irmaos.length) return;
        var ultimo = null; irmaos.forEach(function (it) { if (m.depois.test(it.titulo)) ultimo = it; });
        var novo = novoItem(m.e, m.gr, m.t + pv), pos = ultimo ? irmaos.indexOf(ultimo) + 1 : irmaos.length;
        irmaos.splice(pos, 0, novo); irmaos.forEach(function (it, k) { it.ord = k + 1; });
        x.itens.push(novo); incl++;
      });
    });
    saem.forEach(function (pv) {
      var antesN = x.itens.length;
      x.itens = x.itens.filter(function (it) { return !(doPav(it, pv) && !iniciado(it)); });
      tirados += antesN - x.itens.length;
      (x.ambientes || []).forEach(function (a) { if (a.pav === pv) a.pav = null; });
    });
    x.pavs = depois.slice();
    var txt = [];
    if (mudou.length) txt.push("renomeado(s): " + mudou.join(", "));
    if (novos.length) txt.push("incluído(s): " + novos.join(", ") + " (" + incl + " itens no Plano)");
    if (saem.length) txt.push("retirado(s): " + saem.join(", ") + " (" + tirados + " itens saíram do Plano)");
    if (txt.length) evento(x, "Pavimentos " + txt.join("; "), hojeIso(), { tipo: "plano" });
  }

  var api = T.gestor = {
    abrir: function (pid) { if (T.state.view !== "admin" || T.state.sub !== "gestor") T.go("admin", "gestor"); S.view = "projeto"; S.projId = pid; S.tab = "geral"; S.openAmb = null; S.planoEtapa = null; render(); window.scrollTo(0, 0); },
    novo: function (pj) { if (T.state.view !== "admin" || T.state.sub !== "gestor") T.go("admin", "gestor"); S.wiz = wizInicial(pj); S.view = "novo"; render(); window.scrollTo(0, 0); },
    // Excluir: só pelo Cadastros (com confirmação lá). Remove o processo do Gestor; as horas continuam no Tempo.
    excluir: async function (pid) { await T.db.doc("gp/" + pid).delete(); delete S.gp[pid]; if (S.projId === pid) { S.view = "lista"; S.projId = null; } },
    corpoItem: corpoItem, ligarCorpo: ligarCorpo, iniciado: iniciado,
    pct: function (pid) { var g = G(pid); return g ? pctProjeto(g) : null; }, pctMarc: function (pid) { var g = G(pid); return g ? pctMarc(g) : null; },
    gp: G, etapaNome: function (pid) { var g = G(pid); return g ? etapaLinha(g) : ""; }, situacao: function (pid) { var g = G(pid); return g ? situacao(g) : null; },
    codigos: codigos, ordenar: ordenar, sitNome: sitNome, SIT: SIT, feito: feito, mudarItem: mudarItem, salvar: salvar, etapas: ETAPAS, etapasPlano: etapasPlano, grupos: grupos, desenhosProg: desenhosProg, ativo: ativo,
    itensParaTempo: function (pid, etapaTempo) {
      var g = G(pid); if (!g || !etapaTempo) return [];
      var ets = etapasPlano(g).filter(function (e) { return (ETAPAS[e].tempo || []).indexOf(etapaTempo) >= 0; }), cod = codigos(g), out = [];
      ets.forEach(function (e) { ordenar(itensDe(g, e)).forEach(function (x) { if (!feito(x)) out.push({ id: x.id, rotulo: (ets.length > 1 ? ETAPAS[e].curto + " · " : "") + (cod[x.id] ? cod[x.id] + " · " : "") + x.titulo }); }); });
      return out;
    }
  };

  T.register({
    id: "gestor", label: "Gestor de Projetos", area: "admin", html: html, init: init, render: render,
    icon: '<path d="M4 5h16"/><path d="M4 12h10"/><path d="M4 19h6"/><circle cx="18" cy="17" r="3"/>',
    desc: function () { var n = projetosGestor().filter(function (p) { var g = G(p.id); return ativo(g) && (g.etapa !== "encerrado" || marcAberta(g)); }).length; return n ? n + (n === 1 ? " projeto em andamento" : " projetos em andamento") : "Etapas, plano e prazos de cada projeto"; },
    connect: function (db) {
      db.collection("gp").onSnapshot(function (s) { var m = {}; s.docs.forEach(function (d) { m[d.id] = normalizar(T.clone(d.data())); }); S.gp = m; if (!s.metadata || !s.metadata.fromCache) S.loaded = true; T.loaded("gp", s); T.scheduleRender(); }, T.onErr);
      db.doc("gp_config/geral").onSnapshot(function (d) { S.cfg = d.exists ? T.clone(d.data()) : null; T.scheduleRender(); }, T.onErr);
      db.doc("fin_config/geral").onSnapshot(function (d) { S.fin = d.exists ? d.data() : null; }, function () {});
    },
    notes: function (pessoaId) {
      var av = avisos(pessoaId || null); if (!av.length) return null;
      return '<div class="note gp-note"><div class="gp-note-h"><div class="note-title">Gestor de Projetos</div><button class="btn btn-small" data-go="gestor">Abrir</button></div><div class="gp-avisos">' + av.map(avisoHtml).join("") + "</div></div>";
    }
  });
})();
