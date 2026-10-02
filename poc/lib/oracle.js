import { createHash, randomBytes } from 'node:crypto';
import { readingFor, validDate, validTimezone } from './compass.js';
import { TAROT_DECK, SPREADS } from '../public/tarot.js';
import { classify, crisisAnswer, noticeFor } from './safety.js';
import { identifyHexagram, HEXAGRAMS } from './iching.js';
import { natalChart, transitContacts } from './natal.js';
import { PLANET_TH, ASPECT_TH, TOPIC_TH, HORIZON_TH, TOPIC_GUIDANCE_TH, SPREAD_TH, tarotThai } from './th.js';
import { ritualGuide } from './ritual.js';
import { lifeTimeline, MAX_YEARS } from './life.js';

export const ORACLE_VERSION = 'intent-rules-v1';
export const TOPICS = ['general', 'love', 'career', 'study', 'money'];
export const HORIZONS = ['day', 'week', 'month', 'year'];

const TOPIC_GUIDANCE = {
  general: { watch: 'Notice where your attention goes and what is within your control.', action: 'Choose one manageable next step.' },
  love: { watch: 'Notice how you and others communicate; this reading cannot reveal another person’s private feelings.', action: 'Name one boundary or question you could discuss respectfully.' },
  career: { watch: 'Watch for tasks, conversations or opportunities that need follow-through; hiring decisions remain with employers.', action: 'Prepare one concrete follow-up or portfolio example.' },
  study: { watch: 'Notice where effort and rest may need rebalancing.', action: 'Choose one study task and a realistic time block.' },
  money: { watch: 'Review actual figures and obligations before making decisions; this is not investment advice.', action: 'Check your budget or compare options using real costs.' }
};

function addDays(date, amount) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function periodEnd(date, horizon) {
  if (horizon === 'day') return date;
  if (horizon === 'week') return addDays(date, 6);
  return addDays(date, horizon === 'month' ? 29 : 364);
}

export function periodReading({ date, timezone, sign = null, topic = 'general', horizon = 'day', birthProfile = null }) {
  if (!validDate(date) || !validTimezone(timezone)) throw new Error('Invalid date or timezone');
  if (!TOPICS.includes(topic) || !HORIZONS.includes(horizon)) throw new Error('Invalid topic or horizon');
  const end = periodEnd(date, horizon);
  const offsets = horizon === 'day' ? [0] : horizon === 'week' ? [0, 3, 6] : horizon === 'month' ? [0, 7, 14, 21] : [0, 91, 182, 273];
  const samples = offsets.map(offset => readingFor({ date: addDays(date, offset), timezone, sign }));
  const natal = birthProfile ? natalChart(birthProfile) : null;
  const transitSamples = natal ? samples.map(sample => ({ date: sample.date, contacts: transitContacts(sample.date, timezone, natal.placements) })) : [];
  const themeCounts = new Map();
  for (const sample of samples) themeCounts.set(sample.interpretation.ruleId, (themeCounts.get(sample.interpretation.ruleId) || 0) + 1);
  const lead = [...themeCounts].sort((a, b) => b[1] - a[1] || offsets.findIndex((_, i) => samples[i].interpretation.ruleId === a[0]) - offsets.findIndex((_, i) => samples[i].interpretation.ruleId === b[0]))[0][0];
  const first = samples.find(s => s.interpretation.ruleId === lead);
  const guidance = TOPIC_GUIDANCE[topic];
  const preferredPoints = topic === 'love' ? new Set(['Venus', 'Moon']) : topic === 'career' ? new Set(['Midheaven', 'Saturn', 'Sun']) : topic === 'study' ? new Set(['Mercury', 'Jupiter']) : topic === 'money' ? new Set(['Venus', 'Jupiter', 'Saturn']) : null;
  const relevantTransit = transitSamples.flatMap(sample => sample.contacts.map(contact => ({ ...contact, date: sample.date }))).filter(contact => !preferredPoints || preferredPoints.has(contact.natalPoint) || preferredPoints.has(contact.transitBody)).sort((a, b) => a.orb - b.orb)[0] || null;
  const personalizedSignal = relevantTransit ? relevantTransit.transitBody + ' ' + relevantTransit.aspect + ' natal ' + relevantTransit.natalPoint : null;
  const signal = personalizedSignal || first.content.signal;
  const scenario = relevantTransit
    ? 'An astrology-inspired transit lens highlights ' + personalizedSignal + ' near ' + relevantTransit.date + '. For ' + topic + ', use this as a prompt to ' + (relevantTransit.rule === 'review-and-adjust' ? 'review plans and leave room to adjust' : 'notice a supportive opening without assuming an outcome') + '.'
    : first.content.reading + ' In ' + (topic === 'general' ? 'daily life' : topic) + ', ' + guidance.watch;
  const hitTh = relevantTransit ? `${PLANET_TH[relevantTransit.transitBody]} ${ASPECT_TH[relevantTransit.aspect]} ${PLANET_TH[relevantTransit.natalPoint]}ในดวงกำเนิด` : null;
  const guidanceTh = TOPIC_GUIDANCE_TH[topic];
  const th = {
    signal: hitTh || first.contentTh.signal,
    scenario: relevantTransit
      ? `เลนส์โหราศาสตร์เชิงจรชี้ว่า ${hitTh} ใกล้วันที่ ${relevantTransit.date} ในด้าน${TOPIC_TH[topic]} ลองใช้เป็นข้อสังเกตเพื่อ${relevantTransit.rule === 'review-and-adjust' ? 'ทบทวนแผนและเผื่อที่ปรับเปลี่ยน' : 'มองหาช่องทางที่เปิดให้โดยไม่คาดหวังผลลัพธ์ตายตัว'}`
      : `${first.contentTh.reading} ในด้าน${topic === 'general' ? 'ชีวิตประจำวัน' : TOPIC_TH[topic]} ${guidanceTh.watch}`,
    action: guidanceTh.action,
    why: `ธีมมาจากการคำนวณเฟสดวงจันทร์ ${samples.length} ช่วงในช่วงเวลานี้ กฎ ${lead} ปรากฏ ${themeCounts.get(lead)} ครั้ง${relevantTransit ? ` และดวงกำเนิดเพิ่ม ${hitTh} วันที่ ${relevantTransit.date} (orb ${relevantTransit.orb}°)` : ''} คำแนะนำรายหัวข้อเป็นการตีความ ไม่ใช่การพยากรณ์เหตุการณ์`,
    limits: 'ธีมจากตัวอย่างและมุมดาวไม่สามารถทำนายเหตุการณ์ วันที่ หรือพฤติกรรมของใครได้ การตีความทางโหราศาสตร์เป็นสัญลักษณ์ ไม่ใช่การทำนายที่พิสูจน์ทางวิทยาศาสตร์'
  };
  return {
    th,
    type: 'period', method: natal ? 'western tropical natal + sampled transits' : 'western-inspired lunar phase', methodologyVersion: natal ? 'period-lunar-transits-v2' : 'period-lunar-samples-v1',
    horizon, topic, interval: { start: date, end },
    signal,
    scenario,
    action: guidance.action,
    why: `The theme comes from ${samples.length} calculated lunar-phase sample${samples.length === 1 ? '' : 's'} in this interval. Rule ${lead} appears ${themeCounts.get(lead)} time${themeCounts.get(lead) === 1 ? '' : 's'}${relevantTransit ? `; the profile lens adds ${personalizedSignal} on ${relevantTransit.date} (orb ${relevantTransit.orb}°).` : ''} Topic guidance is interpretive, not an event forecast.`,
    source: samples.map(s => ({ date: s.date, phaseAngle: s.source.phaseAngle, phase: s.source.phase, ruleId: s.interpretation.ruleId, ...(natal ? { transitContacts: transitSamples.find(t => t.date === s.date).contacts } : {}) })),
    profilePrecision: natal ? 'birth date, local time, timezone and coordinates; tropical Whole Sign chart' : sign ? 'approximate Sun sign; no birth time or place' : 'general; no birth data',
    limits: 'Sampled themes and transit aspects cannot predict a specific event, date or person’s behavior. Astrological interpretation is symbolic, not scientifically established prediction.'
  };
}

