import * as Astronomy from 'astronomy-engine';
import { RULES_TH, ELEMENT_FOCUS_TH } from './th.js';

export const RULE_VERSION = 'moonphase-v1';
export const METHOD_VERSION = 'daily-compass-lunar-v1';

const RULES = [
  { id: 'NEW', name: 'A fresh start', range: [0, 90], category: 'begin', reading: 'A small beginning may be worth your attention today.', action: 'Write down one thing you would like to start, even if the first step is tiny.', prompt: 'What felt possible today?' },
  { id: 'WAXING', name: 'Gentle momentum', range: [90, 180], category: 'build', reading: 'Steady effort may be more useful than a big push today.', action: 'Choose one task and give it ten focused minutes.', prompt: 'Where did you notice progress?' },
  { id: 'FULL', name: 'Notice clearly', range: [180, 270], category: 'notice', reading: 'This may be a good moment to notice what needs your attention.', action: 'Pause once today and name what is taking most of your energy.', prompt: 'What became clearer today?' },
  { id: 'WANING', name: 'Make space', range: [270, 360], category: 'release', reading: 'A little space may help you see your next step.', action: 'Set aside one low-priority task or expectation for now.', prompt: 'What felt easier after making space?' },
];

export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function validTimezone(value) {
  try { new Intl.DateTimeFormat('en-US', { timeZone: value }); return true; }
  catch { return false; }
}

export function sunSign(birthDate) {
  if (!validDate(birthDate)) return null;
  const [, month, day] = birthDate.split('-').map(Number);
  const cuts = [[1, 20, 'Aquarius'], [2, 19, 'Pisces'], [3, 21, 'Aries'], [4, 20, 'Taurus'], [5, 21, 'Gemini'], [6, 21, 'Cancer'], [7, 23, 'Leo'], [8, 23, 'Virgo'], [9, 23, 'Libra'], [10, 23, 'Scorpio'], [11, 22, 'Sagittarius'], [12, 22, 'Capricorn']];
  const signs = ['Capricorn', 'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius'];
  let index = month - 1;
  if (day >= cuts[index][1]) index = (index + 1) % 12;
  return signs[index];
}

export function localDate(now, timezone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function localNoonUtc(date, timezone) {
  const base = Date.parse(`${date}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(base));
  const p = Object.fromEntries(parts.map(x => [x.type, Number(x.value)]));
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return new Date(base - (asUtc - base));
}

export function readingFor({ date, timezone, sign = null }) {
  if (!validDate(date) || !validTimezone(timezone)) throw new Error('Invalid date or timezone');
  if (sign && !['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'].includes(sign)) throw new Error('Invalid Sun sign');
  const instant = localNoonUtc(date, timezone);
  const phaseAngle = Astronomy.MoonPhase(instant);
  const rule = RULES.find(r => phaseAngle >= r.range[0] && phaseAngle < r.range[1]);
  if (!rule) throw new Error('No interpretation rule');
  const phase = rule.id === 'NEW' ? 'new-to-first quarter' : rule.id === 'WAXING' ? 'first quarter-to-full' : rule.id === 'FULL' ? 'full-to-third quarter' : 'third quarter-to-new';
  const elements = { Aries: 'fire', Leo: 'fire', Sagittarius: 'fire', Taurus: 'earth', Virgo: 'earth', Capricorn: 'earth', Gemini: 'air', Libra: 'air', Aquarius: 'air', Cancer: 'water', Scorpio: 'water', Pisces: 'water' };
  const focus = { fire: 'Try it with energy, while leaving room to pause.', earth: 'Keep the step practical and manageable.', air: 'Put the thought into words before acting.', water: 'Notice how the step feels as you go.' };
  const element = sign ? elements[sign] : null;
  return {
    date, timezone, source: { instant: instant.toISOString(), phaseAngle: Math.round(phaseAngle * 10) / 10, phase, calculator: 'astronomy-engine@2.1.19', sourceType: 'calculated Sun–Moon geocentric longitude difference' },
    interpretation: { ruleId: rule.id, ruleVersion: RULE_VERSION, methodologyVersion: METHOD_VERSION, theme: rule.name, category: rule.category, profileRuleId: element ? `ELEMENT_${element.toUpperCase()}` : null },
    content: { signal: rule.name, reading: rule.reading, why: `The calculated lunar phase at local noon is ${phase} (${Math.round(phaseAngle)}°). Rule ${rule.id} maps that range to “${rule.name}.”${element ? ` Approximate Sun-sign element ${element} adds a presentation focus under rule ELEMENT_${element.toUpperCase()}.` : ''}`, action: `${rule.action}${element ? ` ${focus[element]}` : ''}`, reflectionPrompt: rule.prompt },
    profilePrecision: sign ? 'approximate Sun sign; no birth time or place' : 'general; no birth data',
    contentTh: { ...RULES_TH[rule.id], focus: element ? ELEMENT_FOCUS_TH[element] : null, disclaimer: 'การตีความเชิงโหราศาสตร์เพื่อความบันเทิงและการสะท้อนตัวเอง ไม่ใช่คำทำนายที่รับประกันได้' },
    disclaimer: 'Astrology-inspired interpretation for entertainment and reflection, not a guaranteed prediction.'
  };
}
