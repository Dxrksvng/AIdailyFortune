# Selling readiness: what exists, what does not (2026-10-10)

**Audience:** the founder deciding when Celestra can take money. **Status:** POC; nothing below "Missing" is built.

## Built and tested (node --test)
- Calculation: Western tropical natal chart (Whole Sign), transits, experimental Vimshottari timing. Checked against astropy (<= 0.021 deg, 10 births) and historical timezone offsets (6 cases, tzdata).
- LLM layer: evidence rows with ids, OpenAI structured output, validator, template fallback, crisis routing, unknown-birth-time mode.
- Free-trial control: per-device and daily-call limits (`lib/quota.js`), consent required per request. State is in memory.
- UI: section "แม่หมอ AI" on `/chart` (deep reading with cited evidence, chat).

## Missing before charging anyone
| Area | Gap | Note |
|---|---|---|
| Accounts | none | Needed for paid entitlements; choose a provider, do not hand-roll auth. |
| Payments | none | Thai checkout (PromptPay / card) needs a payment-provider account and KYC; fees and availability must be checked with the provider. |
| Shared quota | in-memory only | On serverless each instance counts alone. Use a shared store (e.g. Redis/KV) before public launch. Set the OpenAI dashboard spend limit regardless. |
| PDPA | no privacy notice, no retention policy, no DPO decision | Birth date/time/place is personal data. Needs a notice, purpose per field, consent record, deletion path, and a vendor note for the LLM provider (data leaves Thailand). Legal review required; this repo is not legal advice. |
| LLM quality | never run against a live model | Measure how often the validator rejects output (fallback rate) on 20+ real charts before pricing deep reading. |
| Swiss Ephemeris | not compared | astropy cross-check only. pyswisseph install did not complete in this session. |
| Pluto, nodes, Placidus | Pluto unchecked; nodes and Placidus not implemented | |
| Thai astrology (Thaksa, Thai chart) | not implemented | The Thaksa day-to-position table could not be verified from a source in this session; do not ship it from memory. Obtain a cited text or an expert first. |
| Human fortune-teller calls | design only | Separate product: booking, payment, recording consent, practitioner vetting. |
| Claims | | Sell as entertainment and reflection. Do not claim accuracy or prediction. |

## Free trial policy (current defaults)
1 AI deep reading and 5 AI chat turns per device per day; 200 AI calls per day overall (`AI_FREE_READINGS`, `AI_FREE_CHAT_TURNS`, `AI_DAILY_CALLS`). Beyond that the user still gets the calculated evidence, without the LLM.
