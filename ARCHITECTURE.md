# Architecture — 4.3

`Web → API → reading orchestrator → cached astronomical context + optional profile → versioned interpretation rules → structured context → LLM → schema/grounding/safety validator → store → web → optional reflection`.

For multiple methods, prepend `explicit intent/horizon/domain → router → method adapter`. Western produces calculated positions/chart and versioned rule outcomes. Tarot produces a cryptographic draw and reviewed card catalog references. I Ching produces a generated hexagram, changing-line set and transformed hexagram; Vedic adds sidereal chart/dasha only after expert review. All adapters return a common structured reading context with method, source IDs, rule/catalog version, limitations and allowed action categories. The LLM communicates that context rather than creating a method result.

The API handles session validation and access control. The orchestrator uses a pinned local ephemeris/calculation configuration and a date/timezone policy. The rule engine emits IDs and a structured theme; it does not rely on the LLM for method decisions. The LLM only writes text. Store one reading per subject/local date/methodology version, with source, rule, prompt and model versions. A changed timezone takes effect on the next reading day to avoid duplicate draws.

Shared daily source context can be precomputed and cached. POC generation is on demand. Production may add a scheduler and workers for consented notifications; notification status is separate from reading creation.

Failure flow: calculation failure → verified cache or graceful unavailability; LLM timeout/invalid schema/unsafe text → one bounded retry then approved template; storage failure → do not claim a reading was saved; notification failure → reading stays available in app. Emit latency, error, fallback and cost metrics without journaling private text.

Question flow: raw question stays ephemeral by default; intent classifier may suggest a mode, but the user may override. For Tarot, draw cards without replacement, freeze selected IDs before interpretation and display draw provenance. Do not recompute a new draw on LLM retry. For a hybrid reading, retain each method's separate provenance; do not turn combined symbolism into a probability of an event.
