// Settings and copy for the guestbook page (/guestbook). Edit these; the page
// and the tree layout read them.

export const treeConfig = {
  /** How many of the newest approved visitor notes stay on the tree. */
  capacity: 30,
  /**
   * Where Rohan's pinned leaves sit, in order of the pinned notes.
   * `t` is the position along the trunk: 0 is the pot, 1 is the tip of the
   * crown. `reach` is how far the twig extends, in px.
   */
  pinnedSpots: [
    { t: 0.993, reach: 26 },
    { t: 0.955, reach: 44 },
    { t: 0.6, reach: 40 },
    { t: 0.2, reach: 46 },
  ],
  /** True while the tree shows stand-in notes, before the backend is connected. */
  sampleData: true,
  /** The plaque: how the tree was built. Edit freely. */
  plaque: [
    'This tree is a self-balancing binary search tree (an AVL tree) that I wrote from scratch. Notes are keyed by when they were written, but they join the tree when I approve them, so they arrive out of order and the tree rebalances as they do.',
    'It keeps the newest 30. When a new note pushes it past that, the oldest one falls into the pot. A note’s place in time sets its height on the trunk, and its depth in the tree sets how far its branch reaches.',
    'At 30 notes a sorted list would work too. I built the AVL tree to show one working end to end, with tests, and it holds up unchanged if the limit grows.',
  ],
} as const;
