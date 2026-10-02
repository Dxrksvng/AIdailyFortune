# Metrics — 4.5

**North star:** weekly returning Compass users = distinct users who complete a reading in a week and another the following week. Separate guest sessions from registered users because guest cross-device identity is unknown.

| Dimension | Definition |
|---|---|
| Activation | Share completing a first displayed reading; time to first result. |
| Retention | D1/D7/D30 returns by first-reading cohort. |
| Engagement | Reading completion, Why expansion, action save, evening reflection. |
| User value | Relevance/usefulness distribution and feedback response rate to expose selection bias. |
| AI quality | Schema-valid %, grounded-signal %, sampled unsupported-claim rate, fallback %. |
| Safety | Fixed-set high-stakes violation rate, blocked output rate, user reports. |
| System | Generation success, API errors, P50/P95 latency, job/notification failure. |
| Cost | AI cost per completed reading, compute cost per active user, shared-context cache hit rate. |

No actual results or arbitrary targets exist yet. Gather pilot baselines. Safety and reliability are release gates. “It came true” is subjective feedback, not objective astrology accuracy.

For a multi-method product, segment every value and safety KPI by method, horizon and domain. Add intent-to-answer completion, Tarot draw/reveal completion, question-answer usefulness, method override rate and privacy opt-in rate. Watch for negative outcomes such as excessive repeated draws, notification opt-outs or content reports; do not reward fear-based engagement.
