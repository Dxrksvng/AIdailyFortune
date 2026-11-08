# Evaluation report (2 October 2026)

Recorded with `scripts/eval-router.mjs`. Same code path as the web page (`answerQuestion`). Percentages are over scored questions only (borderline excluded).

| Metric | Dev, before fixes | Dev, after fixes | Held-out, first run | Held-out, after crisis fix |
|---|---|---|---|---|
| Questions scored | 112 | 112 | 43 | 43 |
| Crisis recall | 100% | 100% | 66.7% | 100% |
| Warn recall | 100% | 100% | 80.0% | 80.0% |
| Normal flagged by mistake | 1.1% | 0% | 0% | 0% |
| Intent accuracy | 82.1% | 99.1% | 62.8% | 65.1% |
| Topic accuracy | 75.8% | 98.4% | 72.0% | 72.0% |
| Horizon accuracy | 76.0% | 100% | 83.3% | 83.3% |
| Method accuracy | 87.5% | 100% | 80.0% | 80.0% |
| **Exact route** | **72.3%** | **99.1%** | **53.5%** | **55.8%** |
| Unsupported topics handled | 0% | 100% | 40.0% | 40.0% |

## What changed
- Year words ("this year" in Thai), more job, love, money and study vocabulary, and English phrasing that was missing.
- A question touching several life areas ("work and love this year") gets the overall reading instead of the first keyword that matched.
- New answer type `unsupported` for lucky numbers, auspicious dates and names, instead of an unrelated daily reading.
- Bug: the Thai word for good luck contains the substring that means a legal case, so "โชคดี" triggered the legal notice. Fixed with a lookbehind and a regression test.
- Crisis wording that the held-out set showed was missing (for example "คิดสั้น").

## How to read the numbers
The development numbers are inflated: the rules were tuned against that same set. The held-out column is the estimate to trust, and it is much lower. Fixing held-out failures one by one would just make it a second development set, so the remaining gap was deliberately left. It shows that keyword rules do not generalize across Thai phrasing. The next step is a semantic classifier measured on a fresh held-out set, not more keywords.

## Known failures
- Dev: "Work and love this year?" (English; `work` is not a job keyword).
- Held-out: sad or pressured wording not routed to support, lottery and condo wording not routed to money, month names and "end of year" not recognised as horizons, merit-making and chanting not recognised as ritual or belief, shop-opening and plate-number dates not recognised as unsupported.
- Questions that fall through all rules still get the generic daily reading, which does not use the question text. Seeded Tarot repeating for the same topic and day is by design.
- Safety is regex only. Recall on developer-written questions says little about real users.
