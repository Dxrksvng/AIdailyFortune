# AI design

The LLM input contains a validated theme, supporting signal IDs/descriptions, permitted action category, language and tone. It excludes free-text reflections and unnecessary identity data. The output contract is `signal`, `reading`, `why`, `action`, `reflection_prompt` with field length limits.

For question readings, the model may receive a minimized question and a frozen method result only after user notice/choice. It must answer the user's actual intent with a calibrated possibility, known unknowns, and controllable preparation. It cannot infer a hiring decision, another person's feelings, future exact date or deity assignment from cards or charts. Tarot card IDs/positions and I Ching hexagram/line IDs are fixed before narrative generation.

Validation checks JSON schema, source/rule grounding, uncertainty language, and prohibited high-stakes directives. A failed output gets at most one retry, then approved static wording. Store prompt/model versions and the final displayed content. Review sampled outputs for unsupported claims and unsafe advice. Subjective relevance is a user-value measure, not prediction accuracy.
