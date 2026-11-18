// Pure helpers for the tree's live behaviour: where the scroll glow sits on
// the trunk, which leaves are near it, and where a note's card fits on screen.
// No DOM access, so they are unit-tested and cheap to call every frame.

import type { Point } from './tree-layout.ts';

/**
 * The trunk's x at a page y. The centre line runs from the pot upward, so its
 * y only decreases; a binary search finds the two samples around y.
 */
export function trunkXAt(line: Point[], y: number): number {
  if (line.length === 0) return 0;
  if (y >= line[0].y) return line[0].x;
  const last = line[line.length - 1];
  if (y <= last.y) return last.x;
  let lo = 0, hi = line.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (line[mid].y > y) lo = mid; else hi = mid;
  }
  const a = line[lo], b = line[hi];
  const s = a.y === b.y ? 0 : (a.y - y) / (a.y - b.y);
  return a.x + (b.x - a.x) * s;
}

/** Indexes [from, to) of the items whose y lies within [lo, hi]. `ys` must be sorted ascending. */
export function rangeByY(ys: number[], lo: number, hi: number): [number, number] {
  const lower = (v: number) => {
    let a = 0, b = ys.length;
    while (a < b) { const m = (a + b) >> 1; if (ys[m] < v) a = m + 1; else b = m; }
    return a;
  };
  const upper = (v: number) => {
    let a = 0, b = ys.length;
    while (a < b) { const m = (a + b) >> 1; if (ys[m] <= v) a = m + 1; else b = m; }
    return a;
  };
  return [lower(lo), upper(hi)];
}

export interface Rect { left: number; top: number; right: number; bottom: number }

/**
 * Where to put a note's card next to a leaf so it stays fully on screen.
 * Prefers the left of the leaf (the tree hugs the right edge), then the
 * right, then below or above; always clamped inside the viewport margin.
 */
export function placeCard(
  anchor: Rect,
  card: { width: number; height: number },
  view: { width: number; height: number },
  gap = 10,
  margin = 8,
): { left: number; top: number } {
  const clampX = (x: number) => Math.min(Math.max(x, margin), Math.max(margin, view.width - margin - card.width));
  const clampY = (y: number) => Math.min(Math.max(y, margin), Math.max(margin, view.height - margin - card.height));
  const midY = (anchor.top + anchor.bottom) / 2 - card.height / 2;
  if (anchor.left - gap - card.width >= margin) return { left: anchor.left - gap - card.width, top: clampY(midY) };
  if (anchor.right + gap + card.width <= view.width - margin) return { left: anchor.right + gap, top: clampY(midY) };
  const below = anchor.bottom + gap;
  const top = below + card.height <= view.height - margin ? below : anchor.top - gap - card.height;
  return { left: clampX((anchor.left + anchor.right) / 2 - card.width / 2), top: clampY(top) };
}
