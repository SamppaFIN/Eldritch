import { describe, expect, it } from 'vitest';
import { LEVELS, MAX_LEVEL } from './constants.js';
import { levelForXp, levelName, levelState, xpForLevel } from './level.js';

describe('levelForXp', () => {
  it.each(LEVELS)('hits milestone $name exactly at $xp xp', ({ level, xp }) => {
    expect(levelForXp(xp)).toBe(level);
  });

  it('starts at 1', () => {
    expect(levelForXp(0)).toBe(1);
  });

  it('interpolates between milestones', () => {
    // Half way from 1 (0 xp) to 5 (500 xp) is level 3.
    expect(levelForXp(250)).toBe(3);
    // Half way from 10 (1500) to 15 (3000) is level 12.
    expect(levelForXp(2250)).toBe(12);
  });

  it('never goes backwards as xp rises', () => {
    let previous = 0;
    for (let xp = 0; xp <= 6000; xp += 25) {
      const level = levelForXp(xp);
      expect(level).toBeGreaterThanOrEqual(previous);
      previous = level;
    }
  });
});

describe('level cap — v2 reached 118 and corrupted the save', () => {
  it('caps at MAX_LEVEL', () => {
    expect(levelForXp(5_000)).toBe(MAX_LEVEL);
    expect(levelForXp(50_000)).toBe(MAX_LEVEL);
    expect(levelForXp(Number.MAX_SAFE_INTEGER)).toBe(MAX_LEVEL);
  });

  it('never produces the level v2 produced', () => {
    for (const xp of [11_800, 118_000, 1_180_000]) {
      expect(levelForXp(xp)).toBe(MAX_LEVEL);
      expect(levelForXp(xp)).toBeLessThan(118);
    }
  });

  it('falls to the floor on junk input, never to the ceiling', () => {
    // Corrupt XP must not be read as "very high". Trusting a garbage value upward
    // is exactly how v2 handed someone level 118 and then stopped their story.
    expect(levelForXp(Number.NaN)).toBe(1);
    expect(levelForXp(-500)).toBe(1);
    expect(levelForXp(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe('levelName', () => {
  it('names the milestones', () => {
    expect(levelName(1)).toBe('Dormant');
    expect(levelName(5)).toBe('Awakening');
    expect(levelName(20)).toBe('Transcendent');
  });

  it('keeps the last milestone reached between them', () => {
    expect(levelName(3)).toBe('Dormant');
    expect(levelName(9)).toBe('Awakening');
    expect(levelName(19)).toBe('Enlightened');
  });
});

describe('xpForLevel', () => {
  it.each(LEVELS)('inverts milestone $name', ({ level, xp }) => {
    expect(xpForLevel(level)).toBe(xp);
  });

  it('round-trips through levelForXp', () => {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      expect(levelForXp(xpForLevel(level))).toBe(level);
    }
  });

  it('clamps out-of-range levels', () => {
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(999)).toBe(5_000);
  });
});

describe('levelState', () => {
  it('reports progress through a level', () => {
    // 250 is exactly the level-3 boundary, so pick a value inside the band.
    const state = levelState(300);
    expect(state.level).toBe(3);
    expect(state.name).toBe('Dormant');
    expect(state.progress).toBeGreaterThan(0);
    expect(state.progress).toBeLessThan(1);
  });

  it('has no next level at the cap', () => {
    const state = levelState(9_999);
    expect(state.level).toBe(MAX_LEVEL);
    expect(state.nextXp).toBeNull();
    expect(state.progress).toBe(1);
  });

  it('is at zero progress on a level boundary', () => {
    expect(levelState(500).progress).toBe(0);
    expect(levelState(250).progress).toBe(0); // level 3 begins here
  });
});
