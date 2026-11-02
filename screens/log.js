/* ===== SCREEN: log ===== */
// #/log (one-tap log + history) and #/log/<id> ("Your logged headache" card + "Add details" form).
// Reads and writes state only through Store; navigates only through go().

var log_METHOD_LABELS = { heat: "Heat", cool: "Cooling", pressure: "Pressure" };
var log_ANSWERS = [
  { id: "helped", label: "Helped" },
  { id: "no", label: "Didn't help" },
  { id: "unsure", label: "Not sure" }
];
var log_flash = null; // one-shot "Saved" message shown after a re-render

function renderLog(appEl, params) {
  var id = params && params.id ? params.id : null;
  if (id) log_renderEntry(appEl, id);
  else log_renderList(appEl);
}

function log_md() { return window.MOCK_DATA || {}; }

function log_label(list, id) {
  var arr = Array.isArray(list) ? list : [];
  for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i].label;
  return id;
}

function log_byNewest(a, b) {
  if (a.occurredAt === b.occurredAt) return a.id < b.id ? 1 : -1;
  return a.occurredAt < b.occurredAt ? 1 : -1;
}

function log_summary(e) {
  var md = log_md(), parts = [];
  if (e.activity) parts.push(log_label(md.activities, e.activity));
  (e.symptoms || []).forEach(function (s) { parts.push(log_label(md.symptoms, s)); });
  if (!parts.length) return "No details yet";
  if (parts.length > 3) return parts.slice(0, 3).join(" · ") + " · +" + (parts.length - 3) + " more";
  return parts.join(" · ");
}

function log_confirmDelete(id) {
  if (!window.confirm("Delete this entry?")) return;
  Store.deleteEntry(id);
  go("#/log");
}

function log_sampleNote(entries) {
  var hasSeed = entries.some(function (e) { return /^seed_/.test(e.id); });
  return hasSeed ? '<p class="note log-sample">Includes sample entries for testing.</p>' : "";
}

/* ---------- #/log ---------- */
function log_renderList(appEl) {
  var entries = Store.state().entries.slice().sort(log_byNewest);
  var html = '<div class="screen-log">' +
    '<section class="card log-quick">' +
      "<h2>Log a headache</h2>" +
      '<label class="log-switch" for="log-only">' +
        '<input type="checkbox" id="log-only" checked>' +
        '<span class="log-switch-track" aria-hidden="true"></span>' +
        "<span>Log only — I didn't use the cap</span>" +
      "</label>" +
      '<button type="button" class="btn btn-block log-big" id="log-occurred">A headache occurred</button>' +
      '<p class="note">One tap is enough. You can add details next if you like.</p>' +
      '<p class="error" id="log-quick-error" role="alert" hidden></p>' +
    "</section>" +
    '<section class="log-history" aria-labelledby="log-history-title">' +
      '<h2 id="log-history-title">History</h2>' +
      log_sampleNote(entries);
  if (!entries.length) {
    html += '<p class="muted">No entries yet.</p>';
  } else {
    html += '<ul class="log-list">';
    entries.forEach(function (e) {
      html += '<li class="card log-item">' +
        '<div class="log-item-head">' +
          '<span class="log-item-when">' + esc(fmtDate(e.occurredAt)) + " · " + esc(fmtTime(e.occurredAt)) + "</span>" +
          (e.pain !== null ? '<span class="log-pain">Pain ' + esc(e.pain) + "/10</span>" : "") +
        "</div>" +
        '<p class="log-item-summary">' + esc(log_summary(e)) + "</p>" +
        '<div class="log-item-foot">' +
          '<span class="log-tag' + (e.session ? " log-tag-cap" : "") + '">' + (e.session ? "Cap session" : "Log only") + "</span>" +
          '<span class="btn-row">' +
            '<button type="button" class="btn btn-secondary" data-edit="' + esc(e.id) + '">Edit</button>' +
            '<button type="button" class="btn btn-danger" data-del="' + esc(e.id) + '">Delete</button>' +
          "</span>" +
        "</div>" +
      "</li>";
    });
    html += "</ul>";
  }
  html += "</section></div>";
  appEl.innerHTML = html;

  appEl.querySelector("#log-occurred").addEventListener("click", function () {
    var saved = Store.saveEntry({
      occurredAt: nowLocal(),
      logOnly: appEl.querySelector("#log-only").checked,
      session: null,
      feedback: null,
      pain: null,
      symptoms: [],
      activity: null,
      screenTimeHours: null,
      waterGlasses: null,
      caffeineDrinks: null
    });
    if (!saved) {
      var err = appEl.querySelector("#log-quick-error");
      err.textContent = "That entry couldn't be saved. Please try again.";
      err.hidden = false;
      return;
    }
    go("#/log/" + saved.id);
  });

  var list = appEl.querySelector(".log-list");
  if (list) {
    list.addEventListener("click", function (ev) {
      var t = ev.target.closest("button");
      if (!t) return;
      if (t.hasAttribute("data-edit")) go("#/log/" + t.getAttribute("data-edit"));
      else if (t.hasAttribute("data-del")) log_confirmDelete(t.getAttribute("data-del"));
    });
  }
}

