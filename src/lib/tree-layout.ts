// Maps the AVL tree onto the guestbook page. Pure: a frame size and the nodes
// in, geometry out, with no DOM access, so it is unit-tested like the AVL
// module.
//
// The mapping:
//   - in-order rank (time order) → position along the trunk: oldest just above
//     the pot, newest up in the crown;
//   - node depth → how far the branch reaches out from the trunk and how thin
//     it is (deeper = shorter and thinner);
//   - parent→child links → curved branches that run along the trunk between
//     the two nodes;
//   - small offsets seeded from each note's id, so the tree looks organic but
//     renders identically every time.
//
// Positions along the trunk use `t`, from 0 at the pot to 1 at the tip of the
// crown. The trunk rises near the panel's right edge, then bends left across
// the top; along the bend, "outward" points down, so crown leaves hang.

import type { FlatNode } from './avl.ts';
import type { Leaf } from './leaf-tree.ts';
import { seeded } from './seeded.ts';

export interface Point { x: number; y: number }

/** The area the tree grows in. */
export interface TreeFrame {
  width: number;
  height: number;
  /** Centre line of the trunk's straight part. */
  trunkX: number;
  /** Height of the crown's tip. */
  topY: number;
  /** Where the crown's bend ends. */
  crownTipX: number;
  /** The trunk starts bending into the crown here; crown leaves stay above it. */
  bendY: number;
  /** Longest branch reach, in px. */
  maxReach: number;
}

export interface PinnedPlacement { leaf: Leaf; t: number; reach: number }

export interface LeafShape {
  leaf: Leaf;
  /** Where the leaf attaches. */
  x: number;
  y: number;
  /** Rotation in degrees: 0 points straight up. */
  angle: number;
  length: number;
  width: number;
  /** Asymmetry of the two halves, for a hand-drawn feel. */
  skew: number;
  t: number;
  depth: number | null;
  reach: number;
}

export interface Branch { d: string; width: number; depth: number }

export interface TreeGeometry {
  width: number;
  height: number;
  /** Filled outline of the trunk. */
  trunk: string;
  /** Trunk centre line from the pot to the tip, with t at each sample (for the scroll glow). */
  centerline: (Point & { t: number })[];
  branches: Branch[];
  leaves: LeafShape[];
  fallen: LeafShape[];
  pot: { x: number; y: number; width: number; height: number; rimWidth: number; rimHeight: number };
}

export interface LayoutInput extends TreeFrame {
  nodes: FlatNode<Leaf>[];
  pinned: PinnedPlacement[];
  /** Recently archived leaves, drawn resting in the pot. */
  fallen: Leaf[];
}

const POT = { width: 72, height: 56, rimWidth: 84, rimHeight: 10, bottomGap: 14 };
const T_LOW = 0.045;
const T_HIGH = 0.975;
// Spacing along the trunk is denser at both ends (the crown and the pot) and
// looser in the middle. It is monotonic, so time order still runs from the pot
// (oldest) up to the crown (newest).
const END_DENSITY = 0.45;
const spread01 = (u: number) => u - (END_DENSITY * Math.sin(2 * Math.PI * u)) / (2 * Math.PI);
const r1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** The frame for a panel of the given size: the trunk near the right edge, the crown across the top. */
export function panelFrame(m: { width: number; height: number }): TreeFrame {
  // Inset at least half the pot rim, so the pot never spills off a narrow screen.
  const trunkX = m.width - clamp(m.width * 0.1, POT.rimWidth / 2 + 6, 64);
  return {
    width: m.width,
    height: m.height,
    trunkX,
    topY: 40,
    crownTipX: Math.max(24, m.width * 0.22),
    bendY: 240,
    maxReach: clamp((trunkX - 40) * 0.6, 70, 300),
  };
}

/** A tree tall enough that its leaves have room, for a given number of notes. */
export function treeHeight(noteCount: number): number {
  return clamp(noteCount * 62 + 520, 1300, 2600);
}

