// Tests for the home page guestbook tree's layout.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blend, bounds, layoutTree, woodPath, type Note } from './word-tree.ts';

const notes = (texts: string[]): Note[] => texts.map((text, i) => ({ id: i + 1, text }));
const leaves = (L: ReturnType<typeof layoutTree>) => L.order.map((k) => L.nodes[k]).filter((n) => n.leafId != null);
const labels = (L: ReturnType<typeof layoutTree>) => L.order.map((k) => L.nodes[k].label).filter(Boolean);

test('every note becomes exactly one leaf', () => {
  const L = layoutTree(notes(['go badgers', 'nice work', 'hello from madison']), true);
  assert.deepEqual(leaves(L).map((n) => n.leafId).sort(), [1, 2, 3]);
});

test('notes that start with the same words share a branch labelled with those words', () => {
  const L = layoutTree(notes(['good luck this spring', 'good luck with finals', 'good luck with recruiting', 'go badgers']), true);
  assert.deepEqual(labels(L).sort(), ['good luck', 'with']);
});

test('sorting ignores capitals and extra spaces, and whole words only', () => {
  const L = layoutTree(notes(['Hello  from Madison', 'hello from chicago', 'help']), true);
  assert.deepEqual(labels(L), ['hello from']);
});

test('the same note twice gives two leaves on one branch', () => {
  const L = layoutTree(notes(['hi', 'hi']), true);
  assert.equal(leaves(L).length, 2);
  assert.deepEqual(labels(L), ['hi']);
});

test('the same notes always draw the same tree', () => {
  const texts = ['a b c', 'a b d', 'x', 'y z'];
  assert.equal(woodPath(layoutTree(notes(texts), true)), woodPath(layoutTree(notes(texts), true)));
});

test('a full tree stays inside its box and no two leaves sit on top of each other', () => {
  const words = ['hey', 'wow', 'so cool', 'love this', 'nice', 'good luck', 'this tree', 'great'];
  for (const cone of [true, false]) {
    const L = layoutTree(notes(Array.from({ length: 30 }, (_, i) => `${words[i % 8]} ${i % 4} note ${i}`)), cone);
    const b = bounds(L);
    assert.ok(b.x0 >= -20 && b.x1 <= 1060 && b.y0 >= -10, `outside the box: ${JSON.stringify(b)}`);
    const tips = leaves(L);
    for (let i = 0; i < tips.length; i++) for (let j = i + 1; j < tips.length; j++) {
      assert.ok(Math.hypot(tips[i].x - tips[j].x, tips[i].y - tips[j].y) > 20, 'two leaves overlap');
    }
    assert.ok(!woodPath(L).includes('NaN'));
  }
});

test('a tree with one note, and with none, still draws', () => {
  assert.ok(!woodPath(layoutTree(notes(['solo']), true)).includes('NaN'));
  assert.ok(woodPath(layoutTree([], true)).length > 0);
});

test('a new branch grows out of its parent while the tree rearranges', () => {
  const from = layoutTree(notes(['a b', 'c']), true);
  const to = layoutTree(notes(['a b', 'c', 'a d']), true);
  const start = blend(from, to, 0), end = blend(from, to, 1);
  assert.ok(!woodPath(blend(from, to, 0.4)).includes('NaN'));
  const added = to.order.map((k) => to.nodes[k]).find((n) => n.leafId === 3)!;
  assert.equal(start.nodes[added.key].w, 0, 'a new twig starts with no thickness');
  assert.deepEqual([end.nodes[added.key].x, end.nodes[added.key].y], [added.x, added.y]);
});
