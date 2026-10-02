// Real-browser verification of the multi-page site: every page at 1280 and 390 (overflow,
// console errors, external requests, screenshots), plus the flows that matter: home -> ask,
// crisis / warn answers, tarot determinism across reload, birth profile shared between
// pages, consent and wipe, reduced motion.
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from '../server.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(root, 'design', 'screens');
await mkdir(out, { recursive: true });
const server = createServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader'] });
const failures = [];
const check = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); if (!ok) failures.push(name); };

const PAGES = [['/', 'home', null], ['/today', 'today', '#readSignal'], ['/ask', 'ask', '#askForm'], ['/tarot', 'tarot', '#spread .flip'], ['/chart', 'chart', '#birthForm'], ['/ritual', 'ritual', '#days .day'], ['/honest', 'honest', '#methods .method'], ['/care', 'care', '#hotline']];

async function newSession(width, height) {
  const context = await browser.newContext({ viewport: { width, height }, isMobile: width < 500, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const log = { errors: [], requests: [] };
  page.on('pageerror', error => log.errors.push('pageerror: ' + error.message));
  page.on('console', message => { if (message.type() === 'error') log.errors.push(`console: ${message.text()} ${message.location().url || ''}`); });
  page.on('request', request => log.requests.push(request.url()));
  return { context, page, log };
}

/* ---------- every page, both widths ---------- */
for (const width of [1280, 390]) {
  const { context, page, log } = await newSession(width, width === 390 ? 844 : 800);
  for (const [route, name, ready] of PAGES) {
    await page.goto(base + route, { waitUntil: 'networkidle' });
    if (ready) await page.waitForSelector(ready, { timeout: 15000 });
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(out, `${name}-${width}.png`), fullPage: true });
    const overflow = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: innerWidth }));
    check(`${width} ${route}: no horizontal scroll`, overflow.scroll <= overflow.inner, `scrollWidth=${overflow.scroll} innerWidth=${overflow.inner}`);
    const current = await page.$$eval('.nav a.l[aria-current=page]', links => links.map(link => link.getAttribute('href')));
    if (route !== '/') check(`${width} ${route}: nav marks this page`, current.join() === route, current.join());
  }
  check(`${width}: no console errors on any page`, log.errors.length === 0, log.errors.join(' | '));
  check(`${width}: no request to Google Fonts`, !log.requests.some(url => /fonts\.(googleapis|gstatic)\.com/.test(url)));
  const external = log.requests.filter(url => !url.startsWith(base));
  check(`${width}: no external request at all`, external.length === 0, external.join(' '));
  await context.close();
}

/* ---------- flows (desktop) ---------- */
const { context, page, log } = await newSession(1280, 800);

// home is a launcher, not one long page
await page.goto(base + '/', { waitUntil: 'networkidle' });
check('home: 7 feature cards, one per page', (await page.locator('.features a.feature').count()) === 7);
check('home: no feature sections on the home page', (await page.locator('main section.block').count()) === 1);
// the scrollytelling stage is tall on purpose (four screens of pinned scenes); everything else must stay short
const home = await page.evaluate(() => ({ total: document.documentElement.scrollHeight, story: document.querySelector('#story').offsetHeight }));
check('home: scrollytelling stage has four steps and four video layers', (await page.locator('#story .step').count()) === 4 && (await page.locator('#story video.reel').count()) === 4);
check('home: page outside the story stage is short', home.total - home.story < 2400, `scrollHeight=${home.total} story=${home.story}`);
await page.click('.features a[href="/tarot"]');
await page.waitForURL(/\/tarot$/);
await page.waitForSelector('#spread .slot');
check('home card opens its own page', (await page.locator('#spread .slot').count()) === 3);

// home ask box hands the question to /ask
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.fill('#q', 'งานที่เพิ่งสัมภาษณ์ไปจะได้ไหม');
await page.click('#askForm button[type=submit]');
await page.waitForURL(/\/ask\?/);
await page.waitForSelector('#answer .ans-top', { timeout: 15000 });
check('home question is answered on /ask', /สัมภาษณ์/.test(await page.textContent('#thread')));
check('interview question draws three cards', (await page.locator('#answer .cards3 figure').count()) === 3);

