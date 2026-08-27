import { describe, expect, it } from 'vitest';
import {
  ANCHOR_THRESHOLD_MS,
  MAX_DWELL_GAP_MS,
  TEMPLE_THRESHOLD_MS,
  accrueAll,
  accrueDwell,
  anchorOf,
  placesWithHome,
  revealPlaces,
  revealProgress,
} from './dwell.js';
import type { DwellMap } from './dwell.js';

const HOME = 'cell-home';
const WORK = 'cell-work';
const SHOP = 'cell-shop';
const T0 = Date.parse('2026-08-27T06:00:00Z');
const min = (n: number) => n * 60_000;

describe('accrueDwell', () => {
  it('credits the gap to where the player was, not where they arrived', () => {
    // You were at home for the gap. You have only just reached the shop.
    const dwell = accrueDwell({}, { h3: HOME, t: T0 }, { h3: SHOP, t: T0 + min(1) });
    expect(dwell[HOME]).toBe(min(1));
    expect(dwell[SHOP]).toBeUndefined();
  });

  it('has nothing to credit on the first reading', () => {
    expect(accrueDwell({}, null, { h3: HOME, t: T0 })).toEqual({});
  });

  it('accumulates across visits', () => {
    let dwell: DwellMap = accrueDwell({}, { h3: HOME, t: T0 }, { h3: SHOP, t: T0 + min(1) });
    dwell = accrueDwell(dwell, { h3: HOME, t: T0 + min(60) }, { h3: SHOP, t: T0 + min(61.5) });
    expect(dwell[HOME]).toBe(min(2.5));
  });

  it('ignores a clock that runs backwards', () => {
    expect(accrueDwell({}, { h3: HOME, t: T0 + min(10) }, { h3: SHOP, t: T0 })).toEqual({});
  });

  it('caps a long silence', () => {
    // A phone in a pocket goes quiet for eight hours. Without the cap, that one gap
    // crowns wherever the screen happened to go off.
    const dwell = accrueDwell({}, { h3: HOME, t: T0 }, { h3: HOME, t: T0 + min(8 * 60) });
    expect(dwell[HOME]).toBe(MAX_DWELL_GAP_MS);
  });

  it('never mutates what it was given', () => {
    const before: DwellMap = { [HOME]: min(5) };
    accrueDwell(before, { h3: HOME, t: T0 }, { h3: SHOP, t: T0 + min(10) });
    expect(before).toEqual({ [HOME]: min(5) });
  });
});

describe('accrueAll', () => {
  it('folds a recorded day', () => {
    // Six hours at home, a walk, three hours at work — with the cap applied per gap,
    // so the readings have to be dense enough to represent real time.
    const readings = [
      ...Array.from({ length: 12 }, (_, i) => ({ h3: HOME, t: T0 + min(i * 30) })),
      ...Array.from({ length: 6 }, (_, i) => ({ h3: WORK, t: T0 + min(360 + i * 30) })),
    ];
    const dwell = accrueAll({}, readings);

    expect(dwell[HOME]).toBeGreaterThan(min(300));
    expect(dwell[WORK]).toBeGreaterThan(min(120));
    expect(dwell[HOME]).toBeGreaterThan(dwell[WORK] as number);
  });

  it('handles a sequence too short to have gaps', () => {
    expect(accrueAll({}, [])).toEqual({});
    expect(accrueAll({}, [{ h3: HOME, t: T0 }])).toEqual({});
  });
});

