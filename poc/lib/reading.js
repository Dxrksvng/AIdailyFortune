import { validDate, validTimezone } from './compass.js';
import { natalChart, transitContacts } from './natal.js';
import { vedicTiming } from './vedic.js';
import { lifeTimeline } from './life.js';
import { PLANET_TH, SIGN_TH, ASPECT_TH, TOPIC_TH, DASHA_THEME_TH } from './th.js';
import { classify, noticeFor, crisisAnswer } from './safety.js';

export const READING_VERSION = 'evidence-grounded-v1';
export const READING_TOPICS = ['general', 'love', 'career', 'study', 'money'];
const MAX_QUESTION = 300;
const MAX_TURNS = 6;

const unsafeTh = /แน่นอน|รับประกัน|ฟันธง|ตายแน่|ต้อง(?:ลาออก|ลงทุน|หยุดยา|เลิก|เลิกกัน|หย่า)|สาปแช่ง|คำสาป|เคราะห์ร้ายแน่|หวย|เลขเด็ด|วันตาย|อายุขัย/;
const SIGNS_EN = Object.keys(SIGN_TH);
const TOPIC_POINTS = {
  general: null,
  love: new Set(['Venus', 'Moon', 'Mars']),
  career: new Set(['Midheaven', 'Sun', 'Saturn', 'Jupiter']),
  study: new Set(['Mercury', 'Jupiter', 'Moon']),
  money: new Set(['Venus', 'Jupiter', 'Saturn'])
};

const r1 = n => Math.round(n * 10) / 10;

/**
 * Every claim the reading may make is one row here, computed from the birth data.
 * The LLM sees only these rows and must cite their ids; it cannot add chart facts.
 */
