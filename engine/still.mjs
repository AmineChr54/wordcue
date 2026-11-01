// Screenshots a static page at stage size, for reviewing style frames. Usage: node still.mjs <page.html> <out.png>
import { chromium } from 'playwright-core';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
await page.goto(pathToFileURL(resolve(process.argv[2])).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: process.argv[3] });
await browser.close();
