import * as Astronomy from 'astronomy-engine';
import { localNoonUtc, validDate, validTimezone } from './compass.js';

const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const ELEMENTS = ['fire', 'earth', 'air', 'water'];
const MODES = ['cardinal', 'fixed', 'mutable'];
const PLANET_THEMES = { Sun: 'identity and vitality', Moon: 'emotional needs and habits', Mercury: 'learning and communication', Venus: 'connection and preferences', Mars: 'initiative and assertion', Jupiter: 'growth and belief', Saturn: 'limits and responsibility', Uranus: 'change and independence', Neptune: 'imagination and ideals', Pluto: 'intensity and transformation' };
const ELEMENT_THEMES = { fire: 'initiative and expression', earth: 'practicality and continuity', air: 'ideas and exchange', water: 'feeling and connection' };
const MODE_THEMES = { cardinal: 'starting or directing', fixed: 'sustaining or concentrating', mutable: 'adapting or revising' };
const ASPECTS = [
  { name: 'conjunction', angle: 0, orb: 8 },
  { name: 'sextile', angle: 60, orb: 5 },
  { name: 'square', angle: 90, orb: 6 },
  { name: 'trine', angle: 120, orb: 6 },
  { name: 'opposition', angle: 180, orb: 8 }
];

function localFields(instant, timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(instant);
  return Object.fromEntries(parts.map(p => [p.type, p.value]));
}

// Find UTC instants that map to a supplied wall-clock time. Reject gaps and
// DST overlaps instead of silently choosing an offset the user did not give.
export function resolveLocalBirthTime(date, time, timezone) {
  if (!validDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time || '') || !validTimezone(timezone)) throw new Error('Provide a valid birth date, local time and IANA timezone');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const matches = [];
  for (let offset = -14 * 60; offset <= 14 * 60; offset++) {
    const candidate = new Date(wall - offset * 60_000);
    const f = localFields(candidate, timezone);
    if (Number(f.year) === year && Number(f.month) === month && Number(f.day) === day && Number(f.hour) === hour && Number(f.minute) === minute) matches.push(candidate);
  }
  if (matches.length === 0) throw new Error('This local birth time does not exist in that timezone (daylight-saving time gap)');
  if (matches.length > 1) throw new Error('This local birth time is ambiguous because clocks changed; provide utcOffsetMinutes');
  return matches[0];
}

function utcFromOffset(date, time, timezone, offsetMinutes) {
  if (!Number.isInteger(offsetMinutes) || offsetMinutes < -840 || offsetMinutes > 840) throw new Error('utcOffsetMinutes must be an integer between -840 and 840');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const instant = new Date(Date.UTC(year, month - 1, day, hour, minute) - offsetMinutes * 60_000);
  const f = localFields(instant, timezone);
  if (Number(f.year) !== year || Number(f.month) !== month || Number(f.day) !== day || Number(f.hour) !== hour || Number(f.minute) !== minute) throw new Error('utcOffsetMinutes does not match the supplied timezone and local birth time');
  return instant;
}

function norm(angle) { return (angle % 360 + 360) % 360; }

export function resolveBirthInstant(profile) {
  const { birthDate, birthTime, timezone, utcOffsetMinutes } = profile || {};
  if (!validDate(birthDate) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(birthTime || '') || !validTimezone(timezone)) throw new Error('Provide a valid birth date, local time and IANA timezone');
  return utcOffsetMinutes === undefined ? resolveLocalBirthTime(birthDate, birthTime, timezone) : utcFromOffset(birthDate, birthTime, timezone, utcOffsetMinutes);
}

function zodiac(longitude) {
  const index = Math.floor(norm(longitude) / 30);
  return { sign: SIGNS[index], degree: Math.round((norm(longitude) - index * 30) * 100) / 100 };
}

function geocentricLongitude(body, instant) {
  const vector = Astronomy.GeoVector(Astronomy.Body[body], instant, true);
  return norm(Astronomy.Ecliptic(vector).elon);
}