export function buildEvidence({ birthProfile, date, timezone, topic = 'general' }) {
  if (!validDate(date) || !validTimezone(timezone)) throw new Error('Invalid date or timezone');
  if (!READING_TOPICS.includes(topic)) throw new Error('Invalid topic');
  if (!birthProfile) throw new Error('Birth date, birth time and birth place are required');
  const timeKnown = birthProfile.birthTimeKnown !== false;
  const profile = { birthDate: birthProfile.birthDate, birthTime: timeKnown ? birthProfile.birthTime : '12:00', timezone: birthProfile.timezone, latitude: Number(birthProfile.latitude), longitude: Number(birthProfile.longitude), utcOffsetMinutes: birthProfile.utcOffsetMinutes };
  const chart = natalChart(profile);
  const focus = TOPIC_POINTS[topic];
  const rows = [];
  const add = (id, kind, en, th) => rows.push({ id, kind, en, th });

  // Without a birth time the Ascendant, Midheaven, houses and house-based timing are meaningless, and the
  // Moon moves about 13 degrees a day, so its sign is kept only if it cannot change during the day.
  let moonSignStable = true;
  if (!timeKnown) {
    const signAt = time => natalChart({ ...profile, birthTime: time }).placements.find(p => p.body === 'Moon').sign;
    try { moonSignStable = signAt('00:00') === signAt('23:59'); } catch { moonSignStable = false; }
  }
  for (const p of chart.placements) {
    if (!timeKnown && (['Ascendant', 'Midheaven'].includes(p.body) || (p.body === 'Moon' && !moonSignStable))) continue;
    p.wholeSignHouse = timeKnown ? p.wholeSignHouse : undefined;
    const house = p.wholeSignHouse ? `, house ${p.wholeSignHouse}` : '';
    const houseTh = p.wholeSignHouse ? ` เรือน ${p.wholeSignHouse}` : '';
    add(`P:${p.body}`, 'natal', `Natal ${p.body} at ${r1(p.degree)} deg ${p.sign}${house} (whole sign)`, `${PLANET_TH[p.body]}กำเนิดอยู่ราศี${SIGN_TH[p.sign]} ${r1(p.degree)}°${houseTh}`);
  }
  const personal = new Set(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']);
  chart.aspects
    .filter(a => timeKnown || (a.first !== 'Moon' && a.second !== 'Moon'))
    .filter(a => (personal.has(a.first) || personal.has(a.second)) && (!focus || focus.has(a.first) || focus.has(a.second)))
    .sort((a, b) => a.orb - b.orb).slice(0, 8)
    .forEach(a => add(`A:${a.first}-${a.second}`, 'natal-aspect', `Natal ${a.first} ${a.type} ${a.second}, orb ${a.orb} deg`, `${PLANET_TH[a.first]}กำเนิด${ASPECT_TH[a.type]}${PLANET_TH[a.second]}กำเนิด (องศาคลาด ${a.orb}°)`));

  transitContacts(date, timezone, timeKnown ? chart.placements : chart.placements.filter(p => !['Moon', 'Ascendant', 'Midheaven'].includes(p.body)), { limit: 12 })
    .filter(t => !focus || focus.has(t.natalPoint) || focus.has(t.transitBody))
    .slice(0, 5)
    .forEach(t => add(`T:${t.transitBody}-${t.natalPoint}`, 'transit', `On ${date}, transiting ${t.transitBody} ${t.aspect} natal ${t.natalPoint}, orb ${t.orb} deg`, `วันที่ ${date} ${PLANET_TH[t.transitBody]}จรเดิน${ASPECT_TH[t.aspect]}${PLANET_TH[t.natalPoint]}กำเนิด (องศาคลาด ${t.orb}°)`));

  if (timeKnown) try {
    const v = vedicTiming({ ...profile, asOfDate: date });
    add('V:moon', 'vedic', `Sidereal Moon in ${v.natal.moon.nakshatra} pada ${v.natal.moon.pada} (Lahiri, experimental)`, `จันทร์ดาวฤกษ์อยู่นักษัตร ${v.natal.moon.nakshatra} บาท ${v.natal.moon.pada} (ลาหิรี ทดลอง)`);
    const d = v.currentMahadasha;
    add('V:dasha', 'vedic', `Current Vimshottari mahadasha: ${d.lord}, ${d.start} to ${d.end}; theme: ${d.theme} (experimental)`, `มหาทศาปัจจุบัน ${PLANET_TH[d.lord] || d.lord} ${d.start} ถึง ${d.end} ธีม: ${DASHA_THEME_TH[d.lord] || d.theme} (ทดลอง)`);
  } catch { /* Vedic layer covers 1900-2100 only; the reading proceeds without it */ }

  try {
    const tl = lifeTimeline({ birthProfile: profile, date, timezone, years: 2, topic });
    tl.rows.forEach(row => row.contacts.filter(c => timeKnown || !['Ascendant', 'Midheaven', 'Moon'].includes(c.natalPoint)).forEach(c => add(`L:${row.index}:${c.transit}-${c.natalPoint}`, 'slow-transit', `Year ${row.index} (${row.start} to ${row.end}): ${c.transit} ${c.aspect} natal ${c.natalPoint}`, `ปีที่ ${row.index} (${row.start} ถึง ${row.end}): ${c.textTh}`)));
  } catch { /* optional layer */ }

  if (!timeKnown) add('N:no-birth-time', 'limit', 'Birth time unknown: Ascendant, Midheaven, houses and Vedic periods are not available and the Moon is omitted when its sign could change that day', 'ไม่ทราบเวลาเกิด จึงไม่มีลัคนา จุดกลางฟ้า เรือน และมหาทศา และไม่ใช้ดวงจันทร์ถ้าราศีอาจเปลี่ยนในวันนั้น');
  return { chart, rows, timeKnown };
}

const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['sections', 'reflection_questions', 'closing'],
  properties: {
    sections: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['title', 'body', 'evidence_ids'], properties: { title: { type: 'string' }, body: { type: 'string' }, evidence_ids: { type: 'array', items: { type: 'string' } } } } },
    reflection_questions: { type: 'array', items: { type: 'string' } },
    closing: { type: 'string' }
  }
};
const CHAT_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['reply', 'evidence_ids'],
  properties: { reply: { type: 'string' }, evidence_ids: { type: 'array', items: { type: 'string' } } }
};

const STYLE = 'You are "Mae Mor AI", a warm, experienced Thai fortune-teller persona for an entertainment and self-reflection product. You are an AI, never claim to be human. Write natural, polite Thai in the voice of a caring older advisor: connect the chart pieces into a story, explain WHY each theme appears by pointing to the specific placement, and give practical, gentle suggestions. Use ONLY the facts in the evidence list; cite the ids you used in evidence_ids for every section. Never invent placements, degrees, dates or planets. Use hedged language (อาจ, น่าจะ, ลอง, สังเกต). Never give certainty, never predict death, illness, lottery numbers, or tell the user to make a major decision (quit, divorce, invest, stop medication). If evidence is thin, say so.';

async function callModel({ instructions, input, name, schema, apiKey, model, fetcher }) {
  const response = await fetcher('https://api.openai.com/v1/responses', {
    method: 'POST', signal: AbortSignal.timeout(30000),
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, store: false, instructions, input: JSON.stringify(input), text: { format: { type: 'json_schema', name, strict: true, schema } } })
  });
  if (!response.ok) throw new Error('LLM request failed');
  const payload = await response.json();
  if (payload.status !== 'completed') throw new Error('LLM response incomplete');
  const raw = payload.output?.flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('');
  return JSON.parse(raw);
}

