# Product information architecture

The broad product map has fourteen experiences. Six are the key storytelling screens for an Assignment 4 mockup; a subset is functional in the POC. “Planned” below is a design proposal, not implemented functionality.

| Experience | Role | Status |
|---|---|---|
| Landing / Enter Your Universe | Positioning and first choice | **POC working** |
| Progressive onboarding | Guest or optional date-only Sun-sign focus | **POC working, two paths**; precise birth time/place later |
| Universe loading transition | Honest calculation state | **POC working** |
| Daily Compass dashboard | Daily theme and shortcuts | **POC working**; topic lenses labeled planned |
| Detailed reading / Why | Signal, source, rule and action | **POC working** |
| Interactive birth chart | Exact natal chart and transit layer | **MVP planned** |
| Tarot card experience | Ask, draw, reveal, interpret | **POC working** with 22 Major Arcana |
| I Ching experience | Decision/change reading | **Visual preview only**; engine planned for MVP |
| Ask Oracle | Question entry and explicit method choice | **POC working**; routes to Tarot or daily |
| 30-day timeline | Period themes | **MVP planned** |
| Journal / history | Past readings and reflections | **MVP planned**; one local reflection in POC |
| Profile / My Universe | Method data and privacy controls | **Production planned**; POC has local clear control |
| Notification return | Opt-in daily reminder | **Production planned** |
| Shareable reading card | User-selected, privacy-safe sharing | **Later** |

## Six-screen presentation flow

1. Landing: original 3D solar scene and core product promise.
2. Onboarding: minimal guest/date choice and privacy statement.
3. Daily dashboard: calculated theme with a clearly schematic orbit wheel.
4. Detailed reading/Why: source → interpretation → action.
5. Tarot: explicit spread and random card reveal.
6. Ask Oracle: user question and method choice.

The exported screenshots also include Reflection and an I Ching **preview** to show the loop and roadmap without claiming either is a full additional engine. Source files live under [`poc/mockups`](poc/mockups/).

## Navigation model

`Landing → Onboarding or Guest → Daily Dashboard → Reading/Why → Reflection`. A separate branch is `Landing/Dashboard → Ask Oracle → Tarot`; later `Ask Oracle → I Ching` and `Daily → Timeline`. `History/Profile` support return visits and data controls when registered storage exists.
