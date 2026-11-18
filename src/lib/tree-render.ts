// Turns tree geometry into SVG markup. Colours come from CSS custom
// properties (see the guestbook section of site.css), so both themes share
// one drawing.

import type { LeafShape, TreeGeometry } from './tree-layout.ts';
import { seeded } from './seeded.ts';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/** A filled leaf pointing up from (0, 0), with the two halves slightly uneven. */
export function leafPath(length: number, width: number, skew: number): string {
  const w = width / 2;
  const a = w * (1 + skew), b = w * (1 - skew);
  const L = length;
  return `M0 0C${a.toFixed(1)} ${(-L * 0.18).toFixed(1)} ${(a * 0.95).toFixed(1)} ${(-L * 0.72).toFixed(1)} 0 ${-L}`
    + `C${(-b * 0.95).toFixed(1)} ${(-L * 0.72).toFixed(1)} ${(-b).toFixed(1)} ${(-L * 0.18).toFixed(1)} 0 0Z`;
}

function leafMarkup(l: LeafShape, extraClass = ''): string {
  const classes = ['gt-leaf', `gt-leaf--${l.leaf.pinned ? 'pinned' : l.leaf.type}`, extraClass]
    .filter(Boolean).join(' ');
  const body = `<path d="${leafPath(l.length, l.width, l.skew)}"/><path class="gt-midrib" d="M0 -1.5L0 ${(-l.length * 0.82).toFixed(1)}"/>`;
  // Each leaf sways around its stem on its own slow cycle (seeded, so leaves never move in step).
  const rnd = seeded(`sway:${l.leaf.id}`);
  const sway = `--sd:${(6 + rnd.next() * 4).toFixed(2)}s;--sl:${(-rnd.next() * 9).toFixed(2)}s`;
  return `<g class="${classes}" data-id="${esc(l.leaf.id)}" transform="translate(${l.x} ${l.y}) rotate(${l.angle})"><g class="gt-sway" style="${sway}">${body}</g></g>`;
}

function potMarkup(g: TreeGeometry): string {
  const { x, y, width, height, rimWidth, rimHeight } = g.pot;
  const top = y + rimHeight;
  const bottomHalf = width * 0.38;
  const body = `M${x - width / 2} ${top}L${x + width / 2} ${top}L${x + bottomHalf} ${y + height}L${x - bottomHalf} ${y + height}Z`;
  return `<g class="gt-pot">`
    + `<path class="gt-pot-body" d="${body}"/>`
    + `<rect class="gt-pot-rim" x="${x - rimWidth / 2}" y="${y}" width="${rimWidth}" height="${rimHeight}" rx="2"/>`
    + `<ellipse class="gt-soil" cx="${x}" cy="${y + 1.5}" rx="${rimWidth / 2 - 4}" ry="2.5"/>`
    + `</g>`;
}

export function renderTree(g: TreeGeometry): string {
  const branches = g.branches
    .map((b) => `<path class="gt-branch gt-depth-${Math.min(b.depth, 5)}" d="${b.d}" stroke-width="${b.width.toFixed(1)}"/>`)
    .join('');
  return `<g class="gt-branches">${branches}</g>`
    + `<path class="gt-trunk" d="${g.trunk}"/>`
    + potMarkup(g)
    + `<g class="gt-fallen">${g.fallen.map((l) => leafMarkup(l)).join('')}</g>`
    + `<g class="gt-leaves">${g.leaves.map((l) => leafMarkup(l)).join('')}</g>`;
}
