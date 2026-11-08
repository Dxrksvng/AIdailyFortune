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

- [x] Responsive POC implemented with local astronomy calculation and versioned rules (first built as four screens; since rebuilt as one page per feature, see 2026-10-02 below).
- [x] Four PNG mockups exported from the running browser UI (superseded: current screenshots are generated into `design/screens/` by `npm run capture`; `poc/mockups/` is the older set).
- [x] Unit and HTTP API checks passed; see `poc/test/compass.test.js`.
- [x] Optional OpenAI narrative path implemented with structured output, timeout, validation and template fallback; mocked-provider test passed. Live API call not exercised.
- [x] Method suitability, question routing, common question catalog and staged roadmap documented.
- [x] Tarot question POC with cryptographic draw, five spreads and card reveal; browser screenshots regenerated. (Correction, 2 Oct 2026: the draw uses the 22 Major Arcana only; the 78-card catalog is data and the 56 Minor cards are never drawn.)
- [x] Celestial Intelligence visual direction applied to landing, onboarding, dashboard, Ask Oracle and Tarot; product IA documents 14 experiences and six priority screens (a planning document: not all 14 are built; the UI has since been replaced by the Celestra prototype port).
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
- [ ] Expand representative Thai/English question and safety evaluations. Started (see 2026-10-02): the labelled sets exist, but the router is still weak on held-out wording.

## 2026-10-02: Celestra prototype port, one page per feature

- [x] Rebuild `poc/public` from the approved prototype (`design/prototype/index.html`); every reading comes from the API, the prototype's client-side mock answer/route/moon code is not used. Site renamed Celestra with the supplied logo.
- [x] Self-host Noto Serif Thai, Anuphan and IBM Plex Mono (`public/fonts`, sources in `LICENSES.md`); no request to Google Fonts. The OFL licence texts are not bundled yet.
- [x] Split the single long page into `/`, `/today`, `/ask`, `/tarot`, `/chart`, `/ritual`, `/honest` and `/care`, with shared nav and footer partials included by the server.
- [x] `lib/safety.js`: a crisis returns only the support panel (hotline 1323, flagged unverified); lottery, health, money, legal and death questions get a reading plus `answer.safety.notice`.
- [x] Seeded, repeatable Tarot draw from `date|topic|spread|reshuffle`, 22 Major Arcana only, one reshuffle per topic per day. The server only caps `reshuffle`; the count is client state.
- [x] Tarot page: large fan, picked cards fly face down into the slots, a "predict" button flips them and then shows the reading.
- [x] LLM wording is consent-gated (`ai=1` plus an API key) and now covers Thai text; verified only with a mocked provider, never against the live API.
- [x] Birth place presets include Chon Buri and Si Racha, plus custom coordinates and timezone (added in a parallel web session; commits `98b15e8`, `e0d375f`).
- [x] Scrollytelling home with four compressed muted video scenes (commit `e71e2aa`, parallel web session; the files are in `public/assets/video`; not visually re-checked here).
- [x] `npm run capture`: real-browser checks of every page at 1280 and 390 (overflow, console errors, no external requests, crisis/warn, tarot determinism, reduced motion).
- [x] Labelled router evaluation (`poc/eval`, `npm run eval`): 112 development and 43 held-out Thai/English questions, written by the project author, not real user data. Re-run on 2026-10-02: development exact route 99.1%; held-out exact route 55.8%, warn recall 80%, unsupported handled 40%, crisis recall 100% on both. The development figure is optimistic because the router was tuned on it; trust the held-out one.
- [x] Added an "unsupported" answer type for lucky numbers, auspicious dates and names instead of a generic reading.
- [x] Assignment 4 answer extended with packages, price hypotheses, accuracy layers and business KPIs (TH and EN); prices and competitor prices are unverified hypotheses. Wording on the 22-card deck corrected in `ANSWER.md`.
- [ ] Router still falls back to a generic daily reading for questions no rule matches (e.g. forgiving a friend, "this year" across several topics); needs a semantic classifier or an LLM narrator that uses the question text.
- [ ] Semantic (non-regex) safety layer; the regex gate is the only gate today. Known miss, checked 2026-10-02: lottery wording such as "เลขท้ายสองตัววันนี้" is not caught by the warn gate and gets an ordinary reading.
- [ ] Verify 1323, the Thai weekday colour/posture mapping and the "popular belief" items against official or expert sources.
- [ ] Compare planetary positions with an independent reference (JPL Horizons or equivalent).
- [x] Server basics (commit `2fc22f8`, parallel web session): security headers (CSP, Referrer-Policy, Permissions-Policy), ETag/304 for HTML, JS and CSS, one-day cache for images, fonts and video, an in-memory per-address API rate limit (default 300/min, `RATE_LIMIT_PER_MIN`) and an opt-in request log (`LOG_REQUESTS=1`) that records paths only, never query strings. Verified by header tests; load speed in a browser not measured. Limits: the rate limit sees the proxy address behind a reverse proxy, and CSP keeps `'unsafe-inline'` for styles.
- [ ] Still missing for production: auth, a database, billing, and a trusted `X-Forwarded-For` for the rate limit.
- [ ] Reconcile the submitted PDF for question 4 (older tarot-only text) with the current web POC.
- [x] 2026-10-08 — Deploy the Celestra POC to Vercel at `https://poc-orpin-gamma.vercel.app/`; verify the home page, `/today`, `/health`, and `/api/capabilities` in production. Added the deployed POC to the portfolio's Selected Work section.
