import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';
import { answerQuestion, ichingCast, periodReading, routeQuestion, tarotReading } from '../lib/oracle.js';
import { ritualGuide } from '../lib/ritual.js';
import { lifeTimeline } from '../lib/life.js';

test('period reading uses date-bounded calculated samples and explicit topic', () => {
  const reading = periodReading({ date: '2026-10-01', timezone: 'Asia/Bangkok', topic: 'career', horizon: 'week' });
  assert.deepEqual(reading.interval, { start: '2026-10-01', end: '2026-10-07' });
  assert.equal(reading.source.length, 3);
  assert.equal(reading.topic, 'career');
  assert.match(reading.limits, /cannot predict/);
  assert.equal(periodReading({ date: '2026-01-31', timezone: 'Asia/Bangkok', horizon: 'month' }).interval.end, '2026-03-01');
  assert.throws(() => periodReading({ date: '2026-10-01', timezone: 'Asia/Bangkok', topic: 'health' }), /Invalid topic/);
});

test('question routing covers common intents and method override', () => {
  assert.equal(routeQuestion('Will I get the job after my interview?').method, 'tarot');
  assert.equal(routeQuestion('คนเก่าจะกลับมาไหม').spread, 'relationship');
  assert.equal(routeQuestion('Should I choose between A or B?').method, 'iching');
  assert.equal(routeQuestion('A กับ B ควรเลือกอะไร').method, 'iching');
  assert.equal(routeQuestion('การเงินเดือนหน้า').horizon, 'month');
  assert.equal(routeQuestion('เทพองค์ไหนเหมาะกับฉัน').method, 'belief');
  assert.equal(routeQuestion('Should I invest all my money?').intent, 'high-stakes');
  assert.equal(routeQuestion('Will I get the job?', 'western').method, 'western');
});

test('Tarot has unique cards and I Ching transformation follows changing lines', () => {
  const tarot = tarotReading({ question: 'Will I get the job?', spread: 'career' });
  assert.equal(tarot.cards.length, 3);
  assert.equal(new Set(tarot.cards.map(card => card.id)).size, 3);
  const cast = ichingCast({ question: 'A or B?' });
  assert.equal(cast.lines.length, 6);
  assert.ok(cast.lines.every(line => [6, 7, 8, 9].includes(line.value)));
  for (const line of cast.lines) {
    const i = line.position - 1;
    assert.equal(Number(cast.primaryBitsBottomUp[i]) !== Number(cast.transformedBitsBottomUp[i]), line.changing);
  }
  assert.match(cast.limits, /symbolic prompts/);
});

test('answer policy does not fabricate deity assignment or high-stakes divination', () => {
  const input = { date: '2026-10-01', timezone: 'Asia/Bangkok' };
  assert.equal(answerQuestion({ ...input, question: 'เทพองค์ไหนเหมาะกับฉัน' }).answer.type, 'belief');
  assert.equal(answerQuestion({ ...input, question: 'Should I stop medication?' }).answer.type, 'safety');
  assert.equal(answerQuestion({ ...input, question: 'Should I invest in this stock?', method: 'tarot', spread: 'money' }).answer.type, 'safety');
  assert.equal(answerQuestion({ ...input, question: 'วันนี้ควรใส่สีอะไร' }).answer.type, 'ritual');
  assert.match(answerQuestion({ ...input, question: 'จะได้งานที่สัมภาษณ์มาไหม' }).answer.message, /ผลรับเข้าทำงานยังขึ้นกับนายจ้าง/);
  assert.match(answerQuestion({ ...input, question: 'คนเก่าจะกลับมาไหม' }).answer.message, /ไพ่ไม่บอกความคิด/);
  assert.equal(answerQuestion({ ...input, question: 'เทพองค์ไหนเหมาะกับฉัน', method: 'tarot' }).route.method, 'belief');
});

