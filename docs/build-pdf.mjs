// Builds the Assignment 4 PDFs from ANSWER.md (English) and ANSWER_TH.md (Thai).
//   node docs/build-pdf.mjs            -> docs/Assignment4_AI_Daily_Fortune.pdf and ..._TH.pdf
//   node docs/build-pdf.mjs en|th      -> one language only
// Needs: pandoc, Google Chrome (CHROME_PATH to override), network access to cdn.jsdelivr.net for
// Mermaid (version printed at build time), and poc/node_modules (playwright-core).
// Fonts come from poc/public/fonts (Anuphan, Noto Serif Thai, IBM Plex Mono), embedded in the PDF.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const { chromium } = await import(pathToFileURL(path.join(root, 'poc/node_modules/playwright-core/index.mjs')).href);
const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const MERMAID = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';

const JOBS = {
  en: { source: 'ANSWER.md', out: 'docs/Assignment4_AI_Daily_Fortune.pdf', lang: 'en', title: 'Assignment 4 — AI Daily Fortune-Telling System' },
  th: { source: 'ANSWER_TH.md', out: 'docs/Assignment4_AI_Daily_Fortune_TH.pdf', lang: 'th', title: 'Assignment 4 — ระบบดูดวงรายวันด้วย AI' }
};

const fonts = path.join(root, 'poc/public/fonts');
const css = `
@font-face{font-family:'Anuphan';font-weight:300 600;src:url('${pathToFileURL(path.join(fonts, 'anuphan-thai.woff2'))}') format('woff2');unicode-range:U+0E01-0E5B,U+200C-200D,U+25CC}
@font-face{font-family:'Anuphan';font-weight:300 600;src:url('${pathToFileURL(path.join(fonts, 'anuphan-latin.woff2'))}') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Noto Serif Thai';font-weight:300 500;src:url('${pathToFileURL(path.join(fonts, 'noto-serif-thai-thai.woff2'))}') format('woff2');unicode-range:U+0E01-0E5B,U+200C-200D,U+25CC}
@font-face{font-family:'Noto Serif Thai';font-weight:300 500;src:url('${pathToFileURL(path.join(fonts, 'noto-serif-thai-latin.woff2'))}') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'IBM Plex Mono';font-weight:400;src:url('${pathToFileURL(path.join(fonts, 'ibm-plex-mono-400-latin.woff2'))}') format('woff2')}
@page{size:A4;margin:16mm 15mm 18mm}
*{box-sizing:border-box}
body{font-family:'Anuphan','Noto Serif Thai',sans-serif;font-size:10pt;line-height:1.65;color:#1d1a16;margin:0}
h1,h2,h3,h4{font-family:'Noto Serif Thai','Anuphan',serif;font-weight:500;line-height:1.35;break-after:avoid}
h1{font-size:20pt;margin:0 0 .5em}
h2{font-size:15pt;margin:1.4em 0 .5em;padding-bottom:.2em;border-bottom:1.5px solid #c9a15d}
h3{font-size:12pt;margin:1.1em 0 .4em;color:#4a3a1e}
h4{font-size:10.5pt;margin:1em 0 .3em}
p{margin:.5em 0}
a{color:#7a5320;text-decoration:none}
ul,ol{margin:.4em 0;padding-left:1.4em}
li{margin:.15em 0}
table{border-collapse:collapse;width:100%;margin:.7em 0;font-size:9pt;break-inside:auto}
tr{break-inside:avoid}
th,td{border:1px solid #d8cdb8;padding:.35em .55em;vertical-align:top;text-align:left}
th{background:#f3ead9;font-weight:600}
code{font-family:'IBM Plex Mono',monospace;font-size:8.6pt;background:#f4efe6;padding:.05em .3em;border-radius:3px}
pre{font-family:'IBM Plex Mono',monospace;font-size:8pt;background:#f4efe6;padding:.6em;border-radius:4px;white-space:pre-wrap;break-inside:avoid}
pre code{background:none;padding:0}
pre.mermaid{background:#fff;border:1px solid #e2d9c6;text-align:center;padding:.6em;white-space:normal;break-inside:avoid;font-family:inherit}
pre.mermaid svg{max-width:100%;height:auto}
figure{margin:.8em 0;break-inside:avoid;text-align:center}
figure img{max-width:100%;max-height:105mm;border:1px solid #d8cdb8;border-radius:3px}
figcaption{font-size:8.6pt;color:#5d5547;text-align:left;margin-top:.3em}
blockquote{margin:.6em 0;padding:.1em .9em;border-left:3px solid #c9a15d;color:#4a4437;background:#faf6ee}
hr{border:0;border-top:1px solid #d8cdb8;margin:1.2em 0}
`;

function render(job) {
  const md = path.join(root, job.source);
  const body = execFileSync('pandoc', ['-f', 'gfm', '-t', 'html', '--wrap=none', md], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    // pandoc wraps ```mermaid blocks as <pre class="mermaid"><code>..</code></pre>; Mermaid wants the bare text
    .replace(/<pre class="mermaid"><code>([\s\S]*?)<\/code><\/pre>/g, '<pre class="mermaid">$1</pre>');
  return `<!doctype html><html lang="${job.lang}"><head><meta charset="utf-8"><base href="${pathToFileURL(root + '/')}"><title>${job.title}</title><style>${css}</style></head><body>${body}
<script src="${MERMAID}"></script>
<script>mermaid.initialize({startOnLoad:false,theme:'neutral',securityLevel:'strict',fontFamily:"Anuphan, 'Noto Serif Thai', sans-serif",flowchart:{htmlLabels:true,useMaxWidth:true},er:{useMaxWidth:true}});</script></body></html>`;
}

const only = process.argv[2];
const jobs = Object.entries(JOBS).filter(([key]) => !only || key === only);
const browser = await chromium.launch({ executablePath: chrome, headless: true });
for (const [key, job] of jobs) {
  const dir = path.join(root, '.build'); mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${key}.html`);
  writeFileSync(file, render(job));
  const page = await browser.newPage();
  const problems = [];
  page.on('pageerror', e => problems.push(e.message));
  page.on('requestfailed', r => problems.push(`failed: ${r.url()}`));
  await page.goto(pathToFileURL(file).href, { waitUntil: 'networkidle' });
  const version = await page.evaluate(() => mermaid.version || 'unknown');
  const blocks = await page.$$eval('pre.mermaid', els => els.length);
  await page.evaluate(() => mermaid.run({ querySelector: 'pre.mermaid' }));
  const rendered = await page.$$eval('pre.mermaid svg', els => els.length);
  const errors = await page.$$eval('pre.mermaid', els => els.filter(el => /Syntax error|Parse error/i.test(el.textContent)).length);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every(img => img.complete));
  const brokenImages = await page.$$eval('img', imgs => imgs.filter(img => !img.naturalWidth).map(img => img.getAttribute('src')));
  await page.pdf({
    path: path.join(root, job.out), format: 'A4', printBackground: true, displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: '<div style="width:100%;text-align:center;font-size:8px;color:#6b6252"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    margin: { top: '16mm', bottom: '18mm', left: '15mm', right: '15mm' }
  });
  console.log(`${key}: ${job.out} | mermaid ${version}: ${rendered}/${blocks} diagrams rendered, ${errors} syntax errors | broken images: ${brokenImages.length ? brokenImages.join(', ') : 'none'}${problems.length ? ' | problems: ' + problems.join('; ') : ''}`);
  await page.close();
  if (rendered !== blocks || errors || brokenImages.length) process.exitCode = 1;
}
await browser.close();
