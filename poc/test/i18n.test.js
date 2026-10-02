import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EN, TH, QUESTION_EN } from '../public/i18n.js';

const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');

test('every data-i18n key in index.html has an English string', () => {
  const keys = [...html.matchAll(/data-i18n(?:-html|-ph|-aria)?="([^"]+)"/g)].map(m => m[1]);
  assert.ok(keys.length > 150);
  const missing = [...new Set(keys)].filter(key => !(key in EN));
  assert.deepEqual(missing, []);
});

test('every t("key") used in app.js exists in English, and has Thai unless the key is static in the HTML', () => {
  const used = [...new Set([...app.matchAll(/\bt\('([^']+)'(?!\s*\+)/g)].map(m => m[1]))]; // t('a.' + x) prefixes are expanded explicitly below
  const staticKeys = new Set([...html.matchAll(/data-i18n(?:-html|-ph|-aria)?="([^"]+)"/g)].map(m => m[1]));
  for (const key of used) {
    assert.ok(key in EN, `missing EN: ${key}`);
    assert.ok(key in TH || staticKeys.has(key), `missing Thai for dynamic key: ${key}`);
  }
  const expanded = [1, 2, 3, 4, 5].flatMap(n => [`ob.t${n}`, `ob.s${n}`]).concat(['work', 'love', 'money', 'study', 'health', 'travel', 'growth'].map(x => `int.${x}`), ['low', 'medium', 'good'].map(x => `ans.conf.${x}`));
  for (const key of expanded) { assert.ok(key in EN, `missing EN: ${key}`); assert.ok(key in TH, `missing Thai: ${key}`); }
  for (const key of ['lf.e.open', 'lf.e.review', 'lf.e.quiet', 'd.h.day', 'd.h.week', 'd.h.month', 'd.h.year', 't.general', 't.love', 't.career', 't.study', 't.money']) assert.ok(key in EN, key);
});

test('every Thai suggestion question has an English equivalent', () => {
  const questions = [...html.matchAll(/data-(?:q|question)="([^"]+)"/g)].map(m => m[1]);
  assert.ok(questions.length >= 10);
  for (const q of new Set(questions)) assert.ok(q in QUESTION_EN, q);
});
