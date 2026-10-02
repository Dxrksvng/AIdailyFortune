import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';

async function withServer(options, run) {
  const server = createServer(options);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { return await run(base); } finally { await new Promise(resolve => server.close(resolve)); }
}

test('every response carries the security headers and a request id', async () => {
  await withServer({}, async base => {
    for (const path of ['/', '/api/capabilities', '/assets/back.webp', '/nope']) {
      const res = await fetch(base + path);
      assert.match(res.headers.get('content-security-policy'), /default-src 'self'/, path);
      assert.match(res.headers.get('content-security-policy'), /frame-ancestors 'none'/, path);
      assert.equal(res.headers.get('referrer-policy'), 'no-referrer', path);
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff', path);
      assert.match(res.headers.get('x-request-id'), /^[0-9a-f-]{8}$/, path);
    }
  });
});

test('pages revalidate with an ETag, media is cached for a day, API answers are never cached', async () => {
  await withServer({}, async base => {
    const page = await fetch(base + '/');
    assert.equal(page.headers.get('cache-control'), 'no-cache');
    const etag = page.headers.get('etag');
    assert.ok(etag);
    const again = await fetch(base + '/', { headers: { 'if-none-match': etag } });
    assert.equal(again.status, 304);
    assert.equal((await again.text()).length, 0);
    const changed = await fetch(base + '/', { headers: { 'if-none-match': '"something-else"' } });
    assert.equal(changed.status, 200);

    assert.equal((await fetch(base + '/assets/back.webp')).headers.get('cache-control'), 'public, max-age=86400');
    const font = await fetch(base + '/fonts/anuphan-thai.woff2');
    assert.equal(font.headers.get('cache-control'), 'public, max-age=86400');
    assert.equal(font.headers.get('content-type'), 'font/woff2');
    assert.equal((await fetch(base + '/js/home.js')).headers.get('cache-control'), 'no-cache');
    assert.equal((await fetch(base + '/api/capabilities')).headers.get('cache-control'), 'no-store');
  });
});

test('video still answers byte ranges with 206 and rejects an impossible range with 416', async () => {
  await withServer({}, async base => {
    const part = await fetch(base + '/assets/video/orbit.mp4', { headers: { range: 'bytes=0-99' } });
    assert.equal(part.status, 206);
    assert.equal((await part.arrayBuffer()).byteLength, 100);
    assert.match(part.headers.get('content-range'), /^bytes 0-99\/\d+$/);
    assert.equal((await fetch(base + '/assets/video/orbit.mp4', { headers: { range: 'bytes=999999999-' } })).status, 416);
  });
});

test('API requests beyond the per-minute limit get 429 with Retry-After; pages are not limited', async () => {
  await withServer({ rateLimitPerMinute: 3 }, async base => {
    for (let i = 0; i < 3; i++) assert.equal((await fetch(base + '/api/capabilities')).status, 200);
    const blocked = await fetch(base + '/api/capabilities');
    assert.equal(blocked.status, 429);
    assert.ok(Number(blocked.headers.get('retry-after')) >= 1);
    assert.equal((await fetch(base + '/')).status, 200);
  });
});

test('the request log keeps the path but never the query string that carries the question', async () => {
  const lines = [], original = console.log;
  console.log = line => lines.push(String(line));
  try {
    await withServer({ log: true }, async base => { await fetch(base + '/ask?q=' + encodeURIComponent('ความลับของฉัน')); });
  } finally { console.log = original; }
  const entry = JSON.parse(lines.find(line => line.includes('"path"')));
  assert.equal(entry.path, '/ask');
  assert.equal(entry.status, 200);
  assert.ok(!lines.join('\n').includes('ความลับ') && !lines.join('\n').includes('q='), 'query string must not be logged');
});
