# Assignment 4 progress

- [x] M0 — Read official question 4, page 11.
- [x] M1 — Define Daily Compass and user loop.
- [x] M2 — Verify Co–Star, CHANI and Faladdin official pages (1 October 2026).
- [x] M3 — Prioritize features for 4.1.
- [x] M4 — Position the complete loop without unsupported competitor claims.
- [x] M5 — Separate astronomy, interpretive rules and narrative AI.
- [x] M6 — Document blueprint, consistency and failure paths.
- [x] M7 — Document data purpose and ERD.
- [x] M8 — Define safety framing and fallback.
- [x] M9 — Define product, AI, safety, reliability and cost metrics.
- [x] M10 — Separate POC from production.
- [x] M11 — Draft explicit 4.1–4.5 answer in `ANSWER.md`.
- [x] M12 — Final consistency QA: official wording, source claims, data scope, ER cardinality and failure paths checked. Mermaid rendering remains a viewer concern.

## POC delivery

- [x] Responsive four-screen POC implemented with local astronomy calculation and versioned rules.
- [x] Four PNG mockups exported from the running browser UI.
- [x] Unit and HTTP API checks passed; see `poc/test/compass.test.js`.
- [x] Optional OpenAI narrative path implemented with structured output, timeout, validation and template fallback; mocked-provider test passed. Live API call not exercised.
- [x] Method suitability, question routing, common question catalog and staged roadmap documented.
- [x] Tarot question POC with cryptographic draw, five spreads and card reveal; browser screenshots regenerated. (Correction, 2 Oct 2026: the draw uses the 22 Major Arcana only; the 78-card catalog is data and the 56 Minor cards are never drawn.)
- [x] Celestial Intelligence visual direction applied to landing, onboarding, dashboard, Ask Oracle and Tarot; product IA documents 14 experiences and six priority screens.
- [x] WebGL scene is decorative and distinct from calculated reading data; reduced-motion and CSS fallback paths added.
- [x] Record the 12 image references and six requested motion/layout techniques in `WEB_PLAN.md` and implement them in the web POC using original styling.
- [x] Add stateless system API for period/topic readings, question routing, Tarot question reading and I Ching line casting; document exact capability limits in `SYSTEM_STATUS.md`.
- [x] Earlier system milestone passed 11 API/engine checks (npm test); these ran before the latest natal/transit and King Wen additions.
- [x] Expand the system Tarot data to a 78-card compositional catalog and add career/study/money/relationship/general spreads; syntax checks passed. (Correction, 2 Oct 2026: only the 22 Major Arcana are drawn.)
- [x] Add the first Western tropical natal calculation API, including DST-safe local time handling and an explicit Whole Sign house convention.
- [x] Map I Ching three-coin casts to primary/resulting King Wen hexagrams with original short theme prompts.
- [x] Add I Ching changing-line position prompts and source/method provenance to the reading response.
- [x] Connect optional birth profile to sampled topic/horizon readings through relevant natal transit contacts.
- [x] Add an experimental Vedic timing endpoint for sidereal placements, nakshatra/pada and Vimshottari Mahadasha; disclose approximation and validation limits.
- [x] Keep exact birth date/time/location out of the natal API response; stateless request only.
- [x] Run syntax checks on the changed JavaScript modules.
- [ ] Compare Western and Vedic outputs against independent chart fixtures; review Tarot tradition meanings and I Ching line-text sources before adding deeper interpretations.
- [x] Build API-connected web flows for period/topic readings, Ask, Tarot (22 Major Arcana), Western natal chart and related pages. (Correction, 2 Oct 2026: I Ching and Vedic timing exist as API endpoints only, not as web pages.)
- [x] Add responsive styling, reduced-motion behavior, scrollytelling reveals, parallax/WebGL hero and data-driven result panels.
- [x] Adapt the supplied generated video as an additional visual reference: add original constellation/nebula detail to the WebGL hero; document dashboard/mobile/timeline patterns without copying its branded product screens.
- [x] Verify primary desktop browser flows and mobile landing/daily layout in Playwright; regenerate visual screenshots.
- [ ] Compare Western and Vedic outputs against independent chart fixtures; review Tarot tradition meanings and I Ching line-text sources before deeper interpretations.
- [ ] Expand representative Thai/English question and safety evaluations.