export function transitContacts(date, timezone, natalPoints, { bodies = null, limit = 8 } = {}) {
  if (!validDate(date) || !validTimezone(timezone) || !Array.isArray(natalPoints)) throw new Error('Valid transit date, timezone and natal placements are required');
  const instant = localNoonUtc(date, timezone);
  const transitingBodies = bodies || ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
  const natalBodies = new Set(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Ascendant', 'Midheaven']);
  const targets = natalPoints.filter(point => natalBodies.has(point.body));
  const hits = [];
  for (const transitBody of transitingBodies) {
    const longitude = geocentricLongitude(transitBody, instant);
    for (const natal of targets) {
      const separation = Math.abs(norm(longitude - natal.longitude));
      const distance = Math.min(separation, 360 - separation);
      for (const aspect of ASPECTS) {
        const orbLimit = transitBody === 'Moon' ? 2 : aspect.orb === 8 ? 4 : 3;
        const orb = Math.abs(distance - aspect.angle);
        if (orb <= orbLimit) hits.push({ transitBody, natalPoint: natal.body, aspect: aspect.name, orb: Math.round(orb * 100) / 100, transitLongitude: Math.round(longitude * 100) / 100, natalLongitude: natal.longitude });
      }
    }
  }
  return hits.sort((a, b) => a.orb - b.orb).slice(0, limit).map(hit => ({ ...hit, rule: hit.aspect === 'square' || hit.aspect === 'opposition' ? 'review-and-adjust' : 'notice-support' }));
}

function ascendantAndMc(instant, latitude, longitude) {
  const gastDegrees = Astronomy.SiderealTime(instant) * 15;
  const ramc = norm(gastDegrees + longitude);
  const obliquity = Astronomy.e_tilt(Astronomy.MakeTime(instant)).tobl * Math.PI / 180;
  const theta = ramc * Math.PI / 180;
  const phi = latitude * Math.PI / 180;
  const asc = norm(Math.atan2(-Math.cos(theta), Math.sin(obliquity) * Math.tan(phi) + Math.cos(obliquity) * Math.sin(theta)) * 180 / Math.PI);
  const mc = norm(Math.atan2(Math.sin(theta), Math.cos(theta) * Math.cos(obliquity)) * 180 / Math.PI);
  return { ascendant: asc, midheaven: mc, ramc, obliquity: obliquity * 180 / Math.PI };
}

export function natalChart({ birthDate, birthTime, timezone, latitude, longitude, utcOffsetMinutes }) {
  if (!validDate(birthDate) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(birthTime || '') || !validTimezone(timezone)) throw new Error('Provide a valid birth date, local time and IANA timezone');
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error('Latitude/longitude are outside valid ranges');
  const instant = resolveBirthInstant({ birthDate, birthTime, timezone, utcOffsetMinutes });
  const points = PLANETS.map(body => {
    const eclipticLongitude = geocentricLongitude(body, instant);
    const position = zodiac(eclipticLongitude);
    return { body, longitude: Math.round(eclipticLongitude * 10000) / 10000, ...position };
  });
  const angles = ascendantAndMc(instant, latitude, longitude);
  const asc = zodiac(angles.ascendant), mc = zodiac(angles.midheaven);
  const ascSignIndex = SIGNS.indexOf(asc.sign);
  for (const point of points) point.wholeSignHouse = (SIGNS.indexOf(point.sign) - ascSignIndex + 12) % 12 + 1;
  const chartPoints = [...points, { body: 'Ascendant', longitude: angles.ascendant, ...asc }, { body: 'Midheaven', longitude: angles.midheaven, ...mc }];
  const reflectiveProfile = ['Sun', 'Moon', 'Ascendant'].map(body => {
    const point = chartPoints.find(item => item.body === body);
    const signIndex = SIGNS.indexOf(point.sign);
    const element = ELEMENTS[Math.floor(signIndex / 3)];
    const mode = MODES[signIndex % 3];
    const scope = body === 'Ascendant' ? 'approach to new situations' : PLANET_THEMES[body];
    return { point: body, sign: point.sign, house: point.wholeSignHouse ?? 1, prompt: body + ' in ' + point.sign + ' is traditionally read through ' + scope + ', with ' + ELEMENT_THEMES[element] + ' and a ' + MODE_THEMES[mode] + ' style. Which parts feel useful to reflect on?' };
  });
  const aspects = [];
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) {
    const separation = Math.abs(norm(points[i].longitude - points[j].longitude));
    const distance = Math.min(separation, 360 - separation);
    for (const aspect of ASPECTS) {
      const orb = Math.abs(distance - aspect.angle);
      if (orb <= aspect.orb) aspects.push({ first: points[i].body, second: points[j].body, type: aspect.name, orb: Math.round(orb * 100) / 100 });
    }
  }
  return {
    type: 'natal-chart', method: 'Western tropical geocentric astrology', methodologyVersion: 'western-tropical-whole-sign-v1',
    inputPrecision: { birthTime: 'minute', timezoneResolved: true, coordinates: 'user-supplied decimal degrees' },
    coordinates: 'True ecliptic of date; apparent geocentric planetary positions. House assignment uses Whole Sign houses.',
    placements: chartPoints,
    houses: SIGNS.map((sign, i) => ({ house: i + 1, sign: SIGNS[(ascSignIndex + i) % 12] })),
    aspects, reflectiveProfile,
    limitations: ['Astrological interpretation is a traditional symbolic framework, not a scientifically established personality or prediction method.', 'Whole Sign houses are used; Placidus and other house systems are not implemented.', 'No lunar nodes, asteroids, lots or retrograde interpretation.']
  };
}
