// Fisher-Yates shuffle. The RNG is injectable so tests can seed it and prove the
// output is positionally uniform; production uses Math.random.

export type Rng = () => number;

/**
 * Returns a new array with the items in a uniformly random order.
 * Does not mutate the input. Every permutation is equally likely when the RNG
 * is uniform on [0, 1).
 */
export function fisherYatesShuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

/**
 * mulberry32: a small, fast, deterministic PRNG. Used by tests to make the
 * randomness proof reproducible (no flaky assertions), never in production.
 */
export function mulberry32(seed: number): Rng {
  let s = seed >>> 0;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