/** Reject text that cites unknown ids, names a zodiac sign no cited row supports, or uses certainty / high-stakes wording. */
export function checkGrounding(text, ids, rows) {
  const byId = new Map(rows.map(r => [r.id, r]));
  if (!Array.isArray(ids) || ids.length === 0 || ids.some(id => !byId.has(id))) return 'unknown or missing evidence id';
  if (unsafeTh.test(text)) return 'unsafe or certain wording';
  const cited = ids.map(id => byId.get(id)).map(r => `${r.en} ${r.th}`).join(' ');
  const mentioned = [...text.matchAll(/ราศี(เมษ|พฤษภ|เมถุน|กรกฎ|สิงห์|กันย์|ตุลย์|พิจิก|ธนู|มังกร|กุมภ์|มีน)/g)].map(m => m[1]);
  for (const th of mentioned) if (!cited.includes(`ราศี${th}`)) return `sign ${th} not in cited evidence`;
  for (const en of SIGNS_EN) if (new RegExp(`\\b${en}\\b`).test(text) && !cited.includes(en)) return `sign ${en} not in cited evidence`;
  return null;
}

function validateReading(candidate, rows) {
  if (!candidate || !Array.isArray(candidate.sections) || candidate.sections.length < 2 || candidate.sections.length > 6) return 'bad section count';
  for (const s of candidate.sections) {
    if (typeof s.title !== 'string' || typeof s.body !== 'string' || s.body.length < 60 || s.body.length > 900 || !/[฀-๿]/.test(s.body)) return 'bad section text';
    const problem = checkGrounding(`${s.title} ${s.body}`, s.evidence_ids, rows);
    if (problem) return problem;
  }
  const rest = `${(candidate.reflection_questions || []).join(' ')} ${candidate.closing || ''}`;
  if (unsafeTh.test(rest) || !candidate.closing || candidate.closing.length > 400) return 'bad closing';
  return null;
}

function templateReading(rows, topic) {
  const pick = kinds => rows.filter(r => kinds.includes(r.kind)).slice(0, 3);
  const section = (title, list) => list.length ? { title, body: list.map(r => r.th).join(' · '), evidence_ids: list.map(r => r.id) } : null;
  return [
    section('ตำแหน่งหลักในดวงกำเนิด', rows.filter(r => ['P:Sun', 'P:Moon', 'P:Ascendant'].includes(r.id))),
    section('จุดเชื่อมโยงในดวง', pick(['natal-aspect'])),
    section(`ช่วงนี้กับเรื่อง${TOPIC_TH[topic]}`, pick(['transit'])),
    section('ช่วงเวลาที่ใช้อยู่ (ทดลอง)', pick(['vedic', 'slow-transit']))
  ].filter(Boolean);
}

const hasKey = apiKey => typeof apiKey === 'string' && apiKey.length > 0;

function prepare(input, topicDefault = 'general') {
  const topic = input.topic || topicDefault;
  const question = typeof input.question === 'string' ? input.question.trim().slice(0, MAX_QUESTION) : '';
  const safety = question ? classify(question) : { level: 'normal', cats: [] };
  return { topic, question, safety };
}

