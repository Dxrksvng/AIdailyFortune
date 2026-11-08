import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveBirthInstant } from '../lib/natal.js';

// Expected offsets were cross-checked with Python zoneinfo (IANA tzdata) on 2026-10-10.
// Whole-minute resolution: Bangkok local mean time (+6:42:04) is resolved to within one minute.
const CASES = [
  ['Asia/Bangkok', '1900-06-01', '10:00', 6 * 3600 + 42 * 60 + 4],
  ['Asia/Bangkok', '1919-03-31', '23:00', 6 * 3600 + 42 * 60 + 4],
  ['Asia/Bangkok', '1920-04-01', '10:00', 7 * 3600],
  ['Asia/Bangkok', '1941-06-01', '10:00', 7 * 3600],
  ['Europe/London', '1969-01-01', '10:00', 3600],
  ['Europe/London', '1972-01-01', '10:00', 0]
];

for (const [timezone, birthDate, birthTime, offsetSeconds] of CASES) {
  test(`historical offset ${timezone} ${birthDate}`, () => {
    const instant = resolveBirthInstant({ birthDate, birthTime, timezone });
    const [y, m, d] = birthDate.split('-').map(Number), [h, min] = birthTime.split(':').map(Number);
    const localAsUtc = Date.UTC(y, m - 1, d, h, min);
    const offset = (localAsUtc - instant.getTime()) / 1000;
    assert.ok(Math.abs(offset - offsetSeconds) <= 60, `offset ${offset}s, expected ${offsetSeconds}s`);
  });
}