// crisis: only the support panel
await page.fill('#q', 'อยากตาย');
await page.click('#askForm button[type=submit]');
await page.waitForSelector('#answer.crisis');
const crisis = await page.$eval('#answer', el => ({ text: el.innerText, extras: el.querySelectorAll('.cards3,.mini,img,.conf,.grid2,.notice').length }));
check('crisis: panel shows 1323', /1323/.test(crisis.text));
check('crisis: no cards, colour, confidence or reading', crisis.extras === 0);
check('crisis: no AI bubble', (await page.locator('#aiBub').count()) === 0);
await page.waitForTimeout(600);
await page.locator('#ask').screenshot({ path: path.join(out, 'ask-crisis-1280.png') });

// warn: notice above a real reading, routed to the money topic
await page.fill('#q', 'ควรลงทุนหุ้นไหม');
await page.click('#askForm button[type=submit]');
await page.waitForSelector('#answer.glass .notice');
const warn = await page.$eval('#answer', el => ({ notice: el.querySelector('.notice').innerText, tag: el.querySelector('.ans-top .tag').innerText, hasConf: !!el.querySelector('.conf'), before: !!(el.querySelector('.notice').compareDocumentPosition(el.querySelector('.grid2')) & Node.DOCUMENT_POSITION_FOLLOWING), text: el.innerText }));
check('warn: money notice above a real reading', /ไม่ใช่คำแนะนำการลงทุน/.test(warn.notice) && warn.hasConf && warn.before);
check('warn: routed to the money topic', /การเงิน/.test(warn.tag) && !/เรซูเม่/.test(warn.text), warn.tag);
await page.waitForTimeout(600);
await page.locator('#ask').screenshot({ path: path.join(out, 'ask-warn-1280.png') });

// tarot: pick from the fan -> cards fly into the slots face down -> press predict -> flip + reading
await page.goto(base + '/tarot?topic=career', { waitUntil: 'networkidle' });
await page.waitForSelector('#spread .flip');
const names = () => page.$$eval('#spread .face.front img', imgs => imgs.map(img => img.alt));
const before = await names();
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('#spread .flip');
check('same topic + day -> same three cards after reload', before.length === 3 && before.join() === (await names()).join(), before.join(' / '));
check('tarot: nothing is predicted before cards are chosen', (await page.locator('#predict').isHidden()) && (await page.locator('#reading').isHidden()) && (await page.locator('#spread .flip.placed').count()) === 0);
const fanBox = await page.$eval('#fan', el => { const first = el.querySelector('button').getBoundingClientRect(); return { cards: el.querySelectorAll('button').length, w: Math.round(first.width), h: Math.round(first.height), fanH: Math.round(el.getBoundingClientRect().height) }; });
check('tarot: fan has 22 large cards', fanBox.cards === 22 && fanBox.w >= 95, JSON.stringify(fanBox));
const slotW = await page.$eval('#slot0', el => Math.round(el.getBoundingClientRect().width));
check('tarot: card slots are smaller than the fan cards', slotW <= 160, `slot=${slotW}px`);
let sawFlyer = false;
for (let i = 0; i < 3; i++) {
  await page.locator('#fan button:not(.taken):not([disabled])').nth(4 + i * 2).evaluate(button => button.click()); // fan cards overlap by design
  try { await page.waitForSelector('.flyer', { timeout: 1500 }); sawFlyer = true; } catch { /* checked below */ }
  await page.waitForFunction(count => document.querySelectorAll('#spread .flip.placed').length === count, i + 1, { timeout: 5000 });
}
check('tarot: a flying card animates from the fan into each slot', sawFlyer);
check('tarot: three face-down cards sit in the slots, none revealed yet', (await page.locator('#spread .flip.placed').count()) === 3 && (await page.locator('#spread .flip.open').count()) === 0);
check('tarot: predict button appears only after three picks, reading still hidden', (await page.locator('#predict').isVisible()) && (await page.locator('#reading').isHidden()));
await page.locator('#tarot').screenshot({ path: path.join(out, 'tarot-picked-1280.png') });
await page.click('#predict');
await page.waitForSelector('#reading:not([hidden]) .conf', { timeout: 15000 });
await page.waitForTimeout(500);
check('tarot: predict flips all three cards and shows the reading', (await page.locator('#spread .flip.open').count()) === 3 && /คำทำนายจากไพ่/.test(await page.textContent('#reading')));
const faces = await page.$$eval('#spread .flip.open .face.front', els => els.map(el => { const img = el.querySelector('img'); return getComputedStyle(el).display !== 'none' && img.complete && img.naturalWidth > 0 && img.getBoundingClientRect().width > 100; }));
check('tarot: every revealed card face is actually visible (not a black frame)', faces.length === 3 && faces.every(Boolean), JSON.stringify(faces));
const overlap = await page.evaluate(() => { const fan = document.querySelector('#fan').getBoundingClientRect(), acts = document.querySelector('.actions').getBoundingClientRect(); let lowest = 0; document.querySelectorAll('#fan button').forEach(b => { lowest = Math.max(lowest, b.getBoundingClientRect().bottom); }); return { lowest: Math.round(lowest), actionsTop: Math.round(acts.top) }; });
check('tarot: the fan does not cover the buttons below it', overlap.lowest <= overlap.actionsTop + 1, JSON.stringify(overlap));
check('tarot: revealed cards are the ones the server shuffled', (await names()).join() === before.join());
await page.locator('#tarot').screenshot({ path: path.join(out, 'tarot-reading-1280.png') });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('#reading:not([hidden])', { timeout: 15000 });
check('tarot: revealed state and reading survive reload with the same cards', (await page.locator('#spread .flip.open').count()) === 3 && (await names()).join() === before.join());
await page.click('#reshuffle');
await page.waitForFunction(() => document.querySelectorAll('#spread .flip.placed').length === 0);
const reshuffled = await names();
check('reshuffle resets the table and changes the order, once per topic per day', reshuffled.join() !== before.join() && (await page.locator('#reshuffle').isDisabled()) && (await page.locator('#reading').isHidden()));

