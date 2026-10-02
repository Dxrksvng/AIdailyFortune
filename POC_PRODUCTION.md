# POC to production

| Area | POC | Production consideration |
|---|---|---|
| Client | Responsive web | Web/mobile if demand supports it |
| Identity | Browser-local guest flow only | Auth, consent and access control |
| Fortune method | Daily lunar-phase/Sun-sign-lite plus 22-card Major Arcana Tarot | Full Western chart, 78-card Tarot, I Ching, then expert-reviewed Vedic timing |
| Source | Pinned local `astronomy-engine` calculation | Coverage checks, cache, operational refresh |
| AI | Controlled template with optional structured LLM wording; live provider call unverified | Grounded structured LLM output, eval gate, fallback |
| Storage | Browser localStorage only | Relational database, encryption, deletion, retention and backups |
| Generation | On demand | Scheduler/workers for opt-in reminders |
| Operations | Logs and manual review | Tracing, alerts, cost limits, staged rollout |

The POC also includes a decorative WebGL landing scene, an honest loading transition, an Ask Oracle router to daily/Tarot, and an I Ching visual preview clearly marked as unimplemented. See [UX_INFORMATION_ARCHITECTURE.md](UX_INFORMATION_ARCHITECTURE.md) for the complete product map and six-screen presentation flow.

POC success means the complete source → rule → narrative → safety → reflection loop works and users understand it. Scale is a later concern.
