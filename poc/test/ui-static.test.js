import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat, access } from 'node:fs/promises';
import path from 'node:path';

const pub = new URL('../public/', import.meta.url).pathname;
const read = name => readFile(path.join(pub, name), 'utf8');
const exists = async file => access(file).then(() => true, () => false);

test('no request to Google Fonts: fonts are self-hosted and every file exists', async () => {
  const html = await read('index.html'), css = await read('app.css'), fonts = await read('fonts/fonts.css'), js = await read('app.js');
  for (const [name, text] of Object.entries({ html, css, fonts, js })) assert.doesNotMatch(text, /googleapis|gstatic/, name);
  const files = [...fonts.matchAll(/url\(([^)]+\.woff2)\)/g)].map(m => m[1]);
  assert.ok(files.length >= 6);
  for (const file of files) assert.ok(await exists(path.join(pub, 'fonts', file)), file);
  assert.match(await read('fonts/LICENSES.md'), /https:\/\/fonts\.gstatic\.com/);
});

test('every asset referenced by the page exists and every card is at most 120 KB', async () => {
  const text = (await read('index.html')) + (await read('app.css')) + (await read('app.js'));
  const refs = new Set([...text.matchAll(/assets\/[\w\-/${}.]+\.webp/g)].map(m => m[0]).filter(ref => !ref.includes('${')));
  assert.ok(refs.size >= 6);
  for (const ref of refs) assert.ok(await exists(path.join(pub, ref)), ref);
  const cards = (await readdir(path.join(pub, 'assets/cards'))).filter(f => f.endsWith('.webp'));
  assert.equal(cards.length, 22);
  for (const card of cards) assert.ok((await stat(path.join(pub, 'assets/cards', card))).size <= 120 * 1024, card);
  assert.ok((await stat(path.join(pub, 'assets/back.webp'))).size <= 120 * 1024);
});

test('the page shows no percentages and tags experimental methods', async () => {
  const html = await read('index.html'), js = await read('app.js');
  const visible = html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<[^>]+>/g, ' ');
  assert.doesNotMatch(visible, /\d\s?%/);
  assert.match(html, /ทดลอง/);
  assert.match(js, /'เวทิก \/ มหาทศา'[^\]]*'ทดลอง'/);
  assert.match(js, /'อี้จิง'[^\]]*'ทดลอง'/);
});

test('Thai text is animated by word segments only, and reduced motion is honoured', async () => {
  const js = await read('app.js'), css = await read('app.css'), scene = await read('scene.js');
  assert.match(js, /granularity: 'word'/);
  assert.doesNotMatch(js, /granularity: 'grapheme'/);
  assert.doesNotMatch(js, /\.split\(''\)/, 'no per-character splitting');
  assert.match(css, /prefers-reduced-motion:\s*reduce\)\s*\{\s*\*[^{]*\{[^}]*animation:\s*none\s*!important[^}]*transition:\s*none\s*!important/);
  assert.match(scene, /prefers-reduced-motion/);
  assert.match(scene, /no-sky/);
});

test('the site is named Celestra and ships its logo', async () => {
  const html = await read('index.html');
  assert.match(html, /<title>Celestra/);
  assert.doesNotMatch(html, /Daily Compass/);
  assert.ok(await exists(path.join(pub, 'assets/logo.webp')));
});
