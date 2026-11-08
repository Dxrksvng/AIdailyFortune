// Router and safety evaluation. Runs every question in eval/questions.json through the real
// answerQuestion() and compares the route and the safety level with the expected labels.
//   node scripts/eval-router.mjs                 print the report
//   node scripts/eval-router.mjs --json out.json also write the report as JSON
//   node scripts/eval-router.mjs --check         exit 1 when a metric is below eval/thresholds.json
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { answerQuestion } from '../lib/oracle.js';
import { classify } from '../lib/safety.js';

const here = new URL('..', import.meta.url).pathname;
export const load = (file = 'eval/questions.json') => JSON.parse(readFileSync(`${here}${file}`, 'utf8')).questions;

export function evaluate(questions = load()) {
  const rows = questions.map(item => {
    let out = null, error = null;
    try { out = answerQuestion({ question: item.q, topic: 'general', horizon: 'day', date: '2026-10-02', timezone: 'Asia/Bangkok' }); } catch (e) { error = e.message; }
    const route = out?.route || {};
    const actual = { safety: classify(item.q).level, intent: route.intent, topic: route.topic, horizon: route.horizon, method: route.method };
    const checks = {};
    for (const field of ['safety', 'intent', 'topic', 'horizon', 'method']) if (item[field]) checks[field] = actual[field] === item[field];
    const answerHash = out ? createHash('md5').update(JSON.stringify(out.answer)).digest('hex').slice(0, 8) : null;
    return { item, actual, checks, error, answerHash, ok: !error && Object.values(checks).every(Boolean) };
  });
  const main = rows.filter(r => !r.item.borderline), border = rows.filter(r => r.item.borderline);
  const rate = (list, pick) => { const n = list.filter(pick.has).length; const d = list.filter(pick.has); return d.length ? d.filter(pick.ok).length / d.length : null; };
  const field = f => ({ has: r => f in r.checks, ok: r => r.checks[f] });
  const crisisRows = main.filter(r => r.item.safety === 'crisis'), warnRows = main.filter(r => r.item.safety === 'warn'), normalRows = main.filter(r => r.item.safety === 'normal');
  // two different questions that get byte-identical answers while expecting different routes
  const byHash = new Map();
  for (const r of main) if (r.answerHash && !['crisis'].includes(r.actual.intent)) byHash.set(r.answerHash, [...(byHash.get(r.answerHash) || []), r]);
  const collisions = [...byHash.values()].filter(g => new Set(g.map(r => `${r.item.intent}|${r.item.topic}|${r.item.horizon}`)).size > 1);
  const metrics = {
    questions: main.length,
    crisisRecall: crisisRows.length ? crisisRows.filter(r => r.checks.safety).length / crisisRows.length : null,
    warnRecall: warnRows.length ? warnRows.filter(r => r.checks.safety).length / warnRows.length : null,
    normalFalsePositive: normalRows.length ? normalRows.filter(r => !r.checks.safety).length / normalRows.length : null,
    intentAccuracy: rate(main, field('intent')), topicAccuracy: rate(main, field('topic')), horizonAccuracy: rate(main, field('horizon')), methodAccuracy: rate(main, field('method')),
    exactRoute: main.filter(r => r.ok).length / main.length,
    unsupportedHandled: (() => { const u = main.filter(r => r.item.intent === 'unsupported'); return u.length ? u.filter(r => r.checks.intent).length / u.length : null; })(),
    answerCollisions: collisions.length
  };
  return { metrics, rows, borderline: border, collisions };
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  const fileAt = process.argv.indexOf('--file');
  const report = evaluate(load(fileAt > 0 ? process.argv[fileAt + 1] : undefined));
  const pct = v => v === null ? 'n/a' : (v * 100).toFixed(1) + '%';
  const m = report.metrics;
  console.log(`questions (excluding borderline): ${m.questions}`);
  for (const [k, v] of Object.entries(m)) if (k !== 'questions' && k !== 'answerCollisions') console.log(`  ${k.padEnd(22)} ${pct(v)}`);
  console.log(`  ${'answerCollisions'.padEnd(22)} ${m.answerCollisions} group(s) of different questions got the identical answer`);
  const bad = report.rows.filter(r => !r.ok && !r.item.borderline);
  console.log(`\nfailures: ${bad.length}`);
  for (const r of bad) console.log(`  ${r.item.id} ${JSON.stringify(r.item.q)}${r.error ? ' ERROR ' + r.error : ''}\n     expected ${JSON.stringify(Object.fromEntries(Object.keys(r.checks).map(f => [f, r.item[f]])))} got ${JSON.stringify(Object.fromEntries(Object.keys(r.checks).map(f => [f, r.actual[f]])))}`);
  for (const g of report.collisions) console.log(`  collision: ${g.map(r => JSON.stringify(r.item.q)).join(' / ')}`);
  if (report.borderline.length) console.log(`\nborderline (not counted): ${report.borderline.map(r => `${JSON.stringify(r.item.q)} -> safety ${r.actual.safety}, intent ${r.actual.intent}`).join('; ')}`);
  const jsonAt = process.argv.indexOf('--json');
  if (jsonAt > 0) writeFileSync(process.argv[jsonAt + 1], JSON.stringify({ metrics: m, failures: bad.map(r => ({ id: r.item.id, q: r.item.q, expected: r.item, actual: r.actual })) }, null, 1));
  if (process.argv.includes('--check')) {
    const t = JSON.parse(readFileSync(`${here}eval/thresholds.json`, 'utf8'))[fileAt > 0 && process.argv[fileAt + 1].includes('heldout') ? 'heldout' : 'dev'];
    const low = Object.entries(t.min || {}).filter(([k, v]) => m[k] === null || m[k] < v).map(([k, v]) => `${k} ${pct(m[k])} < ${pct(v)}`);
    const high = Object.entries(t.max || {}).filter(([k, v]) => m[k] > v).map(([k, v]) => `${k} ${m[k]} > ${v}`);
    if (low.length || high.length) { console.error('\nBELOW THRESHOLD: ' + [...low, ...high].join('; ')); process.exit(1); }
    console.log('\nall thresholds met');
  }
}
