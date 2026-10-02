# High-level ERD — 4.4

The submission [ANSWER.md](ANSWER.md) contains the Mermaid ERD. This model supports a registered product; the current POC keeps only a daily snapshot and reflection in browser storage and does not save Tarot questions.

| Entity | Relationship and purpose |
|---|---|
| `USER` | 1 user → 0..1 preference, 0..1 optional fortune profile, many readings. |
| `FORTUNE_PROFILE` | Derived Sun sign or, only with full-chart consent, exact birth date/time/place and precision metadata. Tarot and I Ching do not require it. |
| `READING` | One method, horizon and domain; source/rule/catalog versions, structured context and displayed content. Daily readings are uniquely constrained by user/date/method version. |
| `QUESTION_SESSION` | 0..1 per reading; intent plus optional saved question text. Default should be ephemeral. |
| `TAROT_DRAW` | 0..N per reading; position, card ID, orientation if enabled, catalog version. Unique `(reading_id, position)`. |
| `HEXAGRAM_CAST` | 0..1 per reading; primary/changed hexagram and changing lines with text version. No cast until the I Ching mode exists. |
| `FEEDBACK` | 0..1 per reading; relevance/usefulness and optional private note. |

Store the source result and versions for reproducibility, but not a claim of objective predictive accuracy. Keep exact birth and free-text question/reflection data optional, access controlled and deletable. Religion or deity preference is not stored by default. Catalogs and rule definitions are versioned application data, not per-user tables. If a question is ephemeral, omit `QUESTION_SESSION.optional_question_text` while still allowing a non-sensitive intent code.
