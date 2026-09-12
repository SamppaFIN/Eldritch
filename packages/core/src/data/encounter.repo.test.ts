/**
 * BRDC-EVENT-002 — the caps and the daily roll, which are the parts with state in them.
 *
 * The roll itself is pure and covered in `rules/encounter.test.ts`. What can break here is
 * the counting: a walk that becomes a run of popups, or a player who re-rolls the day's
 * omen by reopening the app.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import {
  dailyOmen,
  encounterById,
  encounterLibrary,
  encounterOnStep,
  recentEncounters,
  withinCaps,
} from './encounterStore.js';
import { rollsEncounter, rollsDailyOmen } from '../rules/encounter.js';
import { ENCOUNTER_MAX_PER_DAY, ENCOUNTER_MAX_PER_HOUR } from '../rules/constants.js';
import { cellAt } from '../geo/cells.js';
import { destination } from '../geo/project.js';
import { utcDay } from '../rules/day.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-09-12T10:00:00Z');
const HOUR = 3_600_000;

let store: MemoryStore;
beforeEach(() => {
  store = new MemoryStore();
});

/** A hex whose roll actually fires today, so the test is about the caps and not the dice. */
function loudHex(day = utcDay(T0)): string {
  for (let i = 0; i < 4_000; i += 1) {
    const h3 = cellAt(destination(ORIGIN, (i * 37) % 360, 20 + (i % 200) * 25));
    if (rollsEncounter(h3, day)) return h3;
  }
  throw new Error('no hex rolled an encounter — the constant must have changed');
}

describe('the library as shipped', () => {
  it('carries at least the thirty the ticket asks for', () => {
    expect(encounterLibrary().length).toBeGreaterThanOrEqual(30);
  });

  it('has every one of the five kinds in it', () => {
    const kinds = new Set(encounterLibrary().map((e) => e.kind));
    expect([...kinds].sort()).toEqual(['choice', 'find', 'person', 'weather', 'wrong-place']);
  });

  // "Jokainen kohtaaminen päättyy johonkin" — every one ends somewhere, and every button
  // says what it does. A choice with no words on it is a dead end on a phone in the rain.
  it('gives every encounter a way out', () => {
    for (const e of encounterLibrary()) {
      expect(e.choices.length).toBeGreaterThan(0);
      for (const c of e.choices) expect(c.text.length).toBeGreaterThan(0);
    }
  });

  it('carries some that point at a wonder', () => {
    expect(encounterLibrary().some((e) => e.hint)).toBe(true);
  });

  it('can be looked up by id, and says so when it cannot', () => {
    const first = encounterLibrary()[0];
    expect(encounterById(first?.id ?? '')?.id).toBe(first?.id);
    expect(encounterById('no-such-thing')).toBeNull();
  });
});

describe('withinCaps', () => {
  it('lets a quiet walker through', () => {
    expect(withinCaps([], T0)).toBe(true);
  });

  it('stops at the hourly ceiling', () => {
    const fired = Array.from({ length: ENCOUNTER_MAX_PER_HOUR }, (_, i) => T0 - i * 60_000);
    expect(withinCaps(fired, T0)).toBe(false);
  });

  // A rolling window, not a counter that something has to reset: an hour later the same
  // list lets the player through again without anybody having swept it.
  it('opens again once the hour has rolled past them', () => {
    const fired = Array.from({ length: ENCOUNTER_MAX_PER_HOUR }, (_, i) => T0 - i * 60_000);
    expect(withinCaps(fired, T0 + HOUR + 60_000)).toBe(true);
  });

  it('stops at the daily ceiling however they are spread out', () => {
    const fired = Array.from({ length: ENCOUNTER_MAX_PER_DAY }, (_, i) => T0 - i * HOUR);
    expect(withinCaps(fired, T0)).toBe(false);
  });
});

describe('encounterOnStep', () => {
  it('turns something up on a hex whose day has something in it', async () => {
    const found = await encounterOnStep(store, loudHex(), T0);
    expect(found).not.toBeNull();
  });

  it('writes one log line naming the encounter', async () => {
    const found = await encounterOnStep(store, loudHex(), T0);
    const log = (await store.get<{ kind: string; ref?: string }[]>(K.log)) ?? [];
    expect(log.filter((e) => e.kind === 'encounter')).toEqual([
      expect.objectContaining({ kind: 'encounter', ref: found?.id }),
    ]);
  });

  it('remembers when it fired, so the caps have something to count', async () => {
    await encounterOnStep(store, loudHex(), T0);
    expect(await recentEncounters(store, T0)).toEqual([T0]);
  });

  it('forgets what fired more than a day ago', async () => {
    await store.set(K.encounters, [T0 - 2 * 24 * HOUR, T0]);
    expect(await recentEncounters(store, T0)).toEqual([T0]);
  });

  // The field report this ticket exists for is silence, but the opposite failure is real:
  // a long walk must not become a wall of popups.
  it('goes quiet once the hour is full', async () => {
    await store.set(
      K.encounters,
      Array.from({ length: ENCOUNTER_MAX_PER_HOUR }, (_, i) => T0 - i * 60_000),
    );
    expect(await encounterOnStep(store, loudHex(), T0)).toBeNull();
  });

  /*
   * And being capped must not *spend* the ground. The roll is deterministic, so a hex a
   * capped player walked over still holds its encounter — the caps are checked before the
   * roll for exactly this reason, and nothing is written when they refuse.
   */
  it('does not consume the hex it refused', async () => {
    const h3 = loudHex();
    await store.set(
      K.encounters,
      Array.from({ length: ENCOUNTER_MAX_PER_HOUR }, (_, i) => T0 - i * 60_000),
    );
    expect(await encounterOnStep(store, h3, T0)).toBeNull();

    await store.set(K.encounters, []);
    expect(await encounterOnStep(store, h3, T0)).not.toBeNull();
  });
});

describe('the daily omen', () => {
  /** A player id whose omen actually fires today. */
  const luckyId = (): string => {
    const day = utcDay(T0);
    for (let i = 0; i < 500; i += 1) if (rollsDailyOmen(`p${i}`, day)) return `p${i}`;
    throw new Error('nobody rolled an omen — the constant must have changed');
  };

  it('fires for a player whose day has something in it', async () => {
    expect(await dailyOmen(store, luckyId(), cellAt(ORIGIN), T0)).not.toBeNull();
  });

  // Reopening the app must not be a way to re-roll it. The stored day is what stops that.
  it('is one chance a day, however many times the app is opened', async () => {
    const id = luckyId();
    await dailyOmen(store, id, cellAt(ORIGIN), T0);
    expect(await dailyOmen(store, id, cellAt(ORIGIN), T0 + 60_000)).toBeNull();
    expect(await dailyOmen(store, id, cellAt(ORIGIN), T0 + 8 * HOUR)).toBeNull();
  });

  it('gives nothing to a player who has not raised a Hearth yet', async () => {
    expect(await dailyOmen(store, luckyId(), null, T0)).toBeNull();
  });
});
