# Daily Compass — web implementation plan and status

Status: Core API-connected browser flows are implemented and browser-verified. This remains a POC, not a production account system.

The 12 JPEGs and `gemini_generated_video_fd535e22.mp4` in `AI Daily Fortune-Telling System/img/` are **visual references**, not assets to copy or ship. They show useful patterns: constellation fog, a dark celestial dashboard, a legible natal wheel with a data panel, a tactile Tarot deck, a distinct I Ching hexagram view, mobile Oracle chat and a long-horizon timeline. The video informed an original generated nebula/constellation layer in the Three.js hero. The sample's logos, screens, text and numeric gauges are not reused; product data must be calculated or clearly labeled interpretive data.

## Design direction

Near-black `#05040A`, restrained indigo, warm solar gold, large editorial headings, thin glass borders, generous spacing. Decorative 3D space may support the landing experience; the actual chart, card result and hexagram must be rendered from system data. All primary text and controls stay accessible HTML. Provide reduced-motion and non-WebGL fallbacks.

## Pages and required system contracts

| Page | Main job | Data contract needed before page work |
|---|---|---|
| Landing | Explain Daily Compass and choose daily or question flow | Method availability and capability flags. |
| Onboarding | Guest or birth profile with optional time/place | Validation, consent, profile precision, deletion policy. Do not imply a full natal chart from date alone. |
| Daily dashboard | Show one grounded daily theme and topic shortcuts | `reading` with date, timezone, method/rule provenance and source data. |
| Period reading | Day/week/month/year, love/career/study/money | Explicit interval, topic, sampled source signals, interpretation and limits. |
| Birth chart | Wheel plus readable placements and aspect details | Natal API now returns geocentric tropical placements, Ascendant, Midheaven, Whole Sign houses and aspects. Validate against independent chart fixtures before showing precision claims. |
| Tarot | Question, spread, shuffle, reveal and response | Server or browser crypto draw, full card catalog, spread roles, no-repeat cards and question response contract. |
| I Ching | Six-line cast, changing lines and transformed state | API returns King Wen primary/resulting hexagrams and original reflection prompts. Defer classical judgement/line-text panels until an edition and usage rights are reviewed. |
| Ask Oracle | Route a common question to the right method | Intent, chosen method, override, answer, uncertainty and safe action. |
| Timeline | Explore month and year themes | Period readings with dates; never fabricate exact events. |
| Journal / profile | Revisit readings, reflection and data controls | Account/storage API, retention/deletion and privacy decisions. |

## Implementation priority

1. Daily dashboard + period reading + Ask Oracle: make the supported engine visible.
2. Tarot draw: cinematic animation starts **after** the random result is fixed.
3. Birth chart and I Ching: only after their calculation/text contracts are verified.
4. History, notifications and sharing: after storage and consent are implemented.

The `poc/public/` screens connect to supported system endpoints. Birth chart, I Ching and Vedic displays identify experimental/unvalidated boundaries in context. Timeline, journal/history, notifications, sharing and guest-to-account migration remain deferred because there is no account or server-side storage. Refer to `UX_INFORMATION_ARCHITECTURE.md` for the broader product map.

## Motion and layout specification for the later web phase

| Technique | Intended use | Constraint |
|---|---|---|
| Scrollytelling | Landing chapters: solar system → method selection → Daily Compass | Scroll moves the story; core actions remain reachable without completing the sequence. |
| Parallax scrolling | Slow, shallow depth in decorative stars and orbits | Small movement; disable with reduced motion. |
| Micro-interactions | Button feedback, selected topic, card draw/reveal, validation | State must be visible without animation. |
| WebGL / 3D experiences | Decorative celestial hero and optional chart interaction | A real chart uses calculated placements, not the hero's decorative objects; provide a 2D fallback. |
| Bento grid | Dashboard modules for daily reading, Tarot, I Ching and question entry | Preserve a logical reading order on mobile. |
| Glassmorphism | Navigation and selected panels | Restrained opacity/blur; maintain readable contrast. |
| Kinetic typography | Hero headline and section transitions | Never animate dense reading text; honor reduced motion. |

Design-system reference: [getdesign.md](https://getdesign.md/) describes reusable color, typography, spacing and component notes in a DESIGN.md format. Motion inspiration: [MotionSites](https://motionsites.ai/) provides landing and section references. Both are reference libraries; the Daily Compass design and content remain original. `DESIGN.md` records implementation tokens, responsive layouts, component states and motion constraints.
