// Tests for the tree layout: the mapping from the AVL tree to the guestbook panel.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLeafTree } from './leaf-tree.ts';
import { sampleLeaves } from './tree-fixtures.ts';
import { layoutTree, panelFrame, treeHeight, type TreeFrame } from './tree-layout.ts';
import { treeConfig } from '../data/tree.ts';

const data = buildLeafTree(sampleLeaves(), treeConfig.capacity);
const panel = (width: number) => panelFrame({ width, height: treeHeight(data.tree.size) });

function build(frame: TreeFrame) {
  const pinned = data.pinned.map((leaf, i) => ({ leaf, ...treeConfig.pinnedSpots[i] }));
  return layoutTree({ ...frame, nodes: data.tree.flatten(), pinned, fallen: data.archive.slice(0, 5) });
}

test('the sample data fills the tree to capacity and overflows into the pot', () => {
  assert.equal(data.tree.size, treeConfig.capacity);
  assert.equal(data.archive.length, 36 - treeConfig.capacity);
  assert.equal(data.pinned.length, 4);
  // The archive holds the oldest notes, newest of them first.
  const archived = data.archive.map((l) => l.createdAt);
  assert.deepEqual(archived, [...archived].sort((a, b) => b - a));
  assert.ok(Math.max(...archived) < data.tree.min()!.createdAt);
});

test('the same input renders the same tree every time', () => {
  assert.deepEqual(build(panel(600)), build(panel(600)));
});

test('time order runs up the trunk: older notes sit lower along it', () => {
  const visitors = build(panel(600)).leaves.filter((l) => !l.leaf.pinned);
  for (let i = 1; i < visitors.length; i++) {
    assert.ok(visitors[i].t > visitors[i - 1].t, `leaf ${i} is not above leaf ${i - 1}`);
    assert.ok(visitors[i].leaf.createdAt > visitors[i - 1].leaf.createdAt);
  }
});

test('deeper nodes reach a shorter way out from the trunk on average', () => {
  const frame = panel(600);
  const byDepth = new Map<number, number[]>();
  for (const l of build(frame).leaves) {
    if (l.depth === null || l.y < frame.bendY) continue; // crown reach is capped separately
    byDepth.set(l.depth, [...(byDepth.get(l.depth) ?? []), l.reach]);
  }
  const avg = [...byDepth.entries()].sort((a, b) => a[0] - b[0]).map(([, r]) => r.reduce((s, x) => s + x, 0) / r.length);
  for (let i = 1; i < avg.length; i++) assert.ok(avg[i] < avg[i - 1], `depth ${i} reaches as far as depth ${i - 1}`);
});

test('the crown carries the newest leaves and keeps them above the bend', () => {
  const frame = panel(600);
  const g = build(frame);
  // Crown leaves are the ones attached past the point where the trunk starts to bend.
  const bendT = g.centerline.find((p) => p.y <= frame.bendY)!.t;
  const crown = g.leaves.filter((l) => l.t > bendT);
  assert.ok(crown.length >= 4, `only ${crown.length} leaves in the crown`);
  // They hang down from the bend; leaves right where it starts sit on the trunk, so allow a few px.
  for (const l of crown) assert.ok(l.y < frame.bendY + 8, `${l.leaf.id} hangs below the bend at y=${l.y}`);
});

test('everything stays inside the panel at phone and desktop widths, with the pot at the bottom', () => {
  for (const width of [320, 390, 600, 760]) {
    const frame = panel(width);
    const g = build(frame);
    for (const l of [...g.leaves, ...g.fallen]) {
      assert.ok(l.x >= 0 && l.x <= width && l.y >= 0 && l.y <= frame.height, `${l.leaf.id} outside the panel at width ${width}`);
    }
    assert.ok(g.pot.y + g.pot.height <= frame.height && g.pot.x + g.pot.rimWidth / 2 <= width);
  }
});

test('the tree grows taller with more notes, within limits', () => {
  assert.equal(treeHeight(0), 1300);
  assert.ok(treeHeight(30) > treeHeight(10));
  assert.equal(treeHeight(500), 2600);
});

test('an empty tree still draws the trunk and pot', () => {
  const g = layoutTree({ ...panel(600), nodes: [], pinned: [], fallen: [] });
  assert.equal(g.leaves.length, 0);
  assert.equal(g.branches.length, 0);
  assert.ok(g.trunk.startsWith('M') && g.pot.width > 0);
});
