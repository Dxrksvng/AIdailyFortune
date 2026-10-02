# 2026-10-02 Celestra: prototype port

**What changed.** `poc/public` rebuilt from the approved prototype (design/prototype/index.html, copied from the shared artifact): sticky nav, hero ask box, today bento, consultant answer, tarot table with fan and flip, birth chart + wheel + yearly timeline, weekday colours, honesty and care sections, footer consent and wipe. Site renamed Celestra with the supplied logo.
**Server.** New `lib/safety.js` (crisis/warn), seeded tarot (22 majors, one reshuffle per topic per day), consent-gated Thai/English LLM rephrasing, `/api/today`, `/api/tarot`, `/api/safety`.
**Why.** Prototype's client-side answer/route/moonAngle were mockups; every reading now comes from the API. Same cards for the same day and topic.
**Affected.** EN toggle and separate Years/Ritual/Guide screens removed; i18n.js, content.js and five old stylesheets deleted. `npm run capture` replaced.
**Open.** Hotline 1323 and Thai weekday colour/posture mapping unverified; font OFL texts not yet bundled; hero.webp is 132 KB (not a card); Vedic layer awaits expert review; PDF A4 still tarot-only and out of sync.