/** The trunk's centre line, sampled from the pot up to the tip, with t by arc length. */
function centerline(f: TreeFrame, baseY: number): (Point & { t: number })[] {
  const wob = seeded('trunk');
  const p1 = wob.next() * Math.PI * 2;
  const p2 = wob.next() * Math.PI * 2;
  const wobble = (y: number) => {
    const fade = clamp((baseY - y) / 200, 0, 1); // straight where it leaves the pot
    return fade * (5 * Math.sin(y / 290 + p1) + 3 * Math.sin(y / 83 + p2));
  };
  const pts: Point[] = [];
  for (let y = baseY; y > f.bendY; y -= 12) pts.push({ x: f.trunkX + wobble(y), y });
  const start = { x: f.trunkX + wobble(f.bendY), y: f.bendY };
  pts.push(start);
  // The bend: a cubic from the top of the straight part to the crown tip.
  const c1 = { x: start.x, y: f.topY + (f.bendY - f.topY) * 0.15 };
  const c2 = { x: f.crownTipX + (start.x - f.crownTipX) * 0.5, y: f.topY - 4 };
  const end = { x: f.crownTipX, y: f.topY };
  for (let i = 1; i <= 80; i++) {
    const s = i / 80, u = 1 - s;
    pts.push({
      x: u * u * u * start.x + 3 * u * u * s * c1.x + 3 * u * s * s * c2.x + s * s * s * end.x,
      y: u * u * u * start.y + 3 * u * u * s * c1.y + 3 * u * s * s * c2.y + s * s * s * end.y,
    });
  }
  let total = 0;
  const lengths = pts.map((p, i) => (i === 0 ? 0 : (total += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y))));
  return pts.map((p, i) => ({ ...p, t: total ? lengths[i] / total : 0 }));
}

/** Point, unit tangent (towards the tip) and outward normal at t. */
function frameAt(line: (Point & { t: number })[], t: number) {
  let lo = 0, hi = line.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (line[mid].t <= t) lo = mid; else hi = mid;
  }
  const a = line[lo], b = line[hi];
  const s = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
  const p = { x: a.x + (b.x - a.x) * s, y: a.y + (b.y - a.y) * s };
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const tangent = { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
  // Rotating the upward tangent a quarter turn gives "outward": left on the
  // straight part, down along the crown.
  const normal = { x: tangent.y, y: -tangent.x };
  return { p, tangent, normal };
}

const trunkWidth = (t: number) => 14 - 11 * Math.pow(t, 0.9);

function trunkOutline(line: (Point & { t: number })[]): string {
  const left: string[] = [];
  const right: string[] = [];
  for (const pt of line) {
    const { normal } = frameAt(line, Math.min(pt.t, 0.9999));
    const half = trunkWidth(pt.t) / 2;
    left.push(`${r1(pt.x + normal.x * half)} ${r1(pt.y + normal.y * half)}`);
    right.push(`${r1(pt.x - normal.x * half)} ${r1(pt.y - normal.y * half)}`);
  }
  return `M${left.join('L')}L${right.reverse().join('L')}Z`;
}

const path = (s: Point, c1: Point, c2: Point, e: Point) =>
  `M${r1(s.x)} ${r1(s.y)}C${r1(c1.x)} ${r1(c1.y)} ${r1(c2.x)} ${r1(c2.y)} ${r1(e.x)} ${r1(e.y)}`;

function leafShape(leaf: Leaf, at: Point, outward: Point, extra: Partial<LeafShape>): LeafShape {
  const rnd = seeded(`leaf:${leaf.id}`);
  // Point outward with a little droop and a seeded tilt.
  const dx = outward.x, dy = outward.y + 0.55;
  const angle = (Math.atan2(dx, -dy) * 180) / Math.PI + rnd.spread(26);
  const length = (leaf.pinned ? 26 : 23) + rnd.spread(2.5);
  return {
    leaf,
    x: r1(at.x), y: r1(at.y),
    angle: r1(angle),
    length: r1(length),
    width: r1(length * (0.46 + rnd.spread(0.05))),
    skew: r1(rnd.spread(0.12) * 100) / 100,
    t: 0, depth: null, reach: 0,
    ...extra,
  };
}

