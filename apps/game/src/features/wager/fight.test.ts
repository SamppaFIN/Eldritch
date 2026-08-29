import { describe, expect, it } from 'vitest';
import { resolveWager } from '@es3/core';
import type { Combatant } from '@es3/core';
import { fightFrames } from './fight.js';

function side(id: string, cells: number, strength = 200): Combatant {
  return {
    id,
    name: id,
    level: 5,
    cells: Array.from({ length: cells }, (_, i) => ({ h3: `${id}-${i}`, strength })),
    home: `${id}-home`,
    defence: 'wall',
  };
}

/** Deliberately named so one sorts before the other, since order is by id. */
const EARLY = 'a-early';
const LATE = 'z-late';

describe('fightFrames', () => {
  const outcome = resolveWager(side(EARLY, 30), side(LATE, 22, 240));

  it('has a frame per round', () => {
    expect(fightFrames(outcome, EARLY)).toHaveLength(outcome.rounds.length);
  });

  it('shows the same fight from either side, mirrored', () => {
    /*
     * The canonical order is by id and means nothing to a player. Whichever phone is
     * watching, "mine" has to be theirs — and the two views must be exact mirrors, or
     * one of them is lying about a fight both agreed on.
     */
    const early = fightFrames(outcome, EARLY);
    const late = fightFrames(outcome, LATE);

    expect(early.map((f) => f.mine)).toEqual(late.map((f) => f.theirs));
    expect(early.map((f) => f.dealtByMe)).toEqual(late.map((f) => f.dealtByThem));
  });

  it('starts near full and only ever falls', () => {
    const frames = fightFrames(outcome, EARLY);
    expect(frames[0]?.mine).toBeLessThanOrEqual(1);

    for (let i = 1; i < frames.length; i += 1) {
      expect(frames[i]?.mine).toBeLessThanOrEqual(frames[i - 1]?.mine ?? 1);
      expect(frames[i]?.theirs).toBeLessThanOrEqual(frames[i - 1]?.theirs ?? 1);
    }
  });

  it('stays inside 0 and 1', () => {
    for (const frame of fightFrames(outcome, LATE)) {
      expect(frame.mine).toBeGreaterThanOrEqual(0);
      expect(frame.mine).toBeLessThanOrEqual(1);
      expect(frame.theirs).toBeGreaterThanOrEqual(0);
      expect(frame.theirs).toBeLessThanOrEqual(1);
    }
  });

  it('ends with the loser at nothing when someone broke', () => {
    const rout = resolveWager(side(EARLY, 90, 500), side(LATE, 1, 30));
    const frames = fightFrames(rout, EARLY);
    expect(frames[frames.length - 1]?.theirs).toBe(0);
  });

  it('has nothing to show for a fight with no rounds', () => {
    expect(fightFrames({ ...outcome, rounds: [] }, EARLY)).toEqual([]);
  });
});
