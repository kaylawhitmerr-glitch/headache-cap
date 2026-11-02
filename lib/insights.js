/* ===== INSIGHTS ===== */
/* Pure, rule-based observations of the user's own logs (Claude.md section 4.5).
   No DOM, no storage, no Store calls. Self-contained: does not depend on UTIL. */

var insights_BUCKETS = [
  { id: "morning", phrase: "in the morning" },
  { id: "afternoon", phrase: "in the afternoon" },
  { id: "evening", phrase: "in the evening" },
  { id: "night", phrase: "at night" }
];
var insights_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
var insights_MONTHS = ["January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December"];
var insights_METHODS = [
  { id: "heat", label: "Heat" },
  { id: "cool", label: "Cooling" },
  { id: "pressure", label: "Pressure" }
];

/* "YYYY-MM-DDTHH:MM(:SS)" -> {y, mo, d, h, mi} or null */
function insights_parts(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(s || ""));
  if (!m) return null;
  return { y: +m[1], mo: +m[2], d: +m[3], h: +m[4], mi: +m[5] };
}

function insights_bucket(s) {
  var p = insights_parts(s);
  if (!p) return null;
  if (p.h >= 5 && p.h < 12) return "morning";
  if (p.h >= 12 && p.h < 17) return "afternoon";
  if (p.h >= 17 && p.h < 22) return "evening";
  return "night";
}

/* 0 = Monday .. 6 = Sunday */
function insights_weekday(s) {
  var p = insights_parts(s);
  if (!p) return null;
  var js = new Date(p.y, p.mo - 1, p.d).getDay();
  return (js + 6) % 7;
}

function insights_label(list, id) {
  for (var i = 0; i < (list || []).length; i++) if (list[i].id === id) return list[i].label;
  return String(id);
}

function insights_lower(label) {
  return String(label).toLowerCase();
}

function insights_sentence(count, total, rest) {
  return count + " of your " + total + " logged headaches " + rest + ".";
}

/* Pick the first id (in list order) with the highest count. */
function insights_mostCommon(ids, counts) {
  var best = null, bestN = 0;
  for (var i = 0; i < ids.length; i++) {
    var n = counts[ids[i]] || 0;
    if (n > bestN) { best = ids[i]; bestN = n; }
  }
  return best === null ? null : { id: best, count: bestN };
}

function insights_isNum(v) {
  return typeof v === "number" && isFinite(v);
}

function patternInsights(entries, md) {
  entries = entries || [];
  var th = (md && md.thresholds) || {};
  var min = th.minOccurrences;
  var total = entries.length;
  var out = [];
  function add(ruleId, count, rest) {
    if (count > 0 && count >= min) {
      out.push({ ruleId: ruleId, count: count, total: total, text: insights_sentence(count, total, rest) });
    }
  }

  // time_of_day
  var bc = {};
  entries.forEach(function (e) { var b = insights_bucket(e.occurredAt); if (b) bc[b] = (bc[b] || 0) + 1; });
  var bIds = insights_BUCKETS.map(function (b) { return b.id; });
  var tb = insights_mostCommon(bIds, bc);
  if (tb) add("time_of_day", tb.count, "started " + insights_BUCKETS[bIds.indexOf(tb.id)].phrase);

  // weekday
  var dc = {};
  entries.forEach(function (e) { var d = insights_weekday(e.occurredAt); if (d !== null) dc[d] = (dc[d] || 0) + 1; });
  var td = insights_mostCommon([0, 1, 2, 3, 4, 5, 6], dc);
  if (td) add("weekday", td.count, "started on a " + insights_DAYS[td.id]);

  // activity (never "other")
  var ac = {};
  entries.forEach(function (e) { if (e.activity) ac[e.activity] = (ac[e.activity] || 0) + 1; });
  var aIds = (md.activities || []).map(function (a) { return a.id; })
    .filter(function (id) { return id !== "other"; });
  var ta = insights_mostCommon(aIds, ac);
  if (ta) add("activity", ta.count, "happened during " + insights_lower(insights_label(md.activities, ta.id)));

  // symptom
  var sc = {};
  entries.forEach(function (e) {
    var seen = {};
    (e.symptoms || []).forEach(function (s) { if (!seen[s]) { seen[s] = 1; sc[s] = (sc[s] || 0) + 1; } });
  });
  var sIds = (md.symptoms || []).map(function (s) { return s.id; });
  var ts = insights_mostCommon(sIds, sc);
  if (ts) add("symptom", ts.count, "included " + insights_lower(insights_label(md.symptoms, ts.id)));

  // thresholds
  var hs = 0, lw = 0, hc = 0;
  entries.forEach(function (e) {
    if (insights_isNum(e.screenTimeHours) && e.screenTimeHours >= th.highScreenHours) hs++;
    if (insights_isNum(e.waterGlasses) && e.waterGlasses <= th.lowWaterGlasses) lw++;
    if (insights_isNum(e.caffeineDrinks) && e.caffeineDrinks >= th.highCaffeineDrinks) hc++;
  });
  add("high_screen", hs, "came on days with " + th.highScreenHours + "+ hours of screen time");
  add("low_water", lw, "came on days with " + th.lowWaterGlasses + " or fewer glasses of water");
  add("high_caffeine", hc, "came on days with " + th.highCaffeineDrinks + "+ caffeinated drinks");

  return out;
}

/* "Heat on the temples" / "Heat above the ears" */
function insights_settingName(methodLabel, zoneLabel) {
  var z = insights_lower(zoneLabel);
  if (/^(above|behind|under|around|on|over|near)\b/.test(z)) return methodLabel + " " + z;
  if (!/^the\b/.test(z)) z = "the " + z;
  return methodLabel + " on " + z;
}

