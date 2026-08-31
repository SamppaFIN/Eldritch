/**
 * The pouch, through the repository — claim yields and the trickle from held ground.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { CLAIM_YIELD, EMPTY_POOL, RESOURCE_KINDS, TRICKLE_PER_HOUR, resourceOf } from '../rules/terrain.js';
import type { ResourcePool } from '../rules/terrain.js';
import { WARD_COST } from '../rules/ward.js';
import { destination } from '../geo/project.js';
import { cellAt } from '../geo/cells.js';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
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

const BOX = {
  west: ORIGIN.lng - 0.02,
  east: ORIGIN.lng + 0.02,
  south: ORIGIN.lat - 0.02,
  north: ORIGIN.lat + 0.02,
};

const total = (p: ResourcePool) => RESOURCE_KINDS.reduce((sum, k) => sum + p[k], 0);

describe('resources', () => {
  let repo: MockRepository;

  beforeEach(() => {
    repo = new MockRepository({ seed: 11 });
  });

  it('start empty', async () => {
    expect(await repo.getResources(T0)).toEqual(EMPTY_POOL);
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
    expect(await repo.getResources(T0)).toEqual(EMPTY_POOL);
  });

  it('resets a pre-BRDC-ECON-001 pool instead of trusting it as the new shape', async () => {
    // A returning player's old { water, wood, gold } pool read back as the current
    // nine-field ResourcePool would leave every missing field undefined, and the first
    // arithmetic on it would mint NaN. BRDC-PERSIST-002: `MockRepository` wraps its store
    // in `versioned()`, and a store with no schema version is cleared on open — so the
    // old pool never reaches the arithmetic. Seeded directly, the way a real old save
    // would already be sitting in the store before this code ever runs.
    const store = new MemoryStore();
    await store.set('resources', { pool: { water: 30, wood: 5, gold: 2 }, since: T0 });
    const stale = new MockRepository({ store, seed: 11 });

    expect(await stale.schemaOutcome()).toBe('reset');
    const pool = await stale.getResources(T0);
    expect(pool).toEqual(EMPTY_POOL);
    expect(Object.values(pool).every(Number.isFinite)).toBe(true);
  });
});

describe('warding through the repository', () => {
  let repo: MockRepository;

  beforeEach(async () => {
    repo = new MockRepository({ seed: 11 });
  });

  /**
   * Walk out and back along four bearings, then hold the ground overnight.
   *
   * One straight leg is not enough: a single street may cross no forest at all, and a
   * ward costs timber. Four bearings around the origin makes it a neighbourhood rather
   * than a line, which is what actually guarantees some woodland to fund a ward from.
   */
  const HELD_UNTIL = T_END + 30 * HOUR;

  async function stocked() {
    const id = await repo.startRun(T0);
    let t = T0;
    for (const bearing of [0, 90, 180, 270]) {
      const out = Array.from({ length: 14 }, (_, i) => ({
        ...destination(ORIGIN, bearing, i * 14),
        t: (t += 10_000),
        accuracy: 8,
      }));
      await repo.submitTrail(id, [...out, ...[...out].reverse().map((p) => ({ ...p, t: (t += 10_000) }))]);
    }
    await repo.getResources(HELD_UNTIL);
    return repo.getOwnedCells(HELD_UNTIL);
  }

  it('raises the cell and takes the cost from the pouch', async () => {
    const owned = await stocked();
    // Not a full cell: a ward is refused outright at the cap, which is a different test.
    const target = owned.find((c) => c.strength < 500) as { h3: string; strength: number };
    const before = await repo.getResources(HELD_UNTIL);

    const result = await repo.wardCell(target.h3, HELD_UNTIL);
    expect(result).toMatchObject({ warded: true });
    if (!result.warded) return;

    expect(result.pool.wood).toBe(before.wood - (WARD_COST.wood ?? 0));
    const after = (await repo.getOwnedCells(HELD_UNTIL)).find((c) => c.h3 === target.h3);
    expect(after?.strength).toBeGreaterThan(target.strength);
  });

  it('refuses ground that is not the player\'s', async () => {
    await stocked();
    const rivals = (await repo.getCells(BOX, T_END)).filter((c) => c.ownerId?.startsWith('seed-'));
    const result = await repo.wardCell((rivals[0] as { h3: string }).h3, HELD_UNTIL);
    expect(result).toEqual({ warded: false, refused: 'not-yours' });
  });

  it('spends a real pouch down until it refuses', async () => {
    // Warding is limited by what has been collected and by nothing else. Repeat it and
    // the answer eventually has to become "cannot afford" rather than more strength.
    const owned = await stocked();
    const target = (owned.find((c) => c.strength < 500) as { h3: string }).h3;

    let last = await repo.wardCell(target, HELD_UNTIL);
    let wards = 0;
    while (last.warded && wards < 50) {
      wards += 1;
      last = await repo.wardCell(target, HELD_UNTIL);
    }

    expect(wards).toBeGreaterThan(0);
    expect(last.warded).toBe(false);
    if (!last.warded) expect(['cannot-afford', 'already-full']).toContain(last.refused);
  });

  it('does not buy the cell out of decay', async () => {
    // The rule the mechanic balances on, checked where it actually matters: through the
    // store, after a write, with the decay sweep that reads it.
    const owned = await stocked();
    const target = (owned.find((c) => c.strength < 500) as { h3: string }).h3;
    await repo.wardCell(target, HELD_UNTIL);

    const survivors = await repo.getOwnedCells(HELD_UNTIL + 60 * 86_400_000);
    expect(survivors.find((c) => c.h3 === target)).toBeUndefined();
  });
});
