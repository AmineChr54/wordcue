// Frames from the same page the player shows, rendered in parallel, encoded with the narration.
// Usage: node render.mjs <film.html> [--out x.mp4] [--workers 8] [--fps 30] [--from s] [--to s]
//        node render.mjs <film.html> --hash 12.5     renders one time twice and compares
//        node render.mjs <film.html> --stills 3,12.5 writes PNGs only
import { chromium } from 'playwright-core';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const argv = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : dflt;
};
const html = resolve(argv[0]);
const dir = dirname(html);
const fps = +flag('fps', 30);
const workers = +flag('workers', 8);
const out = resolve(flag('out', join(dir, 'build', 'film.mp4')));
const SCALE = 1.2; // A 1600x900 stage becomes 1920x1080, a 900x1600 stage becomes 1080x1920.

// Raster caches and subpixel text depend on what was drawn before. Workers see different histories,
// so those are off, otherwise the same frame could differ by worker and shimmer in the video.
const browser = await chromium.launch({
  channel: 'msedge', headless: true,
  args: ['--disable-lcd-text', '--disable-partial-raster', '--disable-gpu', '--disable-threaded-animation', '--enable-font-antialiasing'],
});

async function openPage() {
  const page = await (await browser.newContext({
    viewport: { width: 1600, height: 900 }, deviceScaleFactor: SCALE,
  })).newPage();
  const problems = [];
  page.on('pageerror', e => problems.push(e.message));
  await page.goto(`${pathToFileURL(html).href}?render`);
  await page.addStyleTag({ content: 'html,body{margin:0}' });
  if (problems.length) throw new Error(`The film page failed: ${problems.join('; ')}`);
  await page.evaluate(() => window.__film.ready());
  await page.setViewportSize(await page.evaluate(() => ({ width: window.__film.width, height: window.__film.height })));
  const strays = await page.evaluate(() => window.__film.strays());
  if (strays.length) throw new Error(`Free-running animations would break the render: ${strays.join(', ')}`);
  return page;
}

async function shot(page, t, path) {
  await page.evaluate(v => window.__film.render(v), t);
  return page.screenshot(path ? { path, type: 'png' } : { type: 'png' });
}

try {
  if (flag('hash')) {
    const t = +flag('hash');
    const [a, b] = [await openPage(), await openPage()];
    await shot(a, t + 7);
    const sums = [await shot(a, t), await shot(b, t)].map(x => createHash('sha256').update(x).digest('hex'));
    console.log(sums[0] === sums[1] ? `identical ${sums[0].slice(0, 16)}` : `DIFFERENT ${sums.join(' ')}`);
    process.exitCode = sums[0] === sums[1] ? 0 : 1;
  } else if (flag('stills')) {
    const page = await openPage();
    const stillDir = join(dir, 'build', 'stills');
    mkdirSync(stillDir, { recursive: true });
    for (const t of flag('stills').split(',').map(Number)) {
      await shot(page, t, join(stillDir, `${t.toFixed(2).padStart(7, '0')}.png`));
    }
    console.log(stillDir);
  } else {
    const first = await openPage();
    const duration = await first.evaluate(() => window.__film.duration);
    const from = +flag('from', 0), to = Math.min(+flag('to', duration), duration);
    const total = Math.ceil((to - from) * fps);
    const frames = join(dirname(out), 'frames');
    rmSync(frames, { recursive: true, force: true });
    mkdirSync(frames, { recursive: true });

    const pages = [first, ...await Promise.all(Array.from({ length: workers - 1 }, openPage))];
    let next = 0, done = 0;
    const began = Date.now();
    await Promise.all(pages.map(async page => {
      while (next < total) {
        const i = next++;
        await shot(page, from + i / fps, join(frames, `${String(i).padStart(6, '0')}.png`));
        if (++done % 300 === 0) console.log(`${done}/${total} frames`);
      }
    }));
    console.log(`${total} frames in ${((Date.now() - began) / 1000).toFixed(0)}s`);

    const audio = join(dir, 'build', 'narration.wav');
    const args = ['-v', 'error', '-y', '-framerate', String(fps), '-i', join(frames, '%06d.png')];
    if (existsSync(audio)) args.push('-ss', String(from), '-t', String(to - from), '-i', audio);
    args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart');
    if (existsSync(audio)) args.push('-c:a', 'aac', '-b:a', '192k');
    execFileSync('ffmpeg', [...args, out], { stdio: 'inherit' });
    rmSync(frames, { recursive: true, force: true });

    // One contact sheet per render, for review without watching the whole film.
    const sheet = out.replace(/\.mp4$/, '_sheet.jpg');
    const every = Math.max(2, Math.round((to - from) / 24));
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', out, '-vf',
      `fps=1/${every},scale=480:-1,tile=4x6`, '-frames:v', '1', sheet], { stdio: 'inherit' });
    writeFileSync(out.replace(/\.mp4$/, '.json'), JSON.stringify({ fps, frames: total, from, to, duration }, null, 2));
    console.log(out);
  }
} finally {
  await browser.close();
}
