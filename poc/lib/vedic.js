import { validDate } from './compass.js';
import { natalChart, resolveBirthInstant } from './natal.js';

const SIGN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const NAKSHATRAS = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashirsha','Ardra','Punarvasu','Pushya','Ashlesha',
  'Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
  'Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'
];
const DASHAS = [
  { lord: 'Ketu', years: 7, theme: 'reflection, simplification and release' },
  { lord: 'Venus', years: 20, theme: 'relationships, values, pleasure and resources' },
  { lord: 'Sun', years: 6, theme: 'identity, confidence and responsibility' },
  { lord: 'Moon', years: 10, theme: 'habits, care, home and emotional life' },
  { lord: 'Mars', years: 7, theme: 'initiative, effort and managing friction' },
  { lord: 'Rahu', years: 18, theme: 'ambition, novelty and discernment' },
  { lord: 'Jupiter', years: 16, theme: 'learning, mentors and growth' },
  { lord: 'Saturn', years: 19, theme: 'structure, patience and obligations' },
  { lord: 'Mercury', years: 17, theme: 'study, communication and exchange' }
];
const YEAR_MS = 365.2425 * 24 * 60 * 60 * 1000;
const NAKSHATRA_SIZE = 360 / 27;

function julianDay(date) { return date.getTime() / 86400000 + 2440587.5; }
function precessionArcseconds(jd) {
  const t = (jd - 2451545.0) / 36525;
  return 5029.0966 * t + 1.11161 * t * t - 0.000113 * t * t * t;
}
function lahiriIae1989(date) {
  const epoch = new Date('1956-03-21T00:00:00Z');
  const anchor = 23 + 15 / 60;
  return anchor + (precessionArcseconds(julianDay(date)) - precessionArcseconds(julianDay(epoch))) / 3600;
}
function signPosition(longitude) {
  const normalized = (longitude % 360 + 360) % 360;
  const index = Math.floor(normalized / 30);
  return { longitude: Math.round(normalized * 10000) / 10000, sign: SIGN_NAMES[index], degree: Math.round((normalized - index * 30) * 100) / 100 };
}
function asIsoDay(ms) { return new Date(ms).toISOString().slice(0, 10); }

export function vedicTiming({ birthDate, birthTime, timezone, latitude, longitude, utcOffsetMinutes, asOfDate }) {
  const year = Number((birthDate || '').slice(0, 4));
  if (!validDate(birthDate) || year < 1900 || year > 2100) throw new Error('Vimshottari POC supports birth dates from 1900 through 2100');
  const evaluationDate = asOfDate || new Date().toISOString().slice(0, 10);
  if (!validDate(evaluationDate) || evaluationDate < birthDate) throw new Error('asOfDate must be a valid date on or after birthDate');
  const profile = { birthDate, birthTime, timezone, latitude, longitude, utcOffsetMinutes };
  const chart = natalChart(profile);
  const birthInstant = resolveBirthInstant(profile);
  const moon = chart.placements.find(point => point.body === 'Moon');
  const ayanamsa = lahiriIae1989(birthInstant);
  const siderealMoon = (moon.longitude - ayanamsa + 360) % 360;
  const mansionIndex = Math.floor(siderealMoon / NAKSHATRA_SIZE);
  const mansionProgress = (siderealMoon - mansionIndex * NAKSHATRA_SIZE) / NAKSHATRA_SIZE;
  const lordIndex = mansionIndex % DASHAS.length;
  const birthLord = DASHAS[lordIndex];
  const elapsedYears = birthLord.years * mansionProgress;
  const dashaStart = birthInstant.getTime() - elapsedYears * YEAR_MS;
  const periods = [];
  let cursor = dashaStart;
  for (let i = 0; i < 18; i++) {
    const lord = DASHAS[(lordIndex + i) % DASHAS.length];
    const end = cursor + lord.years * YEAR_MS;
    periods.push({ lord: lord.lord, theme: lord.theme, start: cursor, end });
    cursor = end;
  }
  const asOfInstant = Date.parse(evaluationDate + 'T00:00:00Z');
  const activeIndex = periods.findIndex(period => asOfInstant >= period.start && asOfInstant < period.end);
  if (activeIndex < 0) throw new Error('Could not resolve Vimshottari period within the supported horizon');
  const nakshatraPada = Math.min(4, Math.floor(mansionProgress * 4) + 1);
  const siderealAsc = (chart.placements.find(point => point.body === 'Ascendant').longitude - ayanamsa + 360) % 360;
  const siderealPlacements = chart.placements.map(point => ({ body: point.body, ...signPosition(point.longitude - ayanamsa) }));
  const active = periods[activeIndex];
  return {
    type: 'vedic-timing', method: 'Vedic astrology inspired: Lahiri IAE 1989 + Vimshottari Mahadasha',
    methodologyVersion: 'vedic-lahiri-iae89-vimshottari-major-v1',
    convention: {
      ayanamsa: 'Lahiri/Chitrapaksha, IAE 1989 anchor (23°15′ at 1956-03-21) with the documented J2000 precession polynomial',
      dasha: 'Vimshottari Mahadasha; 120-year lord sequence; balance derived from sidereal Moon position within birth Nakshatra',
      precisionNote: 'POC implementation is a mean-ayanamsa approximation using UTC for the epoch. Traditional tables may use true ayanamsa, TT, or another Lahiri convention; boundary cases need specialist validation.'
    },
    asOfDate: evaluationDate,
    natal: {
      moon: { ...signPosition(siderealMoon), nakshatra: NAKSHATRAS[mansionIndex], pada: nakshatraPada, dashaAtBirth: birthLord.lord, remainingYearsAtBirth: Math.round((birthLord.years - elapsedYears) * 100) / 100 },
      ascendant: signPosition(siderealAsc),
      placements: siderealPlacements
    },
    currentMahadasha: { lord: active.lord, theme: active.theme, start: asIsoDay(active.start), end: asIsoDay(active.end) },
    upcomingMahadashas: periods.slice(activeIndex + 1, activeIndex + 4).map(p => ({ lord: p.lord, theme: p.theme, start: asIsoDay(p.start), end: asIsoDay(p.end) })),
    reading: 'This traditional timing framework can be used to reflect on long-term themes and preparation. It cannot establish that a specific life event will happen in a given period.',
    action: 'Treat the period themes as prompts; make major decisions using your circumstances, reliable information and your own priorities.',
    provenance: { calculator: 'astronomy-engine@2.1.19', tropicalMoonLongitude: moon.longitude, ayanamsaDegrees: Math.round(ayanamsa * 10000) / 10000, siderealMoonLongitude: Math.round(siderealMoon * 10000) / 10000 },
    privacy: 'Birth data is used in memory for this response and is not included in the returned payload or persisted by this POC.'
  };
}
