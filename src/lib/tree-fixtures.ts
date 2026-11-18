// Stage 2 stand-in data: deterministic sample notes so the tree can be drawn
// before the Supabase backend exists. Replaced by real data in stage 5.

import type { Leaf, LeafType } from './leaf-tree.ts';
import { mulberry32 } from './seeded.ts';

const DAY = 86_400_000;
const TYPES: LeafType[] = ['encouragement', 'fun_fact', 'other'];
const TYPE_LABEL: Record<LeafType, string> = { encouragement: 'encouragement', fun_fact: 'fun fact', other: 'note' };

/** 36 approved visitor notes (so 6 overflow into the pot) and 4 pinned leaves. */
export function sampleLeaves(): Leaf[] {
  const next = mulberry32(2026);
  const start = Date.UTC(2026, 8, 1);
  const visitors: Leaf[] = Array.from({ length: 36 }, (_, i) => {
    const type = TYPES[Math.floor(next() * TYPES.length)];
    const createdAt = start + i * 1.7 * DAY + Math.floor(next() * DAY);
    return {
      id: `sample-${String(i + 1).padStart(2, '0')}`,
      body: `Sample ${TYPE_LABEL[type]} #${i + 1}. Placeholder text until real notes arrive.`,
      type,
      name: next() < 0.5 ? `Visitor ${i + 1}` : null,
      createdAt,
      // Approvals lag submissions by up to ten days, so they arrive out of order.
      reviewedAt: createdAt + Math.floor(next() * 10 * DAY),
      pinned: false,
    };
  });
  const pinned: Leaf[] = [1, 2, 3, 4].map((n) => ({
    id: `pinned-${n}`,
    body: `Placeholder fun fact about Rohan #${n}.`,
    type: 'fun_fact',
    name: 'Rohan',
    createdAt: start,
    reviewedAt: start,
    pinned: true,
  }));
  return [...visitors, ...pinned];
}
