/* ===== CHARTS ===== */
// Builds SVG strings from given numbers. Pure: no DOM, no state reads.
// barChart({labels, values, title, max?, valueLabels?}) and dotChart({points, yMax, title}).

function charts_esc(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function charts_num(v) {
  var n = Number(v);
  return isFinite(n) ? n : 0;
}

function charts_r(n) {
  return Math.round(n * 10) / 10;
}

// Pick a tidy gridline step so there are about 4-5 lines from 0 to max.
function charts_step(max) {
  if (max <= 5) return 1;
  var raw = max / 5;
  var pow = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
  var f = raw / pow;
  var nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nice * pow;
}

function charts_open(w, h, title) {
  var t = charts_esc(title || "Chart");
  return '<svg class="chart" viewBox="0 0 ' + w + " " + h + '" width="100%" role="img" aria-label="' + t +
    '" preserveAspectRatio="xMidYMid meet" font-family="var(--font)">' +
    "<title>" + t + "</title>";
}

function charts_empty(title) {
  var w = 320, h = 120;
  return charts_open(w, h, title) +
    '<rect x="1" y="1" width="' + (w - 2) + '" height="' + (h - 2) + '" rx="8" fill="none" stroke="var(--border)"/>' +
    '<text x="' + w / 2 + '" y="' + (h / 2 + 5) + '" text-anchor="middle" font-size="14" fill="var(--muted)">No data yet</text>' +
    "</svg>";
}

// Wrap a label into at most maxLines lines of maxChars characters; ellipsis on overflow.
function charts_wrap(label, maxChars, maxLines) {
  var words = String(label == null ? "" : label).split(/\s+/).filter(Boolean);
  var lines = [], cur = "";
  var parts = [];
  words.forEach(function (w) {
    while (w.length > maxChars) { parts.push(w.slice(0, maxChars - 1) + "-"); w = w.slice(maxChars - 1); }
    parts.push(w);
  });
  parts.forEach(function (w) {
    if (!cur) cur = w;
    else if ((cur + " " + w).length <= maxChars) cur += " " + w;
    else { lines.push(cur); cur = w; }
  });
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    var last = lines[maxLines - 1];
    if (last.length > maxChars - 1) last = last.slice(0, maxChars - 1);
    lines[maxLines - 1] = last.replace(/[\s-]+$/, "") + "…";
  }
  return lines.length ? lines : [""];
}

function barChart(opts) {
  opts = opts || {};
  var labels = Array.isArray(opts.labels) ? opts.labels : [];
  var values = (Array.isArray(opts.values) ? opts.values : []).map(charts_num);
  var vls = Array.isArray(opts.valueLabels) ? opts.valueLabels : null;
  var n = Math.max(labels.length, values.length);
  var title = opts.title;
  var dataMax = 0;
  for (var i = 0; i < n; i++) dataMax = Math.max(dataMax, values[i] || 0);
  if (!n || dataMax <= 0) return charts_empty(title);

  var max = charts_num(opts.max) > 0 ? Math.max(charts_num(opts.max), dataMax) : dataMax;
  var step = charts_step(max);
  if (!(charts_num(opts.max) > 0)) max = Math.ceil(max / step) * step;

  var W = 340, left = 30, right = 8, top = 22, plotH = 130;
  var plotW = W - left - right;
  var slot = plotW / n;
  var barW = Math.min(44, slot * 0.62);
  var labelFont = 11;
  var maxChars = Math.max(4, Math.floor(slot / (labelFont * 0.58)));
  var wrapped = [];
  var lineCount = 1;
  for (i = 0; i < n; i++) {
    wrapped[i] = charts_wrap(labels[i], maxChars, 4);
    lineCount = Math.max(lineCount, wrapped[i].length);
  }
  var lineH = 13;
  var baseY = top + plotH;
  // Too many lines for the slot: switch to vertical labels, one line each.
  var rotate = lineCount > 3;
  var rotMax = 26, rotLen = 0;
  if (rotate) {
    for (i = 0; i < n; i++) {
      wrapped[i] = charts_wrap(labels[i], rotMax, 1);
      rotLen = Math.max(rotLen, wrapped[i][0].length);
    }
  }
  var H = rotate ? baseY + 10 + Math.ceil(rotLen * labelFont * 0.56) + 4 : baseY + 8 + lineCount * lineH + 4;

  var out = charts_open(W, H, title);
  // gridlines
  for (var g = 0; g <= max + 1e-9; g += step) {
    var gy = charts_r(baseY - (g / max) * plotH);
    out += '<line x1="' + left + '" x2="' + (W - right) + '" y1="' + gy + '" y2="' + gy +
      '" stroke="var(--border)" stroke-width="1"/>' +
      '<text x="' + (left - 5) + '" y="' + charts_r(gy + 4) + '" text-anchor="end" font-size="10" fill="var(--muted)">' +
      charts_esc(charts_r(g)) + "</text>";
  }
  for (i = 0; i < n; i++) {
    var v = Math.max(0, values[i] || 0);
    var h = (Math.min(v, max) / max) * plotH;
    var cx = left + slot * i + slot / 2;
    var x = charts_r(cx - barW / 2);
    var y = charts_r(baseY - h);
    if (h > 0) {
      out += '<rect x="' + x + '" y="' + y + '" width="' + charts_r(barW) + '" height="' + charts_r(h) +
        '" rx="3" fill="var(--accent)"/>';
    }
    var vl = vls && vls[i] != null ? vls[i] : String(charts_r(v));
    out += '<text x="' + charts_r(cx) + '" y="' + charts_r(y - 5) + '" text-anchor="middle" font-size="' +
      (String(vl).length > 6 ? 9 : 11) + '" fill="var(--text)">' + charts_esc(vl) + "</text>";
    if (rotate) {
      out += '<text transform="translate(' + charts_r(cx + 4) + " " + (baseY + 8) + ') rotate(-90)" text-anchor="end" font-size="' +
        labelFont + '" fill="var(--muted)">' + charts_esc(wrapped[i][0]) + "</text>";
      continue;
    }
    out += '<text x="' + charts_r(cx) + '" y="' + (baseY + 8) + '" text-anchor="middle" font-size="' + labelFont +
      '" fill="var(--muted)">';
    for (var L = 0; L < wrapped[i].length; L++) {
      out += '<tspan x="' + charts_r(cx) + '" dy="' + (L === 0 ? lineH - 2 : lineH) + '">' + charts_esc(wrapped[i][L]) + "</tspan>";
    }
    out += "</text>";
  }
  out += '<line x1="' + left + '" x2="' + (W - right) + '" y1="' + baseY + '" y2="' + baseY +
    '" stroke="var(--muted)" stroke-width="1"/>';
  return out + "</svg>";
}

