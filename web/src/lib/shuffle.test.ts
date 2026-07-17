import { describe, it, expect } from 'vitest';
import { fisherYatesShuffle, mulberry32 } from './shuffle';

describe('fisherYatesShuffle', () => {
  it('preserves every element exactly once (no loss, no duplication)', () => {
    const input = ['o1', 'o2', 'o3', 'o4', 'o5'];
    const out = fisherYatesShuffle(input, mulberry32(1));
    expect([...out].sort()).toEqual([...input].sort());
    expect(out).toHaveLength(input.length);
  });

  it('does not mutate the input array', () => {
    const input = ['o1', 'o2', 'o3', 'o4'];
    const copy = [...input];
    fisherYatesShuffle(input, mulberry32(42));
    expect(input).toEqual(copy);
  });

  it('actually reorders (is not the identity for most seeds)', () => {
    const input = ['o1', 'o2', 'o3', 'o4'];
    let reordered = 0;
    for (let seed = 0; seed < 100; seed++) {
      const out = fisherYatesShuffle(input, mulberry32(seed));
      if (out.join(',') !== input.join(',')) reordered += 1;
    }
    // With 4! = 24 permutations, the identity should be rare across 100 seeds.
    expect(reordered).toBeGreaterThan(90);
  });

  // The load-bearing property: the correct answer must not sit in a fixed
  // position. Over many shuffles its index should be close to uniform across all
  // four option slots. Seeded RNG keeps this deterministic, so it is a real
  // proof rather than a flaky sample.
  it('places the correct answer uniformly across positions', () => {
    const options = ['correct', 'o2', 'o3', 'o4'];
    const N = 40000;
    const rng = mulberry32(12345);
    const counts = [0, 0, 0, 0];

    for (let i = 0; i < N; i++) {
      const out = fisherYatesShuffle(options, rng);
      counts[out.indexOf('correct')] += 1;
    }

    const expected = N / options.length; // 10000 per slot
    for (const c of counts) {
      // Within 5% of the uniform expectation for every slot.
      expect(Math.abs(c - expected) / expected).toBeLessThan(0.05);
    }

    // Chi-square goodness-of-fit against uniform; for 3 dof the 0.001
    // critical value is ~16.27, so a fair shuffle comfortably passes.
    const chiSquare = counts.reduce((acc, c) => acc + (c - expected) ** 2 / expected, 0);
    expect(chiSquare).toBeLessThan(16.27);
  });

  it('spreads the correct answer across positions for real seed questions too', () => {
    // Simulate re-rendering many distinct questions; the correct option id should
    // land in every slot, proving position is never a tell across the bank.
    const rng = mulberry32(777);
    const positionsSeen = new Set<number>();
    for (let q = 0; q < 200; q++) {
      const opts = ['o1', 'o2', 'o3', 'o4'];
      const out = fisherYatesShuffle(opts, rng);
      positionsSeen.add(out.indexOf('o1'));
    }
    expect(positionsSeen).toEqual(new Set([0, 1, 2, 3]));
  });
});
