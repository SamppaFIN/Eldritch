/** BRDC-MYSTERY-001 — the town's three mysteries: either road solves one, each weakens the Ancient One. */
import { describe, expect, it } from 'vitest';
import { MYSTERIES, mysteriesSolved, mysteryHp, mysteryProgress } from './mystery.js';
import { advanceSeason, bossMaxHp, openSeason } from './season.js';
import { FIRST_INVESTIGATOR, addClues } from './investigator.js';
import { MemoryStore } from '../data/kv.js';
import { mythosApi } from '../data/mythosStore.js';

describe('the mysteries', () => {
  it('three of them, each solved by 30 clues or 5 seals — the stronger road counts', () => {
    expect(MYSTERIES).toHaveLength(3);
    expect(mysteriesSolved(29, 4)).toBe(0);
    expect(mysteriesSolved(30, 0)).toBe(1);
    expect(mysteriesSolved(0, 10)).toBe(2);
    expect(mysteriesSolved(500, 500)).toBe(3);
    expect(mysteryProgress(35, 2)).toEqual({ solved: 1, clues: 35, seals: 2, needClues: 60, needSeals: 10 });
  });

  it('each one solved takes a fifth from the Ancient One when the Reckoning starts', () => {
    expect(mysteryHp(1000, 0)).toBe(1000);
    expect(mysteryHp(1000, 2)).toBe(600);
    const s = { ...openSeason(3, 'S3', 's3', 0), sealedGates: 10 };
    const r = advanceSeason({ ...s, doomShift: 13 }, 1, 2);
    expect(r.phase).toBe('reckoning');
    expect(r.bossMaxHp).toBe(Math.round(bossMaxHp(2) * 0.6));
  });

  it('the investigator counts every clue gathered, spent or not, even past the cap', () => {
    let inv = addClues(FIRST_INVESTIGATOR(0), 5);
    inv = addClues(inv, -3);
    inv = addClues(inv, 10);
    expect(inv.cluesGathered).toBe(15);
  });
});

describe('off-line (BRDC-MYSTERY-001)', () => {
  it('the last state heard is kept for a realm that cannot reach the Worker', async () => {
    const store = new MemoryStore();
    const mythos = mythosApi(() => store);
    expect(await mythos.known()).toBeNull();
    await mythos.remember({ seed: 's3', opensAt: 0, phase: 'open', cluesGathered: 35, sealedGates: 2 });
    expect(await mythos.known()).toEqual({ cluesGathered: 35, sealedGates: 2 });
  });
});
