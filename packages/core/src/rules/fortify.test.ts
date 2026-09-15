/**
 * BRDC-BUILD-012 — a Fortress holds its ground.
 *
 * Infinite's four answers (2026-09-15), as rules: the hex never changes hands · it never
 * decays · it can be brought down by siege · the protection reaches the owner's
 * neighbouring hexes too.
 *
 * The consequence that has to be tested rather than hoped for: since the ground never
 * decays, a siege is the only way a Fortress ever falls — so falling must be possible, and
 * it must not be possible in one walk.
 */
import { describe, expect, it } from 'vitest';
import { cellAt, cellsWithin, neighboursOf } from '../geo/cells.js';
import { fortified } from './aura.js';
import { resolveCapture } from './capture.js';
import { blightLevel, projectCell, sweepDecay } from './decay.js';
import { holdingOf } from './holdings.js';
import { utcDay } from './day.js';
import type { Cell } from '../types/domain.js';

const CENTRE = cellAt({ lat: 61.4729, lng: 23.7259 });
const NEXT = neighboursOf(CENTRE)[0] as string;
const FAR = cellsWithin(CENTRE, 2).find(
  (h) => h !== CENTRE && !neighboursOf(CENTRE).includes(h),
) as string;
/** Level 1, no neighbours: 105 a blow. */
const ME = { id: 'me', level: 1 };
const RIVAL = 'the-pale-warden';
const DAY = (n: number) => Date.parse('2026-08-27T12:00:00Z') + n * 86_400_000;
const FORTRESS = [{ id: 'fortress' as const, builtAt: 0 }];

const held = (h3: string, owner: string | null, strength: number, over: Partial<Cell> = {}): Cell => ({
  h3,
  ownerId: owner,
  strength,
  lastVisitedAt: DAY(0),
  visitDays: [],
  ...over,
});
const map = (...cells: Cell[]) => new Map(cells.map((c) => [c.h3, c]));
const hasFortress = (c: Cell) => (c.buildings ?? []).some((w) => w.id === 'fortress');

describe('which ground a Fortress protects', () => {
  const fort = held(CENTRE, RIVAL, 200, { buildings: FORTRESS });

  it('its own hex', () => {
    expect(fortified(map(fort), CENTRE)).toBe(true);
  });

  it("its owner's hexes beside it", () => {
    expect(fortified(map(fort, held(NEXT, RIVAL, 200)), NEXT)).toBe(true);
  });

  it("not somebody else's hex beside it", () => {
    expect(fortified(map(fort, held(NEXT, 'me', 200)), NEXT)).toBe(false);
  });

  it('not two rings out', () => {
    expect(fortified(map(fort, held(FAR, RIVAL, 200)), FAR)).toBe(false);
  });

  it('not unowned ground', () => {
    expect(fortified(map(fort, held(NEXT, null, 0)), NEXT)).toBe(false);
  });

  it('nothing the caller did not load — which is why callers must load the neighbours', () => {
    expect(fortified(map(held(NEXT, RIVAL, 200)), NEXT)).toBe(false);
  });
});

