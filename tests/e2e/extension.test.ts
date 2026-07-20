/**
 * Loads the built extension into real headless Chrome and drives the actual
 * chrome-extension:// popup — the only layer that catches manifest, CSP, and
 * packaging problems. Requires dist/ (npm run test:e2e builds it first).
 */
import { createHash } from 'node:crypto';
import { existsSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import puppeteer, { type Browser, type Page } from 'puppeteer-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const DIST = realpathSync(resolve(__dirname, '../../dist'));
const CHROME = process.env.CHROME_BIN ?? '/usr/bin/google-chrome';

/** Chrome derives unpacked extension IDs from the install path: sha256, first 128 bits, hex mapped a-p. */
function extensionIdFor(path: string): string {
  const hash = createHash('sha256').update(path, 'utf8').digest('hex').slice(0, 32);
  return [...hash].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join('');
}

let browser: Browser;
let page: Page;
const consoleErrors: string[] = [];

beforeAll(async () => {
  if (!existsSync(`${DIST}/manifest.json`)) {
    throw new Error('dist/manifest.json missing — run `npm run build` first (or use `npm run test:e2e`)');
  }
  browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-gpu',
      `--disable-extensions-except=${DIST}`,
      `--load-extension=${DIST}`,
    ],
  });
  page = await browser.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));
  await page.goto(`chrome-extension://${extensionIdFor(DIST)}/popup.html`, {
    waitUntil: 'networkidle0',
  });
}, 30_000);

afterAll(async () => {
  await browser?.close();
});

const click = async (label: string) => {
  const [btn] = await page.$$(`xpath/.//button[normalize-space(text())='${label}']`);
  if (!btn) throw new Error(`button not found: ${label}`);
  await btn.click();
};

describe('the shipped extension', () => {
  it('loads the popup with no console errors (CSP-clean)', async () => {
    await page.waitForSelector('.result');
    expect(await page.$eval('.result', (el) => el.textContent)).toBe('0');
    expect(await page.$('.sun')).not.toBeNull();
    expect(consoleErrors).toEqual([]);
  });

  it('computes and gets judged for 5 × 5, then recovers', async () => {
    for (const label of ['5', '×', '5', '=']) await click(label);

    await page.waitForSelector('.app.night');
    expect(await page.$eval('.result', (el) => el.textContent)).toBe('25');
    const bubbleText = await page.$eval('.bubble', (el) => el.textContent);
    expect(bubbleText!.length).toBeGreaterThan(0);

    await page.waitForSelector('.app:not(.night)', { timeout: 6000 });
    expect(await page.$('.bubble')).toBeNull();
  }, 15_000);

  it('handles honest math without drama', async () => {
    for (const label of ['AC', '4', '7', '×', '6', '2', '=']) await click(label);
    expect(await page.$eval('.result', (el) => el.textContent)).toBe('2914');
    expect(await page.$('.app.night')).toBeNull();
    expect(consoleErrors).toEqual([]);
  });
});
