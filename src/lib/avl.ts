// An AVL tree, written from scratch for the guestbook tree.
//
// Why a self-balancing tree: leaves are keyed by when a note was *submitted*
// (created_at), but they enter the tree when the note is *approved*, which
// happens out of order. Inserts therefore arrive unsorted, and the tree has to
// rebalance to stay shallow. The tree also has a capacity: when an insert
// pushes it past the limit, the oldest leaf (the minimum) is removed. That
// leaf is what falls into the pot.
//
// Insert and delete-min are iterative and keep an explicit root-to-node path,
// so every rotation is linked back into the tree before the next step runs.
// That makes each recorded step a consistent snapshot of the whole tree, which
// the "see how it grows" replay draws one frame at a time.
//
// No dependencies. Plain TypeScript with only erasable syntax, so Node can run
// the tests directly.

export type Compare<T> = (a: T, b: T) => number;

/** A plain, immutable copy of the tree's shape, safe to keep and draw later. */
export interface SnapshotNode<T> {
  item: T;
  height: number;
  left: SnapshotNode<T> | null;
  right: SnapshotNode<T> | null;
}

/** One node of the tree laid out in key order, with what the drawing needs. */
export interface FlatNode<T> {
  item: T;
  /** Position in key order: 0 is the oldest. */
  rank: number;
  /** Distance from the root: the root is 0. */
  depth: number;
  height: number;
  /** Rank of the parent, or null for the root. */
  parentRank: number | null;
  side: 'left' | 'right' | null;
}

export type RotationCase = 'LL' | 'RR' | 'LR' | 'RL';

/** What happened during an insert, in order, for the step-by-step replay. */
export type Step<T> =
  | { type: 'compare'; item: T; against: T; go: 'left' | 'right' }
  | { type: 'attach'; item: T; parent: T | null; side: 'left' | 'right' | null; tree: SnapshotNode<T> | null }
  | { type: 'rotate'; direction: 'left' | 'right'; pivot: T; case: RotationCase; tree: SnapshotNode<T> | null }
  | { type: 'evict'; item: T; tree: SnapshotNode<T> | null };

export interface InsertResult<T> {
  /** False when an item with an equal key is already in the tree. */
  inserted: boolean;
  /** Items removed because the insert pushed the tree past its capacity, oldest first. */
  evicted: T[];
  /** Filled only when the insert was called with { record: true }. */
  steps: Step<T>[];
}

export interface AvlOptions {
  /** Maximum number of items kept. Inserting past it evicts the minimum. Default: unlimited. */
  capacity?: number;
}

interface Node<T> {
  item: T;
  height: number;
  left: Node<T> | null;
  right: Node<T> | null;
}