/* ---------- #/log/<id> ---------- */
function log_cardLines(e) {
  var lines = [];
  try {
    if (typeof describeEntry === "function") lines = describeEntry(e, log_md()) || [];
  } catch (err) { lines = []; }
  if (!lines.length) lines = ["Started " + fmtDate(e.occurredAt) + " at " + fmtTime(e.occurredAt) + "."];
  return lines;
}

function log_sessionText(s) {
  var md = log_md();
  return s.zones.map(function (z) {
    var parts = [];
    if (z.thermal === "heat") parts.push("heat");
    if (z.thermal === "cool") parts.push("cooling");
    if (z.pressure) parts.push("pressure");
    return log_label(md.zones, z.zone) + ", " + log_label(md.sides, z.side).toLowerCase() + ": " + parts.join(" + ");
  });
}

function log_renderEntry(appEl, id) {
  var e = Store.getEntry(id);
  if (!e) { go("#/log"); return; }
  var md = log_md();
  var date = e.occurredAt.slice(0, 10), time = e.occurredAt.slice(11, 16);
  var flash = log_flash === id;
  log_flash = null;

  var html = '<div class="screen-log">' +
    '<button type="button" class="link-btn log-back" id="log-back">← Back to log</button>' +
    '<section class="card log-card" aria-labelledby="log-card-title">' +
      '<h2 id="log-card-title">Your logged headache</h2>' +
      '<ul class="log-lines">' + log_cardLines(e).map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ul>" +
      (flash ? '<p class="log-saved" role="status">Saved</p>' : "") +
    "</section>" +
    '<form class="card log-form" id="log-form" novalidate>' +
      "<h2>Add details</h2>" +
      '<p class="note">Every field is optional.</p>' +
      '<fieldset class="log-group"><legend>When it started</legend>' +
        '<div class="log-two">' +
          '<div><label for="log-date">Date</label><input type="date" id="log-date" value="' + esc(date) + '"></div>' +
          '<div><label for="log-time">Time</label><input type="time" id="log-time" value="' + esc(time) + '"></div>' +
        "</div>" +
        '<p class="error" data-err="when" hidden></p>' +
      "</fieldset>" +
      '<div class="field">' +
        '<label class="log-switch" for="log-form-only">' +
          '<input type="checkbox" id="log-form-only"' + (e.logOnly ? " checked" : "") + ">" +
          '<span class="log-switch-track" aria-hidden="true"></span>' +
          "<span>Log only — I didn't use the cap</span>" +
        "</label>" +
        '<p class="error" data-err="logOnly" hidden></p>' +
      "</div>" +
      '<fieldset class="log-group"><legend>Pain (0–10)</legend>' +
        '<div class="log-pain-row" role="radiogroup" aria-label="Pain">';
  for (var p = 0; p <= 10; p++) {
    html += '<button type="button" class="log-chip" data-pain="' + p + '" aria-pressed="' + (e.pain === p) + '">' + p + "</button>";
  }
  html += '<button type="button" class="log-chip log-chip-wide" data-pain="" aria-pressed="' + (e.pain === null) + '">Not set</button>' +
        "</div>" +
      "</fieldset>" +
      '<fieldset class="log-group"><legend>Symptoms</legend>';
  (md.symptoms || []).forEach(function (s) {
    html += '<label class="log-check"><input type="checkbox" name="symptom" value="' + esc(s.id) + '"' +
      (e.symptoms.indexOf(s.id) !== -1 ? " checked" : "") + "> <span>" + esc(s.label) +
      (s.hint ? '<span class="log-check-hint">' + esc(s.hint) + "</span>" : "") + "</span></label>";
  });
  html += "</fieldset>" +
      '<div class="field"><label for="log-activity">Activity</label><select id="log-activity">' +
        '<option value="">Not set</option>';
  (md.activities || []).forEach(function (a) {
    html += '<option value="' + esc(a.id) + '"' + (e.activity === a.id ? " selected" : "") + ">" + esc(a.label) + "</option>";
  });
  html += "</select></div>" +
      log_numField("log-screen", "Screen time (hours)", e.screenTimeHours, 0, 24, 0.5, "screen") +
      log_numField("log-water", "Glasses of water", e.waterGlasses, 0, 30, 1, "water") +
      log_numField("log-caffeine", "Caffeinated drinks", e.caffeineDrinks, 0, 20, 1, "caffeine");

  if (e.feedback) {
    var used = Store.methodsUsed(e.session);
    html += '<fieldset class="log-group"><legend>Cap feedback</legend>';
    used.forEach(function (m) {
      var cur = e.feedback.methods[m] || "";
      html += '<div class="field"><label for="log-fb-' + esc(m) + '">' + esc(log_METHOD_LABELS[m] || m) + "</label>" +
        '<select id="log-fb-' + esc(m) + '" data-method="' + esc(m) + '"><option value="">Not set</option>';
      log_ANSWERS.forEach(function (a) {
        html += '<option value="' + a.id + '"' + (cur === a.id ? " selected" : "") + ">" + esc(a.label) + "</option>";
      });
      html += "</select></div>";
    });
    html += '<div class="field"><label for="log-duration">How long it lasted</label><select id="log-duration"><option value="">Not set</option>';
    (md.durationRanges || []).forEach(function (d) {
      html += '<option value="' + esc(d.id) + '"' + (e.feedback.duration === d.id ? " selected" : "") + ">" + esc(d.label) + "</option>";
    });
    html += "</select></div></fieldset>";
  }

  if (e.session) {
    var s = e.session;
    html += '<div class="log-group log-session"><p class="log-legend">Cap session (not editable)</p>' +
      '<p class="muted">' + esc(fmtTime(s.startedAt)) + " – " + esc(fmtTime(s.endedAt)) +
      (s.timerMinutes !== null ? " · " + esc(s.timerMinutes) + " min timer" : " · no timer") + "</p>" +
      '<ul class="log-lines">' + log_sessionText(s).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></div>";
  }

  html += '<p class="error" id="log-form-error" role="alert" hidden></p>' +
      '<div class="btn-row log-actions">' +
        '<button type="submit" class="btn">Save</button>' +
        '<button type="button" class="btn btn-danger" id="log-delete">Delete</button>' +
      "</div>" +
    "</form></div>";
  appEl.innerHTML = html;

  var form = appEl.querySelector("#log-form");
  var painVal = e.pain;
  appEl.querySelector("#log-back").addEventListener("click", function () { go("#/log"); });
  appEl.querySelector("#log-delete").addEventListener("click", function () { log_confirmDelete(id); });
  appEl.querySelector(".log-pain-row").addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-pain]");
    if (!b) return;
    var v = b.getAttribute("data-pain");
    painVal = v === "" ? null : Number(v);
    var all = this.querySelectorAll("button[data-pain]");
    for (var i = 0; i < all.length; i++) all[i].setAttribute("aria-pressed", String(all[i] === b));
  });

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var errs = form.querySelectorAll("[data-err]");
    for (var i = 0; i < errs.length; i++) { errs[i].hidden = true; errs[i].textContent = ""; }
    var formErr = form.querySelector("#log-form-error");
    formErr.hidden = true;
    var bad = false;
    function fail(key, msg) {
      var el = form.querySelector('[data-err="' + key + '"]');
      el.textContent = msg;
      el.hidden = false;
      bad = true;
    }

    var d = form.querySelector("#log-date").value, t = form.querySelector("#log-time").value;
    var occurredAt = d + "T" + t + ":00";
    if (!d || !t || !parseLocal(occurredAt)) fail("when", "Enter a date and a time.");

    var logOnly = form.querySelector("#log-form-only").checked;
    if (logOnly && (e.session || e.feedback)) fail("logOnly", "This entry has a cap session, so it can't be marked log only.");

    var screen = log_readNum(form, "#log-screen", 0, 24, 0.5);
    if (screen === undefined) fail("screen", "Enter hours from 0 to 24, in steps of 0.5.");
    var water = log_readNum(form, "#log-water", 0, 30, 1);
    if (water === undefined) fail("water", "Enter a whole number from 0 to 30.");
    var caffeine = log_readNum(form, "#log-caffeine", 0, 20, 1);
    if (caffeine === undefined) fail("caffeine", "Enter a whole number from 0 to 20.");
    if (bad) return;

    var symptoms = [];
    var boxes = form.querySelectorAll('input[name="symptom"]');
    for (var j = 0; j < boxes.length; j++) if (boxes[j].checked) symptoms.push(boxes[j].value);
    var activity = form.querySelector("#log-activity").value || null;

    var feedback = e.feedback;
    if (feedback) {
      var methods = {};
      var sels = form.querySelectorAll("select[data-method]");
      for (var k = 0; k < sels.length; k++) if (sels[k].value) methods[sels[k].getAttribute("data-method")] = sels[k].value;
      feedback = { methods: methods, duration: form.querySelector("#log-duration").value || null };
    }

    var next = {
      id: e.id, createdAt: e.createdAt, occurredAt: occurredAt, logOnly: logOnly,
      session: e.session, feedback: feedback, pain: painVal, symptoms: symptoms, activity: activity,
      screenTimeHours: screen, waterGlasses: water, caffeineDrinks: caffeine
    };
    var saved = Store.saveEntry(next);
    if (!saved) {
      formErr.textContent = "Some details couldn't be saved. Please check the values and try again.";
      formErr.hidden = false;
      return;
    }
    log_flash = id;
    log_renderEntry(appEl, id);
  });
}

function log_numField(inputId, label, value, min, max, step, key) {
  return '<div class="field"><label for="' + inputId + '">' + esc(label) + "</label>" +
    '<input type="number" id="' + inputId + '" inputmode="decimal" min="' + min + '" max="' + max + '" step="' + step + '" value="' +
    (value === null ? "" : esc(value)) + '">' +
    '<p class="error" data-err="' + key + '" hidden></p></div>';
}

// Returns null when empty, the number when valid, undefined when invalid.
function log_readNum(form, sel, min, max, step) {
  var el = form.querySelector(sel);
  var raw = el.value.trim();
  if (raw === "") return (el.validity && el.validity.badInput) ? undefined : null;
  var n = Number(raw);
  if (!isFinite(n) || n < min || n > max) return undefined;
  if (Math.round(n / step) * step !== n) return undefined;
  return n;
}
