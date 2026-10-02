# Daily Compass web design system

## Direction

Celestial Intelligence: an atmospheric editorial surface with real system output kept in readable HTML. The decorative solar scene never represents calculated planetary positions. The language is calm and non-deterministic; readings use themes, possibilities and user-controlled actions.

## Tokens

| Token | Value | Use |
|---|---|---|
| Space | `#05040A` | Page and deep background |
| Indigo | `#111522` | Secondary panels |
| Solar gold | `#E8B777` | Accent, focus, action |
| Text | `#F5F0E7` | Main copy |
| Muted | `#B9B9C5` | Supporting copy |
| Glass | `rgba(17,20,33,.78)` | Selected panels/navigation |
| Hairline | `rgba(255,255,255,.12)` | Borders and separators |
| Radius | `6px` | Interactive and content panels |

Typography pairs Space Grotesk for the oversized hero and DM Sans for controls/body, with Playfair Display for selected editorial headings. Body copy remains at a readable size and is never animated.

## Responsive rules

- Desktop: two-column storytelling, asymmetric dashboard modules, compact sticky navigation.
- Tablet: wrap navigation and collapse the dashboard topic rail below the reading.
- Mobile: one-column content, full-width actions, two-column placement tiles and no horizontal overflow.
- All controls use visible keyboard focus, native labels and status/error text.

## Motion specification

| Effect | Implementation | Timing / fallback |
|---|---|---|
| Scrollytelling | Landing story chapters reveal as they enter view; scroll depth moves decorative camera | 500–700 ms; reduced-motion reveals immediately |
| Parallax | Three decorative star depths and a shallow pointer/camera offset | Low amplitude; disabled when reduced motion is requested |
| Micro-interactions | Button press, selected topic, validation, Tarot card reveal | 150–650 ms; state remains visible without motion |
| WebGL / 3D | Three.js solar system hero, Tarot flip; charts use data-driven HTML tiles | Low-power renderer; CSS hero fallback; static Tarot reveal for reduced motion |
| Bento grid | Dashboard period controls, orbit summary, topic lenses and reading panels | Semantic reading order becomes one column on mobile |
| Glassmorphism | Sticky navigation, dashboard and result surfaces | Restrained blur, solid fallback color and contrast-first copy |
| Kinetic typography | Hero headline and selected chapter headings enter with a short rise | One-time, 650 ms; disabled under `prefers-reduced-motion` |

## Product surfaces

1. Landing scrollytelling and direct entry points.
2. Optional birth details with explicit per-request consent.
3. Daily Compass with period/topic selectors and source explanation.
4. Ask Oracle with automatic or user-selected method.
5. Tarot draw/reveal and I Ching cast.
6. Western natal chart and experimental Vedic timing results.
7. Local-only reflection and deletion control.

Reference JPEGs in `AI Daily Fortune-Telling System/img/` and the 10-second `gemini_generated_video_fd535e22.mp4` inform composition only; they are not copied into the shipped interface. The video contributes three ideas: blue-indigo constellation fog for the hero, dense dashboard modules, and a compact mobile Oracle/timeline journey. The current Three.js scene now adds original, explicitly illustrative constellation lines and generated nebula sprites around the existing solar system. Its captured product screens and branding are not reused. Timeline exploration remains a later page because current period data is sampled, not an event calendar.
