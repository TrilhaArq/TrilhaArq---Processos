/* Módulo Tarefas — agenda de alto nível por pessoa (independente do tempo).
 * Dados: tarefas/<pessoa> {itens[]}. Compromissos com data vão para a Agenda Google (create/update). */
(function () {
  "use strict";
  var T = window.Trilha, $ = T.$, esc = T.esc, ymd = T.ymd;
  var S = { docs: {}, grupo: "tarefa", editId: null, open: {}, inline: null, confirmId: null, confirmClear: false };
  var DUR_OPTS = [[30, "30 min"], [60, "1h"], [90, "1h30"], [120, "2h"], [180, "3h"], [240, "4h"]];
  var REM_OPTS = [["", "Padrão da agenda"], ["none", "Sem lembrete"], ["10", "10 min antes"], ["30", "30 min antes"], ["60", "1h antes"], ["1440", "1 dia antes"]];
  var REC_OPTS = [["", "Não repete"], ["WEEKLY", "Toda semana"], ["BIWEEKLY", "A cada 2 semanas"], ["MONTHLY", "Todo mês"]];
  var REC_RRULE = { WEEKLY: "RRULE:FREQ=WEEKLY", BIWEEKLY: "RRULE:FREQ=WEEKLY;INTERVAL=2", MONTHLY: "RRULE:FREQ=MONTHLY" };
  var CALENDAR_ID = "trilha@trilhaarq.com.br";

  function tarefas(pid) { return S.docs[pid] || []; }
  async function save(pid, itens) { S.docs[pid] = itens; T.scheduleRender(); await T.db.doc("tarefas/" + pid).set({ pessoaId: pid, itens: itens }); }
  async function patch(pid, id, p) { var itens = T.clone(tarefas(pid)), t = T.byId(itens, id); if (!t) return null; Object.assign(t, p); await save(pid, itens); return t; }
  function remVal(r) { return r == null ? "" : r === -1 ? "none" : String(r); }
  function remParse(v) { return v === "" ? null : v === "none" ? -1 : +v; }
  function remLabel(r) { var v = remVal(r); for (var i = 0; i < REM_OPTS.length; i++) if (REM_OPTS[i][0] === v) return REM_OPTS[i][1]; return ""; }
  function durLabel(m) { for (var i = 0; i < DUR_OPTS.length; i++) if (DUR_OPTS[i][0] === m) return DUR_OPTS[i][1]; return m ? m + " min" : "1h"; }

  var html =
    '<div class="form-actions" style="justify-content:space-between"><div class="section-meta" id="task-meta"></div><button class="btn btn-primary" id="btn-new-task">+ Nova tarefa</button></div>' +
    '<div class="panel" id="task-panel" hidden><h3 class="panel-title" id="task-panel-title">Nova tarefa</h3>' +
      '<form id="task-form" class="grid-form" autocomplete="off">' +
        '<div class="col-12 cat-row" id="k-grupo" role="group" aria-label="Grupo">' +
          ["compromisso", "prioridade", "demanda", "tarefa"].map(function (g) { return '<button type="button" class="seg-pill" data-g="' + g + '">' + g.charAt(0).toUpperCase() + g.slice(1) + "</button>"; }).join("") + "</div>" +
        '<div class="field col-12"><label for="k-title">Título</label><input id="k-title" required></div>' +
        '<div class="field col-6"><label for="k-desc">Descrição</label><textarea id="k-desc" rows="3"></textarea></div>' +
        '<div class="field col-6"><label for="k-check">Checklist (um item por linha)</label><textarea id="k-check" rows="3"></textarea></div>' +
        '<div class="field col-3 keep"><label for="k-date" id="k-date-label">Prazo</label><input type="date" id="k-date"></div>' +
        '<div class="field col-3 keep k-comp"><label for="k-time">Horário</label><input type="time" id="k-time"></div>' +
        '<div class="field col-3 keep k-comp"><label for="k-dur">Duração</label><select id="k-dur"></select></div>' +
        '<div class="field col-3 keep k-comp"><label for="k-rem">Lembrete</label><select id="k-rem"></select></div>' +
        '<div class="field col-3 keep k-comp k-new"><label for="k-rec">Repetir</label><select id="k-rec"></select></div>' +
        '<div class="col-12 form-actions"><button class="btn btn-primary" type="submit">Salvar</button><button class="btn" type="button" id="k-cancel">Cancelar</button></div>' +
      "</form></div>" +
    '<div><div class="section-head"><h2 class="tsec-title">Compromissos</h2><span class="section-meta" id="cnt-comp"></span></div><div class="task-list" id="list-compromisso"></div></div>' +
    '<div><div class="section-head"><h2 class="tsec-title">A fazer</h2><span class="section-meta" id="cnt-todo"></span></div>' +
      ["prioridade", "demanda", "tarefa"].map(function (g) { return '<div class="subgroup"><div class="subgroup-head"><span class="subgroup-dot ' + g + '"></span><span class="subgroup-label">' + g.charAt(0).toUpperCase() + g.slice(1) + ' <b id="cnt-' + g + '"></b></span></div><div class="task-list" id="list-' + g + '"></div></div>'; }).join("") +
    "</div>" +
    '<div><div class="section-head"><h2 class="tsec-title">Concluídas</h2><div class="form-actions"><span class="section-meta" id="cnt-done"></span><button class="link danger" id="btn-clear-done">Limpar concluídas</button></div></div><div class="task-list" id="list-done"></div></div>';

  function setGrupo(g) {
    S.grupo = g;
    T.each("#k-grupo .seg-pill", function (b) { b.classList.toggle("is-selected", b.dataset.g === g); });
    T.each(".k-comp", function (el) { el.hidden = g !== "compromisso"; });
    if (S.editId) T.each(".k-new", function (el) { el.hidden = true; });
    $("k-date-label").textContent = g === "compromisso" ? "Data" : "Prazo";
  }
  function openTask(t) {
    S.editId = t ? t.id : null;
    $("task-panel-title").textContent = t ? "Editar tarefa" : "Nova tarefa";
    $("k-title").value = t ? t.title : ""; $("k-desc").value = t ? t.description || "" : "";
    $("k-check").value = t && t.checklist ? t.checklist.map(function (c) { return c.text; }).join("\n") : "";
    $("k-date").value = t ? t.dueDate || "" : ""; $("k-time").value = t ? t.dueTime || "" : "";
    $("k-dur").innerHTML = T.optHtml(DUR_OPTS, t && t.durationMinutes || 60);
    $("k-rem").innerHTML = T.optHtml(REM_OPTS, remVal(t ? t.reminderMinutes : null));
    $("k-rec").innerHTML = T.optHtml(REC_OPTS, "");
    setGrupo(t ? t.subdivision : S.grupo);
    $("task-panel").hidden = false; $("k-title").focus();
  }
  function sortTasks(list, porData) {
    return list.slice().sort(function (a, b) {
      var ka = (a.dueDate || "9999") + (porData ? a.dueTime || "99:99" : ""), kb = (b.dueDate || "9999") + (porData ? b.dueTime || "99:99" : "");
      return ka === kb ? (a.createdAt < b.createdAt ? -1 : 1) : ka < kb ? -1 : 1;
    });
  }
  function taskCard(t) {
    var done = t.status === "done", hoje = ymd(new Date()), comp = t.subdivision === "compromisso", late = !done && t.dueDate && t.dueDate < hoje;
    var ed = S.inline && S.inline.id === t.id ? S.inline.field : null, badges = [];
    function badge(field, label, empty, extra) { return '<button class="badge' + (empty ? " is-empty" : "") + (extra || "") + '" data-edit-field="' + field + '" data-id="' + t.id + '">' + label + "</button>"; }
    if (ed === "dueDate") badges.push('<input type="date" class="badge-input" data-inline="dueDate" data-id="' + t.id + '" value="' + (t.dueDate || "") + '">');
    else badges.push(badge("dueDate", (comp ? "Data" : "Prazo") + (t.dueDate ? ": " + T.fmtYmd(t.dueDate) + (late ? " · atrasado" : "") : ""), !t.dueDate, late ? " is-overdue" : ""));
    if (comp) {
      badges.push(ed === "dueTime" ? '<input type="time" class="badge-input" data-inline="dueTime" data-id="' + t.id + '" value="' + (t.dueTime || "") + '">' : badge("dueTime", t.dueTime || "Horário", !t.dueTime));
      badges.push(ed === "durationMinutes" ? '<select class="badge-input" data-inline="durationMinutes" data-id="' + t.id + '">' + T.optHtml(DUR_OPTS, t.durationMinutes || 60) + "</select>" : badge("durationMinutes", "Duração: " + durLabel(t.durationMinutes || 60)));
      badges.push(ed === "reminderMinutes" ? '<select class="badge-input" data-inline="reminderMinutes" data-id="' + t.id + '">' + T.optHtml(REM_OPTS, remVal(t.reminderMinutes)) + "</select>" : badge("reminderMinutes", remLabel(t.reminderMinutes)));
      if (t.recurrence) { var rl = REC_OPTS.filter(function (o) { return o[0] === t.recurrence; })[0]; badges.push('<span class="badge static">' + (rl ? rl[1] : "") + "</span>"); }
      if (t.calendarEventId) badges.push('<span class="pill accent" title="Sincronizado com a Agenda Google">Na agenda</span>');
    }
    var cl = t.checklist || [], feitos = cl.filter(function (c) { return c.done; }).length, body = "";
    if (S.open[t.id]) {
      body = '<div class="task-body">' + (t.description ? '<div class="task-desc">' + esc(t.description) + "</div>" : "") +
        (cl.length ? '<div class="checklist">' + cl.map(function (c, i) { return '<label class="checklist-item' + (c.done ? " is-done" : "") + '"><input type="checkbox" data-check="' + t.id + '" data-i="' + i + '"' + (c.done ? " checked" : "") + "><span>" + esc(c.text) + "</span></label>"; }).join("") + "</div>" : "") +
        '<div class="form-actions"><button class="link" data-task-edit="' + t.id + '">Editar</button><button class="link danger' + (S.confirmId === t.id ? " confirm" : "") + '" data-task-del="' + t.id + '">' + (S.confirmId === t.id ? "Confirmar exclusão" : "Excluir") + "</button></div></div>";
    }
    var meta = '<div class="task-meta"><span>Criada em ' + T.fmtDataHora(t.createdAt) + "</span>" + (done && t.completedAt ? "<span>Concluída em " + T.fmtDataHora(t.completedAt) + " · levou " + T.fmtDur(new Date(t.completedAt) - new Date(t.createdAt)) + "</span>" : "") + "</div>";
    return '<div class="task' + (done ? " is-done" : "") + (t.subdivision === "prioridade" ? " prio" : "") + '"><div class="task-top"><input type="checkbox" class="task-check" data-toggle="' + t.id + '" aria-label="Concluir"' + (done ? " checked" : "") + '><div class="task-main"><div class="task-title-row"><button class="task-title" data-open="' + t.id + '">' + esc(t.title) + "</button>" +
      (cl.length ? '<span class="pill">' + feitos + "/" + cl.length + "</span>" : "") + '</div><div class="task-badges">' + badges.join("") + "</div>" + body + meta + "</div></div></div>";
  }
  function render() {
    var all = tarefas(T.state.pessoaId), todo = all.filter(function (t) { return t.status !== "done"; }), done = all.filter(function (t) { return t.status === "done"; });
    var hoje = ymd(new Date()), atras = todo.filter(function (t) { return t.dueDate && t.dueDate < hoje; }).length;
    $("task-meta").innerHTML = '<b class="num">' + todo.length + "</b> em aberto" + (atras ? ' · <b class="num" style="color:var(--danger)">' + atras + "</b> atrasadas" : "");
    var comp = sortTasks(todo.filter(function (t) { return t.subdivision === "compromisso"; }), true);
    $("list-compromisso").innerHTML = comp.length ? comp.map(taskCard).join("") : '<div class="empty">Nenhum compromisso.</div>';
    $("cnt-comp").textContent = comp.length || "";
    var n = 0;
    ["prioridade", "demanda", "tarefa"].forEach(function (g) {
      var L = sortTasks(todo.filter(function (t) { return t.subdivision === g; }), false); n += L.length;
      $("list-" + g).innerHTML = L.length ? L.map(taskCard).join("") : '<div class="empty">Nada por aqui.</div>';
      $("cnt-" + g).textContent = L.length ? "· " + L.length : "";
    });
    $("cnt-todo").textContent = n || "";
    var D = done.slice().sort(function (a, b) { return (b.completedAt || "") < (a.completedAt || "") ? -1 : 1; });
    $("list-done").innerHTML = D.length ? D.map(taskCard).join("") : '<div class="empty">Nenhuma tarefa concluída.</div>';
    $("cnt-done").textContent = D.length || "";
    var bc = $("btn-clear-done"); bc.hidden = !D.length;
    bc.textContent = S.confirmClear ? "Confirmar: excluir " + D.length + " concluídas" : "Limpar concluídas";
    bc.classList.toggle("confirm", S.confirmClear);
    var inl = document.querySelector("[data-inline]"); if (inl) inl.focus();
  }

  // Agenda Google: compromissos com data viram eventos. Excluir aqui não apaga o evento.
  function localDT(dateStr, timeStr, plus) {
    var p = dateStr.split("-").map(Number), h = (timeStr || "09:00").split(":").map(Number);
    var d = new Date(p[0], p[1] - 1, p[2], h[0], h[1], 0); d.setMinutes(d.getMinutes() + (plus || 0));
    return ymd(d) + "T" + T.hm(d) + ":00";
  }
  function syncAgenda(pid, t) {
    if (!T.mcp || !t || t.subdivision !== "compromisso" || !t.dueDate || t.status === "done") return;
    var p = T.pessoa(pid);
    var input = { summary: (p ? p.nome + " · " : "") + t.title, startTime: localDT(t.dueDate, t.dueTime, 0), endTime: localDT(t.dueDate, t.dueTime, t.durationMinutes || 60), timeZone: "America/Sao_Paulo", calendarId: CALENDAR_ID };
    if (t.description) input.description = t.description;
    if (t.reminderMinutes === -1) input.overrideReminders = [];
    else if (typeof t.reminderMinutes === "number" && t.reminderMinutes >= 0) input.overrideReminders = [{ method: "popup", minutes: t.reminderMinutes }];
    var tool = t.calendarEventId ? "update_event" : "create_event";
    if (t.calendarEventId) input.eventId = t.calendarEventId;
    else if (t.recurrence && REC_RRULE[t.recurrence]) input.recurrenceData = [REC_RRULE[t.recurrence]];
    T.mcp.callTool("Google Calendar", tool, input).then(function (res) {
      var pl = res && res.payload, nid = (pl && (pl.id || pl.eventId)) || t.calendarEventId;
      if (nid && nid !== t.calendarEventId) patch(pid, t.id, { calendarEventId: nid, calendarId: CALENDAR_ID }).catch(function () {});
    }).catch(function () { T.toast("Não foi possível sincronizar com a Agenda Google."); });
  }

  function init() {
    $("k-grupo").addEventListener("click", function (e) { var b = e.target.closest("[data-g]"); if (b) setGrupo(b.dataset.g); });
    $("btn-new-task").addEventListener("click", function () { openTask(null); });
    $("k-cancel").addEventListener("click", function () { $("task-panel").hidden = true; });
    $("task-form").addEventListener("submit", async function (e) {
      e.preventDefault();
      var title = $("k-title").value.trim(); if (!title) return;
      var g = S.grupo, pid = T.state.pessoaId, itens = T.clone(tarefas(pid)), oldChecks = {};
      if (S.editId) (T.byId(itens, S.editId).checklist || []).forEach(function (c) { oldChecks[c.text] = c.done; });
      var body = {
        title: title, description: $("k-desc").value.trim(), subdivision: g,
        checklist: $("k-check").value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean).map(function (x) { return { text: x, done: !!oldChecks[x] }; }),
        dueDate: $("k-date").value || null,
        dueTime: g === "compromisso" ? $("k-time").value || null : null,
        durationMinutes: g === "compromisso" ? +$("k-dur").value : null,
        reminderMinutes: g === "compromisso" ? remParse($("k-rem").value) : null
      };
      var t;
      if (S.editId) { t = T.byId(itens, S.editId); Object.assign(t, body); }
      else {
        t = Object.assign({ id: T.novoId(), status: "todo", createdAt: new Date().toISOString(), completedAt: null, calendarEventId: null, calendarId: null, recurrence: g === "compromisso" ? $("k-rec").value || null : null }, body);
        itens.push(t);
      }
      try { await save(pid, itens); $("task-panel").hidden = true; T.toast("Tarefa salva"); syncAgenda(pid, t); } catch (err) { T.showError(err); }
    });
    var view = $("view-tarefas");
    view.addEventListener("click", async function (e) {
      var pid = T.state.pessoaId, el;
      if ((el = e.target.closest("[data-open]"))) { S.open[el.dataset.open] = !S.open[el.dataset.open]; S.confirmId = null; render(); return; }
      if ((el = e.target.closest("[data-edit-field]"))) { S.inline = { id: el.dataset.id, field: el.dataset.editField }; render(); return; }
      if ((el = e.target.closest("[data-task-edit]"))) { openTask(T.byId(tarefas(pid), el.dataset.taskEdit)); return; }
      if ((el = e.target.closest("[data-task-del]"))) {
        var id = el.dataset.taskDel;
        if (S.confirmId !== id) { S.confirmId = id; render(); setTimeout(function () { if (S.confirmId === id) { S.confirmId = null; render(); } }, 4000); return; }
        S.confirmId = null;
        try { await save(pid, tarefas(pid).filter(function (t) { return t.id !== id; })); T.toast("Tarefa excluída"); } catch (err) { T.showError(err); }
        return;
      }
      if (e.target.id === "btn-clear-done") {
        if (!S.confirmClear) { S.confirmClear = true; render(); setTimeout(function () { S.confirmClear = false; render(); }, 4000); return; }
        S.confirmClear = false;
        try { await save(pid, tarefas(pid).filter(function (t) { return t.status !== "done"; })); T.toast("Concluídas removidas"); } catch (err) { T.showError(err); }
      }
    });
    view.addEventListener("change", async function (e) {
      var pid = T.state.pessoaId, el = e.target;
      try {
        if (el.dataset.toggle) { var d = el.checked; await patch(pid, el.dataset.toggle, { status: d ? "done" : "todo", completedAt: d ? new Date().toISOString() : null }); }
        else if (el.dataset.check) { var itens = T.clone(tarefas(pid)), t = T.byId(itens, el.dataset.check); t.checklist[+el.dataset.i].done = el.checked; await save(pid, itens); }
        else if (el.dataset.inline) {
          var f = el.dataset.inline, v = el.value, p = {};
          p[f] = f === "durationMinutes" ? +v : f === "reminderMinutes" ? remParse(v) : v || null;
          S.inline = null;
          var nt = await patch(pid, el.dataset.id, p); if (nt) syncAgenda(pid, nt);
        }
      } catch (err) { T.showError(err); }
    });
    view.addEventListener("focusout", function (e) {
      if (e.target.dataset && e.target.dataset.inline) setTimeout(function () { if (S.inline && !document.querySelector("[data-inline]:focus")) { S.inline = null; render(); } }, 150);
    });
  }

  T.register({
    id: "tarefas", label: "Tarefas", area: "pessoa", html: html, init: init, render: render,
    connect: function (db) { db.collection("tarefas").onSnapshot(function (s) { S.docs = T.arrDocs(s); T.scheduleRender(); }, T.onErr); },
    homeStats: function (pid) {
      var hoje = ymd(new Date()), todo = tarefas(pid).filter(function (t) { return t.status !== "done"; });
      var atr = todo.filter(function (t) { return t.dueDate && t.dueDate < hoje; }).length;
      return [{ label: "Tarefas a fazer", value: String(todo.length) }, { label: "Atrasadas", value: String(atr), alert: atr > 0 }];
    }
  });
})();
