# PRD: Headache Comfort Cap + App (Class Prototype)

ENT 401 | Ayden Facer & Kayla Whitmer

**Pitch:** A premium headache comfort cap that delivers heat, cooling, and pressure to the spots that hurt, paired with a free app that learns which settings help you and shows your headache patterns.

## 1. Problem

Working professionals with frequent headaches piece together relief from separate items (pills, an ice pack, a sleep mask, earplugs, a dark room). That takes effort, can't target the exact spot that hurts, and gives no way to see what triggers their headaches or what helps. Headaches also make it hard to focus, so people fall behind at work or school (7 of 17 survey respondents named this their biggest annoyance).

### Root causes

- Relief comes in separate pieces: cold, heat, darkness, and quiet all come from different items.
- Gel caps and ice packs treat the whole head the same and can't target the temples or behind the ears.
- Tracking is separate from relief, so people never learn what works for them. 14 of 17 respondents had never tracked their headaches.
- Pills only cover the pain, and people don't want to rely on them often.

**Scale:** In the CDC's 2018 survey, 25.5% of women and 12.3% of men aged 18 to 44 had a severe headache or migraine in the past 3 months. Rates decline with age, so our 35-and-older target is smaller than that figure suggests. We still need the CDC's numbers for ages 45 to 64. Verify before presenting.

## 2. Users

**Primary:** Working professionals (upper middle class), ages 35 and older, who get headaches about once a week or more, including people with chronic migraine. Their days are busy and screen-heavy, they want to rest and recover at home, they are comfortable with a phone app, and they will pay about $200 for something that works.

**Secondary:** A doctor who receives a file the user chooses to send.

## 3. Bet structure

- **Opportunity:** Many adults have frequent headaches, yet today's options are cheap one-size gel caps (about $30), free trackers, and a few pricey devices. We found nothing that links per-zone relief with logging.
- **Strategy:** Sell a premium cap (about $200) to adults 35 and older with weekly or more headaches. The app is free but works only with a cap (personal code in the box), so the cap is the only revenue. Fallback: if survey 2 shows the price fails, a simpler, cheaper cap with eye covers and a free tracking app.
- **Solution:** An electronic cap with eye and ear coverings and heat, cooling, and pressure in tappable zones, plus an app that logs headaches, records what helped, and shows observed patterns. For class, the cap is simulated and the app is real.
- **Fit:** This puts us at the premium end, away from the $30 price fight and the free-tracker crowd, and the cap-and-app loop creates data a standalone tracker can't.

## 4. Goals and metrics

| Goal | Metric | Baseline (survey 1) | Target (proposed) |
|---|---|---|---|
| Interest | Rated likelihood of use 4 or 5 out of 5 | 10 of 17 (59%) | Higher in the 35-and-older group |
| Willingness to pay | Answer to "Would you pay $199?" | 1 yes, 9 maybe, 7 no | Set before survey 2 (price ladder) |
| Logging | Would log after every use | 6 of 17 (35%) | After launch: at least half of cap sessions logged |
| Usability (app test) | Testers who complete a log unaided | Not tested | 8 of 10 |
| Usefulness (app test) | Testers rating insights 4 or 5 | Not tested | 7 of 10 |

After launch we would also track weekly active owners, Net Promoter Score, and return rate.

## 5. Requirements

### In scope (class prototype: real app, simulated cap)

- Account created with the personal code from the cap box
- Tappable head zones (eye area, temples, above the ears, behind the ears; one side or both; several at once)
- Heat or cooling plus pressure per zone, one level each, shown on a digital cap mockup; optional timer
- Quick log: minimum is "a headache occurred"; optional symptoms, pain intensity, activity, screen time (entered by the user), water, caffeine; a log-only switch for use without the cap
- Relief feedback after each session (did heat, cooling, or pressure help, and how long the headache lasted)
- Rule-based insights: "Your logged headache," "Observed Patterns," and a relief-by-setting insight, worded as observations only
- Prevention suggestions, each with a "not medical advice" disclaimer
- A share file of personalized charts for the user's doctor; edit and delete entries

**Build order (proposed, from survey 1):** spot-specific heat or cooling, light blocking, pressure, and tracking first; the settings insight and sound blocking later.

### Out of scope (what we are skipping)

Real hardware (electronics, Bluetooth, battery); massage; live AI; daily check-ins; automatic screen time capture; diagnosing or judging whether a headache is abnormal; use by children; push notifications; medication advice; purchasing.

### Designs and architecture

Screens are sign-up with the code, head diagram and controls, log, feedback, insights, and share file, plus a cap mockup. The prototype is built with Claude as a web or phone app (to be decided), with rule-based insights and logs kept on the device. The production concept (not built) is a cap with heating and cooling elements, pressure, a battery, and a Bluetooth link.

