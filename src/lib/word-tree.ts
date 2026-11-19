// @ts-nocheck
// The guestbook tree on the home page: a radix tree over words, drawn as a tree.
// Each note is a key. Notes that start with the same words share a branch, and
// every leaf is one note. This file is the geometry only: it turns a list of
// notes into points and SVG path strings and never touches the page.
// (Loosely typed for now: it was ported from the design mockup as it stood.)

export interface Note {
  id: number;
  text: string;
}
export interface TreeNode {
  key: string;
  x: number;
  y: number;
  w: number;
  parent: string | null;
  leafId: number | null;
  label: string;
}
export interface Layout {
  nodes: Record<string, TreeNode>;
  order: string[];
}
export interface Glyph {
  x: number;
  y: number;
  rot: number;
  ch: string;
  lit: boolean;
}
/** One traced leaf: a list of outlines, the pen line's outer edge first. Stem end at 0,0, tip up. */
export type LeafShape = { polys: number[][][] };

/** The tree is laid out in a fixed 1040 x 600 box, trunk foot at 520,600. */
export const BOX = { width: 1040, height: 600 };

/** A steady pseudo-random number in 0..1 for a string, so the same notes always draw the same tree. */
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}
export function norm(t) {
  return t.toLowerCase().replace(/\s+/g, ' ').trim();
}
export function ease(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
/** Control points of the curve from a parent point to a child point. */
export function ctrl(P, C) {
  const vx = C.x - P.x,
    vy = C.y - P.y,
    len = Math.hypot(vx, vy);
  const th = Math.atan2(vx, -vy);
  const a = Math.max(-1.5, Math.min(1.5, th * 1.12)),
    b = th * 0.45;
  return [
    [P.x + Math.sin(a) * len * 0.45, P.y - Math.cos(a) * len * 0.45],
    [C.x - Math.sin(b) * len * 0.35, C.y + Math.cos(b) * len * 0.35],
  ];
}
export function bez(p0, c1, c2, p3, t) {
  const m = 1 - t;
  return [
    m * m * m * p0[0] + 3 * m * m * t * c1[0] + 3 * m * t * t * c2[0] + t * t * t * p3[0],
    m * m * m * p0[1] + 3 * m * m * t * c1[1] + 3 * m * t * t * c2[1] + t * t * t * p3[1],
  ];
}

/** Builds the radix tree for these notes and places every fork and leaf. `cone` tapers the trunk's limbs toward the top. */
export function layoutTree(notes: Note[], cone: boolean): Layout {
  const root = { edge: [], children: [], leafId: null };
  const ins = (node, key, id) => {
    for (let c = 0; c < node.children.length; c++) {
      const ch = node.children[c];
      const m = Math.min(ch.edge.length, key.length);
      let k = 0;
      while (k < m && ch.edge[k] === key[k]) k++;
      if (k === 0) continue;
      if (k === ch.edge.length) {
        ins(ch, key.slice(k), id);
        return;
      }
      const mid = { edge: ch.edge.slice(0, k), children: [ch], leafId: null };
      ch.edge = ch.edge.slice(k);
      node.children[c] = mid;
      mid.children.push({ edge: key.slice(k), children: [], leafId: id });
      return;
    }
    node.children.push({ edge: key, children: [], leafId: id });
  };
  notes.forEach((n) =>
    ins(
      root,
      norm(n.text)
        .split(' ')
        .concat(['\u0000' + n.id]),
      n.id,
    ),
  );
  let nLeaves = 0,
    maxD = 0;
  const walk = (nd, d, parent, key) => {
    nd.key = key;
    nd.depth = d;
    nd.parent = parent;
    if (d > maxD) maxD = d;
    if (!nd.children.length) {
      if (!parent) {
        nd.count = 0;
        nd.lo = nd.hi = 0;
        return 0;
      }
      nd.lo = nd.hi = nLeaves++;
      nd.count = 1;
      return 1;
    }
    nd.children.sort((a, b) => (a.edge.join(' ') < b.edge.join(' ') ? -1 : 1));
    // The trunk carries at most eight limbs and any other limb at most five. Extra branches are gathered,
    // in order, onto plain limbs with no words of their own, so a busy tree forks like a tree and not like a ladder.
    const cap = d === 0 ? 8 : 5;
    if (nd.children.length > cap) {
      const kids = nd.children,
        groups = [];
      for (let i = 0; i < cap; i++) {
        const part = kids.slice(Math.round((i * kids.length) / cap), Math.round(((i + 1) * kids.length) / cap));
        groups.push(part.length === 1 ? part[0] : { edge: ['\u0000g' + part[0].edge.join(' ')], children: part, leafId: null });
      }
      nd.children = groups;
    }
    let c = 0;
    nd.children.forEach((ch) => {
      c += walk(ch, d + 1, nd, key + '\u0001' + ch.edge.join(' '));
    });
    nd.count = c;
    nd.lo = nd.children[0].lo;
    nd.hi = nd.children[nd.children.length - 1].hi;
    return c;
  };
  walk(root, 0, null, '');
  const D = Math.PI / 180;
  const nodes = {},
    order = [];
  const add = (key, x, y, w, parent, nd, isLeaf) => {
    nodes[key] = {
      key: key,
      x: x,
      y: y,
      w: w,
      parent: parent,
      leafId: isLeaf ? nd.leafId : null,
      label: nd && !isLeaf ? nd.edge.filter((w2) => w2[0] !== '\u0000').join(' ') : '',
    };
    order.push(key);
  };
  const wOf = (c, trunk) => (1.2 + 3.4 * Math.sqrt(Math.max(c, 0.2))) * (trunk ? 1.45 : 1);
  // A limb keeps heading up (the leader) and its branches peel off left and right, biggest and lowest first.
  // Each branch is built around its own origin. If it would run into one already placed, it moves further
  // up the leader (and only a little further out), so a busy tree grows taller, not wider.
  const R2 = 28 * 28;
  const clash = (pts, ox, oy, placed) => {
    for (let a = 0; a < pts.length; a++) {
      const x = pts[a][0] + ox,
        y = pts[a][1] + oy;
      for (let b = 0; b < placed.length; b++) {
        const dx = x - placed[b][0],
          dy = y - placed[b][1];
        if (dx * dx + dy * dy < R2) return true;
      }
    }
    return false;
  };
  const build = (nd, lead, d) => {
    const recs = [],
      pts = [[0, 0]];
    const kids = nd.children,
      k = kids.length;
    if (!k) return { recs: recs, pts: pts };
    const byWeight = kids.slice().sort((a, b) => b.count - a.count);
    const top = k % 2 ? byWeight.pop() : null;
    const sides = { '-1': [], '1': [] },
      load = { '-1': 0, '1': 0 };
    const first = hash(nd.key + 'side') < 0.5 ? -1 : 1;
    byWeight.forEach((ch) => {
      const sd = load[first] <= load[-first] ? first : -first;
      sides[sd].push(ch);
      load[sd] += ch.count;
    });
    const p = Math.max(sides['-1'].length, sides['1'].length, 1),
      seq = [];
    for (let i = 0; i < p; i++) {
      if (sides[first][i]) seq.push([sides[first][i], first, i]);
      if (sides[-first][i]) seq.push([sides[-first][i], -first, i]);
    }
    if (top) seq.push([top, 0, p]);
    const alt = k >= 4;
    const placed = [];
    let remaining = nd.count,
      px = 0,
      py = 0,
      pkey = nd.key;
    seq.forEach((sq, j) => {
      const ch = sq[0],
        side = sq[1];
      const h1 = hash(ch.key + 'a'),
        h2 = hash(ch.key + 'l');
      const t = p > 1 ? sq[2] / (p - 1) : 0.5;
      let off = side === 0 ? 0 : p === 1 ? (k === 2 ? 28 : 38) : 56 - 26 * t;
      if (d > 0) off *= 0.85;
      let th = lead + side * off * D + (h1 - 0.5) * 12 * D;
      th = Math.max(-70 * D, Math.min(70 * D, th));
      const leaf = !ch.children.length;
      let len = leaf ? (48 + 30 * h2) * (d === 0 ? 1.25 : 1) : 100 * Math.pow(0.8, d) * (0.85 + 0.3 * h2);
      // Christmas: the trunk's limbs shorten toward the top, for a cone-shaped outline.
      len *= cone && d === 0 ? 1.4 - 0.8 * t : 1.1 - 0.2 * t;
      const sub = build(ch, th * 0.7, d + 1);
      const gap = j > 0 && alt ? (d === 0 ? 20 : 13) * (0.55 + 0.5 * Math.sqrt(seq[j - 1][0].count)) : 0;
      const up = lead + (hash(nd.key + '#w' + j) - 0.5) * 12 * D;
      let ax = px,
        ay = py,
        cx = 0,
        cy = 0,
        rise = 0,
        limb = [];
      for (let tr = 0; tr < 28; tr++) {
        rise = j > 0 ? gap + tr * 10 : 0;
        const l2 = len + (j > 0 ? Math.floor(tr / 4) : tr) * 12;
        ax = px + Math.sin(up) * rise;
        ay = py - Math.cos(up) * rise;
        cx = ax + Math.sin(th) * l2;
        cy = ay - Math.cos(th) * l2;
        limb = [0.6, 0.85].map((f) => [ax + (cx - ax) * f, ay + (cy - ay) * f]);
        if (!clash(sub.pts, cx, cy, placed) && !clash(limb, 0, 0, placed)) break;
      }
      if (rise >= 1) {
        const vk = nd.key + '#' + j;
        recs.push({ key: vk, x: ax, y: ay, w: wOf(remaining, d === 0), parent: pkey, nd: null, leaf: false });
        pkey = vk;
        px = ax;
        py = ay;
        pts.push([ax, ay]);
      }
      remaining -= ch.count;
      recs.push({ key: ch.key, x: cx, y: cy, w: wOf(ch.count, false), parent: pkey, nd: ch, leaf: leaf });
      sub.recs.forEach((r) => {
        recs.push(Object.assign({}, r, { x: r.x + cx, y: r.y + cy }));
      });
      sub.pts.forEach((q) => {
        const m = [q[0] + cx, q[1] + cy];
        placed.push(m);
        pts.push(m);
      });
      limb.forEach((m) => {
        placed.push(m);
        pts.push(m);
      });
    });
    return { recs: recs, pts: pts };
  };
  add('', 520, 470, wOf(root.count, true), null, null, false);
  build(root, (hash('lean') - 0.5) * 6 * D, 0).recs.forEach((r) => add(r.key, 520 + r.x, 470 + r.y, r.w, r.parent, r.nd, r.leaf));
  // Fit the crown to the box, scaling around the foot of the trunk.
  let half = 1,
    top = 470;
  order.forEach((k) => {
    const n = nodes[k],
      pad = n.leafId != null ? 24 : 0;
    half = Math.max(half, Math.abs(n.x - 520) + pad);
    top = Math.min(top, n.y - pad);
  });
  const fit = Math.min(1.25, 480 / half, 560 / (600 - top));
  order.forEach((k) => {
    const n = nodes[k];
    n.x = 520 + (n.x - 520) * fit;
    n.y = 600 + (n.y - 600) * fit;
  });
  // Nudge leaves apart so each one can be clicked.
  const tips = order.filter((k) => nodes[k].leafId != null).map((k) => nodes[k]);
  for (let it = 0; it < 6; it++) {
    for (let a = 0; a < tips.length; a++) {
      for (let b = a + 1; b < tips.length; b++) {
        let dx = tips[b].x - tips[a].x,
          dy = tips[b].y - tips[a].y;
        let dist = Math.hypot(dx, dy);
        if (dist >= 30) continue;
        if (dist < 0.01) {
          dx = hash(tips[a].key) - 0.5;
          dy = -0.5;
          dist = Math.hypot(dx, dy);
        }
        const push = (30 - dist) / 2 / dist;
        tips[a].x -= dx * push;
        tips[a].y -= dy * push;
        tips[b].x += dx * push;
        tips[b].y += dy * push;
      }
    }
  }
  tips.forEach((n) => {
    n.x = Math.max(24, Math.min(1016, n.x));
    n.y = Math.max(34, Math.min(560, n.y));
  });
  return { nodes: nodes, order: order };
}

/** The tree part-way between two layouts (e is 0..1). Branches that are new grow out of their parent. */
export function blend(from, to, e) {
  const start = {},
    cur = {};
  to.order.forEach((k) => {
    const b = to.nodes[k];
    let a = from.nodes[k];
    if (!a) {
      const ps = start[b.parent];
      a = { x: ps.x, y: ps.y, w: 0 };
    }
    start[k] = a;
    cur[k] = Object.assign({}, b, { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, w: a.w + (b.w - a.w) * e });
  });
  return { nodes: cur, order: to.order };
}

/** Trunk, roots and every branch as one filled SVG path, with a hand-inked wobble. */
export function woodPath(L) {
  let d = '';
  const poly = (pts) => {
    let a = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i],
        q = pts[(i + 1) % pts.length];
      a += p[0] * q[1] - q[0] * p[1];
    }
    if (a < 0) pts.reverse();
    d += 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z';
  };
  const limb = (p0, c1, c2, p3, w0, w1, flare, key) => {
    const A = [],
      B = [],
      N = 20;
    // Inked look: the line wanders a little and its thickness is uneven, the same way every frame.
    const span = Math.hypot(p3[0] - p0[0], p3[1] - p0[1]);
    const f1 = span / 17,
      f2 = span / 6.5,
      f3 = span / 24;
    const ph1 = hash(key + '1') * 6.28,
      ph2 = hash(key + '2') * 6.28,
      ph3 = hash(key + '3') * 6.28;
    for (let i = 0; i <= N; i++) {
      const t = i / N,
        m = 1 - t;
      const p = bez(p0, c1, c2, p3, t);
      const tx = 3 * m * m * (c1[0] - p0[0]) + 6 * m * t * (c2[0] - c1[0]) + 3 * t * t * (p3[0] - c2[0]);
      const ty = 3 * m * m * (c1[1] - p0[1]) + 6 * m * t * (c2[1] - c1[1]) + 3 * t * t * (p3[1] - c2[1]);
      const len = Math.hypot(tx, ty) || 1;
      let w = flare ? w1 * (1 + 1.5 * Math.pow(m, 4)) : w0 + (w1 - w0) * t;
      const edge = Math.sin(Math.PI * t);
      w *= 1 + edge * (flare ? 0.5 : 1) * (0.17 * Math.sin(t * f1 + ph1) + 0.09 * Math.sin(t * f2 + ph2));
      const drift = edge * (1 + w * 0.1) * Math.sin(t * f3 + ph3);
      p[0] -= (ty / len) * drift;
      p[1] += (tx / len) * drift;
      A.push([p[0] - ((ty / len) * w) / 2, p[1] + ((tx / len) * w) / 2]);
      B.push([p[0] + ((ty / len) * w) / 2, p[1] - ((tx / len) * w) / 2]);
    }
    poly(A.concat(B.reverse()));
  };
  const dot = (x, y, r) => {
    if (r < 0.3) return;
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
    }
    poly(pts);
  };
  const root = L.nodes[''];
  const th0 = 600 - root.y;
  limb([520, 600], [516, 600 - th0 * 0.35], [root.x + 3, root.y + th0 * 0.3], [root.x, root.y], 0, root.w, true, 'trunk');
  const rw = root.w;
  limb([520 - rw * 0.7, 588], [520 - rw * 1.3, 596], [520 - rw * 2.4, 598], [520 - rw * 3.6, 601], rw * 0.7, 1.5, false, 'r1');
  limb([520 + rw * 0.7, 588], [520 + rw * 1.4, 597], [520 + rw * 2.8, 598], [520 + rw * 4.2, 601], rw * 0.75, 1.5, false, 'r2');
  limb([520 + rw * 0.2, 592], [520 + rw * 0.6, 598], [520 + rw * 1.2, 600], [520 + rw * 1.9, 601], rw * 0.5, 1.5, false, 'r3');
  dot(root.x, root.y, root.w / 2);
  L.order.forEach((k) => {
    const C = L.nodes[k];
    if (C.parent == null) return;
    const P = L.nodes[C.parent];
    if (Math.hypot(C.x - P.x, C.y - P.y) < 0.5) return;
    const w1 = C.leafId != null ? Math.min(2, C.w) : C.w;
    const w0 = Math.max(w1, Math.min(P.w, C.w * 1.3));
    const cc = ctrl(P, C);
    limb([P.x, P.y], cc[0], cc[1], [C.x, C.y], w0, w1, false, k);
    dot(C.x, C.y, w1 / 2);
  });
  return d;
}

