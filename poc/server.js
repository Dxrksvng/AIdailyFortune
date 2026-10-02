import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { readingFor } from './lib/compass.js';
import { withNarrative } from './lib/narrative.js';
import { answerQuestion, periodReading, TOPICS, HORIZONS } from './lib/oracle.js';
import { natalChart } from './lib/natal.js';
import { vedicTiming } from './lib/vedic.js';
import { ritualGuide } from './lib/ritual.js';
import { lifeTimeline } from './lib/life.js';
import { HOTLINE } from './lib/safety.js';
import { dailyCard, tarotReading, spreadForTopic } from './lib/oracle.js';
import { readingFor as readingForDate } from './lib/compass.js';

// Sent on every response. Styles keep 'unsafe-inline' because the pages use style attributes;
// scripts, images, media, fonts and fetch are same-origin only (the page makes no external request).
const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
};
// HTML, scripts and styles are not fingerprinted, so they are revalidated (ETag, 304) on each visit.
// Images, fonts and video change rarely, so the browser may reuse them for a day.
const CACHEABLE = new Set(['.webp', '.png', '.woff2', '.mp4', '.webm', '.svg']);
const cacheControl = ext => CACHEABLE.has(ext) ? 'public, max-age=86400' : 'no-cache';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
export const PAGES = new Set(['today', 'ask', 'tarot', 'chart', 'ritual', 'honest', 'care']);

/** Replace <!--include:name--> with public/_partials/name.html (shared nav, footer, toast). */
async function withIncludes(html) {
  const names = [...new Set([...html.matchAll(/<!--include:([a-z]+)-->/g)].map(match => match[1]))];
  for (const name of names) html = html.replaceAll(`<!--include:${name}-->`, await readFile(path.join(root, '_partials', `${name}.html`), 'utf8'));
  return html;
}
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.webm': 'video/webm', '.mp4': 'video/mp4', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2' };

/**
 * options.rateLimitPerMinute: API requests allowed per client address per minute (env RATE_LIMIT_PER_MIN, default 300).
 * options.log: write one JSON line per request (env LOG_REQUESTS=1). Only the path is logged, never the query string or
 * a body, because /ask?q= carries the user's question.
 */
