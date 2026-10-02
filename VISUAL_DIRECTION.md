# Celestial Intelligence visual direction

The implemented POC uses a near-black base (`#05040A`), warm solar gold, restrained indigo, oversized editorial type and thin translucent panels. The hero is a procedural Three.js solar scene; all text and controls remain HTML so they are editable, accessible and responsive. Orbit paths and stars in the hero are decorative, **not** the calculated source data for a reading. The Daily dashboard labels its schematic wheel separately from the actual calculated Sun–Moon angle.

This direction was informed by the user's references and the [MotionSites 3D workflow](https://motionsites.ai/lesson/astra-6-build-3d-websites-for-beginners) and [scroll design guidance](https://motionsites.ai/lesson/build-scroll-animated-website-with-ai); the layout, copy and scene are original to Daily Compass.

## Motion system

- Slow planetary orbit, small pointer parallax and camera approach across landing scroll.
- Three lightweight star layers in the WebGL scene.
- Tarot cards flip on reveal; the draw outcome is selected before animation.
- Loading view describes the actual daily calculation/rule preparation only.
- `prefers-reduced-motion` minimizes animation; a CSS scene is shown if WebGL is unavailable.
- On smaller screens, the hero copy remains readable and the dashboard stacks vertically.

## Interface rules

- No fake energy percentages, scientific accuracy gauges or invented birth-chart positions.
- “Planned” labels appear for topic filters without implemented rules; I Ching is a roadmap preview.
- Tarot question text stays in the browser, and the full-chart onboarding burden is deferred until the method needs it.
- Favor high-contrast text and visible button labels over decorative symbols alone.
