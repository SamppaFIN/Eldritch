import { describe, expect, it } from 'vitest';
import {
  FIRST_INVESTIGATOR,
  HOME_MS,
  REST_MS,
  SANITY_MAX,
  STAMINA_MAX,
  addClues,
  afterTest,
  diceFor,
  isHome,
  recover,
  reroll,
  rollTest,
  sealClues,
} from './investigator.js';
import { cellAt, cellsWithin, neighboursOf } from '../geo/cells.js';
import { GATE_DOOM_MS, gateAtDawn, gatesNear, horrorBite, overdue } from './gate.js';
import type { Cell } from '../types/domain.js';

/** A die that always shows these faces, in order. */
const faces = (...f: number[]) => {
  let i = 0;
  return () => ((f[i++ % f.length] as number) - 1) / 6 + 0.01;
};
const T0 = Date.parse('2026-10-01T12:00:00Z');

describe('the dice (BRDC-DOOM-002)', () => {
  it('a 5 or 6 succeeds; blessed a 4 too, cursed only a 6', () => {
    const rng = faces(6, 2, 3, 1, 4);
    expect(rollTest(5, 2, 'normal', rng)).toMatchObject({ faces: [6, 2, 3, 1, 4], successes: 1, pass: false });
    expect(rollTest(5, 2, 'blessed', faces(6, 2, 3, 1, 4))).toMatchObject({ successes: 2, pass: true });
    expect(rollTest(2, 1, 'cursed', faces(5, 6))).toMatchObject({ successes: 1 });
  });

  it('a clue rerolls one die', () => {
    const roll = rollTest(3, 2, 'normal', faces(6, 1, 1));
    expect(reroll(roll, 1, faces(5))).toMatchObject({ faces: [6, 5, 1], pass: true });
  });

  it('dice are two plus the skill; five clues seal, three with Elder Signs', () => {
    expect(diceFor(FIRST_INVESTIGATOR(T0), 'lore')).toBe(5);
    expect(sealClues([])).toBe(5);
    expect(sealClues(['elder-signs'])).toBe(3);
  });
});

describe('the investigator', () => {
  it('pays for tests, and zero sends them home with half the clues', () => {
    const inv = addClues(FIRST_INVESTIGATOR(T0), 5);
    expect(afterTest(inv, 1, 2, T0)).toMatchObject({ stamina: STAMINA_MAX - 1, sanity: SANITY_MAX - 2, clues: 5 });
    const broken = afterTest({ ...inv, sanity: 2 }, 1, 2, T0);
    expect(broken).toMatchObject({ sanity: 0, clues: 2, homeAt: T0 });
    expect(isHome(broken, T0 + HOME_MS - 1)).toBe(true);
    expect(recover(broken, T0 + HOME_MS)).toMatchObject({ stamina: STAMINA_MAX, sanity: SANITY_MAX });
  });

  it('rests a point back every two hours, and clues cap at eight', () => {
    const tired = { ...FIRST_INVESTIGATOR(T0), stamina: 2, sanity: 1 };
    expect(recover(tired, T0 + 3 * REST_MS)).toMatchObject({ stamina: 5, sanity: 4 });
    expect(addClues(FIRST_INVESTIGATOR(T0), 20).clues).toBe(8);
  });
});

describe('gates', () => {
  const home = cellAt({ lat: 61.4729, lng: 23.7258 });
  const held: Cell[] = cellsWithin(home, 1).map((h3) => ({ h3, ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [] }));

  it('open on some dawns, just outside the border, the same draw every time', () => {
    const draws = Array.from({ length: 40 }, (_, d) => gateAtDawn('s2', d, 'me', held, T0));
    const opened = draws.filter((g) => g !== null);
    expect(opened.length).toBeGreaterThan(5);
    expect(opened.length).toBeLessThan(30);
    for (const g of opened) expect(held.some((c) => c.h3 === g?.h3)).toBe(false);
    expect(gateAtDawn('s2', 3, 'me', held, T0)).toEqual(gateAtDawn('s2', 3, 'me', held, T0));
    expect(gateAtDawn('s2', 3, 'me', [], T0)).toBeNull();
  });

  it('drain sanity nearby, bite the cells beside them, and turn to Doom after 48 h', () => {
    const beside = neighboursOf(home).find((h) => !held.some((c) => c.h3 === h)) ?? neighboursOf(neighboursOf(home)[0] as string)[0];
    const gate = { id: 'g', h3: beside as string, openedAt: T0 };
    expect(gatesNear([gate], held)).toBe(1);
    expect(gatesNear([{ ...gate, sealedAt: T0 }], held)).toBe(0);
    const edge = held.find((c) => neighboursOf(c.h3).includes(gate.h3)) as Cell;
    expect(horrorBite(gate, edge, T0 + 2 * 86_400_000)).toBe(40);
    expect(overdue([gate], T0 + GATE_DOOM_MS - 1)).toHaveLength(0);
    expect(overdue([gate], T0 + GATE_DOOM_MS)).toHaveLength(1);
  });
});
