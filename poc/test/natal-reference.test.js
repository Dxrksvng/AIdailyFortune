import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { natalChart } from '../lib/natal.js';

// Reference values were generated with astropy (builtin ephemeris, true ecliptic of date, apparent
// sidereal time) for 10 births in 5 time zones. Pluto is excluded: astropy's builtin ephemeris lacks it.
// Ascendant/MC share the textbook formula with the engine, so they check the sidereal-time and
// obliquity inputs, not the formula itself. This is not a comparison with Swiss Ephemeris or astro.com.
const fixtures = JSON.parse(readFileSync(new URL('./fixtures/natal-astropy.json', import.meta.url), 'utf8'));
const TOLERANCE_DEG = 0.05;

for (const f of fixtures) {
  test(`natal positions match reference: ${f.birthDate} ${f.birthTime} ${f.timezone}`, () => {
    const chart = natalChart(f);
    for (const [body, expected] of Object.entries(f.expected)) {
      const p = chart.placements.find(x => x.body === body);
      const raw = Math.abs(p.longitude - expected);
      assert.ok(Math.min(raw, 360 - raw) <= TOLERANCE_DEG, `${body} differs by ${Math.min(raw, 360 - raw).toFixed(4)} deg`);
    }
  });
}