const TOPIC_SPREAD = { love: 'relationship', career: 'career', study: 'study', money: 'money', general: 'general' };
export const spreadForTopic = topic => TOPIC_SPREAD[topic] || 'general';

export function routeQuestion(question, requestedMethod) {
  if (typeof question !== 'string' || !question.trim() || question.length > 500) throw new Error('Question must contain 1–500 characters');
  if (requestedMethod && !['auto', 'western', 'tarot', 'iching', 'belief'].includes(requestedMethod)) throw new Error('Invalid method');
  const q = question.trim().toLowerCase();
  const accuracy = /แม่น|accura|most reliable|ศาสตร์ไหน|which (?:method|system|science)/i.test(q);
  if (accuracy) return { intent: 'accuracy', method: 'reflection', topic: 'general', horizon: 'day', spread: null, reason: 'Method-accuracy questions get an honest explanation instead of a ranking.' };
  const support = /เครียด|กังวล|หมดแรง|เหนื่อยใจ|หนักใจ|\b(stress(?:ed)?|anxious|anxiety|burn.?out|overwhelmed)\b/i.test(q);
  const lifeSpan = q.match(/(?:อีก\s*)?(\d+)\s*ปี(?:ข้างหน้า)?|next\s+(\d+)\s+years|ชีวิต.*(?:ปีข้างหน้า|ในอนาคต)|(?:ปีข้างหน้า)/i);
  if (lifeSpan && !support) { const n = Number(lifeSpan[1] || lifeSpan[2] || 5); return { intent: 'life-timeline', method: 'timeline', topic: 'general', horizon: 'year', years: Math.min(MAX_YEARS, Math.max(1, n)), spread: null, reason: 'Multi-year question: use the life timeline when a birth profile is available.' }; }
  const belief = /deit|god|goddess|worship|pray|เทพ|บูชา|นับถือ|ไหว้พระ|ไหว้เจ้า|ไหว้ศาล|สักการะ|ขอพร/i.test(q);
  if (belief) return { intent: 'belief', method: 'belief', topic: 'general', horizon: 'day', spread: null, reason: 'Belief questions need a tradition and user preference, not an assigned deity.' };
  // Topics the system does not have reviewed rules for. Say so instead of returning an unrelated daily reading.
  const unsupportedKind = /เบอร์(?:มงคล|โทร|โทรศัพท์|มือถือ)|ทะเบียน(?:รถ)?(?:เลข|มงคล)|เลขมงคล|phone number|license plate|lucky number/i.test(q) ? 'lucky-number'
    : /ฤกษ์|วันมงคล|วันไหน(?:ดี|เหมาะ)|วันดี|(?:best|auspicious|good)\s+(?:date|day)\b|date to (?:move|marry|open)/i.test(q) ? 'auspicious-date'
    : /เปลี่ยนชื่อ|ตั้งชื่อ|ชื่อมงคล|ชื่อ.*(?:ให้ดวง|เสริม)|\b(?:change|rename) my name\b/i.test(q) ? 'name' : null;
  if (unsupportedKind) return { intent: 'unsupported', method: 'none', kind: unsupportedKind, topic: 'general', horizon: 'day', topicExplicit: true, horizonExplicit: true, spread: null, reason: 'No reviewed rules for this kind of question; say so instead of answering with an unrelated reading.' };
  const decision = /\b(a or b|choose between|which option|should i choose)\b|เลือก.*หรือ|ระหว่าง.+กับ|[aA]\s*กับ\s*[bB]|เอหรือบี/i.test(q);
  const relationship = /\b(ex|former partner|come back|relationship|love|boyfriend|girlfriend|crush|soulmate)\b|แฟนเก่า|คนเก่า|กลับมา|ความรัก|แฟน|เนื้อคู่|คู่ครอง|ชอบเรา|เขาชอบ|จีบ|เลิกกัน|คืนดี|สามี|ภรรยา|แต่งงาน(?!วัน)/i.test(q);
  const job = /\b(interview|offer|hired|job|career|promot(?:ed|ion)|laid off|fired|resign|unemployed|salary|raise)\b|สัมภาษณ์|ได้งาน|สมัครงาน|การงาน|มีงานทำ|หางาน|งานใหม่|เปลี่ยนงาน|เลิกจ้าง|ตกงาน|ลาออก|เลื่อนตำแหน่ง|เงินเดือน|หัวหน้า|ที่ทำงาน|งาน(?!แต่ง|บุญ)/i.test(q);
  const color = /\b(colou?r|wear today|lucky)\b|สีอะไร|สีมงคล|แก้เคล็ด|โชคไม่ดี|โชคร้าย|ของมงคล|เครื่องราง|ถือ.*(?:อะไร|ดี)|พกอะไร|แก้เคราะห์|เสริมดวง|เสริมโชค|ไม่ควร.*(?:ปากเสียง|เดินทาง)|ระวัง/i.test(q);
  const year = /\b(year|years|next few years)\b|ปีหน้า|ปีนี้|ทั้งปี|อีก\s*\d+\s*ปี|รายปี/i.test(q);
  const month = /\b(month|monthly)\b|เดือนหน้า|เดือนนี้|รายเดือน/i.test(q);
  const week = /\b(week|weekly)\b|สัปดาห์|รายสัปดาห์/i.test(q);
  const studyHit = /\b(study|school|exam|scholarship|university)\b|เรียน|สอบ|(?<!ลง)ทุน(?:เรียน|การศึกษา)?|มหาลัย|มหาวิทยาลัย|เทอม|ปริญญา/i.test(q);
  // investing and lottery questions are money questions; health/legal ones are general ones,
  // so a UI default of "career" can never turn them into résumé advice
  const moneyHit = /\b(money|finance|budget|invest|stock|crypto|debt|savings|bonus)\b|\blotter[a-z]*|การเงิน|เงิน(?!เดือน)|ลงทุน|หุ้น|คริปโต|หวย|เลขเด็ด|ลอตเตอรี่|หนี้|โบนัส|รายได้/i.test(q);
  const sensitiveHit = /ป่วย|โรค(?!ง)|หมอ(?!ดู)|มะเร็ง|(?:กิน|ทาน|หยุด|เลิก|เปลี่ยน|ปรับ|เพิ่ม|ลด)ยา|ฟ้อง|(?<!โช)คดี|ตายไหม|medic|diagnos|lawsuit|court|cancer/i.test(q);
  const topicExplicit = Boolean(relationship || job || studyHit || moneyHit || sensitiveHit);
  const horizonExplicit = Boolean(year || month || week);
  // A question that touches several life areas ("work and love this year") gets the overall reading,
  // not whichever keyword happened to match first.
  const topics = [relationship && 'love', job && 'career', studyHit && 'study', moneyHit && 'money'].filter(Boolean);
  const multi = topics.length > 1;
  const topic = multi ? 'general' : topics[0] || 'general';
  const horizon = year ? 'year' : month ? 'month' : week ? 'week' : 'day';
  let method = requestedMethod && requestedMethod !== 'auto' ? requestedMethod : decision ? 'iching' : ((!multi && relationship) || /สัมภาษณ์|ได้งาน|interview|hired|job offer|\boffer\b/i.test(q)) ? 'tarot' : 'western';
  if (method === 'belief') return { intent: 'belief', method, topic, horizon, spread: null, reason: 'Belief questions need a tradition and user preference, not an assigned deity.' };
  const intent = support ? 'support' : color ? 'ritual' : decision ? 'decision' : multi ? 'general' : relationship ? 'relationship' : job ? 'career' : 'general';
  return { intent, method, topic, ...(multi ? { topics } : {}), horizon, topicExplicit, horizonExplicit, spread: method === 'tarot' ? spreadForTopic(topic) : null, reason: requestedMethod && requestedMethod !== 'auto' ? 'User selected this method.' : 'Rule-based question routing; the user may override the method.' };
}

