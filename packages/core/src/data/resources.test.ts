/**
 * The pouch, through the repository — claim yields and the trickle from held ground.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { CLAIM_YIELD, TRICKLE_PER_HOUR, resourceOf } from '../rules/terrain.js';
import { destination } from '../geo/project.js';
import { cellAt } from '../geo/cells.js';
import { MockRepository } from './MockRepository.js';
import type { TrailPoint } from '../types/domain.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-08-28T09:00:00Z');
const HOUR = 3_600_000;
/** When the walk below ends. The trickle clock starts from the first claim, not from T0. */
const T_END = T0 + 23 * 10_000;

/** A short walk north, far enough to cross several cells. */
function walk(from = ORIGIN, startT = T0): TrailPoint[] {
  return Array.from({ length: 24 }, (_, i) => ({
    ...destination(from, 0, i * 14),
    t: startT + i * 10_000,
    accuracy: 8,
  }));
}

const total = (p: { water: number; wood: number; gold: number }) => p.water + p.wood + p.gold;

describe('resources', () => {
  let repo: MockRepository;

  beforeEach(() => {
    repo = new MockRepository({ seed: 11 });
  });

  it('start empty', async () => {
    expect(await repo.getResources(T0)).toEqual({ water: 0, wood: 0, gold: 0 });
  });

  it('are paid the moment ground is taken', async () => {
    const id = await repo.startRun(T0);
    const result = await repo.submitTrail(id, walk());

    const producing = result.grown.filter(
      (o) => (o.kind === 'claimed' || o.kind === 'taken') && resourceOf(o.h3) !== null,
    ).length;

    // The walk has to cross something worth having, or the test proves nothing.
    expect(producing).toBeGreaterThan(0);
    expect(total(await repo.getResources(T0))).toBe(producing * CLAIM_YIELD);
  });

  it('trickle in for ground that is simply held', async () => {
    const id = await repo.startRun(T0);
    await repo.submitTrail(id, walk());

    const atClaim = total(await repo.getResources(T_END));
    const owned = await repo.getOwnedCells(T_END);
    const producing = owned.filter((c) => resourceOf(c.h3) !== null).length;
    expect(producing).toBeGreaterThan(0);

    expect(total(await repo.getResources(T_END + 3 * HOUR))).toBe(
      atClaim + producing * TRICKLE_PER_HOUR * 3,
    );
  });

  it('pay nothing for a partial hour, and lose nothing to it either', async () => {
    // The trickle settles an hour at a time. Half an hour is not half a log; it is a
    // half hour that still counts once the next one arrives.
    const id = await repo.startRun(T0);
    await repo.submitTrail(id, walk());

    const atClaim = total(await repo.getResources(T_END));
    expect(total(await repo.getResources(T_END + HOUR / 2))).toBe(atClaim);

    const owned = await repo.getOwnedCells(T_END);
    const producing = owned.filter((c) => resourceOf(c.h3) !== null).length;
    expect(total(await repo.getResources(T_END + HOUR))).toBe(
      atClaim + producing * TRICKLE_PER_HOUR,
    );
  });

  it('are not minted by asking for them repeatedly', async () => {
    /*
     * The regression that matters. Crediting the whole elapsed span while advancing the
     * clock only by whole hours paid every unsettled minute again on the next read — and
     * a HUD that reads the pouch on each render would have printed money.
     */
    const id = await repo.startRun(T0);
    await repo.submitTrail(id, walk());

    for (let i = 1; i <= 30; i += 1) await repo.getResources(T0 + i * 2 * 60_000);
    const polled = total(await repo.getResources(T0 + HOUR));

    const fresh = new MockRepository({ seed: 11 });
    const id2 = await fresh.startRun(T0);
    await fresh.submitTrail(id2, walk());
    const once = total(await fresh.getResources(T0 + HOUR));

    expect(polled).toBe(once);
  });

  it('pay nothing for plain ground, however long it is held', async () => {
    // A cell with no resource must never produce, or terrain stops meaning anything.
    const plainOnly = cellAt(ORIGIN);
    if (resourceOf(plainOnly) === null) {
      const id = await repo.startRun(T0);
      await repo.submitTrail(id, [{ ...ORIGIN, t: T0, accuracy: 8 }]);
      expect(total(await repo.getResources(T0 + 50 * HOUR))).toBe(0);
    }
  });

  it('are forgotten by a reset', async () => {
    const id = await repo.startRun(T0);
    await repo.submitTrail(id, walk());
    await repo.resetAll();
    expect(await repo.getResources(T0)).toEqual({ water: 0, wood: 0, gold: 0 });
  });
});
