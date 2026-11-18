// Seeded randomness for the guestbook tree. Every wobble and tilt is derived
// from a note's id, so the tree looks organic but renders identically on every
// load and every machine.

/** FNV-1a: a fast 32-bit hash of a string. */
export function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: a tiny PRNG returning floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A random source seeded from a string, with a helper for symmetric ranges. */
export function seeded(key: string) {
  const next = mulberry32(hashString(key));
  return {
    next,
    /** A value in [-amount, amount]. */
    spread: (amount: number) => (next() * 2 - 1) * amount,
  };
}
