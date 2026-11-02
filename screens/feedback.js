/* ===== SCREEN: feedback ===== */
function renderFeedback(appEl, params) {
  var md = window.MOCK_DATA;
  var pending = Store.pendingSession();
  if (!pending) { go("#/cap"); return; }

  var QUESTIONS = { heat: "Did heat help?", cool: "Did cooling help?", pressure: "Did pressure help?" };
  var CHOICES = [
    { id: "helped", label: "Helped" },
    { id: "no", label: "Didn't help" },
    { id: "unsure", label: "Not sure" }
  ];
  var THERMAL = { heat: "heat", cool: "cooling" };

  var methods = Store.methodsUsed(pending);
  var answers = {};
  var duration = null;

  function labelOf(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].label;
    return id;
  }

  function zoneText(z) {
    var parts = [];
    if (z.thermal !== "off") parts.push(THERMAL[z.thermal] || z.thermal);
    if (z.pressure) parts.push("pressure");
    return labelOf(md.zones, z.zone) + ", " + labelOf(md.sides, z.side).toLowerCase() + ": " + parts.join(" + ");
  }

  function lengthText() {
    var a = parseLocal(pending.startedAt), b = parseLocal(pending.endedAt);
    if (!a || !b) return "";
    var mins = Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
    if (mins < 1) return "Under 1 min";
    if (mins < 60) return mins + " min";
    var h = Math.floor(mins / 60), m = mins % 60;
    return h + " h" + (m ? " " + m + " min" : "");
  }

  function choiceGroup(name, options, current, legend) {
    var html = '<fieldset class="fb-group"><legend>' + esc(legend) + '</legend><div class="fb-choices">';
    options.forEach(function (o) {
      var on = current === o.id;
      html += '<button type="button" class="fb-choice' + (on ? ' is-on' : '') + '" aria-pressed="' + (on ? 'true' : 'false') +
        '" data-group="' + esc(name) + '" data-value="' + esc(o.id) + '">' + esc(o.label) + '</button>';
    });
    return html + '</div></fieldset>';
  }

  var zonesHtml = pending.zones.map(function (z) { return '<li>' + esc(zoneText(z)) + '</li>'; }).join("");
  var sameDay = fmtDate(pending.startedAt) === fmtDate(pending.endedAt);

  var html = '<div class="screen-feedback">' +
    '<h2>How did that session go?</h2>' +
    '<section class="card fb-summary">' +
      '<h3>Your session</h3>' +
      '<ul class="fb-zones">' + zonesHtml + '</ul>' +
      '<dl class="fb-times">' +
        '<div><dt>Started</dt><dd>' + esc(fmtDate(pending.startedAt) + ", " + fmtTime(pending.startedAt)) + '</dd></div>' +
        '<div><dt>Ended</dt><dd>' + esc((sameDay ? "" : fmtDate(pending.endedAt) + ", ") + fmtTime(pending.endedAt)) + '</dd></div>' +
        '<div><dt>Length</dt><dd>' + esc(lengthText()) + '</dd></div>' +
      '</dl>' +
    '</section>' +
    '<section class="card">' +
      '<p class="muted">Every question is optional. Tap again to clear an answer.</p>';
  methods.forEach(function (m) {
    html += choiceGroup("m_" + m, CHOICES, null, QUESTIONS[m] || m);
  });
  html += choiceGroup("duration", md.durationRanges, null, "How long did the headache last?") +
    '</section>' +
    '<p class="error" id="fb-error" role="alert" hidden></p>' +
    '<div class="fb-actions">' +
      '<button type="button" class="btn btn-block" id="fb-save">Save</button>' +
      '<button type="button" class="btn btn-danger btn-block" id="fb-discard">Discard session</button>' +
    '</div>' +
  '</div>';
  appEl.innerHTML = html;

  appEl.querySelectorAll(".fb-choice").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var group = btn.getAttribute("data-group");
      var value = btn.getAttribute("data-value");
      var current = group === "duration" ? duration : answers[group.slice(2)];
      var next = current === value ? null : value;
      if (group === "duration") duration = next;
      else if (next === null) delete answers[group.slice(2)];
      else answers[group.slice(2)] = next;
      appEl.querySelectorAll('.fb-choice[data-group="' + group + '"]').forEach(function (b) {
        var on = b.getAttribute("data-value") === next;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    });
  });

  appEl.querySelector("#fb-save").addEventListener("click", function () {
    var p = Store.pendingSession();
    if (!p) { go("#/cap"); return; }
    var m = {};
    Store.methodsUsed(p).forEach(function (k) { if (answers[k]) m[k] = answers[k]; });
    var saved = Store.saveEntry({
      occurredAt: p.startedAt,
      logOnly: false,
      session: { startedAt: p.startedAt, endedAt: p.endedAt, timerMinutes: p.timerMinutes, zones: p.zones },
      feedback: { methods: m, duration: duration },
      pain: null,
      symptoms: [],
      activity: null,
      screenTimeHours: null,
      waterGlasses: null,
      caffeineDrinks: null
    });
    if (!saved) {
      var err = appEl.querySelector("#fb-error");
      err.textContent = "Sorry, this session couldn't be saved. Please try again.";
      err.hidden = false;
      return;
    }
    Store.discardPending();
    go("#/log/" + saved.id);
  });

  appEl.querySelector("#fb-discard").addEventListener("click", function () {
    if (!confirm("Discard this session? It won't be logged.")) return;
    Store.discardPending();
    go("#/cap");
  });
}
