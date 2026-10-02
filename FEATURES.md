# Feature priority — 4.1

| Stage | Feature | Reason |
|---|---|---|
| POC | General and optional local Sun-sign mode | Test value with minimal data and no account. |
| POC | One stable Daily Compass per local day | Create a dependable ritual. |
| POC | Why this reading | Show source and rule provenance. |
| POC | One low-risk action | Make the theme usable. |
| POC | Evening reflection | Close the loop and collect explicit feedback. |
| POC | Tarot question, spread choice and card reveal | Answer a specific question through an explicit random draw and fixed card meanings. |
| MVP | Western natal chart and day/week/month/year horizons | Offer profile and period themes once precise birth-data handling and rules are reviewed. |
| MVP | Love/career/study/money filters; Tarot (22 Major Arcana in the POC); I Ching decisions | Cover common intents with method-specific outputs. |
| Production | History, opt-in reminders, deletion controls | Support repeat use and choice. |
| Advanced | Vedic timing and additional traditions | Require expert review and demand evidence. |

Birth time/place and full natal-chart interpretation are outside POC scope. Do not describe the date-only mode as a complete chart.

See [INTENT_ROUTER.md](INTENT_ROUTER.md) and [QUESTION_CATALOG.md](QUESTION_CATALOG.md) for the question-to-method map and answer patterns. “Lucky color”, harmless rituals and deity questions need clear cultural framing and user choice; no causal promises.

## Decision: the POC Tarot deck is the 22 Major Arcana (2026-10-02)

- **What.** Draws come from the 22 Major Arcana only (`lib/oracle.js`, `MAJOR_DECK`). The 56 Minor Arcana stay in `public/tarot.js` as written data (names, themes, Thai text, covered by a test) but are never drawn.
- **Why.** The approved prototype ships face art for the 22 majors and one card back only. A minor card drawn without a face would show a blank slot. Drawing from 22 keeps every drawn card illustrated and matches `MAJOR_ARCANA.length === 22` in `test/compass.test.js`.
- **Alternative rejected.** Commission 56 more illustrations before the POC. Cost and time are not justified before the daily ritual itself is validated.
- **Consequence.** Three-card spreads draw from 22 cards, so repeats across days are common. Reintroducing the minors later only needs art in `public/assets/cards/` and removing the filter.

## Decision: deterministic draw, one reshuffle per topic per day

- The shuffle is seeded by `sha256(date|topic|spread|reshuffle)` (counter-mode stream, Fisher-Yates), so the same inputs always return the same cards. The question text is **not** part of the seed.
- Policy: one reshuffle per topic per local day. The stateless server only rejects `reshuffle > 1` (HTTP 400). The client keeps the count in `localStorage`, which is UI state: a modified client can request both decks, and a client can send any date. This is accepted for a POC with no accounts.