export async function deepReading(input, { apiKey = process.env.OPENAI_API_KEY, model = process.env.OPENAI_MODEL || 'gpt-4o-mini', fetcher = fetch } = {}) {
  const { topic, question, safety } = prepare(input);
  if (safety.level === 'crisis') return crisisAnswer('th');
  const { chart, rows, timeKnown } = buildEvidence({ birthProfile: input.birthProfile, date: input.date, timezone: input.timezone, topic });
  const base = {
    birthTimeKnown: timeKnown,
    type: 'deep-reading', version: READING_VERSION, topic, topicTh: TOPIC_TH[topic], date: input.date,
    notice: safety.level === 'warn' ? noticeFor(safety.cats, 'th') : null,
    evidence: rows.map(({ id, kind, th }) => ({ id, kind, th })),
    chartSummary: { ascendant: timeKnown ? chart.placements.find(p => p.body === 'Ascendant')?.sign : null, sun: chart.placements.find(p => p.body === 'Sun')?.sign, moon: rows.some(r => r.id === 'P:Moon') ? chart.placements.find(p => p.body === 'Moon')?.sign : null },
    persona: 'แม่หมอ AI (ปัญญาประดิษฐ์ ไม่ใช่หมอดูที่เป็นมนุษย์)',
    limits: 'เพื่อความบันเทิงและการสะท้อนตัวเอง ไม่ใช่การทำนายที่พิสูจน์ได้ทางวิทยาศาสตร์ ไม่ใช่คำแนะนำด้านสุขภาพ กฎหมาย หรือการเงิน',
    privacy: 'ข้อมูลวันเวลาเกิดถูกประมวลผลในหน่วยความจำเพื่อตอบครั้งนี้ ไม่ถูกบันทึกบนเซิร์ฟเวอร์'
  };
  const fallback = () => ({ ...base, sections: templateReading(rows, topic), reflection_questions: ['ข้อไหนในนี้ตรงกับช่วงชีวิตตอนนี้ของคุณ และข้อไหนไม่ตรง'], closing: 'สรุปจากการคำนวณล้วน ๆ ไม่มีการตีความด้วย AI', source: 'evidence-only template' });
  if (input.consent !== true || !hasKey(apiKey)) return fallback();
  try {
    const candidate = await callModel({
      instructions: STYLE + ` Write a deep reading on the topic "${TOPIC_TH[topic]}" with 3 to 5 sections, each 80-600 Thai characters, then 2-3 reflection questions and a short closing. ${question ? 'Address the user question where the evidence allows.' : ''}`,
      input: { topic, question: question || null, evidence: rows.map(({ id, en }) => ({ id, fact: en })) },
      name: 'deep_reading', schema: SCHEMA, apiKey, model, fetcher
    });
    const problem = validateReading(candidate, rows);
    if (problem) throw new Error(problem);
    return { ...base, sections: candidate.sections, reflection_questions: candidate.reflection_questions, closing: candidate.closing, source: `OpenAI ${model}, validated against evidence ids` };
  } catch (err) {
    return { ...fallback(), source: 'evidence-only template (AI output rejected or unavailable)' };
  }
}

export async function chatWithPersona(input, { apiKey = process.env.OPENAI_API_KEY, model = process.env.OPENAI_MODEL || 'gpt-4o-mini', fetcher = fetch } = {}) {
  const message = typeof input.message === 'string' ? input.message.trim().slice(0, MAX_QUESTION) : '';
  if (!message) throw new Error('message is required');
  const safety = classify(message);
  if (safety.level === 'crisis') return crisisAnswer('th');
  const history = Array.isArray(input.history) ? input.history.slice(-MAX_TURNS).map(t => ({ role: t?.role === 'user' ? 'user' : 'assistant', text: String(t?.text ?? '').slice(0, 600) })) : [];
  // Earlier turns are untrusted data; a crisis message anywhere in them also routes to support.
  if (history.some(t => t.role === 'user' && classify(t.text).level === 'crisis')) return crisisAnswer('th');
  const topic = input.topic || 'general';
  const { rows } = buildEvidence({ birthProfile: input.birthProfile, date: input.date, timezone: input.timezone, topic });
  const notice = safety.level === 'warn' ? noticeFor(safety.cats, 'th') : null;
  const base = { type: 'persona-chat', version: READING_VERSION, persona: 'แม่หมอ AI (ปัญญาประดิษฐ์ ไม่ใช่หมอดูที่เป็นมนุษย์)', notice };
  const offline = { ...base, reply: 'ตอนนี้แม่หมอ AI ตอบไม่ได้ (ยังไม่ได้ยินยอมให้ใช้ AI หรือโควตาทดลองหมดหรือระบบ AI ไม่พร้อม) อ่านสรุปจากดวงด้านบนไปก่อนนะ', evidence_ids: [], source: 'unavailable' };
  if (input.consent !== true || !hasKey(apiKey)) return offline;
  try {
    const candidate = await callModel({
      instructions: STYLE + ' Reply in 2-5 short Thai sentences to the latest user message, continuing the conversation. End with one gentle question when natural. If the evidence cannot answer, say so honestly.',
      input: { topic, history, message, evidence: rows.map(({ id, en }) => ({ id, fact: en })) },
      name: 'persona_reply', schema: CHAT_SCHEMA, apiKey, model, fetcher
    });
    if (typeof candidate.reply !== 'string' || candidate.reply.length < 10 || candidate.reply.length > 700 || !/[฀-๿]/.test(candidate.reply)) throw new Error('bad reply');
    const problem = checkGrounding(candidate.reply, candidate.evidence_ids, rows);
    if (problem) throw new Error(problem);
    return { ...base, reply: candidate.reply, evidence_ids: candidate.evidence_ids, source: `OpenAI ${model}, validated against evidence ids` };
  } catch {
    return { ...offline, reply: 'ขออภัย ตอนนี้แม่หมอ AI ตอบไม่ได้อย่างที่ตรวจสอบกับดวงได้ ลองถามใหม่ให้สั้นลงอีกครั้งนะ' };
  }
}
