# Fortune methodology

The design uses three separate layers.

1. **Astronomy:** a pinned local calculation library and ephemeris provide positions for a defined timestamp, coordinate convention and date range. JPL [Horizons](https://ssd.jpl.nasa.gov/horizons/manual.html) can check selected results. These are position calculations only.
2. **Astrology-inspired rules:** a documented rule set maps selected daily positions and available profile precision into a theme and supporting signal IDs. These meanings are interpretive product choices, not scientifically established predictions.
3. **Narrative:** an LLM communicates only that structured context in the chosen tone/language; it never calculates or invents positions.

POC personalization is at most an approximate natal Sun sign derived from a birth date. For dates near sign boundaries, calculate with the available precision or explicitly use general guidance; do not silently claim exact placement. A later full-chart method needs time, location, precise calculation conventions and separate data consent.

[Skyfield](https://github.com/skyfielders/python-skyfield) is a local-library candidate; its code is [MIT licensed](https://github.com/skyfielders/python-skyfield/blob/master/LICENSE). Before adoption, verify ephemeris kernel coverage and distribution terms, coordinate conventions, reproducibility and deployment size. No dependency is implemented here.
