<div align="center">

# Celestra · Daily Compass

**A calm daily-reflection ritual built on calculated signals, versioned rules and safe, grounded wording.**

![Status POC](https://img.shields.io/badge/Status-POC-F59E0B?style=for-the-badge) ![Node npm](https://img.shields.io/badge/Node-npm-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) ![Astronomy astronomy-engine](https://img.shields.io/badge/Astronomy-astronomy--engine-4F46E5?style=for-the-badge) ![Privacy no server storage](https://img.shields.io/badge/Privacy-no_server_storage-2ea44f?style=for-the-badge)

</div>

> A proof of concept, not a production account system. Astrology-inspired meanings are interpretive and never presented as prediction.

## Tech stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=nodejs,js,html,css,threejs&perline=10" alt="Tech stack" />
</p>

## Reading pipeline

```mermaid
flowchart LR
    W["Web (Three.js hero, accessible HTML)"] --> API["Stateless API\n/api/period, /api/ask,\n/api/natal-chart, /api/capabilities"]
    API --> R["Router\nintent, horizon, domain"]
    R --> M1["Western\nastronomy-engine ephemeris"]
    R --> M2["Tarot\nseeded draw, 22 Major Arcana"]
    R --> M3["I Ching\ncoin casts, King Wen"]
    M1 --> C["Structured reading context\nsource IDs, rule version, limits"]
    M2 --> C
    M3 --> C
    C --> N["Narrative\napproved template\n(optional LLM wording)"]
    N --> V{{"Schema, grounding\nand safety validator"}}
    V -- "pass" --> W
    V -- "fail or timeout" --> T["Approved template fallback"]
    T --> W
    W --> L[("Browser localStorage\ndaily snapshot + reflection")]
```

## Where to read more

| Document | Topic |
|---|---|
| [`PRODUCT_CONCEPT.md`](PRODUCT_CONCEPT.md) | Signal, why, action, reflection loop |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Full reading flow, failure handling, question flow |
| [`SAFETY.md`](SAFETY.md) and [`DATA_PRIVACY.md`](DATA_PRIVACY.md) | Boundaries for high-stakes questions and personal data |
| [`WEB_PLAN.md`](WEB_PLAN.md) | Pages, data contracts and implementation priority |
| [`poc/README.md`](poc/README.md) | Run it: `npm install`, `npm start`, open `http://localhost:4174` |

---

