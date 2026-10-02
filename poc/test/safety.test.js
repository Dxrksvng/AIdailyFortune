import test from 'node:test';
import assert from 'node:assert/strict';
import { classify, HOTLINE, noticeFor } from '../lib/safety.js';
import { answerQuestion } from '../lib/oracle.js';

const BASE = { date: '2026-10-02', timezone: 'Asia/Bangkok', lang: 'th' };

test('crisis wording is detected, including spacing, repeats and leetspeak evasions', () => {
  for (const q of ['อยากตาย', 'ไม่อยากอยู่แล้ว', 'ฆ่า ตัว ตาย', 'อยากตายยยย', 'I want to die', 'i w4nt t0 d1e'.replace('w4nt', 'want'), 'kill myself', 'self-harm', 'cut myself', 'unalive', 'ทำร้ายตัวเอง', 'ไม่อยากมีชีวิตอยู่']) {
    assert.equal(classify(q).level, 'crisis', q);
  }
});

test('ordinary questions are not crisis', () => {
  for (const q of ['งานที่เพิ่งสัมภาษณ์ไปจะได้ไหม', 'อยากรู้ว่าจะได้งานไหม', 'ควรลงทุนหุ้นไหม', 'วันนี้ใส่สีอะไรดี', 'Will I get the job?']) {
    assert.notEqual(classify(q).level, 'crisis', q);
  }
});

test('warn categories: lottery, health, money, legal, death', () => {
  assert.deepEqual(classify('ซื้อหวยเลขอะไรดี').cats, ['lottery']);
  assert.deepEqual(classify('เลขเด็ดงวดนี้').cats, ['lottery']);
  assert.ok(classify('ฉันจะป่วยเป็นมะเร็งไหม').cats.includes('health'));
  assert.ok(classify('ควรลงทุนหุ้นไหม').cats.includes('money'));
  assert.ok(classify('ถูกฟ้องคดีจะแพ้ไหม').cats.includes('legal'));
  assert.ok(classify('เขาจะตายไหม').cats.includes('death'));
  assert.equal(classify('ไปหาหมอดูดีไหม').cats.includes('health'), false, 'หมอดู is a fortune-teller, not a doctor');
  assert.equal(classify('โรงเรียนใหม่จะดีไหม').cats.length, 0);
});

test('a crisis answer holds only the support panel: no cards, colour, confidence or sources', () => {
  const { route, answer } = answerQuestion({ ...BASE, question: 'อยากตาย' });
  assert.equal(route.intent, 'crisis');
  assert.equal(answer.type, 'crisis');
  assert.equal(answer.hotline.number, HOTLINE.number);
  for (const key of ['cards', 'confidence', 'guidance', 'sources', 'ritualGuide', 'primaryHexagram', 'signal', 'safety']) assert.equal(key in answer, false, key);
  assert.match(JSON.stringify(answer), /1323/);
});

test('a warn answer carries answer.safety.notice and still returns a reading', () => {
  const { answer } = answerQuestion({ ...BASE, question: 'ควรลงทุนหุ้นไหม' });
  assert.equal(answer.safety.level, 'warn');
  assert.equal(answer.safety.notice, noticeFor(['money'], 'th'));
  assert.match(answer.safety.notice, /ไม่ใช่คำแนะนำการลงทุน/);
  assert.notEqual(answer.type, 'crisis');
  assert.ok(answer.confidence, 'a warn answer still has the qualitative confidence');
});

test('hotline is flagged as not verified so the UI cannot claim otherwise', () => {
  assert.equal(HOTLINE.verified, false);
});

test('warn questions are routed to a matching topic, not to the UI default', () => {
  const ask = (question, topic = 'career') => answerQuestion({ ...BASE, question, topic });
  assert.equal(ask('ควรลงทุนหุ้นไหม').route.topic, 'money');
  assert.equal(ask('ซื้อหวยเลขอะไรดี').route.topic, 'money');
  assert.equal(ask('ฉันจะป่วยเป็นมะเร็งไหม').route.topic, 'general');
  assert.equal(ask('ถูกฟ้องคดีจะแพ้ไหม').route.topic, 'general');
  assert.equal(ask('วันนี้ควรทำอะไร').route.topic, 'career', 'an ordinary question keeps the UI topic');
  assert.doesNotMatch(JSON.stringify(ask('ควรลงทุนหุ้นไหม').answer), /เรซูเม่|ผลงาน/, 'no career advice for an investing question');
});