## 6. Risks and assumptions

| Risk or assumption | Probability | Consequence | How we test or reduce it |
|---|---|---|---|
| Buyers won't pay about $200 when gel caps cost about $30 and pills are cheap | High (1 of 17 said yes to $199) | High | Survey 2 with price-ladder questions; position as a complement; cheaper-cap fallback |
| Survey 1 missed our 35-and-older target (4 of 17, all 45+), and CDC rates fall with age | High | Medium | Survey 2 of 10 to 15 adults 35 and older; size the segment |
| The hardware is uncomfortable (bulky, especially lying down) | Medium to high | High | Comfort test with a physical mock-up; add padding |
| Heating and cooling can't be made safe and long-lasting on a battery | Medium | High | Set safe limits; verify with an engineer or supplier |
| People won't log consistently (6 of 17 would every time) | Medium to high | Medium | One-tap minimum log; track share of sessions logged |
| Unit cost or tariffs make the price unworkable, and the cap is our only revenue | Medium | High | Get supplier quotes before pricing |
| Regulation and prior art (heating device on skin, health data, older patents, Prolivio) | Medium | High | Comfort-only wording, no diagnosis, data on device; check safety rules and patents (we are not lawyers) |

Probability and consequence ratings are our own estimates.

## 7. Design research

| Alternative | What it does | What we learn and the gap |
|---|---|---|
| Tracking apps (Migraine Buddy, N1-Headache, Migraine Insight) | Log triggers and symptoms; doctor reports | Table stakes for our app; none link to a relief device |
| Gel caps (TheraICE) | Frozen or microwaved; some block light | Price anchor of about $30; darkness alone isn't a differentiator; no per-zone control, sound blocking, or logging |
| Prolivio (2017) | Cooling headband with a trigger-tracking app | Cooling plus an app has been tried; check what happened; cooling only |
| Cefaly | Electrical-pulse headband, roughly $390 to $510 | Buyers pay hundreds for headache devices, which supports a premium; different category |
| Pain relievers | Fast, cheap, familiar | Our biggest rival, so we position as a complement for the rest period |

**Our edge:** per-zone heat, cooling, and pressure plus eye and ear coverings, logged in one flow so the app knows which settings helped. Verify availability and prices before presenting.

## 8. User feedback and design changes

Survey 1 (17 responses: 11 aged 18 to 24, 4 aged 45 and older, 1 aged 25 to 34, 1 under 18) is an early signal from mostly students.

| What we heard | Design change |
|---|---|
| 15 of 17 spent under $20 on headaches; only 1 of 17 said yes to $199 | Changed the target to adults 35 and older with weekly or more headaches; added a cheaper-cap fallback; survey 2 uses a price ladder |
| The 4 respondents aged 45 and older all said "maybe" | Set the target age to 35 and older (small sample; confirm in survey 2) |
| Most wanted: spot-specific heat or cooling (9), blocking light (8), pressure (7), tracking (7); fewer wanted the settings insight (4) and sound blocking (3) | Proposed build order follows this ranking; the settings insight and sound blocking come later |
| 14 of 17 never tracked headaches; 6 would log every time | Logging stays optional with a one-tap minimum; added a logging-rate metric |
| Friends and classmates would use it to understand their patterns | Kept pattern tracking as a core feature |

App test comments will be added after testing.

## 9. Test plan

- **Survey 2:** 10 to 15 adults 35 and older who get headaches weekly or more. Ask the full price ladder (too cheap to trust, a bargain, getting expensive, too expensive) plus likelihood, feature, and logging questions. Results show stated intent, not purchase.
- **App test:** 10 friends and family (at least 5 with frequent headaches) use the real app with a simulated cap. Nobody wears the cap, so it tests usability and insights, not relief.

| Test case | Expected result | Pass criterion |
|---|---|---|
| Set zones, heat or cooling, and pressure for a given location | Mockup shows the settings | 8 of 10 unaided |
| Log a headache (minimum, then with details) | Entry saved and "Your logged headache" appears | 8 of 10 unaided |
| Give relief feedback after a session | Feedback saved and insights update | 8 of 10 unaided |
| Find Observed Patterns | Tester describes one pattern | 7 of 10 |
| Generate the share file | File with charts is produced | 8 of 10 unaided |

**Monitoring:** During the test, an observer records completion, time, errors, and quotes, which go into the feedback table. After launch we would track the share of cap sessions logged, weekly active owners, 30-day retention, Net Promoter Score, and return rate.

**Rethink the idea if:** fewer than half find the insights useful, most say they would just take pills, or survey 2 respondents won't pay near $200 (then use the cheaper-cap fallback).
