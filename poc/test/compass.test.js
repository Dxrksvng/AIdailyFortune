import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';
import { validDate, validTimezone, sunSign, localNoonUtc, readingFor } from '../lib/compass.js';
import { withNarrative, validateNarrative } from '../lib/narrative.js';
import { MAJOR_ARCANA, SPREADS, drawCards } from '../public/tarot.js';

test('input validation and profile precision', () => {
  assert.equal(validDate('2026-02-29'), false);
  assert.equal(validDate('2024-02-29'), true);
  assert.equal(validTimezone('Asia/Bangkok'), true);
  assert.equal(validTimezone('Mars/Olympus'), false);
  assert.equal(sunSign('1998-04-10'), 'Aries');
  assert.equal(sunSign('1998-01-10'), 'Capricorn');
});

test('local noon calculation handles positive and negative offsets', () => {
  assert.equal(localNoonUtc('2026-10-01', 'Asia/Bangkok').toISOString(), '2026-10-01T05:00:00.000Z');
  assert.equal(localNoonUtc('2026-10-01', 'America/New_York').toISOString(), '2026-10-01T16:00:00.000Z');
});

test('reading is stable and grounded in source range', () => {
  const input = { date: '2026-10-01', timezone: 'Asia/Bangkok' };
  const a = readingFor(input), b = readingFor(input);
  assert.deepEqual(a, b);
  assert.equal(a.interpretation.ruleId, 'FULL');
  assert.ok(a.source.phaseAngle >= 180 && a.source.phaseAngle < 270);
  assert.match(a.content.why, /Rule FULL/);
  const personalized = readingFor({ ...input, sign: 'Aries' });
  assert.equal(personalized.interpretation.ruleId, a.interpretation.ruleId);
  assert.equal(personalized.interpretation.profileRuleId, 'ELEMENT_FIRE');
  assert.notEqual(personalized.content.action, a.content.action);
});

test('API responds and rejects invalid calculation requests', async () => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const good = await fetch(`${base}/api/reading?date=2026-10-01&timezone=Asia%2FBangkok`);
    assert.equal(good.status, 200);
    assert.equal((await good.json()).source.calculator, 'astronomy-engine@2.1.19');
    const bad = await fetch(`${base}/api/reading?date=2026-02-29&timezone=Mars%2FOlympus`);
    assert.equal(bad.status, 400);
    const page = await fetch(base);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /<title>/); // the site name is asserted in ui-static.test.js
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('optional AI narrative is bounded and falls back on unsafe output', async () => {
  const base = readingFor({ date: '2026-10-01', timezone: 'Asia/Bangkok' });
  const good = await withNarrative(base, { consent: true, apiKey: 'test-only', fetcher: async () => ({ ok: true, json: async () => ({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify({ reading: 'You may notice what deserves more attention today.', reflection_prompt: 'What became clearer for you today?' }) }] }] }) }) });
  assert.equal(good.narrativeSource, 'OpenAI gpt-4o-mini');
  assert.equal(good.content.action, base.content.action);
  const bad = validateNarrative({ reading: 'You will definitely die today.', reflection_prompt: 'What became clearer today?' }, base.content);
  assert.equal(bad, null);
  const fallback = await withNarrative(base, { consent: true, apiKey: 'test-only', fetcher: async () => { throw new Error('network down'); } });
  assert.equal(fallback.narrativeSource, 'approved template fallback');
  assert.deepEqual(fallback.content, base.content);
});

test('Tarot POC draws distinct cards from a fixed Major Arcana catalog', () => {
  assert.equal(MAJOR_ARCANA.length, 22);
  assert.equal(new Set(MAJOR_ARCANA.map(card => card.id)).size, 22);
  assert.equal(SPREADS.career.roles.length, 3);
  const cards = drawCards(3);
  assert.equal(cards.length, 3);
  assert.equal(new Set(cards.map(card => card.id)).size, 3);
  assert.ok(cards.every(card => card.meaning && card.theme));
});

test('Thai AI narrative: consent gate, Thai validator and fallback', async () => {
  const { validateNarrativeTh } = await import('../lib/narrative.js');
  const base = readingFor({ date: '2026-10-01', timezone: 'Asia/Bangkok' });
  let calls = 0;
  const ok = text => async () => { calls++; return { ok: true, json: async () => ({ status: 'completed', output: [{ content: [{ type: 'output_text', text }] }] }) }; };
  const goodText = JSON.stringify({ reading: 'วันนี้อาจเป็นจังหวะที่ลองสังเกตว่าอะไรต้องการความใส่ใจมากที่สุด', reflection_prompt: 'วันนี้อะไรชัดขึ้นบ้าง' });
  // no consent: nothing is sent, whatever the environment provides
  const off = await withNarrative(base, { consent: false, lang: 'th', apiKey: 'test-only', fetcher: ok(goodText) });
  assert.equal(calls, 0);
  assert.equal(off.narrativeSource, 'approved template');
  assert.deepEqual(off.contentTh, base.contentTh);
  // consent + valid Thai: contentTh is rephrased, action stays fixed
  const on = await withNarrative(base, { consent: true, lang: 'th', apiKey: 'test-only', fetcher: ok(goodText) });
  assert.equal(calls, 1);
  assert.equal(on.narrativeSource, 'OpenAI gpt-4o-mini');
  assert.match(on.contentTh.reading, /ลองสังเกต/);
  assert.equal(on.contentTh.action, base.contentTh.action);
  assert.deepEqual(on.content, base.content, 'English content is untouched in Thai mode');
  // certainty wording is rejected and falls back to the template
  const bad = JSON.stringify({ reading: 'วันนี้จะได้งานแน่นอน รับประกันว่าสำเร็จทุกเรื่อง', reflection_prompt: 'พร้อมไหม' });
  const rejected = await withNarrative(base, { consent: true, lang: 'th', apiKey: 'test-only', fetcher: ok(bad) });
  assert.equal(rejected.narrativeSource, 'approved template fallback');
  assert.deepEqual(rejected.contentTh, base.contentTh);
  assert.equal(validateNarrativeTh({ reading: 'short', reflection_prompt: 'x' }, base.contentTh), null);
});

test('every feature page is served at a clean URL with the shared nav and footer included', async () => {
  const { PAGES } = await import('../server.js');
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const page of ['', ...PAGES]) {
      const response = await fetch(`${base}/${page}`);
      assert.equal(response.status, 200, `/${page}`);
      const html = await response.text();
      assert.doesNotMatch(html, /<!--include:/, `/${page} still has an unresolved include`);
      assert.match(html, /class="nav"/, `/${page} nav`);
      assert.match(html, /id="aiConsent"/, `/${page} footer`);
    }
    assert.equal((await fetch(`${base}/_partials/top.html`)).status, 404, 'partials are not served directly');
    assert.equal((await fetch(`${base}/missing`)).status, 404);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
