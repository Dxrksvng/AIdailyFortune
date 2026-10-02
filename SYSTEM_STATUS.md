# System-first delivery status

The web plan is in `WEB_PLAN.md`. This file tracks the engine/API separately so visual mockups cannot be mistaken for working fortune methods.

| Capability | Status | Evidence / limit |
|---|---|---|
| Daily lunar calculation and four versioned interpretation rules | Working POC | `poc/lib/compass.js`; calculated local-noon Sun–Moon phase. |
| Day/week/month/year topic reading | Working bounded prototype | `GET /api/period` returns 1/7/30/365-day sampled lunar themes. `POST /api/period` can add natal transit contacts for the supplied profile; this is not a complete event forecast. |
| Question routing, method override and common Thai/English patterns | Working rule-based prototype | `poc/lib/oracle.js`; explicit route metadata and Thai summary for Thai questions. Natural-language coverage is limited. |
| Job, former-partner, A/B, color/remedy and deity answer policies | Working bounded prototype | The system gives symbolic possibilities and controllable actions, never another person's private thoughts, guaranteed hiring, magic color effects or assigned deity. |
| Tarot | Working POC | API has 78 cards (22 Major + 56 Minor), compositional suit/rank meanings, crypto draw without replacement, and general/career/study/money/relationship spreads. Existing browser UI still displays its 22-card subset. |
| I Ching casting and hexagram identification | Working calculation prototype | Three crypto coin bits × six lines map to 64 King Wen hexagrams; changing lines produce a transformed hexagram and generic position prompts. Original theme prompts are included; no translated judgement/line text is copied. |
| Optional AI narrative | Working only for original daily endpoint | Structured response validation and template fallback; live provider call not exercised. |
| Privacy | Working POC behavior | Question API is stateless, not echoed; no server DB. Existing web prototype uses browser local storage for daily snapshot/reflection. |
| Safety | Basic rule and output boundary | High-stakes question screen, bounded templates and narrative validator. Needs broader multilingual adversarial eval before production. |
| Western natal calculation | Working POC | POST /api/natal-chart: local date/time + IANA timezone + coordinates; geocentric tropical planet placements, Ascendant, MC, Whole Sign houses and major aspects. Ambiguous/nonexistent DST times are rejected. Not yet compared against external chart fixtures; other house systems/nodes excluded. |
| Canonical Tarot tradition review | Pending | The 78-card compositional catalog is implemented; tradition mapping, reversals and meanings need expert/editorial review before presenting it as canonical. |
| I Ching line texts | Pending | Hexagram identity and King Wen mapping are implemented; reviewed translation/line-specific interpretation is deferred. The system provides original general theme summaries only. |
| Vedic timing | Experimental POC | `POST /api/vedic-timing` returns sidereal placements, Moon nakshatra/pada and Vimshottari Mahadasha periods. Uses a mean Lahiri IAE 1989 approximation; convention/boundary validation by a specialist is still required. No Antardasha or event prediction. |
| Production account, consent, storage and notifications | Pending | Design only; not needed to validate the current engine. |

## Next engine milestones before page implementation

1. Review the compositional 78-card catalog against the intended tradition and decide whether reversed cards are in scope.
2. Compare natal placements, angles, houses and aspects against independent chart fixtures and document precision.
3. Validate the experimental Vedic output against trusted chart fixtures and a Vedic practitioner; do not present it as canonical until reviewed.
4. Add a reviewed I Ching edition/line-interpretation layer if licensing and editorial review support it.
5. Expand Thai and English intent/safety coverage from real user question examples.
6. Add persistence, deletion, consent and observability only when moving from POC to a registered product.

Vedic timing is now exposed as an experimental, stateless endpoint. It remains outside the validated product loop until its calculation conventions and interpretations are independently reviewed.
