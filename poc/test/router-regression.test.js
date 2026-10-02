import test from 'node:test';
import assert from 'node:assert/strict';
import { answerQuestion } from '../lib/oracle.js';
import { classify } from '../lib/safety.js';
import { evaluate, load } from '../scripts/eval-router.mjs';
import { readFileSync } from 'node:fs';

const route = question => answerQuestion({ question, topic: 'general', horizon: 'day', date: '2026-10-02', timezone: 'Asia/Bangkok' });
const thresholds = JSON.parse(readFileSync(new URL('../eval/thresholds.json', import.meta.url), 'utf8'));

test('"โชคดี" (good luck) does not trigger the legal-case notice, but a real case question still does', () => {
  assert.equal(classify('วันนี้โชคดีไหม').level, 'normal');
  assert.equal(classify('ขอให้โชคดีนะ').level, 'normal');
  assert.deepEqual(classify('คดีที่ขึ้นศาลจะชนะไหม').cats, ['legal']);
});

test('"this year" in Thai is a year horizon and several life areas give the overall reading', () => {
  assert.equal(route('ปีนี้ดวงเป็นยังไง').route.horizon, 'year');
  const multi = route('ปีนี้ดวงเป็นยังไงบ้าง ทั้งงานและความรัก').route;
  assert.equal(multi.topic, 'general');
  assert.deepEqual(multi.topics, ['love', 'career']);
  assert.notEqual(multi.method, 'tarot');
});

test('lucky numbers, auspicious dates and names are answered as unsupported, not with an unrelated reading', () => {
  for (const q of ['เบอร์มงคลเบอร์ไหนดี', 'ฤกษ์ย้ายบ้านวันไหนดี', 'เปลี่ยนชื่อให้ดวงดีขึ้นได้ไหม', 'What is a lucky phone number?']) {
    const { answer } = route(q);
    assert.equal(answer.type, 'unsupported', q);
    assert.ok(answer.message && answer.steps.length >= 2, q);
    assert.equal(answer.confidence, undefined, 'no confidence level is shown for something the system does not do');
  }
  assert.equal(route('วันนี้ใส่สีอะไรดี').route.intent, 'ritual');
});

test('Thai and English job-offer questions are routed the same way', () => {
  assert.equal(route('Will I get the job offer?').route.method, 'tarot');
  assert.equal(route('งานที่เพิ่งสัมภาษณ์ไปจะได้ไหม').route.method, 'tarot');
});

test('every labelled question is well formed and ids are unique', () => {
  const allowed = { safety: ['normal', 'warn', 'crisis'], topic: ['general', 'love', 'career', 'study', 'money'], horizon: ['day', 'week', 'month', 'year'] };
  for (const file of ['eval/questions.json', 'eval/heldout.json']) {
    const qs = load(file);
    assert.equal(new Set(qs.map(q => q.id)).size, qs.length, file);
    for (const q of qs) for (const [field, values] of Object.entries(allowed)) if (q[field]) assert.ok(values.includes(q[field]), `${file} ${q.id} ${field}`);
  }
  const dev = new Set(load('eval/questions.json').map(q => q.q));
  assert.ok(load('eval/heldout.json').every(q => !dev.has(q.q)), 'held-out questions must not repeat development questions');
});

test('regression gate: development set metrics stay at or above the recorded floor', () => {
  const m = evaluate(load('eval/questions.json')).metrics;
  for (const [k, v] of Object.entries(thresholds.dev.min)) assert.ok(m[k] >= v, `${k} ${m[k]} < ${v}`);
  for (const [k, v] of Object.entries(thresholds.dev.max)) assert.ok(m[k] <= v, `${k} ${m[k]} > ${v}`);
});

test('safety gate on the held-out set: every crisis question is caught and nothing normal is flagged', () => {
  const m = evaluate(load('eval/heldout.json')).metrics;
  assert.equal(m.crisisRecall, 1);
  assert.equal(m.normalFalsePositive, 0);
});
