import { describe, expect, it } from 'vitest';
import { gridDisk } from 'h3-js';
import { cellAt } from '../geo/cells.js';
import { destination } from '../geo/project.js';
import {
  CLAIM_YIELD,
  EMPTY_POOL,
  TRICKLE_PER_HOUR,
  addClaimYield,
  canAfford,
  resourceOf,
  settleResources,
  spend,
  terrainOf,
  trickle,
} from './terrain.js';
import type { TerrainKind } from './terrain.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const HERE = cellAt(ORIGIN);
const T0 = Date.parse('2026-08-28T09:00:00Z');
const HOUR = 3_600_000;

/** A wide sample of real cells, spread over a couple of kilometres. */
function sample(count = 400): string[] {
  const cells = new Set<string>();
  for (let i = 0; cells.size < count && i < 4000; i += 1) {
    const bearing = (i * 37) % 360;
    const distance = 20 + (i % 90) * 25;
    for (const h3 of gridDisk(cellAt(destination(ORIGIN, bearing, distance)), 1)) cells.add(h3);
  }
  return [...cells].slice(0, count);
}

describe('terrainOf', () => {
  it('is the same every time it is asked', () => {
    expect(terrainOf(HERE)).toBe(terrainOf(HERE));
  });

  it('produces every kind somewhere in a couple of kilometres', () => {
    const kinds = new Set<TerrainKind>(sample().map(terrainOf));
    expect(kinds).toEqual(new Set(['water', 'forest', 'market', 'plain']));
  });

  it('leaves most ground plain, so a producing cell is worth walking to', () => {
    const cells = sample();
    const producing = cells.filter((h3) => resourceOf(h3) !== null).length;
    expect(producing / cells.length).toBeGreaterThan(0.1);
    expect(producing / cells.length).toBeLessThan(0.5);
  });

  it('clusters into regions rather than dithering cell by cell', () => {
    /*
     * The test that matters: a lake must be a lake. Terrain hashed per cell would give
     * a neighbour agreement rate near chance; clustered terrain agrees far more often.
     */
    let agree = 0;
    let total = 0;
    for (const h3 of sample(200)) {
      for (const n of gridDisk(h3, 1)) {
        if (n === h3) continue;
        total += 1;
        if (terrainOf(n) === terrainOf(h3)) agree += 1;
      }
    }
    expect(agree / total).toBeGreaterThan(0.55);
  });

  it('frays at the edges — a region is not a solid block of hexagons', () => {
    // Every cell of a region being identical reads as generated, because it is.
    const cells = sample(300);
    const mixed = cells.filter((h3) =>
      gridDisk(h3, 1).some((n) => terrainOf(n) !== terrainOf(h3)),
    );
    expect(mixed.length).toBeGreaterThan(0);
  });
});

describe('claim yield', () => {
  it('pays once for a producing cell', () => {
    const producing = sample().find((h3) => resourceOf(h3) === 'wood') as string;
    expect(addClaimYield(EMPTY_POOL, producing).wood).toBe(CLAIM_YIELD);
  });

  it('pays nothing for plain ground, and returns the pool untouched', () => {
    const plain = sample().find((h3) => resourceOf(h3) === null) as string;
    expect(addClaimYield(EMPTY_POOL, plain)).toBe(EMPTY_POOL);
  });
});

describe('trickle', () => {
  it('pays per producing cell per hour', () => {
    const wood = sample().filter((h3) => resourceOf(h3) === 'wood').slice(0, 3);
    expect(trickle(wood, HOUR).wood).toBe(TRICKLE_PER_HOUR * 3);
  });

  it('pays nothing for plain ground however long it is held', () => {
    const plain = sample().filter((h3) => resourceOf(h3) === null);
    expect(trickle(plain, 100 * HOUR)).toEqual(EMPTY_POOL);
  });

  it('gives whole units only', () => {
    const cells = sample(20);
    const pool = trickle(cells, HOUR / 3);
    expect(Object.values(pool).every(Number.isInteger)).toBe(true);
  });
});

describe('settleResources', () => {
  const owned = sample().filter((h3) => resourceOf(h3) !== null).slice(0, 4);

  it('adds what was earned and moves the clock', () => {
    const next = settleResources({ pool: EMPTY_POOL, since: T0 }, owned, T0 + 2 * HOUR);
    expect(next.since).toBe(T0 + 2 * HOUR);
    expect(next.pool.water + next.pool.wood + next.pool.gold).toBe(TRICKLE_PER_HOUR * 2 * 4);
  });

  it('pays the same whether settled once an hour or every ten minutes', () => {
    /*
     * Settling every ten minutes must pay the same as settling once an hour. Advancing
     * `since` to `now` on every read would round each partial hour down to nothing and
     * a player who kept checking their pouch would never be paid at all.
     */
    let state: ReturnType<typeof settleResources> = { pool: EMPTY_POOL, since: T0 };
    for (let i = 1; i <= 6; i += 1) state = settleResources(state, owned, T0 + i * 10 * 60_000);

    const once = settleResources({ pool: EMPTY_POOL, since: T0 }, owned, T0 + HOUR);
    expect(state.pool).toEqual(once.pool);
  });

  it('is a no-op when the clock has not moved', () => {
    const state = { pool: EMPTY_POOL, since: T0 };
    expect(settleResources(state, owned, T0)).toBe(state);
  });

  it('still moves the clock forward when nothing is producing', () => {
    // Otherwise a player holding only plain ground accrues a debt of hours that is
    // paid out the instant they claim their first lake.
    const plain = sample().filter((h3) => resourceOf(h3) === null).slice(0, 5);
    expect(settleResources({ pool: EMPTY_POOL, since: T0 }, plain, T0 + 5 * HOUR).since).toBe(
      T0 + 5 * HOUR,
    );
  });
});

describe('spending', () => {
  const pool = { water: 30, wood: 10, gold: 5 };

  it('refuses what cannot be paid for', () => {
    expect(canAfford(pool, { wood: 11 })).toBe(false);
    expect(spend(pool, { wood: 11 })).toBeNull();
  });

  it('takes exactly the cost and nothing else', () => {
    expect(spend(pool, { water: 10, gold: 5 })).toEqual({ water: 20, wood: 10, gold: 0 });
  });

  it('allows spending down to nothing but never below', () => {
    expect(canAfford(pool, { gold: 5 })).toBe(true);
    expect(spend(pool, { gold: 6 })).toBeNull();
  });
});
