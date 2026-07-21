/** Renders 1280x800 Chrome Web Store screenshots of the built popup into ss/. */
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, 'ss');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.json': 'application/json' };

await mkdir(OUT, { recursive: true });

const server = http.createServer(async (req, res) => {
  try {
    const path = join(DIST, req.url === '/' ? 'popup.html' : req.url.split('?')[0]);
    const body = await readFile(path);
    res.writeHead(200, { 'content-type': MIME[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(8124, r));

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
await page.goto('http://127.0.0.1:8124/popup.html', { waitUntil: 'networkidle0' });

await page.addStyleTag({
  content: `
    body {
      width: 100vw;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 28px;
      background: var(--backdrop, linear-gradient(160deg, #2f7fb8, #9fd7f5));
    }
    .headline {
      font-size: 22px;
      color: #ffffff;
      text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.45);
      letter-spacing: 1px;
    }
    .app {
      zoom: 1.32;
      border: 4px solid #4a3220;
      box-shadow: 0 22px 48px rgba(0, 0, 0, 0.45);
    }
  `,
});
await page.evaluate(() => {
  const h = document.createElement('div');
  h.className = 'headline';
  document.body.prepend(h);
});

const setStage = (headline, backdrop) =>
  page.evaluate(
    (text, bg) => {
      document.querySelector('.headline').textContent = text;
      document.body.style.setProperty('--backdrop', bg);
    },
    headline,
    backdrop,
  );

const click = async (label) => {
  const [btn] = await page.$$(`xpath/.//button[normalize-space(text())='${label}']`);
  if (!btn) throw new Error(`button not found: ${label}`);
  await btn.click();
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shoot = (name) => page.screenshot({ path: join(OUT, name) });

// 1. Peaceful day
await setStage('A tiny pixel meadow in your toolbar', 'linear-gradient(160deg, #2f7fb8, #9fd7f5)');
await sleep(600);
await shoot('1-day.png');

// 2. The judgement
await setStage('It judges you for the easy ones', 'linear-gradient(160deg, #0a1226, #1c2b4d)');
for (const label of ['5', '×', '5', '=']) await click(label);
await sleep(700);
await shoot('2-judged.png');
await sleep(4200); // let the night pass

// 3. Praise
await setStage('Bring it real math and earn its respect', 'linear-gradient(160deg, #b3651f, #f5c24b)');
for (const label of ['AC', '1', '2', '3', '4', '.', '5', '×', '6', '7', '8', '9', '.', '1', '=']) await click(label);
await sleep(500);
await shoot('3-praised.png');

await browser.close();
server.close();
console.log('store screenshots written to ss/');
