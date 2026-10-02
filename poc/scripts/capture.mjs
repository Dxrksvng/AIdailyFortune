// Real-browser verification: screenshots at 1280 and 390, overflow check, console errors,
// network log (no Google Fonts), crisis / warn behaviour, and tarot determinism across reload.
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
const base = `http://127.0.0.1:${server.address().port}/`;
const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader'] });
const failures = [];
const check = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); if (!ok) failures.push(name); };

async function session(width, height, label) {
  const context = await browser.newContext({ viewport: { width, height }, isMobile: width < 500, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [], requests = [];
  page.on('pageerror', error => errors.push('pageerror: ' + error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push('console: ' + message.text() + ' ' + (message.location().url || '')); });
  page.on('request', request => requests.push(request.url()));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForSelector('#answer .ans-top', { timeout: 15000 });
  await page.waitForSelector('#spread .flip', { timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(out, `home-${width}-fold.png`) });
  await page.screenshot({ path: path.join(out, `home-${width}-full.png`), fullPage: true });
  const overflow = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: innerWidth }));
  check(`${label}: no horizontal scroll`, overflow.scroll <= overflow.inner, `scrollWidth=${overflow.scroll} innerWidth=${overflow.inner}`);
  check(`${label}: no console errors`, errors.length === 0, errors.join(' | '));
  const external = requests.filter(url => !url.startsWith(base));
  check(`${label}: no request to fonts.googleapis.com`, !requests.some(url => url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')));
  check(`${label}: no external request at all`, external.length === 0, external.join(' '));
  return { context, page, errors };
}

// ---------- desktop ----------
const desktop = await session(1280, 800, '1280');
const page = desktop.page;
const cardNames = () => page.$$eval('#spread .face.front img', imgs => imgs.map(img => img.alt));

// 1. determinism: the same topic on the same day shows the same three cards after a reload
const before = await cardNames();
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('#spread .flip');
const after = await cardNames();
check('same topic + day -> same three cards after reload', before.length === 3 && JSON.stringify(before) === JSON.stringify(after), `${before.join(' / ')}`);

// 2. tarot interaction: pick three, flips open, reshuffle once
await page.locator('#tarot').scrollIntoViewIfNeeded();
// fan cards overlap by design, so click through the DOM instead of by pixel position
for (let i = 0; i < 3; i++) await page.locator('#fan button:not([disabled])').nth(5 + i).evaluate(button => button.click());
await page.waitForTimeout(1200);
check('three picks reveal three cards', (await page.locator('#spread .flip.open').count()) === 3);
await page.waitForTimeout(800);
await page.locator('#tarot').screenshot({ path: path.join(out, 'tarot-1280.png') });
await page.click('#reshuffle');
await page.waitForTimeout(500);
const reshuffled = await cardNames();
check('reshuffle changes the order', JSON.stringify(reshuffled) !== JSON.stringify(before));
check('only one reshuffle per topic per day', await page.locator('#reshuffle').isDisabled());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('#spread .flip');
check('reshuffle count survives reload (UI state only)', (await cardNames()).join() === reshuffled.join());

// 3. safety: crisis shows only the support panel
await page.fill('#q', 'อยากตาย');
await page.click('#askForm button[type=submit]');
await page.waitForSelector('#answer.crisis');
const crisis = await page.$eval('#answer', el => ({ html: el.innerHTML, text: el.innerText, cards: el.querySelectorAll('.cards3,.mini,img').length, conf: el.querySelectorAll('.conf').length, grid: el.querySelectorAll('.grid2,.notice').length }));
check('crisis: panel shows 1323', /1323/.test(crisis.text));
check('crisis: no cards, colour, confidence or reading', crisis.cards === 0 && crisis.conf === 0 && crisis.grid === 0);
check('crisis: no AI bubble for the reading', (await page.locator('#aiBub').count()) === 0);
await page.waitForTimeout(1200);
await page.locator('#ask').screenshot({ path: path.join(out, 'crisis-1280.png') });

// 4. warn: investing shows a reading with the money notice
await page.fill('#q', 'ควรลงทุนหุ้นไหม');
await page.click('#askForm button[type=submit]');
await page.waitForSelector('#answer.glass .notice');
const warn = await page.$eval('#answer', el => ({ notice: el.querySelector('.notice').innerText, hasGrid: !!el.querySelector('.grid2'), hasConf: !!el.querySelector('.conf'), noticeFirst: el.querySelector('.notice').compareDocumentPosition(el.querySelector('.grid2')) & Node.DOCUMENT_POSITION_FOLLOWING }));
check('warn: money notice above a real reading', /ไม่ใช่คำแนะนำการลงทุน/.test(warn.notice) && warn.hasGrid && warn.hasConf && !!warn.noticeFirst, warn.notice);
await page.waitForTimeout(1200);
await page.locator('#ask').screenshot({ path: path.join(out, 'warn-1280.png') });

// 5. birth chart + experimental tag + years
await page.locator('#chart').scrollIntoViewIfNeeded();
await page.check('#bconsent');
await page.click('#birthForm button[type=submit]');
await page.waitForSelector('#timeline .yr', { timeout: 15000 });
check('birth chart: yearly timeline from the server', (await page.locator('#timeline .yr').count()) === 5);
check('birth chart: ทดลอง tag visible', (await page.locator('#chart .tag.exp').count()) >= 1);
await page.waitForTimeout(500);
await page.locator('#chart').screenshot({ path: path.join(out, 'chart-1280.png') });

// 6. consent toggle + wipe
await page.check('#aiConsent');
check('AI consent stored under dc:consent', await page.evaluate(() => localStorage.getItem('dc:consent') === 'true'));
await page.click('#wipe');
await page.waitForSelector('#toast.show');
const left = await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('dc:')));
check('wipe clears every dc:* key and shows a toast', left.length === 0 && /ลบข้อมูล/.test(await page.textContent('#toast')), left.join(','));

// 7. reduced motion: nothing animates
const reduced = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
const rpage = await reduced.newPage();
await rpage.goto(base, { waitUntil: 'networkidle' });
await rpage.waitForTimeout(800);
const running = await rpage.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running' && animation.effect && animation.effect.getTiming().duration > 1).length);
check('reduced motion: no running animation', running === 0, `running=${running}`);
check('reduced motion: headline is not split into word spans', (await rpage.locator('#heroTitle .w').count()) === 0);
await reduced.close();
await desktop.context.close();

// ---------- mobile ----------
const mobile = await session(390, 844, '390');
await mobile.page.fill('#q', 'ควรลงทุนหุ้นไหม');
await mobile.page.click('#askForm button[type=submit]');
await mobile.page.waitForSelector('#answer .notice');
await mobile.page.waitForTimeout(1200);
await mobile.page.locator('#ask').screenshot({ path: path.join(out, 'warn-390.png') });
const mobileOverflow = await mobile.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
check('390: no horizontal scroll after an answer is shown', mobileOverflow);
await mobile.context.close();

await browser.close();
await new Promise(resolve => server.close(resolve));
console.log(failures.length ? `\n${failures.length} FAILED: ${failures.join('; ')}` : '\nall checks passed');
process.exit(failures.length ? 1 : 0);
