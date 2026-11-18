// Tests for the scroll glow and note card helpers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { placeCard, rangeByY, trunkXAt } from './tree-scroll.ts';

// A trunk that leans 1px left for every 10px it rises, from y=1000 to y=0.
const line = Array.from({ length: 101 }, (_, i) => ({ x: 500 - i, y: 1000 - i * 10 }));

test('the glow finds the trunk at any height, interpolating between samples', () => {
  assert.equal(trunkXAt(line, 1000), 500);
  assert.equal(trunkXAt(line, 0), 400);
  assert.equal(trunkXAt(line, 505), 450.5); // 49.5 samples up: x = 500 - 49.5
  assert.equal(trunkXAt(line, 5000), 500, 'below the pot it stays at the base');
  assert.equal(trunkXAt(line, -50), 400, 'above the tip it stays at the tip');
  assert.equal(trunkXAt([], 10), 0);
});

test('rangeByY returns exactly the items inside the band', () => {
  const ys = [10, 20, 20, 35, 50, 80];
  assert.deepEqual(rangeByY(ys, 20, 50), [1, 5]);
  assert.deepEqual(rangeByY(ys, 0, 5), [0, 0]);
  assert.deepEqual(rangeByY(ys, 81, 90), [6, 6]);
  assert.deepEqual(rangeByY(ys, 0, 100), [0, 6]);
});

test('a card prefers the left of the leaf', () => {
  const p = placeCard({ left: 1400, top: 400, right: 1420, bottom: 420 }, { width: 260, height: 100 }, { width: 1500, height: 900 });
  assert.deepEqual(p, { left: 1130, top: 360 });
});

test('a card always fits inside the viewport', () => {
  const view = { width: 390, height: 844 };
  const card = { width: 260, height: 140 };
  for (let x = 0; x <= 390; x += 13) {
    for (let y = -40; y <= 900; y += 37) {
      const p = placeCard({ left: x, top: y, right: x + 12, bottom: y + 12 }, card, view);
      assert.ok(p.left >= 8 && p.left + card.width <= view.width - 8, `x off screen for leaf at ${x},${y}`);
      assert.ok(p.top >= 8 && p.top + card.height <= view.height - 8, `y off screen for leaf at ${x},${y}`);
    }
  }
});
