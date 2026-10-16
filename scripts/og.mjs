// Generates public/og/home.png, public/og/<slug>.png and public/favicon-32.png
// from the site data and project front matter. Runs before every build.
import { readFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = join(root, 'public', 'og');
mkdirSync(out, { recursive: true });

const SANS = "system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function frontMatter(file) {
  const text = readFileSync(file, 'utf8');
  const fm = text.split('---')[1] ?? '';
  const get = (key) => (fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1] ?? '').trim();
  return { title: get('title'), tagline: get('tagline') };
}

// Breaks a line of text into rows that fit a width, estimating ~0.5em per character.
function wrap(text, size, width) {
  const max = Math.floor(width / (size * 0.5));
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max) { lines.push(line.trim()); line = w; } else line += ' ' + w;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function card({ bg, fg, muted, title, titleSize, line, lineSize, lineFont, url }) {
  const titleLines = wrap(title, titleSize, 1040);
  const bodyLines = wrap(line, lineSize, 1040);
  let y = 200;
  const parts = [];
  for (const t of titleLines) { parts.push(`<text x="80" y="${y}" font-family="${SANS}" font-weight="650" font-size="${titleSize}" fill="${fg}">${esc(t)}</text>`); y += titleSize * 1.08; }
  y += 24;
  for (const t of bodyLines) { parts.push(`<text x="80" y="${y}" font-family="${lineFont}" font-size="${lineSize}" fill="${fg}">${esc(t)}</text>`); y += lineSize * 1.4; }
  parts.push(`<text x="80" y="560" font-family="${SANS}" font-size="24" fill="${muted}">${esc(url)}</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="${bg}"/>${parts.join('')}</svg>`;
}

const site = readFileSync(join(root, 'src', 'data', 'site.ts'), 'utf8');
const field = (key) => site.match(new RegExp(`${key}:\\s*'([^']*)'`))?.[1] ?? '';
const name = field('name');
const url = field('url').replace(/^https?:\/\//, '');
const headline = site.match(/description:\s*\n\s*'([^']*)'/)?.[1]?.split('. ')[0] + '.';

await sharp(Buffer.from(card({ bg: '#ECECEA', fg: '#141414', muted: '#5C5C5C', title: name, titleSize: 72, line: headline, lineSize: 32, lineFont: SERIF, url })))
  .png().toFile(join(out, 'home.png'));

const projectsDir = join(root, 'src', 'content', 'projects');
for (const slug of readdirSync(projectsDir)) {
  const file = join(projectsDir, slug, 'index.md');
  if (!existsSync(file)) continue;
  const { title, tagline } = frontMatter(file);
  await sharp(Buffer.from(card({ bg: '#3B4A66', fg: '#ECEEF2', muted: '#C3CAD6', title, titleSize: 72, line: tagline, lineSize: 32, lineFont: SERIF, url })))
    .png().toFile(join(out, `${slug}.png`));
}

await sharp(readFileSync(join(root, 'public', 'favicon.svg'))).resize(32, 32).png().toFile(join(root, 'public', 'favicon-32.png'));
console.log('OG images and favicon written');
