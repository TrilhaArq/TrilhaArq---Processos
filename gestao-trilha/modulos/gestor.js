/* Módulo Gestor de Projetos — processo de projeto: etapas e portões, Plano de Projeto (itens com desenhos,
 * checklists, prazo, prioridade e situação), tarefas ligadas à agenda das pessoas, programa de necessidades.
 * Dados: gp/<projetoId> (um documento por projeto). Dados básicos em projetos/<id> (núcleo).
 * Regras: manual-trilha/MAPEAMENTO.md, processo-trilha.json e AJUSTES-TESTE.md. Expõe Trilha.gestor. */
(function () {
  "use strict";
  var T = window.Trilha, $ = T.$, esc = T.esc;

  // ---------- processo ----------
  var SIGLAS = [["RES", "Residencial"], ["COM", "Comercial"], ["HOT", "Hotelaria"], ["REF", "Reforma"], ["INT", "Interiores"]];
  var TIPO_ANTIGO = { RES: "res", COM: "comr", HOT: "hot", REF: "ref", INT: "int" };
  var ETAPAS = {
    briefing: { nome: "Briefing" },
    abertura: { nome: "Abertura", tempo: "ep" },
    ep: { nome: "Estudo Preliminar", prazo: 40, tempo: "ep", termo: "Termo de Encerramento de Etapa" },
    ap: { nome: "Anteprojeto", prazo: 70, tempo: "ap", termo: "Termo de Encerramento de Etapa", fases: ["Revisão e lançamentos", "Compatibilização", "Definições"] },
    pl: { nome: "Projeto Legal", tempo: "pl" },
    pe: { nome: "Projeto Executivo", prazo: 60, tempo: "ex", termo: "Termo de Encerramento de Projeto", fases: ["Desenhos base", "Mapeamentos e detalhamento"] },
    encerrado: { nome: "Encerrado" }
  };
  function doZero(sigla) { return !(sigla === "REF" || sigla === "INT"); }
  function fluxo(sigla) { return doZero(sigla) ? ["briefing", "abertura", "ep", "ap", "pe", "encerrado"] : ["briefing", "abertura", "ep", "pe", "encerrado"]; }
  function temLegal(g) { return g.legal && g.legal !== "nao_se_aplica"; }
  function etapasPlano(g) { var e = ["abertura", "ep"]; if (doZero(g.sigla)) e.push("ap"); if (temLegal(g)) e.push("pl"); e.push("pe"); return e; }
  var LEGAL = [["nao_iniciado", "Não iniciado"], ["em_preparo", "Em preparo"], ["protocolado", "Protocolado"], ["aprovado", "Aprovado"], ["nao_se_aplica", "Não se aplica"]];
  var SIT = [["a_fazer", "A fazer"], ["andamento", "Em andamento"], ["revisao", "Revisão interna"], ["pronto", "Pronto"], ["entregue", "Entregue"]];
  var QUEM = [["cliente", "cliente"], ["engenheiro", "engenheiro"], ["condominio", "condomínio"], ["prefeitura", "prefeitura"]];
  var TIPOS_TAREFA = [["tarefa", "Tarefa"], ["demanda", "Demanda"], ["prioridade", "Prioridade"], ["compromisso", "Compromisso"]];
  var PADRAO = [["medio", "Médio (R$ 3.000–3.500/m²)"], ["medio_alto", "Médio Alto (R$ 3.500–4.500/m²)"], ["alto_1", "Alto (R$ 4.500–5.500/m²)"], ["alto_2", "Alto (R$ 5.500–7.000/m²)"], ["luxo", "Luxo (acima de R$ 7.000/m²)"]];
  var DIMENSAO = [["compacta", "Compacta"], ["confortavel", "Confortável"], ["espacosa", "Espaçosa"]];
  var DIFICULDADE = [["baixa", "Baixa"], ["normal", "Normal"], ["dificil", "Difícil"], ["muito_dificil", "Muito difícil"]];
  var MARCO = [["contrato", "Contrato assinado"], ["parcela", "1ª parcela paga"], ["topografico", "Topográfico entregue"], ["documentos", "Documentos do cliente"]];

  // Grupos do Plano de Projeto por etapa. cod: "serie" (série + posição), "AP"/"PL" (sigla + posição) ou nenhum.
  var SERIES = { 100: "Implantação, plantas e cobertura", 200: "Cortes", 300: "Elevações", 400: "Mapeamentos", 500: "Ampliações", 600: "Esquadrias", 700: "Marmoraria", 800: "Detalhamentos construtivos", 900: "Marcenaria", 1000: "Documentos" };
  function grupos(etapa) {
    function serie(n) { return { k: "s" + n, n: n + " · " + SERIES[n], cod: "serie", serie: n }; }
    if (etapa === "abertura") return [{ k: "abertura", n: "Abertura do projeto" }];
    if (etapa === "ep") return [{ k: "ep-estudos", n: "Estudos e concepção" }, { k: "ep-apres", n: "Material da apresentação", cod: "AP" }, { k: "ep-entrega", n: "Apresentação e aprovação" }];
    if (etapa === "ap") return [100, 200, 300, 400].map(serie).concat([{ k: "ap-comp", n: "Complementares" }, { k: "ap-def", n: "Definições com o cliente" }, { k: "ap-fecha", n: "Encerramento do Anteprojeto" }]);
    if (etapa === "pl") return [{ k: "pl-pranchas", n: "Pranchas de aprovação", cod: "PL" }, { k: "pl-tramite", n: "Aprovação" }];
    if (etapa === "pe") return [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map(serie).concat([{ k: "pe-fecha", n: "Fechamento e entrega" }]);
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
  function tipoAmb(id) { return T.byId(CATALOGO, id) || T.byId(CATALOGO, "outro"); }

  // ---------- estado ----------
  var S = { gp: {}, view: "lista", projId: null, tab: "geral", filtro: "todos", busca: "", planoEtapa: null, pendentes: false, open: {}, openDes: {}, addGrupo: null, openAmb: null, wiz: null, confirmDel: null };

  // ---------- datas: dias úteis ----------
  function dia(d) { d = new Date(d); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function du(a, b) { var x = dia(a), y = dia(b), n = 0; while (x < y) { x.setDate(x.getDate() + 1); var w = x.getDay(); if (w && w < 6) n++; } return n; }
  function somaDu(n, base) { var x = dia(base || new Date()), passo = n < 0 ? -1 : 1; n = Math.abs(n); while (n > 0) { x.setDate(x.getDate() + passo); var w = x.getDay(); if (w && w < 6) n--; } return x; }
  function voltaDu(n) { return somaDu(-n); }
  function hojeIso() { return T.ymd(new Date()); }

  // ---------- leitura ----------
  function G(pid) { return S.gp[pid] || null; }
  function proj(pid) { return T.projeto(pid) || { id: pid, nome: "Projeto removido" }; }
  function projetosGestor() { return T.state.projetos.filter(function (p) { return !!S.gp[p.id]; }); }
  function clientesNomes(p) {
    var nomes = (p.clienteIds || []).map(function (id) { var c = T.cadastros && T.cadastros.contato(id); return c ? c.nome : null; }).filter(Boolean);
    return nomes.length ? nomes.join(" e ") : (p.cliente || "");
  }
  function esperaAberta(g) { var e = (g.esperas || []).filter(function (x) { return !x.fim; }); return e[e.length - 1] || null; }
  function prazoInfo(g) {
    var et = ETAPAS[g.etapa], info = g.etapas && g.etapas[g.etapa];
    if (!et || !et.prazo || !info || !info.inicio) return null;
    var ini = new Date(info.inicio), agora = new Date(), pausa = 0;
    (g.esperas || []).forEach(function (e) { var s = new Date(Math.max(ini, new Date(e.inicio))), f = e.fim ? new Date(e.fim) : agora; if (f > s) pausa += du(s, f); });
    var usados = Math.max(0, du(ini, agora) - pausa), resta = et.prazo - usados;
    return { usados: usados, prazo: et.prazo, resta: resta, pausado: !!esperaAberta(g), fim: somaDu(resta), pct: Math.min(100, Math.round(usados / et.prazo * 100)) };
  }
  function corPrazo(pct) { return pct < 30 ? "ok" : pct < 60 ? "mid" : "late"; }
  function nomeQuem(q) { var x = QUEM.filter(function (o) { return o[0] === q; })[0]; return x ? x[1] : q; }
  function situacao(g) {
    if (g.etapa === "encerrado") return { k: "fim", txt: "Encerrado" };
    if (g.suspenso) return { k: "bad", txt: "Suspenso desde " + T.fmtYmd(g.suspenso.desde) };
    var e = esperaAberta(g);
    if (e) { var d = du(e.inicio, new Date()); return { k: e.quem === "cliente" && d >= 15 ? "bad" : "wait", txt: "Aguardando " + nomeQuem(e.quem) + " · " + d + " d.u.", dias: d, quem: e.quem }; }
    var pz = prazoInfo(g);
    if (pz && pz.resta < 0) return { k: "bad", txt: "Prazo vencido há " + (-pz.resta) + " d.u." };
    return { k: "ok", txt: "Em dia" };
  }
  function itensDe(g, etapa) { return (g.itens || []).filter(function (x) { return !etapa || x.etapa === etapa; }); }
  function feito(x) { return x.sit === "pronto" || x.sit === "entregue"; }
  function prontos(list) { return list.filter(feito).length; }
  function pctProjeto(g) { var it = itensDe(g); return it.length ? Math.round(prontos(it) / it.length * 100) : 0; }
  function marco(g, k) { if (k === "topografico" || k === "documentos") { var it = itensDe(g, "abertura").filter(function (x) { return x.chave === k; })[0]; if (it) return feito(it); } return !!(g.marco || {})[k]; }
  function horasProj(pid) { if (!T.tempo) return 0; var min = 0; T.tempo.lancAtivos().forEach(function (l) { if (l.tipo === "projeto" && l.alvoId === pid) min += l.min; }); return min; }
  function ordenar(list) { return list.slice().sort(function (a, b) { return (a.ord || 0) - (b.ord || 0); }); }
  function codigos(g) {
    var out = {};
    etapasPlano(g).forEach(function (et) {
      grupos(et).forEach(function (gr) {
        if (!gr.cod) return;
        ordenar(itensDe(g, et).filter(function (x) { return x.grupo === gr.k; })).forEach(function (x, i) { out[x.id] = gr.cod === "serie" ? String(gr.serie + i + 1) : gr.cod + (i < 9 ? "0" : "") + (i + 1); });
      });
    });
    return out;
  }
  function sitNome(k) { var x = SIT.filter(function (o) { return o[0] === k; })[0]; return x ? x[1] : k; }

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
    ["Revisão interna", "Reunião de apresentação", "Rodada de ajustes 1", "Rodada de ajustes 2", "Termo de Encerramento de Etapa assinado"].forEach(function (t) { add("ep", "ep-entrega", t); });
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
      ["Revisão interna", "Reunião final com o cliente", "Termo de Encerramento de Etapa assinado"].forEach(function (t) { add("ap", "ap-fecha", t); });
    }
    if (legal) {
      ["Situação / implantação", "Planta de cobertura"].concat(pavs.map(function (p) { return "Planta – " + p; })).concat(["Plantas de áreas", "Corte longitudinal", "Corte transversal"]).forEach(function (t) { add("pl", "pl-pranchas", t); });
      ["Organizar documentos do cliente", "Aprovação no condomínio", "Protocolo na prefeitura", "Atender exigências", "Aprovação / alvará"].forEach(function (t) { add("pl", "pl-tramite", t); });
    }
    base("pe");
    var amp = 0, bancadas = [];
    (o.ambientes || []).forEach(function (a) { var t = tipoAmb(a.tipo); if (t.amp) { amp++; add("pe", "s500", "amp" + (amp < 10 ? "0" : "") + amp + " – " + a.nome, { ambId: a.id }); } if (t.banc) bancadas.push(a); });
    ["Esquadrias de alumínio e vidro", "Esquadrias de madeira", "Guarda-corpo e corrimão"].forEach(function (t) { add("pe", "s600", t); });
    if (bancadas.length) { pavs.forEach(function (p) { add("pe", "s700", "Planta de marmoraria – " + p); }); bancadas.forEach(function (a) { add("pe", "s700", "Bancada – " + a.nome, { ambId: a.id, banc: true }); }); }
    add("pe", "s800", "Detalhe construtivo (exemplo)");
    if (o.marcenaria) pavs.forEach(function (p) { add("pe", "s900", "Mapa de marcenaria – " + p); });
    ["Terraplenagem", "Revestimentos: especificação e quantitativo", "Louças e metais", "Equipamentos", "Tomadas e interruptores", "Iluminação"].forEach(function (t) { add("pe", "s1000", t); });
    ["Revisão final das pranchas", "Guia de Projeto", "Imagens renderizadas atualizadas", "Modelo BIMx atualizado", "Reunião de entrega (abrir as pranchas)", "Termo de Encerramento de Projeto assinado", "Entrega física"].forEach(function (t) { add("pe", "pe-fecha", t); });
    var ord = {}; out.forEach(function (x) { var k = x.etapa + x.grupo; ord[k] = (ord[k] || 0) + 1; x.ord = ord[k]; });
    return out;
  }
  function novoAmbiente(tipo, extra) { var t = tipoAmb(tipo); return Object.assign({ id: T.novoId(), tipo: t.id, nome: t.n, setor: t.s, pav: null, qtd: 1, area: t.a, cfg: {}, obs: "", origem: "cadastro" }, extra || {}); }
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
  function mudarItem(pid, id, fn) { return salvar(pid, function (x) { var it = T.byId(x.itens || [], id); if (it) fn(it, x); }); }
  function evento(g, txt, data) { g.eventos = g.eventos || []; g.eventos.push({ data: data || hojeIso(), txt: txt }); }

  // ---------- componentes ----------
  function trilha(g) { var f = fluxo(g.sigla), i = f.indexOf(g.etapa); return '<span class="gp-trail">' + f.map(function (e, k) { return '<i class="' + (k < i ? "on" : k === i ? "cur" : "") + '"></i>'; }).join("") + "</span>"; }
  function sitPill(g) { var s = situacao(g); return '<span class="gp-sit ' + s.k + '">' + esc(s.txt) + "</span>"; }
  function avatarPessoa(id, small) { var p = T.pessoa(id); return p ? '<span class="avatar' + (small ? " av-s" : "") + '" title="' + esc(p.nome) + '">' + esc(p.nome.charAt(0)) + "</span>" : ""; }
  function optPessoas(sel, vazio) { return (vazio != null ? '<option value="">' + esc(vazio) + "</option>" : "") + T.pessoasAtivas().map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === sel ? " selected" : "") + ">" + esc(p.nome) + "</option>"; }).join(""); }
  function etapaLinha(g) { var et = ETAPAS[g.etapa] || {}; return esc(et.nome || "") + (et.fases && g.fase ? " · fase " + g.fase : ""); }
  function barraPrazo(pz) {
    if (!pz) return '<div class="gp-pbar none"><i style="width:0"></i></div>';
    return '<div class="gp-pbar ' + corPrazo(pz.pct) + (pz.pausado ? " paused" : "") + '" title="' + pz.usados + " de " + pz.prazo + " dias úteis" + (pz.pausado ? " · pausado" : "") + '"><i style="width:' + pz.pct + '%"></i></div>';
  }
  function prioSel(it, attr) { return '<select class="prio-sel p' + (it.prio || 0) + '" ' + attr + '="' + it.id + '" aria-label="Prioridade" title="Prioridade">' + T.optHtml([["", "P–"], ["1", "P1"], ["2", "P2"], ["3", "P3"]], it.prio || "") + "</select>"; }
  function sitSel(it, attr) { return '<select class="sit-sel s-' + it.sit + '" ' + attr + '="' + it.id + '" aria-label="Situação">' + T.optHtml(SIT, it.sit) + "</select>"; }
  function desenhosProg(it) { var d = it.desenhos || []; if (!d.length) return ""; var f = d.filter(function (x) { return x.feito; }).length; return '<span class="it-prog" title="Desenhos concluídos"><span class="mini"><i style="width:' + Math.round(f / d.length * 100) + '%"></i></span>' + f + "/" + d.length + "</span>"; }

  // ---------- lista (visão geral de todos) ----------
  function avisos() {
    var out = [];
    projetosGestor().forEach(function (p) {
      var g = G(p.id); if (g.etapa === "encerrado") return;
      var s = situacao(g), nome = "<b>" + esc(p.codigo || p.nome) + "</b>";
      if (s.quem === "cliente" && s.dias >= 20) out.push(["bad", nome + " aguarda o cliente há " + s.dias + " dias úteis. Pela regra, o projeto vai para suspenso.", p.id]);
      else if (s.quem === "cliente" && s.dias >= 15) out.push(["warn", nome + " aguarda o cliente há " + s.dias + " dias úteis · suspende em " + (20 - s.dias), p.id]);
      if (g.etapa === "briefing" && marco(g, "contrato") && marco(g, "parcela")) out.push(["ok", nome + ": contrato e 1ª parcela ok. Pronto para a Abertura", p.id]);
      var pz = prazoInfo(g); if (pz && !pz.pausado && pz.resta >= 0 && pz.resta <= 5) out.push(["warn", nome + ": faltam " + pz.resta + " d.u. no prazo de " + ETAPAS[g.etapa].nome, p.id]);
      var ie = itensDe(g, g.etapa); if (ie.length && prontos(ie) === ie.length && g.etapa !== "abertura") out.push(["ok", nome + ": todos os itens da etapa prontos. Pronto para o termo", p.id]);
    });
    return out;
  }
  function cardProjeto(p) {
    var g = G(p.id), it = itensDe(g), pz = prazoInfo(g), h = horasProj(p.id), pct = pctProjeto(g);
    var legal = temLegal(g) && ["ap", "pe"].indexOf(g.etapa) >= 0 ? '<div class="gp-legal">Legal: ' + esc((LEGAL.filter(function (o) { return o[0] === g.legal; })[0] || ["", ""])[1]) + "</div>" : "";
    return '<button class="tile-btn gp-card" data-open="' + esc(p.id) + '">' +
      '<div class="gp-vbar" title="Projeto ' + pct + '% concluído"><i style="height:' + pct + '%"></i><b>' + pct + "%</b></div>" +
      '<div class="gp-card-main"><div class="gp-top"><span class="gp-sig">' + esc(g.sigla || "") + '</span><div class="gp-names"><div class="gp-name">' + esc(p.nome) + '</div><div class="gp-clients">' + esc(clientesNomes(p) || "Sem cliente") + "</div></div>" + avatarPessoa(g.resp, true) + "</div>" +
      '<div class="gp-etapa">' + trilha(g) + "<span>" + etapaLinha(g) + "</span></div>" + sitPill(g) +
      '<div class="gp-next">' + (g.proximo ? "Próximo: " + esc(g.proximo) : '<span class="muted">Sem próximo passo definido</span>') + "</div>" + legal +
      '<div class="tile-stats"><div><small>Plano</small><b>' + (it.length ? prontos(it) + "/" + it.length : "—") + "</b></div>" +
      "<div><small>Prazo</small><b>" + (pz ? (pz.pausado ? "pausado" : pz.resta >= 0 ? pz.resta + " d.u." : "vencido") : "—") + "</b></div>" +
      "<div><small>Horas</small><b>" + (h ? T.fmtH(h) : "—") + "</b></div></div>" +
      '<div class="gp-prazo-row"><span class="num">' + (pz ? T.fmtYmd(T.ymd(pz.fim)) : "sem prazo") + "</span>" + barraPrazo(pz) + "</div></div></button>";
  }
  function renderLista() {
    var list = projetosGestor(), q = S.busca.trim().toLowerCase();
    if (q) list = list.filter(function (p) { return (p.nome + " " + (p.codigo || "") + " " + clientesNomes(p)).toLowerCase().indexOf(q) >= 0; });
    list = list.filter(function (p) { var g = G(p.id), s = situacao(g); if (S.filtro === "aguardando") return !!s.quem; if (S.filtro === "suspensos") return !!g.suspenso; return true; });
    var todos = projetosGestor(), n = { and: 0, ag: 0, sus: 0, prop: 0 };
    todos.forEach(function (p) { var g = G(p.id); if (g.etapa === "encerrado") return; if (g.etapa === "briefing") n.prop++; else n.and++; if (g.suspenso) n.sus++; else if (esperaAberta(g)) n.ag++; });
    $("gp-resumo").innerHTML = [["Em andamento", n.and], ["Aguardando", n.ag], ["Suspensos", n.sus], ["Em proposta", n.prop]].map(function (x) { return '<div class="tile"><small>' + x[0] + "</small><b>" + x[1] + "</b></div>"; }).join("");
    $("gp-avisos").innerHTML = avisos().map(function (a) { return '<button class="gp-aviso ' + a[0] + '" data-open="' + esc(a[2]) + '">' + a[1] + "</button>"; }).join("");
    var gr = [["briefing", "Em proposta · Briefing"], ["abertura", "Abertura"], ["ep", "Estudo Preliminar"], ["ap", "Anteprojeto"], ["pe", "Projeto Executivo"]];
    function urg(p) { var s = situacao(G(p.id)); return s.k === "bad" ? 0 : s.k === "wait" ? 1 : 2; }
    var html = gr.map(function (x) {
      var itens = list.filter(function (p) { return G(p.id).etapa === x[0]; }).sort(function (a, b) { return urg(a) - urg(b) || a.nome.localeCompare(b.nome); });
      return itens.length ? '<div class="gp-group"><h3 class="cover-label">' + esc(x[1]) + " · " + itens.length + '</h3><div class="gp-cards">' + itens.map(cardProjeto).join("") + "</div></div>" : "";
    }).join("");
    var enc = list.filter(function (p) { return G(p.id).etapa === "encerrado"; });
    if (enc.length) html += '<details class="gp-group"><summary class="cover-label">Encerrados · ' + enc.length + '</summary><div class="gp-cards">' + enc.map(cardProjeto).join("") + "</div></details>";
    if (!todos.length) html = '<div class="card gp-empty"><h3 class="panel-title">Nenhum projeto no Gestor ainda</h3><p>Crie o primeiro projeto com “+ Novo projeto”, ou carregue os projetos de exemplo para ver o app funcionando.</p><div class="form-actions"><button class="btn btn-primary" id="gp-seed">Carregar projetos de exemplo</button></div></div>';
    else if (!html) html = '<div class="empty">Nenhum projeto neste filtro.</div>';
    $("gp-grupos").innerHTML = html;
  }

  // ---------- painel do projeto ----------
  var ABAS = [["geral", "Visão geral"], ["plano", "Plano de Projeto"], ["tarefas", "Tarefas"], ["programa", "Programa"], ["ficha", "Ficha"]];
  function renderProjeto() {
    var p = proj(S.projId), g = G(S.projId);
    if (!g) { S.view = "lista"; return render(); }
    var pct = pctProjeto(g);
    $("gp-p-head").innerHTML = '<button class="link" data-voltar="1">← Todos os projetos</button>' +
      '<div class="gp-p-title"><span class="gp-sig">' + esc(g.sigla) + '</span><div><h2 class="gp-name gp-p-name">' + esc(p.nome) + '</h2><div class="section-meta">' + esc(p.codigo || "") + " · " + esc(clientesNomes(p) || "sem cliente") + "</div></div>" + sitPill(g) + "</div>" +
      '<div class="segmented gp-abas">' + ABAS.map(function (a) { return '<button class="seg-pill' + (S.tab === a[0] ? " is-selected" : "") + '" data-tab="' + a[0] + '">' + a[1] + "</button>"; }).join("") + "</div>" +
      '<div class="gp-hprog" title="Itens do Plano de Projeto concluídos"><span>Projeto concluído</span><div class="gp-hbar"><i style="width:' + pct + '%"></i></div><b class="num">' + pct + "%</b></div>";
    $("gp-p-body").innerHTML = S.tab === "plano" ? abaPlano(g) : S.tab === "tarefas" ? abaTarefas(g) : S.tab === "programa" ? abaPrograma(g, p) : S.tab === "ficha" ? abaFicha(g, p) : abaGeral(g, p);
  }
  function abaGeral(g, p) {
    var f = fluxo(g.sigla), i = f.indexOf(g.etapa), et = ETAPAS[g.etapa] || {};
    var steps = '<div class="gp-steps">' + f.map(function (e, k) {
      var info = (g.etapas || {})[e] || {}, cls = k < i ? "done" : k === i ? "cur" : "";
      var sub = k < i ? (info.termoEm ? "termo " + T.fmtYmd(info.termoEm) : "concluída") : k === i ? "em curso" : "";
      return '<div class="gp-step ' + cls + '"><i>' + (k < i ? "✓" : k + 1) + "</i><b>" + esc(ETAPAS[e].nome) + "</b><small>" + esc(sub) + "</small></div>";
    }).join("") + "</div>";
    var pz = prazoInfo(g), ie = itensDe(g, g.etapa);
    var numeros = '<div class="tiles gp-nums gp-nums4"><div class="tile"><small>Prazo da etapa</small><b>' + (pz ? pz.usados + " / " + pz.prazo + " d.u." : "—") + "</b><span>" + (pz ? (pz.pausado ? "pausado" : pz.resta >= 0 ? "restam " + pz.resta : "vencido") : "sem prazo nesta etapa") + "</span></div>" +
      '<div class="tile"><small>Data final</small><b>' + (pz ? T.fmtYmd(T.ymd(pz.fim)) : "—") + "</b><span>" + (pz ? (pz.pausado ? "avança enquanto pausado" : "em dias úteis") : "") + "</span></div>" +
      '<div class="tile"><small>Itens da etapa</small><b>' + (ie.length ? prontos(ie) + " / " + ie.length : "—") + "</b><span>prontos</span></div>" +
      '<div class="tile"><small>Horas no projeto</small><b>' + T.fmtH(horasProj(p.id)) + "</b><span>pelo cronômetro</span></div></div>" +
      '<div class="gp-prazo-full">' + barraPrazo(pz) + "</div>";
    var fase = et.fases ? '<div class="field"><label for="gp-fase">Fase</label><select id="gp-fase">' + et.fases.map(function (n, k) { return '<option value="' + (k + 1) + '"' + (+g.fase === k + 1 ? " selected" : "") + ">" + (k + 1) + " · " + esc(n) + "</option>"; }).join("") + "</select></div>" : "";
    var e = esperaAberta(g);
    var sit = '<div class="card gp-box"><h3 class="panel-title">Situação</h3>' +
      (g.suspenso ? "<p>Suspenso desde " + T.fmtYmd(g.suspenso.desde) + '. Sai da lista de prioridades até ser reativado.</p><div class="form-actions"><button class="btn btn-small btn-primary" data-act="reativar">Reativar projeto</button></div>' :
        e ? "<p>Aguardando <b>" + esc(nomeQuem(e.quem)) + "</b> desde " + T.fmtYmd(e.inicio) + (e.previsto ? " · retorno previsto " + T.fmtYmd(e.previsto) : "") + '. O prazo está pausado.</p><div class="form-actions"><button class="btn btn-small btn-primary" data-act="retomar">Retomou: voltar a em dia</button>' + (e.quem === "cliente" ? '<button class="btn btn-small" data-act="suspender">Suspender</button>' : "") + "</div>" :
          '<p class="hint">Em dia. Marque quando o projeto parar esperando alguém de fora da Trilha: o prazo pausa sozinho.</p><div class="gp-wait-form"><select id="gp-quem">' + QUEM.map(function (q) { return '<option value="' + q[0] + '">Aguardando ' + q[1] + "</option>"; }).join("") + '</select><input type="date" id="gp-previsto" title="Retorno previsto (opcional)"><button class="btn btn-small" data-act="aguardar">Marcar</button></div>') + "</div>";
    var legal = doZero(g.sigla) ? '<div class="card gp-box"><h3 class="panel-title">Projeto Legal</h3><select id="gp-legal">' + T.optHtml(LEGAL, g.legal) + '</select><p class="hint">Corre em paralelo ao Anteprojeto. O Executivo só abre com o Legal aprovado.</p></div>' : "";
    var marcoBox = g.etapa === "briefing" || g.etapa === "abertura" ? '<div class="card gp-box"><h3 class="panel-title">Marco zero</h3>' + MARCO.map(function (m) {
      var auto = m[0] === "topografico" || m[0] === "documentos";
      return '<label class="gp-check"><input type="checkbox" data-marco="' + m[0] + '"' + (marco(g, m[0]) ? " checked" : "") + (auto ? " disabled" : "") + "> " + esc(m[1]) + (auto ? ' <span class="hint">(pela Abertura)</span>' : "") + "</label>";
    }).join("") + '<p class="hint">Pelo contrato, o prazo começa com contrato, 1ª parcela e topográfico.</p></div>' : "";
    return steps + numeros + '<div class="gp-cols"><div class="card gp-box"><h3 class="panel-title">' + esc(et.nome || "") + "</h3>" + fase +
      '<div class="field"><label for="gp-proximo">Próximo passo</label><input id="gp-proximo" value="' + esc(g.proximo || "") + '" placeholder="Ex.: apresentar o Estudo Preliminar"></div>' +
      '<div class="field"><label for="gp-resp">Responsável pelo projeto</label><select id="gp-resp">' + optPessoas(g.resp, "Sem responsável") + "</select></div>" +
      (g.etapa === "encerrado" ? '<p class="hint">Projeto encerrado. Obras e acompanhamento ficam no futuro app de obra.</p>' : blocoAvanco(g)) + "</div>" +
      '<div class="gp-side">' + sit + legal + marcoBox + "</div></div>" + historico(g);
  }
  function blocoAvanco(g) {
    var f = fluxo(g.sigla), prox = f[f.indexOf(g.etapa) + 1], falta = [], bloqueio = false, rotulo;
    if (g.etapa === "briefing") { rotulo = "Projeto contratado: iniciar a Abertura"; if (!marco(g, "contrato")) falta.push("contrato assinado"); if (!marco(g, "parcela")) falta.push("1ª parcela paga"); }
    else if (g.etapa === "abertura") { rotulo = "Base pronta: iniciar o Estudo Preliminar (marco zero)"; if (!marco(g, "topografico")) falta.push("topográfico"); var ab = itensDe(g, "abertura"); if (prontos(ab) < ab.length) falta.push((ab.length - prontos(ab)) + " item(ns) da Abertura"); }
    else { rotulo = "Registrar " + ETAPAS[g.etapa].termo + (prox === "encerrado" ? "" : " e abrir " + ETAPAS[prox].nome); if (prox === "pe" && temLegal(g) && g.legal !== "aprovado") { falta.push("Projeto Legal aprovado"); bloqueio = true; } }
    var txt = falta.length ? '<p class="hint warn">Falta: ' + esc(falta.join(", ")) + ".</p>" : "";
    if (bloqueio) return '<div class="gp-avanco">' + txt + '<p class="hint">O Executivo só abre com o Projeto Legal aprovado. Sem exceção.</p></div>';
    var antecip = falta.length ? '<label class="gp-check"><input type="checkbox" id="gp-antecipa"> Antecipação autorizada pela direção, com Termo de Ciência assinado pelo cliente</label>' : "";
    return '<div class="gp-avanco">' + txt + antecip + '<div class="form-actions"><input type="date" id="gp-termo-data" value="' + hojeIso() + '" aria-label="Data"><button class="btn btn-primary btn-small" data-act="avancar">' + esc(rotulo) + "</button></div></div>";
  }
  function historico(g) { var ev = (g.eventos || []).slice(-8).reverse(); return ev.length ? '<div class="card gp-box"><h3 class="panel-title">Registro</h3><ul class="gp-log">' + ev.map(function (x) { return "<li><span>" + T.fmtYmd(x.data) + "</span>" + esc(x.txt) + "</li>"; }).join("") + "</ul></div>" : ""; }

  // ---------- Plano de Projeto ----------
  function etapaPlanoPadrao(g) { var e = g.etapa === "briefing" ? "abertura" : g.etapa === "encerrado" ? "pe" : g.etapa; return etapasPlano(g).indexOf(e) >= 0 ? e : "abertura"; }
  function abaPlano(g) {
    var ets = etapasPlano(g), et = ets.indexOf(S.planoEtapa) >= 0 ? S.planoEtapa : etapaPlanoPadrao(g), cod = codigos(g);
    S.planoEtapa = et;
    var tabs = '<div class="gp-etabs">' + ets.map(function (e) { var l = itensDe(g, e); return '<button class="gp-etab' + (e === et ? " is-selected" : "") + (e === g.etapa ? " is-cur" : "") + '" data-pet="' + e + '"><b>' + esc(ETAPAS[e].nome) + "</b><small>" + prontos(l) + "/" + l.length + "</small></button>"; }).join("") + "</div>";
    var tool = '<div class="section-head"><div class="section-meta">Clique no nome para abrir desenhos e checklists. Os números das pranchas seguem a posição na série.</div><label class="gp-check"><input type="checkbox" id="gp-pend"' + (S.pendentes ? " checked" : "") + "> Só pendentes</label></div>";
    var html = grupos(et).map(function (gr) {
      var todos = ordenar(itensDe(g, et).filter(function (x) { return x.grupo === gr.k; }));
      var vis = S.pendentes ? todos.filter(function (x) { return !feito(x); }) : todos;
      if (!todos.length && gr.serie === 900) return '<div class="gp-serie"><div class="gp-serie-h"><b>' + esc(gr.n) + '</b><span class="hint">só quando a marcenaria for contratada</span><button class="link" data-add900="1">+ Ativar série</button></div></div>';
      var add = S.addGrupo === et + "|" + gr.k ? '<form class="pr-add" data-addg="' + gr.k + '"><input id="gp-add-in" placeholder="Nome do item" aria-label="Nome do novo item"><button class="btn btn-small btn-primary">Adicionar</button><button type="button" class="btn btn-small" data-addcancel="1">Cancelar</button></form>' : '<button class="gp-add-btn" data-addopen="' + gr.k + '">+ Adicionar item</button>';
      return '<div class="gp-serie"><div class="gp-serie-h"><b>' + esc(gr.n) + '</b><span class="hint">' + prontos(todos) + "/" + todos.length + ' prontos</span><span class="mini gp-gprog"><i style="width:' + (todos.length ? Math.round(prontos(todos) / todos.length * 100) : 0) + '%"></i></span></div>' +
        vis.map(function (x) { return linhaItem(x, cod[x.id], todos); }).join("") + add + "</div>";
    }).join("");
    return tabs + tool + html;
  }
  function linhaItem(x, codigo, irmaos) {
    var k = irmaos.indexOf(x), open = !!S.open[x.id], atras = x.prazo && x.prazo < hojeIso() && !feito(x);
    var row = '<div class="it-row' + (x.prio ? " prio-" + x.prio : "") + (open ? " open" : "") + (feito(x) ? " is-done" : "") + '">' +
      '<span class="it-cod num">' + esc(codigo || "·") + "</span>" +
      '<button class="it-tit" data-itopen="' + x.id + '"><span class="car">' + (open ? "▾" : "▸") + "</span>" + esc(x.titulo) + (x.rev ? ' <em class="pr-et">' + esc(x.rev) + "</em>" : "") + desenhosProg(x) + "</button>" +
      '<input type="date" class="it-prazo' + (atras ? " late" : "") + '" data-iprazo="' + x.id + '" value="' + (x.prazo || "") + '" aria-label="Prazo" title="Prazo">' +
      '<select class="pr-resp" data-iresp="' + x.id + '" aria-label="Responsável">' + optPessoas(x.resp, "—") + "</select>" +
      sitSel(x, "data-isit") + prioSel(x, "data-iprio") +
      '<span class="pr-act"><button class="link" data-imove="' + x.id + '" data-dir="-1"' + (k === 0 ? " disabled" : "") + ' aria-label="Subir">↑</button><button class="link" data-imove="' + x.id + '" data-dir="1"' + (k === irmaos.length - 1 ? " disabled" : "") + ' aria-label="Descer">↓</button><button class="link danger" data-idel="' + x.id + '" aria-label="Remover">✕</button></span></div>';
    if (!open) return row;
    var d = (x.desenhos || []).map(function (z) {
      var ck = z.checklist || [], okc = ck.filter(function (c) { return c.ok; }).length, od = !!S.openDes[z.id];
      return '<div class="ds-row' + (z.feito ? " is-done" : "") + '"><input type="checkbox" data-dfeito="' + x.id + "|" + z.id + '"' + (z.feito ? " checked" : "") + ' aria-label="Desenho concluído">' +
        '<button class="ds-n" data-dopen="' + z.id + '">' + esc(z.nome) + "</button>" +
        '<span class="hint">' + (ck.length ? "checklist " + okc + "/" + ck.length : "sem checklist") + "</span>" +
        (z.guia ? '<a class="link" href="' + esc(z.guia) + '" target="_blank" rel="noopener">Guia ↗</a>' : "") +
        '<button class="link danger" data-ddel="' + x.id + "|" + z.id + '" aria-label="Remover desenho">✕</button></div>' +
        (od ? '<div class="ds-ck">' + ck.map(function (c, i) { return '<label class="gp-check"><input type="checkbox" data-ck="' + x.id + "|" + z.id + "|" + i + '"' + (c.ok ? " checked" : "") + "> " + esc(c.t) + "</label>"; }).join("") +
          '<form class="pr-add" data-ckadd="' + x.id + "|" + z.id + '"><input placeholder="+ item do checklist" aria-label="Novo item do checklist"><button class="btn btn-small">Adicionar</button></form>' +
          '<div class="gp-wait-form"><input class="gp-guia" data-guia="' + x.id + "|" + z.id + '" value="' + esc(z.guia || "") + '" placeholder="Link do PDF-guia deste desenho (procedimento)" aria-label="Link do guia"></div></div>' : "");
    }).join("");
    return row + '<div class="it-body"><div class="gp-wait-form"><input class="gp-guia" data-iren="' + x.id + '" value="' + esc(x.titulo) + '" aria-label="Nome do item"><span class="hint">Nome do item</span></div>' +
      '<div class="ds-list">' + (d || '<div class="hint">Nenhum desenho ou subitem.</div>') + "</div>" +
      '<form class="pr-add" data-dadd="' + x.id + '"><input placeholder="+ desenho / subitem" aria-label="Novo desenho"><button class="btn btn-small">Adicionar</button></form></div>';
  }

  // ---------- Tarefas (moram na agenda de cada pessoa, com projetoId) ----------
  function tarefasDoProjeto(pid) {
    var out = [], docs = T.tarefas ? T.tarefas.todas() : {};
    Object.keys(docs).forEach(function (pes) { (docs[pes] || []).forEach(function (t) { if (t.projetoId === pid) out.push({ pes: pes, t: t }); }); });
    return out.sort(function (a, b) { return (a.t.status === "done") - (b.t.status === "done") || String(a.t.dueDate || "9").localeCompare(String(b.t.dueDate || "9")); });
  }
  function abaTarefas(g) {
    if (!T.tarefas) return '<div class="empty">O módulo Tarefas não está disponível.</div>';
    var cod = codigos(g), itens = etapasPlano(g).reduce(function (a, e) { return a.concat(ordenar(itensDe(g, e))); }, []);
    var form = '<form class="card gp-box grid-form" id="gp-tf-form"><div class="col-12 segmented" id="tf-tipo">' + TIPOS_TAREFA.map(function (t, k) { return '<button type="button" class="seg-pill' + (k === 0 ? " is-selected" : "") + '" data-tft="' + t[0] + '">' + t[1] + "</button>"; }).join("") + "</div>" +
      '<div class="field col-6"><label for="tf-txt">Tarefa</label><input id="tf-txt" required placeholder="Ex.: ajustar layout da suíte após reunião"></div>' +
      '<div class="field col-3"><label for="tf-resp">Responsável</label><select id="tf-resp" required>' + optPessoas(g.resp || (T.pessoasAtivas()[0] || {}).id) + "</select></div>" +
      '<div class="field col-3"><label for="tf-prazo" id="tf-prazo-l">Prazo</label><input type="date" id="tf-prazo"></div>' +
      '<div class="field col-3" id="tf-hora-w" hidden><label for="tf-hora">Horário</label><input type="time" id="tf-hora"></div>' +
      '<div class="field col-9"><label for="tf-it">Item do Plano de Projeto (opcional)</label><select id="tf-it"><option value="">Sem item</option>' + itens.map(function (x) { return '<option value="' + x.id + '">' + esc(ETAPAS[x.etapa].nome + " · " + (cod[x.id] ? cod[x.id] + " " : "") + x.titulo) + "</option>"; }).join("") + "</select></div>" +
      '<div class="col-12 form-actions"><button class="btn btn-primary">Adicionar tarefa</button><span class="hint">A tarefa vai para a aba Tarefas da pessoa responsável. Compromissos com data vão para a Agenda Google.</span></div></form>';
    var hoje = hojeIso(), lista = tarefasDoProjeto(S.projId);
    var html = lista.length ? lista.map(function (o) {
      var t = o.t, done = t.status === "done", atras = !done && t.dueDate && t.dueDate < hoje, it = t.itemId ? T.byId(g.itens || [], t.itemId) : null;
      return '<div class="task' + (done ? " is-done" : "") + (t.subdivision === "prioridade" ? " prio" : "") + '"><div class="task-top"><input type="checkbox" class="task-check" data-tfdone="' + esc(o.pes) + "|" + t.id + '"' + (done ? " checked" : "") + ' aria-label="Concluir"><div class="task-main"><div class="task-title-row"><span class="task-title">' + esc(t.title) + '</span><button class="link danger" data-tfdel="' + esc(o.pes) + "|" + t.id + '" aria-label="Excluir">✕</button></div>' +
        '<div class="task-badges"><span class="badge static">' + esc((TIPOS_TAREFA.filter(function (x) { return x[0] === t.subdivision; })[0] || ["", "Tarefa"])[1]) + '</span><select class="pr-resp tf-mv" data-tfmv="' + esc(o.pes) + "|" + t.id + '" aria-label="Responsável">' + optPessoas(o.pes) + "</select>" +
        (t.dueDate ? '<span class="badge static' + (atras ? " is-overdue" : "") + '">' + T.fmtYmd(t.dueDate) + (t.dueTime ? " " + t.dueTime : "") + (atras ? " · atrasada" : "") + "</span>" : "") + (it ? '<span class="badge static">' + esc((cod[it.id] ? cod[it.id] + " · " : "") + it.titulo) + "</span>" : "") + "</div></div></div></div>";
    }).join("") : '<div class="empty">Nenhuma tarefa deste projeto.</div>';
    return form + '<div class="task-list">' + html + "</div>";
  }

  // ---------- Programa ----------
  function abaPrograma(g, p) {
    var amb = g.ambientes || [], pavs = g.pavs || ["Térreo"], dim = (p.categorias || {}).dimensao || "confortavel", tot = 0, porSetor = {};
    amb.forEach(function (a) { var ar = (+a.area || 0) * (+a.qtd || 1); tot += ar; porSetor[a.setor] = (porSetor[a.setor] || 0) + ar; });
    var resumo = '<div class="tiles gp-nums">' + SETORES.filter(function (s) { return porSetor[s[0]]; }).map(function (s) { return '<div class="tile"><small>' + s[1] + "</small><b>" + T.fmtNum(porSetor[s[0]]) + " m²</b></div>"; }).join("") +
      '<div class="tile"><small>Total estimado</small><b>' + T.fmtNum(tot * 1.2) + " m²</b><span>" + T.fmtNum(tot) + " m² + 10% circulação + 10% paredes</span></div></div>";
    var add = '<form class="pr-add" id="gp-amb-add"><select id="amb-tipo" aria-label="Tipo de ambiente">' + CATALOGO.map(function (t) { return '<option value="' + t.id + '">' + esc(t.n) + "</option>"; }).join("") + '</select><button class="btn btn-small">+ Ambiente</button><button type="button" class="btn btn-small" data-act="sync-plano">Atualizar o Plano pelo programa</button></form>';
    var html = SETORES.map(function (s) {
      var itens = amb.filter(function (a) { return a.setor === s[0]; }); if (!itens.length) return "";
      return '<div class="gp-serie"><div class="gp-serie-h"><b>' + s[1] + "</b></div>" + itens.map(function (a) {
        var t = tipoAmb(a.tipo), open = S.openAmb === a.id;
        return '<div class="amb' + (open ? " open" : "") + '"><button class="amb-row" data-amb="' + a.id + '"><span class="amb-n">' + esc(a.nome) + (a.qtd > 1 ? " ×" + a.qtd : "") + '</span><span class="amb-m">' + esc(a.pav || "—") + " · " + (a.area != null ? T.fmtNum(a.area) + " m²" : "área a definir") + (t.amp ? " · ampliação" : "") + '</span><span class="amb-c">' + esc(resumoConfig(a) || "Sem configuração") + "</span></button>" + (open ? editorAmb(a, t, pavs) : "") + "</div>";
      }).join("") + "</div>";
    }).join("") || '<div class="empty">Programa vazio. Adicione os ambientes do projeto.</div>';
    return '<div class="section-head"><div class="section-meta">Dimensão: <b>' + esc((DIMENSAO.filter(function (d) { return d[0] === dim; })[0] || ["", "—"])[1]) + "</b> · áreas de referência do catálogo (Confortável). Clique num ambiente para ver e editar a configuração.</div></div>" + resumo + add + html;
  }
  function resumoConfig(a) {
    var c = a.cfg || {}, t = tipoAmb(a.tipo);
    return (t.c || []).map(function (k) { var v = c[k], d = CAMPOS[k]; if (v == null || v === "" || (Array.isArray(v) && !v.length) || v === false) return null; if (d.t === "bool") return d.l; if (Array.isArray(v)) return d.l + ": " + v.join(", "); return d.l + ": " + v; }).filter(Boolean).join(" · ");
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
    return '<div class="amb-ed grid-form" data-ambed="' + a.id + '"><div class="field col-4"><label for="ae-nome">Nome</label><input id="ae-nome" data-af="nome" value="' + esc(a.nome) + '"></div>' +
      '<div class="field col-3"><label for="ae-pav">Pavimento</label><select id="ae-pav" data-af="pav"><option value="">—</option>' + pavs.map(function (p) { return "<option" + (a.pav === p ? " selected" : "") + ">" + esc(p) + "</option>"; }).join("") + "</select></div>" +
      '<div class="field col-2"><label for="ae-qtd">Qtd.</label><input id="ae-qtd" type="number" min="1" data-af="qtd" value="' + (a.qtd || 1) + '"></div>' +
      '<div class="field col-3"><label for="ae-area">Área (m²)</label><input id="ae-area" type="number" min="0" step="0.5" data-af="area" value="' + (a.area != null ? a.area : "") + '"></div>' + campos +
      '<div class="field col-12"><label for="ae-obs">Pedido do cliente / observações</label><textarea id="ae-obs" rows="2" data-af="obs">' + esc(a.obs || "") + "</textarea></div>" +
      '<div class="col-12 form-actions"><button class="btn btn-small btn-primary" data-ambsave="' + a.id + '">Salvar ambiente</button><button class="link danger" data-ambdel="' + a.id + '">Remover ambiente</button></div></div>';
  }

  // ---------- Ficha ----------
  function abaFicha(g, p) {
    var cat = p.categorias || {}, dir = g.diretrizes || {}, clientes = T.cadastros ? T.cadastros.contatos("cliente") : [];
    var cl = clientes.length ? clientes.map(function (c) { return '<label class="gp-check"><input type="checkbox" data-fcli="' + esc(c.id) + '"' + ((p.clienteIds || []).indexOf(c.id) >= 0 ? " checked" : "") + "> " + esc(c.nome) + "</label>"; }).join("") : '<span class="hint">Nenhum cliente cadastrado. Cadastre em Cadastros → Contatos.</span>';
    function sel(id, opts, v) { return '<select id="' + id + '">' + T.optHtml([["", "—"]].concat(opts), v || "") + "</select>"; }
    function ta(k, l) { return '<div class="field col-6"><label for="fd-' + k + '">' + l + '</label><textarea id="fd-' + k + '" rows="3">' + esc(dir[k] || "") + "</textarea></div>"; }
    return '<form class="card gp-box grid-form" id="gp-ficha"><div class="field col-6"><label for="f-nome">Nome do projeto</label><input id="f-nome" value="' + esc(p.nome) + '" required></div>' +
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
  function wizInicial() { return { step: 1, sigla: "RES", nome: "", codigo: "", codManual: false, clienteIds: [], novoCli: { nome: "", contato: "", email: "" }, padrao: "", dimensao: "confortavel", dificuldade: "", npav: 1, pavs: ["Térreo"], marcenaria: false, resp: T.pessoasAtivas()[0] ? T.pessoasAtivas()[0].id : null, qtd: T.clone(PADRAO_RES) }; }
  function codigoDe(sigla, nome) { return sigla + "-" + String(nome || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, ""); }
  function renderNovo() {
    var w = S.wiz, h = '<div class="card gp-box"><div class="gp-wiz-steps">' + ["Projeto e cliente", "Pavimentos", "Programa de necessidades"].map(function (n, k) { return '<span class="' + (w.step === k + 1 ? "cur" : w.step > k + 1 ? "done" : "") + '">' + (k + 1) + " · " + n + "</span>"; }).join("") + "</div>";
    if (w.step === 1) {
      var clientes = T.cadastros ? T.cadastros.contatos("cliente") : [];
      h += '<div class="grid-form"><div class="field col-12"><span class="label">Tipo</span><div class="segmented">' + SIGLAS.map(function (s) { return '<button type="button" class="seg-pill' + (w.sigla === s[0] ? " is-selected" : "") + '" data-wsig="' + s[0] + '">' + s[0] + " · " + s[1] + "</button>"; }).join("") + "</div></div>" +
        '<div class="field col-6"><label for="w-nome">Nome do projeto</label><input id="w-nome" data-w="nome" value="' + esc(w.nome) + '" placeholder="Ex.: Casa Duarte"></div>' +
        '<div class="field col-6"><label for="w-cod">Código</label><input id="w-cod" data-w="codigo" value="' + esc(w.codigo || codigoDe(w.sigla, w.nome)) + '"><span class="hint">Sigla + nome, sem acentos. Pode ajustar.</span></div>' +
        '<div class="field col-12"><span class="label">Clientes cadastrados</span><div class="gp-multi">' + (clientes.length ? clientes.map(function (c) { return '<label class="gp-check"><input type="checkbox" data-wcli="' + esc(c.id) + '"' + (w.clienteIds.indexOf(c.id) >= 0 ? " checked" : "") + "> " + esc(c.nome) + "</label>"; }).join("") : '<span class="hint">Nenhum cliente cadastrado ainda.</span>') + "</div></div>" +
        '<div class="field col-4"><label for="w-cn">+ Novo cliente: nome</label><input id="w-cn" data-wn="nome" value="' + esc(w.novoCli.nome) + '"></div><div class="field col-4"><label for="w-cc">Contato</label><input id="w-cc" data-wn="contato" value="' + esc(w.novoCli.contato) + '"></div><div class="field col-4"><label for="w-ce">E-mail</label><input id="w-ce" data-wn="email" value="' + esc(w.novoCli.email) + '"></div>' +
        '<div class="field col-4"><label for="w-pad">Padrão</label><select id="w-pad" data-w="padrao">' + T.optHtml([["", "—"]].concat(PADRAO), w.padrao) + '</select></div><div class="field col-4"><label for="w-dim">Dimensão</label><select id="w-dim" data-w="dimensao">' + T.optHtml(DIMENSAO, w.dimensao) + '</select></div><div class="field col-4"><label for="w-dif">Dificuldade do terreno</label><select id="w-dif" data-w="dificuldade">' + T.optHtml([["", "A definir após a visita"]].concat(DIFICULDADE), w.dificuldade) + "</select></div></div>";
    } else if (w.step === 2) {
      h += '<div class="grid-form"><div class="field col-3"><label for="w-npav">Pavimentos</label><input id="w-npav" type="number" min="1" max="12" value="' + w.npav + '"></div><div class="field col-9"><span class="label">Nome de cada pavimento</span><div class="gp-pavs">' + w.pavs.map(function (p, k) { return '<input data-wpav="' + k + '" value="' + esc(p) + '" aria-label="Pavimento ' + (k + 1) + '">'; }).join("") + "</div></div>" +
        '<div class="field col-6"><label for="w-resp">Responsável</label><select id="w-resp" data-w="resp">' + optPessoas(w.resp, "—") + '</select></div><div class="col-6" style="align-self:end"><label class="gp-check"><input type="checkbox" id="w-marc"' + (w.marcenaria ? " checked" : "") + "> Marcenaria contratada</label></div></div>";
    } else {
      h += '<p class="hint">Quantidade de cada ambiente. A área vem da referência (Confortável); área e configuração podem ser ajustadas depois.</p><div class="gp-qtd">' + SETORES.map(function (s) {
        var ts = CATALOGO.filter(function (t) { return t.s === s[0] && t.id !== "outro"; }); if (!ts.length) return "";
        return '<div><div class="gp-serie-h"><b>' + s[1] + "</b></div>" + ts.map(function (t) { return '<label class="gp-qrow"><span>' + esc(t.n) + (t.a ? " <em>" + T.fmtNum(t.a) + " m²</em>" : "") + '</span><input type="number" min="0" max="20" data-wq="' + t.id + '" value="' + (w.qtd[t.id] || 0) + '"></label>'; }).join("") + "</div>";
      }).join("") + '</div><div class="note" id="w-prev"></div>';
    }
    h += '<div class="form-actions" style="margin-top:16px">' + (w.step > 1 ? '<button class="btn" data-wstep="-1">Voltar</button>' : '<button class="btn" data-wcancel="1">Cancelar</button>') + (w.step < 3 ? '<button class="btn btn-primary" data-wstep="1">Próximo</button>' : '<button class="btn btn-primary" id="w-criar">Criar projeto</button>') + "</div></div>";
    $("gp-novo").innerHTML = h;
    if (w.step === 3) previewWiz();
  }
  function previewWiz() {
    var w = S.wiz, amb = ambientesDeQtd(w.qtd, w.pavs[0]), it = gerarPlano({ sigla: w.sigla, pavs: w.pavs, ambientes: amb, marcenaria: w.marcenaria });
    var area = amb.reduce(function (s, a) { return s + (+a.area || 0) * (+a.qtd || 1); }, 0), cont = {};
    it.forEach(function (x) { cont[x.etapa] = (cont[x.etapa] || 0) + 1; });
    var el = $("w-prev"); if (el) el.innerHTML = '<div><div class="note-title">Prévia do projeto</div><div class="note-body">' + amb.length + " ambientes · <b>" + T.fmtNum(area * 1.2) + " m²</b> estimados · <b>" + it.length + " itens</b> no Plano de Projeto (" + Object.keys(cont).map(function (e) { return ETAPAS[e].nome + ": " + cont[e]; }).join(" · ") + ")</div></div>";
  }
  async function criarProjeto() {
    var w = S.wiz, nome = w.nome.trim(); if (!nome) { w.step = 1; renderNovo(); T.toast("Dê um nome ao projeto."); return; }
    await T.saveWith($("w-criar"), async function () {
      var ids = w.clienteIds.slice();
      if (w.novoCli.nome.trim() && T.cadastros) ids.push(await T.cadastros.criarContato({ tipos: ["cliente"], nome: w.novoCli.nome.trim(), contato: w.novoCli.contato.trim(), email: w.novoCli.email.trim() }));
      var amb = ambientesDeQtd(w.qtd, w.pavs[0]), area = amb.reduce(function (s, a) { return s + (+a.area || 0) * (+a.qtd || 1); }, 0);
      var nomesCli = ids.map(function (id) { var c = T.cadastros && T.cadastros.contato(id); return c ? c.nome : ""; }).filter(Boolean), legal = doZero(w.sigla) ? "nao_iniciado" : "nao_se_aplica";
      var ref = await T.db.collection("projetos").add({ nome: nome, codigo: (w.codigo || codigoDe(w.sigla, nome)).trim(), sigla: w.sigla, tipo: TIPO_ANTIGO[w.sigla], cliente: nomesCli.join(" e "), clienteIds: ids, categorias: { padrao: w.padrao || null, dimensao: w.dimensao, dificuldade: w.dificuldade || null }, area: Math.round(area * 1.2), status: "ativo", criadoEm: new Date().toISOString() });
      var g = { sigla: w.sigla, etapa: "briefing", fase: null, etapas: { briefing: { inicio: new Date().toISOString() } }, resp: w.resp || null, proximo: "Receber o briefing e montar a proposta", legal: legal, marco: {}, esperas: [], pavs: w.pavs, marcenaria: w.marcenaria, ambientes: amb,
        itens: gerarPlano({ sigla: w.sigla, pavs: w.pavs, ambientes: amb, marcenaria: w.marcenaria, legal: legal }), eventos: [{ data: hojeIso(), txt: "Projeto criado no briefing" }], criadoEm: new Date().toISOString() };
      S.gp[ref.id] = g; await T.db.doc("gp/" + ref.id).set(g);
      S.wiz = null; S.view = "projeto"; S.projId = ref.id; S.tab = "geral";
    });
    T.scheduleRender();
  }

  // ---------- ações ----------
  async function avancar() {
    var g = G(S.projId), f = fluxo(g.sigla), prox = f[f.indexOf(g.etapa) + 1], data = ($("gp-termo-data") || {}).value || hojeIso();
    var falta = (g.etapa === "briefing" && !(marco(g, "contrato") && marco(g, "parcela"))) || (g.etapa === "abertura" && !marco(g, "topografico"));
    var antecipa = $("gp-antecipa") && $("gp-antecipa").checked;
    if (falta && !antecipa) { T.toast("Complete o que falta ou marque a antecipação autorizada."); return; }
    if (prox === "pe" && temLegal(g) && g.legal !== "aprovado") return;
    var iso = new Date(data + "T12:00:00").toISOString();
    await salvar(S.projId, function (x) {
      x.etapas = x.etapas || {}; x.etapas[x.etapa] = Object.assign({}, x.etapas[x.etapa], { fim: iso, termoEm: ETAPAS[x.etapa].termo ? data : null });
      evento(x, x.etapa === "briefing" ? "Projeto contratado: Abertura iniciada" : x.etapa === "abertura" ? "Marco zero: Estudo Preliminar iniciado" + (antecipa && falta ? " (antecipação com termo de ciência)" : "") : ETAPAS[x.etapa].termo + " registrado (" + ETAPAS[x.etapa].nome + ")", data);
      x.etapa = prox; x.fase = ETAPAS[prox].fases ? 1 : null; x.etapas[prox] = { inicio: iso };
      if (prox === "encerrado") x.esperas = (x.esperas || []).map(function (e) { if (!e.fim) e.fim = iso; return e; });
    });
    S.planoEtapa = null;
    if (prox === "encerrado") { try { await T.db.doc("projetos/" + S.projId).update({ status: "concluido" }); } catch (e) { T.showError(e); } }
    T.toast(prox === "encerrado" ? "Projeto encerrado" : ETAPAS[prox].nome + " aberta");
  }
  function moverItem(id, dir) {
    salvar(S.projId, function (x) {
      var it = T.byId(x.itens, id), irm = ordenar(x.itens.filter(function (y) { return y.etapa === it.etapa && y.grupo === it.grupo; }));
      irm.forEach(function (y, k) { y.ord = k + 1; });
      var o = irm[irm.indexOf(it) + dir]; if (!o) return; var t = it.ord; it.ord = o.ord; o.ord = t;
    });
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
    salvar(S.projId, function (x) { x.itens = x.itens.concat(novas); evento(x, novas.length + " item(ns) incluído(s) a partir do programa"); });
    T.toast(novas.length + (novas.length === 1 ? " item incluído" : " itens incluídos") + " no Executivo");
  }

  // ---------- exemplos ----------
  async function carregarExemplos(btn) {
    await T.saveWith(btn, async function () {
      var db = T.db;
      if (!T.state.pessoas.length) {
        await db.doc("pessoas/luan").set({ nome: "Luan", perfil: "socio", custoHora: null, valorHora: null, ativo: true, ordem: 1 });
        await db.doc("pessoas/elisa").set({ nome: "Elisa", perfil: "socio", custoHora: null, valorHora: null, ativo: true, ordem: 2 });
      }
      var L = T.state.pessoas[0] ? T.state.pessoas[0].id : "luan", E = T.state.pessoas[1] ? T.state.pessoas[1].id : "elisa", C = T.cadastros;
      var c1 = await C.criarContato({ tipos: ["cliente"], nome: "Marina Duarte (exemplo)", contato: "(32) 90000-0001", email: "marina@exemplo.com" });
      var c2 = await C.criarContato({ tipos: ["cliente"], nome: "Rafael Duarte (exemplo)", contato: "(32) 90000-0002", email: "rafael@exemplo.com" });
      var c3 = await C.criarContato({ tipos: ["cliente"], nome: "Carlos Menezes (exemplo)", contato: "(32) 90000-0003", email: "carlos@exemplo.com" });
      var c4 = await C.criarContato({ tipos: ["cliente"], nome: "Pousada Vale Verde (exemplo)", empresa: "Vale Verde Turismo Ltda", contato: "(32) 90000-0004" });
      var c5 = await C.criarContato({ tipos: ["cliente"], nome: "Helena Souza (exemplo)", contato: "(32) 90000-0005" });
      await C.criarContato({ tipos: ["parceiro"], categoria: "Engenheiro estrutural", nome: "Tiago Rocha (exemplo)", empresa: "Rocha Estruturas", contato: "(32) 90000-0010" });
      await C.criarContato({ tipos: ["parceiro"], categoria: "Projetos elétrico e hidrossanitário", nome: "Beatriz Alves (exemplo)", contato: "(32) 90000-0011" });
      await C.criarContato({ tipos: ["fornecedor"], categoria: "Marmoraria", nome: "Marmoraria Pedra Fina (exemplo)", contato: "(32) 90000-0020" });
      await C.criarContato({ tipos: ["maodeobra"], categoria: "Pedreiro", nome: "João Batista (exemplo)", contato: "(32) 90000-0030" });
      function iso(n) { return voltaDu(n).toISOString(); }
      function dia2(n) { return T.ymd(somaDu(n)); }
      // marcas: [etapa, grupo|null, quantos, situação, responsável, prioridade, prazo em d.u. a partir de hoje]
      async function criar(pj, g, marcas, tarefas) {
        var ref = await db.collection("projetos").add(Object.assign({ status: "ativo", criadoEm: new Date().toISOString() }, pj));
        var amb = ambientesDeQtd(g.qtd || {}, g.pavs[0]); delete g.qtd;
        var it = gerarPlano({ sigla: g.sigla, pavs: g.pavs, ambientes: amb, marcenaria: g.marcenaria, legal: g.legal });
        (marcas || []).forEach(function (m) {
          it.filter(function (x) { return x.etapa === m[0] && (!m[1] || x.grupo === m[1]) && x.sit === "a_fazer" && !x._m; }).slice(0, m[2]).forEach(function (x, i) {
            x._m = true; x.sit = m[3]; x.resp = m[4] || null; if (m[5]) x.prio = m[5]; if (m[6] != null) x.prazo = dia2(m[6] + i);
            if (feito(x)) x.desenhos.forEach(function (d) { d.feito = true; }); else if (m[3] === "andamento" && x.desenhos.length) x.desenhos[0].feito = true;
          });
        });
        it.forEach(function (x) { delete x._m; });
        amb.forEach(function (a) { if (a.tipo === "banho_master") a.cfg = { agua_quente: true, bancada_tipo: "Cuba esculpida", cubas: "2", sanitario: "Caixa acoplada", ducha_higienica: true, chuveiros: "2", tipo_chuveiro: "Pré-aquecido (gás, boiler…)", banheira: "Em anexo (SPA)" }; if (a.tipo === "cozinha") a.cfg = { ilha: true, agua_quente: true, exaustao: "Coifa", equipamentos: ["Geladeira side by side", "Cooktop 5 bocas", "Forno de embutir", "Lava-louças"], itens_bancada: ["Cuba inox dupla", "Lixeira embutida"], integracao: "Estar, jantar e cozinha integrados" }; if (a.tipo === "estar") a.cfg = { assentos: "8", tv: "65\"" }; });
        await db.doc("gp/" + ref.id).set(Object.assign({ ambientes: amb, itens: it, esperas: [], eventos: [], marco: {}, criadoEm: new Date().toISOString() }, g));
        for (var i = 0; i < (tarefas || []).length; i++) { var tf = tarefas[i]; if (T.tarefas) await T.tarefas.criar(tf.pes, { title: tf.title, subdivision: tf.tipo, dueDate: tf.dia != null ? dia2(tf.dia) : null, dueTime: tf.hora || null, projetoId: ref.id }); }
        return ref.id;
      }
      await criar({ nome: "Casa Duarte", codigo: "RES-CASADUARTE", sigla: "RES", tipo: "res", cliente: "Marina Duarte e Rafael Duarte", clienteIds: [c1, c2], categorias: { padrao: "medio_alto", dimensao: "confortavel", dificuldade: "dificil" }, area: 280 },
        { sigla: "RES", etapa: "ep", resp: L, pavs: ["Garagem/Acesso", "1º pavimento", "2º pavimento"], qtd: PADRAO_RES, legal: "nao_iniciado", marco: { contrato: true, parcela: true },
          etapas: { briefing: { inicio: iso(50), fim: iso(35) }, abertura: { inicio: iso(35), fim: iso(28) }, ep: { inicio: iso(28) } }, esperas: [{ quem: "cliente", inicio: iso(16), fim: null }], proximo: "Receber a lista de ajustes da 1ª rodada",
          eventos: [{ data: T.ymd(voltaDu(35)), txt: "Projeto contratado: Abertura iniciada" }, { data: T.ymd(voltaDu(28)), txt: "Marco zero: Estudo Preliminar iniciado" }, { data: T.ymd(voltaDu(17)), txt: "Apresentação do Estudo Preliminar" }] },
        [["abertura", null, 7, "pronto", E], ["ep", "ep-estudos", 4, "pronto", L], ["ep", "ep-apres", 17, "entregue", E], ["ep", "ep-entrega", 3, "pronto", L], ["ep", "ep-entrega", 1, "andamento", L, 1, 1]],
        [{ pes: L, title: "Cobrar retorno da apresentação do EP", tipo: "prioridade", dia: 1 }, { pes: L, title: "Reunião de ajustes com Marina e Rafael", tipo: "compromisso", dia: 3, hora: "15:00" }]);
      await criar({ nome: "Casa Menezes", codigo: "RES-CASAMENEZES", sigla: "RES", tipo: "res", cliente: "Carlos Menezes", clienteIds: [c3], categorias: { padrao: "alto_1", dimensao: "espacosa", dificuldade: "normal" }, area: 320 },
        { sigla: "RES", etapa: "ap", fase: 2, resp: L, pavs: ["Térreo", "Superior"], qtd: { hall: 1, cozinha: 1, jantar: 1, estar: 1, lavabo: 1, suite_master: 1, banho_master: 1, closet: 1, quarto: 3, banho: 2, garagem: 3, lavanderia: 1, gourmet: 1, piscina: 1, escada: 1 },
          legal: "protocolado", marco: { contrato: true, parcela: true },
          etapas: { briefing: { inicio: iso(130), fim: iso(115) }, abertura: { inicio: iso(115), fim: iso(100) }, ep: { inicio: iso(100), fim: iso(38), termoEm: T.ymd(voltaDu(38)) }, ap: { inicio: iso(38) } },
          esperas: [{ quem: "engenheiro", inicio: iso(20), fim: iso(12) }], proximo: "Compatibilizar o hidrossanitário (2ª rodada)",
          eventos: [{ data: T.ymd(voltaDu(38)), txt: "Termo de Encerramento de Etapa registrado (Estudo Preliminar)" }, { data: T.ymd(voltaDu(12)), txt: "Estrutural recebido e sobreposto" }] },
        [["abertura", null, 7, "pronto", E], ["ep", null, 40, "pronto", L], ["ap", "s100", 4, "pronto", E], ["ap", "s200", 2, "pronto", E], ["ap", "s300", 2, "revisao", E, 2, 1], ["ap", "s400", 3, "andamento", L, 1, 2], ["ap", "s400", 6, "a_fazer", E, 3, 6],
          ["ap", "ap-comp", 1, "pronto", L], ["ap", "ap-comp", 2, "andamento", L, 1, 3], ["pl", "pl-pranchas", 7, "entregue", E], ["pl", "pl-tramite", 3, "pronto", L]],
        [{ pes: L, title: "Enviar interferências ao projeto elétrico", tipo: "prioridade", dia: 1 }, { pes: E, title: "Revisar quadro de áreas", tipo: "tarefa", dia: 2 }, { pes: E, title: "Separar referências de revestimento para o cliente", tipo: "demanda", dia: 5 }]);
      await criar({ nome: "Pousada Vale Verde", codigo: "HOT-VALEVERDE", sigla: "HOT", tipo: "hot", cliente: "Pousada Vale Verde", clienteIds: [c4], categorias: { padrao: "alto_1", dimensao: "confortavel", dificuldade: "muito_dificil" }, area: 0 },
        { sigla: "HOT", etapa: "briefing", resp: L, pavs: ["Térreo"], qtd: {}, legal: "nao_iniciado", marco: { contrato: true }, etapas: { briefing: { inicio: iso(10) } }, proximo: "Apresentar a proposta ao cliente", eventos: [{ data: T.ymd(voltaDu(10)), txt: "Projeto criado no briefing" }] },
        [], [{ pes: L, title: "Apresentação da proposta", tipo: "compromisso", dia: 2, hora: "10:00" }]);
      await criar({ nome: "Apartamento Centro", codigo: "INT-APTOCENTRO", sigla: "INT", tipo: "int", cliente: "Helena Souza", clienteIds: [c5], categorias: { padrao: "medio_alto", dimensao: "compacta", dificuldade: "baixa" }, area: 95 },
        { sigla: "INT", etapa: "pe", fase: 2, resp: E, pavs: ["Apartamento"], qtd: { cozinha: 1, estar: 1, jantar: 1, suite_master: 1, banho_master: 1, quarto: 1, banho: 1, lavanderia: 1 }, marcenaria: true, legal: "nao_se_aplica", marco: { contrato: true, parcela: true },
          etapas: { briefing: { inicio: iso(95), fim: iso(90) }, abertura: { inicio: iso(90), fim: iso(80) }, ep: { inicio: iso(80), fim: iso(35), termoEm: T.ymd(voltaDu(35)) }, pe: { inicio: iso(35) } }, proximo: "Detalhar marcenaria da cozinha", eventos: [{ data: T.ymd(voltaDu(35)), txt: "Termo de Encerramento de Etapa registrado (Estudo Preliminar)" }] },
        [["abertura", null, 7, "pronto", E], ["ep", null, 40, "pronto", E], ["pe", "s100", 3, "entregue", E], ["pe", "s200", 2, "pronto", E], ["pe", "s300", 2, "pronto", E], ["pe", "s400", 5, "pronto", E], ["pe", "s500", 2, "andamento", E, 1, 1], ["pe", "s500", 3, "a_fazer", E, 2, 4], ["pe", "s900", 1, "andamento", E, 2, 3]],
        [{ pes: E, title: "Confirmar medidas da geladeira com a cliente", tipo: "tarefa", dia: 1 }]);
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
    '<div id="gp-proj" hidden><div id="gp-p-head" class="gp-p-head"></div><div id="gp-p-body"></div></div><div id="gp-novo" hidden></div>';

  function split(v) { return String(v).split("|"); }
  function init() {
    var v = $("view-gestor");
    $("gp-busca").addEventListener("input", function () { S.busca = this.value; renderLista(); });
    $("gp-novo-btn").addEventListener("click", function () { api.novo(); });
    $("gp-filtros").addEventListener("click", function (e) { var b = e.target.closest("[data-f]"); if (!b) return; S.filtro = b.dataset.f; T.each("[data-f]", function (x) { x.classList.toggle("is-selected", x === b); }, this); renderLista(); });
    v.addEventListener("click", async function (e) {
      var t = e.target, b, pid = S.projId;
      if ((b = t.closest("[data-open]"))) { api.abrir(b.dataset.open); return; }
      if (t.closest("#gp-seed")) { carregarExemplos(t.closest("#gp-seed")); return; }
      if (t.closest("[data-voltar]")) { S.view = "lista"; S.confirmDel = null; render(); window.scrollTo(0, 0); return; }
      if ((b = t.closest("[data-tab]"))) { S.tab = b.dataset.tab; S.confirmDel = null; render(); return; }
      if ((b = t.closest("[data-pet]"))) { S.planoEtapa = b.dataset.pet; S.addGrupo = null; render(); return; }
      if ((b = t.closest("[data-itopen]"))) { S.open[b.dataset.itopen] = !S.open[b.dataset.itopen]; render(); return; }
      if ((b = t.closest("[data-dopen]"))) { S.openDes[b.dataset.dopen] = !S.openDes[b.dataset.dopen]; render(); return; }
      if ((b = t.closest("[data-addopen]"))) { S.addGrupo = S.planoEtapa + "|" + b.dataset.addopen; render(); var i = $("gp-add-in"); if (i) i.focus(); return; }
      if (t.closest("[data-addcancel]")) { S.addGrupo = null; render(); return; }
      if ((b = t.closest("[data-imove]"))) { moverItem(b.dataset.imove, +b.dataset.dir); return; }
      if ((b = t.closest("[data-idel]"))) { var antes = T.clone(G(pid).itens), idd = b.dataset.idel; salvar(pid, function (x) { x.itens = x.itens.filter(function (y) { return y.id !== idd; }); }); T.toast("Item removido", { label: "Desfazer", fn: function () { salvar(pid, function (x) { x.itens = antes; }); } }); return; }
      if ((b = t.closest("[data-ddel]"))) { var a = split(b.dataset.ddel); mudarItem(pid, a[0], function (it) { it.desenhos = it.desenhos.filter(function (d) { return d.id !== a[1]; }); }); return; }
      if (t.closest("[data-add900]")) { salvar(pid, function (x) { x.marcenaria = true; (x.pavs || ["Térreo"]).forEach(function (p, k) { x.itens.push(novoItem("pe", "s900", "Mapa de marcenaria – " + p, { ord: k + 1 })); }); }); return; }
      if ((b = t.closest("[data-tft]"))) { T.each("#tf-tipo [data-tft]", function (x) { x.classList.toggle("is-selected", x === b); }); var comp = b.dataset.tft === "compromisso"; $("tf-hora-w").hidden = !comp; $("tf-prazo-l").textContent = comp ? "Data" : "Prazo"; return; }
      if ((b = t.closest("[data-tfdel]"))) { var d2 = split(b.dataset.tfdel); T.tarefas.remover(d2[0], d2[1]).then(function () { T.toast("Tarefa excluída"); }, T.showError); return; }
      if ((b = t.closest("[data-amb]"))) { S.openAmb = S.openAmb === b.dataset.amb ? null : b.dataset.amb; render(); return; }
      if ((b = t.closest("[data-ambsave]"))) { salvarAmb(b.dataset.ambsave); return; }
      if ((b = t.closest("[data-ambdel]"))) { var id = b.dataset.ambdel; salvar(pid, function (x) { x.ambientes = x.ambientes.filter(function (a2) { return a2.id !== id; }); }); S.openAmb = null; return; }
      if ((b = t.closest("[data-wsig]"))) { S.wiz.sigla = b.dataset.wsig; if (!S.wiz.codManual) S.wiz.codigo = ""; S.wiz.qtd = b.dataset.wsig === "RES" ? T.clone(PADRAO_RES) : {}; renderNovo(); return; }
      if ((b = t.closest("[data-wstep]"))) { S.wiz.step += +b.dataset.wstep; renderNovo(); window.scrollTo(0, 0); return; }
      if (t.closest("[data-wcancel]")) { S.wiz = null; S.view = "lista"; render(); return; }
      if (t.closest("#w-criar")) { criarProjeto(); return; }
      if ((b = t.closest("[data-act]"))) {
        var act = b.dataset.act;
        if (act === "avancar") avancar();
        else if (act === "aguardar") { var quem = $("gp-quem").value, prev = $("gp-previsto").value || null; salvar(pid, function (x) { x.esperas = x.esperas || []; x.esperas.push({ quem: quem, inicio: new Date().toISOString(), fim: null, previsto: prev }); evento(x, "Aguardando " + nomeQuem(quem)); }); }
        else if (act === "retomar") salvar(pid, function (x) { var e2 = esperaAberta(x); if (e2) { e2.fim = new Date().toISOString(); evento(x, "Retomado após " + du(e2.inicio, new Date()) + " d.u. aguardando " + nomeQuem(e2.quem)); } });
        else if (act === "suspender") salvar(pid, function (x) { var e3 = esperaAberta(x); if (e3) e3.fim = new Date().toISOString(); x.suspenso = { desde: hojeIso() }; x.esperas.push({ quem: "cliente", inicio: new Date().toISOString(), fim: null, suspenso: true }); evento(x, "Projeto suspenso por falta de retorno do cliente"); });
        else if (act === "reativar") salvar(pid, function (x) { var e4 = esperaAberta(x); if (e4) e4.fim = new Date().toISOString(); delete x.suspenso; evento(x, "Projeto reativado"); });
        else if (act === "sync-plano") syncPlano();
        else if (act === "apagar") { S.confirmDel = pid; render(); }
        else if (act === "apagar-nao") { S.confirmDel = null; render(); }
        else if (act === "apagar-ok") { try { await T.db.doc("gp/" + pid).delete(); delete S.gp[pid]; S.confirmDel = null; S.view = "lista"; render(); T.toast("Projeto removido do Gestor"); } catch (err) { T.showError(err); } }
      }
    });
    v.addEventListener("change", function (e) {
      var t = e.target, pid = S.projId, a;
      if (t.id === "gp-fase") salvar(pid, function (x) { x.fase = +t.value; evento(x, "Fase " + t.value + " de " + ETAPAS[x.etapa].nome); });
      else if (t.id === "gp-proximo") salvar(pid, function (x) { x.proximo = t.value.trim(); });
      else if (t.id === "gp-resp") salvar(pid, function (x) { x.resp = t.value || null; });
      else if (t.id === "gp-legal") salvar(pid, function (x) { x.legal = t.value; evento(x, "Projeto Legal: " + (LEGAL.filter(function (o) { return o[0] === t.value; })[0] || [0, t.value])[1]); });
      else if (t.id === "gp-pend") { S.pendentes = t.checked; render(); }
      else if (t.dataset.marco) salvar(pid, function (x) { x.marco = x.marco || {}; x.marco[t.dataset.marco] = t.checked; });
      else if (t.dataset.iresp != null) mudarItem(pid, t.dataset.iresp, function (it) { it.resp = t.value || null; });
      else if (t.dataset.isit) mudarItem(pid, t.dataset.isit, function (it) { it.sit = t.value; if (feito(it)) (it.desenhos || []).forEach(function (d) { d.feito = true; }); });
      else if (t.dataset.iprio != null) mudarItem(pid, t.dataset.iprio, function (it) { it.prio = t.value ? +t.value : null; });
      else if (t.dataset.iprazo != null) mudarItem(pid, t.dataset.iprazo, function (it) { it.prazo = t.value || null; });
      else if (t.dataset.iren) { var nv = t.value.trim(); if (nv) mudarItem(pid, t.dataset.iren, function (it) { it.titulo = nv; }); }
      else if (t.dataset.dfeito) { a = split(t.dataset.dfeito); mudarItem(pid, a[0], function (it) { var d = T.byId(it.desenhos, a[1]); if (d) d.feito = t.checked; if (it.desenhos.some(function (z) { return z.feito; }) && it.sit === "a_fazer") it.sit = "andamento"; }); }
      else if (t.dataset.ck) { a = split(t.dataset.ck); mudarItem(pid, a[0], function (it) { var d = T.byId(it.desenhos, a[1]); if (d && d.checklist[+a[2]]) d.checklist[+a[2]].ok = t.checked; }); }
      else if (t.dataset.guia) { a = split(t.dataset.guia); mudarItem(pid, a[0], function (it) { var d = T.byId(it.desenhos, a[1]); if (d) d.guia = t.value.trim(); }); }
      else if (t.dataset.tfdone) { a = split(t.dataset.tfdone); T.tarefas.concluir(a[0], a[1], t.checked).catch(T.showError); }
      else if (t.dataset.tfmv) { a = split(t.dataset.tfmv); T.tarefas.mover(a[0], t.value, a[1]).then(function () { T.toast("Tarefa enviada para " + (T.pessoa(t.value) || {}).nome); }, T.showError); }
      else if (t.dataset.wcli) { var ids = S.wiz.clienteIds, i = ids.indexOf(t.dataset.wcli); if (t.checked && i < 0) ids.push(t.dataset.wcli); if (!t.checked && i >= 0) ids.splice(i, 1); }
      else if (t.id === "w-npav") { var n = Math.max(1, Math.min(12, +t.value || 1)); S.wiz.npav = n; var ps = S.wiz.pavs.slice(0, n); while (ps.length < n) ps.push(ps.length === 0 ? "Térreo" : n === 2 ? "Superior" : ps.length + "º pavimento"); S.wiz.pavs = ps; renderNovo(); }
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
      var f = e.target, pid = S.projId, a; e.preventDefault();
      if (f.dataset.addg) { var tit = f.querySelector("input").value.trim(); if (!tit) return; var gk = f.dataset.addg, et = S.planoEtapa;
        salvar(pid, function (x) { var n = x.itens.filter(function (y) { return y.etapa === et && y.grupo === gk; }).length; x.itens.push(novoItem(et, gk, tit, { ord: 1000 + n })); }); S.addGrupo = null; return; }
      if (f.dataset.dadd) { var nm = f.querySelector("input").value.trim(); if (!nm) return; mudarItem(pid, f.dataset.dadd, function (it) { it.desenhos = (it.desenhos || []).concat(des([nm])); }); return; }
      if (f.dataset.ckadd) { a = split(f.dataset.ckadd); var ct = f.querySelector("input").value.trim(); if (!ct) return; mudarItem(pid, a[0], function (it) { var d = T.byId(it.desenhos, a[1]); if (d) d.checklist.push({ t: ct, ok: false }); }); return; }
      if (f.id === "gp-tf-form") {
        var txt = $("tf-txt").value.trim(), resp = $("tf-resp").value; if (!txt || !resp) return;
        var tipo = (document.querySelector("#tf-tipo .is-selected") || {}).dataset.tft || "tarefa";
        T.tarefas.criar(resp, { title: txt, subdivision: tipo, dueDate: $("tf-prazo").value || null, dueTime: tipo === "compromisso" ? $("tf-hora").value || null : null, projetoId: pid, itemId: $("tf-it").value || null })
          .then(function () { T.toast("Tarefa enviada para " + (T.pessoa(resp) || {}).nome); }, T.showError);
        return;
      }
      if (f.id === "gp-amb-add") { var g = G(pid), am = novoAmbiente($("amb-tipo").value, { pav: (g.pavs || [])[0] || null }); salvar(pid, function (x) { x.ambientes = (x.ambientes || []).concat([am]); }); S.openAmb = am.id; return; }
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
      if (["briefing", "abertura"].indexOf(x.etapa) < 0) evento(x, "Ambiente alterado: " + a.nome + " (" + ETAPAS[x.etapa].nome + ")");
    });
    S.openAmb = null; T.toast("Ambiente salvo");
  }
  async function salvarFicha() {
    var pid = S.projId, cli = []; T.each("[data-fcli]", function (i) { if (i.checked) cli.push(i.dataset.fcli); });
    var sig = $("f-sig").value || G(pid).sigla, nomes = cli.map(function (id) { var c = T.cadastros && T.cadastros.contato(id); return c ? c.nome : ""; }).filter(Boolean);
    await T.saveWith($("f-save"), async function () {
      await T.db.doc("projetos/" + pid).update({ nome: $("f-nome").value.trim(), codigo: $("f-cod").value.trim(), sigla: sig, tipo: TIPO_ANTIGO[sig], clienteIds: cli, cliente: nomes.join(" e "), endereco: $("f-end").value.trim(), categorias: { padrao: $("f-pad").value || null, dimensao: $("f-dim").value || null, dificuldade: $("f-dif").value || null } });
      var pavs = $("f-pavs").value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean), dir = {};
      ["uso", "expectativas", "estetica", "relacao", "sistemas", "execucao"].forEach(function (k) { dir[k] = $("fd-" + k).value.trim(); });
      await salvar(pid, function (x) { x.sigla = sig; x.pavs = pavs.length ? pavs : x.pavs; x.pasta = $("f-pasta").value.trim(); x.bimx = $("f-bimx").value.trim(); x.marcenaria = $("f-marc").checked; x.diretrizes = dir; });
    });
  }

  var api = T.gestor = {
    abrir: function (pid) { if (T.state.view !== "admin" || T.state.sub !== "gestor") T.go("admin", "gestor"); S.view = "projeto"; S.projId = pid; S.tab = "geral"; S.openAmb = null; S.planoEtapa = null; render(); window.scrollTo(0, 0); },
    novo: function () { if (T.state.view !== "admin" || T.state.sub !== "gestor") T.go("admin", "gestor"); S.wiz = wizInicial(); S.view = "novo"; render(); window.scrollTo(0, 0); },
    gp: G, etapaNome: function (pid) { var g = G(pid); return g ? etapaLinha(g) : ""; }, situacao: function (pid) { var g = G(pid); return g ? situacao(g) : null; },
    codigos: codigos, ordenar: ordenar, sitNome: sitNome, SIT: SIT, feito: feito, mudarItem: mudarItem, salvar: salvar, etapas: ETAPAS, etapasPlano: etapasPlano, grupos: grupos, desenhosProg: desenhosProg,
    itensParaTempo: function (pid, etapaTempo) {
      var g = G(pid); if (!g || !etapaTempo) return [];
      var ets = etapasPlano(g).filter(function (e) { return ETAPAS[e].tempo === etapaTempo; }), cod = codigos(g), out = [];
      ets.forEach(function (e) { ordenar(itensDe(g, e)).forEach(function (x) { if (!feito(x)) out.push({ id: x.id, rotulo: (ets.length > 1 ? ETAPAS[e].nome + " · " : "") + (cod[x.id] ? cod[x.id] + " · " : "") + x.titulo }); }); });
      return out;
    }
  };

  T.register({
    id: "gestor", label: "Gestor de Projetos", area: "admin", html: html, init: init, render: render,
    icon: '<path d="M4 5h16"/><path d="M4 12h10"/><path d="M4 19h6"/><circle cx="18" cy="17" r="3"/>',
    desc: function () { var n = projetosGestor().filter(function (p) { return G(p.id).etapa !== "encerrado"; }).length; return n ? n + (n === 1 ? " projeto no processo" : " projetos no processo") : "Etapas, plano e prazos de cada projeto"; },
    connect: function (db) { db.collection("gp").onSnapshot(function (s) { var m = {}; s.docs.forEach(function (d) { m[d.id] = d.data(); }); S.gp = m; T.loaded("gp", s); T.scheduleRender(); }, T.onErr); },
    notes: function () {
      var av = avisos().filter(function (a) { return a[0] !== "ok"; });
      return av.length ? '<div class="note"><div><div class="note-title">Gestor de Projetos</div><div class="note-body">' + av.map(function (a) { return a[1]; }).join("<br>") + '</div></div><button class="btn btn-small" data-go="gestor">Abrir</button></div>' : null;
    }
  });
})();
