import puppeteer from 'puppeteer-core';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const DIST = '/home/pranav/Workspace/chromiumCalculator/dist';
const OUT = '/tmp/claude-1000/-home-pranav-Workspace-chromiumCalculator/e59ddfb2-fe57-4964-8042-e379c0d34079/scratchpad';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.json': 'application/json' };

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
await new Promise((r) => server.listen(8123, r));

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setViewport({ width: 340, height: 540 });
await page.goto('http://127.0.0.1:8123/popup.html', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 600));
await page.screenshot({ path: `${OUT}/shot_day.png` });

const click = async (label) => {
  const [btn] = await page.$$(`xpath/.//button[normalize-space(text())='${label}']`);
  if (!btn) throw new Error(`button not found: ${label}`);
  await btn.click();
};

for (const label of ['5', '×', '5', '=']) await click(label);
await new Promise((r) => setTimeout(r, 700));
await page.screenshot({ path: `${OUT}/shot_judged.png` });

await new Promise((r) => setTimeout(r, 4500));
await page.screenshot({ path: `${OUT}/shot_recovered.png` });

// A praise-worthy calculation: 1234.5 × 6789.1
for (const label of ['AC', '1', '2', '3', '4', '.', '5', '×', '6', '7', '8', '9', '.', '1', '=']) await click(label);
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: `${OUT}/shot_praised.png` });

console.log('display after praise calc:', await page.$eval('.result', (el) => el.textContent));
await browser.close();
server.close();
console.log('done');