describe('the siege', () => {
  it('ground under a Fortress holds at 1 and never changes hands', () => {
    let cell = held(NEXT, RIVAL, 500);
    for (let pass = 1; pass <= 20; pass += 1) {
      const { cell: after, outcome } = resolveCapture(cell, ME, DAY(pass), 0, null, true);
      cell = after;
      expect(outcome.kind).toBe('damaged');
      expect(cell.ownerId).toBe(RIVAL);
    }
    expect(cell.strength).toBe(1);
  });

  it('one walk cannot bring a Fortress down, however many laps', () => {
    let cell = held(CENTRE, RIVAL, 1, { buildings: FORTRESS });
    for (let lap = 0; lap < 10; lap += 1) {
      const { cell: after, outcome } = resolveCapture(cell, ME, DAY(3), 0, null, true);
      cell = after;
      expect(outcome.kind).not.toBe('razed');
    }
    expect(hasFortress(cell)).toBe(true);
    expect(cell.ownerId).toBe(RIVAL);
  });

  it('a breach on one day and a break-through on a later one brings it down', () => {
    const start = held(CENTRE, RIVAL, 150, { buildings: FORTRESS });

    const d1 = resolveCapture(start, ME, DAY(1), 0, null, true);
    expect(d1.cell.strength).toBe(45);
    expect(d1.cell.breachedOn).toBeUndefined();

    const d2 = resolveCapture(d1.cell, ME, DAY(2), 0, null, true);
    expect(d2.outcome.kind).toBe('damaged');
    expect(d2.cell.strength).toBe(1);
    expect(d2.cell.breachedOn).toBe(utcDay(DAY(2)));

    const d3 = resolveCapture(d2.cell, ME, DAY(3), 0, null, true);
    expect(d3.outcome.kind).toBe('razed');
    expect(d3.cell.ownerId).toBe(RIVAL);
    expect(d3.cell.strength).toBe(1);
    expect(hasFortress(d3.cell)).toBe(false);
    expect(d3.cell.breachedOn).toBeUndefined();

    // Nothing stands over it now, so the caller finds it unprotected and it falls.
    const holds = fortified(map(d3.cell), CENTRE);
    expect(holds).toBe(false);
    expect(resolveCapture(d3.cell, ME, DAY(4), 0, null, holds).outcome.kind).toBe('taken');
  });

  it('a breach heals once the owner walks it back to base strength', () => {
    const breached = held(CENTRE, RIVAL, 90, {
      buildings: FORTRESS,
      breachedOn: utcDay(DAY(0)),
      visitDays: [utcDay(DAY(0))],
    });
    // Consecutive day: +50, to 140 — past base strength, so the wall is whole again.
    const healed = resolveCapture(breached, { id: RIVAL, level: 1 }, DAY(1)).cell;
    expect(healed.strength).toBe(140);
    expect(healed.breachedOn).toBeUndefined();
  });

  it("a day's patch below base strength does not heal it", () => {
    const breached = held(CENTRE, RIVAL, 1, {
      buildings: FORTRESS,
      breachedOn: utcDay(DAY(0)),
      visitDays: [utcDay(DAY(0))],
    });
    const patched = resolveCapture(breached, { id: RIVAL, level: 1 }, DAY(1)).cell;
    expect(patched.strength).toBe(51);
    expect(patched.breachedOn).toBe(utcDay(DAY(0)));
  });

  it('the floor is opt-in — without it a Fortress hex falls like any cell', () => {
    const cell = held(CENTRE, RIVAL, 50, { buildings: FORTRESS });
    expect(resolveCapture(cell, ME, DAY(1)).outcome.kind).toBe('taken');
  });
});

describe('the Void does not take it', () => {
  const faded = held(NEXT, RIVAL, 10);

  it('ground under a Fortress keeps its strength however long it is left', () => {
    expect(projectCell(faded, DAY(400), 1, null, true)?.strength).toBe(10);
    // Without the Fortress the same hex is long gone — the exemption is what keeps it.
    expect(projectCell(faded, DAY(400), 1, null, false)).toBeNull();
  });

  it('a sweep releases what is unprotected and keeps what stands under a Fortress', () => {
    const exposed = held(FAR, RIVAL, 10);
    const sweep = sweepDecay([faded, exposed], DAY(400), undefined, null, (c) => c.h3 === NEXT);
    expect(sweep.released).toEqual([FAR]);
    expect(sweep.cells.map((c) => c.h3)).toEqual([NEXT]);
  });

  it('shows no blight, and your lands list it as ground that cannot be lost', () => {
    expect(blightLevel(faded, DAY(400), null, true)).toBe(0);
    expect(holdingOf(faded, {}, null, true).hoursLeft).toBeNull();
  });
});
