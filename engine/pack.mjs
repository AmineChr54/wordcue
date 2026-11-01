// Packs a film page into one self-contained HTML file, so it can be emailed or moved.
// Fonts loaded with @font-face from local files are embedded. Installed fonts are not, so a machine
// without them falls back to the next family in the CSS.
// Usage: node pack.mjs <film.html> [out.html]
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const html = resolve(process.argv[2]);
const dir = dirname(html);
const out = resolve(process.argv[3] || join(dir, 'build', 'film-standalone.html'));
let page = readFileSync(html, 'utf8');

page = page.replace(/<script src="([^"]+)"><\/script>/g, (_, src) =>
  `<script>${readFileSync(join(dir, src), 'utf8').replaceAll('</script', '<\\/script')}</script>`);

page = page.replace(/url\(([^)'"]+\.woff2)\)/g, (_, src) =>
  `url(data:font/woff2;base64,${readFileSync(join(dir, src)).toString('base64')})`);

const wav = join(dir, 'build', 'narration.wav');
if (existsSync(wav)) {
  const m4a = join(dir, 'build', 'narration.m4a');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', wav, '-c:a', 'aac', '-b:a', '128k', m4a], { stdio: 'inherit' });
  const uri = `data:audio/mp4;base64,${readFileSync(m4a).toString('base64')}`;
  if (!page.includes('build/narration.wav')) throw new Error('The page does not reference build/narration.wav');
  page = page.replaceAll('build/narration.wav', uri);
}
writeFileSync(out, page);
console.log(`${out} (${(page.length / 1048576).toFixed(1)} MB)`);