// chart -> profile shared with ritual and ask
await page.goto(base + '/chart', { waitUntil: 'networkidle' });
await page.check('#bconsent');
await page.click('#birthForm button[type=submit]');
await page.waitForSelector('#timeline .yr', { timeout: 15000 });
check('chart: yearly timeline from the server', (await page.locator('#timeline .yr').count()) === 5);
check('chart: ทดลอง tag visible', (await page.locator('.tag.exp').count()) >= 1);
check('chart: profile kept for this tab only (sessionStorage, not localStorage)', await page.evaluate(() => !!sessionStorage.getItem('dc:profile') && !Object.keys(localStorage).some(k => /birth/i.test(localStorage.getItem(k) || ''))));
await page.goto(base + '/ritual', { waitUntil: 'networkidle' });
await page.waitForSelector('#days .day');
check('ritual: birth day is highlighted from the shared profile', (await page.locator('#days .day.birth').count()) === 1 && /ประจำวันเกิด/.test(await page.textContent('#postureLine')));
await page.goto(base + '/ask?' + new URLSearchParams({ q: 'อีก 5 ปีชีวิตจะเป็นยังไง' }), { waitUntil: 'networkidle' });
await page.waitForSelector('#answer .timeline .yr', { timeout: 15000 });
check('ask: multi-year question uses the profile from /chart', (await page.locator('#answer .timeline .yr').count()) === 5 && (await page.locator('#answer .tag.exp').count()) >= 1);

// consent + wipe
await page.check('#aiConsent');
await page.goto(base + '/today', { waitUntil: 'networkidle' });
check('AI consent persists across pages', await page.isChecked('#aiConsent'));
await page.click('#wipe');
await page.waitForSelector('#toast.show');
const left = await page.evaluate(() => ({ local: Object.keys(localStorage).filter(k => k.startsWith('dc:')), session: sessionStorage.getItem('dc:profile') }));
check('wipe clears every dc:* key and the tab profile, with a toast', left.local.length === 0 && left.session === null && /ลบข้อมูล/.test(await page.textContent('#toast')), JSON.stringify(left));
check('no console errors during the flows', log.errors.length === 0, log.errors.join(' | '));
await context.close();

// reduced motion
const reduced = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
const rpage = await reduced.newPage();
await rpage.goto(base + '/', { waitUntil: 'networkidle' });
await rpage.waitForTimeout(800);
const running = await rpage.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running' && animation.effect && animation.effect.getTiming().duration > 1).length);
check('reduced motion: no running animation', running === 0, `running=${running}`);
check('reduced motion: headline is not split into word spans', (await rpage.locator('#heroTitle .w').count()) === 0);
await reduced.close();

await browser.close();
await new Promise(resolve => server.close(resolve));
console.log(failures.length ? `\n${failures.length} FAILED: ${failures.join('; ')}` : '\nall checks passed');
process.exit(failures.length ? 1 : 0);
