import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat, access } from 'node:fs/promises';
import path from 'node:path';

const pub = new URL('../public/', import.meta.url).pathname;
const read = name => readFile(path.join(pub, name), 'utf8');
const PAGES = ['index', 'today', 'ask', 'tarot', 'chart', 'ritual', 'honest', 'care'];
const MODULES = ['common', 'home', 'today', 'ask', 'tarot', 'chart', 'ritual', 'honest', 'care'];
const readAll = async () => ({ html: (await Promise.all(PAGES.map(p => read(p + '.html')))).join('\n') + (await read('_partials/top.html')) + (await read('_partials/bottom.html')), js: (await Promise.all(MODULES.map(m => read(`js/${m}.js`)))).join('\n') });
const exists = async file => access(file).then(() => true, () => false);

test('no request to Google Fonts: fonts are self-hosted and every file exists', async () => {
  const { html, js } = await readAll(), css = await read('app.css'), fonts = await read('fonts/fonts.css');
  for (const [name, text] of Object.entries({ html, css, fonts, js })) assert.doesNotMatch(text, /googleapis|gstatic/, name);
  const files = [...fonts.matchAll(/url\(([^)]+\.woff2)\)/g)].map(m => m[1]);
  assert.ok(files.length >= 6);
  for (const file of files) assert.ok(await exists(path.join(pub, 'fonts', file)), file);
  assert.match(await read('fonts/LICENSES.md'), /https:\/\/fonts\.gstatic\.com/);
});

test('every asset referenced by the page exists and every card is at most 120 KB', async () => {
  const all = await readAll(), text = all.html + all.js + (await read('app.css'));
  const refs = new Set([...text.matchAll(/assets\/[\w\-/${}.]+\.webp/g)].map(m => m[0]).filter(ref => !ref.includes('${')));
  assert.ok(refs.size >= 6);
  for (const ref of refs) assert.ok(await exists(path.join(pub, ref)), ref);
  const cards = (await readdir(path.join(pub, 'assets/cards'))).filter(f => f.endsWith('.webp'));
  assert.equal(cards.length, 22);
  for (const card of cards) assert.ok((await stat(path.join(pub, 'assets/cards', card))).size <= 120 * 1024, card);
  assert.ok((await stat(path.join(pub, 'assets/back.webp'))).size <= 120 * 1024);
});

test('the page shows no percentages and tags experimental methods', async () => {
  const { html, js } = await readAll();
  const visible = html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<[^>]+>/g, ' ');
  assert.doesNotMatch(visible, /\d\s?%/);
  assert.match(html, /ทดลอง/);
  const honest = await read('js/honest.js');
  assert.match(honest, /'เวทิก \/ มหาทศา'[^\]]*'ทดลอง'/);
  assert.match(honest, /'อี้จิง'[^\]]*'ทดลอง'/);
  assert.match(await read('chart.html'), /tag exp[^>]*>ทดลอง/);
});

test('Thai text is animated by word segments only, and reduced motion is honoured', async () => {
  const { js } = await readAll(), css = await read('app.css'), scene = await read('scene.js');
  assert.match(js, /granularity: 'word'/);
  assert.doesNotMatch(js, /granularity: 'grapheme'/);
  assert.doesNotMatch(js, /\.split\(''\)/, 'no per-character splitting');
  assert.match(css, /prefers-reduced-motion:\s*reduce\)\s*\{\s*\*[^{]*\{[^}]*animation:\s*none\s*!important[^}]*transition:\s*none\s*!important/);
  assert.match(scene, /prefers-reduced-motion/);
  assert.match(scene, /no-sky/);
});

test('the site is named Celestra and ships its logo', async () => {
  const { html } = await readAll();
  for (const page of PAGES) assert.match(await read(page + '.html'), /<title>Celestra/, page);
  assert.doesNotMatch(html, /Daily Compass/);
  assert.ok(await exists(path.join(pub, 'assets/logo.webp')));
});

test('each feature has its own page, linked from the nav and the home page', async () => {
  const top = await read('_partials/top.html'), home = await read('index.html');
  for (const page of PAGES.slice(1)) {
    assert.match(top, new RegExp(`href="/${page}"`), `nav link to /${page}`);
    assert.match(home, new RegExp(`href="/${page}"`), `home card for /${page}`);
  }
  // the long single page is gone: the home page has no feature sections of its own
  for (const id of ['today', 'ask', 'tarot', 'chart', 'ritual', 'honest', 'care']) assert.doesNotMatch(home, new RegExp(`<section class="block" id="${id}"`), id);
});
