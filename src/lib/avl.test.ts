// Unit tests for the AVL tree. Run with `npm test` (Node's built-in runner;
// Node 24 runs TypeScript directly, so there are no test dependencies).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AvlTree, byCreatedThenId, flatten, type SnapshotNode, type Step } from './avl.ts';

const num = (a: number, b: number) => a - b;
const sorted = (xs: number[]) => [...xs].sort(num);

// Small seeded PRNG (mulberry32) so every random test is reproducible.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shapeOf<T>(n: SnapshotNode<T> | null): unknown {
  return n ? [n.item, shapeOf(n.left), shapeOf(n.right)] : null;
}

const assertValid = <T>(tree: AvlTree<T>, context = '') =>
  assert.deepEqual(tree.validate(), [], `invariants broken ${context}`);

test('an empty tree is valid and has no minimum', () => {
  const tree = new AvlTree(num);
  assert.equal(tree.size, 0);
  assert.equal(tree.height, 0);
  assert.equal(tree.min(), undefined);
  assert.equal(tree.deleteMin(), undefined);
  assert.deepEqual(tree.inOrder(), []);
  assert.deepEqual(tree.flatten(), []);
  assertValid(tree);
});

test('insert keeps keys in order and the tree balanced', () => {
  const tree = new AvlTree(num);
  for (let i = 1; i <= 1000; i++) tree.insert(i); // ascending input: worst case for a plain BST
  assertValid(tree);
  assert.equal(tree.size, 1000);
  assert.deepEqual(tree.inOrder(), Array.from({ length: 1000 }, (_, i) => i + 1));
  // AVL height bound: h < 1.4405 * log2(n + 2) - 0.3277
  assert.ok(tree.height <= Math.floor(1.4405 * Math.log2(1002) - 0.3277), `height ${tree.height} too tall`);
  assert.equal(tree.min(), 1);
  assert.equal(tree.max(), 1000);
  assert.ok(tree.has(500));
  assert.ok(!tree.has(1001));
});

for (const [name, order, rotations] of [
  ['LL', [3, 2, 1], ['right']],
  ['RR', [1, 2, 3], ['left']],
  ['LR', [3, 1, 2], ['left', 'right']],
  ['RL', [1, 3, 2], ['right', 'left']],
] as const) {
  test(`${name} case rotates into a balanced tree rooted at 2`, () => {
    const tree = new AvlTree(num);
    tree.insert(order[0]);
    tree.insert(order[1]);
    const { steps } = tree.insert(order[2], { record: true });
    const rotates = steps.filter((s) => s.type === 'rotate');
    assert.deepEqual(rotates.map((s) => s.direction), [...rotations]);
    assert.ok(rotates.every((s) => s.case === name));
    assert.deepEqual(shapeOf(tree.snapshot()), [2, [1, null, null], [3, null, null]]);
    assertValid(tree);
  });
}

test('a duplicate key is ignored', () => {
  const tree = AvlTree.from([5, 3, 8], num);
  const result = tree.insert(3);
  assert.equal(result.inserted, false);
  assert.equal(tree.size, 3);
  assertValid(tree);
});

test('notes with the same timestamp are ordered by id', () => {
  const t = 1_700_000_000_000;
  const notes = [
    { id: 'c', createdAt: t },
    { id: 'a', createdAt: t },
    { id: 'b', createdAt: t + 1 },
    { id: 'b', createdAt: t },
  ];
  const tree = AvlTree.from(notes, byCreatedThenId);
  assert.deepEqual(tree.inOrder().map((n) => `${n.createdAt - t}${n.id}`), ['0a', '0b', '0c', '1b']);
  assert.equal(tree.insert({ id: 'a', createdAt: t }).inserted, false);
  assertValid(tree);
});

test('deleteMin removes items oldest first and stays balanced', () => {
  const next = rng(7);
  const keys = Array.from({ length: 200 }, () => Math.floor(next() * 1e6));
  const tree = AvlTree.from(keys, num);
  const expected = [...new Set(sorted(keys))];
  for (const key of expected) {
    assert.equal(tree.deleteMin(), key);
    assertValid(tree, `after removing ${key}`);
  }
  assert.equal(tree.size, 0);
  assert.equal(tree.deleteMin(), undefined);
});

test('capacity evicts the oldest leaf', () => {
  const tree = new AvlTree(num, { capacity: 5 });
  const evicted: number[] = [];
  for (let i = 1; i <= 10; i++) evicted.push(...tree.insert(i).evicted);
  assert.deepEqual(evicted, [1, 2, 3, 4, 5]);
  assert.deepEqual(tree.inOrder(), [6, 7, 8, 9, 10]);
  assertValid(tree);
});