function charts_dateLabel(ms) {
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var d = new Date(ms);
  return months[d.getMonth()] + " " + d.getDate();
}

function dotChart(opts) {
  opts = opts || {};
  var title = opts.title;
  var pts = (Array.isArray(opts.points) ? opts.points : []).map(function (p) {
    if (!p) return null;
    var x = p.x instanceof Date ? p.x.getTime() : Number(p.x);
    var y = Number(p.y);
    return isFinite(x) && isFinite(y) ? { x: x, y: y } : null;
  }).filter(Boolean);
  if (!pts.length) return charts_empty(title);

  var yMax = charts_num(opts.yMax);
  pts.forEach(function (p) { if (p.y > yMax) yMax = p.y; });
  if (yMax <= 0) yMax = 10;
  var step = charts_step(yMax);

  var W = 340, left = 30, right = 14, top = 12, plotH = 140;
  var plotW = W - left - right;
  var baseY = top + plotH;
  var H = baseY + 26;
  var minX = pts[0].x, maxX = pts[0].x;
  pts.forEach(function (p) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); });
  var span = maxX - minX;
  function sx(x) { return span > 0 ? left + ((x - minX) / span) * plotW : left + plotW / 2; }
  function sy(y) { return baseY - (Math.max(0, Math.min(y, yMax)) / yMax) * plotH; }

  var out = charts_open(W, H, title);
  for (var g = 0; g <= yMax + 1e-9; g += step) {
    var gy = charts_r(sy(g));
    out += '<line x1="' + left + '" x2="' + (W - right) + '" y1="' + gy + '" y2="' + gy +
      '" stroke="var(--border)" stroke-width="1"/>' +
      '<text x="' + (left - 5) + '" y="' + charts_r(gy + 4) + '" text-anchor="end" font-size="10" fill="var(--muted)">' +
      charts_esc(charts_r(g)) + "</text>";
  }
  // date ticks: start, end, and up to two between (only distinct dates)
  var ticks = span > 0 ? [0, 1 / 3, 2 / 3, 1] : [0.5];
  var seen = {};
  ticks.forEach(function (f, idx) {
    var ms = span > 0 ? minX + span * f : minX;
    var lbl = charts_dateLabel(ms);
    if (seen[lbl]) return;
    seen[lbl] = true;
    var tx = charts_r(span > 0 ? left + plotW * f : left + plotW / 2);
    var anchor = span > 0 ? (idx === 0 ? "start" : idx === ticks.length - 1 ? "end" : "middle") : "middle";
    out += '<line x1="' + tx + '" x2="' + tx + '" y1="' + baseY + '" y2="' + (baseY + 4) + '" stroke="var(--muted)"/>' +
      '<text x="' + tx + '" y="' + (baseY + 18) + '" text-anchor="' + anchor + '" font-size="11" fill="var(--muted)">' +
      charts_esc(lbl) + "</text>";
  });
  out += '<line x1="' + left + '" x2="' + (W - right) + '" y1="' + baseY + '" y2="' + baseY +
    '" stroke="var(--muted)" stroke-width="1"/>';
  pts.forEach(function (p) {
    out += '<circle cx="' + charts_r(sx(p.x)) + '" cy="' + charts_r(sy(p.y)) + '" r="4.5" fill="var(--accent)" fill-opacity="0.85" stroke="var(--surface)" stroke-width="1"><title>' +
      charts_esc(charts_dateLabel(p.x) + ": " + charts_r(p.y)) + "</title></circle>";
  });
  return out + "</svg>";
}
