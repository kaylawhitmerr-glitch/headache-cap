/* ===== SCREEN: share ===== */
// Printable doctor page (Claude.md section 4.6). Built only when the user opens it; nothing leaves the device.
function renderShare(appEl, params) {
  var md = window.MOCK_DATA;
  var entries = Store.state().entries.slice();
  entries.sort(function (a, b) {
    return a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0;
  });

  var inputs = share_chartInputs(entries, md);
  var html = '<section class="screen-share">' +
    '<div class="share-head">' +
      '<h2 class="share-title">Headache log shared by the user</h2>';
  if (entries.length) {
    html += '<p class="share-meta">' + esc(fmtDate(entries[entries.length - 1].occurredAt)) +
      ' – ' + esc(fmtDate(entries[0].occurredAt)) + '</p>';
  }
  html += '<p class="share-meta">' + esc(entries.length) + (entries.length === 1 ? ' entry' : ' entries') + '</p>' +
      '<button type="button" class="btn share-print">Print</button>' +
    '</div>';

  if (entries.length) {
    html += '<div class="share-charts">' +
      '<figure class="share-chart card" data-chart="weeks">' +
        '<figcaption class="share-chart-title">' + esc(inputs.weeks.title) + '</figcaption>' +
        barChart(inputs.weeks) + '</figure>' +
      '<figure class="share-chart card" data-chart="pain">' +
        '<figcaption class="share-chart-title">' + esc(inputs.pain.title) + '</figcaption>' +
        (inputs.pain.points.length ? dotChart(inputs.pain) : '<p class="muted">No pain values logged yet.</p>') +
      '</figure>' +
      '<figure class="share-chart card" data-chart="relief">' +
        '<figcaption class="share-chart-title">Relief by setting</figcaption>' +
        (inputs.relief ? '<p class="muted share-chart-note">Share of rated sessions marked helped</p>' + barChart(inputs.relief) :
          '<p class="muted share-relief-empty">' + esc(inputs.reliefEmpty) + '</p>') +
      '</figure>' +
    '</div>';
    html += '<h3 class="share-subtitle">All entries, newest first</h3>' +
      '<div class="share-table-wrap" role="region" aria-label="All entries" tabindex="0">' +
      share_tableHtml(entries, md) + '</div>';
  } else {
    html += '<p class="muted">No entries logged yet.</p>';
  }

  html += '<p class="share-foot">Personal log of observations. Not a diagnosis.</p></section>';
  appEl.innerHTML = html;

  var btn = appEl.querySelector(".share-print");
  if (btn) btn.addEventListener("click", function () { window.print(); });
}

// Chart inputs only; drawing is done by lib/charts.js.
function share_chartInputs(entries, md) {
  var out = { weeks: null, pain: null, relief: null, reliefEmpty: "" };

  // Headaches per week: every Monday week from earliest to latest, zeros included.
  var counts = {};
  var first = null, last = null;
  entries.forEach(function (e) {
    var w = weekStart(e.occurredAt);
    if (!w) return;
    counts[w] = (counts[w] || 0) + 1;
    if (first === null || w < first) first = w;
    if (last === null || w > last) last = w;
  });
  var labels = [], values = [];
  if (first) {
    var d = parseLocal(first + "T00:00:00");
    var guard = 0;
    while (guard++ < 1000) {
      var key = d.getFullYear() + "-" + share_pad(d.getMonth() + 1) + "-" + share_pad(d.getDate());
      if (key > last) break;
      labels.push(MONTHS[d.getMonth()] + " " + d.getDate());
      values.push(counts[key] || 0);
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7);
    }
  }
  out.weeks = { labels: labels, values: values, title: "Headaches per week (weeks start Monday)" };

  // Pain over time: one dot per entry with a pain value.
  var points = [];
  entries.forEach(function (e) {
    if (e.pain === null || e.pain === undefined) return;
    var dt = parseLocal(e.occurredAt);
    if (dt) points.push({ x: dt, y: e.pain });
  });
  points.sort(function (a, b) { return a.x - b.x; });
  out.pain = { points: points, yMax: 10, title: "Pain over time (0–10)" };

  // Relief by setting: same rows as the insight.
  var rows = reliefBySetting(entries, md) || [];
  if (rows.length) {
    out.relief = {
      labels: rows.map(function (r) {
        return share_label(md.zones, r.zone) + ": " + share_methodLabel(r.method);
      }),
      values: rows.map(function (r) { return r.rated ? r.helped / r.rated : 0; }),
      valueLabels: rows.map(function (r) { return r.helped + " of " + r.rated; }),
      max: 1,
      title: "Relief by setting (share of rated sessions marked helped)"
    };
  } else {
    out.reliefEmpty = "Rate a few cap sessions to see which settings you marked as helping.";
  }
  return out;
}

function share_tableHtml(entries, md) {
  var cols = ["Date", "Time", "Pain", "Symptoms", "Activity", "Cap settings", "Marked helped (methods)", "Duration"];
  var h = '<table class="share-table"><thead><tr>';
  cols.forEach(function (c) { h += '<th scope="col">' + esc(c) + '</th>'; });
  h += '</tr></thead><tbody>';
  entries.forEach(function (e) {
    var cells = [
      fmtDate(e.occurredAt),
      fmtTime(e.occurredAt),
      e.pain === null || e.pain === undefined ? "" : String(e.pain),
      (e.symptoms || []).map(function (s) { return share_label(md.symptoms, s); }).join(", "),
      e.activity ? share_label(md.activities, e.activity) : "",
      share_capText(e, md),
      share_helpedText(e),
      e.feedback && e.feedback.duration ? share_label(md.durationRanges, e.feedback.duration) : ""
    ];
    h += '<tr>';
    cells.forEach(function (v, i) {
      h += '<td data-label="' + esc(cols[i]) + '">' + esc(v === "" ? "—" : v) + '</td>';
    });
    h += '</tr>';
  });
  return h + '</tbody></table>';
}

function share_capText(e, md) {
  if (e.logOnly) return "Log only";
  if (!e.session || !e.session.zones) return "";
  return e.session.zones.map(function (z) {
    var parts = [];
    if (z.thermal === "heat") parts.push("heat");
    if (z.thermal === "cool") parts.push("cooling");
    if (z.pressure) parts.push("pressure");
    return share_label(md.zones, z.zone) + ", " + share_label(md.sides, z.side).toLowerCase() + ": " + parts.join(" + ");
  }).join("; ");
}

function share_helpedText(e) {
  if (!e.feedback || !e.feedback.methods) return "";
  var m = e.feedback.methods;
  return ["heat", "cool", "pressure"].filter(function (k) { return m[k] === "helped"; })
    .map(share_methodLabel).join(", ");
}

function share_methodLabel(m) {
  return m === "heat" ? "Heat" : m === "cool" ? "Cooling" : m === "pressure" ? "Pressure" : String(m);
}

function share_label(list, id) {
  for (var i = 0; i < (list || []).length; i++) if (list[i].id === id) return list[i].label;
  return String(id);
}

function share_pad(n) { return n < 10 ? "0" + n : String(n); }
