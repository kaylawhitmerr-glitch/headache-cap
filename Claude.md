# Claude.md — Headache Comfort Cap prototype (MVP)

Read `prd.md` first. It is the product source of truth; this file says how to build the class prototype from it. If the two disagree, stop and ask. Do not edit `prd.md` unless asked.

What we are building: a real app with a **simulated cap**, running on **mock data only**, as a plain web page that opens by double-clicking `index.html`.

---

## 1. MVP rules

1. **Fixed file list:** only the files in §5 (`index.html`, `mock-data.js`, `lib/*.js`, `screens/*.js` and `screens/*.css`). Do not add other files to the project without asking. Test scripts live outside the project (the session scratchpad).
2. **Opens by double-click** (`file://`). No server, no build step, no `npm`, no installs.
3. **No framework, no libraries, no CDN, no web fonts.** Vanilla JavaScript, plain CSS, hand-drawn SVG for charts.
4. **No ES modules and no fetching.** No `type="module"`, `import`, `export`, `fetch`, or `XMLHttpRequest`; browsers block these on `file://`. Load every `.js` file with a plain `<script src="…"></script>` and every `.css` file with `<link rel="stylesheet" href="…">`, in the §5 load order. SVG is written inline without an `xmlns` attribute (it isn't needed in HTML, and it contains a URL that fails the §6.2 check). Don't use the words *import* or *export* in comments either.
5. **No network at all.** The app never contacts anything. Mock data is the only data source apart from what the tester enters.
6. **Saving:** tester entries are kept in `localStorage` and survive a reload. All access goes through the STORE section, wrapped in `try/catch`. If storage is unavailable, run in memory and show a small banner: "Changes won't be saved in this browser."
7. **Reset:** a "Reset to mock data" control clears storage and reloads the seed data from `mock-data.js`.
8. **Phone first:** works at 360 px wide with no sideways scrolling, and also looks fine on a laptop.
9. **Lists and text live in `mock-data.js`**, not hard-coded in `index.html`: zones, symptoms, activities, timer options, duration ranges, thresholds, and suggestion text.
10. **Build order** (PRD §5): cap zones with heat/cooling → pressure → cap mockup → log → feedback → Observed Patterns → relief-by-setting insight → share page → prevention suggestions. This is a **priority order**: if time runs short, cut from the end. It is not a strict sequence; independent sections may be built in parallel (rule 1).

## 2. Hard product rules (from the PRD)

Never break these, even if a request seems to ask for it. Ask first.

- **Comfort only.** Never diagnose, never say whether a headache is normal or abnormal, never give medication advice (no drug names, doses, or "take/skip" wording). There is no medication field.
- **Insights are observations of the user's own logs**, and they are rule-based (no AI). Phrase them as "In your logs…" or "X of your Y logged headaches…". Never say *causes*, *triggers*, *because*, *diagnosis*, *abnormal*, *treat*, *cure*, or predict anything.
- **Every prevention suggestion shows "Not medical advice."** right next to it.
- **The minimum log is one tap:** "A headache occurred." Every other field is optional. A **log-only switch** ("Log only — I didn't use the cap", on by default) sets `logOnly` on the entry.
- **The app works only with a cap code.** The only way in is sign-up with a valid personal code from the box (in the mock data, `validCodes`). The check trims spaces and ignores case (`hcc-4821 ` works). A code can be used again after Reset; there is no record of used codes.
- **Data stays on the device.** Nothing is sent anywhere. The doctor share page is produced only when the user taps for it, and the user decides what to do with it.
- **Users can edit and delete any entry.**
- **The cap is simulated.** Label it "Simulated cap". Never imply a real connection (no "Connected", battery, or Bluetooth wording).
- **Cap controls match the PRD exactly:** four zones (eye area, temples, above the ears, behind the ears); each zone set to left, right, or both; several zones at once; per zone, **heat, cooling, or off** (never heat and cooling together) plus **pressure on/off**, one level each; optional timer. A zone is "in use" when it has heat, cooling, or pressure.
- **Light and sound blocking are not controls.** The eye and ear coverings are always drawn on the cap mockup as part of the cap; there is no toggle and no data field for them.
- **Out of scope; do not build:** real hardware, massage, live AI, daily check-ins, automatic screen-time capture, diagnosis, features for children, push notifications, medication advice, purchasing.

## 3. Navigation

Hash routes, so it works on `file://`. Only the ROUTER section reads `location.hash`.

| Route | Screen | Contents |
|---|---|---|
| `#/signup` | Sign-up | Enter the box code. An invalid code shows "That code doesn't match a cap." A valid one creates the account and goes to `#/cap`. |
| `#/cap` | Cap | Tappable head diagram, per-zone controls, timer, **cap mockup** showing the current settings (eye and ear coverings drawn as part of the cap), Start / End session. Start needs at least one zone in use. While a session is pending feedback, Start is disabled with "Give feedback on your last session first." |
| `#/feedback` | Feedback | Shown when a session ends (End tapped or timer done). For each method used: helped / didn't help / not sure. How long the headache lasted (range). Every answer is optional. **Save** creates the entry (below) and goes to `#/log/<id>`. **Discard session** (with a confirm step) drops the pending session and goes to `#/cap`. |
| `#/log` | Log | Log-only switch, then the big "A headache occurred" button (one-tap log). Tapping it creates the entry and goes to `#/log/<id>`. Below that, the **history list** (newest first) with Edit and Delete on each entry. |
| `#/log/<id>` | Log (entry) | The **"Your logged headache"** summary card at the top, then the "Add details" form filled in for this entry. Save updates the entry and refreshes the card. An unknown id goes to `#/log`. |
| `#/insights` | Insights | "Observed Patterns", relief by setting, prevention suggestions (each with "Not medical advice."). |
| `#/share` | Share | Printable doctor page (§4.6) with a Print button (`window.print()`). |

- **Gate:** with no account, every route redirects to `#/signup`. With an account, `#/signup` redirects to `#/cap`, and an empty or unknown hash also goes to `#/cap`. `#/feedback` with no pending session goes to `#/cap`.
- **Bottom nav** (hidden on sign-up and when printing): Cap · Log · Insights · Share.
- **Active session:** while a session runs, leaving `#/cap` keeps it running. A bar at the top shows "Session running — End" and the time left (or time elapsed with no timer), and keeps counting.
- **Ending a session:** End (on `#/cap` or in the bar) or the timer reaching zero moves `activeSession` to `pendingSession` with `endedAt` set, and goes to `#/feedback` **from whatever screen is showing**. If the app opens and an active session's timer would already have run out, it ends the session with `endedAt` = `startedAt` + timer and goes to `#/feedback`. A session with no timer keeps running across reloads until End.
- **Pending session:** stays saved (survives reload and navigation) until Save or Discard. While one exists, every screen except `#/feedback` shows the top bar "Session ended — Give feedback", which links to `#/feedback`.
- **Creating entries:**
  - From feedback Save: `occurredAt` = the session's `startedAt`, `logOnly: false`, `session` and `feedback` from this session, other fields empty.
  - From the one-tap button: `occurredAt` = now, `logOnly` from the switch, `session: null`, `feedback: null`, other fields empty. The one-tap log never attaches a session, even if one is pending.
- **"Add details" form** (on `#/log/<id>`): date and time it started (`occurredAt`), log-only switch, pain (a row of 0–10 buttons plus "Not set"), symptoms (checkboxes), activity (a list with "Not set"), screen time hours (number, step 0.5), water glasses, caffeinated drinks. If the entry has feedback, the feedback answers and duration are editable too. The session's zones and times are shown but not editable. Clearing a field sets it back to `null`.
- **Delete:** asks "Delete this entry?" first; then removes it and goes to (or stays on) `#/log`.
- **Sample data note:** while any entry's id starts with `seed_`, `#/log` and `#/insights` show a small note: "Includes sample entries for testing."
- **Reset to mock data:** a small link in the footer, with a confirm step. It also clears the account, so the app returns to `#/signup`.

## 4. Data contract

`mock-data.js` sets **one global, `window.MOCK_DATA`**, and nothing else: no functions, no logic. The app treats it as read-only. Ids are lowercase snake_case and never change; labels are what the user sees and may change.

### 4.1 `MOCK_DATA` shape

```js
window.MOCK_DATA = {
  version: 1,
  validCodes: ["HCC-4821", "HCC-7730", "HCC-1205"],   // codes "in the box"

  zones: [                                             // exactly these four ids
    { id: "eyes",        label: "Eye area" },
    { id: "temples",     label: "Temples" },
    { id: "above_ears",  label: "Above the ears" },
    { id: "behind_ears", label: "Behind the ears" }
  ],
  sides:        [ { id: "left", label: "Left" }, { id: "right", label: "Right" }, { id: "both", label: "Both" } ],
  symptoms:     [ { id: "nausea", label: "Nausea" }, { id: "light_sensitivity", label: "Light sensitivity" },
                  { id: "sound_sensitivity", label: "Sound sensitivity" }, { id: "aura", label: "Aura" },
                  { id: "neck_tension", label: "Neck tension" } ],
  activities:   [ { id: "screen_work", label: "Screen work" }, { id: "meeting", label: "Meeting" },
                  { id: "commuting", label: "Commuting" }, { id: "exercise", label: "Exercise" },
                  { id: "resting", label: "Resting" }, { id: "sleeping", label: "Sleeping" },
                  { id: "other", label: "Other" } ],
  timerOptions: [10, 20, 30],                          // minutes; "no timer" is always offered too
  durationRanges: [ { id: "lt30", label: "Under 30 min" }, { id: "30to60", label: "30–60 min" },
                    { id: "1to2h", label: "1–2 h" }, { id: "2to4h", label: "2–4 h" },
                    { id: "gt4h", label: "Over 4 h" } ],

  thresholds: {                                        // DRAFT, used by the insight rules
    minOccurrences: 3,          // a pattern or relief insight shows only at 3+ matches
    highScreenHours: 6,
    lowWaterGlasses: 3,
    highCaffeineDrinks: 3
  },

  suggestions: [                                       // DRAFT text, review before testing
    { id: "s_screen",   ruleId: "high_screen",   draft: true, text: "..." },
    { id: "s_water",    ruleId: "low_water",     draft: true, text: "..." },
    { id: "s_caffeine", ruleId: "high_caffeine", draft: true, text: "..." }
  ],

  seedEntries: [ /* Entry objects, see 4.2 */ ]
};
```

### 4.2 Entry (one logged headache)

Used both in `seedEntries` and in saved state. Optional fields are `null` (or `[]`) when not given, never missing.

```js
{
  id: "e_lx3k9a_7f2",            // "e_" + base36 ms time + "_" + 3 random chars; seed entries use "seed_01", "seed_02", …
  occurredAt: "2026-10-14T15:30:00",  // local time, no zone; required; when the headache started
  createdAt:  "2026-10-14T15:31:02",
  updatedAt:  "2026-10-14T15:31:02",
  logOnly: false,                 // true = user says they didn't use the cap; then session and feedback are null.
                                  // false with session null = used the cap but no session was recorded in the app.

  session: null | {
    startedAt: "2026-10-14T15:05:00",
    endedAt:   "2026-10-14T15:25:00",
    timerMinutes: null | 10 | 20 | 30,
    zones: [                      // 1+ items; each zone id at most once
      { zone: "temples", side: "both", thermal: "heat" | "cool" | "off", pressure: true | false }
    ]                             // each item must have thermal != "off" or pressure == true
  },

  feedback: null | {
    methods: {                    // only keys for methods used in the session
      heat?:     "helped" | "no" | "unsure",
      cool?:     "helped" | "no" | "unsure",
      pressure?: "helped" | "no" | "unsure"
    },
    duration: null | "lt30" | "30to60" | "1to2h" | "2to4h" | "gt4h"
  },

  pain:            null | 0..10,        // whole number
  symptoms:        [],                   // ids from MOCK_DATA.symptoms
  activity:        null | "<activity id>",
  screenTimeHours: null | 0..24,         // steps of 0.5, entered by the user
  waterGlasses:    null | 0..30,         // whole number
  caffeineDrinks:  null | 0..20          // whole number
}
```

How entries are created (one-tap vs feedback Save) is in §3, "Creating entries".

### 4.3 Saved state (`localStorage` key `hcc-prototype-v1`)

```js
{
  version: 1,
  account: null | { code: "HCC-4821", createdAt: "..." },   // code stored as in validCodes
  entries: [ /* Entry */ ],
  activeSession:  null | { startedAt, timerMinutes, zones },            // a session in progress
  pendingSession: null | { startedAt, endedAt, timerMinutes, zones }    // ended, waiting for feedback
}
```

`activeSession` and `pendingSession` are never both set.

On first load (or Reset), `entries` = a copy of `seedEntries`, `account` = `null`, and both sessions = `null`. If stored `version` ≠ 1, or the data won't parse, fall back to the seed and show the banner from §1.6. If the state parses but **one entry** fails §4.2 validation, drop just that entry, keep the rest, and show the banner "Some saved entries couldn't be read and were left out." An invalid `activeSession` or `pendingSession` is set to `null`.

### 4.4 Seed data requirements

`seedEntries` must make every insight testable:

- About 20–25 entries between **2026-09-07 and 2026-10-18** (six weeks, Monday to Sunday), a mix of with-cap and log-only.
- Every pattern rule in §4.5 matches **at least 3** entries, except **`high_caffeine`, which matches exactly 2** (it must *not* show, so the `s_caffeine` suggestion must not show either).
- At least one zone + method has 3+ rated sessions, and one has only 2.
- Some entries have only the minimum fields.
- Ids are `seed_01`, `seed_02`, … in date order.

Dates are fixed strings. Do not make them relative to today.

### 4.5 Insight rules (INSIGHTS section; pure functions, entries in, text out)

Each rule shows only when it matches ≥ `thresholds.minOccurrences` entries. Wording always counts the user's own logs.

**Common rules for all patterns:**
- Times come from `occurredAt` (not the session start).
- Entries where the field is `null` or `[]` don't match, but every entry counts toward the total.
- Every pattern uses one sentence form: "**X of your Y logged headaches** …", where X = matches and Y = total entries.
- **Ties** for "most common" go to the item that comes first in its list: buckets morning → afternoon → evening → night; days Monday → Sunday; activities and symptoms in `MOCK_DATA` order.
- The activity `other` is never reported as a pattern. If it is the most common, the next most common activity is used.

| Rule id | Matches when | Wording |
|---|---|---|
| `time_of_day` | Most common bucket (morning 5–12, afternoon 12–17, evening 17–22, night 22–5) | "7 of your 20 logged headaches started in the afternoon." |
| `weekday` | Most common day of the week | "5 of your 20 logged headaches started on a Monday." |
| `activity` | Most common activity (not `other`) | "6 of your 20 logged headaches happened during screen work." |
| `symptom` | Most common symptom | "8 of your 20 logged headaches included light sensitivity." |
| `high_screen` | `screenTimeHours` ≥ `highScreenHours` | "4 of your 20 logged headaches came on days with 6+ hours of screen time." |
| `low_water` | `waterGlasses` ≤ `lowWaterGlasses` | "4 of your 20 logged headaches came on days with 3 or fewer glasses of water." |
| `high_caffeine` | `caffeineDrinks` ≥ `highCaffeineDrinks` | "3 of your 20 logged headaches came on days with 3+ caffeinated drinks." |
| relief by setting | Per zone + method with 3+ rated sessions | "Heat on the temples: you marked it helped in 4 of 5 rated sessions." |

**Relief by setting:**
- Feedback is rated per method, not per zone, so a session's rating for a method counts for **every zone in that session that used the method**. The zone's side is ignored.
- A session is "rated" for a method when the method has any answer: helped, no, or unsure. **"Not sure" counts in the denominator.**
- Method labels: Heat, Cooling, Pressure.
- Order: most rated first, then zone order, then heat → cooling → pressure.

**Empty states:**
- No patterns: "No patterns yet. A pattern shows once 3 or more of your logs match."
- No relief rows: "Rate a few cap sessions to see which settings you marked as helping."

"Your logged headache" (shown on `#/log/<id>`) just restates that entry in plain words: when it started, then each field that is set, then the cap settings and feedback if any. No judgment.

A suggestion shows only when its `ruleId` pattern is showing. The `draft` flag is for team review only and is never shown in the app.

### 4.6 Share page contents

The title "Headache log shared by the user", the date range (earliest to latest `occurredAt`), and the number of entries, plus three SVG charts:

- **Headaches per week (bars):** weeks start Monday, are labelled by the Monday's date, and every week in the range is shown, including weeks with zero.
- **Pain over time (dots):** one dot per entry that has a pain value; x = `occurredAt`, y = 0–10.
- **Relief by setting (bars):** the same rows as the relief insight (3+ rated sessions only), bar = share marked helped, labelled "4 of 5". With no rows, show the relief empty-state text instead.

Under them, a table of all entries, newest first. Columns: Date · Time · Pain · Symptoms · Activity · Cap settings (e.g. "Temples, both: heat + pressure", or "Log only") · Marked helped (methods) · Duration. Empty cells show "—".

At the foot: "Personal log of observations. Not a diagnosis." Add `@media print` rules that hide the nav, buttons, and banners.

## 5. File layout (one owner per file / section)

```
prd.md               Product source of truth. Read only.
Claude.md            This file. Update it when a rule, route, or field changes.
.gitignore           Keeps secrets (.env, keys), installed packages, and clutter out of git.
mock-data.js         Owns ALL mock data and editable lists/text (§4.1). Data only, no logic.
index.html           Owns STYLES (shared), SHELL, UTIL, STORE, the sign-up screen, ROUTER; loads every other file.
lib/insights.js      Owns INSIGHTS.
lib/charts.js        Owns CHARTS.
screens/cap.js       renderCap         + screens/cap.css
screens/feedback.js  renderFeedback    + screens/feedback.css
screens/log.js       renderLog (#/log and #/log/<id>) + screens/log.css
screens/insights.js  renderInsights    + screens/insights.css
screens/share.js     renderShare       + screens/share.css (including its @media print rules)
```

**Load order** in `index.html`: `<link>` tags for the five screen CSS files after the inline `<style>`. At the end of `<body>`: `mock-data.js` → `lib/insights.js` → `lib/charts.js` → the five `screens/*.js` → the inline app script (UTIL, STORE, sign-up, ROUTER, which starts the app last). Library and screen files only declare functions; they run nothing at load time and use UTIL, STORE and `go()` only inside those functions.

**Globals:** each `lib` or `screens` file declares only its own `function` names from §3 and the table below. Private helpers go inside an IIFE, or carry the file's prefix (`cap_`, `log_`, …). Screen CSS selectors start with the screen's class (`.screen-cap …`); each screen's root element carries that class.

Each section (inline or in its own file) has a banner comment (`/* ===== STORE ===== */`) and **one job**. Do not reach into another section's job or edit a file you don't own.

| Section | Owns | May not |
|---|---|---|
| STYLES (inline `<style>` + `screens/*.css`) | Inline: tokens, shell, nav, buttons, forms, base `@media print`. Each screen CSS: only that screen's look | Contain inline styles elsewhere (except SVG attributes); style another screen |
| SHELL markup | Header, banner slot, session-bar slot, `<main id="app">`, bottom nav, footer with Reset link | Contain screen content |
| UTIL | ids, date formatting/bucketing, HTML escaping | Touch the DOM or storage |
| STORE | Load / save / reset `localStorage`, current state, validation against §4, session start/end/pending, and a flag saying which banner (if any) applies | Render anything |
| INSIGHTS | `patternInsights(entries, md)`, `reliefBySetting(entries, md)`, `visibleSuggestions(patterns, md)`, `describeEntry(entry, md)`: pattern rules, relief by setting, which suggestions show, "Your logged headache" text | Touch the DOM or storage |
| CHARTS | `barChart({labels, values, title})`, `dotChart({points, yMax, title})`: build SVG strings from given numbers | Read state directly |
| SCREENS | One `render<Name>(appEl, params)` per route in §3. Read/write state only via STORE. Navigate only by calling ROUTER's `go(hash)` | Read or set `location.hash`, or read `localStorage` |
| ROUTER | Read the hash, apply the gate, call the screen, start the app. Also the shell's live parts: `go(hash)`, filling the banner slot from STORE's flag, the session bar and its once-a-second timer tick (including timer-done → `#/feedback`), the Reset link handler, and bottom-nav active/hidden state | Hold screen logic |

Escape any value put into HTML. Changing a data field means updating §4 here, then `mock-data.js`, then STORE, in that order.

## 6. How we check it works

Run all of these before calling a change done:

1. **Opens by double-click** in Chrome and Safari (or Firefox): no console errors, and nothing loaded besides the files in §5.
2. **No forbidden code:** this search over every code file finds nothing. It uses whole-word matching, so CSS `!important` doesn't count as `import`:
   `grep -nE '\bimport\b|\bexport\b|type="module"|fetch\(|XMLHttpRequest|https?://|xmlns' index.html mock-data.js lib/*.js screens/*`
3. **Banned words absent from UI text** (case-insensitive, including all text in `mock-data.js`): *causes, triggers, because, diagnos, abnormal, treat, cure, dose*. The required footer "Not a diagnosis." is the only allowed exception.
4. **PRD test cases (§9) pass by hand:**
   - Set zones, heat or cooling, and pressure → the mockup shows them.
   - One-tap log, then add details → "Your logged headache" appears.
   - End a session → give feedback → relief by setting updates.
   - Insights show each seeded pattern, and the 2-match rule does **not** show.
   - Share page → print preview shows charts and table, no nav.
5. **Rules hold:** a wrong code is rejected; every suggestion shows "Not medical advice."; any entry can be edited and deleted.
6. **Saving:** reload keeps new entries, Reset restores the mock data, and in a private window that blocks storage the app still runs with the banner.
7. **Phone width:** at 360 px there's no sideways scroll and every control can be tapped.

## 7. Decisions and assumptions

**Decided with the team:** `index.html` plus `mock-data.js`, with one JS and one CSS file per screen and separate files for insights and charts (§5); save in the browser; printable share page; water and caffeine as counts; activity from a fixed list; feedback as helped / didn't / not sure plus duration ranges; prevention suggestion text drafted by Claude and reviewed by the team; feedback Save creates the entry and a pending session waits for Save or Discard (§3); relief by setting credits a method's rating to every zone that used it, with "not sure" in the denominator (§4.5); `high_caffeine` is the seed's 2-match rule (§4.4); one parallel builder per file.

**Defaults the team approved:** pain 0–10; the five symptoms listed above; timer 10/20/30 min; patterns need 3+ matches; codes listed in mock data; hand-drawn SVG charts.

**Assumed by Claude, not yet confirmed (change freely):**
- Inputs: screen time entered in hours; side is set per zone (one setting for a zone, not separate left and right settings); pain picked from a row of 0–10 buttons.
- Insight rules: thresholds of 6 h screen time, ≤3 glasses of water, and 3+ caffeinated drinks; time-of-day buckets as in §4.5; patterns use `occurredAt`; ties go to list order; "Other" is never reported as a pattern.
- Sessions: a timer ending on any screen jumps to feedback; entries made from feedback start at the session start.
- Log screen: after a one-tap log, the app opens that entry; the log-only switch is on by default; delete asks to confirm; session zones are read-only when editing.
- Saved data: an entry that fails validation is dropped alone rather than resetting everything.
- Cap and sign-up: eye and ear coverings are drawn but not switchable; codes ignore case and spaces and are reusable after Reset.
- Mock data: seed dates 2026-09-07 to 2026-10-18 with a "sample entries" note.
- Share page: weeks start Monday; the relief chart shows only settings with 3+ rated sessions; the table columns as in §4.6.

**Still open in the PRD:** the final insight and suggestion wording. Anything else not covered here: ask, don't guess.