describe('revealPlaces', () => {
  it('reveals nothing below the threshold', () => {
    expect(revealPlaces({ [HOME]: ANCHOR_THRESHOLD_MS - 1 })).toEqual([]);
  });

  it('crowns the most-dwelt cell as the Anchor', () => {
    const places = revealPlaces({ [HOME]: min(400), [WORK]: min(200) });
    expect(places[0]?.h3).toBe(HOME);
    expect(places[0]?.kind).toBe('anchor');
  });

  it('gives an Anchor to someone with exactly one place', () => {
    // The common case on a first evening, and it must not need a second place.
    const places = revealPlaces({ [HOME]: ANCHOR_THRESHOLD_MS });
    expect(places).toHaveLength(1);
    expect(places[0]?.kind).toBe('anchor');
  });

  it('names later places temples, in order of time spent', () => {
    const places = revealPlaces({
      [HOME]: min(500),
      [WORK]: min(300),
      [SHOP]: min(150),
    });

    expect(places.map((p) => p.kind)).toEqual(['anchor', 'temple', 'temple']);
    expect(places.map((p) => p.h3)).toEqual([HOME, WORK, SHOP]);
    expect(places.map((p) => p.rank)).toEqual([0, 1, 2]);
  });

  it('holds temples to a higher bar than the Anchor', () => {
    // Over the anchor threshold but under the temple one: it counts for the crown
    // if it is the best, and for nothing if it is not.
    const between = (ANCHOR_THRESHOLD_MS + TEMPLE_THRESHOLD_MS) / 2;
    const places = revealPlaces({ [HOME]: min(500), [WORK]: between });

    expect(places).toHaveLength(1);
    expect(places[0]?.h3).toBe(HOME);
  });

  it('moves the crown when somewhere else overtakes it', () => {
    // Meaning is not awarded once and kept. Move house and the game notices.
    expect(anchorOf(revealPlaces({ [HOME]: min(500), [WORK]: min(300) }))?.h3).toBe(HOME);
    expect(anchorOf(revealPlaces({ [HOME]: min(500), [WORK]: min(900) }))?.h3).toBe(WORK);
  });

  it('has no anchor when nothing qualifies', () => {
    expect(anchorOf(revealPlaces({}))).toBeNull();
  });
});

describe('revealProgress', () => {
  it('runs from nothing to one', () => {
    expect(revealProgress(0, false)).toBe(0);
    expect(revealProgress(ANCHOR_THRESHOLD_MS, false)).toBe(1);
    expect(revealProgress(ANCHOR_THRESHOLD_MS / 2, false)).toBeCloseTo(0.5, 5);
  });

  it('measures against the temple bar once an anchor exists', () => {
    expect(revealProgress(ANCHOR_THRESHOLD_MS, true)).toBeLessThan(1);
    expect(revealProgress(TEMPLE_THRESHOLD_MS, true)).toBe(1);
  });

  it('never runs past the end or below zero', () => {
    expect(revealProgress(TEMPLE_THRESHOLD_MS * 10, false)).toBe(1);
    expect(revealProgress(-5, false)).toBe(0);
  });
});

describe('placesWithHome', () => {
  it('is exactly revealPlaces when no Hearth has been accepted', () => {
    // The path a save from before the Hearth existed takes.
    const dwell = { [HOME]: min(200), [WORK]: min(120) };
    expect(placesWithHome(dwell, null)).toEqual(revealPlaces(dwell));
  });

  it('keeps the Anchor on the accepted Hearth, however long the afternoon was', () => {
    // The player agreed to start here. A café cannot quietly take the title away.
    const places = placesWithHome({ [HOME]: min(50), [WORK]: min(600) }, HOME);
    expect(places[0]).toMatchObject({ h3: HOME, kind: 'anchor', rank: 0 });
    expect(places[1]).toMatchObject({ h3: WORK, kind: 'temple' });
  });

  it('names the Hearth even before any time has been spent in it', () => {
    const [anchor] = placesWithHome({}, HOME);
    expect(anchor).toMatchObject({ h3: HOME, kind: 'anchor', dwellMs: 0 });
  });

  it('never lists the Hearth twice', () => {
    const places = placesWithHome({ [HOME]: min(600) }, HOME);
    expect(places.filter((p) => p.h3 === HOME)).toHaveLength(1);
  });

  it('ranks temples by time and skips anything under the threshold', () => {
    const places = placesWithHome(
      { [HOME]: min(10), [WORK]: min(100), [SHOP]: min(200), 'cell-brief': min(50) },
      HOME,
    );
    expect(places.map((p) => p.h3)).toEqual([HOME, SHOP, WORK]);
  });
});