export function layoutTree(input: LayoutInput): TreeGeometry {
  const f = input;
  const pot = { x: f.trunkX, y: f.height - POT.bottomGap - POT.height, width: POT.width, height: POT.height, rimWidth: POT.rimWidth, rimHeight: POT.rimHeight };
  const line = centerline(f, pot.y + 4);

  const n = input.nodes.length;
  const maxDepth = input.nodes.reduce((m, node) => Math.max(m, node.depth), 0);
  const spacing = n ? (T_HIGH - T_LOW) / n : 0;
  const tOf = (rank: number) => T_LOW + (T_HIGH - T_LOW) * spread01((rank + 0.5) / n);
  const minReach = Math.min(22, f.maxReach);

  // Place each node: t from its rank, reach from its depth, both nudged by its id.
  const placed = input.nodes.map((node) => {
    const rnd = seeded(`node:${node.item.id}`);
    const t = clamp(tOf(node.rank) + rnd.spread(0.12 * spacing * (1 - END_DENSITY)), 0.01, 0.995);
    const { p, normal } = frameAt(line, t);
    const depthShare = 1 - node.depth / (maxDepth + 1);
    let reach = (minReach + (f.maxReach - minReach) * Math.pow(depthShare, 1.1)) * (1 + rnd.spread(0.12));
    // Along the crown, outward is down: keep crown leaves above the bend.
    if (p.y < f.bendY - 1) reach = Math.max(8, Math.min(reach, f.bendY - 34 - p.y));
    const at = { x: p.x + normal.x * reach, y: p.y + normal.y * reach };
    return { node, t, p, normal, reach, at };
  });

  const branches: Branch[] = [];
  for (const b of placed) {
    const rnd = seeded(`branch:${b.node.item.id}`);
    // Thin next to the 14px trunk, thinner with depth, so even top-level links read as vines.
    const width = Math.max(0.7, 2.6 - b.node.depth * 0.45);
    if (b.node.parentRank === null) {
      // The root grows straight out of the trunk.
      const { tangent } = frameAt(line, b.t);
      const c1 = { x: b.p.x + b.normal.x * b.reach * 0.35 + tangent.x * 14, y: b.p.y + b.normal.y * b.reach * 0.35 + tangent.y * 14 };
      const c2 = { x: b.at.x - b.normal.x * b.reach * 0.2 + tangent.x * 6, y: b.at.y - b.normal.y * b.reach * 0.2 + tangent.y * 6 };
      branches.push({ d: path(b.p, c1, c2, b.at), width, depth: b.node.depth });
    } else {
      // A child branches off its parent and runs along the trunk to its own spot.
      const parent = placed[b.node.parentRank];
      const dir = Math.sign(b.t - parent.t) || 1;
      const ts = frameAt(line, parent.t).tangent;
      const te = frameAt(line, b.t).tangent;
      const len = Math.hypot(b.at.x - parent.at.x, b.at.y - parent.at.y);
      // Long links bow outward in a gentle arc, so they read as vines rather than a second trunk.
      const wob = rnd.spread(10) + Math.min(len * 0.07, 70);
      const c1 = { x: parent.at.x + ts.x * dir * len * 0.45 + parent.normal.x * wob, y: parent.at.y + ts.y * dir * len * 0.45 + parent.normal.y * wob };
      const c2 = { x: b.at.x - te.x * dir * len * 0.45 + b.normal.x * wob, y: b.at.y - te.y * dir * len * 0.45 + b.normal.y * wob };
      branches.push({ d: path(parent.at, c1, c2, b.at), width, depth: b.node.depth });
    }
  }

  const leaves: LeafShape[] = placed.map((b) =>
    leafShape(b.node.item, b.at, b.normal, { t: r1(b.t * 1000) / 1000, depth: b.node.depth, reach: r1(b.reach) }));

  for (const pin of input.pinned) {
    const { p, normal, tangent } = frameAt(line, clamp(pin.t, 0.01, 0.995));
    const at = { x: p.x + normal.x * pin.reach, y: p.y + normal.y * pin.reach };
    const c1 = { x: p.x + normal.x * pin.reach * 0.5 + tangent.x * 8, y: p.y + normal.y * pin.reach * 0.5 + tangent.y * 8 };
    branches.push({ d: path(p, c1, at, at), width: 1.6, depth: 1 });
    leaves.push(leafShape(pin.leaf, at, normal, { t: pin.t, depth: null, reach: pin.reach }));
  }

  const fallen: LeafShape[] = input.fallen.slice(0, 5).map((leaf, i) => {
    const rnd = seeded(`fallen:${leaf.id}`);
    const x = pot.x + (i - 2) * 11 + rnd.spread(4);
    const shape = leafShape(leaf, { x, y: pot.y + 3 }, { x: 0, y: -1 }, {});
    return { ...shape, angle: r1((i % 2 ? 1 : -1) * (72 + rnd.spread(14))), length: 17, width: 7.6 };
  });

  return {
    width: f.width, height: f.height,
    trunk: trunkOutline(line),
    centerline: line.map((p) => ({ x: r1(p.x), y: r1(p.y), t: Math.round(p.t * 10000) / 10000 })),
    branches, leaves, fallen, pot,
  };
}
