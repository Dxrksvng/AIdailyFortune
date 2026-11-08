import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuota } from '../lib/quota.js';

const ID = 'device-0123456789abcdef';

test('device allowance is used up, then refused', () => {
  const q = createQuota({ perDevice: { 'deep-reading': 1 } });
  assert.equal(q.take('deep-reading', ID).allowed, true);
  assert.deepEqual(q.take('deep-reading', ID), { allowed: false, reason: 'device-limit', remaining: 0 });
});

test('missing or malformed device id gets no AI', () => {
  const q = createQuota();
  for (const id of [undefined, '', 'short', 'bad id with spaces!!!!']) assert.equal(q.take('persona-chat', id).reason, 'no-device');
});

test('global daily budget stops everyone, and resets the next day', () => {
  let date = new Date('2026-10-10T10:00:00Z');
  const q = createQuota({ dailyCalls: 2, perDevice: { 'persona-chat': 5 }, now: () => date });
  assert.equal(q.take('persona-chat', 'aaaaaaaaaaaaaaaa').allowed, true);
  assert.equal(q.take('persona-chat', 'bbbbbbbbbbbbbbbb').allowed, true);
  assert.equal(q.take('persona-chat', 'cccccccccccccccc').reason, 'daily-budget');
  date = new Date('2026-10-11T00:01:00Z');
  assert.equal(q.take('persona-chat', 'cccccccccccccccc').allowed, true);
});

test('refund returns an unused reservation', () => {
  const q = createQuota({ perDevice: { 'deep-reading': 1 } });
  q.take('deep-reading', ID); q.refund('deep-reading', ID);
  assert.equal(q.take('deep-reading', ID).allowed, true);
});