/** Orders by creation time, then by id, so equal timestamps still sort deterministically. */
export function byCreatedThenId(a: { createdAt: number; id: string }, b: { createdAt: number; id: string }): number {
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

const h = <T>(n: Node<T> | null): number => (n ? n.height : 0);
const balanceOf = <T>(n: Node<T>): number => h(n.left) - h(n.right);
const refresh = <T>(n: Node<T>): void => { n.height = 1 + Math.max(h(n.left), h(n.right)); };

export class AvlTree<T> {
  private root: Node<T> | null = null;
  private count = 0;
  private readonly compare: Compare<T>;
  readonly capacity: number;

  constructor(compare: Compare<T>, options: AvlOptions = {}) {
    const capacity = options.capacity ?? Infinity;
    if (!(capacity >= 1)) throw new RangeError('capacity must be at least 1');
    this.compare = compare;
    this.capacity = capacity;
  }

  /** Builds a tree by inserting the items in the order given (for example, approval order). */
  static from<T>(items: Iterable<T>, compare: Compare<T>, options: AvlOptions = {}): AvlTree<T> {
    const tree = new AvlTree(compare, options);
    for (const item of items) tree.insert(item);
    return tree;
  }

  get size(): number { return this.count; }
  get height(): number { return h(this.root); }

  min(): T | undefined {
    let n = this.root;
    while (n && n.left) n = n.left;
    return n?.item;
  }

  max(): T | undefined {
    let n = this.root;
    while (n && n.right) n = n.right;
    return n?.item;
  }

  has(item: T): boolean {
    let n = this.root;
    while (n) {
      const c = this.compare(item, n.item);
      if (c === 0) return true;
      n = c < 0 ? n.left : n.right;
    }
    return false;
  }

  /** Items in key order, oldest first. */
  inOrder(): T[] {
    const out: T[] = [];
    const stack: Node<T>[] = [];
    let n = this.root;
    while (n || stack.length) {
      while (n) { stack.push(n); n = n.left; }
      n = stack.pop()!;
      out.push(n.item);
      n = n.right;
    }
    return out;
  }

  insert(item: T, { record = false }: { record?: boolean } = {}): InsertResult<T> {
    const steps: Step<T>[] = [];
    const path: Node<T>[] = [];
    let n = this.root;
    let side: 'left' | 'right' | null = null;

    while (n) {
      const c = this.compare(item, n.item);
      if (c === 0) return { inserted: false, evicted: [], steps };
      side = c < 0 ? 'left' : 'right';
      if (record) steps.push({ type: 'compare', item, against: n.item, go: side });
      path.push(n);
      n = c < 0 ? n.left : n.right;
    }

    const leaf: Node<T> = { item, height: 1, left: null, right: null };
    const parent = path.length ? path[path.length - 1] : null;
    if (!parent) this.root = leaf;
    else if (side === 'left') parent.left = leaf;
    else parent.right = leaf;
    this.count++;
    if (record) steps.push({ type: 'attach', item, parent: parent ? parent.item : null, side, tree: this.snapshot() });

    this.rebalancePath(path, record ? steps : null);

    const evicted: T[] = [];
    while (this.count > this.capacity) {
      const gone = this.removeMin(record ? steps : null);
      evicted.push(gone);
    }
    return { inserted: true, evicted, steps };
  }

  /** Removes and returns the oldest item, or undefined when the tree is empty. */
  deleteMin(): T | undefined {
    return this.root ? this.removeMin(null) : undefined;
  }

  snapshot(): SnapshotNode<T> | null {
    const copy = (n: Node<T> | null): SnapshotNode<T> | null =>
      n ? { item: n.item, height: n.height, left: copy(n.left), right: copy(n.right) } : null;
    return copy(this.root);
  }

  /** The tree in key order with depth and parent links: the input to the layout. */
  flatten(): FlatNode<T>[] {
    return flatten(this.snapshot());
  }

  /**
   * Checks every AVL invariant and returns a list of problems (empty when the
   * tree is valid): strict key order, stored heights, balance factors within
   * one, the item count, and the capacity.
   */
  validate(): string[] {
    const problems: string[] = [];
    let seen = 0;
    let previous: { item: T } | null = null;
    const walk = (n: Node<T> | null): number => {
      if (!n) return 0;
      const lh = walk(n.left);
      seen++;
      if (previous && this.compare(previous.item, n.item) >= 0) problems.push('keys out of order');
      previous = { item: n.item };
      const rh = walk(n.right);
      const expected = 1 + Math.max(lh, rh);
      if (n.height !== expected) problems.push(`stored height ${n.height}, actual ${expected}`);
      if (Math.abs(lh - rh) > 1) problems.push(`balance factor ${lh - rh}`);
      return expected;
    };
    walk(this.root);
    if (seen !== this.count) problems.push(`size ${this.count}, counted ${seen}`);
    if (this.count > this.capacity) problems.push(`size ${this.count} over capacity ${this.capacity}`);
    return problems;
  }

  // Removes the leftmost node, then rebalances the path back up to the root.
  private removeMin(steps: Step<T>[] | null): T {
    const path: Node<T>[] = [];
    let n = this.root!;
    while (n.left) { path.push(n); n = n.left; }
    const parent = path.length ? path[path.length - 1] : null;
    if (parent) parent.left = n.right;
    else this.root = n.right;
    this.count--;
    if (steps) steps.push({ type: 'evict', item: n.item, tree: this.snapshot() });
    this.rebalancePath(path, steps);
    return n.item;
  }

  // Walks from the deepest node on the path back to the root, refreshing
  // heights and rotating any node whose children differ in height by two.
  private rebalancePath(path: Node<T>[], steps: Step<T>[] | null): void {
    for (let i = path.length - 1; i >= 0; i--) {
      const node = path[i];
      refresh(node);
      const bf = balanceOf(node);
      if (bf > 1) {
        // Left-heavy. A right-leaning left child needs a double rotation.
        const kind: RotationCase = balanceOf(node.left!) < 0 ? 'LR' : 'LL';
        if (kind === 'LR') {
          const pivot = node.left!;
          node.left = this.rotateLeft(pivot);
          if (steps) steps.push({ type: 'rotate', direction: 'left', pivot: pivot.item, case: kind, tree: this.snapshot() });
        }
        this.link(path, i, this.rotateRight(node));
        if (steps) steps.push({ type: 'rotate', direction: 'right', pivot: node.item, case: kind, tree: this.snapshot() });
      } else if (bf < -1) {
        // Right-heavy. A left-leaning right child needs a double rotation.
        const kind: RotationCase = balanceOf(node.right!) > 0 ? 'RL' : 'RR';
        if (kind === 'RL') {
          const pivot = node.right!;
          node.right = this.rotateRight(pivot);
          if (steps) steps.push({ type: 'rotate', direction: 'right', pivot: pivot.item, case: kind, tree: this.snapshot() });
        }
        this.link(path, i, this.rotateLeft(node));
        if (steps) steps.push({ type: 'rotate', direction: 'left', pivot: node.item, case: kind, tree: this.snapshot() });
      }
    }
  }

  // Points the parent of path[i] (or the root) at a subtree's new top node.
  private link(path: Node<T>[], i: number, top: Node<T>): void {
    const old = path[i];
    if (i === 0) this.root = top;
    else if (path[i - 1].left === old) path[i - 1].left = top;
    else path[i - 1].right = top;
    path[i] = top;
  }

  private rotateRight(y: Node<T>): Node<T> {
    const x = y.left!;
    y.left = x.right;
    x.right = y;
    refresh(y);
    refresh(x);
    return x;
  }

  private rotateLeft(x: Node<T>): Node<T> {
    const y = x.right!;
    x.right = y.left;
    y.left = x;
    refresh(x);
    refresh(y);
    return y;
  }
}

/** Lays a snapshot out in key order with rank, depth and parent rank. */
export function flatten<T>(root: SnapshotNode<T> | null): FlatNode<T>[] {
  const out: FlatNode<T>[] = [];
  // First pass: in-order ranks. Second pass: fill in depth and parent links.
  const rankOf = new Map<SnapshotNode<T>, number>();
  const order = (n: SnapshotNode<T> | null): void => {
    if (!n) return;
    order(n.left);
    rankOf.set(n, rankOf.size);
    order(n.right);
  };
  order(root);
  const visit = (n: SnapshotNode<T> | null, depth: number, parent: SnapshotNode<T> | null, side: 'left' | 'right' | null): void => {
    if (!n) return;
    out[rankOf.get(n)!] = {
      item: n.item,
      rank: rankOf.get(n)!,
      depth,
      height: n.height,
      parentRank: parent ? rankOf.get(parent)! : null,
      side,
    };
    visit(n.left, depth + 1, n, 'left');
    visit(n.right, depth + 1, n, 'right');
  };
  visit(root, 0, null, null);
  return out;
}
