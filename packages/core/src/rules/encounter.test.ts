/**
 * BRDC-EVENT-002 — the roll, the picking, and the library's own validation.
 */
import { describe, expect, it } from 'vitest';
import { cellAt } from '../geo/cells.js';
import { destination } from '../geo/project.js';
import { ENCOUNTER_CHANCE } from './constants.js';
import {
  encounterAt,
  encountersFor,
  parseEncounters,
  rollsDailyOmen,
  rollsEncounter,
} from './encounter.js';
import type { Encounter } from './encounter.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const HERE = cellAt(ORIGIN);
const DAY = '2026-09-12';

/** A spread of real cells, the same shape `terrain.test.ts` samples with. */
function sample(count: number): string[] {
  const cells = new Set<string>();
  for (let i = 0; cells.size < count && i < count * 20; i += 1) {
    cells.add(cellAt(destination(ORIGIN, (i * 37) % 360, 20 + (i % 200) * 25)));
  }
  return [...cells].slice(0, count);
}

const library: Encounter[] = [
  { id: 'anywhere-a', kind: 'find', text: 'a', choices: [{ text: 'ok' }] },
  { id: 'anywhere-b', kind: 'choice', text: 'b', choices: [{ text: 'ok' }] },
  { id: 'water-only', kind: 'person', where: ['lake', 'coast'], text: 'c', choices: [{ text: 'ok' }] },
];

describe('rollsEncounter', () => {
  it('gives the same answer for the same hex on the same day', () => {
    expect(rollsEncounter(HERE, DAY)).toBe(rollsEncounter(HERE, DAY));
  });

  // Two players on the same street must meet the same thing, and a reload must not
  // re-roll it. That is the whole reason this is a hash and not `Math.random()`.
  it('changes with the day, so a hex is not spent forever', () => {
    // A month, not a handful: at one in seven, five quiet days in a row is a coin toss
    // and a test that flips one is worse than no test.
    const days = Array.from({ length: 40 }, (_, i) => `2026-09-${String((i % 28) + 1).padStart(2, '0')}`);
    expect(new Set(days.map((d) => rollsEncounter(HERE, d))).size).toBe(2);
  });

  it('fires about as often as the constant says, measured over real ground', () => {
    const cells = sample(3_000);
    const hits = cells.filter((h3) => rollsEncounter(h3, DAY)).length;
    const rate = hits / cells.length;
    expect(rate).toBeGreaterThan(ENCOUNTER_CHANCE * 0.8);
    expect(rate).toBeLessThan(ENCOUNTER_CHANCE * 1.2);
  });
});

describe('rollsDailyOmen', () => {
  it('is the same all day for one player', () => {
    expect(rollsDailyOmen('me', DAY)).toBe(rollsDailyOmen('me', DAY));
  });

  it('is not the same for everybody, so it is not a global weather report', () => {
    const ids = Array.from({ length: 40 }, (_, i) => `player-${i}`);
    expect(new Set(ids.map((id) => rollsDailyOmen(id, DAY))).size).toBe(2);
  });
});

describe('encountersFor', () => {
  it('keeps the ones with no ground of their own, wherever you are', () => {
    expect(encountersFor(library, 'mountain').map((e) => e.id)).toEqual(['anywhere-a', 'anywhere-b']);
  });

  it('adds the bound ones on the ground they belong to', () => {
    expect(encountersFor(library, 'lake').map((e) => e.id)).toContain('water-only');
  });
});

describe('encounterAt', () => {
  it('is null on a hex whose roll did not fire', () => {
    const quiet = sample(400).find((h3) => !rollsEncounter(h3, DAY)) as string;
    expect(encounterAt(library, quiet, DAY, 'plain')).toBeNull();
  });

  it('gives the same encounter every time for the same hex and day', () => {
    const loud = sample(400).find((h3) => rollsEncounter(h3, DAY)) as string;
    expect(encounterAt(library, loud, DAY, 'plain')?.id).toBe(
      encounterAt(library, loud, DAY, 'plain')?.id,
    );
  });

  it('never offers a water encounter to a mountain', () => {
    for (const h3 of sample(500)) {
      expect(encounterAt(library, h3, DAY, 'mountain')?.id).not.toBe('water-only');
    }
  });

  it('is null rather than wrong when the library has nothing for that ground', () => {
    const water = [library[2] as Encounter];
    const loud = sample(400).find((h3) => rollsEncounter(h3, DAY)) as string;
    expect(encounterAt(water, loud, DAY, 'mountain')).toBeNull();
  });

  // Whether something happens and what happens are salted apart, so the rarest ground
  // does not always draw from the same end of the table.
  it('spreads across the library rather than favouring one entry', () => {
    const picked = new Set(
      sample(2_000)
        .map((h3) => encounterAt(library, h3, DAY, 'lake')?.id)
        .filter(Boolean),
    );
    expect(picked.size).toBe(library.length);
  });
});

describe('parseEncounters', () => {
  const one = (over: Record<string, unknown>) => [{ ...library[0], ...over }];

  it('accepts the shape the library is written in', () => {
    expect(parseEncounters(library)).toHaveLength(3);
  });

  it('refuses anything that is not an array', () => {
    expect(() => parseEncounters({})).toThrow(/not an array/);
  });

  it('refuses a missing id, an unknown kind, empty text and no choices', () => {
    expect(() => parseEncounters(one({ id: '' }))).toThrow(/needs an id/);
    expect(() => parseEncounters(one({ kind: 'rumour' }))).toThrow(/kind must be one of/);
    expect(() => parseEncounters(one({ text: '' }))).toThrow(/needs text/);
    expect(() => parseEncounters(one({ choices: [] }))).toThrow(/at least one choice/);
  });

  it('refuses a choice with no words on its button', () => {
    expect(() => parseEncounters(one({ choices: [{ text: '' }] }))).toThrow(/choice 0: needs text/);
  });

  // Two stories under one id means one of them can never be looked up again.
  it('refuses a duplicate id', () => {
    expect(() => parseEncounters([library[0], library[0]])).toThrow(/duplicate id/);
  });
});