test('system API exposes capabilities, period and question endpoints without storing question', async () => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const capabilities = await (await fetch(`${base}/api/capabilities`)).json();
    assert.ok(capabilities.methods.vedic.includes('vimshottari-mahadasha-major-periods'));
    const period = await fetch(`${base}/api/period?date=2026-10-01&timezone=Asia%2FBangkok&topic=study&horizon=month`);
    assert.equal(period.status, 200);
    assert.equal((await period.json()).topic, 'study');
    const ask = await fetch(`${base}/api/ask`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: 'จะได้งานที่สัมภาษณ์มาไหม', date: '2026-10-01', timezone: 'Asia/Bangkok' }) });
    assert.equal(ask.status, 200);
    const payload = await ask.json();
    assert.equal(payload.route.method, 'tarot');
    assert.equal(payload.answer.cards.length, 3);
    assert.equal(JSON.stringify(payload).includes('จะได้งานที่สัมภาษณ์มาไหม'), false);
    const customSpread = await fetch(`${base}/api/ask`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: 'How should I approach this?', method: 'tarot', spread: 'money' }) });
    const customPayload = await customSpread.json();
    assert.equal(customPayload.answer.spread, 'money');
    assert.equal(customPayload.answer.cards.length, 3);
    const vedic = await fetch(`${base}/api/vedic-timing`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ birthDate: '1990-06-15', birthTime: '12:00', timezone: 'Asia/Bangkok', latitude: 13.7563, longitude: 100.5018, asOfDate: '2026-10-01' }) });
    const vedicPayload = await vedic.json();
    assert.equal(vedic.status, 200);
    assert.equal(vedicPayload.type, 'vedic-timing');
    assert.ok(vedicPayload.currentMahadasha.lord);
    assert.equal(JSON.stringify(vedicPayload).includes('1990-06-15'), false);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

const BASE = { date: '2026-10-02', timezone: 'Asia/Bangkok' };
const PROFILE = { birthDate: '2000-05-14', birthTime: '08:30', timezone: 'Asia/Bangkok', latitude: 13.7563, longitude: 100.5018 };

test('Thai words containing "ยา" (e.g. อยาก) are not treated as medication questions', () => {
  assert.notEqual(routeQuestion('อยากรู้ว่าจะได้งานไหม').intent, 'high-stakes');
  assert.equal(routeQuestion('ต้องกินยาอะไรดี').intent, 'high-stakes');
  assert.equal(routeQuestion('Should I stop medication?').intent, 'high-stakes');
});

test('accuracy questions get an honest answer with no ranking or score', () => {
  for (const q of ['ศาสตร์ไหนแม่นสุด', 'Which system is most accurate?']) {
    const { answer } = answerQuestion({ ...BASE, question: q });
    assert.equal(answer.type, 'accuracy');
    assert.equal(answer.methodFit.length, 4);
    assert.match(answer.message, /ไม่มีหลักฐาน|no scientific evidence/);
    assert.doesNotMatch(JSON.stringify(answer), /\d+\s?%/);
  }
});

test('stress question returns support steps and does not read the sky', () => {
  const { answer } = answerQuestion({ ...BASE, question: 'เครียดมาก ขอคำแนะนำ', lang: 'th' });
  assert.equal(answer.type, 'support');
  assert.ok(answer.steps.length >= 3);
  assert.match(answer.care, /1323/);
});

test('job-this-month question gets a preparation plan and never promises an outcome', () => {
  const { route, answer } = answerQuestion({ ...BASE, question: 'จะมีงานทำภายในเดือนนี้ไหม', lang: 'th' });
  assert.equal(route.horizon, 'month');
  assert.ok(answer.steps.length >= 4);
  assert.match(answer.message, /ไม่สามารถระบุเหตุการณ์ล่วงหน้า/);
});

test('ritual guide: weekday colours are computed from the date and carry a no-effect disclaimer', () => {
  const guide = ritualGuide({ birthDate: '2000-05-14', date: '2026-10-02', timezone: 'Asia/Bangkok' });
  assert.equal(guide.birthDay.id, 'sun');
  assert.equal(guide.today.id, 'fri');
  assert.match(guide.noteTh, /ไม่มีหลักฐาน/);
  assert.throws(() => ritualGuide({ birthDate: '2000-02-31', date: '2026-10-02', timezone: 'Asia/Bangkok' }), /Invalid birth date/);
  const reply = answerQuestion({ ...BASE, question: 'ช่วงนี้โชคไม่ดี ทำยังไงดี', lang: 'th' }).answer;
  assert.equal(reply.type, 'ritual');
  assert.match(reply.steps.join(' '), /ไม่ต้องจ่ายเงินก้อนใหญ่/);
});

