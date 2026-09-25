/* Módulo Financeiro — painel, recebimentos (contratos e parcelas), despesas, remuneração da equipe e recibos.
 * Dados: fin_config/geral, fin_contratos/<id> {parcelas[]}, fin_mov/<AAAA-MM> {itens[]}, fin_recorrentes/lista {itens[]}.
 * Lê: Trilha.tempo (horas) e Trilha.relatorios (fechamentos → remuneração). Regras em REGRAS.md. */
(function () {
  "use strict";
  var T = window.Trilha, $ = T.$, esc = T.esc, ymd = T.ymd, pad = T.pad, BRL = T.fmtBRL;

  var DEF = {
    contas: [{ id: "luan", nome: "Conta Luan" }, { id: "dinheiro", nome: "Dinheiro em espécie" }],
    categorias: [
      { id: "hon", nome: "Honorários de projeto", tipo: "entrada" },
      { id: "obra-e", nome: "Acompanhamento de obra", tipo: "entrada" },
      { id: "cons", nome: "Consultoria", tipo: "entrada" },
      { id: "reemb", nome: "Reembolso de despesas", tipo: "entrada" },
      { id: "outras-e", nome: "Outras entradas", tipo: "entrada" },
      { id: "soft", nome: "Softwares e licenças", tipo: "saida" },
      { id: "espaco", nome: "Espaço de trabalho (aluguel, energia, internet)", tipo: "saida" },
      { id: "tel", nome: "Telefone e comunicação", tipo: "saida" },
      { id: "plot", nome: "Plotagem e impressão", tipo: "saida" },
      { id: "desloc", nome: "Deslocamento", tipo: "saida" },
      { id: "terceiros", nome: "Terceiros no projeto", tipo: "saida" },
      { id: "taxas", nome: "Taxas e registros (CAU, RRT, prefeitura)", tipo: "saida" },
      { id: "mkt", nome: "Marketing", tipo: "saida" },
      { id: "equip", nome: "Equipamentos e manutenção", tipo: "saida" },
      { id: "cap", nome: "Capacitação", tipo: "saida" },
      { id: "imp", nome: "Impostos", tipo: "saida" },
      { id: "outras-s", nome: "Outras despesas", tipo: "saida" },
      { id: "equipe", nome: "Remuneração da equipe", tipo: "saida", grupo: "equipe", fixa: true },
      { id: "lucro", nome: "Retirada de lucro", tipo: "saida", grupo: "lucro", fixa: true },
      { id: "reserva", nome: "Guardado na reserva", tipo: "saida", grupo: "reserva", fixa: true },
      { id: "reserva-e", nome: "Resgate da reserva", tipo: "entrada", grupo: "reserva", fixa: true }
    ],
    impostoPct: null, diaPagamentoEquipe: 5, contaPadrao: "luan", formaPadrao: "Pix",
    recibo: { nome: "", doc: "", cidade: "", contato: "" }, proximoRecibo: 1
  };
  var FORMAS = ["Pix", "Dinheiro", "Transferência", "Boleto", "Cartão"];
  // Checklist para mapear as despesas fixas: [descrição, categoria, frequência, % do escritório sugerido]
  var MAPA = [
    ["Autodesk (AutoCAD, Revit)", "soft", "mensal", 100], ["SketchUp", "soft", "anual", 100],
    ["Render (Enscape, V-Ray, Lumion)", "soft", "mensal", 100], ["Adobe (Photoshop, Acrobat)", "soft", "mensal", 100],
    ["Google Workspace ou Microsoft 365", "soft", "mensal", 100], ["Armazenamento em nuvem", "soft", "mensal", 100],
    ["Internet", "espaco", "mensal", 50], ["Energia elétrica", "espaco", "mensal", 30],
    ["Aluguel ou coworking", "espaco", "mensal", 100], ["Celular", "tel", "mensal", 50],
    ["Domínio e site", "mkt", "anual", 100], ["Anúncios e redes sociais", "mkt", "mensal", 100],
    ["Anuidade CAU", "taxas", "anual", 100], ["Combustível e estacionamento", "desloc", "mensal", 50],
    ["Contador", "outras-s", "mensal", 100], ["Cursos e assinaturas técnicas", "cap", "mensal", 100]
  ];
  var PAGES = [["inicio", "Painel"], ["receitas", "Receitas"], ["despesas", "Despesas"], ["contratos", "Contratos"], ["ajustes", "Ajustes"]];

  var S = {
    cfgDoc: null, contratos: [], movDocs: {}, rec: [], mes: T.mesAtual(), page: "inicio",
    recFiltro: "mes", conFiltro: "ativo", form: null, idx: {}, abertos: {}, pagarAberto: T.ls("fin.pagar") === "1",
    recebidasAberto: false, lanc: null, ce: null, ceParc: {}, re: null, recibo: null, logo: null, busy: false
  };

  // ---------- utilidades ----------
  function cfg() { var c = S.cfgDoc || {}, o = {}; Object.keys(DEF).forEach(function (k) { o[k] = c[k] != null ? c[k] : DEF[k]; }); o.recibo = Object.assign({}, DEF.recibo, c.recibo || {}); o.teste = !!c.teste; return o; }
  function hoje() { return ymd(new Date()); }
  function mesDe(s) { return s ? String(s).slice(0, 7) : ""; }
  function addMes(mes, n) { var d = new Date(+mes.slice(0, 4), +mes.slice(5, 7) - 1 + n, 1); return ymd(d).slice(0, 7); }
  function lastDay(mes) { return new Date(+mes.slice(0, 4), +mes.slice(5, 7), 0).getDate(); }
  function vencDia(mes, dia) { return mes + "-" + pad(Math.min(Math.max(1, dia || 1), lastDay(mes))); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function mesCurto(mes) { return T.MESES[+mes.slice(5, 7) - 1]; }
  function fmtDM(s) { return s ? s.slice(8, 10) + "/" + s.slice(5, 7) : ""; }
  function num(v) { return T.numOrNull(v); }
  function r2(v) { return Math.round(v * 100) / 100; }
  function cat(id) { return T.byId(cfg().categorias, id); }
  function nomeCat(id) { var c = cat(id); return c ? c.nome : ""; }
  function grupo(id) { var c = cat(id); return c && c.grupo || "normal"; }
  function nomeConta(id) { var c = T.byId(cfg().contas, id); return c ? c.nome : ""; }
  function projNome(id) { var p = id && T.projeto(id); return p ? p.nome : ""; }
  function soma(list, f) { return list.reduce(function (s, x) { return s + ((f ? f(x) : x.valor) || 0); }, 0); }
  function reg(e) { S.idx[e.key] = e; return e; }

  // ---------- leitura dos dados ----------
  function movs() {
    var out = [];
    Object.keys(S.movDocs).forEach(function (mes) { S.movDocs[mes].forEach(function (m) { var o = Object.assign({}, m); o._mes = mes; out.push(o); }); });
    return out;
  }
  function entParc(c, p, i) {
    var pago = !!p.recebidoEm, N = (c.parcelas || []).length;
    p = /^parcela\s*\d+$/i.test(p.descricao || "") ? Object.assign({}, p, { descricao: "" }) : p; // "Parcela 3" já está no número
    return reg({
      key: "p:" + c.id + ":" + p.id, kind: "parc", tipo: "entrada", cId: c.id, pId: p.id,
      titulo: projNome(c.projetoId) || c.cliente || "Contrato", cliente: c.cliente, clienteDoc: c.clienteDoc,
      sub: "Parcela " + (i + 1) + "/" + N + (p.descricao ? " · " + p.descricao : "") + (c.cliente ? " · " + c.cliente : ""),
      referente: "parcela " + (i + 1) + " de " + N + (p.descricao ? " (" + p.descricao + ")" : "") + " dos honorários de " + (c.servico || "serviços de arquitetura") + (projNome(c.projetoId) ? ", projeto " + projNome(c.projetoId) : ""),
      venc: p.vencimento, valor: pago && p.valorRecebido != null ? p.valorRecebido : p.valor, status: pago ? "paga" : "aberta",
      pagoEm: p.recebidoEm, forma: p.forma, conta: p.conta, recibo: p.recibo, categoriaId: "hon", projetoId: c.projetoId, anterior: p.anterior
    });
  }
  function entMov(m) {
    return reg({
      key: "m:" + m._mes + ":" + m.id, kind: "mov", tipo: m.tipo, mes: m._mes, id: m.id,
      titulo: m.descricao || nomeCat(m.categoriaId), cliente: m.cliente, referente: m.descricao || nomeCat(m.categoriaId),
      sub: [m.descricao ? nomeCat(m.categoriaId) : "", projNome(m.projetoId), m.cliente].filter(Boolean).join(" · "),
      venc: m.vencimento, valor: m.valor, status: m.status === "paga" ? "paga" : m.status === "pulada" ? "pulada" : "aberta",
      pagoEm: m.pagoEm, forma: m.forma, conta: m.conta, recibo: m.recibo, categoriaId: m.categoriaId, projetoId: m.projetoId,
      recId: m.recId, fechId: m.fechId, manual: !m.recId && !m.fechId
    });
  }
  function parcelas() { var out = []; S.contratos.forEach(function (c) { (c.parcelas || []).forEach(function (p, i) { out.push(entParc(c, p, i)); }); }); return out; }
  function recOcorre(r, mes) {
    if (r.inicio && mes < r.inicio) return false;
    if (r.fim && mes > r.fim) return false;
    return r.freq === "anual" ? +mes.slice(5, 7) === (r.mesAnual || 1) : true;
  }
  function valorRec(r) { return r2((r.valor || 0) * (r.pct == null ? 100 : r.pct) / 100); }
  function virtRec(mes, M) {
    return S.rec.filter(function (r) { return recOcorre(r, mes) && !M.rec[r.id + ":" + mes]; }).map(function (r) {
      return reg({
        key: "r:" + r.id + ":" + mes, kind: "rec", tipo: "saida", recId: r.id, refMes: mes, titulo: r.descricao,
        sub: nomeCat(r.categoriaId) + (r.pct != null && r.pct < 100 ? " · " + r.pct + "% de " + BRL(r.valor) : "") + (r.freq === "anual" ? " · anual" : " · todo mês"),
        venc: vencDia(mes, r.dia), valor: valorRec(r), status: "aberta", categoriaId: r.categoriaId, virtual: true
      });
    });
  }
  function virtEquipe(M) {
    if (!T.relatorios) return [];
    var F = T.relatorios.fechamentos();
    return Object.keys(F).map(function (k) { return F[k]; }).filter(function (f) { return f.valor != null && f.valor > 0 && !M.fech[f.id]; }).map(function (f) {
      var p = T.pessoa(f.pessoaId);
      return reg({
        key: "f:" + f.id, kind: "fech", tipo: "saida", fechId: f.id, refMes: f.mes, titulo: "Remuneração · " + (p ? p.nome : f.pessoaId),
        sub: cap(T.mesNome(f.mes)) + " · " + T.fmtH(f.min) + " × " + BRL(f.valorHora), venc: vencDia(addMes(f.mes, 1), cfg().diaPagamentoEquipe),
        valor: f.valor, status: "aberta", categoriaId: "equipe", virtual: true
      });
    });
  }
  // Tudo de uma vez: entradas e saídas (reais e previstas), com recorrentes e remunerações ainda não pagas.
  function dados() {
    var M = { rec: {}, fech: {} }, lista = movs();
    lista.forEach(function (m) { if (m.recId) M.rec[m.recId + ":" + m.refMes] = 1; if (m.fechId) M.fech[m.fechId] = 1; });
    var ent = parcelas(), sai = [];
    lista.forEach(function (m) { (m.tipo === "entrada" ? ent : sai).push(entMov(m)); });
    var ini = addMes(S.mes, -12), fimMes = addMes(T.mesAtual() > S.mes ? T.mesAtual() : S.mes, 3);
    for (var mes = ini; mes <= fimMes; mes = addMes(mes, 1)) sai = sai.concat(virtRec(mes, M));
    sai = sai.concat(virtEquipe(M));
    return { ent: ent, sai: sai };
  }
  function pagoNoMes(e, mes) { return e.status === "paga" && mesDe(e.pagoEm) === mes; }
  function equipeMes(mes) {
    if (!T.relatorios) return { valor: 0, ok: true };
    var F = T.relatorios.fechamentos(), tot = 0, ok = true, feito = {};
    Object.keys(F).forEach(function (k) { var f = F[k]; if (f.mes !== mes) return; feito[f.pessoaId] = 1; if (f.valor == null) ok = false; else tot += f.valor; });
    if (mes >= addMes(T.mesAtual(), -1)) T.pessoasAtivas().forEach(function (p) {
      if (feito[p.id]) return;
      var c = T.relatorios.calcFechamento(p.id, mes); if (!c.dias) return;
      if (c.valor == null) ok = false; else tot += c.valor;
    });
    return { valor: r2(tot), ok: ok };
  }
  function resumoMes(D, mes) {
    var entrou = soma(D.ent.filter(function (e) { return pagoNoMes(e, mes) && grupo(e.categoriaId) !== "reserva"; }));
    var desp = soma(D.sai.filter(function (e) { return pagoNoMes(e, mes) && grupo(e.categoriaId) === "normal"; }));
    var eq = equipeMes(mes);
    return { mes: mes, entrou: r2(entrou), desp: r2(desp), equipe: eq.valor, equipeOk: eq.ok, saiu: r2(desp + eq.valor), resultado: r2(entrou - desp - eq.valor) };
  }

  // ---------- gravação ----------
  async function saveCfg(patch) {
    var ref = T.db.doc("fin_config/geral");
    if (S.cfgDoc) await ref.update(patch);
    else { var full = T.clone(DEF); Object.keys(patch).forEach(function (k) { full[k] = patch[k]; }); await ref.set(full); }
  }
  async function gravarMes(mes, itens) { S.movDocs[mes] = itens; await T.db.doc("fin_mov/" + mes).set({ mes: mes, itens: itens }); }
  async function addMov(m) {
    m.id = T.novoId(); m.criadoEm = new Date().toISOString();
    var mes = mesDe(m.vencimento), itens = T.clone(S.movDocs[mes] || []); itens.push(m);
    await gravarMes(mes, itens); return m;
  }
  async function updMov(mes, id, patch) {
    var itens = T.clone(S.movDocs[mes] || []), i = itens.findIndex(function (x) { return x.id === id; }); if (i < 0) return;
    var novo = Object.assign({}, itens[i], patch), novoMes = mesDe(novo.vencimento);
    if (novoMes === mes) { itens[i] = novo; await gravarMes(mes, itens); }
    else { itens.splice(i, 1); var outro = T.clone(S.movDocs[novoMes] || []); outro.push(novo); await gravarMes(novoMes, outro); await gravarMes(mes, itens); }
  }
  async function delMov(mes, id) { await gravarMes(mes, T.clone(S.movDocs[mes] || []).filter(function (x) { return x.id !== id; })); }
  async function updParcela(cId, pId, patch) {
    var c = T.byId(S.contratos, cId); if (!c) return;
    var ps = T.clone(c.parcelas || []);
    ps.forEach(function (p, i) { if (p.id === pId) ps[i] = Object.assign({}, p, patch); });
    c.parcelas = ps;
    await T.db.doc("fin_contratos/" + cId).update({ parcelas: ps });
  }
  async function saveRec(itens) { S.rec = itens; await T.db.doc("fin_recorrentes/lista").set({ itens: itens }); }

  // Confirma um recebimento ou pagamento. `recibo` (opcional) já grava o número do recibo na mesma escrita.
  async function confirmar(e, d, recibo) {
    var extra = recibo ? { recibo: recibo } : {};
    if (e.kind === "parc") await updParcela(e.cId, e.pId, Object.assign({ recebidoEm: d.data, valorRecebido: d.valor, forma: d.forma, conta: d.conta, anterior: false }, extra));
    else if (e.kind === "mov") await updMov(e.mes, e.id, Object.assign({ status: "paga", pagoEm: d.data, valor: d.valor, forma: d.forma || null, conta: d.conta }, extra));
    else await addMov({ tipo: "saida", descricao: e.titulo, categoriaId: e.categoriaId, valor: d.valor, vencimento: e.venc, status: "paga", pagoEm: d.data, conta: d.conta,
      recId: e.recId || null, fechId: e.fechId || null, refMes: e.refMes, origem: e.kind === "fech" ? "fechamento" : "recorrente" });
  }
  async function desfazer(e) {
    if (e.kind === "parc") await updParcela(e.cId, e.pId, { recebidoEm: null, valorRecebido: null, forma: null, conta: null, anterior: false });
    else if (e.recId || e.fechId) await delMov(e.mes, e.id);
    else await updMov(e.mes, e.id, { status: "prevista", pagoEm: null });
  }
  async function pular(e) {
    await addMov({ tipo: "saida", descricao: e.titulo, categoriaId: e.categoriaId, valor: e.valor, vencimento: e.venc, status: "pulada", pagoEm: null,
      recId: e.recId || null, fechId: e.fechId || null, refMes: e.refMes, origem: e.kind === "fech" ? "fechamento" : "recorrente" });
  }
  function reservarNumero() { var n = cfg().proximoRecibo || 1; return { n: n, emitidoEm: new Date().toISOString() }; }

  // ---------- linhas (a receber / a pagar) ----------
  function row(e) {
    var late = e.status === "aberta" && e.venc < hoje(), done = e.status !== "aberta";
    var quando = done ? (e.status === "pulada" ? "não houve" : (e.tipo === "entrada" ? "recebido " : "pago ") + fmtDM(e.pagoEm)) : late ? "atrasada" : "vence";
    if (e.anterior && done) quando = "antes do app";
    var acts = "";
    if (!done) {
      acts = '<button class="btn btn-small btn-ok" data-ok="' + esc(e.key) + '">' + (e.tipo === "entrada" ? "Recebido ✓" : "Pago ✓") + "</button>";
      if (e.virtual) acts += '<button class="link" data-pular="' + esc(e.key) + '" title="Não houve este mês">Não houve</button>';
    } else {
      if (e.tipo === "entrada" && e.status === "paga" && grupo(e.categoriaId) !== "reserva") acts += '<button class="btn btn-small" data-recibo="' + esc(e.key) + '">' + (e.recibo ? "Recibo nº " + e.recibo.n : "Recibo") + "</button>";
      acts += '<button class="link" data-desfazer="' + esc(e.key) + '">Desfazer</button>';
    }
    if (e.kind === "mov" && e.manual) acts += '<button class="link" data-editm="' + esc(e.key) + '">Editar</button>';
    var info = done && e.status === "paga" ? [e.forma, nomeConta(e.conta)].filter(Boolean).join(" · ") : "";
    return '<div class="fin-row' + (late ? " late" : "") + (done ? " done" : "") + '" data-key="' + esc(e.key) + '">' +
      '<div class="fin-date">' + (done && e.pagoEm ? fmtDM(e.pagoEm) : fmtDM(e.venc)) + "<small>" + quando + "</small></div>" +
      '<div class="fin-main"><div class="fin-title">' + esc(e.titulo) + '</div><div class="fin-sub">' + esc([e.sub, info].filter(Boolean).join(" · ")) + "</div></div>" +
      '<div class="fin-val">' + (e.status === "pulada" ? "—" : BRL(e.valor)) + '</div><div class="fin-act">' + acts + "</div>" +
      (S.form === e.key ? formHtml(e) : "") + "</div>";
  }
  function formHtml(e) {
    var c = cfg(), ent = e.tipo === "entrada";
    return '<div class="fin-form grid-form" data-form="' + esc(e.key) + '">' +
      '<div class="field col-3 keep"><label for="ff-data">Data</label><input type="date" id="ff-data" value="' + hoje() + '"></div>' +
      '<div class="field col-3 keep"><label for="ff-valor">Valor (R$)</label><input type="number" id="ff-valor" min="0" step="0.01" inputmode="decimal" value="' + (e.valor != null ? e.valor : "") + '"></div>' +
      (ent ? '<div class="field col-3 keep"><label for="ff-forma">Forma</label><select id="ff-forma">' + T.optHtml(FORMAS.map(function (f) { return [f, f]; }), c.formaPadrao) + "</select></div>" : "") +
      '<div class="field col-3 keep"><label for="ff-conta">Conta</label><select id="ff-conta">' + T.optHtml(c.contas.map(function (x) { return [x.id, x.nome]; }), c.contaPadrao) + "</select></div>" +
      '<div class="col-12 form-actions">' + (ent ? '<label class="check"><input type="checkbox" id="ff-recibo"> Gerar recibo</label>' : "") +
      '<button class="btn btn-small btn-primary" data-confirmar="' + esc(e.key) + '">' + (ent ? "Confirmar recebimento" : "Confirmar pagamento") + '</button><button class="btn btn-small" data-cancelar="1">Cancelar</button></div></div>';
  }
  function lista(list, vazio) { return list.length ? list.map(row).join("") : '<div class="empty">' + vazio + "</div>"; }
  function porVenc(a, b) { return a.venc < b.venc ? -1 : a.venc > b.venc ? 1 : 0; }
  function porPago(a, b) { return (b.pagoEm || "") < (a.pagoEm || "") ? -1 : 1; }

  // ---------- gráfico ----------
  // Passo "redondo" do eixo (1, 2, 2,5 ou 5 × 10ⁿ) para ~4 marcações; o topo é um múltiplo do passo.
  function niceStep(v) {
    if (v <= 0) return 250;
    var e = Math.pow(10, Math.floor(Math.log10(v))), c = [1, 2, 2.5, 5, 10, 20];
    for (var i = 0; i < c.length; i++) if (Math.ceil(v * 4 / (c[i] * e)) <= 5) return c[i] * e;
    return 20 * e;
  }
  function fmtK(v) { return v >= 1000 ? T.fmtNum(v / 1000, 1) + " mil" : T.fmtNum(v, 0); }
  function barPath(x, y, w, h) { if (h <= 0) return ""; var r = Math.min(4, h, w / 2); return "M" + x + "," + (y + h) + "V" + (y + r) + "Q" + x + "," + y + " " + (x + r) + "," + y + "H" + (x + w - r) + "Q" + (x + w) + "," + y + " " + (x + w) + "," + (y + r) + "V" + (y + h) + "Z"; }
  function renderChart(serie) {
    var box = $("fi-chart"), W = Math.max(300, box.clientWidth || 600), H = 210, pl = 52, pr = 6, pt = 10, pb = 26;
    var topo = Math.max.apply(null, serie.map(function (m) { return Math.max(m.entrou, m.saiu); })), step = niceStep(topo / 4), nt = Math.max(1, Math.ceil(topo / step)), max = step * nt, n = serie.length;
    var bw = (W - pl - pr) / n, bar = Math.max(4, Math.min(20, (bw - 12) / 2)), ih = H - pt - pb;
    var y = function (v) { return pt + ih - v / max * ih; };
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Entradas e saídas dos últimos 12 meses">';
    for (var t = 0; t <= nt; t++) { var v = step * t, yy = Math.round(y(v)) + 0.5; s += '<line class="grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + yy + '" y2="' + yy + '"/><text class="ax" x="' + (pl - 8) + '" y="' + (yy + 4) + '" text-anchor="end">' + fmtK(v) + "</text>"; }
    serie.forEach(function (m, i) {
      var x0 = pl + i * bw, cx = x0 + bw / 2, ha = m.entrou / max * ih, hb = m.saiu / max * ih;
      s += '<rect class="band" data-i="' + i + '" x="' + x0 + '" y="' + pt + '" width="' + bw + '" height="' + (ih + pb) + '"/>';
      s += '<path class="ba" pointer-events="none" d="' + barPath(cx - bar - 1, pt + ih - ha, bar, ha) + '"/><path class="bb" pointer-events="none" d="' + barPath(cx + 1, pt + ih - hb, bar, hb) + '"/>';
      var lab = mesCurto(m.mes).slice(0, 3) + (m.mes.slice(5) === "01" && bw >= 40 ? "/" + m.mes.slice(2, 4) : "");
      if (bw < 36 && m.mes !== S.mes && (n - 1 - i) % 2) lab = "";
      s += '<text class="ax' + (m.mes === S.mes ? " cur" : "") + '" pointer-events="none" x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle">' + lab + "</text>";
    });
    box.innerHTML = s + "</svg>";
    S.serie = serie;
  }
  function showTip(i, band) {
    var m = S.serie && S.serie[i], tip = $("fi-tip"); if (!m) return;
    T.each(".band.on", function (b) { b.classList.remove("on"); }, $("fi-chart")); band.classList.add("on");
    tip.innerHTML = "<b>" + cap(T.mesNome(m.mes)) + '</b><br><i style="background:var(--serie-a)"></i>Entrou ' + BRL(m.entrou) + '<br><i style="background:var(--serie-b)"></i>Saiu ' + BRL(m.saiu) +
      '<br>Resultado <b>' + BRL(m.resultado) + "</b>";
    tip.hidden = false;
    var card = tip.parentNode.getBoundingClientRect(), r = band.getBoundingClientRect(), left = r.left - card.left + r.width / 2 - tip.offsetWidth / 2;
    tip.style.left = Math.max(8, Math.min(card.width - tip.offsetWidth - 8, left)) + "px"; tip.style.top = "38px";
  }

  // ---------- páginas ----------
  function renderInicio(D) {
    var serie = [], ano = S.mes.slice(0, 4), acum = 0;
    for (var i = 11; i >= 0; i--) serie.push(resumoMes(D, addMes(S.mes, -i)));
    for (var m = ano + "-01"; m <= S.mes; m = addMes(m, 1)) acum += resumoMes(D, m).resultado;
    var R = serie[11], P = serie[10], delta = P.entrou > 0 ? Math.round((R.entrou - P.entrou) / P.entrou * 100) : null;
    var nRec = D.ent.filter(function (e) { return pagoNoMes(e, S.mes) && grupo(e.categoriaId) !== "reserva"; }).length;
    $("fi-tiles").innerHTML =
      '<div class="card tile"><small>Entrou</small><b>' + BRL(R.entrou) + "</b><span>" + nRec + (nRec === 1 ? " recebimento" : " recebimentos") + (delta != null ? " · " + (delta >= 0 ? "▲ " : "▼ ") + Math.abs(delta) + "% sobre " + mesCurto(P.mes) : "") + "</span></div>" +
      '<div class="card tile"><small>Saiu</small><b>' + BRL(R.saiu) + "</b><span>Despesas " + BRL(R.desp) + " · Equipe " + (R.equipeOk ? BRL(R.equipe) : BRL(R.equipe) + "*") + "</span></div>" +
      '<div class="card tile ' + (R.resultado >= 0 ? "good" : "bad") + '"><small>Resultado do mês</small><b>' + BRL(R.resultado) + "</b><span>o que sobra para o escritório</span></div>" +
      '<div class="card tile ' + (acum >= 0 ? "good" : "bad") + '"><small>Resultado em ' + ano + "</small><b>" + BRL(r2(acum)) + "</b><span>acumulado de janeiro a " + mesCurto(S.mes) + "</span></div>";
    renderChart(serie);
    // próximos 90 dias
    var lim = ymd(T.addDays(new Date(), 90)), aRec = D.ent.filter(function (e) { return e.status === "aberta" && e.venc <= lim; });
    var aPag = D.sai.filter(function (e) { return e.status === "aberta" && e.venc <= lim && e.venc >= addMes(T.mesAtual(), -1) + "-01"; });
    var reserva = soma(D.sai.filter(function (e) { return e.status === "paga" && grupo(e.categoriaId) === "reserva"; })) - soma(D.ent.filter(function (e) { return e.status === "paga" && grupo(e.categoriaId) === "reserva"; }));
    var c = cfg(), recAno = soma(D.ent.filter(function (e) { return e.status === "paga" && mesDe(e.pagoEm).slice(0, 4) === ano && grupo(e.categoriaId) !== "reserva"; }));
    $("fi-prev").innerHTML = '<span class="lbl">Próximos 90 dias</span><span>A receber <b>' + BRL(soma(aRec)) + "</b></span><span>A pagar <b>" + BRL(soma(aPag)) + "</b></span>" +
      "<span>Reserva guardada <b>" + BRL(r2(reserva)) + "</b></span>" +
      (c.impostoPct ? "<span>Imposto a separar em " + ano + " <b>" + BRL(r2(recAno * c.impostoPct / 100)) + "</b> (" + T.fmtNum(c.impostoPct) + "%)</span>" : "") +
      (!R.equipeOk ? '<span class="hint">* Falta o valor-hora de alguém em Configurações</span>' : "");
    // a receber
    T.each("[data-f]", function (b) { b.classList.toggle("is-selected", b.dataset.f === S.recFiltro); }, $("fi-recf"));
    var fimMes = S.mes + "-31", abertas = D.ent.filter(function (e) { return e.status === "aberta" && (S.recFiltro === "todas" || e.venc <= fimMes); }).sort(porVenc);
    $("fi-receber").innerHTML = lista(abertas, S.recFiltro === "todas" ? "Nenhuma parcela em aberto." : "Nada a receber até o fim de " + mesCurto(S.mes) + ".");
    var rec = D.ent.filter(function (e) { return pagoNoMes(e, S.mes); }).sort(porPago);
    $("fi-recebidas").innerHTML = rec.length ? '<button class="fold" data-fold="recebidas"><span>Recebidas em ' + mesCurto(S.mes) + " (" + rec.length + ") · <b>" + BRL(soma(rec)) + '</b></span><span class="chev">' + (S.recebidasAberto ? "Fechar ▴" : "Ver ▾") + "</span></button>" + (S.recebidasAberto ? rec.map(row).join("") : "") : "";
    // a pagar (fechado por padrão)
    var pag = D.sai.filter(function (e) { return (e.status === "aberta" && e.venc <= fimMes && (!e.virtual || e.venc >= addMes(S.mes, -3) + "-01")) || pagoNoMes(e, S.mes) || (e.status === "pulada" && mesDe(e.venc) === S.mes); }).sort(porVenc);
    var pagas = pag.filter(function (e) { return e.status !== "aberta"; }).length, falta = soma(pag.filter(function (e) { return e.status === "aberta"; }));
    var atras = pag.filter(function (e) { return e.status === "aberta" && e.venc < hoje(); }).length;
    $("fi-pagar-meta").textContent = "";
    $("fi-pagar").innerHTML = pag.length ? '<button class="fold" data-fold="pagar"><span>' + pagas + " de " + pag.length + " resolvidas · faltam <b>" + BRL(falta) + "</b>" + (atras ? ' · <span class="pill danger">' + atras + (atras === 1 ? " atrasada" : " atrasadas") + "</span>" : "") + '</span><span class="chev">' + (S.pagarAberto ? "Fechar ▴" : "Abrir ▾") + "</span></button>" + (S.pagarAberto ? pag.map(row).join("") : "") : '<div class="empty">Nenhuma despesa prevista. Cadastre as despesas fixas em Despesas.</div>';
  }
  function renderReceitas(D) {
    var fim = S.mes + "-31", ini = S.mes + "-01", ano = S.mes.slice(0, 4);
    var rec = D.ent.filter(function (e) { return pagoNoMes(e, S.mes); }).sort(porPago);
    var prev = D.ent.filter(function (e) { return e.status === "aberta" && e.venc >= ini && e.venc <= fim; }).sort(porVenc);
    var atras = D.ent.filter(function (e) { return e.status === "aberta" && e.venc < hoje(); });
    var noAno = soma(D.ent.filter(function (e) { return e.status === "paga" && mesDe(e.pagoEm).slice(0, 4) === ano && mesDe(e.pagoEm) <= S.mes && grupo(e.categoriaId) !== "reserva"; }));
    $("fr-tiles").innerHTML =
      '<div class="card tile"><small>Recebido em ' + mesCurto(S.mes) + "</small><b>" + BRL(soma(rec)) + "</b><span>" + rec.length + " recebimentos</span></div>" +
      '<div class="card tile"><small>Ainda a receber no mês</small><b>' + BRL(soma(prev)) + "</b><span>" + prev.length + " parcelas</span></div>" +
      '<div class="card tile' + (atras.length ? " bad" : "") + '"><small>Atrasado</small><b>' + BRL(soma(atras)) + "</b><span>" + atras.length + " parcelas vencidas</span></div>" +
      '<div class="card tile"><small>Recebido em ' + ano + "</small><b>" + BRL(noAno) + "</b><span>até " + mesCurto(S.mes) + "</span></div>";
    $("fr-recebidas").innerHTML = lista(rec, "Nenhum recebimento em " + mesCurto(S.mes) + ".");
    $("fr-previstas").innerHTML = lista(prev, "Nada previsto para " + mesCurto(S.mes) + ".");
  }
  function custoFixoMapeado() { return r2(soma(S.rec.filter(function (r) { return recOcorre(r, T.mesAtual()) || (r.freq === "anual" && (!r.fim || r.fim >= T.mesAtual())); }), function (r) { return r.freq === "anual" ? valorRec(r) / 12 : valorRec(r); })); }
  function renderDespesas(D) {
    var fim = S.mes + "-31", ini = S.mes + "-01";
    var doMes = D.sai.filter(function (e) { return (e.status === "aberta" && e.venc >= ini && e.venc <= fim) || pagoNoMes(e, S.mes) || (e.status === "pulada" && mesDe(e.venc) === S.mes); });
    var R = resumoMes(D, S.mes), aberto = soma(doMes.filter(function (e) { return e.status === "aberta"; })), mapeado = custoFixoMapeado();
    $("fd-tiles").innerHTML =
      '<div class="card tile"><small>Despesas pagas</small><b>' + BRL(R.desp) + "</b><span>em " + mesCurto(S.mes) + "</span></div>" +
      '<div class="card tile"><small>Equipe no mês</small><b>' + BRL(R.equipe) + "</b><span>horas × valor-hora" + (R.equipeOk ? "" : " · falta valor-hora") + "</span></div>" +
      '<div class="card tile"><small>Ainda a pagar</small><b>' + BRL(aberto) + "</b><span>com vencimento no mês</span></div>" +
      '<div class="card tile"><small>Custo fixo mapeado</small><b>' + BRL(mapeado) + "</b><span>por mês, das despesas fixas</span></div>";
    var grupos = {};
    doMes.forEach(function (e) { (grupos[e.categoriaId] = grupos[e.categoriaId] || []).push(e); });
    var ordem = cfg().categorias.filter(function (c) { return c.tipo === "saida"; }).map(function (c) { return c.id; });
    Object.keys(grupos).forEach(function (k) { if (ordem.indexOf(k) < 0) ordem.push(k); });
    $("fd-lista").innerHTML = ordem.filter(function (k) { return grupos[k]; }).map(function (k) {
      var g = grupos[k].sort(porVenc);
      return '<div class="subgroup"><div class="subgroup-head"><span class="subgroup-dot demanda"></span><span class="subgroup-label">' + esc(nomeCat(k) || "Sem categoria") + " · <b>" + BRL(soma(g.filter(function (e) { return e.status !== "pulada"; }))) + '</b></span></div><div class="fin-list">' + g.map(row).join("") + "</div></div>";
    }).join("") || '<div class="empty">Nenhuma despesa em ' + mesCurto(S.mes) + ".</div>";
    // despesas fixas
    var ativas = S.rec.filter(function (r) { return !r.fim || r.fim >= T.mesAtual(); }).sort(function (a, b) { return (a.descricao || "").localeCompare(b.descricao || ""); });
    $("fd-fixas").innerHTML = ativas.length ? '<div class="table-wrap"><table><thead><tr><th>Despesa</th><th>Categoria</th><th class="r">Valor</th><th>Quando</th><th></th></tr></thead><tbody>' + ativas.map(function (r) {
      return '<tr><td class="name">' + esc(r.descricao) + (r.pct != null && r.pct < 100 ? ' <span class="pill">' + r.pct + "% do escritório</span>" : "") + "</td><td>" + esc(nomeCat(r.categoriaId)) + '</td><td class="r">' + BRL(valorRec(r)) + "</td><td>" + (r.freq === "anual" ? "Anual · " + mesCurto(addMes("2000-01", (r.mesAnual || 1) - 1)) : "Todo dia " + (r.dia || 1)) + '</td><td><button class="link" data-editr="' + esc(r.id) + '">Editar</button></td></tr>';
    }).join("") + '<tr class="total"><td colspan="2">Custo fixo mensal (anuais divididos por 12)</td><td class="r">' + BRL(mapeado) + "</td><td colspan=\"2\"></td></tr></tbody></table></div>" : '<div class="empty">Nenhuma despesa fixa ainda. Use “Mapear despesas” para começar.</div>';
    var cf = T.cfg().custosFixosMensais;
    $("fd-sync").innerHTML = mapeado ? "Configurações usa " + (cf != null ? BRL(cf) : "nenhum valor") + " como custo fixo no custo-hora." + (Math.abs((cf || 0) - mapeado) > 0.5 ? ' <button class="btn btn-small" id="fd-usar">Usar ' + BRL(mapeado) + " no custo-hora</button>" : " Está igual ao mapeado ✓") : "";
  }
  function renderContratos(D) {
    T.each("[data-cf]", function (b) { b.classList.toggle("is-selected", b.dataset.cf === S.conFiltro); }, $("fc-filtro"));
    var list = S.contratos.filter(function (c) { return (c.status || "ativo") === S.conFiltro; }).sort(function (a, b) { return (projNome(a.projetoId) || a.cliente || "").localeCompare(projNome(b.projetoId) || b.cliente || ""); });
    $("fc-lista").innerHTML = list.length ? list.map(function (c) {
      var ps = (c.parcelas || []).map(function (p, i) { return entParc(c, p, i); }), rec = soma(ps.filter(function (e) { return e.status === "paga"; }));
      var total = c.valorTotal || soma(ps, function (e) { return T.byId(c.parcelas, e.pId).valor; }), prox = ps.filter(function (e) { return e.status === "aberta"; }).sort(porVenc)[0];
      var atras = ps.filter(function (e) { return e.status === "aberta" && e.venc < hoje(); }).length, aberto = S.abertos[c.id];
      return '<div class="card contract"><div class="project-top"><div><div class="project-name">' + esc(projNome(c.projetoId) || c.cliente || "Contrato") + '</div><div class="project-sub">' + esc([c.cliente, c.servico].filter(Boolean).join(" · ")) + '</div></div><button class="link" data-editc="' + esc(c.id) + '">Editar</button></div>' +
        '<div class="kv"><div><small>Contrato</small><b>' + BRL(total) + "</b></div><div><small>Recebido</small><b>" + BRL(rec) + "</b></div><div><small>A receber</small><b>" + BRL(r2(total - rec)) + "</b></div></div>" +
        '<div class="progress" title="' + Math.round(total ? rec / total * 100 : 0) + '% recebido"><i style="width:' + Math.min(100, total ? rec / total * 100 : 0) + '%"></i></div>' +
        '<div class="hint">' + (prox ? "Próxima: " + fmtDM(prox.venc) + " · " + BRL(prox.valor) + (atras ? ' · <span class="pill danger">' + atras + (atras === 1 ? " atrasada" : " atrasadas") + "</span>" : "") : "Todas as parcelas recebidas ✓") + "</div>" +
        '<button class="fold" data-foldc="' + esc(c.id) + '"><span>' + ps.length + (ps.length === 1 ? " parcela" : " parcelas") + '</span><span class="chev">' + (aberto ? "Fechar ▴" : "Ver ▾") + "</span></button>" +
        (aberto ? '<div class="fin-list">' + ps.map(row).join("") + "</div>" : "") + "</div>";
    }).join("") : '<div class="empty">' + (S.conFiltro === "ativo" ? "Nenhum contrato ativo. Use “+ Novo contrato”." : "Nenhum contrato encerrado.") + "</div>";
  }
  function renderAjustes() {
    var c = cfg(), box = $("fa-form");
    if (box.dataset.dirty !== "1" && !box.contains(document.activeElement)) {
      $("fa-nome").value = c.recibo.nome || ""; $("fa-doc").value = c.recibo.doc || ""; $("fa-cidade").value = c.recibo.cidade || ""; $("fa-contato").value = c.recibo.contato || "";
      $("fa-num").value = c.proximoRecibo || 1; $("fa-dia").value = c.diaPagamentoEquipe || 5; $("fa-imp").value = c.impostoPct != null ? c.impostoPct : "";
      $("fa-conta").innerHTML = T.optHtml(c.contas.map(function (x) { return [x.id, x.nome]; }), c.contaPadrao);
      $("fa-forma").innerHTML = T.optHtml(FORMAS.map(function (f) { return [f, f]; }), c.formaPadrao);
    }
    [["contas", c.contas], ["cat-entrada", c.categorias.filter(function (x) { return x.tipo === "entrada"; })], ["cat-saida", c.categorias.filter(function (x) { return x.tipo === "saida"; })]].forEach(function (l) {
      var el = $("fa-" + l[0]); if (el.dataset.dirty !== "1") el.innerHTML = l[1].map(listRow).join("");
    });
    var mes = T.mesAtual();
    $("fa-pessoas").innerHTML = '<div class="table-wrap"><table><thead><tr><th>Pessoa</th><th>Perfil</th><th class="r">Valor-hora</th><th class="r">Horas em ' + mesCurto(mes) + '</th><th class="r">Remuneração do mês</th></tr></thead><tbody>' + T.pessoasAtivas().map(function (p) {
      var f = T.relatorios ? T.relatorios.calcFechamento(p.id, mes) : { min: 0, valor: null };
      return '<tr><td class="name">' + esc(p.nome) + "</td><td>" + (p.perfil === "colaborador" ? "Colaborador(a)" : "Sócio(a)") + '</td><td class="r">' + (p.valorHora != null ? BRL(p.valorHora) : '<span class="pill danger">definir</span>') + '</td><td class="r">' + T.fmtH(f.min) + '</td><td class="r">' + (f.valor != null ? BRL(f.valor) : "—") + "</td></tr>";
    }).join("") + "</tbody></table></div>";
  }
  function listRow(it) { return '<div class="list-edit-row field" data-id="' + esc(it.id || "") + '"><input aria-label="Nome" value="' + esc(it.nome) + '"' + (it.fixa ? " disabled" : "") + ">" + (it.fixa ? '<span class="hint">fixa</span>' : '<button type="button" class="link danger" data-rm="1">Remover</button>') + "</div>"; }

  function render() {
    if (!T.db) return;
    var mudou = $("fin-nav").dataset.page !== S.page;
    $("fin-nav").dataset.page = S.page;
    $("fin-teste").hidden = !cfg().teste;
    T.each("[data-page]", function (b) { b.classList.toggle("is-selected", b.dataset.page === S.page); }, $("fin-nav"));
    PAGES.forEach(function (p) { $("fp-" + p[0]).hidden = p[0] !== S.page; });
    $("fin-mes").textContent = cap(T.mesNome(S.mes));
    $("fin-mes-wrap").hidden = S.page === "contratos" || S.page === "ajustes";
    if (!mudou && S.form && document.activeElement && document.activeElement.closest(".fin-form")) return;
    S.idx = {};
    var D = dados();
    if (S.page === "inicio") renderInicio(D);
    else if (S.page === "receitas") renderReceitas(D);
    else if (S.page === "despesas") renderDespesas(D);
    else if (S.page === "contratos") renderContratos(D);
    else renderAjustes();
  }

  // ---------- lançamento avulso ----------
  function abrirLanc(tipo, e) {
    var c = cfg(), m = e ? T.byId(S.movDocs[e.mes] || [], e.id) : null;
    S.lanc = { tipo: m ? (m.categoriaId === "reserva" ? "reserva" : m.tipo) : tipo || "entrada", edit: m ? { mes: e.mes, id: e.id } : null };
    $("fl-title").textContent = m ? "Editar lançamento" : "Novo lançamento";
    $("fl-valor").value = m ? m.valor : ""; $("fl-data").value = m ? m.vencimento : hoje(); $("fl-desc").value = m ? m.descricao || "" : "";
    $("fl-quem").value = m ? m.cliente || "" : "";
    $("fl-proj").innerHTML = '<option value="">—</option>' + T.state.projetos.filter(function (p) { return (p.status || "ativo") !== "concluido" || (m && m.projetoId === p.id); }).sort(function (a, b) { return a.nome.localeCompare(b.nome); }).map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.nome) + "</option>"; }).join("");
    $("fl-proj").value = m && m.projetoId || "";
    $("fl-status").value = m ? (m.status === "paga" ? "paga" : "prevista") : "paga";
    $("fl-forma").innerHTML = T.optHtml(FORMAS.map(function (f) { return [f, f]; }), m && m.forma || c.formaPadrao);
    $("fl-conta").innerHTML = T.optHtml(c.contas.map(function (x) { return [x.id, x.nome]; }), m && m.conta || c.contaPadrao);
    $("fl-rep").checked = false; $("fl-del").hidden = !m; $("fl-del-box").hidden = true;
    lancTipo(m ? m.categoriaId : null);
    $("fin-lanc").hidden = false; $("fl-valor").focus();
  }
  function lancTipo(catSel) {
    var t = S.lanc.tipo;
    T.each("[data-t]", function (b) { b.classList.toggle("is-selected", b.dataset.t === t); }, $("fl-tipo"));
    var cats = cfg().categorias.filter(function (x) { return t === "reserva" ? x.id === "reserva" : x.tipo === t && x.grupo !== "reserva"; });
    $("fl-cat").innerHTML = cats.map(function (x) { return '<option value="' + esc(x.id) + '">' + esc(x.nome) + "</option>"; }).join("");
    if (catSel) $("fl-cat").value = catSel;
    $("fl-cat-wrap").hidden = t === "reserva"; $("fl-quem-wrap").hidden = t !== "entrada"; $("fl-proj-wrap").hidden = t === "reserva";
    $("fl-forma-wrap").hidden = t !== "entrada"; $("fl-rep-wrap").hidden = t !== "saida" || !!S.lanc.edit;
    $("fl-status").options[0].textContent = t === "entrada" ? "Já recebido" : t === "reserva" ? "Já guardado" : "Já pago";
  }
  async function salvarLanc(btn) {
    var t = S.lanc.tipo, valor = num($("fl-valor").value), data = $("fl-data").value, paga = $("fl-status").value === "paga";
    if (!valor || valor <= 0) { $("fl-valor").focus(); return; }
    if (!data) { $("fl-data").focus(); return; }
    var body = {
      tipo: t === "entrada" ? "entrada" : "saida", categoriaId: t === "reserva" ? "reserva" : $("fl-cat").value, valor: valor,
      descricao: $("fl-desc").value.trim(), projetoId: t === "reserva" ? null : $("fl-proj").value || null, cliente: t === "entrada" ? $("fl-quem").value.trim() : "",
      vencimento: data, status: paga ? "paga" : "prevista", pagoEm: paga ? data : null, forma: t === "entrada" ? $("fl-forma").value : null, conta: $("fl-conta").value
    };
    var novo = null;
    var ok = await T.saveWith(btn, async function () {
      if (S.lanc.edit) { await updMov(S.lanc.edit.mes, S.lanc.edit.id, body); return; }
      if (t === "saida" && $("fl-rep").checked) {
        var r = { id: T.novoId(), descricao: body.descricao || nomeCat(body.categoriaId), categoriaId: body.categoriaId, valor: valor, pct: 100, freq: "mensal", dia: +data.slice(8, 10), inicio: mesDe(data), fim: null };
        var itens = T.clone(S.rec); itens.push(r); await saveRec(itens);
        if (paga) await addMov(Object.assign(body, { descricao: r.descricao, recId: r.id, refMes: mesDe(data), origem: "recorrente" }));
        return;
      }
      body.origem = "manual"; novo = await addMov(body);
    });
    if (!ok) return;
    setTimeout(function () { $("fin-lanc").hidden = true; }, 500);
    if (novo && novo.tipo === "entrada" && paga) T.toast("Entrada registrada", { label: "Gerar recibo", fn: function () { var o = Object.assign({}, novo); o._mes = mesDe(novo.vencimento); abrirRecibo(entMov(o)); } });
  }

  // ---------- contratos ----------
  function abrirContrato(c) {
    S.ce = { id: c ? c.id : null, criadoEm: c ? c.criadoEm : null }; S.ceParc = {};
    $("fc-title").textContent = c ? "Editar contrato" : "Novo contrato";
    var projs = T.state.projetos.slice().sort(function (a, b) { return a.nome.localeCompare(b.nome); });
    $("fc-proj").innerHTML = '<option value="">Escolha o projeto</option>' + projs.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.nome) + (p.status === "concluido" ? " (concluído)" : "") + "</option>"; }).join("") + '<option value="__novo">+ Novo projeto…</option>';
    $("fc-proj").value = c ? c.projetoId || "" : ""; $("fc-novo-wrap").hidden = true; $("fc-novo").value = "";
    $("fc-cliente").value = c ? c.cliente || "" : ""; $("fc-doc").value = c ? c.clienteDoc || "" : ""; $("fc-servico").value = c ? c.servico || "" : "";
    $("fc-total").value = c && c.valorTotal != null ? c.valorTotal : ""; $("fc-status").value = c ? c.status || "ativo" : "ativo";
    $("fc-n").value = c ? (c.parcelas || []).length || "" : ""; $("fc-ini").value = ""; $("fc-int").value = "mensal";
    $("fc-parcs").innerHTML = ""; (c && c.parcelas || []).forEach(function (p) { S.ceParc[p.id] = p; addParcRow(p); });
    $("fc-del").hidden = !c; $("fc-del-box").hidden = true; somaParc();
    $("fin-contrato").hidden = false; $("fin-contrato").scrollIntoView({ block: "start", behavior: "smooth" });
  }
  function addParcRow(p) {
    var box = $("fc-parcs"), n = box.children.length + 1;
    box.insertAdjacentHTML("beforeend", '<div class="parc-row" data-pid="' + esc(p && p.id || "") + '"><span class="n">' + n + '</span><input class="desc" data-k="descricao" aria-label="Descrição da parcela ' + n + '" placeholder="Ex.: Assinatura, Estudo Preliminar" value="' + esc(p && p.descricao || "") + '">' +
      '<input type="date" data-k="vencimento" aria-label="Vencimento da parcela ' + n + '" value="' + esc(p && p.vencimento || "") + '"><input type="number" min="0" step="0.01" inputmode="decimal" data-k="valor" aria-label="Valor da parcela ' + n + '" placeholder="R$" value="' + (p && p.valor != null ? p.valor : "") + '">' +
      '<label class="check"><input type="checkbox" data-k="rec"' + (p && p.recebidoEm ? " checked" : "") + '> Já recebida</label><button type="button" class="link danger" data-rmp="1" aria-label="Remover parcela">Remover</button></div>');
  }
  function renumerar() { Array.prototype.forEach.call($("fc-parcs").children, function (r, i) { r.querySelector(".n").textContent = i + 1; }); somaParc(); }
  function somaParc() {
    var tot = 0; T.each('input[data-k="valor"]', function (i) { tot += num(i.value) || 0; }, $("fc-parcs"));
    var alvo = num($("fc-total").value), n = $("fc-parcs").children.length;
    $("fc-soma").innerHTML = n ? "Soma das parcelas: <b>" + BRL(r2(tot)) + "</b>" + (alvo != null && Math.abs(alvo - tot) > 0.009 ? ' <span class="pill danger">diferente do total ' + BRL(alvo) + "</span>" : alvo != null ? " ✓" : "") : "Gere as parcelas ou adicione uma a uma.";
  }
  function gerarParcelas() {
    var n = parseInt($("fc-n").value, 10), total = num($("fc-total").value), ini = $("fc-ini").value, int = $("fc-int").value;
    if (!n || n < 1 || n > 60) { $("fc-n").focus(); return; }
    if (!total) { $("fc-total").focus(); return; }
    if (!ini) { $("fc-ini").focus(); return; }
    var base = Math.floor(total / n * 100) / 100, d0 = T.parseYmd(ini);
    $("fc-parcs").innerHTML = "";
    for (var i = 0; i < n; i++) {
      var d = int === "quinzenal" ? T.addDays(d0, 15 * i) : new Date(d0.getFullYear(), d0.getMonth() + i, Math.min(d0.getDate(), new Date(d0.getFullYear(), d0.getMonth() + i + 1, 0).getDate()));
      addParcRow({ descricao: i === 0 ? "Entrada" : "Parcela " + (i + 1), vencimento: ymd(d), valor: i === n - 1 ? r2(total - base * (n - 1)) : base });
    }
    somaParc();
  }
  async function salvarContrato(btn) {
    var pid = $("fc-proj").value, novoNome = $("fc-novo").value.trim();
    if (!pid) { $("fc-proj").focus(); return; }
    if (pid === "__novo" && !novoNome) { $("fc-novo").focus(); return; }
    var rows = Array.prototype.slice.call($("fc-parcs").children), erro = null, c = cfg();
    var ps = rows.map(function (r) {
      var get = function (k) { return r.querySelector('[data-k="' + k + '"]'); };
      var id = r.dataset.pid || T.novoId(), old = S.ceParc[id] || {}, venc = get("vencimento").value, valor = num(get("valor").value);
      if (!venc || !valor) erro = erro || get(!venc ? "vencimento" : "valor");
      var p = { id: id, descricao: get("descricao").value.trim(), vencimento: venc, valor: valor, recibo: old.recibo || null };
      if (get("rec").checked) {
        if (old.recebidoEm) ["recebidoEm", "valorRecebido", "forma", "conta", "anterior"].forEach(function (k) { p[k] = old[k] != null ? old[k] : null; });
        else Object.assign(p, { recebidoEm: venc > hoje() ? hoje() : venc, valorRecebido: valor, forma: "", conta: c.contaPadrao, anterior: true });
      }
      return p;
    });
    if (erro) { erro.focus(); return; }
    if (!ps.length) { $("fc-n").focus(); return; }
    var ok = await T.saveWith(btn, async function () {
      var cliente = $("fc-cliente").value.trim(), total = num($("fc-total").value) || r2(soma(ps));
      if (pid === "__novo") {
        pid = "p-" + T.novoId();
        await T.db.doc("projetos/" + pid).set({ nome: novoNome, cliente: cliente, tipo: T.cfg().tipos[0].id, area: null, honorario: total, status: "ativo", horasPrevistas: {}, criadoEm: new Date().toISOString() });
      } else { var pj = T.projeto(pid); if (pj && pj.honorario == null) await T.db.doc("projetos/" + pid).update({ honorario: total }); }
      var id = S.ce.id || "c-" + T.novoId();
      await T.db.doc("fin_contratos/" + id).set({ projetoId: pid, cliente: cliente, clienteDoc: $("fc-doc").value.trim(), servico: $("fc-servico").value.trim(), valorTotal: total,
        status: $("fc-status").value, parcelas: ps, criadoEm: S.ce.criadoEm || new Date().toISOString() });
      S.ce.id = id;
    });
    if (ok) setTimeout(function () { $("fin-contrato").hidden = true; }, 500);
  }

  // ---------- despesas fixas ----------
  function abrirRec(r) {
    S.re = { id: r ? r.id : null };
    $("fr-title").textContent = r ? "Editar despesa fixa" : "Nova despesa fixa";
    $("frc-cat").innerHTML = cfg().categorias.filter(function (x) { return x.tipo === "saida" && !x.grupo; }).map(function (x) { return '<option value="' + esc(x.id) + '">' + esc(x.nome) + "</option>"; }).join("");
    $("frc-desc").value = r ? r.descricao : ""; $("frc-cat").value = r ? r.categoriaId : "soft"; $("frc-valor").value = r ? r.valor : "";
    $("frc-pct").value = r && r.pct != null ? r.pct : 100; $("frc-freq").value = r ? r.freq || "mensal" : "mensal"; $("frc-dia").value = r ? r.dia || 10 : 10;
    $("frc-mesanual").innerHTML = T.MESES.map(function (m, i) { return '<option value="' + (i + 1) + '">' + cap(m) + "</option>"; }).join("");
    $("frc-mesanual").value = r && r.mesAnual || new Date().getMonth() + 1; $("frc-inicio").value = r ? r.inicio || T.mesAtual() : T.mesAtual();
    $("frc-mesanual-wrap").hidden = $("frc-freq").value !== "anual";
    $("frc-encerrar").hidden = !r; $("frc-excluir").hidden = !r;
    $("fin-rec").hidden = false; $("frc-desc").focus();
  }
  async function salvarRecForm(btn) {
    var desc = $("frc-desc").value.trim(), valor = num($("frc-valor").value);
    if (!desc) { $("frc-desc").focus(); return; }
    if (!valor) { $("frc-valor").focus(); return; }
    var itens = T.clone(S.rec), r = S.re.id ? T.byId(itens, S.re.id) : null;
    var body = { descricao: desc, categoriaId: $("frc-cat").value, valor: valor, pct: Math.min(100, Math.max(0, num($("frc-pct").value) == null ? 100 : num($("frc-pct").value))),
      freq: $("frc-freq").value, dia: Math.min(28, Math.max(1, parseInt($("frc-dia").value, 10) || 10)), mesAnual: +$("frc-mesanual").value, inicio: $("frc-inicio").value || T.mesAtual() };
    if (r) Object.assign(r, body); else itens.push(Object.assign({ id: T.novoId(), fim: null }, body));
    var ok = await T.saveWith(btn, function () { return saveRec(itens); });
    if (ok) setTimeout(function () { $("fin-rec").hidden = true; }, 500);
  }
  function abrirMapa() {
    var ja = {}; S.rec.forEach(function (r) { ja[(r.descricao || "").toLowerCase()] = 1; });
    $("fm-lista").innerHTML = MAPA.map(function (m, i) {
      var tem = ja[m[0].toLowerCase()];
      return '<label class="map-item"><input type="checkbox" data-mi="' + i + '"' + (tem ? " checked disabled" : "") + '><span>' + esc(m[0]) + (m[2] === "anual" ? ' <span class="pill">anual</span>' : "") + (tem ? ' <span class="pill accent">já cadastrada</span>' : "") + "</span>" +
        '<input type="number" min="0" step="0.01" inputmode="decimal" placeholder="R$" aria-label="Valor de ' + esc(m[0]) + '" data-mv="' + i + '"' + (tem ? " disabled" : "") + '><span class="hint"><input type="number" min="0" max="100" step="5" value="' + m[3] + '" aria-label="Percentual do escritório" data-mp="' + i + '"' + (tem ? " disabled" : "") + " style=\"width:44px\">%</span></label>";
    }).join("");
    $("fin-mapa").hidden = false;
  }
  async function salvarMapa(btn) {
    var itens = T.clone(S.rec), n = 0, falta = null;
    T.each("[data-mi]", function (ch) {
      if (!ch.checked || ch.disabled) return;
      var i = +ch.dataset.mi, m = MAPA[i], v = num(document.querySelector('[data-mv="' + i + '"]').value), p = num(document.querySelector('[data-mp="' + i + '"]').value);
      if (!v) { falta = falta || document.querySelector('[data-mv="' + i + '"]'); return; }
      itens.push({ id: T.novoId(), descricao: m[0], categoriaId: m[1], valor: v, pct: p == null ? 100 : p, freq: m[2], dia: 10, mesAnual: new Date().getMonth() + 1, inicio: T.mesAtual(), fim: null }); n++;
    }, $("fm-lista"));
    if (falta) { falta.focus(); T.toast("Preencha o valor das despesas marcadas"); return; }
    if (!n) { T.toast("Marque ao menos uma despesa"); return; }
    var ok = await T.saveWith(btn, function () { return saveRec(itens); });
    if (ok) { T.toast(n + (n === 1 ? " despesa fixa cadastrada" : " despesas fixas cadastradas")); setTimeout(function () { $("fin-mapa").hidden = true; }, 500); }
  }

  // ---------- recibo ----------
  var UN = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  var DZ = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  var CT = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
  function ate999(n) {
    if (n === 100) return "cem";
    var c = Math.floor(n / 100), r = n % 100, out = [];
    if (c) out.push(CT[c]);
    if (r) out.push(r < 20 ? UN[r] : DZ[Math.floor(r / 10)] + (r % 10 ? " e " + UN[r % 10] : ""));
    return out.join(" e ");
  }
  function inteiro(n) {
    if (n === 0) return "zero";
    var g = [], out = "";
    while (n > 0) { g.push(n % 1000); n = Math.floor(n / 1000); }
    for (var i = g.length - 1; i >= 0; i--) {
      var x = g[i]; if (!x) continue;
      var t = i === 0 ? ate999(x) : i === 1 ? (x === 1 ? "mil" : ate999(x) + " mil") : ate999(x) + (i === 2 ? (x === 1 ? " milhão" : " milhões") : (x === 1 ? " bilhão" : " bilhões"));
      var resto = g.slice(0, i).some(function (y) { return y; });
      out += out ? ((i === 0 && (x < 100 || x % 100 === 0)) ? " e " : " ") + t : t;
      if (!resto) break;
    }
    return out;
  }
  function extenso(v) {
    var c = Math.round(v * 100), r = Math.floor(c / 100), ct = c % 100, s = "";
    if (r) s = inteiro(r) + (r % 1000000 === 0 ? " de reais" : r === 1 ? " real" : " reais");
    if (ct) s += (s ? " e " : "") + inteiro(ct) + (ct === 1 ? " centavo" : " centavos");
    return s || "zero real";
  }
  function dataExtenso(s) { var d = T.parseYmd(s); return d.getDate() + " de " + T.MESES[d.getMonth()] + " de " + d.getFullYear(); }
  function numRecibo(n) { return ("000" + n).slice(-4); }
  function reciboDados(e) {
    var c = cfg().recibo;
    return { n: e.recibo.n, cliente: e.cliente || "", clienteDoc: e.clienteDoc || "", valor: e.valor, data: e.pagoEm, forma: e.forma || "", referente: e.referente || e.titulo, projeto: projNome(e.projetoId),
      emitente: c.nome || "", doc: c.doc || "", cidade: c.cidade || "", contato: c.contato || "" };
  }
  async function abrirRecibo(e) {
    if (!e.recibo) {
      var rb = reservarNumero();
      try {
        await saveCfg({ proximoRecibo: rb.n + 1 });
        if (e.kind === "parc") await updParcela(e.cId, e.pId, { recibo: rb }); else await updMov(e.mes, e.id, { recibo: rb });
      } catch (err) { T.showError(err); return; }
      e = Object.assign({}, e, { recibo: rb });
    }
    S.recibo = reciboDados(e);
    var R = S.recibo;
    $("fin-modal-title").textContent = "Recibo nº " + numRecibo(R.n);
    $("fin-receipt").innerHTML = '<div class="receipt"><div class="receipt-head"><img src="logo.png" alt="Trilha Arquitetura Brasileira"><div class="receipt-title">RECIBO<small>Nº ' + numRecibo(R.n) + "</small></div></div>" +
      '<div class="receipt-value">' + BRL(R.valor) + "</div>" +
      "<p>Recebi de <b>" + esc(R.cliente || "________________") + "</b>" + (R.clienteDoc ? ", CPF/CNPJ " + esc(R.clienteDoc) : "") + ", a importância de <b>" + BRL(R.valor) + "</b> (" + esc(extenso(R.valor)) + "), referente a " + esc(R.referente) + ".</p>" +
      "<dl>" + (R.projeto ? "<dt>Projeto</dt><dd>" + esc(R.projeto) + "</dd>" : "") + (R.forma ? "<dt>Forma de pagamento</dt><dd>" + esc(R.forma) + "</dd>" : "") + "<dt>Data do pagamento</dt><dd>" + T.fmtYmd(R.data) + "</dd></dl>" +
      "<p>Para clareza, firmo o presente recibo.</p><p>" + esc(R.cidade ? R.cidade + ", " : "") + dataExtenso(R.data) + ".</p>" +
      '<div class="receipt-sign"><div class="line"></div><b>' + esc(R.emitente || "Nome de quem recebe") + "</b>" + (R.doc ? "<span>CPF/CNPJ " + esc(R.doc) + "</span>" : "") + "</div>" +
      '<div class="receipt-foot">Trilha Arquitetura Brasileira' + (R.contato ? " · " + esc(R.contato) : "") + "</div></div>";
    $("fin-emit-hint").innerHTML = !R.emitente || !R.cidade ? 'Complete seus dados (nome, CPF e cidade) em <button class="link" data-goajustes="1" style="padding:0">Financeiro › Ajustes</button> para o recibo sair completo.' : "";
    $("fin-pdf-st").textContent = ""; $("fin-pdf").hidden = !T.downloads;
    $("fin-overlay").hidden = false; $("fin-pdf").focus();
  }
  function fecharRecibo() { $("fin-overlay").hidden = true; S.recibo = null; }
  function loadScript(src) { return new Promise(function (ok, fail) { var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s); }); }
  async function logo() {
    if (S.logo) return S.logo;
    var img = new Image(); img.src = "logo.png"; await img.decode();
    var cv = document.createElement("canvas"); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
    var cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(img, 0, 0);
    S.logo = { url: cv.toDataURL("image/jpeg", 0.92), w: img.naturalWidth, h: img.naturalHeight }; return S.logo;
  }
  async function baixarPdf() {
    var R = S.recibo, st = $("fin-pdf-st"); if (!R) return;
    st.className = "save-state"; st.textContent = "Gerando PDF…";
    try {
      if (!window.jspdf) await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
      var doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" }), L = await logo(), x = 22, W = 166, y = 22;
      var verde = [111, 148, 80], tinta = [31, 42, 26], cinza = [111, 125, 102];
      var lh = 13, lw = L.w / L.h * lh; if (lw > 70) { lw = 70; lh = lw * L.h / L.w; }
      doc.addImage(L.url, "JPEG", x, y, lw, lh);
      doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor.apply(doc, tinta); doc.text("RECIBO", x + W, y + 6, { align: "right" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor.apply(doc, cinza); doc.text("Nº " + numRecibo(R.n), x + W, y + 12, { align: "right" });
      y += 19; doc.setDrawColor.apply(doc, verde); doc.setLineWidth(0.7); doc.line(x, y, x + W, y);
      y += 9; doc.setFillColor(238, 244, 232); doc.setDrawColor(136, 172, 103); doc.setLineWidth(0.3); doc.roundedRect(x, y, 62, 12, 2, 2, "FD");
      doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor.apply(doc, tinta); doc.text(BRL(R.valor).replace(/ /g, " "), x + 5, y + 8.2);
      y += 22; doc.setFont("helvetica", "normal"); doc.setFontSize(11.5);
      var txt = "Recebi de " + (R.cliente || "________________") + (R.clienteDoc ? ", CPF/CNPJ " + R.clienteDoc : "") + ", a importância de " + BRL(R.valor).replace(/ /g, " ") + " (" + extenso(R.valor) + "), referente a " + R.referente + ".";
      var linhas = doc.splitTextToSize(txt, W); doc.text(linhas, x, y, { lineHeightFactor: 1.5 }); y += linhas.length * 6.1 + 6;
      doc.setFontSize(10.5);
      [["Projeto", R.projeto], ["Forma de pagamento", R.forma], ["Data do pagamento", T.fmtYmd(R.data)]].forEach(function (d) {
        if (!d[1]) return; doc.setTextColor.apply(doc, cinza); doc.text(d[0], x, y); doc.setTextColor.apply(doc, tinta); doc.text(String(d[1]), x + 46, y); y += 6.5;
      });
      y += 6; doc.setFontSize(11.5); doc.text("Para clareza, firmo o presente recibo.", x, y);
      y += 9; doc.text((R.cidade ? R.cidade + ", " : "") + dataExtenso(R.data) + ".", x, y);
      y += 30; doc.setDrawColor.apply(doc, tinta); doc.setLineWidth(0.3); doc.line(x + W / 2 - 45, y, x + W / 2 + 45, y);
      y += 6; doc.setFont("helvetica", "bold"); doc.text(R.emitente || "", x + W / 2, y, { align: "center" });
      if (R.doc) { y += 5.5; doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text("CPF/CNPJ " + R.doc, x + W / 2, y, { align: "center" }); }
      doc.setDrawColor(217, 224, 210); doc.line(x, 272, x + W, 272);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor.apply(doc, cinza);
      doc.text("Trilha Arquitetura Brasileira" + (R.contato ? " · " + R.contato : ""), x + W / 2, 278, { align: "center" });
      var nome = "recibo-" + numRecibo(R.n) + (R.cliente ? "-" + T.slug(R.cliente) : "") + ".pdf";
      st.textContent = "";
      await T.downloads.save({ filename: nome, data: doc.output("arraybuffer") });
      st.className = "save-state ok"; st.textContent = "PDF salvo ✓";
    } catch (e) {
      st.className = "save-state err";
      st.textContent = e && e.code === "declined" ? "Download cancelado" : "Não foi possível gerar o PDF";
    }
  }

  // ---------- eventos ----------
  function dadosForm(key) {
    var f = document.querySelector('[data-form="' + CSS.escape(key) + '"]');
    var g = function (id) { var el = f.querySelector("#" + id); return el ? el.value : null; };
    return { data: g("ff-data") || hoje(), valor: num(g("ff-valor")), forma: g("ff-forma"), conta: g("ff-conta"), recibo: !!(f.querySelector("#ff-recibo") || {}).checked };
  }
  async function acaoLinha(t) {
    var key, e;
    if ((key = t.dataset.ok)) { S.form = S.form === key ? null : key; T.render(); var el = document.getElementById("ff-valor"); if (el) el.focus(); return true; }
    if (t.dataset.cancelar) { S.form = null; T.render(); return true; }
    if ((key = t.dataset.confirmar)) {
      e = S.idx[key]; if (!e || S.busy) return true;
      var d = dadosForm(key); if (!d.valor || d.valor <= 0) { document.getElementById("ff-valor").focus(); return true; }
      S.busy = true; t.disabled = true;
      try {
        var rb = d.recibo ? reservarNumero() : null;
        if (rb) await saveCfg({ proximoRecibo: rb.n + 1 });
        await confirmar(e, d, rb);
        S.form = null;
        var feito = Object.assign({}, e, { status: "paga", pagoEm: d.data, valor: d.valor, forma: d.forma, conta: d.conta, recibo: rb || e.recibo });
        T.toast(e.tipo === "entrada" ? "Recebimento registrado" : "Pagamento registrado", { label: "Desfazer", fn: function () { desfazerKey(e, feito); } });
        if (rb) abrirRecibo(feito);
      } catch (err) { T.showError(err); }
      S.busy = false; T.render(); return true;
    }
    if ((key = t.dataset.pular)) { e = S.idx[key]; if (e) { try { await pular(e); T.toast("Marcado como “não houve” neste mês"); } catch (err) { T.showError(err); } } return true; }
    if ((key = t.dataset.desfazer)) { e = S.idx[key]; if (e) { try { await desfazer(e); T.toast("Desfeito"); } catch (err) { T.showError(err); } } return true; }
    if ((key = t.dataset.recibo)) { e = S.idx[key]; if (e) abrirRecibo(e); return true; }
    if ((key = t.dataset.editm)) { e = S.idx[key]; if (e) { abrirLanc(null, e); $("fin-lanc").scrollIntoView({ block: "start", behavior: "smooth" }); } return true; }
    return false;
  }
  // Desfaz logo após confirmar: localiza o registro recém-gravado (o pagamento de uma recorrente/remuneração vira um item novo).
  async function desfazerKey(e, feito) {
    try {
      if (e.kind === "parc" || e.kind === "mov") await desfazer(e);
      else {
        var alvo = movs().filter(function (m) { return (e.recId && m.recId === e.recId && m.refMes === e.refMes) || (e.fechId && m.fechId === e.fechId); })[0];
        if (alvo) await delMov(alvo._mes, alvo.id);
      }
      T.toast("Desfeito");
    } catch (err) { T.showError(err); }
  }

  function init() {
    var view = $("view-financeiro");
    document.body.insertAdjacentHTML("beforeend", overlayHtml);
    $("fin-overlay").addEventListener("click", function (e) {
      if (e.target === this || e.target.closest("[data-close]")) { fecharRecibo(); return; }
      if (e.target.closest("[data-goajustes]")) { fecharRecibo(); S.page = "ajustes"; T.go("admin", "financeiro"); return; }
      if (e.target.closest("#fin-pdf")) baixarPdf();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("fin-overlay").hidden) fecharRecibo(); });
    $("fin-nav").addEventListener("click", function (e) { var b = e.target.closest("[data-page]"); if (!b) return; S.page = b.dataset.page; S.form = null; T.render(); b.blur(); });
    $("fin-prev").addEventListener("click", function () { S.mes = addMes(S.mes, -1); S.form = null; T.render(); });
    $("fin-next").addEventListener("click", function () { S.mes = addMes(S.mes, 1); S.form = null; T.render(); });
    $("fin-mes").addEventListener("click", function () { S.mes = T.mesAtual(); T.render(); });
    $("fin-add").addEventListener("click", function () { abrirLanc(S.page === "despesas" ? "saida" : "entrada"); });
    $("fl-tipo").addEventListener("click", function (e) { var b = e.target.closest("[data-t]"); if (!b) return; S.lanc.tipo = b.dataset.t; lancTipo(); });
    $("fl-form").addEventListener("submit", function (e) { e.preventDefault(); salvarLanc($("fl-save")); });
    $("fl-cancel").addEventListener("click", function () { $("fin-lanc").hidden = true; });
    $("fl-del").addEventListener("click", function () { $("fl-del-box").hidden = false; });
    $("fl-del-no").addEventListener("click", function () { $("fl-del-box").hidden = true; });
    $("fl-del-yes").addEventListener("click", async function () { try { await delMov(S.lanc.edit.mes, S.lanc.edit.id); $("fin-lanc").hidden = true; T.toast("Lançamento excluído"); } catch (err) { T.showError(err); } });
    // gráfico
    var chart = $("fi-chart");
    chart.addEventListener("mousemove", function (e) { var b = e.target.closest(".band"); if (b) showTip(+b.dataset.i, b); });
    chart.addEventListener("click", function (e) { var b = e.target.closest(".band"); if (b) showTip(+b.dataset.i, b); });
    chart.addEventListener("mouseleave", function () { $("fi-tip").hidden = true; T.each(".band.on", function (b) { b.classList.remove("on"); }, chart); });
    window.addEventListener("resize", function () { if (T.state.sub === "financeiro" && S.page === "inicio") T.scheduleRender(); });
    // cliques nas páginas
    view.addEventListener("click", async function (e) {
      var t = e.target.closest("button"); if (!t) return;
      if (t.closest(".fin-row") && await acaoLinha(t)) return;
      if (t.dataset.f) { S.recFiltro = t.dataset.f; T.render(); return; }
      if (t.dataset.fold === "pagar") { S.pagarAberto = !S.pagarAberto; T.ls("fin.pagar", S.pagarAberto ? "1" : "0"); T.render(); return; }
      if (t.dataset.fold === "recebidas") { S.recebidasAberto = !S.recebidasAberto; T.render(); return; }
      if (t.dataset.foldc) { S.abertos[t.dataset.foldc] = !S.abertos[t.dataset.foldc]; T.render(); return; }
      if (t.dataset.cf) { S.conFiltro = t.dataset.cf; T.render(); return; }
      if (t.dataset.editc) { abrirContrato(T.byId(S.contratos, t.dataset.editc)); return; }
      if (t.dataset.editr) { abrirRec(T.byId(S.rec, t.dataset.editr)); return; }
      if (t.id === "fc-novo-btn") { abrirContrato(null); return; }
      if (t.id === "fr-nova") { abrirLanc("entrada"); return; }
      if (t.id === "fd-nova") { abrirRec(null); return; }
      if (t.id === "fd-mapa") { abrirMapa(); return; }
      if (t.id === "fd-avulsa") { abrirLanc("saida"); return; }
      if (t.id === "fd-usar") { await T.saveWith(t, function () { return T.saveConfig({ custosFixosMensais: custoFixoMapeado() }); }); return; }
    });
    // contrato
    $("fc-proj").addEventListener("change", function () {
      var v = this.value; $("fc-novo-wrap").hidden = v !== "__novo";
      var p = T.projeto(v); if (p) { if (!$("fc-cliente").value) $("fc-cliente").value = p.cliente || ""; if (!$("fc-total").value && p.honorario != null) $("fc-total").value = p.honorario; somaParc(); }
      if (v === "__novo") $("fc-novo").focus();
    });
    $("fc-gerar").addEventListener("click", gerarParcelas);
    $("fc-add-parc").addEventListener("click", function () { addParcRow(null); somaParc(); $("fc-parcs").lastElementChild.querySelector("input").focus(); });
    $("fc-parcs").addEventListener("click", function (e) { if (e.target.closest("[data-rmp]")) { e.target.closest(".parc-row").remove(); renumerar(); } });
    $("fc-parcs").addEventListener("input", somaParc);
    $("fc-total").addEventListener("input", somaParc);
    $("fc-save").addEventListener("click", function () { salvarContrato($("fc-save")); });
    $("fc-cancel").addEventListener("click", function () { $("fin-contrato").hidden = true; });
    $("fc-del").addEventListener("click", function () { $("fc-del-box").hidden = false; });
    $("fc-del-no").addEventListener("click", function () { $("fc-del-box").hidden = true; });
    $("fc-del-yes").addEventListener("click", async function () { try { await T.db.doc("fin_contratos/" + S.ce.id).delete(); $("fin-contrato").hidden = true; T.toast("Contrato excluído"); } catch (err) { T.showError(err); } });
    // despesa fixa e mapa
    $("frc-freq").addEventListener("change", function () { $("frc-mesanual-wrap").hidden = this.value !== "anual"; });
    $("frc-save").addEventListener("click", function () { salvarRecForm($("frc-save")); });
    $("frc-cancel").addEventListener("click", function () { $("fin-rec").hidden = true; });
    $("frc-encerrar").addEventListener("click", async function () {
      var itens = T.clone(S.rec), r = T.byId(itens, S.re.id), pago = movs().some(function (m) { return m.recId === r.id && m.refMes === T.mesAtual(); });
      r.fim = pago ? T.mesAtual() : T.mesAnterior();
      try { await saveRec(itens); $("fin-rec").hidden = true; T.toast("Despesa encerrada. O histórico continua nos meses anteriores."); } catch (err) { T.showError(err); }
    });
    $("frc-excluir").addEventListener("click", async function () {
      try { await saveRec(S.rec.filter(function (r) { return r.id !== S.re.id; })); $("fin-rec").hidden = true; T.toast("Despesa fixa excluída"); } catch (err) { T.showError(err); }
    });
    $("fm-save").addEventListener("click", function () { salvarMapa($("fm-save")); });
    $("fm-cancel").addEventListener("click", function () { $("fin-mapa").hidden = true; });
    $("fm-lista").addEventListener("input", function (e) { var i = e.target.dataset.mv; if (i != null && e.target.value) document.querySelector('[data-mi="' + i + '"]').checked = true; });
    // ajustes
    $("fa-form").addEventListener("input", function () { this.dataset.dirty = "1"; });
    $("fa-save").addEventListener("click", async function () {
      var box = $("fa-form"), n = parseInt($("fa-num").value, 10);
      var ok = await T.saveWith(this, function () {
        return saveCfg({ recibo: { nome: $("fa-nome").value.trim(), doc: $("fa-doc").value.trim(), cidade: $("fa-cidade").value.trim(), contato: $("fa-contato").value.trim() },
          proximoRecibo: n > 0 ? n : 1, contaPadrao: $("fa-conta").value, formaPadrao: $("fa-forma").value,
          diaPagamentoEquipe: Math.min(28, Math.max(1, parseInt($("fa-dia").value, 10) || 5)), impostoPct: num($("fa-imp").value) });
      });
      if (ok) box.dataset.dirty = "";
    });
    view.querySelector("#fp-ajustes").addEventListener("input", function (e) { var le = e.target.closest(".list-edit"); if (le) le.dataset.dirty = "1"; });
    view.querySelector("#fp-ajustes").addEventListener("click", async function (e) {
      var t = e.target.closest("button"); if (!t) return;
      if (t.dataset.rm) { var le = t.closest(".list-edit"); t.closest(".list-edit-row").remove(); le.dataset.dirty = "1"; return; }
      if (t.dataset.add) { var box = $("fa-" + t.dataset.add); box.insertAdjacentHTML("beforeend", listRow({ id: "", nome: "" })); box.dataset.dirty = "1"; box.lastElementChild.querySelector("input").focus(); return; }
      if (t.dataset.savel) {
        var k = t.dataset.savel, el = $("fa-" + k), used = {}, c = cfg();
        var itens = Array.prototype.map.call(el.querySelectorAll(".list-edit-row"), function (row) {
          var nome = row.querySelector("input").value.trim(); if (!nome) return null;
          var id = row.dataset.id || T.slug(nome); while (used[id]) id += "-2"; used[id] = 1; row.dataset.id = id;
          var velho = T.byId(c.contas.concat(c.categorias), id);
          return velho ? Object.assign({}, velho, { nome: nome }) : k === "contas" ? { id: id, nome: nome } : { id: id, nome: nome, tipo: k === "cat-entrada" ? "entrada" : "saida" };
        }).filter(Boolean);
        var ok = await T.saveWith(t, async function () {
          if (!itens.length) throw new Error("Mantenha ao menos um item");
          if (k === "contas") await saveCfg({ contas: itens });
          else { var tipo = k === "cat-entrada" ? "entrada" : "saida"; await saveCfg({ categorias: c.categorias.filter(function (x) { return x.tipo !== tipo; }).concat(itens) }); }
        });
        if (ok) el.dataset.dirty = "";
      }
    });
  }

  // ---------- HTML ----------
  function fld(cls, id, label, input) { return '<div class="field ' + cls + '"><label for="' + id + '">' + label + "</label>" + input + "</div>"; }
  function sec(t, meta, body) { return '<div><div class="section-head"><h2 class="section-title">' + t + "</h2>" + (meta || "") + "</div>" + body + "</div>"; }
  var html =
    '<div class="notice" id="fin-teste" hidden>Cópia de teste: os projetos, as horas e os valores são fictícios. Nada daqui chega ao app oficial.</div>' +
    '<div class="fin-bar"><nav class="fin-nav" id="fin-nav" aria-label="Áreas do Financeiro">' + PAGES.map(function (p) { return '<button class="seg-pill" data-page="' + p[0] + '">' + p[1] + "</button>"; }).join("") + "</nav>" +
      '<div class="fin-tools"><div class="month-switch" id="fin-mes-wrap"><button id="fin-prev" aria-label="Mês anterior">‹</button><span id="fin-mes" title="Voltar ao mês atual" role="button" tabindex="0"></span><button id="fin-next" aria-label="Próximo mês">›</button></div>' +
      '<button class="btn btn-primary" id="fin-add">+ Lançar</button></div></div>' +
    // lançamento avulso
    '<div class="panel" id="fin-lanc" hidden><h3 class="panel-title" id="fl-title">Novo lançamento</h3><form id="fl-form" class="grid-form" autocomplete="off">' +
      '<div class="col-12"><div class="segmented" id="fl-tipo"><button type="button" class="seg-pill" data-t="entrada">Entrada</button><button type="button" class="seg-pill" data-t="saida">Saída</button><button type="button" class="seg-pill" data-t="reserva">Guardar na reserva</button></div></div>' +
      fld("col-3 keep", "fl-valor", "Valor (R$)", '<input type="number" id="fl-valor" min="0" step="0.01" inputmode="decimal" required>') +
      fld("col-3 keep", "fl-data", "Data", '<input type="date" id="fl-data" required>') +
      fld("col-6", "fl-desc", "Descrição", '<input id="fl-desc" placeholder="Ex.: Plotagem pranchas, Consultoria de cores">') +
      '<div class="field col-4" id="fl-cat-wrap"><label for="fl-cat">Categoria</label><select id="fl-cat"></select></div>' +
      '<div class="field col-4" id="fl-proj-wrap"><label for="fl-proj">Projeto (opcional)</label><select id="fl-proj"></select></div>' +
      '<div class="field col-4" id="fl-quem-wrap"><label for="fl-quem">Recebido de</label><input id="fl-quem" placeholder="Nome do cliente (sai no recibo)"></div>' +
      fld("col-3 keep", "fl-status", "Situação", '<select id="fl-status"><option value="paga">Já pago</option><option value="prevista">Previsto</option></select>') +
      '<div class="field col-3 keep" id="fl-forma-wrap"><label for="fl-forma">Forma</label><select id="fl-forma"></select></div>' +
      fld("col-3 keep", "fl-conta", "Conta", '<select id="fl-conta"></select>') +
      '<div class="col-3" id="fl-rep-wrap"><label class="check"><input type="checkbox" id="fl-rep"> Repete todo mês</label></div>' +
      '<div class="col-12 form-actions"><button class="btn btn-primary" type="submit" id="fl-save">Salvar lançamento</button><button class="btn" type="button" id="fl-cancel">Cancelar</button><button class="link danger" type="button" id="fl-del" hidden>Excluir</button></div>' +
      '<div class="col-12 confirm-box" id="fl-del-box" hidden>Excluir este lançamento? <button class="btn btn-small btn-stop" type="button" id="fl-del-yes">Excluir</button><button class="btn btn-small" type="button" id="fl-del-no">Manter</button></div>' +
    "</form></div>" +
    // painel
    '<div class="fin-page" id="fp-inicio">' +
      '<div class="tiles" id="fi-tiles"></div>' +
      '<div class="card chart-card"><div class="chart-head"><div class="chart-title">Últimos 12 meses</div><div class="legend"><span><i style="background:var(--serie-a)"></i>Entrou</span><span><i style="background:var(--serie-b)"></i>Saiu (despesas + equipe)</span></div></div>' +
        '<div class="chart" id="fi-chart"></div><div class="chart-tip" id="fi-tip" hidden></div></div>' +
      '<div class="forecast" id="fi-prev"></div>' +
      sec("A receber", '<div class="segmented" id="fi-recf"><button class="seg-pill" data-f="mes">Até este mês</button><button class="seg-pill" data-f="todas">Todas em aberto</button></div>', '<div class="fin-list" id="fi-receber"></div><div class="fin-list" id="fi-recebidas" style="margin-top:8px"></div>') +
      sec("A pagar", '<span class="section-meta" id="fi-pagar-meta"></span>', '<div class="fin-list" id="fi-pagar"></div>') +
    "</div>" +
    // receitas
    '<div class="fin-page" id="fp-receitas" hidden><div class="tiles" id="fr-tiles"></div>' +
      sec("Recebidas no mês", '<button class="btn btn-small" id="fr-nova">+ Receita avulsa</button>', '<div class="fin-list" id="fr-recebidas"></div>') +
      sec("A receber no mês", "", '<div class="fin-list" id="fr-previstas"></div>') + "</div>" +
    // despesas
    '<div class="fin-page" id="fp-despesas" hidden><div class="tiles" id="fd-tiles"></div>' +
      '<div class="panel" id="fin-rec" hidden><h3 class="panel-title" id="fr-title">Nova despesa fixa</h3><div class="grid-form">' +
        fld("col-6", "frc-desc", "Descrição", '<input id="frc-desc" placeholder="Ex.: SketchUp, Internet">') + fld("col-6", "frc-cat", "Categoria", '<select id="frc-cat"></select>') +
        fld("col-3 keep", "frc-valor", "Valor cheio (R$)", '<input type="number" id="frc-valor" min="0" step="0.01" inputmode="decimal">') +
        fld("col-3 keep", "frc-pct", "% do escritório", '<input type="number" id="frc-pct" min="0" max="100" step="5">') +
        fld("col-3 keep", "frc-freq", "Frequência", '<select id="frc-freq"><option value="mensal">Todo mês</option><option value="anual">Uma vez por ano</option></select>') +
        fld("col-3 keep", "frc-dia", "Dia do vencimento", '<input type="number" id="frc-dia" min="1" max="28" step="1">') +
        '<div class="field col-3 keep" id="frc-mesanual-wrap"><label for="frc-mesanual">Mês (anual)</label><select id="frc-mesanual"></select></div>' +
        fld("col-3 keep", "frc-inicio", "Começa em", '<input type="month" id="frc-inicio">') +
        '<div class="col-12 hint">Gasto dividido com a casa (internet, energia, celular): informe o valor cheio e a parte que é do escritório.</div>' +
        '<div class="col-12 form-actions"><button class="btn btn-primary" id="frc-save">Salvar despesa fixa</button><button class="btn" id="frc-cancel">Cancelar</button><button class="link" id="frc-encerrar">Encerrar (não repete mais)</button><button class="link danger" id="frc-excluir">Excluir</button></div></div></div>' +
      '<div class="panel" id="fin-mapa" hidden><h3 class="panel-title">Mapear despesas fixas</h3><p class="hint" style="margin:0 0 12px">Marque o que o escritório usa e informe o valor aproximado. Para gastos divididos com a casa, ajuste o percentual. Tudo pode ser editado depois.</p>' +
        '<div class="map-list" id="fm-lista"></div><div class="form-actions" style="margin-top:12px"><button class="btn btn-primary" id="fm-save">Adicionar selecionadas</button><button class="btn" id="fm-cancel">Cancelar</button></div></div>' +
      sec("Despesas do mês", '<button class="btn btn-small" id="fd-avulsa">+ Despesa avulsa</button>', '<div id="fd-lista"></div>') +
      sec("Despesas fixas", '<div class="form-actions"><button class="btn btn-small" id="fd-mapa">Mapear despesas</button><button class="btn btn-small" id="fd-nova">+ Despesa fixa</button></div>', '<div id="fd-fixas"></div><div class="hint form-actions" id="fd-sync" style="margin-top:10px"></div>') +
    "</div>" +
    // contratos
    '<div class="fin-page" id="fp-contratos" hidden>' +
      '<div class="panel" id="fin-contrato" hidden><h3 class="panel-title" id="fc-title">Novo contrato</h3><div class="grid-form">' +
        fld("col-6", "fc-proj", "Projeto", '<select id="fc-proj"></select>') +
        '<div class="field col-6" id="fc-novo-wrap" hidden><label for="fc-novo">Nome do novo projeto</label><input id="fc-novo" placeholder="Ex.: Residência Costa"></div>' +
        fld("col-6", "fc-cliente", "Cliente", '<input id="fc-cliente" placeholder="Nome que sai no recibo">') +
        fld("col-3 keep", "fc-doc", "CPF/CNPJ do cliente", '<input id="fc-doc" placeholder="Opcional">') +
        fld("col-3 keep", "fc-status", "Situação", '<select id="fc-status"><option value="ativo">Ativo</option><option value="encerrado">Encerrado</option></select>') +
        fld("col-8", "fc-servico", "Serviço contratado", '<input id="fc-servico" placeholder="Ex.: projeto arquitetônico residencial">') +
        fld("col-4", "fc-total", "Valor total (R$)", '<input type="number" id="fc-total" min="0" step="0.01" inputmode="decimal">') +
        '<div class="col-12"><div class="form-sub">Parcelas</div></div>' +
        fld("col-3 keep", "fc-n", "Nº de parcelas", '<input type="number" id="fc-n" min="1" max="60" step="1">') +
        fld("col-3 keep", "fc-ini", "1º vencimento", '<input type="date" id="fc-ini">') +
        fld("col-3 keep", "fc-int", "Intervalo", '<select id="fc-int"><option value="mensal">Mensal</option><option value="quinzenal">Quinzenal</option></select>') +
        '<div class="col-3 keep form-actions"><button class="btn" type="button" id="fc-gerar">Gerar parcelas</button></div>' +
        '<div class="col-12 parc-edit" id="fc-parcs"></div>' +
        '<div class="col-12 form-actions"><button class="btn btn-small" type="button" id="fc-add-parc">+ Parcela</button><span class="hint" id="fc-soma"></span></div>' +
        '<div class="col-12 hint">Parcelas ligadas a etapas: escreva a etapa na descrição (ex.: “Anteprojeto”) e ajuste o vencimento. Em contratos já em andamento, marque “Já recebida” nas parcelas pagas antes do app.</div>' +
        '<div class="col-12 form-actions"><button class="btn btn-primary" type="button" id="fc-save">Salvar contrato</button><button class="btn" type="button" id="fc-cancel">Cancelar</button><button class="link danger" type="button" id="fc-del" hidden>Excluir contrato</button></div>' +
        '<div class="col-12 confirm-box" id="fc-del-box" hidden>Excluir o contrato e todas as parcelas? <button class="btn btn-small btn-stop" type="button" id="fc-del-yes">Excluir</button><button class="btn btn-small" type="button" id="fc-del-no">Manter</button></div>' +
      "</div></div>" +
      sec("Contratos", '<div class="form-actions"><div class="segmented" id="fc-filtro"><button class="seg-pill" data-cf="ativo">Ativos</button><button class="seg-pill" data-cf="encerrado">Encerrados</button></div><button class="btn btn-small btn-primary" id="fc-novo-btn">+ Novo contrato</button></div>', '<div class="contracts" id="fc-lista"></div>') +
    "</div>" +
    // ajustes
    '<div class="fin-page" id="fp-ajustes" hidden>' +
      sec("Pessoas e valor-hora", '<span class="section-meta">Para alterar, use Configurações na página inicial</span>', '<div id="fa-pessoas"></div><div class="hint" style="margin-top:8px">A remuneração de cada pessoa é o fechamento mensal (horas × valor-hora). No início de cada mês ela aparece em “A pagar”.</div>') +
      sec("Recibo e pagamentos", "", '<div class="card grid-form" id="fa-form">' +
        fld("col-6", "fa-nome", "Nome no recibo (quem recebe)", '<input id="fa-nome" placeholder="Ex.: Luan …">') + fld("col-3 keep", "fa-doc", "CPF/CNPJ", '<input id="fa-doc">') +
        fld("col-3 keep", "fa-cidade", "Cidade", '<input id="fa-cidade" placeholder="Ex.: Belo Horizonte/MG">') + fld("col-6", "fa-contato", "Contato no rodapé", '<input id="fa-contato" placeholder="Telefone, e-mail ou Instagram">') +
        fld("col-3 keep", "fa-num", "Próximo nº de recibo", '<input type="number" id="fa-num" min="1" step="1">') +
        fld("col-3 keep", "fa-dia", "Dia de pagar a equipe", '<input type="number" id="fa-dia" min="1" max="28" step="1">') +
        fld("col-4", "fa-conta", "Conta padrão", '<select id="fa-conta"></select>') + fld("col-4", "fa-forma", "Forma padrão", '<select id="fa-forma"></select>') +
        fld("col-4", "fa-imp", "Reserva de imposto (% do recebido)", '<input type="number" id="fa-imp" min="0" max="50" step="0.5" placeholder="Opcional">') +
        '<div class="col-12 form-actions"><button class="btn btn-primary" id="fa-save">Salvar</button></div></div>') +
      '<div class="grid-form" style="gap:28px">' +
        [["contas", "Contas", "+ Conta"], ["cat-entrada", "Categorias de entrada", "+ Categoria"], ["cat-saida", "Categorias de saída", "+ Categoria"]].map(function (l) {
          return '<div class="col-' + (l[0] === "contas" ? "12" : "6") + '"><div class="section-head"><h2 class="section-title">' + l[1] + '</h2></div><div class="card"><div class="list-edit" id="fa-' + l[0] + '"></div>' +
            '<div class="form-actions" style="margin-top:10px"><button class="btn btn-small" data-add="' + l[0] + '">' + l[2] + '</button><button class="btn btn-small btn-primary" data-savel="' + l[0] + '">Salvar</button></div></div></div>';
        }).join("") + "</div>" +
    "</div>";
  var overlayHtml = '<div class="overlay" id="fin-overlay" hidden><div class="modal" role="dialog" aria-modal="true" aria-labelledby="fin-modal-title">' +
    '<div class="section-head" style="margin:0"><h2 class="section-title" id="fin-modal-title">Recibo</h2><button class="link" data-close="1">Fechar</button></div>' +
    '<div id="fin-receipt"></div><div class="hint" id="fin-emit-hint"></div>' +
    '<div class="form-actions"><button class="btn btn-primary" id="fin-pdf">Baixar PDF</button><button class="btn" data-close="1">Fechar</button><span class="save-state" id="fin-pdf-st"></span></div></div></div>';

  // ---------- registro ----------
  T.register({
    id: "financeiro", label: "Financeiro", area: "admin", html: html, init: init, render: render,
    icon: '<path d="M3 7h18v12H3z"/><path d="M3 11h18"/><path d="M7 15h3"/>',
    desc: function () { return "Recebimentos, despesas e resultado"; },
    connect: function (db) {
      db.doc("fin_config/geral").onSnapshot(function (d) { S.cfgDoc = d.exists ? d.data() : null; T.scheduleRender(); }, T.onErr);
      db.collection("fin_contratos").onSnapshot(function (s) { S.contratos = T.snapList(s); T.scheduleRender(); }, T.onErr);
      db.collection("fin_mov").onSnapshot(function (s) { S.movDocs = T.arrDocs(s); T.scheduleRender(); }, T.onErr);
      db.doc("fin_recorrentes/lista").onSnapshot(function (d) { S.rec = d.exists && Array.isArray(d.data().itens) ? d.data().itens : []; T.scheduleRender(); }, T.onErr);
    }
  });
})();
