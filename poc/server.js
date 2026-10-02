import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readingFor } from './lib/compass.js';
import { withNarrative } from './lib/narrative.js';
import { answerQuestion, periodReading, TOPICS, HORIZONS } from './lib/oracle.js';
import { natalChart } from './lib/natal.js';
import { vedicTiming } from './lib/vedic.js';
import { ritualGuide } from './lib/ritual.js';
import { lifeTimeline } from './lib/life.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };

export function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
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
      if (url.pathname === '/api/reading') {
        try {
          const result = readingFor({ date: url.searchParams.get('date'), timezone: url.searchParams.get('timezone'), sign: url.searchParams.get('sign') || null });
          return send(res, 200, await withNarrative(result));
        } catch (err) { return send(res, 400, { error: err.message }); }
      }
      const file = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
      const resolved = path.resolve(root, file);
      if (!resolved.startsWith(root + path.sep)) return send(res, 404, { error: 'Not found' });
      const body = await readFile(resolved);
      res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
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
  createServer().listen(port, '127.0.0.1', () => console.log(`Daily Compass: http://127.0.0.1:${port}`));
}