function secureIndex(max) {
  const limit = Math.floor(0x100000000 / max) * max;
  let value;
  do { value = randomBytes(4).readUInt32BE(); } while (value >= limit);
  return value % max;
}

// The POC draws from the 22 Major Arcana only: those are the cards that have face art.
// The 56 Minor Arcana stay in public/tarot.js as data but are never drawn.
const MAJOR_DECK = TAROT_DECK.filter(card => card.arcana === 'major');

/** Counter-mode SHA-256 stream: the same seed string always yields the same sequence. */
function seededRandom(seed) {
  let counter = 0, block = Buffer.alloc(0), offset = 0;
  const nextUint32 = () => {
    if (offset + 4 > block.length) { block = createHash('sha256').update(`${seed}|${counter++}`).digest(); offset = 0; }
    const value = block.readUInt32BE(offset); offset += 4; return value;
  };
  return max => {
    const limit = Math.floor(0x100000000 / max) * max;
    let value;
    do { value = nextUint32(); } while (value >= limit);
    return value % max;
  };
}

/** Fisher-Yates over a copy of the deck, driven by the seeded stream. */
function seededShuffle(deck, seed) {
  const randomInt = seededRandom(seed);
  const cards = [...deck];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export const tarotSeed = ({ date, topic, spread, reshuffle }) => `${date}|${topic}|${spread}|${reshuffle}`;

/** The card of the day: first card of a shuffle seeded by the date alone. */
export function dailyCard(date) {
  if (!validDate(date)) throw new Error('Invalid date');
  const card = seededShuffle(MAJOR_DECK, tarotSeed({ date, topic: 'daily', spread: 'daily', reshuffle: 0 }))[0];
  const t = tarotThai(card);
  return { id: card.id, name: card.name, theme: card.theme, interpretation: card.meaning, nameTh: t.nameTh, themeTh: t.themeTh, interpretationTh: t.meaningTh };
}

export function tarotReading({ question, spread = 'general', date, topic = 'general', reshuffle = 0 }) {
  if (typeof question !== 'string' || !question.trim() || question.length > 500) throw new Error('Question must contain 1–500 characters');
  if (!SPREADS[spread]) throw new Error('Invalid spread');
  if (!validDate(date)) throw new Error('A valid local date (YYYY-MM-DD) is required for a Tarot draw');
  if (!TOPICS.includes(topic)) throw new Error('Invalid topic');
  // One reshuffle per topic per local day. The server is stateless, so it can only cap the
  // value; the client keeps the count and a client that lies about it is not stopped here.
  if (!Number.isInteger(reshuffle) || reshuffle < 0 || reshuffle > 1) throw new Error('reshuffle must be 0 or 1');
  const roles = SPREADS[spread].roles;
  const deck = seededShuffle(MAJOR_DECK, tarotSeed({ date, topic, spread, reshuffle })).slice(0, roles.length);
  const cards = roles.map((role, index) => {
    const card = deck[index];
    const t = tarotThai(card);
    return { role, id: card.id, name: card.name, theme: card.theme, interpretation: card.meaning, nameTh: t.nameTh, themeTh: t.themeTh, interpretationTh: t.meaningTh };
  });
  const rolesTh = SPREAD_TH[spread].roles;
  cards.forEach((card, i) => { card.roleTh = rolesTh[i]; });
  const cardContext = cards.map(card => `${card.role}: ${card.name} points to ${card.theme.toLowerCase()}. ${card.interpretation}`);
  const possibleDevelopment = spread === 'career'
    ? `A next update or another round of discussion may be possible, but the hiring result is unknown. The ${cards[0].name} invites attention to ${cards[0].theme}; the ${cards[1].name} suggests checking ${cards[1].theme} as a possible obstacle.`
    : spread === 'relationship'
      ? `Contact or distance may continue; neither can be inferred from another person's private feelings. The ${cards[0].name} highlights ${cards[0].theme}, while the ${cards[2].name} points to ${cards[2].theme} in choices you control.`
      : `The ${cards[0].name} brings ${cards[0].theme} into focus. You could notice whether that theme appears in your real situation before deciding what to do.`;
  return {
    type: 'question', method: 'tarot', methodologyVersion: 'major-22-seeded-v2', spread, topic, reshuffle, date,
    cards, signal: cards.map(c => c.theme).join(' · '), cardContext, possibleDevelopment,
    scenario: spread === 'career' ? 'The spread offers perspectives on an opportunity, an obstacle and an action you control. An employer’s decision cannot be known from the cards.' : spread === 'relationship' ? 'The spread offers perspectives on the present dynamic, what feels unresolved and your own choice. Another person’s feelings cannot be known from the cards.' : 'The card offers one perspective to consider; it does not determine the outcome.',
    action: SPREADS[spread].action, actionTh: SPREAD_TH[spread].action, spreadNameTh: SPREAD_TH[spread].name,
    why: 'Cards were shuffled with a seed from the date and topic, so the same question today gives the same cards.',
    whyTh: 'ไพ่ถูกสับด้วย seed จากวันที่และหัวข้อ ถามเรื่องเดิมวันนี้จะได้ไพ่ชุดเดิม',
    limits: 'A symbolic reading for entertainment and reflection; no guaranteed outcome or objective probability.'
  };
}

export function ichingCast({ question }) {
  if (typeof question !== 'string' || !question.trim() || question.length > 500) throw new Error('Question must contain 1–500 characters');
  const lines = Array.from({ length: 6 }, (_, i) => {
    const coins = [secureIndex(2), secureIndex(2), secureIndex(2)];
    const value = 6 + coins.reduce((a, b) => a + b, 0);
    return { position: i + 1, value, kind: value % 2 ? 'yang' : 'yin', changing: value === 6 || value === 9 };
  });
  const states = lines.map(line => line.value);
  const { primary, resulting, transformedLines, changingLinePrompts } = identifyHexagram(states);
  return {
    type: 'question', method: 'iching', methodologyVersion: 'king-wen-64-three-coins-v2',
    lines, primaryHexagram: { number: primary.number, unicode: primary.unicode, hanzi: primary.hanzi, pinyin: primary.pinyin, title: primary.title, theme: primary.theme, upperTrigram: primary.upperTrigram, lowerTrigram: primary.lowerTrigram },
    resultingHexagram: primary.number === resulting.number ? null : { number: resulting.number, unicode: resulting.unicode, hanzi: resulting.hanzi, pinyin: resulting.pinyin, title: resulting.title, theme: resulting.theme },
    primaryBitsBottomUp: states.map(v => v % 2 ? '1' : '0').join(''), transformedBitsBottomUp: transformedLines.map(v => v % 2 ? '1' : '0').join(''),
    changingLines: lines.filter(l => l.changing).map(l => l.position),
    changingLinePrompts,
    signal: primary.title,
    scenario: primary.theme + (resulting.number !== primary.number ? ' Changing lines lead to ' + resulting.title + ': ' + resulting.theme + '.' : '.') + ' Treat these as reflection themes; they do not determine the result of your choice.',
    action: 'Write down the real-world benefits, costs and reversibility of each option before deciding.',
    why: 'Six lines were cast bottom-to-top using three independent cryptographic coin flips. The resulting pattern maps to King Wen hexagram ' + primary.number + '; changing lines are positions ' + (lines.filter(l => l.changing).map(l => l.position).join(', ') || 'none') + '.' + (resulting.number !== primary.number ? ' The transformed pattern maps to ' + resulting.number + '.' : ''),
    source: { order: 'King Wen sequence', mappingVersion: 'king-wen-trigram-pairs-v1', corpusSize: HEXAGRAMS.length, textPolicy: 'Original theme summaries; no translated judgement or line text is reproduced.' },
    limits: 'Hexagram name and theme are symbolic prompts, not predictions or instructions to choose an option.'
  };
}

const METHOD_FIT = {
  th: [
    ['โหราศาสตร์ตะวันตก (ดวงกำเนิด/ดาวจร)', 'เหมาะกับการดูธีมช่วงเวลา: วัน เดือน ปี — คำนวณตำแหน่งดาวได้ แต่ความหมายเป็นการตีความ'],
    ['ไพ่ทาโรต์', 'เหมาะกับคำถามเฉพาะเรื่อง — ใช้ไพ่เป็นกระจกให้มองสถานการณ์หลายมุม'],
    ['อี้จิง', 'เหมาะกับการเลือกระหว่างทางเลือกหรือการวางแผนรับมือการเปลี่ยนแปลง'],
    ['เวทิก/มหาทศา', 'เหมาะกับการสำรวจธีมระยะยาว — ในระบบนี้ยังเป็นระบบทดลอง']
  ],
  en: [
    ['Western astrology (natal/transits)', 'Best for themes over a period: day, month, year. Positions can be calculated; the meanings are interpretation.'],
    ['Tarot', 'Best for a specific question — the cards are a mirror for seeing a situation from several angles.'],
    ['I Ching', 'Best for choosing between options or planning around change.'],
    ['Vedic / Mahadasha', 'Best for exploring long-horizon themes — experimental in this system.']
  ]
};
const CAREER_PLAN = {
  th: ['อัปเดตเรซูเม่และผลงาน 1–2 ชิ้นที่เกี่ยวกับตำแหน่งที่อยากได้', 'ตั้งเป้าสมัครหรือติดต่อสัปดาห์ละ 3–5 ที่ และจดผลไว้', 'ซ้อมตอบคำถามสัมภาษณ์ 3 ข้อที่ยากที่สุดออกเสียง', 'ถามคนในวงการ 1 คนว่าตลาดต้องการทักษะอะไรอยู่', 'วางแผนการเงินสำรองและแผนสำรองระหว่างรอผล'],
  en: ['Update your résumé and one or two work samples for the role you want.', 'Aim to apply or reach out 3–5 times a week and keep notes.', 'Rehearse answers to your three hardest interview questions aloud.', 'Ask one person in the field what skills are in demand.', 'Plan a financial buffer and a fallback while you wait.']
};
const SUPPORT = {
  th: { message: 'ความเครียดเป็นสัญญาณที่ควรรับฟัง ไม่ใช่สิ่งที่ดวงจะตัดสินแทน ลองเริ่มจากสิ่งเล็ก ๆ ที่ทำได้ทันที', steps: ['หายใจช้า ๆ 4 วินาทีเข้า 6 วินาทีออก ทำซ้ำ 5 รอบ', 'เขียนสิ่งที่กังวลออกมา แล้วแยกเป็น "ควบคุมได้" กับ "ควบคุมไม่ได้"', 'เลือกเรื่องที่ควบคุมได้ 1 เรื่องและทำเป็นก้าวเล็ก ๆ วันนี้', 'พูดคุยกับคนที่ไว้ใจ พักผ่อน และกินอาหารให้เป็นเวลา'], care: 'หากความเครียดหรือความรู้สึกแย่ต่อเนื่องหลายวัน กระทบการนอนหรือการใช้ชีวิต หรือคิดทำร้ายตัวเอง ควรติดต่อผู้เชี่ยวชาญด้านสุขภาพจิตหรือสายด่วนสุขภาพจิต 1323 (กรมสุขภาพจิต — ควรตรวจสอบหมายเลขล่าสุดจากแหล่งทางการ) หากอยู่ในอันตรายเร่งด่วนให้ติดต่อบริการฉุกเฉิน' },
  en: { message: 'Stress is a signal worth listening to; a horoscope cannot judge it for you. Start with small things you can do right now.', steps: ['Breathe in for 4 seconds and out for 6, five times.', 'Write down what worries you and split it into “I can control” and “I cannot”.', 'Pick one controllable item and take a small step today.', 'Talk to someone you trust, rest, and eat at regular times.'], care: 'If stress or low mood lasts several days, affects your sleep or daily life, or you think of hurting yourself, contact a mental-health professional or hotline (in Thailand, 1323 — verify the current number from an official source). If you are in immediate danger, contact emergency services.' }
};
const ACCURACY = {
  th: 'ไม่มีหลักฐานทางวิทยาศาสตร์ที่ยืนยันว่าศาสตร์การดูดวงใดทำนายเหตุการณ์ในชีวิตได้แม่นยำ ระบบนี้จึงไม่จัดอันดับว่าศาสตร์ไหน "แม่นที่สุด" และไม่แสดงตัวเลขความแม่น สิ่งที่บอกได้คือแต่ละศาสตร์เหมาะกับคำถามแบบไหน และส่วนใดคำนวณได้จริงเทียบกับส่วนที่เป็นการตีความ',
  en: 'There is no scientific evidence that any divination system predicts life events accurately, so this system does not rank which is “most accurate” and shows no accuracy figures. What it can say is which method suits which kind of question, and which parts are calculated versus interpreted.'
};

function answerCore({ question, date, timezone, sign = null, method = 'auto', spread = null, birthProfile = null, lang = null, topic = null, horizon = null, reshuffle = 0 }) {
  const route = routeQuestion(question, method);
  if (topic !== null && topic !== undefined) {
    if (!TOPICS.includes(topic)) throw new Error('Invalid topic');
    if (!route.topicExplicit) route.topic = topic;
  }
  if (horizon !== null && horizon !== undefined) {
    if (!HORIZONS.includes(horizon)) throw new Error('Invalid horizon');
    if (!route.horizonExplicit && route.intent !== 'life-timeline') route.horizon = horizon;
  }
  if (route.method === 'tarot') route.spread = spreadForTopic(route.topic);
  const thai = lang === 'th' || (lang !== 'en' && /[\u0e00-\u0e7f]/.test(question));
  const L = thai ? 'th' : 'en';
  if (route.intent === 'accuracy') return { route, answer: { type: 'accuracy', method: 'reflection', scenario: ACCURACY.en, message: ACCURACY[L], methodFit: METHOD_FIT[L], limits: 'No accuracy score is produced because none can be supported.' } };
  if (route.intent === 'life-timeline') {
    if (!birthProfile) return { route, answer: { type: 'needs-profile', method: 'timeline', scenario: 'A multi-year view needs birth date, time and place.', message: thai ? 'ภาพรวมหลายปีต้องใช้วันเวลาและสถานที่เกิด กรุณากรอกในหน้า "ดวงกำเนิด" แล้วถามอีกครั้ง ข้อมูลไม่ถูกเก็บ' : 'A multi-year view needs your birth date, time and place. Fill them in on the Birth chart page and ask again; nothing is stored.', action: 'Open the Birth chart page.', limits: 'No timeline was generated.', needs: 'birthProfile' } };
    const timeline = lifeTimeline({ birthProfile, date, timezone, years: route.years, topic: route.topic });
    return { route, answer: { ...timeline, scenario: thai ? timeline.whyTh : timeline.why, message: thai ? `ภาพรวม ${route.years} ปีข้างหน้าเป็นธีมเชิงตีความรายปี ไม่ใช่การบอกเหตุการณ์ที่จะเกิด` : `A ${route.years}-year view as yearly interpretive themes, not events that will happen.`, action: thai ? 'เลือกหนึ่งปีที่สนใจ แล้วเขียนเป้าหมายและสิ่งที่ต้องเตรียมไว้หนึ่งข้อ' : 'Pick one year that interests you and write one goal and one preparation.' } };
  }
  if (route.intent === 'support') {
    const x = SUPPORT[L];
    return { route, answer: { type: 'support', method: 'reflection', scenario: SUPPORT.en.message, message: x.message, steps: x.steps, care: x.care, action: x.steps[0], limits: 'Supportive reflection only; not medical or mental-health advice.' } };
  }
  if (route.intent === 'unsupported') {
    const what = { th: { 'lucky-number': 'เบอร์หรือเลขมงคล', 'auspicious-date': 'ฤกษ์และวันมงคล', name: 'ชื่อมงคล' }, en: { 'lucky-number': 'lucky numbers', 'auspicious-date': 'auspicious dates', name: 'lucky names' } }[L][route.kind];
    return { route, answer: { type: 'unsupported', method: 'none', kind: route.kind,
      scenario: `This system has no reviewed rules for ${what}, so it does not answer instead of guessing.`,
      message: L === 'th' ? `เรื่อง${what}ต้องใช้ตำราและผู้เชี่ยวชาญตรวจกฎ ระบบนี้ยังไม่รองรับ จึงไม่ตอบแทนการเดา` : `This system has no reviewed rules for ${what}, so it does not answer instead of guessing.`,
      steps: L === 'th' ? ['ถามเรื่องงาน ความรัก เงิน หรือการเรียนได้', 'ดูสีและพระประจำวันที่หน้าสีมงคล', 'เรื่องสำคัญ เช่น การเลือกวันแต่งงานหรือเปิดกิจการ ควรปรึกษาผู้เชี่ยวชาญที่คุณไว้ใจ'] : ['Ask about work, love, money or study.', 'See the colour of the day on the rituals page.', 'For an important choice such as a wedding or opening date, consult someone you trust.'],
      action: L === 'th' ? 'ลองถามเรื่องที่ระบบรองรับ' : 'Try a topic the system supports', limits: 'Not supported yet: needs reviewed traditional rules.' } };
  }
  if (route.method === 'belief') return { route, answer: { type: 'belief', method: 'belief exploration', scenario: 'No system can objectively assign a deity or guarantee that worship will improve life.', action: 'Consider your own tradition, values and comfort. If you wish, ask a trusted person from that tradition about respectful practices.', limits: 'No religious preference is inferred or stored.', ...(thai ? { message: 'ระบบไม่สามารถระบุได้ว่าเทพองค์ใดถูกกำหนดมาให้คุณ หรือรับรองว่าการบูชาจะทำให้ชีวิตดีขึ้น ลองเริ่มจากความเชื่อและประเพณีที่คุณนับถือ แล้วศึกษาวิธีปฏิบัติจากแหล่งที่เชื่อถือได้' } : {}) } };
  if (spread !== null) {
    if (!SPREADS[spread]) throw new Error('Invalid Tarot spread');
    if (route.method !== 'tarot') throw new Error('A spread can only be selected with Tarot');
    route.spread = spread;
  }
  if (route.intent === 'ritual' && route.method === 'western') {
    const reading = periodReading({ date, timezone, sign, topic: route.topic, horizon: route.horizon, birthProfile });
    const ritual = ritualGuide({ birthDate: birthProfile?.birthDate || null, date, timezone });
    const colorLine = thai
      ? `สีประจำวันนี้ตามธรรมเนียมไทยคือสี${ritual.today.colorTh}${ritual.birthDay ? ` และสีประจำวันเกิด (${ritual.birthDay.dayTh}) คือสี${ritual.birthDay.colorTh}` : ''}`
      : `Today's traditional Thai colour is ${ritual.today.colorEn}${ritual.birthDay ? `, and your birth-day (${ritual.birthDay.dayEn}) colour is ${ritual.birthDay.colorEn}` : ''}`;
    return { route, answer: { ...reading, ritualGuide: ritual, type: 'ritual',
      ritual: 'If you enjoy color rituals, choose a color that helps you feel calm or focused. Clothing color has no demonstrated effect on luck.',
      message: `${colorLine}. ${thai ? ritual.noteTh : ritual.noteEn}`, steps: ritual.badLuckSteps[L], reminders: ritual.reminders[L], practices: ritual.practices[L] } };
  }
  if (route.method === 'tarot') {
    const answer = tarotReading({ question, spread: route.spread || 'general', date, topic: route.topic, reshuffle });
    if (thai) answer.message = route.spread === 'career'
      ? `ไพ่ ${answer.cards.map(c => c.nameTh).join(', ')} ชวนมองโอกาส อุปสรรค และสิ่งที่คุณควบคุมได้ตามลำดับ ผลรับเข้าทำงานยังขึ้นกับนายจ้างและผู้สมัครคนอื่น ลองติดตามผลอย่างสุภาพ เตรียมตัวเลือกสำรอง และทบทวนจุดที่คุณอธิบายความสามารถได้ชัดขึ้น`
      : route.spread === 'relationship'
        ? `ไพ่ ${answer.cards.map(c => c.nameTh).join(', ')} ชวนมองความสัมพันธ์ สิ่งที่ยังค้างใจ และทางเลือกของคุณ ไพ่ไม่บอกความคิดหรือการตัดสินใจของคนเก่าได้ ลองสำรวจขอบเขตของตัวเองและสื่อสารตรง ๆ หากเหมาะสม`
        : route.spread === 'study'
          ? `ไพ่ ${answer.cards.map(c => c.nameTh).join(', ')} ชวนจัดลำดับสิ่งที่ควรโฟกัส สิ่งรบกวน และวิธีฝึกที่ทำได้ ไพ่ไม่ได้ตัดสินผลสอบแทนการเตรียมตัว ลองเลือกหัวข้อหนึ่งและแบ่งเวลาอ่านให้พอดี`
          : route.spread === 'money'
            ? `ไพ่ ${answer.cards.map(c => c.nameTh).join(', ')} ชวนทบทวนทรัพยากร แรงกดดัน และก้าวถัดไป ใช้ยอดเงินจริงและงบประมาณประกอบการตัดสินใจ การอ่านนี้ไม่ใช่คำแนะนำลงทุน`
            : route.spread === 'timeline'
              ? `ไพ่ ${answer.cards.map(c => c.nameTh).join(' → ')} ชวนมองจากอดีต ปัจจุบัน ไปสู่ทิศทางที่ควรพิจารณา ไพ่ไม่ได้ฟันธงอนาคต ลองดูว่าสิ่งที่คุณเลือกทำตอนนี้เชื่อมกับทิศทางนั้นอย่างไร`
              : `ไพ่ ${answer.cards[0].nameTh} ชวนสะท้อนเรื่อง ${answer.cards[0].themeTh} ลองเทียบความหมายกับสถานการณ์จริง แล้วเลือกก้าวเล็ก ๆ ที่คุณควบคุมได้`;
    return { route, answer };
  }
  if (route.method === 'iching') {
    const answer = ichingCast({ question });
    if (thai) answer.message = 'อี้จิงได้ ' + answer.primaryHexagram.hanzi + ' ' + answer.primaryHexagram.pinyin + ' — ' + answer.primaryHexagram.title + ': ' + answer.primaryHexagram.theme + (answer.resultingHexagram ? ' เส้นที่เปลี่ยนให้รูปผลลัพธ์ ' + answer.resultingHexagram.hanzi + ' ' + answer.resultingHexagram.title : '') + ' เส้นเปลี่ยนนับจากล่างขึ้นบน: ' + (answer.changingLines.join(', ') || 'ไม่มี') + ' ใช้เป็นกรอบสะท้อนสถานการณ์ แล้วเปรียบเทียบข้อมูลจริงและผลได้เสียก่อนเลือก';
    return { route, answer };
  }
  const answer = periodReading({ date, timezone, sign, topic: route.topic, horizon: route.horizon, birthProfile });
  if (route.topic === 'career') answer.steps = CAREER_PLAN[L];
  if (thai) answer.message = `สำหรับ ${{ day: 'วันนี้', week: 'สัปดาห์นี้', month: '30 วันนี้', year: '365 วันนี้' }[route.horizon]}ในด้าน${{ general: 'ภาพรวม', love: 'ความรัก', career: 'การงาน', study: 'การเรียน', money: 'การเงิน' }[route.topic]} ธีมที่คำนวณได้คือ ${answer.th.signal} ลองสังเกตสิ่งที่เกิดขึ้นจริงและเลือกการกระทำเล็ก ๆ ที่คุณควบคุมได้ การอ่านนี้ไม่สามารถระบุเหตุการณ์ล่วงหน้าได้แน่นอน`;
  return { route, answer };
}

const AVOID = {
  th: { general: 'อย่าตัดสินใจเรื่องใหญ่ตอนเหนื่อยหรือโกรธ', love: 'อย่าสรุปความรู้สึกของอีกฝ่ายจากไพ่หรือดวง ถามตรง ๆ ดีกว่า', career: 'อย่ารอผลจากที่เดียว และอย่ารับเงื่อนไขที่ไม่ชัดเจนเพราะกลัวพลาดโอกาส', study: 'อย่าอดนอนทั้งคืนเพื่อเร่งอ่าน', money: 'อย่ายืมหรือค้ำประกันโดยไม่มีเอกสาร และอย่าตัดสินใจลงทุนเพราะดวง' },
  en: { general: 'Avoid big decisions while tired or angry.', love: "Don't infer the other person's feelings from cards or a chart; ask directly.", career: "Don't wait on a single employer, and don't accept unclear terms out of fear of missing out.", study: "Don't pull an all-nighter to cram.", money: "Don't lend or guarantee without paperwork, and never invest because of a horoscope." }
};
const DOWN = {
  th: { noProfile: 'ยังไม่มีข้อมูลเกิด จึงเป็นการอ่านแบบทั่วไป', timeUnknown: 'ไม่ทราบเวลาเกิด ลัคนาและบ้านจึงไม่แม่นยำ', outside: 'ผลขึ้นกับคนหรือองค์กรอื่นที่ดวงมองไม่เห็น', long: 'ช่วงเวลายาว ความไม่แน่นอนสะสมมากขึ้น', base: 'ตำแหน่งดาวคำนวณได้ แต่ความหมายเป็นการตีความ' },
  en: { noProfile: 'No birth details, so this is a general reading.', timeUnknown: 'Birth time unknown, so the Ascendant and houses are unreliable.', outside: 'The outcome depends on other people or organisations the chart cannot see.', long: 'A long horizon accumulates uncertainty.', base: 'Positions are calculated; the meanings are interpretation.' }
};
const LEVELS = ['low', 'medium', 'good'];

export function answerQuestion(input) {
  if (typeof input.question !== 'string' || !input.question.trim() || input.question.length > 500) throw new Error('Question must contain 1–500 characters');
  const thai = input.lang === 'th' || (input.lang !== 'en' && /[\u0e00-\u0e7f]/.test(input.question));
  const L = thai ? 'th' : 'en';
  // Safety first: a crisis gets the support panel only, never a reading.
  const safety = classify(input.question);
  if (safety.level === 'crisis') {
    return { route: { intent: 'crisis', method: 'support', topic: 'general', horizon: 'day', spread: null, reason: 'Crisis wording detected; no divination is produced.' }, answer: crisisAnswer(L) };
  }
  const result = answerCore(input);
  const { route, answer } = result;
  if (safety.level === 'warn') answer.safety = { level: 'warn', cats: safety.cats, notice: noticeFor(safety.cats, L) };
  if (['safety', 'belief', 'accuracy', 'support', 'needs-profile', 'unsupported'].includes(answer.type)) return result;
  // Qualitative confidence: how much the inputs support this kind of reading. Not a probability.
  const reasons = [DOWN[L].base];
  let level = 2;
  if (!input.birthProfile) { level -= 1; reasons.push(DOWN[L].noProfile); }
  if (input.birthTimeKnown === false) { level -= 1; reasons.push(DOWN[L].timeUnknown); }
  if (['relationship', 'career'].includes(route.intent) && ['tarot', 'iching'].includes(route.method) || route.intent === 'relationship') { level -= 1; reasons.push(DOWN[L].outside); }
  if (route.horizon === 'year' || answer.type === 'life-timeline') { level -= 1; reasons.push(DOWN[L].long); }
  const topic = route.topic in AVOID.th ? route.topic : 'general';
  const canColour = validDate(input.date) && validTimezone(input.timezone);
  const colour = canColour ? ritualGuide({ birthDate: input.birthProfile?.birthDate || null, date: input.date, timezone: input.timezone }).today : null;
  const sources = [
    { id: 'calc', label: thai ? 'ดวงเกิดและจังหวะดาว' : 'Birth chart and planetary timing', detail: input.birthProfile ? (thai ? 'คำนวณด้วยโปรแกรมจากวัน เวลา สถานที่เกิด' : 'Calculated by code from your birth date, time and place') : (thai ? 'ไม่ได้ใช้ข้อมูลเกิด ใช้เฉพาะเฟสดวงจันทร์ของวันนี้' : "No birth data used; only today's lunar phase") },
    ...(answer.cards || answer.primaryHexagram ? [{ id: 'draw', label: answer.cards ? (thai ? 'ไพ่ที่สุ่มได้' : 'Cards drawn') : (thai ? 'เฮกซะแกรมที่โยนได้' : 'Hexagram cast'), detail: thai ? 'สุ่มด้วยรหัสสุ่มเชิงคริปโต ใช้เป็นกระจกให้คิดต่อ ไม่ใช่ตัวตัดสิน' : 'Drawn with cryptographic randomness; a mirror for thinking, not a verdict' }] : []),
    { id: 'ctx', label: thai ? 'สิ่งที่คุณเล่า' : 'What you told us', detail: thai ? 'ใช้เฉพาะคำถามนี้ ไม่เก็บ ไม่ส่งต่อ' : 'Only this question; not stored or shared' }
  ];
  return {
    route,
    answer: {
      ...answer,
      confidence: { level: LEVELS[Math.max(0, level)], reasons },
      guidance: {
        avoid: AVOID[L][topic],
        boost: !colour ? null : thai
          ? `ถ้าอยากเสริมกำลังใจ: ใส่โทนสี${colour.colorTh}ตามสีประจำ${colour.dayTh} และตั้งใจสั้น ๆ ตามที่ศรัทธา (ไม่จำเป็นและไม่มีผลต่อโชคที่พิสูจน์ได้) ที่เหลือคือการเตรียมตัวจริง`
          : `For a morale boost: wear ${colour.colorEn} (today's ${colour.dayEn} colour) and set a brief intention in line with your beliefs (optional; no demonstrated effect on luck). The rest is real preparation.`
      },
      sources
    }
  };
}