/** Writes a branch's shared words along its curve, one letter at a time, just above the wood. */
export function along(P, C, text, lit, charW, out) {
  const cc = ctrl(P, C);
  const flip = C.x < P.x;
  const pts = [],
    N = 36;
  for (let i = 0; i <= N; i++) pts.push(bez([P.x, P.y], cc[0], cc[1], [C.x, C.y], flip ? 1 - i / N : i / N));
  const cum = [0];
  for (let i = 1; i <= N; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = cum[N];
  if (total < 8) return;
  const widths = text.split('').map((ch) => charW(ch) + 0.9);
  const sum = widths.reduce((a, b) => a + b, 0);
  let sAt = Math.max(4, (total - sum) / 2);
  const lift = Math.min(P.w, C.w) / 2 + 10;
  let seg = 1;
  text.split('').forEach((ch, n) => {
    const mid = sAt + widths[n] / 2;
    sAt += widths[n];
    if (ch === ' ') return;
    while (seg < N && cum[seg] < mid) seg++;
    const a = pts[seg - 1],
      b = pts[seg];
    const sl = cum[seg] - cum[seg - 1] || 1;
    const f = (mid - cum[seg - 1]) / sl;
    const tx = (b[0] - a[0]) / sl,
      ty = (b[1] - a[1]) / sl;
    const x = a[0] + (b[0] - a[0]) * f + ty * lift,
      y = a[1] + (b[1] - a[1]) * f - tx * lift;
    out.push({ x: x, y: y, rot: (Math.atan2(ty, tx) * 180) / Math.PI, ch: ch, lit: lit });
  });
}

/** The small background leaves along the twigs, as four path strings (one per colour). */
export function decorPaths(L, all, full) {
  const out = ['', '', '', ''];
  const put = (x, y, ang, sc, ci, si) => {
    const c = Math.cos(ang) * sc,
      s = Math.sin(ang) * sc;
    all[si].polys.forEach((poly) => {
      out[ci] += 'M' + poly.map((p) => (x + p[0] * c - p[1] * s).toFixed(1) + ' ' + (y + p[0] * s + p[1] * c).toFixed(1)).join('L') + 'Z';
    });
  };
  L.order.forEach((k) => {
    const C = L.nodes[k];
    if (C.parent == null) return;
    const P = L.nodes[C.parent];
    if (Math.hypot(C.x - P.x, C.y - P.y) < 14) return;
    const isLeaf = C.leafId != null;
    if (!isLeaf && C.w > (full ? 9 : 7)) return;
    const cc = ctrl(P, C);
    const spots = full ? (isLeaf ? [0.3, 0.55, 0.72, 0.88] : [0.35, 0.65, 0.9]) : isLeaf ? [0.55, 0.86] : [0.6];
    spots.forEach((t, n) => {
      const h = hash(k + 'd' + n),
        h2 = hash(k + 'e' + n);
      const a = bez([P.x, P.y], cc[0], cc[1], [C.x, C.y], t - 0.03);
      const b = bez([P.x, P.y], cc[0], cc[1], [C.x, C.y], t + 0.03);
      const side = (n % 2 ? 1 : -1) * (h > 0.5 ? 1 : -1);
      const ang = Math.atan2(b[0] - a[0], -(b[1] - a[1])) + side * (0.7 + 0.5 * h2);
      put((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, ang, 0.6 + 0.22 * h, Math.floor(h2 * 4) % 4, Math.floor(hash(k + 's' + n) * 5) % 5);
    });
  });
  return out;
}

/** Where a note's leaf sits and which way it points. */
export function leafPose(L, node) {
  const cc = ctrl(L.nodes[node.parent], node);
  return { x: node.x, y: node.y, rot: (Math.atan2(node.x - cc[1][0], -(node.y - cc[1][1])) * 180) / Math.PI + (hash('r' + node.leafId) - 0.5) * 36 };
}

/** The box around everything drawn, leaves included. */
export function bounds(L) {
  let x0 = 520,
    x1 = 520,
    y0 = 600;
  L.order.forEach((k) => {
    const n = L.nodes[k],
      pad = n.leafId != null ? 40 : 6;
    x0 = Math.min(x0, n.x - pad);
    x1 = Math.max(x1, n.x + pad);
    y0 = Math.min(y0, n.y - pad);
  });
  return { x0: x0, x1: x1, y0: y0, y1: 600 };
}
