/* Módulo Cadastros — registros-base do escritório: contatos (clientes, fornecedores, mão de obra, parceiros),
 * projetos, obras e colaboradores. Dados: contatos/<id>, obras/<id>; projetos/<id> é do núcleo (este módulo
 * acrescenta clienteIds). Expõe Trilha.cadastros para os outros módulos. */
(function () {
  "use strict";
  var T = window.Trilha, $ = T.$, esc = T.esc;
  var TIPOS = [["cliente", "Cliente", "Clientes"], ["fornecedor", "Fornecedor", "Fornecedores"], ["maodeobra", "Mão de obra", "Mão de obra"], ["parceiro", "Parceiro", "Parceiros"]];
  var OBRA_SIT = [["planejamento", "Planejamento"], ["andamento", "Em andamento"], ["pausada", "Pausada"], ["concluida", "Concluída"]];
  var S = { contatos: [], obras: [], sec: "contatos", filtro: "todos", busca: "", edit: null, editObra: null, editProj: null };

  function tipoNome(k) { var t = TIPOS.filter(function (x) { return x[0] === k; })[0]; return t ? t[1] : k; }
  function contato(id) { return T.byId(S.contatos, id); }
  function contatos(tipo) { return S.contatos.filter(function (c) { return !tipo || (c.tipos || []).indexOf(tipo) >= 0; }).sort(function (a, b) { return a.nome.localeCompare(b.nome); }); }
  function projetosDoCliente(id) { return T.state.projetos.filter(function (p) { return (p.clienteIds || []).indexOf(id) >= 0; }); }

  async function criarContato(c) {
    var body = Object.assign({ tipos: [], categoria: "", nome: "", contato: "", empresa: "", email: "", doc: "", razaoSocial: "", endereco: "", descricao: "", observacao: "" }, c, { criadoEm: new Date().toISOString() });
    var ref = await T.db.collection("contatos").add(body);
    S.contatos.push(Object.assign({ id: ref.id }, body));
    return ref.id;
  }

  // ---------- render ----------
  function render() {
    T.each("#cad-secs [data-sec]", function (b) { b.classList.toggle("is-selected", b.dataset.sec === S.sec); });
    var body = S.sec === "projetos" ? secProjetos() : S.sec === "obras" ? secObras() : S.sec === "colab" ? secColab() : secContatos();
    $("cad-body").innerHTML = body;
  }
  function secContatos() {
    var q = S.busca.trim().toLowerCase();
    var list = contatos(S.filtro === "todos" ? null : S.filtro).filter(function (c) { return !q || [c.nome, c.empresa, c.categoria, c.email, c.contato].join(" ").toLowerCase().indexOf(q) >= 0; });
    var cont = {}; S.contatos.forEach(function (c) { (c.tipos || []).forEach(function (t) { cont[t] = (cont[t] || 0) + 1; }); });
    var head = '<div class="section-head"><div class="segmented" id="cad-filtro">' + [["todos", "Todos", S.contatos.length]].concat(TIPOS.map(function (t) { return [t[0], t[2], cont[t[0]] || 0]; })).map(function (f) {
      return '<button class="seg-pill' + (S.filtro === f[0] ? " is-selected" : "") + '" data-cf="' + f[0] + '">' + f[1] + " · " + f[2] + "</button>"; }).join("") + '</div><div class="form-actions"><input id="cad-busca" class="gp-busca" placeholder="Buscar" value="' + esc(S.busca) + '" aria-label="Buscar contato"><button class="btn btn-small btn-primary" data-novo="contato">+ Novo contato</button></div></div>';
    var form = S.edit ? formContato(S.edit === "novo" ? null : contato(S.edit)) : "";
    var rows = list.length ? '<div class="table-wrap as-list"><table><thead><tr><th>Nome</th><th>Tipo</th><th>Empresa</th><th>Contato</th><th>E-mail</th><th>Projetos</th></tr></thead><tbody>' + list.map(function (c) {
      var pj = (c.tipos || []).indexOf("cliente") >= 0 ? projetosDoCliente(c.id).map(function (p) { return p.codigo || p.nome; }).join(", ") : "";
      return '<tr class="cad-row" data-ed="' + esc(c.id) + '"><td class="name"><b>' + esc(c.nome) + "</b>" + (c.categoria ? '<div class="hint">' + esc(c.categoria) + "</div>" : "") + "</td><td>" + (c.tipos || []).map(function (t) { return '<span class="pill">' + esc(tipoNome(t)) + "</span>"; }).join(" ") + '</td><td data-l="Empresa">' + esc(c.empresa || "") + '</td><td class="num" data-l="Contato">' + esc(c.contato || "") + '</td><td data-l="E-mail">' + esc(c.email || "") + '</td><td data-l="Projetos">' + esc(pj) + "</td></tr>";
    }).join("") + "</tbody></table></div>" : '<div class="empty">Nenhum contato ' + (S.filtro === "todos" ? "cadastrado" : "deste tipo") + ".</div>";
    return head + form + rows;
  }
  function formContato(c) {
    c = c || { tipos: S.filtro !== "todos" ? [S.filtro] : ["cliente"] };
    var ehCli = (c.tipos || []).indexOf("cliente") >= 0;
    function f(id, l, v, col, extra) { return '<div class="field ' + (col || "col-6") + '"><label for="ct-' + id + '">' + l + '</label><input id="ct-' + id + '" value="' + esc(v || "") + '"' + (extra || "") + "></div>"; }
    var pj = T.state.projetos.slice().sort(function (a, b) { return a.nome.localeCompare(b.nome); });
    return '<form class="panel grid-form" id="cad-form" style="margin-bottom:16px" autocomplete="off"><h3 class="panel-title col-12">' + (c.id ? "Editar contato" : "Novo contato") + "</h3>" +
      '<div class="field col-12"><span class="label">Tipo de cadastro</span><div class="gp-multi">' + TIPOS.map(function (t) { return '<label class="gp-check"><input type="checkbox" data-ctipo="' + t[0] + '"' + ((c.tipos || []).indexOf(t[0]) >= 0 ? " checked" : "") + "> " + t[1] + "</label>"; }).join("") + "</div></div>" +
      f("nome", "Nome", c.nome, "col-6", " required") + f("categoria", "Especialidade (ex.: engenheiro estrutural, marmoraria)", c.categoria) +
      f("contato", "Contato (telefone)", c.contato, "col-4") + f("email", "E-mail", c.email, "col-4", ' type="email"') + f("doc", "CPF / CNPJ", c.doc, "col-4") +
      f("empresa", "Empresa", c.empresa) + f("razao", "Razão social", c.razaoSocial) + f("endereco", "Endereço", c.endereco, "col-12") +
      '<div class="field col-6"><label for="ct-desc">Descrição</label><textarea id="ct-desc" rows="2">' + esc(c.descricao || "") + '</textarea></div>' +
      '<div class="field col-6"><label for="ct-obs">Observação</label><textarea id="ct-obs" rows="2">' + esc(c.observacao || "") + "</textarea></div>" +
      '<div class="field col-12" id="ct-proj-wrap"' + (ehCli ? "" : " hidden") + '><span class="label">Projetos deste cliente</span><div class="gp-multi">' + (pj.length ? pj.map(function (p) { return '<label class="gp-check"><input type="checkbox" data-cproj="' + esc(p.id) + '"' + (c.id && (p.clienteIds || []).indexOf(c.id) >= 0 ? " checked" : "") + "> " + esc(p.codigo || p.nome) + "</label>"; }).join("") : '<span class="hint">Nenhum projeto cadastrado.</span>') + "</div></div>" +
      '<div class="col-12 form-actions"><button class="btn btn-primary" id="ct-save">Salvar contato</button><button type="button" class="btn" data-cancel="1">Cancelar</button>' +
      (c.id ? '<button type="button" class="link danger" data-del="' + esc(c.id) + '">Excluir contato</button>' : "") +
      '</div><p class="hint col-12">CPF, CNPJ e endereço são dados pessoais: quando houver colaboradores, ficam visíveis só para os sócios.</p></form>';
  }
  // Dados de cadastro do projeto (nome, código, clientes, endereço, contratos): só se alteram aqui.
  function formProjeto(p) {
    var ct = p.contrato || {}, g = T.gestor && T.gestor.gp(p.id), mc = g && g.marc && g.marc.ativo ? g.marc : null, mct = mc && mc.contrato || {};
    var cls = contatos("cliente");
    function f(id, l, v, col, extra) { return '<div class="field ' + (col || "col-4") + '"><label for="pj-' + id + '">' + l + '</label><input id="pj-' + id + '" value="' + esc(v == null ? "" : v) + '"' + (extra || "") + "></div>"; }
    return '<form class="panel grid-form" id="proj-form-cad" data-pid="' + esc(p.id) + '" style="margin-bottom:16px" autocomplete="off"><h3 class="panel-title col-12">Editar projeto</h3>' +
      f("nome", "Nome do projeto", p.nome, "col-8", " required") + f("cod", "Código", p.codigo) +
      '<div class="field col-12"><span class="label">Clientes</span><div class="gp-multi">' + (cls.length ? cls.map(function (c) { return '<label class="gp-check"><input type="checkbox" data-pjcli="' + esc(c.id) + '"' + ((p.clienteIds || []).indexOf(c.id) >= 0 ? " checked" : "") + "> " + esc(c.nome) + "</label>"; }).join("") : '<span class="hint">Nenhum cliente cadastrado.</span>') + "</div></div>" +
      f("end", "Endereço da obra", p.endereco, "col-12") +
      f("cnum", "Nº do contrato", ct.numero) + f("cdata", "Data do contrato", ct.data, "col-4", ' type="date"') + f("ccid", "Cidade (para os termos)", ct.cidade) +
      (mc ? f("mnum", "Nº do contrato da marcenaria", mct.numero) + f("mdata", "Data do contrato da marcenaria", mct.data, "col-4", ' type="date"') + f("mval", "Valor da marcenaria (R$)", mc.valor, "col-4", ' type="number" min="0" step="0.01"') : "") +
      '<div class="col-12 form-actions"><button class="btn btn-primary" id="pj-save">Salvar projeto</button><button type="button" class="btn" data-cancel="1">Cancelar</button></div>' +
      '<p class="hint col-12">No Gestor de Projetos, esses dados aparecem em Informações só para consulta.</p></form>';
  }
  async function salvarProjeto() {
    var f = $("proj-form-cad"), pid = f.dataset.pid, ids = [];
    T.each("[data-pjcli]", function (i) { if (i.checked) ids.push(i.dataset.pjcli); }, f);
    var nomes = ids.map(function (id) { var c = contato(id); return c ? c.nome : ""; }).filter(Boolean);
    var body = { nome: $("pj-nome").value.trim(), codigo: $("pj-cod").value.trim(), clienteIds: ids, cliente: nomes.join(" e "), endereco: $("pj-end").value.trim(), contrato: { numero: $("pj-cnum").value.trim(), data: $("pj-cdata").value || null, cidade: $("pj-ccid").value.trim() } };
    if (!body.nome) return;
    var marc = $("pj-mnum") ? { numero: $("pj-mnum").value.trim(), data: $("pj-mdata").value || null, valor: T.numOrNull($("pj-mval").value) } : null;
    var ok = await T.saveWith($("pj-save"), async function () {
      await T.db.doc("projetos/" + pid).update(body);
      if (marc && T.gestor) await T.gestor.salvar(pid, function (x) { x.marc.contrato = { numero: marc.numero, data: marc.data }; x.marc.valor = marc.valor; });
    });
    if (ok) setTimeout(function () { S.editProj = null; render(); }, 500);
  }
  function secProjetos() {
    var list = T.state.projetos.slice().sort(function (a, b) { return (a.codigo || a.nome).localeCompare(b.codigo || b.nome); });
    var head = '<div class="section-head"><div class="section-meta">Cada projeto tem um ou mais clientes. Nome, clientes e contratos se alteram aqui; o processo fica no Gestor de Projetos. Excluir um projeto só por aqui.</div><button class="btn btn-small btn-primary" data-novo="projeto">+ Novo projeto</button></div>';
    var ep = S.editProj && T.projeto(S.editProj);
    return head + (ep ? formProjeto(ep) : "") + (list.length ? '<div class="table-wrap as-list"><table><thead><tr><th>Código</th><th>Projeto</th><th>Clientes</th><th>Etapa</th><th>Situação</th><th></th></tr></thead><tbody>' + list.map(function (p) {
      var cl = (p.clienteIds || []).map(function (id) { var c = contato(id); return c ? c.nome : null; }).filter(Boolean).join(", ") || p.cliente || "";
      var g = T.gestor && T.gestor.gp(p.id), s = g ? T.gestor.situacao(p.id) : null;
      return '<tr class="cad-row" data-proj="' + esc(p.id) + '"><td class="num" data-l="Código"><b>' + esc(p.codigo || "—") + '</b></td><td class="name">' + esc(p.nome) + '</td><td data-l="Clientes">' + esc(cl) + '</td><td data-l="Etapa">' + (g ? T.gestor.etapaNome(p.id) : '<span class="hint">fora do Gestor</span>') + '</td><td data-l="Situação">' + (s ? '<span class="gp-sit ' + s.k + '">' + esc(s.txt) + "</span>" : "") + '</td><td class="acts"><button class="btn btn-small" data-pedit="' + esc(p.id) + '">Editar</button>' + (g ? "" : '<button class="btn btn-small" data-levar="' + esc(p.id) + '">Levar ao Gestor</button>') + '<button class="link danger" data-pdel="' + esc(p.id) + '">Excluir</button></td></tr>';
    }).join("") + "</tbody></table></div>" : '<div class="empty">Nenhum projeto cadastrado.</div>');
  }
  function secObras() {
    var head = '<div class="section-head"><div class="section-meta">Obras ligadas aos projetos. O acompanhamento virá no app de obra.</div><button class="btn btn-small btn-primary" data-novo="obra">+ Nova obra</button></div>';
    var form = "";
    if (S.editObra) {
      var o = S.editObra === "novo" ? {} : T.byId(S.obras, S.editObra) || {};
      form = '<form class="panel grid-form" id="obra-form" style="margin-bottom:16px"><h3 class="panel-title col-12">' + (o.id ? "Editar obra" : "Nova obra") + "</h3>" +
        '<div class="field col-6"><label for="ob-nome">Nome da obra</label><input id="ob-nome" required value="' + esc(o.nome || "") + '"></div>' +
        '<div class="field col-6"><label for="ob-proj">Projeto</label><select id="ob-proj"><option value="">—</option>' + T.state.projetos.map(function (p) { return '<option value="' + esc(p.id) + '"' + (o.projetoId === p.id ? " selected" : "") + ">" + esc(p.codigo || p.nome) + "</option>"; }).join("") + "</select></div>" +
        '<div class="field col-8"><label for="ob-end">Endereço</label><input id="ob-end" value="' + esc(o.endereco || "") + '"></div>' +
        '<div class="field col-4"><label for="ob-sit">Situação</label><select id="ob-sit">' + T.optHtml(OBRA_SIT, o.situacao || "planejamento") + "</select></div>" +
        '<div class="field col-12"><label for="ob-obs">Observação</label><textarea id="ob-obs" rows="2">' + esc(o.observacao || "") + "</textarea></div>" +
        '<div class="col-12 form-actions"><button class="btn btn-primary" id="ob-save">Salvar obra</button><button type="button" class="btn" data-cancel="1">Cancelar</button>' + (o.id ? '<button type="button" class="link danger" data-odel="' + esc(o.id) + '">Excluir obra</button>' : "") + "</div></form>";
    }
    return head + form + (S.obras.length ? '<div class="table-wrap as-list"><table><thead><tr><th>Obra</th><th>Projeto</th><th>Clientes</th><th>Situação</th></tr></thead><tbody>' + S.obras.map(function (o) {
      var p = T.projeto(o.projetoId), cl = p ? (p.clienteIds || []).map(function (id) { var c = contato(id); return c ? c.nome : null; }).filter(Boolean).join(", ") : "";
      return '<tr class="cad-row" data-obra="' + esc(o.id) + '"><td class="name"><b>' + esc(o.nome) + "</b></td><td>" + esc(p ? p.codigo || p.nome : "—") + "</td><td>" + esc(cl) + "</td><td>" + esc((OBRA_SIT.filter(function (s) { return s[0] === o.situacao; })[0] || ["", ""])[1]) + "</td></tr>";
    }).join("") + "</tbody></table></div>" : '<div class="empty">Nenhuma obra cadastrada.</div>');
  }
  function secColab() {
    return '<div class="section-head"><div class="section-meta">Equipe do escritório. Cadastro, valores e custo-hora ficam em Configurações. Excluir uma pessoa só por aqui.</div><button class="btn btn-small" data-cfg="1">Abrir Configurações</button></div>' +
      '<div class="table-wrap as-list"><table><thead><tr><th>Nome</th><th>Perfil</th><th>Situação</th><th></th></tr></thead><tbody>' + T.state.pessoas.map(function (p) {
        return '<tr><td class="name"><b>' + esc(p.nome) + '</b></td><td data-l="Perfil">' + (p.perfil === "colaborador" ? "Colaborador(a)" : "Sócio(a)") + '</td><td data-l="Situação">' + (p.ativo === false ? "Inativo" : "Ativo") + '</td><td class="acts"><button class="link danger" data-pesdel="' + esc(p.id) + '">Excluir</button></td></tr>';
      }).join("") + "</tbody></table></div>";
  }

  // ---------- gravação ----------
  async function salvarContato() {
    var id = S.edit === "novo" ? null : S.edit, tipos = [];
    T.each("[data-ctipo]", function (i) { if (i.checked) tipos.push(i.dataset.ctipo); });
    if (!tipos.length) { T.toast("Marque pelo menos um tipo de cadastro."); return; }
    var body = { tipos: tipos, nome: $("ct-nome").value.trim(), categoria: $("ct-categoria").value.trim(), contato: $("ct-contato").value.trim(), email: $("ct-email").value.trim(), doc: $("ct-doc").value.trim(),
      empresa: $("ct-empresa").value.trim(), razaoSocial: $("ct-razao").value.trim(), endereco: $("ct-endereco").value.trim(), descricao: $("ct-desc").value.trim(), observacao: $("ct-obs").value.trim() };
    if (!body.nome) return;
    var marcados = []; T.each("[data-cproj]", function (i) { if (i.checked) marcados.push(i.dataset.cproj); });
    var ok = await T.saveWith($("ct-save"), async function () {
      if (id) await T.db.doc("contatos/" + id).update(body); else id = await criarContato(body);
      if (tipos.indexOf("cliente") >= 0) {
        for (var k = 0; k < T.state.projetos.length; k++) {
          var p = T.state.projetos[k], tem = (p.clienteIds || []).indexOf(id) >= 0, quer = marcados.indexOf(p.id) >= 0;
          if (tem === quer) continue;
          var ids = (p.clienteIds || []).filter(function (x) { return x !== id; }); if (quer) ids.push(id);
          var nomes = ids.map(function (x) { var c = x === id ? body : contato(x); return c ? c.nome : ""; }).filter(Boolean);
          await T.db.doc("projetos/" + p.id).update({ clienteIds: ids, cliente: nomes.join(" e ") });
        }
      }
    });
    if (ok) setTimeout(function () { S.edit = null; render(); }, 500);
  }
  async function salvarObra() {
    var id = S.editObra === "novo" ? null : S.editObra;
    var body = { nome: $("ob-nome").value.trim(), projetoId: $("ob-proj").value || null, endereco: $("ob-end").value.trim(), situacao: $("ob-sit").value, observacao: $("ob-obs").value.trim() };
    if (!body.nome) return;
    var ok = await T.saveWith($("ob-save"), async function () { if (id) await T.db.doc("obras/" + id).update(body); else { body.criadoEm = new Date().toISOString(); await T.db.collection("obras").add(body); } });
    if (ok) setTimeout(function () { S.editObra = null; render(); }, 500);
  }

  // ---------- eventos ----------
  var html = '<div class="section-head"><h2 class="section-title">Cadastros</h2></div>' +
    '<div class="segmented" id="cad-secs" style="margin-bottom:16px">' + [["contatos", "Contatos"], ["projetos", "Projetos"], ["obras", "Obras"], ["colab", "Colaboradores"]].map(function (s) { return '<button class="seg-pill" data-sec="' + s[0] + '">' + s[1] + "</button>"; }).join("") + "</div>" +
    '<div id="cad-body"></div>';
  function init() {
    var v = $("view-cadastros");
    v.addEventListener("click", async function (e) {
      var t = e.target, b;
      if ((b = t.closest("[data-levar]"))) { T.gestor.novo(T.projeto(b.dataset.levar)); return; }
      if ((b = t.closest("[data-pedit]"))) { S.editProj = b.dataset.pedit; render(); window.scrollTo(0, 0); return; }
      if ((b = t.closest("[data-pdel]"))) {
        var pj = T.projeto(b.dataset.pdel);
        if (!(await T.confirmar({ titulo: "Excluir o projeto?", texto: "<b>" + esc(pj.nome) + "</b> sai de Cadastros, do Gestor de Projetos e de Horas e custos. As horas já lançadas continuam no Tempo, como “projeto removido”. Não dá para desfazer.", ok: "Excluir projeto", perigo: true }))) return;
        try { if (T.gestor && T.gestor.gp(pj.id)) await T.gestor.excluir(pj.id); await T.db.doc("projetos/" + pj.id).delete(); T.toast("Projeto excluído"); } catch (err) { T.showError(err); }
        return;
      }
      if ((b = t.closest("[data-pesdel]"))) {
        var pe = T.pessoa(b.dataset.pesdel);
        if (!(await T.confirmar({ titulo: "Excluir " + esc(pe.nome) + "?", texto: "A pessoa sai do app. As horas e tarefas dela continuam registradas, mas aparecem como “pessoa removida”. Para só tirar da equipe sem apagar, marque como inativa em Configurações.", ok: "Excluir pessoa", perigo: true }))) return;
        try { await T.db.doc("pessoas/" + pe.id).delete(); T.toast("Pessoa excluída"); } catch (err) { T.showError(err); }
        return;
      }
      if ((b = t.closest("[data-odel]"))) {
        if (!(await T.confirmar({ titulo: "Excluir a obra?", ok: "Excluir obra", perigo: true }))) return;
        try { await T.db.doc("obras/" + b.dataset.odel).delete(); S.editObra = null; render(); T.toast("Obra excluída"); } catch (err) { T.showError(err); }
        return;
      }
      if ((b = t.closest("[data-sec]"))) { S.sec = b.dataset.sec; S.edit = S.editObra = S.editProj = null; render(); return; }
      if ((b = t.closest("[data-cf]"))) { S.filtro = b.dataset.cf; render(); return; }
      if ((b = t.closest("[data-novo]"))) { var k = b.dataset.novo; if (k === "projeto") { T.gestor.novo(); return; } if (k === "obra") S.editObra = "novo"; else S.edit = "novo"; render(); return; }
      if (t.closest("[data-cancel]")) { S.edit = S.editObra = S.editProj = null; render(); return; }
      if ((b = t.closest("[data-ed]"))) { S.edit = b.dataset.ed; render(); window.scrollTo(0, 0); return; }
      if ((b = t.closest("[data-proj]"))) { T.gestor.gp(b.dataset.proj) ? T.gestor.abrir(b.dataset.proj) : T.relatorios.abrirCustos(); return; }
      if ((b = t.closest("[data-obra]"))) { S.editObra = b.dataset.obra; render(); return; }
      if ((b = t.closest("[data-del]"))) {
        var ct = contato(b.dataset.del);
        if (!(await T.confirmar({ titulo: "Excluir o contato?", texto: "<b>" + esc(ct ? ct.nome : "") + "</b> sai dos Cadastros. Os projetos continuam, sem este cliente vinculado.", ok: "Excluir contato", perigo: true }))) return;
        T.db.doc("contatos/" + b.dataset.del).delete().then(function () { S.edit = null; render(); T.toast("Contato excluído"); }, T.showError); return;
      }
      if (t.closest("[data-cfg]")) { T.go("admin", "config"); }
    });
    v.addEventListener("change", function (e) { if (e.target.dataset.ctipo === "cliente") $("ct-proj-wrap").hidden = !e.target.checked; });
    v.addEventListener("input", function (e) { if (e.target.id === "cad-busca") { S.busca = e.target.value; var pos = e.target.selectionStart; render(); var i = $("cad-busca"); i.focus(); try { i.setSelectionRange(pos, pos); } catch (x) {} } });
    v.addEventListener("submit", function (e) { e.preventDefault(); if (e.target.id === "cad-form") salvarContato(); if (e.target.id === "obra-form") salvarObra(); if (e.target.id === "proj-form-cad") salvarProjeto(); });
  }

  T.cadastros = { contato: contato, contatos: contatos, criarContato: criarContato,
    editarProjeto: function (pid) { S.sec = "projetos"; S.edit = S.editObra = null; S.editProj = pid; T.go("admin", "cadastros"); window.scrollTo(0, 0); } };
  T.register({
    id: "cadastros", label: "Cadastros", area: "admin", html: html, init: init, render: render,
    icon: '<path d="M4 4h12l4 4v12H4z"/><circle cx="11" cy="11" r="2.5"/><path d="M7 17c.8-1.8 2.2-2.7 4-2.7s3.2.9 4 2.7"/>',
    desc: function () { var n = S.contatos.length; return n ? n + (n === 1 ? " contato" : " contatos") + " · projetos · obras" : "Contatos, clientes, projetos e obras"; },
    connect: function (db) {
      db.collection("contatos").onSnapshot(function (s) { S.contatos = T.snapList(s); T.loaded("contatos", s); T.scheduleRender(); }, T.onErr);
      db.collection("obras").onSnapshot(function (s) { S.obras = T.snapList(s); T.scheduleRender(); }, T.onErr);
    }
  });
})();