test('life timeline: bounded years, one row per year, interpretive wording only', () => {
  const t = lifeTimeline({ birthProfile: PROFILE, ...BASE, years: 3 });
  assert.equal(t.rows.length, 3);
  assert.equal(t.rows[0].start, '2026-10-02');
  assert.equal(t.rows[1].start, '2027-10-02');
  for (const row of t.rows) for (const c of row.contacts) assert.ok(['Jupiter', 'Saturn'].includes(c.transit));
  assert.match(t.limits, /not predicted events/);
  assert.throws(() => lifeTimeline({ birthProfile: PROFILE, ...BASE, years: 11 }), /years must be/);
  assert.throws(() => lifeTimeline({ ...BASE, years: 3 }), /birth profile/);
  const ask = answerQuestion({ ...BASE, question: 'อีก 5 ปีชีวิตจะเป็นยังไง', birthProfile: PROFILE, lang: 'th' });
  assert.equal(ask.answer.rows.length, 5);
  assert.equal(answerQuestion({ ...BASE, question: 'อีก 5 ปีชีวิตจะเป็นยังไง' }).answer.type, 'needs-profile');
});

test('Thai tarot cards expose Thai names, themes and meanings for all 78 cards', async () => {
  const { TAROT_DECK } = await import('../public/tarot.js');
  const { tarotThai } = await import('../lib/th.js');
  assert.equal(TAROT_DECK.length, 78);
  for (const card of TAROT_DECK) {
    const t = tarotThai(card);
    assert.match(t.nameTh, /[\u0e00-\u0e7f]/, card.id);
    assert.match(t.meaningTh, /[\u0e00-\u0e7f]/, card.id);
  }
});

test('life-timeline and ritual API endpoints validate input', async () => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body) => fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  try {
    const ok = await post('/api/life-timeline', { birthProfile: PROFILE, ...BASE, years: 2 });
    assert.equal(ok.status, 200);
    assert.equal((await ok.json()).rows.length, 2);
    assert.equal((await post('/api/life-timeline', { ...BASE, years: 2 })).status, 400);
    assert.equal((await post('/api/ritual', { ...BASE, birthDate: '2000-05-14' })).status, 200);
    assert.equal((await post('/api/ritual', { date: 'bad', timezone: 'Asia/Bangkok' })).status, 400);
  } finally { server.close(); }
});

test('life number reduces the birth date and keeps master numbers', async () => {
  const { lifeNumber } = await import('../lib/ritual.js');
  assert.equal(lifeNumber('1999-06-14'), 3); // 1+9+9+9+0+6+1+4 = 39 -> 12 -> 3
  assert.equal(lifeNumber('1992-02-09'), 5);
  assert.equal(lifeNumber('1990-01-09'), 11);
  assert.equal(lifeNumber('1990-01-02'), 22);
  assert.throws(() => lifeNumber('1990-02-31'), /Invalid birth date/);
});

test('answers carry qualitative confidence (never a percentage), structured guidance and sources', () => {
  const ask = (extra = {}) => answerQuestion({ ...BASE, question: 'จะมีงานทำภายในเดือนนี้ไหม', lang: 'th', ...extra }).answer;
  const noProfile = ask();
  assert.ok(['low', 'medium', 'good'].includes(noProfile.confidence.level));
  assert.ok(noProfile.confidence.reasons.length >= 2);
  assert.ok(noProfile.guidance.avoid && noProfile.guidance.boost);
  assert.ok(noProfile.sources.length >= 2);
  const withProfile = ask({ birthProfile: PROFILE });
  const unknownTime = ask({ birthProfile: PROFILE, birthTimeKnown: false });
  const rank = level => ['low', 'medium', 'good'].indexOf(level);
  assert.ok(rank(withProfile.confidence.level) > rank(noProfile.confidence.level) || noProfile.confidence.level === 'low');
  assert.ok(rank(unknownTime.confidence.level) < rank(withProfile.confidence.level));
  assert.doesNotMatch(JSON.stringify(withProfile.confidence), /\d+\s?%/);
  const ex = answerQuestion({ ...BASE, question: 'แฟนเก่าจะกลับมาไหม', lang: 'th', birthProfile: PROFILE }).answer;
  assert.match(ex.confidence.reasons.join(' '), /ดวงมองไม่เห็น/);
  assert.equal(answerQuestion({ ...BASE, question: 'เครียดมาก', lang: 'th' }).answer.confidence, undefined);
});
