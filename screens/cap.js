/* ===== SCREEN: cap ===== */
// Cap screen: tappable head diagram, per-zone controls, timer, simulated cap
// mockup, and Start / End session. Unsaved choices live in a closure that is
// created on the first call, so re-rendering keeps them.
function renderCap(appEl, params) {
  if (!renderCap.cap_impl) {
    renderCap.cap_impl = (function () {
      var THERMAL = [
        { id: "heat", label: "Heat" },
        { id: "cool", label: "Cooling" },
        { id: "off", label: "Off" }
      ];
      var PRESSURE = [
        { id: "on", label: "On" },
        { id: "off", label: "Off" }
      ];

      // Unsaved selections: { zones: { id: {side, thermal, pressure, last} }, selected, timer }
      var draft = null;

      function md() { return window.MOCK_DATA || {}; }

      function labelOf(list, id) {
        for (var i = 0; i < (list || []).length; i++) if (list[i].id === id) return list[i].label;
        return String(id);
      }

      function ensureDraft() {
        if (draft) return;
        draft = { zones: {}, selected: null, timer: null };
        var zs = md().zones || [];
        for (var i = 0; i < zs.length; i++) {
          draft.zones[zs[i].id] = { side: "both", thermal: "off", pressure: false, last: null };
        }
      }

      function inUse(z) { return !!z && (z.thermal === "heat" || z.thermal === "cool" || z.pressure === true); }

      // Zones (in MOCK_DATA order) from the draft that are in use, in session shape.
      function draftZones() {
        var out = [];
        var zs = md().zones || [];
        for (var i = 0; i < zs.length; i++) {
          var z = draft.zones[zs[i].id];
          if (inUse(z)) out.push({ zone: zs[i].id, side: z.side, thermal: z.thermal, pressure: z.pressure });
        }
        return out;
      }

      function zoneMap(list) {
        var m = {};
        for (var i = 0; i < list.length; i++) m[list[i].zone] = list[i];
        return m;
      }

      function toggleZone(id) {
        var z = draft.zones[id];
        if (!z) return;
        if (!inUse(z)) {
          var last = z.last;
          z.thermal = last ? last.thermal : "heat";
          z.pressure = last ? last.pressure : false;
          if (!inUse(z)) z.thermal = "heat";
          draft.selected = id;
        } else if (draft.selected !== id) {
          draft.selected = id;
        } else {
          z.last = { thermal: z.thermal, pressure: z.pressure };
          z.thermal = "off";
          z.pressure = false;
        }
      }

      /* ---------- text ---------- */

      function sideText(side) {
        if (side === "both") return "both sides";
        return labelOf(md().sides, side).toLowerCase() + " side";
      }

      function settingText(z) {
        var parts = [];
        if (z.thermal === "heat") parts.push("heat");
        if (z.thermal === "cool") parts.push("cooling");
        if (z.pressure) parts.push("pressure on");
        return parts.join(", ");
      }

      function summaryHtml(list) {
        if (!list.length) return '<p class="muted cap-summary-empty">No zones in use yet.</p>';
        var h = '<ul class="cap-summary-list">';
        for (var i = 0; i < list.length; i++) {
          var z = list[i];
          h += '<li data-zone="' + esc(z.zone) + '"><strong>' + esc(labelOf(md().zones, z.zone)) + "</strong> — " +
            esc(sideText(z.side)) + ": " + esc(settingText(z)) + "</li>";
        }
        return h + "</ul>";
      }

      /* ---------- head diagram (tappable) ---------- */

      // Shapes per zone on a front view of the head (viewer's left = wearer's right).
      var HEAD_ZONES = {
        eyes: {
          shapes: [['right', '<path d="M160,112 L137,112 A13,13 0 0 0 137,138 L160,138 Z"/>'], ['left', '<path d="M160,112 L183,112 A13,13 0 0 1 183,138 L160,138 Z"/>']],
          label: { x: 312, y: 200, anchor: "end" }, leader: "M300,190 L196,132",
          hit: '<rect x="214" y="180" width="104" height="40"/>'
        },
        temples: {
          shapes: [['right', '<circle cx="116" cy="92" r="13"/>'], ['left', '<circle cx="204" cy="92" r="13"/>']],
          label: { x: 8, y: 56, anchor: "start" }, leader: "M30,62 L106,86",
          hit: '<rect x="2" y="36" width="104" height="40"/>'
        },
        above_ears: {
          shapes: [['right', '<rect x="80" y="104" width="24" height="11" rx="5.5"/>'], ['left', '<rect x="216" y="104" width="24" height="11" rx="5.5"/>']],
          label: { x: 312, y: 56, anchor: "end" }, leader: "M286,62 L240,106",
          hit: '<rect x="206" y="36" width="112" height="40"/>'
        },
        behind_ears: {
          shapes: [['right', '<rect x="72" y="140" width="11" height="26" rx="5.5"/>'], ['left', '<rect x="237" y="140" width="11" height="26" rx="5.5"/>']],
          label: { x: 8, y: 214, anchor: "start" }, leader: "M30,200 L74,162",
          hit: '<rect x="2" y="194" width="112" height="40"/>'
        }
      };

      // Each shape is [side, svg]; a shape lights up when the zone's side covers it.
      function headShapes(shapes, z) {
        var h = "";
        for (var i = 0; i < shapes.length; i++) {
          var on = z && (z.side === "both" || z.side === shapes[i][0]);
          var cls = on ? "cap-hs cap-hs-" + (z.thermal === "off" ? "pressure" : z.thermal) + (z.pressure ? " cap-hs-press" : "") : "cap-hs";
          h += '<g class="' + cls + '" data-side="' + shapes[i][0] + '">' + shapes[i][1] + "</g>";
        }
        return h;
      }

      function headSvg(map, selected, locked) {
        var h = '<svg class="cap-head" viewBox="0 24 320 226" role="group" aria-label="Head diagram: tap a zone">' +
          '<path class="cap-head-outline" d="M160,42 C206,40 224,82 222,124 C221,170 196,212 160,214 C124,212 99,170 98,124 C96,82 114,40 160,42 Z"/>' +
          '<path class="cap-head-ear" d="M99,118 C88,114 86,150 98,154"/>' +
          '<path class="cap-head-ear" d="M221,118 C232,114 234,150 222,154"/>' +
          '<path class="cap-head-line" d="M140,126 q6,-5 12,0 M168,126 q6,-5 12,0"/>' +
          // simple nose and mouth, just for reference
          '<path class="cap-head-line" d="M160,144 L155,166 L163,166 M149,188 q11,5 22,0"/>' +
          '<path class="cap-head-hair" d="M102,100 C104,58 130,42 160,42 C192,42 216,58 218,100 C206,72 184,64 160,64 C136,64 114,72 102,100 Z"/>';
        var zs = md().zones || [];
        for (var i = 0; i < zs.length; i++) {
          var id = zs[i].id;
          var g = HEAD_ZONES[id];
          if (!g) continue;
          var z = map[id];
          var cls = "cap-hz";
          if (z) cls += " is-on";
          if (!locked && selected === id) cls += " is-selected";
          var attrs = locked ? ' aria-hidden="true"' :
            ' role="button" tabindex="0" data-action="zone" data-zone="' + esc(id) + '" data-key="hz-' + esc(id) + '"' +
            ' aria-pressed="' + (z ? "true" : "false") + '" aria-label="' + esc(zs[i].label + (z ? " (in use)" : " (not in use)")) + '"';
          h += '<g class="' + cls + '"' + attrs + ">" +
            '<g class="cap-hz-hit">' + g.hit + "</g>" +
            '<path class="cap-hz-leader" d="' + g.leader + '"/>' +
            '<g class="cap-hz-shape">' + headShapes(g.shapes, z) + "</g>" +
            '<text class="cap-hz-label" x="' + g.label.x + '" y="' + g.label.y + '" text-anchor="' + g.label.anchor + '">' + esc(zs[i].label) + "</text>" +
            "</g>";
        }
        h += '<text class="cap-head-side" x="104" y="244" text-anchor="middle">Your right</text>' +
          '<text class="cap-head-side" x="216" y="244" text-anchor="middle">Your left</text>';
        return h + "</svg>";
      }

      /* ---------- cap mockup (side views) ---------- */

      // Pads drawn on a side view with the face pointing to the viewer's left.
      var PADS = {
        eyes:        { shape: '<rect x="44" y="84" width="30" height="14" rx="7"/>', cx: 59, cy: 91 },
        temples:     { shape: '<circle cx="90" cy="70" r="10"/>', cx: 90, cy: 70 },
        above_ears:  { shape: '<rect x="106" y="66" width="36" height="12" rx="6"/>', cx: 124, cy: 72 },
        behind_ears: { shape: '<rect x="141" y="94" width="13" height="32" rx="6.5"/>', cx: 147.5, cy: 110 }
      };

      function sideViewSvg(map, sideId) {
        var mirror = sideId === "right";
        var h = '<g' + (mirror ? ' transform="translate(200,0) scale(-1,1)"' : "") + ">" +
          // head profile
          '<path class="cap-mk-head" d="M100,188 L98,164 C90,162 72,162 62,160 C54,159 48,155 48,150 C48,146 50,143 49,141 C45,139 44,136 46,134 C44,132 43,129 44,127 C45,125 46,123 45,121 C40,121 32,120 30,116 C31,111 38,104 45,96 C47,92 46,86 47,82 C46,74 47,64 52,52 C64,26 92,12 120,14 C152,16 176,38 178,70 C180,96 172,116 158,128 C152,134 150,140 150,150 L152,188 Z"/>' +
          // cap shell over the top of the head, strap to the eye covering
          '<path class="cap-mk-shell" d="M49,58 C61,22 92,8 120,10 C156,12 182,36 182,70 C184,96 176,116 162,128 L156,130 C160,108 160,90 152,78 C136,58 92,56 70,74 L52,80 C49,72 48,65 49,58 Z"/>' +
          '<path class="cap-mk-strap" d="M74,90 C100,92 120,96 136,104"/>' +
          // eye covering (always part of the cap)
          '<rect class="cap-mk-cover" x="38" y="80" width="42" height="22" rx="10"/>' +
          // ear covering (always part of the cap)
          '<ellipse class="cap-mk-cover" cx="122" cy="106" rx="15" ry="20"/>';
        var zs = md().zones || [];
        for (var i = 0; i < zs.length; i++) {
          var id = zs[i].id;
          var p = PADS[id];
          if (!p) continue;
          var z = map[id];
          var on = z && (z.side === "both" || z.side === sideId);
          var cls = "cap-pad";
          var thermal = on ? z.thermal : "none";
          if (on) cls += " cap-pad-" + (z.thermal === "off" ? "neutral" : z.thermal);
          h += '<g class="' + cls + '" data-zone="' + esc(id) + '" data-side="' + esc(sideId) + '" data-thermal="' + esc(thermal) +
            '" data-pressure="' + (on && z.pressure ? "on" : "off") + '">' + p.shape + "</g>";
          if (on && z.pressure) {
            h += '<g class="cap-pmark" data-zone="' + esc(id) + '"><circle cx="' + p.cx + '" cy="' + p.cy + '" r="6"/>' +
              '<circle class="cap-pmark-dot" cx="' + p.cx + '" cy="' + p.cy + '" r="2.2"/></g>';
          }
        }
        h += "</g>";
        var title = labelOf(md().sides, sideId) + " side";
        return '<figure class="cap-mk-view"><svg class="cap-mk" viewBox="0 0 200 190" role="img" aria-label="' +
          esc("Simulated cap, " + title.toLowerCase() + " view") + '">' + h + "</svg>" +
          "<figcaption>" + esc(title) + "</figcaption></figure>";
      }

      function mockupHtml(list) {
        var map = zoneMap(list);
        return '<div class="cap-mk-views">' + sideViewSvg(map, "left") + sideViewSvg(map, "right") + "</div>" +
          '<ul class="cap-legend" aria-hidden="true">' +
          '<li><span class="cap-sw cap-sw-heat"></span>Heat</li>' +
          '<li><span class="cap-sw cap-sw-cool"></span>Cooling</li>' +
          '<li><span class="cap-sw cap-sw-pressure"></span>Pressure</li>' +
          '<li><span class="cap-sw cap-sw-cover"></span>Eye and ear coverings</li>' +
          "</ul>";
      }

      /* ---------- controls ---------- */

      function segHtml(name, options, current, disabled) {
        var h = '<div class="cap-seg" role="group">';
        for (var i = 0; i < options.length; i++) {
          var o = options[i];
          var on = String(o.id) === String(current);
          h += '<button type="button" class="cap-seg-btn' + (on ? " is-on" : "") + '" data-action="' + esc(name) +
            '" data-value="' + esc(o.id) + '" data-key="' + esc(name + "-" + o.id) + '" aria-pressed="' + (on ? "true" : "false") + '"' +
            (disabled ? " disabled" : "") + ">" + esc(o.label) + "</button>";
        }
        return h + "</div>";
      }

      function editorHtml() {
        var id = draft.selected;
        var z = id ? draft.zones[id] : null;
        if (!z) return '<p class="muted">Tap a zone on the head to set it up. You can use several zones at once.</p>';
        var name = labelOf(md().zones, id);
        var h = '<h3>' + esc(name) + "</h3>";
        h += '<div class="cap-ctrl"><span class="cap-ctrl-label" id="cap-l-side">Side</span>' +
          segHtml("side", md().sides || [], z.side) + "</div>";
        h += '<div class="cap-ctrl"><span class="cap-ctrl-label">Heat or cooling</span>' +
          segHtml("thermal", THERMAL, z.thermal) + "</div>";
        h += '<div class="cap-ctrl"><span class="cap-ctrl-label">Pressure</span>' +
          segHtml("pressure", PRESSURE, z.pressure ? "on" : "off") + "</div>";
        if (!inUse(z)) h += '<p class="muted cap-hint">Choose heat, cooling, or pressure to use this zone.</p>';
        else h += '<button type="button" class="link-btn" data-action="clear" data-key="clear">Stop using ' + esc(name.toLowerCase()) + "</button>";
        return h;
      }

      function chipsHtml(map, selected) {
        var zs = md().zones || [];
        var h = '<div class="cap-chips">';
        for (var i = 0; i < zs.length; i++) {
          var id = zs[i].id;
          var on = !!map[id];
          h += '<button type="button" class="cap-chip' + (on ? " is-on" : "") + (selected === id ? " is-selected" : "") +
            '" data-action="zone" data-zone="' + esc(id) + '" data-key="chip-' + esc(id) + '" aria-pressed="' + (on ? "true" : "false") + '">' +
            esc(zs[i].label) + "</button>";
        }
        return h + "</div>";
      }

      function timerOptions() {
        var out = [{ id: "none", label: "No timer" }];
        var t = md().timerOptions || [];
        for (var i = 0; i < t.length; i++) out.push({ id: String(t[i]), label: t[i] + " min" });
        return out;
      }

      /* ---------- render ---------- */

      function render(appEl, flash) {
        ensureDraft();
        var active = Store.activeSession();
        var pending = Store.pendingSession();
        var focusKey = document.activeElement && appEl.contains(document.activeElement) ?
          document.activeElement.getAttribute("data-key") : null;
        var h = '<section class="screen-cap">';
        h += '<h2>Cap</h2>';

        if (active) {
          var list = active.zones || [];
          var map = zoneMap(list);
          h += '<div class="card cap-running" aria-live="polite"><h3>Session running</h3>' +
            '<p>Started ' + esc(fmtTime(active.startedAt)) + " · " +
            esc(active.timerMinutes === null ? "No timer" : active.timerMinutes + " min timer") + "</p>" +
            '<p class="muted">Settings are locked while the session runs.</p>' +
            '<button type="button" class="btn btn-block" data-action="end" data-key="end">End session</button></div>';
          h += '<div class="card"><h3>Running settings</h3>' + headSvg(map, null, true) + summaryHtml(list) + "</div>";
          h += '<div class="card"><h3>Simulated cap</h3>' + mockupHtml(list) + "</div>";
        } else {
          var dz = draftZones();
          var dmap = zoneMap(dz);
          h += '<div class="card"><h3>Zones</h3>' + headSvg(dmap, draft.selected, false) + chipsHtml(dmap, draft.selected) +
            '<div class="cap-editor">' + editorHtml() + "</div></div>";
          h += '<div class="card"><h3>Timer</h3>' +
            segHtml("timer", timerOptions(), draft.timer === null ? "none" : String(draft.timer)) + "</div>";
          h += '<div class="card"><h3>Simulated cap</h3>' + mockupHtml(dz) +
            '<h4 class="cap-sub">Current settings</h4>' + summaryHtml(dz) + "</div>";
          h += '<div class="card cap-start">';
          if (pending) {
            h += '<p class="cap-blocked">Give feedback on your last session first.</p>' +
              '<button type="button" class="btn btn-block" disabled data-key="start">Start session</button>' +
              '<button type="button" class="link-btn" data-action="feedback" data-key="feedback">Go to feedback</button>';
          } else {
            h += '<button type="button" class="btn btn-block" data-action="start" data-key="start"' + (dz.length ? "" : " disabled") + ">Start session</button>";
            if (!dz.length) h += '<p class="muted cap-hint">Choose at least one zone to start.</p>';
          }
          if (flash) h += '<p class="error" role="alert">' + esc(flash) + "</p>";
          h += "</div>";
        }
        h += "</section>";
        appEl.innerHTML = h;

        var root = appEl.querySelector(".screen-cap");
        root.addEventListener("click", function (ev) { onAction(appEl, ev); });
        root.addEventListener("keydown", function (ev) {
          var t = ev.target.closest ? ev.target.closest('g[data-action="zone"]') : null;
          if (t && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); onAction(appEl, ev); }
        });
        if (focusKey) {
          var f = appEl.querySelector('[data-key="' + focusKey + '"]');
          if (f && f.focus) f.focus();
        }
      }

      function onAction(appEl, ev) {
        var t = ev.target.closest ? ev.target.closest("[data-action]") : null;
        if (!t || t.disabled) return;
        var action = t.getAttribute("data-action");
        var val = t.getAttribute("data-value");
        var locked = !!Store.activeSession();
        if (action === "end") {
          Store.endSession();
          go("#/feedback");
          return;
        }
        if (action === "feedback") { go("#/feedback"); return; }
        if (locked) return;
        var sel = draft.selected ? draft.zones[draft.selected] : null;
        if (action === "zone") toggleZone(t.getAttribute("data-zone"));
        else if (action === "side" && sel) sel.side = val;
        else if (action === "thermal" && sel) sel.thermal = val;
        else if (action === "pressure" && sel) sel.pressure = val === "on";
        else if (action === "clear" && sel) {
          sel.last = { thermal: sel.thermal, pressure: sel.pressure };
          sel.thermal = "off";
          sel.pressure = false;
        } else if (action === "timer") draft.timer = val === "none" ? null : Number(val);
        else if (action === "start") {
          var zones = draftZones();
          if (!zones.length) return;
          if (Store.startSession({ timerMinutes: draft.timer, zones: zones })) { go("#/cap"); return; }
          render(appEl, "The session couldn't start. Check your settings and try again.");
          return;
        }
        render(appEl, null);
      }

      return function (appEl) { render(appEl, null); };
    })();
  }
  return renderCap.cap_impl(appEl, params);
}
