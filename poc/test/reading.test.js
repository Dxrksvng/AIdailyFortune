import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEvidence, deepReading, chatWithPersona, checkGrounding } from '../lib/reading.js';

const birthProfile = { birthDate: '1999-05-17', birthTime: '14:30', timezone: 'Asia/Bangkok', latitude: 13.75, longitude: 100.5 };
const base = { birthProfile, date: '2026-10-09', timezone: 'Asia/Bangkok', topic: 'career', consent: true };
const reply = payload => async () => ({ ok: true, json: async () => ({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify(payload) }] }] }) });
const opts = fetcher => ({ apiKey: 'test-key', model: 'm', fetcher });

test('evidence rows come from the calculation and have unique ids', () => {
  const { rows } = buildEvidence(base);
  assert.ok(rows.some(r => r.id === 'P:Sun' && r.en.includes('Taurus')));
  assert.equal(new Set(rows.map(r => r.id)).size, rows.length);
});

test('without consent or key the reading is evidence-only and makes no call', async () => {
  let called = false;
  const out = await deepReading({ ...base, consent: false }, opts(async () => { called = true; }));
  assert.equal(called, false);
  assert.match(out.source, /evidence-only/);
  assert.ok(out.sections.length >= 2);
});

test('a grounded model reading is accepted', async () => {
  const body = 'ดวงอาทิตย์กำเนิดอยู่ราศีพฤษภ จึงอาจทำให้คุณชอบความมั่นคงและค่อย ๆ สร้างงานทีละขั้น ลองสังเกตว่าจังหวะไหนที่คุณทำงานได้ลื่นที่สุด';
  const out = await deepReading(base, opts(reply({ sections: [{ title: 'ตัวตน', body, evidence_ids: ['P:Sun'] }, { title: 'งาน', body, evidence_ids: ['P:Sun'] }], reflection_questions: ['อะไรทำให้คุณมั่นใจ'], closing: 'ลองสังเกตตัวเองดูนะ' })));
  assert.match(out.source, /OpenAI/);
});

test('a reading that cites an unknown id or invents a sign falls back', async () => {
  const body = 'ดวงอาทิตย์กำเนิดอยู่ราศีสิงห์ จึงอาจทำให้คุณชอบความมั่นคงและค่อย ๆ สร้างงานทีละขั้น ลองสังเกตว่าจังหวะไหนที่คุณทำงานได้ลื่นที่สุด';
  const wrongSign = reply({ sections: [{ title: 'a', body, evidence_ids: ['P:Sun'] }, { title: 'b', body, evidence_ids: ['P:Sun'] }], reflection_questions: [], closing: 'ok' });
  assert.match((await deepReading(base, opts(wrongSign))).source, /rejected/);
  const badId = reply({ sections: [{ title: 'a', body, evidence_ids: ['P:Nope'] }, { title: 'b', body, evidence_ids: ['P:Nope'] }], reflection_questions: [], closing: 'ok' });
  assert.match((await deepReading(base, opts(badId))).source, /rejected/);
});

test('certain or lottery wording is rejected', () => {
  const { rows } = buildEvidence(base);
  assert.ok(checkGrounding('ฟันธงว่าจะรวย', ['P:Sun'], rows));
  assert.equal(checkGrounding('อาจจะดี', ['P:Sun'], rows), null);
});

test('crisis wording returns support and never calls the model', async () => {
  let called = false;
  const out = await chatWithPersona({ ...base, message: 'อยากตาย' }, opts(async () => { called = true; }));
  assert.equal(out.type, 'crisis');
  assert.equal(called, false);
  const viaHistory = await chatWithPersona({ ...base, message: 'ต่อเลย', history: [{ role: 'user', text: 'ฆ่าตัวตาย' }] }, opts(async () => { called = true; }));
  assert.equal(viaHistory.type, 'crisis');
});

test('persona chat reply is validated against evidence', async () => {
  const ok = await chatWithPersona({ ...base, message: 'งานช่วงนี้เป็นยังไง' }, opts(reply({ reply: 'ดวงอาทิตย์กำเนิดอยู่ราศีพฤษภ งานช่วงนี้อาจเดินไปช้าแต่มั่นคง ลองสังเกตจังหวะของตัวเองดูนะ', evidence_ids: ['P:Sun'] })));
  assert.match(ok.source, /OpenAI/);
  const bad = await chatWithPersona({ ...base, message: 'งานช่วงนี้เป็นยังไง' }, opts(reply({ reply: 'ดวงอาทิตย์กำเนิดอยู่ราศีเมษ งานช่วงนี้อาจเดินไปช้าแต่มั่นคง ลองสังเกตจังหวะดูนะ', evidence_ids: ['P:Sun'] })));
  assert.equal(bad.source, 'unavailable');
});

test('unknown birth time drops Ascendant, houses, Vedic periods and an unstable Moon', () => {
  const { rows } = buildEvidence({ ...base, birthProfile: { ...birthProfile, birthTime: undefined, birthTimeKnown: false } });
  const ids = rows.map(r => r.id);
  assert.ok(!ids.includes('P:Ascendant') && !ids.includes('P:Midheaven'));
  assert.ok(!ids.includes('V:dasha') && ids.includes('N:no-birth-time') && ids.includes('P:Sun'));
  assert.ok(rows.every(r => !/house \d/.test(r.en)));
  assert.ok(rows.every(r => !r.id.startsWith('T:Moon') && !r.id.includes('Ascendant')));
});
