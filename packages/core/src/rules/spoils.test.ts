import { describe, expect, it } from 'vitest';
import { WAGER_SPOIL } from './constants.js';
import { applySpoils } from './spoils.js';
import { resolveWager } from './wagerBattle.js';
import type { Combatant } from './wagerBattle.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-08-29T12:00:00Z');
const ME = 'a-me';
const THEM = 'z-them';

const cell = (h3: string, ownerId: string | null, strength: number): Cell => ({
  h3,
  ownerId,
  strength,
  lastVisitedAt: T0,
  visitDays: [],
});

function side(id: string, cells: number, strength: number): Combatant {
  return {
    id,
    name: id,
    level: 5,
    cells: Array.from({ length: cells }, (_, i) => ({ h3: `${id}-${i}`, strength })),
    home: `${id}-home`,
    defence: 'wall',
  };
}

/** A fight the local player wins comfortably, and its mirror. */
const won = resolveWager(side(ME, 80, 400), side(THEM, 4, 60));
const lost = resolveWager(side(ME, 4, 60), side(THEM, 80, 400));

const map = [
  cell('mine-1', ME, 200),
  cell('theirs-1', THEM, 400),
  cell('theirs-2', THEM, 100),
  cell('empty', null, 0),
];

describe('winning a Wager', () => {
  it('softens their border', () => {
    expect(won.winner).toBe(ME);
    const spoils = applySpoils(map, won, ME);

    expect(spoils.cells[1]?.strength).toBe(400 - WAGER_SPOIL);
    expect(spoils.weakened).toBe(2);
    expect(spoils.taken).toBeGreaterThan(0);
  });

  it('never takes a cell — feet take cells', () => {
    const spoils = applySpoils(map, won, ME);
    expect(spoils.cells.map((c) => c.ownerId)).toEqual(map.map((c) => c.ownerId));
  });

  it('never empties a cell, which decay would then release', () => {
    // A cell emptied by a message is ownership changing hands without anybody walking.
    const spoils = applySpoils([cell('theirs', THEM, 40)], won, ME);
    expect(spoils.cells[0]?.strength).toBe(1);
  });

  it('leaves the player\'s own ground alone', () => {
    const spoils = applySpoils(map, won, ME);
    expect(spoils.cells[0]).toBe(map[0]);
  });

  it('leaves unclaimed ground alone', () => {
    const spoils = applySpoils(map, won, ME);
    expect(spoils.cells[3]).toBe(map[3]);
  });
});

describe('losing a Wager', () => {
  it('costs the player nothing at all', () => {
    /*
     * Not a missing branch — the point. If losing damaged the ground you actually walked
     * for, a friend could grind your map down by challenging you every night.
     */
    expect(lost.winner).toBe(THEM);
    const spoils = applySpoils(map, lost, ME);

    expect(spoils.cells).toEqual(map);
    expect(spoils).toMatchObject({ weakened: 0, taken: 0 });
  });

  it('leaves their border exactly as hard to walk through as it was', () => {
    expect(applySpoils(map, lost, ME).cells[1]?.strength).toBe(400);
  });
});
