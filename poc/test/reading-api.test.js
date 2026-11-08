import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';
import { createQuota } from '../lib/quota.js';

const birthProfile = { birthDate: '1999-05-17', birthTime: '14:30', timezone: 'Asia/Bangkok', latitude: 13.75, longitude: 100.5 };
const payload = { birthProfile, date: '2026-10-10', timezone: 'Asia/Bangkok', topic: 'love', consent: true };

async function withServer(fn) {
  const server = createServer({ quota: createQuota({ perDevice: { 'deep-reading': 1 } }), rateLimitPerMinute: 1000 });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const call = (path, body, headers = {}) => fetch(`http://127.0.0.1:${server.address().port}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) }).then(async r => ({ status: r.status, body: await r.json() }));
  try { await fn(call); } finally { await new Promise(resolve => server.close(resolve)); }
}

test('deep reading without an OpenAI key returns calculated evidence and says AI was not used', async () => {
  const saved = process.env.OPENAI_API_KEY; delete process.env.OPENAI_API_KEY;
  try {
    await withServer(async call => {
      const res = await call('/api/deep-reading', payload, { 'x-device-id': 'device-0123456789abcdef' });
      assert.equal(res.status, 200);
      assert.match(res.body.source, /evidence-only/);
      assert.ok(res.body.evidence.length > 5);
      assert.equal(res.body.quota.aiUsed, false); // reserved, then refunded because no model ran
      assert.equal(res.body.quota.remaining, 1);
      const again = await call('/api/deep-reading', payload, { 'x-device-id': 'device-0123456789abcdef' });
      assert.equal(again.body.quota.aiAllowed, true, 'refund keeps the allowance when no AI call happened');
    });
  } finally { if (saved) process.env.OPENAI_API_KEY = saved; }
});

test('no consent or no device id means no AI allowance', async () => {
  await withServer(async call => {
    assert.equal((await call('/api/deep-reading', { ...payload, consent: false }, { 'x-device-id': 'device-0123456789abcdef' })).body.quota.reason, 'no-consent');
    assert.equal((await call('/api/deep-reading', payload)).body.quota.reason, 'no-device');
  });
});

test('crisis wording in the question is routed to support at the HTTP layer', async () => {
  await withServer(async call => {
    const res = await call('/api/persona-chat', { ...payload, message: 'อยากตาย' }, { 'x-device-id': 'device-0123456789abcdef' });
    assert.equal(res.body.type, 'crisis');
  });
});