function insights_usesMethod(zoneItem, method) {
  if (method === "heat") return zoneItem.thermal === "heat";
  if (method === "cool") return zoneItem.thermal === "cool";
  if (method === "pressure") return zoneItem.pressure === true;
  return false;
}

function reliefBySetting(entries, md) {
  entries = entries || [];
  var min = ((md && md.thresholds) || {}).minOccurrences;
  var zones = (md && md.zones) || [];
  var tally = {};
  entries.forEach(function (e) {
    if (!e || !e.session || !e.feedback || !e.feedback.methods) return;
    var methods = e.feedback.methods;
    insights_METHODS.forEach(function (m) {
      var ans = methods[m.id];
      if (ans !== "helped" && ans !== "no" && ans !== "unsure") return;
      var seen = {};
      (e.session.zones || []).forEach(function (z) {
        if (!z || seen[z.zone] || !insights_usesMethod(z, m.id)) return;
        seen[z.zone] = 1;
        var key = z.zone + "|" + m.id;
        if (!tally[key]) tally[key] = { zone: z.zone, method: m.id, helped: 0, rated: 0 };
        tally[key].rated++;
        if (ans === "helped") tally[key].helped++;
      });
    });
  });

  var rows = [];
  zones.forEach(function (z, zi) {
    insights_METHODS.forEach(function (m, mi) {
      var t = tally[z.id + "|" + m.id];
      if (!t) return;
      var name = insights_settingName(m.label, z.label);
      rows.push({
        zone: t.zone, method: t.method, helped: t.helped, rated: t.rated,
        label: name,
        text: name + ": you marked it helped in " + t.helped + " of " + t.rated + " rated sessions.",
        _z: zi, _m: mi
      });
    });
  });
  rows.sort(function (a, b) { return (b.rated - a.rated) || (a._z - b._z) || (a._m - b._m); });
  rows.forEach(function (r) { delete r._z; delete r._m; });

  var shown = rows.filter(function (r) { return r.rated >= min; });
  shown.all = rows.filter(function (r) { return r.rated >= 1; });
  return shown;
}

function visibleSuggestions(patterns, md) {
  var showing = {};
  (patterns || []).forEach(function (p) { showing[p.ruleId] = true; });
  return ((md && md.suggestions) || [])
    .filter(function (s) { return showing[s.ruleId]; })
    .map(function (s) { return { id: s.id, ruleId: s.ruleId, text: s.text }; });
}

function insights_clock(p) {
  var h = p.h % 12 === 0 ? 12 : p.h % 12;
  return h + ":" + (p.mi < 10 ? "0" : "") + p.mi + (p.h < 12 ? " am" : " pm");
}

function insights_when(s) {
  var p = insights_parts(s);
  if (!p) return null;
  return insights_DAYS[insights_weekday(s)] + ", " + p.d + " " + insights_MONTHS[p.mo - 1] + " " + p.y +
    " at " + insights_clock(p);
}

function insights_answer(ans) {
  if (ans === "helped") return "you marked it helped";
  if (ans === "no") return "you marked it didn't help";
  if (ans === "unsure") return "you marked not sure";
  return null;
}

function describeEntry(entry, md) {
  var lines = [];
  if (!entry) return lines;
  md = md || {};
  var when = insights_when(entry.occurredAt);
  if (when) lines.push("Started " + when + ".");
  if (insights_isNum(entry.pain)) lines.push("Pain: " + entry.pain + " out of 10.");
  if (entry.symptoms && entry.symptoms.length) {
    lines.push("Symptoms: " + entry.symptoms.map(function (s) { return insights_label(md.symptoms, s); }).join(", ") + ".");
  }
  if (entry.activity) lines.push("Activity: " + insights_label(md.activities, entry.activity) + ".");
  if (insights_isNum(entry.screenTimeHours)) {
    lines.push("Screen time that day: " + entry.screenTimeHours + (entry.screenTimeHours === 1 ? " hour." : " hours."));
  }
  if (insights_isNum(entry.waterGlasses)) {
    lines.push("Water that day: " + entry.waterGlasses + (entry.waterGlasses === 1 ? " glass." : " glasses."));
  }
  if (insights_isNum(entry.caffeineDrinks)) {
    lines.push("Caffeinated drinks that day: " + entry.caffeineDrinks + ".");
  }

  if (entry.logOnly) {
    lines.push("Log only: you didn't use the cap.");
  } else if (!entry.session) {
    lines.push("You used the cap; no session was recorded in the app.");
  }

  var s = entry.session;
  if (s) {
    var a = insights_parts(s.startedAt), b = insights_parts(s.endedAt);
    var head = "Cap session";
    if (a && b) head += " from " + insights_clock(a) + " to " + insights_clock(b);
    else if (a) head += " from " + insights_clock(a);
    head += s.timerMinutes ? ", " + s.timerMinutes + "-minute timer." : ", no timer.";
    lines.push(head);
    (s.zones || []).forEach(function (z) {
      var parts = [];
      if (z.thermal === "heat") parts.push("heat");
      if (z.thermal === "cool") parts.push("cooling");
      if (z.pressure) parts.push("pressure");
      lines.push(insights_label(md.zones, z.zone) + ", " + insights_lower(insights_label(md.sides, z.side)) +
        ": " + (parts.length ? parts.join(" + ") : "off") + ".");
    });
  }

  var f = entry.feedback;
  if (f) {
    insights_METHODS.forEach(function (m) {
      var t = f.methods ? insights_answer(f.methods[m.id]) : null;
      if (t) lines.push(m.label + ": " + t + ".");
    });
    if (f.duration) lines.push("How long it lasted: " + insights_label(md.durationRanges, f.duration) + ".");
  }
  return lines;
}
