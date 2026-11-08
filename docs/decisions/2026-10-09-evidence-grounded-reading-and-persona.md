# Evidence-grounded deep reading and AI persona (POC)

**What changed:** added `poc/lib/reading.js`, `POST /api/deep-reading` and `POST /api/persona-chat`. Engine output (natal placements, aspects, today's transits, Vimshottari period, Jupiter/Saturn contacts) becomes a list of evidence rows with ids. The LLM (OpenAI, `OPENAI_API_KEY`, default `gpt-4o-mini`, free-trial key) writes the fortune-teller voice and must cite ids.

**Why:** calculation stays in code, wording in the LLM. A validator rejects unknown ids, zodiac signs absent from the cited rows, and certainty or high-stakes wording; rejected output falls back to a template built from the same rows. Crisis wording (also in chat history) returns the support panel without any model call.

**Affected:** `server.js` (two routes, 16 KB body cap on them), `test/reading.test.js` (7 tests, fake fetcher; no real OpenAI call was made, so live output quality is unverified). Requires `consent: true` per request; nothing is stored.

**Human fortune-teller call (design only, not built):** the persona is labelled AI. A paid call with a real person is a separate product; the existing price anchor is Star360 at 199 THB per 15 minutes (search result, unconfirmed). Needs booking, payment, recording consent under PDPA and a practitioner policy; none of this exists.

**Not yet selling-ready:** no place-name geocoding (lat/long typed by user), no Thai astrology (Thai chart, Thaksa), no accounts or payments, no UI page for these endpoints, Vedic layer unvalidated by a specialist, no live-model eval of groundedness.

**Next:** UI page with place search; eval set for groundedness; decide data retention before accounts.

## Update: reference check and unknown birth time (2026-10-09)

**What changed:** `poc/test/natal-reference.test.js` compares the engine with astropy (builtin ephemeris) for 10 births in 5 time zones: worst difference 0.021 deg (Saturn, 2003-12-25) on 9 bodies plus Ascendant and MC; tolerance in the test is 0.05 deg. Pluto is not covered (astropy builtin lacks it). Ascendant/MC use the same formula as the engine, so they only check sidereal time and obliquity. **Not yet compared with Swiss Ephemeris or astro.com**; do that before claiming parity with them.
`birthProfile.birthTimeKnown:false` now removes Ascendant, Midheaven, houses, Vedic periods, and the Moon when its sign could change that day, and adds an evidence row stating the limit.

**What's next:** Swiss Ephemeris comparison, historical timezone cases (pre-1970 Thailand), place search UI, Placidus option, groundedness eval with a live model.

## Update 2026-10-10: quota, UI, historical timezones
Added `lib/quota.js` (limits above), server wiring on both routes with refund when no model output was accepted, the `/chart` section "แม่หมอ AI" (`public/js/reading.js`), `test/timezone-history.test.js` (Bangkok LMT +6:42:04 until 1920-04-01, London BST 1968-71, cross-checked with zoneinfo) and API tests. See `docs/architecture/selling-readiness.md` for what is still missing.
