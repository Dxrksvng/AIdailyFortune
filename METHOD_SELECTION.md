# Method selection framework

The four methods are **traditional interpretive frameworks**. Scores below are design judgments about fit, input burden and implementation effort; they are not predictive-accuracy measurements. Astronomical positions can be calculated, while astrological meanings are interpretations. [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/manual.html) supports position data only.

| Method | Best product role | Input | Source/rule shape | Delivery |
|---|---|---|---|---|
| Western astrology | Daily/weekly/monthly themes and stable birth-profile map | Birth date; time/place for precise natal chart | Calculated positions → chart/transits → versioned interpretation | Daily-lite + sampled horizons and tropical Whole Sign natal calculation POC; rich chart/transit interpretations later |
| Tarot | Interactive, question-specific situations | Question/topic; no birth data | Cryptographic draw → finite card catalog → spread roles | POC, Major Arcana subset; 78-card deck later |
| I Ching | A/B choice and change reflection | Decision context; no birth data | Hexagram, changing lines, transformed hexagram, associated texts | Coin cast and King Wen mapping POC; classical line-text layer later |
| Vedic astrology | Longer-horizon timing framework | Precise birth date/time/place | Experimental mean-Lahiri sidereal chart, nakshatra, Vimshottari Mahadasha | API prototype only; expert validation before launch |

The [Waite text](https://en.wikisource.org/wiki/The_Pictorial_Key_to_the_Tarot) is a primary historical source for the Rider–Waite–Smith card system. The [Chinese Text Project's Book of Changes](https://ctext.org/book-of-changes) provides a primary text corpus for hexagrams and lines. A [translation of *Brihat Parashara Hora Shastra*](https://www.horasad.com/download/ebooks/BRIHAT_PARASHARA_HORA_SHASTRA_1.pdf) documents traditional dasha material; a production Vedic method needs expert review of edition, calculation conventions and interpretation.

## Product suitability, qualitative

| Dimension | Western | Vedic | Tarot | I Ching |
|---|---|---|---|---|
| Structured rules | High | High | High | High |
| Calculated astronomical inputs | High | High | None | None |
| Interactive draw/ritual | Low | Low | High | High |
| Birth-data personalization | High when precise data exists | High when precise data exists | Low | Low |
| Question-specific interaction | Medium | Medium | High | High |
| Input burden | Medium–high | High | Low | Low |
| Implementation/domain burden | High | Very high | Medium | Medium–high |

These are proposed product-design assessments, not claims that any method predicts future events accurately. User-perceived relevance and usefulness are measured after use.

## Staged scope

1. **POC:** general daily Western-inspired lunar phase + approximate Sun-sign action focus; stateless period/topic API; Western tropical natal placements/angles/Whole Sign houses; 78-card compositional Tarot question API; I Ching cast and King Wen identity. Existing UI remains a smaller prototype.
2. **MVP:** precise Western natal chart and selected daily/weekly/monthly/yearly rule sets, a reviewed 78-card Tarot catalog, I Ching decision mode.
3. **Experimental API:** Vedic timing exposes a documented approximation for system evaluation; user-facing launch requires a documented tradition variant, expert review, calculation checks and user demand.

Do not describe POC daily-lite as a complete Western natal chart or 22 cards as a full Tarot deck.
