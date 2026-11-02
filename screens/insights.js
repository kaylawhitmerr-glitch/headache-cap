/* ===== SCREEN: insights ===== */
// Shows rule-based observations from the user's own logs.
// All insight logic lives in lib/insights.js; this file only renders.
function renderInsights(appEl, params) {
  var md = window.MOCK_DATA || {};
  var entries = (Store.state().entries) || [];

  var patterns = insights_safe(function () { return patternInsights(entries, md); });
  var relief = insights_safe(function () { return reliefBySetting(entries, md); });
  var suggestions = insights_safe(function () { return visibleSuggestions(patterns, md); });

  var hasSeed = entries.some(function (e) { return e && typeof e.id === 'string' && e.id.indexOf('seed_') === 0; });

  var html = '';
  html += '<div class="screen-insights">';
  html += '<h1 class="insights-title">Insights</h1>';
  html += '<p class="insights-intro muted">These are observations counted from your own logs, nothing more.</p>';
  if (hasSeed) {
    html += '<p class="note insights-sample">Includes sample entries for testing.</p>';
  }

  // Observed Patterns
  html += '<section class="card insights-section" aria-labelledby="ins-patterns-h">';
  html += '<h2 id="ins-patterns-h">Observed Patterns</h2>';
  if (patterns.length) {
    html += '<ul class="insights-list">';
    patterns.forEach(function (p) {
      html += '<li class="insights-item" data-rule="' + esc(p.ruleId) + '">' + esc(p.text) + '</li>';
    });
    html += '</ul>';
  } else {
    html += '<p class="insights-empty muted">No patterns yet. A pattern shows once 3 or more of your logs match.</p>';
  }
  html += '</section>';

  // Relief by setting
  html += '<section class="card insights-section" aria-labelledby="ins-relief-h">';
  html += '<h2 id="ins-relief-h">Relief by setting</h2>';
  if (relief.length) {
    html += '<ul class="insights-list">';
    relief.forEach(function (r) {
      html += '<li class="insights-item insights-relief">';
      html += '<span class="insights-relief-text">' + esc(r.text) + '</span>';
      html += insights_bar(r.helped, r.rated);
      html += '</li>';
    });
    html += '</ul>';
  } else {
    html += '<p class="insights-empty muted">Rate a few cap sessions to see which settings you marked as helping.</p>';
  }
  html += '</section>';

  // Prevention suggestions (only when there are any)
  html += '<section class="card insights-section" aria-labelledby="ins-sugg-h">';
  html += '<h2 id="ins-sugg-h">Prevention suggestions</h2>';
  if (suggestions.length) {
    html += '<ul class="insights-list">';
    suggestions.forEach(function (s) {
      html += '<li class="insights-item insights-suggestion" data-id="' + esc(s.id) + '">';
      html += '<span class="insights-sugg-text">' + esc(s.text) + '</span> ';
      html += '<strong class="insights-nma">Not medical advice.</strong>';
      html += '</li>';
    });
    html += '</ul>';
  } else {
    html += '<p class="insights-empty muted">Suggestions show here when a matching pattern appears in your logs.</p>';
  }
  html += '</section>';

  html += '</div>';
  appEl.innerHTML = html;
}

function insights_safe(fn) {
  try {
    var out = fn();
    return Array.isArray(out) ? out : [];
  } catch (err) {
    if (window.console) console.error('Insights:', err);
    return [];
  }
}

function insights_bar(helped, rated) {
  var h = Number(helped) || 0;
  var r = Number(rated) || 0;
  var frac = r > 0 ? Math.max(0, Math.min(1, h / r)) : 0;
  var w = Math.round(frac * 1000) / 10;
  var label = h + ' of ' + r + ' marked helped';
  return '<svg class="insights-bar" viewBox="0 0 100 8" preserveAspectRatio="none" role="img" aria-label="' + esc(label) + '">' +
    '<rect class="insights-bar-bg" x="0" y="0" width="100" height="8" rx="4"></rect>' +
    '<rect class="insights-bar-fill" x="0" y="0" width="' + w + '" height="8" rx="4"></rect>' +
    '</svg>';
}
