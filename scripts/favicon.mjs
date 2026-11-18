// Builds every favicon from src/assets/favicon-pixels.png, a 16x16 pixel-art
// drawing stored at 40px per pixel. Nothing is ever resampled smoothly:
// the SVG is drawn from the pixels themselves, and every PNG is a whole-number
// multiple of 16 enlarged with nearest-neighbour sampling.
//
// Writes public/favicon.svg, favicon-32.png, favicon.ico, apple-touch-icon.png,
// src/assets/pixel-face.svg (for the page)
// and icon-512.png. Runs before every build.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const pub = join(root, 'public');
const N = 16;

// Light tabs: dark ink on a white face. Dark tabs: the ink would vanish, so it
// turns light and the face turns dark instead.
const LIGHT = { ink: '#141414', face: '#FFFFFF' };
const DARK = { ink: '#ECECEA', face: '#1C1C1C' };
const PAGE = '#ECECEA'; // light page colour, behind the opaque icons

// 1. Read the drawing back into a grid: 1 = ink, 0 = white.
const src = await sharp(join(root, 'src', 'assets', 'favicon-pixels.png')).removeAlpha().greyscale().raw().toBuffer({ resolveWithObject: true });
const cell = src.info.width / N;
if (!Number.isInteger(cell) || src.info.width !== src.info.height) throw new Error('favicon-pixels.png must be a square multiple of 16px');
const ink = Array.from({ length: N }, (_, y) => Array.from({ length: N }, (_, x) => {
  const cx = Math.floor((x + 0.5) * cell), cy = Math.floor((y + 0.5) * cell);
  return src.data[cy * src.info.width + cx] < 128 ? 1 : 0;
}));

// 2. White pixels reachable from the edge are background (transparent); the
// white pixels the outline encloses are the face.
const outside = ink.map((r) => r.map(() => false));
const queue = [];
for (let i = 0; i < N; i++) queue.push([i, 0], [i, N - 1], [0, i], [N - 1, i]);
while (queue.length) {
  const [x, y] = queue.pop();
  if (x < 0 || y < 0 || x >= N || y >= N || outside[y][x] || ink[y][x]) continue;
  outside[y][x] = true;
  queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
}
const kind = (x, y) => (ink[y][x] ? 'ink' : outside[y][x] ? null : 'face');

// 3. SVG: one path per colour, each horizontal run of pixels merged into a rectangle.
const runs = (want) => {
  let d = '';
  for (let y = 0; y < N; y++) for (let x = 0; x < N; ) {
    if (kind(x, y) !== want) { x++; continue; }
    let end = x;
    while (end < N && kind(end, y) === want) end++;
    d += `M${x} ${y}h${end - x}v1h${x - end}z`;
    x = end;
  }
  return d;
};
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N} ${N}" width="${N}" height="${N}" shape-rendering="crispEdges">` +
  `<style>.f{fill:${LIGHT.face}}.i{fill:${LIGHT.ink}}@media (prefers-color-scheme:dark){.f{fill:${DARK.face}}.i{fill:${DARK.ink}}}</style>` +
  `<path class="f" d="${runs('face')}"/><path class="i" d="${runs('ink')}"/></svg>\n`;
writeFileSync(join(pub, 'favicon.svg'), svg);
// The same drawing for use on the page: ink only, in currentColor, so it
// follows the text colour of wherever it is placed.
writeFileSync(join(root, 'src', 'assets', 'pixel-face.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N} ${N}" width="${N}" height="${N}" shape-rendering="crispEdges" fill="currentColor"><path d="${runs('ink')}"/></svg>\n`);

// 4. Raster versions: build the 16px image pixel by pixel, then enlarge by whole numbers.
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const base = Buffer.alloc(N * N * 4);
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  const k = kind(x, y);
  if (!k) continue;
  base.set([...hex(LIGHT[k]), 255], (y * N + x) * 4);
}
const at = (scale) => sharp(base, { raw: { width: N, height: N, channels: 4 } }).resize(N * scale, N * scale, { kernel: 'nearest' });
// Opaque square icon: the drawing at a whole-number scale, centred on the page colour.
const padded = async (size, scale) => {
  const art = await at(scale).png().toBuffer();
  const pad = (size - N * scale) / 2;
  return sharp(art).extend({ top: Math.floor(pad), bottom: Math.ceil(pad), left: Math.floor(pad), right: Math.ceil(pad), background: PAGE }).flatten({ background: PAGE }).png().toBuffer();
};

const png16 = await at(1).png().toBuffer();
const png32 = await at(2).png().toBuffer();
const png48 = await at(3).png().toBuffer();
writeFileSync(join(pub, 'favicon-32.png'), png32);
// Apple ignores transparency and rounds the corners, so 10x (160px) sits inside a 180px square.
writeFileSync(join(pub, 'apple-touch-icon.png'), await padded(180, 10));
// Maskable icons must keep the art inside the central 80% (409px): 25x is 400px.
writeFileSync(join(pub, 'icon-512.png'), await padded(512, 25));

// 5. favicon.ico holding the 16, 32 and 48px PNGs.
const images = [[16, png16], [32, png32], [48, png48]];
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach(([size, buf], i) => {
  const o = 6 + 16 * i;
  header.writeUInt8(size, o); header.writeUInt8(size, o + 1); header.writeUInt8(0, o + 2); header.writeUInt8(0, o + 3);
  header.writeUInt16LE(1, o + 4); header.writeUInt16LE(32, o + 6);
  header.writeUInt32LE(buf.length, o + 8); header.writeUInt32LE(offset, o + 12);
  offset += buf.length;
});
writeFileSync(join(pub, 'favicon.ico'), Buffer.concat([header, ...images.map(([, b]) => b)]));

console.log('Favicons written');
