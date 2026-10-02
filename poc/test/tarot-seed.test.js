import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';
import { tarotReading, dailyCard, tarotSeed } from '../lib/oracle.js';

const ids = reading => reading.cards.map(card => card.id);
const draw = (date, topic, spread, reshuffle = 0) => tarotReading({ question: 'q', spread, date, topic, reshuffle });
const dates = Array.from({ length: 20 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`);

test('same (date, topic, spread, reshuffle) gives identical card ids, in the same order', () => {
  for (const date of dates) {
    assert.deepEqual(ids(draw(date, 'career', 'career')), ids(draw(date, 'career', 'career')));
  }
  assert.equal(tarotSeed({ date: '2026-10-02', topic: 'career', spread: 'career', reshuffle: 0 }), '2026-10-02|career|career|0');
});

test('the question text does not change the cards', () => {
  const a = tarotReading({ question: 'งานที่เพิ่งสัมภาษณ์ไปจะได้ไหม', spread: 'career', date: '2026-10-02', topic: 'career' });
  const b = tarotReading({ question: 'a completely different wording', spread: 'career', date: '2026-10-02', topic: 'career' });
  assert.deepEqual(ids(a), ids(b));
});

test('a different topic or a reshuffle changes the order in at least 1 of 20 sampled dates', () => {
  const topicChanged = dates.filter(d => ids(draw(d, 'career', 'career')).join() !== ids(draw(d, 'money', 'money')).join());
  const reshuffled = dates.filter(d => ids(draw(d, 'career', 'career', 0)).join() !== ids(draw(d, 'career', 'career', 1)).join());
  assert.ok(topicChanged.length >= 1, 'topic should change the draw');
  assert.ok(reshuffled.length >= 1, 'reshuffle should change the draw');
  // stronger than the minimum: with 22 cards almost every date should differ
  assert.ok(topicChanged.length >= 15 && reshuffled.length >= 15, `topic ${topicChanged.length}/20, reshuffle ${reshuffled.length}/20`);
});

test('cards are unique and drawn from the 22 Major Arcana only', () => {
  for (const date of dates) {
    const reading = draw(date, 'general', 'timeline');
    assert.equal(new Set(ids(reading)).size, 3);
    for (const card of reading.cards) assert.ok(!/-of-/.test(card.id), `minor card drawn: ${card.id}`);
  }
  const seen = new Set(dates.flatMap(d => ids(draw(d, 'love', 'relationship'))));
  assert.ok(seen.size > 10, 'draws should cover many different cards across dates');
});

test('the shuffle is unbiased enough to reach every position (22 cards, many dates)', () => {
  const counts = new Map();
  for (let day = 1; day <= 300; day++) {
    const date = new Date(Date.UTC(2026, 0, day)).toISOString().slice(0, 10);
    const first = draw(date, 'general', 'general').cards[0].id;
    counts.set(first, (counts.get(first) || 0) + 1);
  }
  assert.equal(counts.size, 22, 'every one of the 22 cards should appear first at least once in 300 days');
});

test('reshuffle outside 0..1, a bad date or a bad topic is rejected', () => {
  assert.throws(() => draw('2026-10-02', 'career', 'career', 2), /reshuffle must be 0 or 1/);
  assert.throws(() => draw('2026-10-02', 'career', 'career', -1), /reshuffle/);
  assert.throws(() => tarotReading({ question: 'q', spread: 'career', date: '2026-10-02', topic: 'career', reshuffle: 0.5 }), /reshuffle/);
  assert.throws(() => draw('2026-02-31', 'career', 'career'), /valid local date/);
  assert.throws(() => tarotReading({ question: 'q', spread: 'career', date: '2026-10-02', topic: 'weather' }), /Invalid topic/);
});

test('the daily card is stable for a date and differs across dates', () => {
  assert.equal(dailyCard('2026-10-02').id, dailyCard('2026-10-02').id);
  assert.ok(new Set(dates.map(d => dailyCard(d).id)).size > 5);
});

test('API: /api/tarot is deterministic and reshuffle=2 returns HTTP 400', async () => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body) => fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  try {
    const one = await (await post('/api/tarot', { date: '2026-10-02', topic: 'career' })).json();
    const two = await (await post('/api/tarot', { date: '2026-10-02', topic: 'career' })).json();
    assert.deepEqual(ids(one), ids(two));
    assert.equal(one.cards.length, 3);
    const again = await (await post('/api/tarot', { date: '2026-10-02', topic: 'career', reshuffle: 1 })).json();
    assert.equal(again.reshuffle, 1);
    const bad = await post('/api/tarot', { date: '2026-10-02', topic: 'career', reshuffle: 2 });
    assert.equal(bad.status, 400);
    assert.match((await bad.json()).error, /reshuffle/);
    const viaAsk = await post('/api/ask', { question: 'งานที่เพิ่งสัมภาษณ์ไปจะได้ไหม', date: '2026-10-02', timezone: 'Asia/Bangkok', lang: 'th', reshuffle: 2 });
    assert.equal(viaAsk.status, 400);
    const askA = await (await post('/api/ask', { question: 'งานที่เพิ่งสัมภาษณ์ไปจะได้ไหม', date: '2026-10-02', timezone: 'Asia/Bangkok', lang: 'th' })).json();
    const askB = await (await post('/api/ask', { question: 'งานที่เพิ่งสัมภาษณ์ไปจะได้ไหม', date: '2026-10-02', timezone: 'Asia/Bangkok', lang: 'th' })).json();
    assert.deepEqual(ids(askA.answer), ids(askB.answer));
    assert.deepEqual(ids(askA.answer), ids(one), 'ask and /api/tarot share the same seed for the same topic');
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('the why text states the seeding policy', () => {
  assert.match(draw('2026-10-02', 'career', 'career').why, /seed from the date and topic/);
});
