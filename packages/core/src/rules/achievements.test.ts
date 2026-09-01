import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, earnedNow } from './achievements.js';
import type { AchievementSnapshot } from './achievements.js';

const zero: AchievementSnapshot = {
  level: 1,
  ownedCount: 0,
  maxOwnedDays: 0,
  finds: [],
  adventuresDone: [],
  templeCount: 0,
  techCount: 0,
  hearthFounded: false,
};

describe('earnedNow', () => {
  it('a fresh player has earned nothing, and does not throw', () => {
    expect(earnedNow(zero).size).toBe(0);
  });

  it('cell-count achievements are inclusive at the boundary', () => {
    expect(earnedNow({ ...zero, ownedCount: 9 }).has('cartographer')).toBe(false);
    expect(earnedNow({ ...zero, ownedCount: 10 }).has('cartographer')).toBe(true);
    expect(earnedNow({ ...zero, ownedCount: 10 }).has('first-ground')).toBe(true);
    expect(earnedNow({ ...zero, ownedCount: 30 }).has('dominion')).toBe(true);
  });

  it('consciousness milestones', () => {
    expect(earnedNow({ ...zero, level: 4 }).has('awakening')).toBe(false);
    expect(earnedNow({ ...zero, level: 5 }).has('awakening')).toBe(true);
    expect(earnedNow({ ...zero, level: 15 }).has('enlightened')).toBe(true);
  });

  it('Collector needs all three troll answers', () => {
    expect(earnedNow({ ...zero, finds: ['trinket', 'staff'] }).has('collector')).toBe(false);
    expect(earnedNow({ ...zero, finds: ['trinket', 'staff', 'wisdom'] }).has('collector')).toBe(true);
  });

  it('Servant needs the Fuming Lake finished; Homesteader needs a Hearth', () => {
    expect(earnedNow({ ...zero, adventuresDone: ['fuming-lake'] }).has('servant')).toBe(true);
    expect(earnedNow({ ...zero, hearthFounded: true }).has('homesteader')).toBe(true);
  });

  it('every id it can return is a real achievement', () => {
    const ids = new Set(ACHIEVEMENTS.map((a) => a.id));
    const full: AchievementSnapshot = {
      level: 20,
      ownedCount: 99,
      maxOwnedDays: 9,
      finds: ['trinket', 'staff', 'wisdom'],
      adventuresDone: ['fuming-lake'],
      templeCount: 2,
      techCount: 3,
      hearthFounded: true,
    };
    for (const id of earnedNow(full)) expect(ids.has(id)).toBe(true);
    expect(earnedNow(full).size).toBe(ACHIEVEMENTS.length);
  });
});