test('an old note approved late is inserted, then falls straight into the pot', () => {
  const tree = AvlTree.from([10, 20, 30], num, { capacity: 3 });
  const result = tree.insert(5, { record: true });
  assert.equal(result.inserted, true);
  assert.deepEqual(result.evicted, [5]);
  assert.deepEqual(tree.inOrder(), [10, 20, 30]);
  const types = result.steps.map((s) => s.type);
  assert.deepEqual(types.slice(0, 2), ['compare', 'compare']);
  assert.ok(types.indexOf('attach') < types.indexOf('evict'));
  assertValid(tree);
});

test('capacity must be at least one', () => {
  assert.throws(() => new AvlTree(num, { capacity: 0 }), RangeError);
});

test('random insert and delete-min sequences keep every invariant (property test)', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const next = rng(seed);
    const tree = new AvlTree(num);
    const model: number[] = []; // a sorted array as the reference implementation
    const ops = 50 + Math.floor(next() * 250);
    for (let op = 0; op < ops; op++) {
      if (next() < 0.7) {
        const key = Math.floor(next() * 500);
        const { inserted } = tree.insert(key);
        const present = model.includes(key);
        assert.equal(inserted, !present, `seed ${seed} op ${op}: insert ${key}`);
        if (!present) { model.push(key); model.sort(num); }
      } else {
        assert.equal(tree.deleteMin(), model.shift(), `seed ${seed} op ${op}: deleteMin`);
      }
      assertValid(tree, `seed ${seed} op ${op}`);
      assert.equal(tree.size, model.length);
    }
    assert.deepEqual(tree.inOrder(), model, `seed ${seed}: in-order traversal`);
  }
});

test('with a capacity, the tree always holds the newest N keys inserted so far', () => {
  for (let seed = 1; seed <= 100; seed++) {
    const next = rng(seed * 31);
    const capacity = 1 + Math.floor(next() * 40);
    const tree = new AvlTree(num, { capacity });
    const seen = new Set<number>();
    for (let i = 0; i < 300; i++) {
      const key = Math.floor(next() * 2000);
      tree.insert(key);
      seen.add(key);
      const newest = sorted([...seen]).slice(-capacity);
      assert.deepEqual(tree.inOrder(), newest, `seed ${seed} insert ${i}`);
      assertValid(tree, `seed ${seed} insert ${i}`);
    }
  }
});

test('recorded steps are whole-tree snapshots that end at the final tree', () => {
  for (let seed = 1; seed <= 50; seed++) {
    const next = rng(seed * 97);
    const tree = new AvlTree(num, { capacity: 30 });
    for (let i = 0; i < 60; i++) tree.insert(Math.floor(next() * 10_000));
    const { steps } = tree.insert(Math.floor(next() * 10_000), { record: true });
    const frames = steps.filter((s): s is Exclude<Step<number>, { type: 'compare' }> => s.type !== 'compare');
    if (frames.length === 0) continue; // the key was a duplicate
    for (const frame of frames) {
      const keys = flatten(frame.tree).map((n) => n.item);
      assert.deepEqual(keys, sorted(keys), `seed ${seed}: a snapshot is out of key order`);
    }
    assert.deepEqual(shapeOf(frames[frames.length - 1].tree), shapeOf(tree.snapshot()), `seed ${seed}: last frame differs`);
  }
});

test('flatten gives each node its rank, depth and parent', () => {
  const tree = AvlTree.from([4, 2, 6, 1, 3, 5, 7], num);
  const flat = tree.flatten();
  assert.deepEqual(flat.map((n) => n.item), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(flat.map((n) => n.rank), [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual(flat.map((n) => n.depth), [2, 1, 2, 0, 2, 1, 2]);
  assert.deepEqual(flat.map((n) => n.parentRank), [1, 3, 1, null, 5, 3, 5]);
  assert.deepEqual(flat.map((n) => n.side), ['left', 'left', 'right', null, 'left', 'right', 'right']);
});

test('the same insertion order always builds the same shape', () => {
  const next = rng(42);
  const keys = Array.from({ length: 300 }, () => Math.floor(next() * 1e5));
  const a = AvlTree.from(keys, num, { capacity: 30 });
  const b = AvlTree.from(keys, num, { capacity: 30 });
  assert.deepEqual(shapeOf(a.snapshot()), shapeOf(b.snapshot()));
});
