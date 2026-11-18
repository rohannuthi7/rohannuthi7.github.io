// Turns approved notes into the guestbook tree.
//
// Notes are keyed by when they were submitted (createdAt) but arrive in the
// order they were approved (reviewedAt), which is why the AVL tree has to
// rebalance. Replaying every approval in order rebuilds the exact same tree on
// every load. Fetching lives elsewhere (stage 5): this module only needs the
// list, so swapping the full replay for a cached snapshot later only changes
// where the list comes from.

import { AvlTree, byCreatedThenId } from './avl.ts';

export type LeafType = 'encouragement' | 'fun_fact' | 'other';

export interface Leaf {
  id: string;
  body: string;
  type: LeafType;
  name: string | null;
  /** Submission time, ms since epoch. The tree's key. */
  createdAt: number;
  /** Approval time, ms since epoch. The order notes enter the tree. */
  reviewedAt: number;
  /** Rohan's own leaves: never in the AVL tree, never evicted. */
  pinned: boolean;
}

export interface LeafTree {
  tree: AvlTree<Leaf>;
  /** Approved notes that fell off the tree into the pot, newest first. */
  archive: Leaf[];
  pinned: Leaf[];
}

export const DEFAULT_CAPACITY = 30;

const byApproval = (a: Leaf, b: Leaf) => a.reviewedAt - b.reviewedAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export function buildLeafTree(approved: Leaf[], capacity = DEFAULT_CAPACITY): LeafTree {
  const tree = new AvlTree<Leaf>(byCreatedThenId, { capacity });
  const archive: Leaf[] = [];
  const visitors = approved.filter((l) => !l.pinned).sort(byApproval);
  for (const leaf of visitors) archive.push(...tree.insert(leaf).evicted);
  archive.sort((a, b) => byCreatedThenId(b, a));
  return { tree, archive, pinned: approved.filter((l) => l.pinned) };
}
