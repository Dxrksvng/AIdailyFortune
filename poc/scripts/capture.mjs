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
const homeHeight = await page.evaluate(() => document.documentElement.scrollHeight);
check('home: page is short (not one long scroll)', homeHeight < 2400, `scrollHeight=${homeHeight}`);
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

// tarot: same cards after reload, picks, one reshuffle
await page.goto(base + '/tarot?topic=career', { waitUntil: 'networkidle' });
await page.waitForSelector('#spread .flip');
const names = () => page.$$eval('#spread .face.front img', imgs => imgs.map(img => img.alt));
const before = await names();
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('#spread .flip');
check('same topic + day -> same three cards after reload', before.length === 3 && before.join() === (await names()).join(), before.join(' / '));
for (let i = 0; i < 3; i++) await page.locator('#fan button:not([disabled])').nth(5 + i).evaluate(button => button.click()); // fan cards overlap by design
await page.waitForTimeout(1200);
check('three picks reveal three cards', (await page.locator('#spread .flip.open').count()) === 3);
await page.click('#reshuffle');
await page.waitForTimeout(500);
const reshuffled = await names();
check('reshuffle changes the order, once per topic per day', reshuffled.join() !== before.join() && (await page.locator('#reshuffle').isDisabled()));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('#spread .flip');
check('reshuffle state survives reload', (await names()).join() === reshuffled.join());

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
