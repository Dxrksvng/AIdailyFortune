import { validDate, validTimezone } from './compass.js';
import { natalChart, transitContacts } from './natal.js';
import { vedicTiming } from './vedic.js';
import { PLANET_TH, ASPECT_TH, PLANET_ROLE_TH, NATAL_DOMAIN_TH, DASHA_THEME_TH, TOPIC_TH } from './th.js';

export const MAX_YEARS = 10;
const SLOW_BODIES = ['Jupiter', 'Saturn'];
const TOPIC_POINTS = {
  general: null,
  love: new Set(['Venus', 'Moon']),
  career: new Set(['Midheaven', 'Sun', 'Saturn']),
  study: new Set(['Mercury', 'Jupiter']),
  money: new Set(['Venus', 'Jupiter', 'Saturn'])
};
const NATAL_DOMAIN_EN = {
  Sun: 'identity and direction', Moon: 'emotional steadiness', Mercury: 'communication and learning',
  Venus: 'relationships and values', Mars: 'energy and initiative', Ascendant: 'self-image and fresh starts', Midheaven: 'career and public role'
};
const ROLE_EN = { Jupiter: 'a period of wider opportunity and learning', Saturn: 'a period that emphasises responsibility and structure' };

function addYears(date, years) {
  const [y, m, d] = date.split('-').map(Number);
  const value = new Date(Date.UTC(y + years, m - 1, d, 12));
  if (value.getUTCMonth() !== m - 1) value.setUTCDate(0); // 29 Feb -> 28 Feb
  return value.toISOString().slice(0, 10);
}
function addDays(date, days) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

/**
 * Multi-year themes from two calculated sources:
 *  - Vimshottari Mahadasha periods (Vedic-inspired, experimental), and
 *  - Jupiter / Saturn contacts to natal points sampled four times a year.
 * Output is interpretive prompts per year, never dated events.
 */
export function lifeTimeline({ birthProfile, date, timezone, years = 5, topic = 'general' }) {
  if (!validDate(date) || !validTimezone(timezone)) throw new Error('Invalid date or timezone');
  if (!Number.isInteger(years) || years < 1 || years > MAX_YEARS) throw new Error(`years must be an integer from 1 to ${MAX_YEARS}`);
  if (!(topic in TOPIC_POINTS)) throw new Error('Invalid topic');
  if (!birthProfile) throw new Error('A birth profile is required for a multi-year timeline');
  const natal = natalChart(birthProfile);
  const vedic = vedicTiming({ ...birthProfile, asOfDate: date });
  const periods = [vedic.currentMahadasha, ...vedic.upcomingMahadashas];
  const focus = TOPIC_POINTS[topic];

  const rows = [];
  for (let i = 0; i < years; i++) {
    const start = addYears(date, i);
    const end = addDays(addYears(date, i + 1), -1);
    const seen = new Map();
    for (const offset of [0, 91, 182, 273]) {
      const sampleDate = addDays(start, offset);
      for (const hit of transitContacts(sampleDate, timezone, natal.placements, { bodies: SLOW_BODIES, limit: 12 })) {
        if (focus && !focus.has(hit.natalPoint) && !focus.has(hit.transitBody)) continue;
        const key = `${hit.transitBody}|${hit.aspect}|${hit.natalPoint}`;
        if (!seen.has(key) || seen.get(key).orb > hit.orb) seen.set(key, { ...hit, sampleDate });
      }
    }
    const contacts = [...seen.values()].sort((a, b) => a.orb - b.orb).slice(0, 3).map(hit => ({
      transit: hit.transitBody, aspect: hit.aspect, natalPoint: hit.natalPoint, nearestSample: hit.sampleDate, orb: hit.orb, rule: hit.rule,
      textTh: `${PLANET_TH[hit.transitBody]}${ASPECT_TH[hit.aspect] ? ' ' + ASPECT_TH[hit.aspect] : ''} ${PLANET_TH[hit.natalPoint]}ในดวงกำเนิด: ${PLANET_ROLE_TH[hit.transitBody]} ในเรื่อง${NATAL_DOMAIN_TH[hit.natalPoint]} ${hit.rule === 'review-and-adjust' ? 'ควรทบทวนและเผื่อที่ปรับแผน' : 'ลองสังเกตช่องทางที่เปิดให้และไม่ต้องคาดหวังผลลัพธ์ตายตัว'}`,
      textEn: `${hit.transitBody} ${hit.aspect} natal ${hit.natalPoint}: ${ROLE_EN[hit.transitBody]} around ${NATAL_DOMAIN_EN[hit.natalPoint]}. ${hit.rule === 'review-and-adjust' ? 'Worth reviewing and leaving room to adjust.' : 'Notice openings without expecting a fixed outcome.'}`
    }));
    const mid = Date.parse(`${addDays(start, 182)}T00:00:00Z`);
    const period = periods.find(p => mid >= Date.parse(`${p.start}T00:00:00Z`) && mid < Date.parse(`${p.end}T00:00:00Z`)) || periods.at(-1);
    const hard = contacts.filter(c => c.rule === 'review-and-adjust').length;
    rows.push({
      index: i + 1, start, end,
      emphasis: contacts.length === 0 ? 'quiet' : hard > contacts.length / 2 ? 'review' : 'open',
      dasha: { lord: period.lord, start: period.start, end: period.end, themeEn: period.theme, themeTh: DASHA_THEME_TH[period.lord] },
      contacts
    });
  }
  return {
    type: 'life-timeline', method: 'Western slow-planet contacts + Vimshottari Mahadasha (experimental)',
    methodologyVersion: 'life-timeline-v1', topic, topicTh: TOPIC_TH[topic], years, from: date,
    rows,
    why: 'Each year lists Jupiter/Saturn contacts to your natal points, taken from four calculated samples per year, and the Vimshottari period active mid-year. The wording per contact is a fixed product template.',
    whyTh: 'แต่ละปีแสดงมุมของพฤหัสบดี/เสาร์ที่เกี่ยวกับดวงกำเนิดจากการคำนวณ 4 ช่วงต่อปี และมหาทศาที่ใช้อยู่กลางปี ข้อความต่อมุมเป็นแม่แบบคงที่ของผลิตภัณฑ์',
    limits: 'Interpretive themes, not predicted events. The Vedic layer is an approximation awaiting specialist validation. Do not base health, legal, financial or relationship decisions on it.',
    limitsTh: 'เป็นธีมเชิงตีความ ไม่ใช่การทำนายเหตุการณ์ ส่วนระบบเวทิกเป็นค่าประมาณที่ยังรอผู้เชี่ยวชาญตรวจ อย่าใช้ตัดสินใจเรื่องสุขภาพ กฎหมาย การเงิน หรือความสัมพันธ์',
    privacy: 'Birth data is processed in memory for this response and is not stored.'
  };
}