export function createServer(options = {}) {
  const limit = options.rateLimitPerMinute ?? (Number(process.env.RATE_LIMIT_PER_MIN) || 300);
  const logging = options.log ?? process.env.LOG_REQUESTS === '1';
  const hits = new Map();
  const tooMany = req => {
    const now = Date.now(), key = req.socket.remoteAddress || 'unknown';
    if (hits.size > 5000) for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
    let entry = hits.get(key);
    if (!entry || entry.reset <= now) { entry = { count: 0, reset: now + 60_000 }; hits.set(key, entry); }
    entry.count++;
    return entry.count > limit ? Math.ceil((entry.reset - now) / 1000) : 0;
  };
  return http.createServer(async (req, res) => {
    const started = Date.now(), id = randomUUID().slice(0, 8);
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) res.setHeader(name, value);
    res.setHeader('x-request-id', id);
    if (logging) res.on('finish', () => console.log(JSON.stringify({ t: new Date().toISOString(), id, method: req.method, path: (req.url || '').split('?')[0], status: res.statusCode, ms: Date.now() - started })));
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) {
        const wait = tooMany(req);
        if (wait) { res.setHeader('retry-after', wait); return send(res, 429, { error: 'Too many requests' }); }
      }
      if (req.method === 'POST' && url.pathname === '/api/ask') {
        try {
          const input = await readJson(req);
          return send(res, 200, answerQuestion(input));
        } catch (err) { return send(res, err.message === 'Body too large' ? 413 : 400, { error: err.message }); }
      }
      if (req.method === 'POST' && url.pathname === '/api/natal-chart') {
        try {
          const input = await readJson(req);
          return send(res, 200, natalChart(input));
        } catch (err) { return send(res, err.message === 'Body too large' ? 413 : 400, { error: err.message }); }
      }
      if (req.method === 'POST' && url.pathname === '/api/life-timeline') {
        try {
          const input = await readJson(req);
          return send(res, 200, lifeTimeline({ birthProfile: input.birthProfile, date: input.date, timezone: input.timezone, years: Number(input.years ?? 5), topic: input.topic || 'general' }));
        } catch (err) { return send(res, err.message === 'Body too large' ? 413 : 400, { error: err.message }); }
      }
      if (req.method === 'POST' && url.pathname === '/api/ritual') {
        try {
          const input = await readJson(req);
          return send(res, 200, ritualGuide({ birthDate: input.birthDate || null, date: input.date, timezone: input.timezone }));
        } catch (err) { return send(res, err.message === 'Body too large' ? 413 : 400, { error: err.message }); }
      }
      if (req.method === 'POST' && url.pathname === '/api/tarot') {
        try {
          const input = await readJson(req);
          const topic = input.topic || 'general';
          return send(res, 200, tarotReading({ question: 'tarot table', spread: input.spread || spreadForTopic(topic), date: input.date, topic, reshuffle: input.reshuffle ?? 0 }));
        } catch (err) { return send(res, err.message === 'Body too large' ? 413 : 400, { error: err.message }); }
      }
      if (req.method === 'POST' && url.pathname === '/api/vedic-timing') {
        try {
          const input = await readJson(req);
          return send(res, 200, vedicTiming(input));
        } catch (err) { return send(res, err.message === 'Body too large' ? 413 : 400, { error: err.message }); }
      }
      if (req.method === 'POST' && url.pathname === '/api/period') {
        try {
          const input = await readJson(req);
          return send(res, 200, periodReading(input));
        } catch (err) { return send(res, err.message === 'Body too large' ? 413 : 400, { error: err.message }); }
      }
      if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
      if (url.pathname === '/health') return send(res, 200, { ok: true });
      if (url.pathname === '/api/capabilities') return send(res, 200, { methods: { western: ['day', 'week', 'month', 'year', 'natal-placements', 'ascendant', 'midheaven', 'whole-sign-houses', 'major-aspects', 'profile-transit-samples'], tarot: ['78-card-compositional-catalog', 'general', 'career', 'study', 'money', 'relationship'], iching: ['three-coin-cast', 'king-wen-64-primary-and-transformed-hexagrams'], vedic: ['sidereal-moon-sign', 'nakshatra-and-pada', 'vimshottari-mahadasha-major-periods', 'mean-lahiri-iae89-approximation'] }, topics: TOPICS, horizons: HORIZONS, limitations: ['No Placidus house system', 'I Ching classical changing-line judgements are not included', 'Vedic timing is an experimental mean-ayanamsa approximation; no Antardasha or event prediction; specialist validation required'] });
      if (url.pathname === '/api/period') {
        try { return send(res, 200, periodReading({ date: url.searchParams.get('date'), timezone: url.searchParams.get('timezone'), sign: url.searchParams.get('sign') || null, topic: url.searchParams.get('topic') || 'general', horizon: url.searchParams.get('horizon') || 'day' })); }
        catch (err) { return send(res, 400, { error: err.message }); }
      }
      if (url.pathname === '/api/safety') return send(res, 200, { hotline: HOTLINE });
      if (url.pathname === '/api/today') {
        try {
          const date = url.searchParams.get('date'), timezone = url.searchParams.get('timezone');
          const consent = url.searchParams.get('ai') === '1';
          const reading = await withNarrative(readingForDate({ date, timezone, sign: url.searchParams.get('sign') || null }), { consent, lang: url.searchParams.get('lang') || 'th' });
          return send(res, 200, { reading, ritual: ritualGuide({ date, timezone }), dailyCard: dailyCard(date) });
        } catch (err) { return send(res, 400, { error: err.message }); }
      }
      if (url.pathname === '/api/reading') {
        try {
          const result = readingFor({ date: url.searchParams.get('date'), timezone: url.searchParams.get('timezone'), sign: url.searchParams.get('sign') || null });
          return send(res, 200, await withNarrative(result, { consent: url.searchParams.get('ai') === '1' }));
        } catch (err) { return send(res, 400, { error: err.message }); }
      }
      // one HTML file per feature, served at a clean URL (/tarot -> tarot.html)
      let file = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
      if (PAGES.has(file)) file += '.html';
      const resolved = path.resolve(root, file);
      // files and folders that start with "_" (partials) are never served directly
      if (!resolved.startsWith(root + path.sep) || path.relative(root, resolved).split(path.sep).some(part => part.startsWith('_'))) return send(res, 404, { error: 'Not found' });
      let body = await readFile(resolved);
      if (file.endsWith('.html')) body = await withIncludes(body.toString('utf8'));
      const ext = path.extname(file);
      const etag = `"${createHash('sha1').update(body).digest('base64url').slice(0, 20)}"`;
      const headers = { 'content-type': types[ext] || 'application/octet-stream', 'cache-control': cacheControl(ext), etag };
      if (req.headers['if-none-match'] === etag) { res.writeHead(304, { 'cache-control': headers['cache-control'], etag }); return res.end(); }
      // Safari and iOS will not play a video unless the server answers Range requests with 206.
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
      if (range && /^video\//.test(headers['content-type'])) {
        const size = body.length;
        const start = range[1] === '' ? size - Number(range[2]) : Number(range[1]);
        const end = range[1] === '' || range[2] === '' ? size - 1 : Math.min(Number(range[2]), size - 1);
        if (!(start >= 0 && start <= end && start < size)) { res.writeHead(416, { 'content-range': `bytes */${size}` }); return res.end(); }
        res.writeHead(206, { ...headers, 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${size}`, 'content-length': end - start + 1 });
        return res.end(body.subarray(start, end + 1));
      }
      res.writeHead(200, { ...headers, 'accept-ranges': 'bytes' });
      res.end(body);
    } catch { send(res, 404, { error: 'Not found' }); }
  });
}

async function readJson(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 8192) throw new Error('Body too large');
  }
  let value;
  try { value = JSON.parse(body); } catch { throw new Error('Invalid JSON'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('JSON object required');
  return value;
}

function send(res, status, payload) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(JSON.stringify(payload));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4174);
  createServer().listen(port, '127.0.0.1', () => console.log(`Celestra: http://127.0.0.1:${port}`));
}
