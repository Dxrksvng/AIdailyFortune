# Router and safety evaluation

Two labelled sets, one script.

| File | Use | Rule |
|---|---|---|
| `questions.json` | Development: tune rules against it | 112 scored questions + 2 borderline |
| `heldout.json` | Honest estimate | Written after the first round of fixes, different wording, measured once before any tuning. Once its failures are fixed it becomes development data; write a new held-out set for the next round. |

```
npm run eval                                   # both sets, exits 1 below eval/thresholds.json
node scripts/eval-router.mjs                   # report for the development set
node scripts/eval-router.mjs --file eval/heldout.json
node scripts/eval-router.mjs --json out.json   # also write metrics and failures as JSON
```

**Caveats.** Labels were written by the developer from the question list in the assignment brief. They state what a good product should do; they are not user data and no Thai speaker outside the project has reviewed them. Fields left out of a label are not checked. Crisis recall is measured on questions the developer thought of, so it is an optimistic estimate, not a safety guarantee.

**Metrics.** `crisisRecall`, `warnRecall`, `normalFalsePositive` use `classify()` from `lib/safety.js`. `intent/topic/horizon/methodAccuracy` and `exactRoute` use the route returned by `answerQuestion()`. `unsupportedHandled` is the share of out-of-scope questions (lucky numbers, auspicious dates, names) answered as unsupported. `answerCollisions` counts groups of questions expecting different routes that still received a byte-identical answer; some collisions are by design (the same seeded Tarot cards for the same topic and day), the rest need the LLM narrator that uses the question text.

See `REPORT.md` for the recorded before and after numbers.
