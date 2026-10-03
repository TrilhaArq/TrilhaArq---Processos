/* Gestor Comercial — documentos (fase 2): proposta em PDF (modelo híbrido), contrato .docx preenchido, valores por
 * extenso e texto da proposta pela IA. Não se registra como módulo: expõe Trilha.comercialDocs, usado por comercial.js.
 * Modelos em com_config/modelos: proposta = sequência de páginas (fixas = imagens no armazenamento de arquivos do app;
 * variáveis = desenhadas aqui); contratos = o .docx oficial guardado como texto base64 (o armazenamento não aceita .docx). */
(function () {
  "use strict";
  var T = window.Trilha, esc = T.esc, BRL = T.fmtBRL;
  var LIBS = { jspdf: "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", h2c: "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js", jszip: "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js" };
  function carregar(src) { return new Promise(function (ok, erro) { if (document.querySelector('script[src="' + src + '"]')) { var t = setInterval(function () { if (window.jspdf || window.html2canvas || window.JSZip) { clearInterval(t); ok(); } }, 50); setTimeout(function () { clearInterval(t); ok(); }, 8000); return; } var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = function () { erro(new Error("Não foi possível carregar " + src)); }; document.head.appendChild(s); }); }
  function blob(id) { return id ? "/_blob/" + id : ""; }

  // ---------- números e datas por extenso ----------
  var UN = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  var DZ = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  var CT = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
  function ate999(n) {
    if (n === 100) return "cem"; var c = Math.floor(n / 100), r = n % 100, p = [];
    if (c) p.push(CT[c]);
    if (r) { if (r < 20) p.push(UN[r]); else { var d = Math.floor(r / 10), u = r % 10; p.push(DZ[d] + (u ? " e " + UN[u] : "")); } }
    return p.join(" e ");
  }
  function inteiro(n) {
    if (n === 0) return "zero";
    var g = [], mi = Math.floor(n / 1e6), mil = Math.floor(n % 1e6 / 1000), r = n % 1000;
    if (mi) g.push({ v: mi, t: mi === 1 ? "um milhão" : ate999(mi) + " milhões" });
    if (mil) g.push({ v: mil, t: mil === 1 ? "mil" : ate999(mil) + " mil" });
    if (r) g.push({ v: r, t: ate999(r) });
    if (g.length === 1) return g[0].t;
    var ult = g.pop();
    return g.map(function (x) { return x.t; }).join(" ") + (ult.v < 100 || ult.v % 100 === 0 ? " e " : " ") + ult.t;
  }
  function reaisExtenso(v) {
    v = Math.round((+v || 0) * 100) / 100; var r = Math.floor(v), c = Math.round((v - r) * 100), p = [];
    if (r) p.push(inteiro(r) + (r === 1 ? " real" : (r % 1e6 === 0 ? " de reais" : " reais")));
    if (c) p.push(inteiro(c) + (c === 1 ? " centavo" : " centavos"));
    return p.join(" e ") || "zero reais";
  }
  function numBR(v) { return (+v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function dataExtenso(ymd) { if (!ymd) return ""; var d = T.parseYmd(ymd); return d.getDate() + " de " + T.MESES[d.getMonth()] + " de " + d.getFullYear(); }
  function ddmmaa(ymd) { return ymd ? ymd.slice(8, 10) + ymd.slice(5, 7) + ymd.slice(2, 4) : ""; }

  // ---------- plano de projeto (desenhos previstos), a partir do programa ----------
  var AMPLIA = { cozinha: 1, lavabo: 1, banho_master: 1, banho: 1, lavanderia: 1, gourmet: 1, piscina: 1, escada: 1, spa: 1, sauna: 1, hidro: 1, banho_servico: 1 };
  function planoProposta(o, legal) {
    var pavs = ((o.programa || {}).pavs || []).filter(Boolean); if (!pavs.length) pavs = ["Térreo"];
    var amb = (o.programa || {}).amb || [], zero = ["RES", "COM", "HOT"].indexOf(o.tipo) >= 0, um = pavs.length === 1;
    function porPav(t) { return um ? [t] : pavs.map(function (p) { return t + " " + p; }); }
    var area = (o.sim && o.sim.area) || amb.reduce(function (s, a) { return s + (+a.area || 0) * (+a.qtd || 1); }, 0) * 1.2;
    var ep = ["Estudo de Concepção", "Implantação/Cobertura"].concat(porPav("Planta Baixa")).concat(["Corte AA", "Perspectiva Explodida", "Estudo de Insolação", "Estudo de Ventilação", "Estudo Visuais", "Perspectiva Estrutural", "Perspectiva Terraplenagem – Corte e Aterro", (area > 300 ? 15 : 10) + " Imagens Fotorrealistas", "01 Animação", "Modelo BIMx"]).map(function (t, k) { return ["AP" + (k < 9 ? "0" : "") + (k + 1), t]; });
    function serie(base, lista) { return lista.map(function (t, k) { return [String(base + k), t]; }); }
    var s100 = [["101", "Planta de Terraplenagem – Corte e Aterro"], ["101", "Perspectiva de Terraplenagem – Corte e Aterro"], ["102", "Implantação/Cobertura"]].concat(serie(103, porPav("Planta Baixa")));
    var s200 = [["201", "Corte AA"], ["201", "Corte BB"], ["202", "Corte CC"], ["202", "Corte DD"]];
    var s300 = [["301", "Fachada 01"], ["301", "Fachada 02"], ["302", "Fachada 03"], ["302", "Fachada 04"]];
    var maps = [].concat(porPav("Mapeamento de Piso e Acabamento"), porPav("Mapeamento de Pontos Hidrossanitários"), porPav("Mapeamento de Pontos Elétricos"), porPav("Mapeamento de Forro e Iluminação"), ["Mapeamento/Detalhamento de Cobertura"]);
    var s400 = serie(401, maps);
    var ap = s100.concat(s200, s300, s400, [["xxx", "Modelo 3D – Lançamento Estrutural"], ["xxx", "Especificação de Acabamentos"], ["xxx", "Especificação de Louças e Metais"], ["xxx", "Modelo BIMx"]]);
    var ampl = amb.filter(function (a) { return AMPLIA[a.tipo]; }).map(function (a) { return "Ampliação " + a.nome; });
    var pe = s100.concat(s200, s300, s400, serie(501, ampl), [["601", "Mapeamento Esquadrias – Alumínio e Vidro"], ["602", "Mapeamento Esquadrias – Madeira"], ["603", "Mapeamento Esquadrias – Guarda-corpo e Corrimão"], ["701", "Detalhamento Marmoraria (Bancadas e Pedras)"], ["801", "Detalhamentos Construtivos Gerais"],
      ["xxx", "Perspectiva Isométrica Geral"], ["xxx", "Perspectiva Isométrica Explodida"], ["xxx", "Imagens Fotorrealistas Atualizadas"], ["xxx", "Índice de Projeto + Caderno de Apresentação"], ["xxx", "Modelo BIMx Atualizado"]]);
    var pl = legal ? [["01", "Situação/Implantação"], ["02", "Planta de Cobertura"]].concat(porPav("Planta").map(function (t, k) { return [(k < 7 ? "0" : "") + (k + 3), t]; })).concat([["", "Plantas de Áreas"], ["", "Corte Longitudinal"], ["", "Corte Transversal"]]) : [];
    var out = [{ k: "ep", n: "EP | Estudo Preliminar", l: ep }];
    if (zero) out.push({ k: "ap", n: "AP | Anteprojeto", l: ap });
    if (pl.length) out.push({ k: "pl", n: "PL | Projeto Legal", l: pl });
    out.push({ k: "pe", n: "PE | Projeto Executivo", l: pe });
    return out;
  }

  // ---------- proposta: páginas ----------
  // Tipos de página variável (desenhados pelo app). Páginas fixas: { t: "fixa", img: <id do arquivo>, n: nome, opc?: "marcenaria"|"adm" }.
  var VARIAVEIS = [["capa", "Capa (nome do cliente e tipo)"], ["demanda", "Sua demanda"], ["programa", "Programa de necessidades"], ["plano", "Plano de projeto"], ["horas", "Entregáveis, horas e custo da obra"], ["servico", "O serviço (serviços menores)"], ["investimento", "Investimento"]];
  function linhas(t) { return String(t || "").split("\n").map(function (x) { return x.replace(/^[-•*]\s*/, "").trim(); }).filter(Boolean); }
  function tituloTipo(t) { return { RES: "Projeto Residência", COM: "Projeto Comercial", HOT: "Projeto Hotelaria", REF: "Projeto de Reforma", INT: "Projeto de Interiores", MARC: "Projeto de Marcenaria", SERV: "Serviço" }[t] || "Projeto"; }
  function pp(cls, corpo, n, escuro, marca) {
    var m = marca || {};
    return '<div class="pp ' + (escuro ? "pp-escuro " : "") + cls + '">' +
      ((escuro ? m.logoVerde : m.logoEscuro) ? '<img class="pp-logo" src="' + blob(escuro ? m.logoVerde : m.logoEscuro) + '" alt="">' : "") +
      ((escuro ? m.trilhaVerde : m.trilhaEscuro) ? '<img class="pp-marca" src="' + blob(escuro ? m.trilhaVerde : m.trilhaEscuro) + '" alt="">' : "") + corpo + (n ? '<span class="pp-num">' + n + "</span>" : "") + "</div>";
  }
  function paragrafos(txt) { return String(txt || "").split(/\n\s*\n|\n/).map(function (p) { return p.trim(); }).filter(Boolean).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join(""); }
  function fmtA(v) { return v == null || v === "" ? "x" : T.fmtNum(+v, 1); }
  // ctx = { o, r (cálculo do simulador), marca, setores, opc {marc, marcValor, adm, admPct}, validade, nf }
  var montar = {
    capa: function (ctx, pg) { var o = ctx.o, f = pg.img || ctx.marca.capa; return '<div class="pp pp-escuro pp-capa">' + (f ? '<img class="pp-fundo" src="' + blob(f) + '" alt="">' : "") + '<div class="pp-capa-t"><b>PROPOSTA DE SERVIÇO</b><span>TIPO: ' + esc(tituloTipo(o.tipo).toUpperCase()) + '</span><em>' + esc((o.cliente && o.cliente.nome) || "") + "</em></div></div>"; },
    demanda: function (ctx, pg, n) {
      var o = ctx.o, r = ctx.r, mov = o.tipo === "MARC" && o.moveis ? '<div class="pp-mov">' + paragrafos(o.moveis) + "</div>" : "";
      return [pp("pp-dem", '<div class="pp-head"><h2>SUA DEMANDA</h2><p>' + esc(tituloTipo(o.tipo)) + (r.area && o.tipo !== "MARC" ? "<br>Área Estimada: " + T.fmtNum(Math.round(r.area), 0) + "m²" : "") + "</p>" + (o.endereco ? "<p>" + esc(o.endereco) + "</p>" : "") + '</div><div class="pp-card pp-texto">' + paragrafos(o.demanda) + mov + "</div>", n, false, ctx.marca)];
    },
    programa: function (ctx, pg, n) {
      var o = ctx.o, amb = (o.programa || {}).amb || [], linhas = [], pags = [], sub = 0;
      ctx.setores.forEach(function (s) {
        var l = amb.filter(function (a) { return (a.setor || "social") === s[0]; }); if (!l.length) return;
        var tot = l.reduce(function (t, a) { return t + (+a.area || 0) * (+a.qtd || 1); }, 0); sub += tot;
        linhas.push({ h: s[1] }); l.forEach(function (a) { linhas.push({ a: a }); }); linhas.push({ tot: tot });
      });
      linhas.push({ fim: 1 });
      var porPag = [15, 22], i = 0, k = 0;
      while (i < linhas.length) { var cap = porPag[Math.min(k, 1)], bloco = linhas.slice(i, i + cap); i += cap; k++; pags.push(bloco); }
      return pags.map(function (bl, j) {
        var corpo = (j === 0 ? '<div class="pp-head"><h2>PROGRAMA DE NECESSIDADES</h2><p>O Programa de Necessidades é o conjunto de ambientes que irão compor o projeto e suas metragens quadradas aproximadas.</p></div>' : "") +
          '<table class="pp-tab' + (j === 0 ? "" : " pp-tab-alto") + '">' + bl.map(function (x) {
            if (x.h) return '<tr class="pp-th"><td>' + esc(x.h) + "</td><td>Quant.</td><td>Área</td><td>Total</td></tr>";
            if (x.a) { var a = x.a; return "<tr><td>" + esc(a.nome) + "</td><td>" + (a.qtd || 1) + "</td><td>" + fmtA(a.area) + "</td><td>" + (a.area != null && a.area !== "" ? T.fmtNum((+a.area || 0) * (+a.qtd || 1), 1) : "x") + "</td></tr>"; }
            if (x.tot != null) return '<tr class="pp-tot"><td>TOTAL</td><td colspan="3">' + T.fmtNum(x.tot, 1) + "</td></tr>";
            return '<tr class="pp-fim"><td>+ 10% CIRCULAÇÃO</td><td colspan="3">' + T.fmtNum(sub * 0.1, 1) + '</td></tr><tr class="pp-fim"><td>+ 10% PAREDES E ESTRUTURA</td><td colspan="3">' + T.fmtNum(sub * 0.1, 1) + '</td></tr><tr class="pp-tot"><td>TOTAL RESIDÊNCIA</td><td colspan="3">' + T.fmtNum(sub * 1.2, 1) + "</td></tr>";
          }).join("") + "</table>" + (j === pags.length - 1 ? '<p class="pp-nota">*As áreas são estimativas, podendo haver alterações e ajustes no desenrolar do projeto.</p>' : "");
        return pp("pp-prog", corpo, n + j, false, ctx.marca);
      });
    },
    plano: function (ctx, pg, n) {
      var grupos = planoProposta(ctx.o, ctx.legal), linhas = [];
      grupos.forEach(function (g) { linhas.push({ h: g.n }); g.l.forEach(function (x) { linhas.push({ c: x[0], t: x[1] }); }); });
      var pags = [], i = 0, k = 0; while (i < linhas.length) { var cap = k === 0 ? 40 : 52; pags.push(linhas.slice(i, i + cap)); i += cap; k++; }
      return pags.map(function (bl, j) {
        return pp("pp-plano", (j === 0 ? '<div class="pp-head pp-head-sm"><h2>PLANO DE PROJETO</h2><p>Consiste num levantamento preliminar dos materiais e documentos que serão desenvolvidos e entregues por nós durante o processo e finalização do projeto.</p></div>' : "") +
          '<div class="pp-lista' + (j === 0 ? "" : " pp-lista-alto") + '">' + bl.map(function (x) { return x.h ? "<h3>" + esc(x.h) + "</h3>" : "<div><b>" + esc(x.c) + "</b> " + esc(x.t) + "</div>"; }).join("") + "</div>", n + j, false, ctx.marca);
      });
    },
    horas: function (ctx, pg, n) {
      var r = ctx.r, grupos = planoProposta(ctx.o, ctx.legal), tot = 0, th = 0;
      var ent = grupos.map(function (g) { tot += g.l.length; return "<tr><td>" + esc(g.n.split("| ")[1]) + "</td><td>" + g.l.length + "</td></tr>"; }).join("");
      var hs = r.etapas.map(function (e) { var h = Math.round(e.h / 10) * 10; th += h; return "<tr><td>" + esc(e.nome) + "</td><td>" + h + "</td></tr>"; }).join("");
      var pad = r.pad, obra = r.pad ? '<div class="pp-card pp-verde pp-obra"><h2>E O CUSTO DA OBRA?</h2><p>PADRÃO → ' + esc(pad.nome) + " → " + esc(T.padraoRotulo(pad).replace(/^[^(]*\(|\)$/g, "").replace("/m²", "")) + "<br>ÁREA → " + T.fmtNum(Math.round(r.area || 0), 0) + "m²</p>" +
        "<p>→ " + BRL(r.m2) + '<br><b class="pp-big">' + BRL(r.obra) + "</b></p>" + (r.obraAlta ? "<p>BANDA PRA CIMA:<br>→ " + BRL(r.m2a) + '<br><b class="pp-big">' + BRL(r.obraAlta) + "</b></p>" : "") +
        '<p class="pp-mini">*Os valores são apenas estimativas em relação a padrões de mercado, podendo sofrer grandes variações a depender de diversas variáveis.</p></div>' : "";
      return [pp("pp-horas", '<div class="pp-card pp-tabs"><table class="pp-tab2"><tr class="pp-cab"><td>Entregáveis por Etapa</td><td>quant.</td></tr>' + ent + '<tr class="pp-sum"><td>TOTAL</td><td>' + tot + '</td></tr></table><p class="pp-mini">Os números são estimativas, sendo que no Projeto Executivo muitos desenhos e documentos não conseguem ser mensurados previamente.</p>' +
        '<table class="pp-tab2"><tr class="pp-cab"><td>Tempo Estimado por Etapa</td><td>horas</td></tr>' + hs + '<tr class="pp-sum"><td>TOTAL</td><td>' + th + '</td></tr></table><p class="pp-mini">Nossas estimativas de horas de desenvolvimento são baseadas em nossas experiências e geradas através do Programa de Necessidades. Reflete o altíssimo nível de dedicação e qualidade dos nossos projetos.</p></div>' + obra, n, false, ctx.marca)];
    },
    servico: function (ctx, pg, n) {
      var o = ctx.o, sv = o.serv || {}, ent = linhas(sv.entregaveis);
      return [pp("pp-dem pp-serv-pg", '<div class="pp-head"><h2>O SERVIÇO</h2><p>' + esc(sv.titulo || "Serviço") + "</p>" + (o.endereco ? "<p>" + esc(o.endereco) + "</p>" : "") + '</div><div class="pp-card pp-texto">' + paragrafos(sv.descricao) +
        (ent.length ? '<h3 class="pp-sub">ENTREGÁVEIS</h3><ul class="pp-ent">' + ent.map(function (e) { return "<li>" + esc(e) + "</li>"; }).join("") + "</ul>" : "") +
        (sv.prazo ? '<h3 class="pp-sub">PRAZO</h3><p>Até ' + esc(sv.prazo) + " dias úteis, contados da assinatura do contrato, do pagamento da 1ª parcela e do recebimento das informações necessárias.</p>" : "") + "</div>", n, false, ctx.marca)];
    },
    investimento: function (ctx, pg, n) {
      var o = ctx.o, r = ctx.r, op = ctx.opc || {}, zero = ["RES", "COM", "HOT"].indexOf(o.tipo) >= 0, marc = o.tipo === "MARC";
      var serv = o.tipo === "SERV", entS = linhas((o.serv || {}).entregaveis).slice(0, 6);
      var ets = serv ? (entS.length ? entS : ["Serviço"]) : marc ? ["Briefing", "Estudo Preliminar", "Projeto Executivo", "Pré-Obra e Orçamento"] : ["Briefing"].concat(zero ? [] : ["Levantamento"]).concat(["Estudo Preliminar"]).concat(ctx.legal ? ["Projeto Legal"] : []).concat(zero ? ["Ante Projeto"] : []).concat(["Projeto Executivo"]);
      var de = r.valor && r.tabela && r.valor < r.tabela - 1;
      var bloco = '<div class="pp-serv"><h3>' + (serv ? esc(((o.serv || {}).titulo || "SERVIÇO").toUpperCase()) : marc ? "PROJETO DE INTERIORES/MARCENARIA" : "PROJETO ARQUITETÔNICO") + '</h3><div class="pp-serv-c"><ul>' + ets.map(function (e) { return "<li>✓ " + e + "</li>"; }).join("") + '</ul><div class="pp-preco">' +
        (de ? '<span class="pp-de">' + BRL(r.tabela) + "</span>" : "") + '<b class="pp-valor">' + BRL(r.final) + "</b>" + (r.pctObra && !marc && !serv ? "<small>" + T.fmtNum(r.pctObra, 2) + "% DO CUSTO DA OBRA (aprox.)</small>" : "") + "</div></div>" +
        '<p class="pp-lbl">Formas de pagamento:</p><div class="pp-pill">' + (r.parcela ? "ENTRADA DE " + BRL(r.entrada) + " + " + r.np + " PARCELAS DE " + BRL(r.parcela) : "A COMBINAR") + "</div>" +
        (op.aposArq ? '<p class="pp-c">Pagamento iniciando após a finalização do pagamento do Projeto Arquitetônico</p>' : "") +
        '<p class="pp-c">Outras formas de pagamento poderão ser combinadas<br>Para emissão de nota fiscal considerar acréscimo de ' + T.fmtNum(ctx.nf, 0) + "%</p>" +
        '<p class="pp-c"><b>Está incluso:</b><br>RRT - Responsabilidade Técnica do Projeto</p><p class="pp-c"><b>Não está incluso:</b><br>Plotagens e Impressões' + (ctx.legal ? "<br>Taxas de Processo de Aprovação" : "") + "</p></div>";
      var extra = "";
      if (op.marc && !marc) extra += '<div class="pp-serv"><h3>PROJETO DE MARCENARIA/MOBILIÁRIOS</h3><div class="pp-serv-c"><ul><li>✓ Briefing</li><li>✓ Estudo Preliminar</li><li>✓ Projeto Executivo</li></ul><div class="pp-preco"><b class="pp-valor">' + (op.marcValor ? BRL(op.marcValor) : "A COMBINAR") + '</b></div></div><p class="pp-c">• FORMAS DE PAGAMENTO A COMBINAR</p></div>';
      if (op.adm) extra += '<div class="pp-serv"><h3>ADMINISTRAÇÃO DA OBRA</h3><div class="pp-serv-c"><ul><li>✓ Orçamento</li><li>✓ Planejamento</li><li>✓ Cronograma</li><li>✓ Adm. da Obra</li></ul><div class="pp-preco"><b class="pp-valor">' + T.fmtNum(op.admPct, 0) + '%</b></div></div><p class="pp-c">• FORMAS DE PAGAMENTO A COMBINAR</p></div>';
      return [pp("pp-inv", '<div class="pp-head"><h2>INVESTIMENTO</h2><p>Projeto é um investimento no planejamento daquilo que se deseja realizar, economiza tempo e recursos!</p></div><div class="pp-flow">' + bloco + extra + "</div>" +
        '<div class="pp-validade"><span>Proposta Válida por ' + ctx.validade + " dias</span></div>", n, true, ctx.marca)];
    }
  };
  // Monta a sequência: [{html} | {img}] na ordem do modelo, com as opcionais filtradas e a numeração contínua.
  function paginasProposta(ctx) {
    var mod = ctx.modelo || { paginas: VARIAVEIS.map(function (v) { return { t: v[0] }; }) }, out = [], n = 1, op = ctx.opc || {};
    (mod.paginas || []).forEach(function (pg) {
      if (pg.off) return;
      if (pg.opc === "marcenaria" && !op.marc) return; if (pg.opc === "adm" && !op.adm) return; if (pg.opc === "legal" && !ctx.legal) return;
      if (pg.t === "fixa") { if (pg.img) out.push({ img: pg.img, n: pg.n }); n++; return; }
      if (pg.t === "plano" && ["MARC", "SERV"].indexOf(ctx.o.tipo) >= 0) return;
      if ((pg.t === "programa" || pg.t === "horas") && ctx.o.tipo === "MARC") return;
      var f = montar[pg.t]; if (!f) return;
      var r = f(ctx, pg, n); (Array.isArray(r) ? r : [r]).forEach(function (h) { out.push({ html: h }); n++; });
    });
    return out;
  }
  async function baixarProposta(ctx, nomeArquivo, aviso) {
    await carregar(LIBS.jspdf); await carregar(LIBS.h2c);
    var pags = paginasProposta(ctx), doc = new window.jspdf.jsPDF({ unit: "pt", format: [810, 1440], compress: true });
    var palco = document.createElement("div"); palco.className = "pp-palco"; document.body.appendChild(palco);
    // o html2canvas 1.4 não lê cores oklch (tokens do app) no fundo da página: cor simples durante a geração
    var bgH = document.documentElement.style.backgroundColor, bgB = document.body.style.backgroundColor;
    document.documentElement.style.backgroundColor = "#ffffff"; document.body.style.backgroundColor = "#ffffff";
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      for (var i = 0; i < pags.length; i++) {
        if (aviso) aviso("Montando página " + (i + 1) + " de " + pags.length + "…");
        if (i) doc.addPage([810, 1440], "portrait");
        var p = pags[i];
        if (p.img) { var d = await dataUrl(blob(p.img)); doc.addImage(d, d.indexOf("image/png") > 0 ? "PNG" : "JPEG", 0, 0, 810, 1440); continue; }
        palco.innerHTML = p.html; await imagensProntas(palco);
        var cv = await window.html2canvas(palco.firstChild, { scale: 1.5, backgroundColor: null, useCORS: true, logging: false });
        doc.addImage(cv.toDataURL("image/jpeg", 0.9), "JPEG", 0, 0, 810, 1440);
      }
    } finally { palco.remove(); document.documentElement.style.backgroundColor = bgH; document.body.style.backgroundColor = bgB; }
    if (aviso) aviso("Salvando…");
    await T.downloads.save({ filename: nomeArquivo, data: doc.output("arraybuffer") });
  }
  function imagensProntas(el) { return Promise.all(Array.prototype.map.call(el.querySelectorAll("img"), function (im) { return im.complete ? null : new Promise(function (ok) { im.onload = im.onerror = ok; }); })); }
  async function dataUrl(url) { var b = await (await fetch(url)).blob(); return new Promise(function (ok) { var fr = new FileReader(); fr.onload = function () { ok(fr.result); }; fr.readAsDataURL(b); }); }

  // ---------- contrato: preenche o .docx oficial ----------
  function xmlEsc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function textoP(p) { return (p.match(/<w:t[^>]*>[^<]*<\/w:t>/g) || []).map(function (t) { return t.replace(/<[^>]+>/g, ""); }).join(""); }
  // troca {campo} nos textos do parágrafo (os campos estão inteiros num único <w:t>, conferido nos 6 modelos)
  function trocar(p, campos) { return p.replace(/\{([a-z0-9_]+)\}/g, function (m, k) { return campos[k] != null ? xmlEsc(campos[k]) : m; }); }
  // parágrafo modelo repetido para cada linha de texto (escopo, programa, anexo do briefing, móveis)
  function repetir(p, campo, linhas) { if (!linhas.length) linhas = [""]; return linhas.map(function (l) { var o = {}; o[campo] = l; return trocar(p, o); }).join(""); }
  async function gerarContrato(base64, d) {
    await carregar(LIBS.jszip);
    var zip = await window.JSZip.loadAsync(base64, { base64: true }), xml = await zip.file("word/document.xml").async("string");
    var corpoIni = xml.indexOf("<w:body>") + 8, corpoFim = xml.lastIndexOf("<w:sectPr"), corpo = xml.slice(corpoIni, corpoFim);
    var RP = /<w:p[ >][\s\S]*?<\/w:p>/g;
    // página de instruções: do parágrafo "INSTRUÇÕES DE PREENCHIMENTO" ao fim, com a quebra de página que vem antes
    var m, ant = null, corte = -1;
    while ((m = RP.exec(corpo))) { if (/INSTRUÇÕES DE PREENCHIMENTO/.test(textoP(m[0]))) { corte = ant && /w:type="page"/.test(ant.s) && !textoP(ant.s).trim() ? ant.i : m.index; break; } ant = { s: m[0], i: m.index }; }
    if (corte >= 0) corpo = corpo.slice(0, corte);
    var parcelas = d.parcelas || [], etapaPrazo = null, ultLinha = "", clientes = d.clientes && d.clientes.length ? d.clientes : [d.campos];
    corpo = corpo.replace(RP, function (p) {
      var t = textoP(p), tt = t.trim();
      if (/^3\.3\.\d/.test(tt)) etapaPrazo = /Estudo Preliminar/.test(t) ? "ep" : /Projeto Executivo/.test(t) ? "pe" : /Projeto Legal/.test(t) ? "plDev" : /Levantamento/.test(t) ? "lev" : null;
      if (/\{parcela_1_valor\}|\{parcela_2_valor\}/.test(t)) return ""; // a linha "n" vira uma linha por parcela
      if (/\{parcela_n_valor\}/.test(t)) return parcelas.map(function (pc, k) { return trocar(p, { parcela_n: k + 1, parcela_n_valor: numBR(pc.valor), parcela_n_extenso: reaisExtenso(pc.valor), parcela_n_vencimento: pc.vencimento ? T.fmtYmd(pc.vencimento) : "a combinar" }); }).join("");
      if (tt === "{escopo_descricao}") return repetir(p, "escopo_descricao", d.escopoLinhas || []);
      if (tt === "{programa_necessidades}") return repetir(p, "programa_necessidades", d.programaLinhas || []);
      if (tt === "{entregaveis}") return repetir(p, "entregaveis", d.entregaveis || []);
      // mais de um contratante: o parágrafo de qualificação e a linha de assinatura se repetem para cada um
      if (/^CONTRATANTE:/.test(tt) && /\{cliente_nome\}/.test(t)) return clientes.map(function (c) { return trocar(p, c); }).join("");
      if (/^_{10,}$/.test(tt)) ultLinha = p;
      if (/^\{cliente_nome\}/.test(tt) && /CPF/.test(t)) return clientes.map(function (c, k) { return (k ? ultLinha : "") + trocar(p, c); }).join("");
      if (tt === "{anexar_respostas_do_briefing}") return repetir(p, "anexar_respostas_do_briefing", d.briefingLinhas || []);
      if (/\{ambiente_1\}/.test(t)) return (d.moveis && d.moveis.length ? d.moveis : [["", ""]]).map(function (x) { return trocar(p, { ambiente_1: x[0], moveis_1: x[1] }); }).join("");
      if (/\{ambiente_2\}|\{ambiente_n\}/.test(t)) return "";
      if (/\{imovel_matricula\}/.test(t) && !d.campos.imovel_matricula) p = p.replace(/(<w:t[^>]*>), matrícula nº (<\/w:t>)/, "$1$2").replace("{imovel_matricula}", "");
      // prazos em amarelo: muda só o número negociado (diferente do padrão); senão fica o do modelo
      if (/^Prazos?:/.test(tt) && etapaPrazo && d.prazos && d.prazos[etapaPrazo]) p = p.replace(/(<w:r[ >](?:(?!<\/w:r>)[\s\S])*?<w:highlight[^>]*\/>(?:(?!<\/w:r>)[\s\S])*?<w:t[^>]*>)([^<]*)(<\/w:t>)/, function (x, a, b, c) { return a + xmlEsc(String(d.prazos[etapaPrazo])) + c; });
      return trocar(p, d.campos);
    });
    zip.file("word/document.xml", xml.slice(0, corpoIni) + corpo.replace(/<w:highlight [^>]*\/>/g, "") + xml.slice(corpoFim));
    return zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });
  }
  // .docx escolhido pelo usuário → texto base64 (para guardar no armazenamento de arquivos do app)
  function arquivoBase64(file) { return new Promise(function (ok, erro) { var fr = new FileReader(); fr.onload = function () { ok(String(fr.result).split(",")[1]); }; fr.onerror = erro; fr.readAsDataURL(file); }); }
  // aceita o base64 puro (text/plain) ou embrulhado num script ("…";), forma usada quando só se pode enviar scripts
  async function lerAsset(id) { var r = await fetch(blob(id)); if (!r.ok) throw new Error("Arquivo do modelo não encontrado"); var t = (await r.text()).trim(), m = t.match(/"([A-Za-z0-9+\/=\s]+)"/); return (m ? m[1] : t).replace(/\s+/g, ""); }

  // ---------- IA: texto "Sua demanda" ----------
  function promptDemanda(o, exemplos, orientacao, atual) {
    var dir = (o.briefing && o.briefing.dir) || {}, amb = ((o.programa || {}).amb || []).map(function (a) { return a.nome + (a.qtd > 1 ? " (" + a.qtd + ")" : ""); }).join(", ");
    return "Você escreve o texto \"Sua demanda\" das propostas comerciais da Trilha Arquitetura Brasileira (escritório de Juiz de Fora/MG).\n" +
      "Jeito Trilha: 3ª pessoa, sobre a casa e o desejo do cliente; ordem: uso e lugar → desejo estético → terreno, topografia e vista → materiais e sistema construtivo → ambiente protagonista e relação com o exterior → sensação esperada → síntese (\"A demanda consiste em…\"); fecho com uma imagem própria quando couber. 250 a 380 palavras, 3 a 5 parágrafos, português do Brasil, sem títulos, sem listas, sem inventar fatos que não estejam nos dados.\n\n" +
      "TEXTOS EXEMPLARES (estilo a seguir, não copiar):\n" + (exemplos || []).map(function (e, i) { return "--- Exemplo " + (i + 1) + " ---\n" + e; }).join("\n") + "\n\n" +
      "DADOS DESTA OPORTUNIDADE\nTipo: " + tituloTipo(o.tipo) + "\nLocal: " + (o.endereco || "—") + "\nÁrea estimada: " + (o.sim && o.sim.area || "—") + "\nAmbientes: " + (amb || "—") + "\n" +
      "Impressões do arquiteto: " + (o.impressoes || "—") + "\n" + Object.keys(dir).map(function (k) { return dir[k] ? "[" + k + "]\n" + dir[k] : ""; }).filter(Boolean).join("\n") + "\n\n" +
      (atual ? "TEXTO ATUAL:\n" + atual + "\n\nReescreva o texto atual seguindo esta orientação: " + (orientacao || "melhore a fluidez") + "\n\n" : "") +
      "Responda só com o texto final.";
  }
  async function escreverDemanda(o, exemplos, orientacao, atual, onText) {
    var sample = window.claude && window.claude.use ? await window.claude.use("sample") : null;
    if (!sample) throw new Error("A IA não está disponível nesta visualização.");
    var r = await sample(promptDemanda(o, exemplos, orientacao, atual), { modelTier: "default", onText: onText ? function (e) { onText(e.text); } : undefined });
    return (r && r.text || "").trim();
  }

  // ---------- IA: serviço menor (o sócio descreve; a IA organiza título, descrição, entregáveis, prazo e horas) ----------
  async function montarServico(o, pedido, exemplos) {
    var sample = window.claude && window.claude.use ? await window.claude.use("sample") : null;
    if (!sample) throw new Error("A IA não está disponível nesta visualização.");
    var p = "Você organiza propostas de serviços menores da Trilha Arquitetura Brasileira (Juiz de Fora/MG): consultorias, layouts, visitas técnicas, laudos, pequenos projetos.\n" +
      "A partir do pedido do arquiteto, devolva SÓ um JSON: {\"titulo\": string curta (ex.: \"Consultoria de layout da cozinha\"), \"descricao\": 2 a 3 parágrafos em 3ª pessoa no tom da Trilha, sem inventar fatos, " +
      "\"entregaveis\": lista de 2 a 6 itens objetivos, \"prazo\": dias úteis (número), \"horas\": horas de trabalho estimadas (número, conservador)}.\n" +
      (exemplos && exemplos.length ? "Estilo de escrita da Trilha (referência):\n" + exemplos[0].slice(0, 900) + "\n\n" : "") +
      "Cliente: " + ((o.cliente && o.cliente.nome) || "—") + "\nLocal: " + (o.endereco || "—") + "\nNotas: " + (o.notas || "—") + "\nPedido do arquiteto: " + pedido;
    var r = await sample.json(p, { modelTier: "quick" });
    return r || {};
  }
  T.comercialDocs = { montarServico: montarServico, VARIAVEIS: VARIAVEIS, paginasProposta: paginasProposta, baixarProposta: baixarProposta, planoProposta: planoProposta, gerarContrato: gerarContrato, arquivoBase64: arquivoBase64, lerAsset: lerAsset,
    reaisExtenso: reaisExtenso, numBR: numBR, dataExtenso: dataExtenso, ddmmaa: ddmmaa, escreverDemanda: escreverDemanda, carregar: carregar, blob: blob };
})();
