import { describe, it, expect } from 'vitest';
import { sessionSeconds, formatClock, DEFAULT_SECONDS_PER_QUESTION } from './timer';

describe('sessionSeconds', () => {
  it('multiplies the per-question pace by the question count', () => {
    expect(sessionSeconds(100, 55)).toBe(5500);
    expect(sessionSeconds(63, 35)).toBe(2205);
    expect(sessionSeconds(120, 4)).toBe(480);
  });

  it('falls back to the default pace when unset or non-positive', () => {
    expect(sessionSeconds(undefined, 10)).toBe(DEFAULT_SECONDS_PER_QUESTION * 10);
    expect(sessionSeconds(0, 10)).toBe(DEFAULT_SECONDS_PER_QUESTION * 10);
    expect(sessionSeconds(-5, 10)).toBe(DEFAULT_SECONDS_PER_QUESTION * 10);
  });

  it('is zero for an empty session', () => {
    expect(sessionSeconds(100, 0)).toBe(0);
  });
});

describe('formatClock', () => {
  it('formats sub-hour durations as M:SS', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(9)).toBe('0:09');
    expect(formatClock(75)).toBe('1:15');
    expect(formatClock(600)).toBe('10:00');
  });

  it('formats hour-plus durations as H:MM:SS', () => {
    expect(formatClock(3600)).toBe('1:00:00');
    expect(formatClock(5500)).toBe('1:31:40');
  });

  it('never goes negative', () => {
    expect(formatClock(-10)).toBe('0:00');
  });
});
