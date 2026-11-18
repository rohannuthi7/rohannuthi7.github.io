---
title: Guestbook tree
tagline: Visitors' notes grow as leaves on a tree whose shape comes from a self-balancing binary search tree I wrote from scratch.
summary: >-
  A guestbook drawn as a tree. Each note is a node in an AVL tree I built from scratch,
  and its place in time and depth in the tree decide where its leaf grows.
role: Design and engineering
team: "Solo"
dates: { start: "2026-11", end: ongoing }
status: In progress
repo: https://github.com/rohannuthi7/Personal-Portfolio-Website
private: false
stack: [TypeScript, Astro, SVG]
cover: { src: ./page.webp, alt: "The guestbook page: an intro and a plaque on the left, the tree with its crown and amber scroll glow on the right" }
stats:
  - { label: Data structure, value: "AVL tree, from scratch", accent: true }
  - { label: Capacity, value: "Newest 30 notes" }
  - { label: Unit tests, value: "29" }
frames:
  - { src: ./page.webp, alt: "The guestbook page: an intro and a plaque on the left, the tree with its crown and amber scroll glow on the right" }
  - { src: ./pot.webp, alt: "The pot at the foot of the trunk, under the amber scroll glow, holding leaves that fell off the tree" }
  - { src: ./phone.webp, alt: "The guestbook tree on a phone, with the scroll glow on the trunk" }
collage:
  - { src: ./page.webp, alt: "The guestbook page with the tree's crown and scroll glow" }
  - { src: ./note-card.webp, alt: "A note's card open beside its leaf" }
  - { src: ./light-glow.webp, alt: "The light theme, where the scroll glow marks the trunk with a short amber band" }
  - { src: ./pot.webp, alt: "The pot at the foot of the trunk, holding leaves that fell off the tree" }
order: 5
draft: true
---

## Overview

A guestbook for this site, drawn as a tree. Visitors leave a short note, and once I've read it, it grows as a leaf. Hover or tap a leaf to read it. [Visit the guestbook](/guestbook).

The shape isn't decoration. Every note is a node in an AVL tree I wrote from scratch, and the drawing is a direct mapping of that tree: a note's place in time sets its height on the trunk, and its depth in the tree sets how far its branch reaches. The front end is built and tested. The backend that stores and moderates real notes is next, so the page shows sample notes for now.

## Technical details

**The data structure.** Notes are keyed by when they were written, but they join the tree when I approve them, which happens out of order, so the tree rebalances as they arrive. It holds the newest 30. When an insert pushes it past that, it deletes the minimum, and that leaf falls into the pot. Insert and delete-min are iterative and keep an explicit root-to-node path, so every rotation is linked back into the tree before the next step runs. That makes each recorded step a consistent snapshot of the whole tree, which is what a step-by-step replay needs. Replaying every approval in order rebuilds the exact same tree on every load.

**From tree to drawing.** The layout is a pure function from the flattened tree to geometry: in-order rank becomes a position along the trunk, depth becomes reach and thickness, and parent-to-child links become curved branches. Every wobble and tilt comes from a small PRNG seeded with the note's id, so the tree looks hand-drawn but renders identically everywhere. The SVG is built once and rebuilt only when the page's size changes.

**Scrolling.** A soft amber glow follows the middle of the viewport along the trunk, and leaves near it brighten. One scroll handler, throttled to the frame rate, finds nearby leaves with a binary search, moves one element and toggles classes only on the leaves whose state changed. It reads no layout.

**Testing.** 29 unit tests run on Node's built-in test runner with no dependencies. They cover all four rotation cases, randomized insert and delete sequences checked against a sorted array after every operation, the capacity rule, snapshot consistency, the layout's guarantees, and a card-placement function that must keep every card on screen at phone size. To check that the tests can actually fail, I planted three bugs in the AVL module, and the suite caught all three.

## Design decisions

**Is an AVL tree necessary here?** Honestly, no. At 30 notes a sorted list would work. I built the AVL tree to show one working end to end with real tests, and it holds up unchanged if the limit grows. The plaque on the page says so.

**Its own page, not the homepage.** I first built it as a background behind the whole homepage. It looked calm on wide screens, but it competed with the hero, and on laptop widths it was squeezed into a narrow margin. On its own page it has room to read clearly, and the homepage stays focused.

**Measured, then fixed.** I compared scrolling with and without the tree. The only real cost was the leaves' idle sway, because rotating SVG elements forces a layout on every frame. The sway now pauses while the page scrolls and resumes a moment after, which cut the tree's added layout time during scrolling by about three-quarters.

**Notes are untrusted input.** Note text is always inserted as plain text, never as HTML, so a note can't inject markup into the page.

## Future upgrades

- **The backend:** a Postgres table on Supabase with row-level security so the public can only read approved notes, plus edge functions to submit a note (with validation, a honeypot and rate limiting), to approve or reject one, and to check a note's status.
- **Adding a leaf:** a short form at the pot, with the visitor's own pending note shown only to them as a bud until it's approved.
- **The archive and the replay:** older notes browsable from the pot, and a "see how it grows" view that morphs the tree into its node-link diagram and replays the latest insertion, rotations included.
- **Accessibility:** keyboard focus on every leaf, and notes readable by screen readers.
