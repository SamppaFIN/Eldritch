import { describe, expect, it } from 'vitest';
import { gridDisk } from 'h3-js';
import { cellAt } from '../geo/cells.js';
import { destination } from '../geo/project.js';
import { DECAY_GRACE_HOURS } from './constants.js';
import {
  BASE_STORAGE_CAP,
  CLAIM_YIELD,
  EMPTY_POOL,
  RESOURCE_KINDS,
  TERRAIN_TABLE,
  TRICKLE_PER_HOUR,
  addClaimYield,
  canAfford,
  resourceForCell,
  resourceOf,
  settleResources,
  spend,
  terrainFromTiles,
  terrainOf,
  trickle,
} from './terrain.js';
import type { Cell } from '../types/domain.js';
import type { ResourcePool, TerrainKind } from './terrain.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const HERE = cellAt(ORIGIN);
const T0 = Date.parse('2026-08-28T09:00:00Z');
const HOUR = 3_600_000;
const GRACE_MS = DECAY_GRACE_HOURS * HOUR;

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

/** Minimal cells for trickle/settleResources, which only ever look at h3 and lastVisitedAt. */
function cellsAt(h3s: readonly string[], lastVisitedAt = T0): Cell[] {
  return h3s.map((h3) => ({ h3, ownerId: 'me', strength: 100, lastVisitedAt, visitDays: [] }));
}

/** Sum across every resource, so a test does not have to name each of the nine fields. */
const total = (p: ResourcePool) => RESOURCE_KINDS.reduce((sum, k) => sum + p[k], 0);

const kindOf = (h3: string): TerrainKind => terrainOf(h3).kind;

describe('terrainOf', () => {
  it('is the same every time it is asked', () => {
    expect(terrainOf(HERE)).toEqual(terrainOf(HERE));
  });

  it('always reports its source as the hash', () => {
    expect(sample(50).every((h3) => terrainOf(h3).source === 'hash')).toBe(true);
  });

  it('produces every kind somewhere in a couple of kilometres', () => {
    const kinds = new Set<TerrainKind>(sample(600).map(kindOf));
    expect(kinds).toEqual(
      new Set<TerrainKind>(['plain', 'forest', 'hill', 'mountain', 'lake', 'coast', 'market']),
    );
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
    let total_ = 0;
    for (const h3 of sample(200)) {
      for (const n of gridDisk(h3, 1)) {
        if (n === h3) continue;
        total_ += 1;
        if (kindOf(n) === kindOf(h3)) agree += 1;
      }
    }
    expect(agree / total_).toBeGreaterThan(0.55);
  });

  it('frays at the edges — a region is not a solid block of hexagons', () => {
    // Every cell of a region being identical reads as generated, because it is.
    const cells = sample(300);
    const mixed = cells.filter((h3) => gridDisk(h3, 1).some((n) => kindOf(n) !== kindOf(h3)));
    expect(mixed.length).toBeGreaterThan(0);
  });
});

describe('TERRAIN_TABLE', () => {
  it('has a resource and build sites for every kind', () => {
    const kinds: TerrainKind[] = ['plain', 'forest', 'hill', 'mountain', 'lake', 'coast', 'market'];
    for (const k of kinds) {
      expect(TERRAIN_TABLE[k]).toBeDefined();
      expect(Array.isArray(TERRAIN_TABLE[k].buildSites)).toBe(true);
    }
    expect(TERRAIN_TABLE.plain.resource).toBeNull();
    expect(TERRAIN_TABLE.mountain.resource).toBe('iron');
  });
});

describe('resourceOf / resourceForCell', () => {
  it('gives food for a lake, not a water resource — the pool has no such field', () => {
    const lake = sample(600).find((h3) => kindOf(h3) === 'lake') as string;
    expect(resourceOf(lake)).toBe('food');
  });

  it('prefers a cell\'s stored terrain over the hash', () => {
    const plain = sample().find((h3) => resourceOf(h3) === null) as string;
    const withMine: Cell = {
      h3: plain,
      ownerId: 'me',
      strength: 100,
      lastVisitedAt: T0,
      visitDays: [],
      terrain: { kind: 'mountain', source: 'tiles' },
    };
    expect(resourceForCell(withMine)).toBe('iron');
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
    expect(trickle(cellsAt(wood), HOUR, T0).wood).toBe(TRICKLE_PER_HOUR * 3);
  });

  it('pays nothing for plain ground however long it is held', () => {
    const plain = sample().filter((h3) => resourceOf(h3) === null);
    expect(trickle(cellsAt(plain), 100 * HOUR, T0)).toEqual(EMPTY_POOL);
  });

  it('gives whole units only', () => {
    const cells = sample(20);
    const pool = trickle(cellsAt(cells), HOUR / 3, T0);
    expect(Object.values(pool).every(Number.isInteger)).toBe(true);
  });

  it('pays nothing for a cell that has not been visited within the grace window', () => {
    const wood = sample().find((h3) => resourceOf(h3) === 'wood') as string;
    const stale = cellsAt([wood], T0 - GRACE_MS - HOUR);
    expect(trickle(stale, HOUR, T0)).toEqual(EMPTY_POOL);
  });

  it('pays again the moment a stale cell is walked', () => {
    // Dormancy is read from lastVisitedAt at the instant of the call — a fresh visit
    // is a fresh lastVisitedAt, and production resumes with no separate "wake" step.
    const wood = sample().find((h3) => resourceOf(h3) === 'wood') as string;
    const revisited = cellsAt([wood], T0);
    expect(trickle(revisited, HOUR, T0).wood).toBe(TRICKLE_PER_HOUR);
  });

  it('splits a shared cell by strength at import (BRDC-WAGER-JSON-002)', () => {
    const wood = sample().find((h3) => resourceOf(h3) === 'wood') as string;
    const [c] = cellsAt([wood]);
    const base = trickle([c as Cell], 10 * HOUR, T0).wood;

    const half = trickle(
      [{ ...(c as Cell), shared: { with: 'r', mineAtImport: 100, theirsAtImport: 100 } }],
      10 * HOUR,
      T0,
    ).wood;
    const most = trickle(
      [{ ...(c as Cell), shared: { with: 'r', mineAtImport: 150, theirsAtImport: 50 } }],
      10 * HOUR,
      T0,
    ).wood;

    expect(base).toBe(TRICKLE_PER_HOUR * 10);
    expect(half).toBe(base / 2);
    expect(most).toBe(base * 0.75);
  });

  it('a shared cell with no strength on either side splits evenly, not by zero', () => {
    const wood = sample().find((h3) => resourceOf(h3) === 'wood') as string;
    const [c] = cellsAt([wood]);
    const pool = trickle(
      [{ ...(c as Cell), shared: { with: 'r', mineAtImport: 0, theirsAtImport: 0 } }],
      10 * HOUR,
      T0,
    );
    expect(pool.wood).toBe((TRICKLE_PER_HOUR * 10) / 2);
  });

  it('breaks a strength tie by the days each side has held it (BRDC-WAGER-JSON-006)', () => {
    const wood = sample().find((h3) => resourceOf(h3) === 'wood') as string;
    const [c] = cellsAt([wood]);
    const base = trickle([c as Cell], 10 * HOUR, T0).wood;
    const split = (s: NonNullable<Cell['shared']>) =>
      trickle([{ ...(c as Cell), shared: s }], 10 * HOUR, T0).wood;

    // Strengths equal → 6 of my days to 2 of theirs, three quarters.
    expect(split({ with: 'r', mineAtImport: 100, theirsAtImport: 100, myDays: 6, theirDays: 2 })).toBe(base * 0.75);
    // Strengths differ → days ignored, strength wins (also 3/4 here, from 150 vs 50).
    expect(split({ with: 'r', mineAtImport: 150, theirsAtImport: 50, myDays: 1, theirDays: 9 })).toBe(base * 0.75);
  });
});

describe('settleResources', () => {
  const owned = cellsAt(sample().filter((h3) => resourceOf(h3) !== null).slice(0, 4));

  it('adds what was earned and moves the clock', () => {
    const next = settleResources({ pool: EMPTY_POOL, since: T0 }, owned, T0 + 2 * HOUR);
    expect(next.since).toBe(T0 + 2 * HOUR);
    expect(total(next.pool)).toBe(TRICKLE_PER_HOUR * 2 * 4);
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
    const plain = cellsAt(sample().filter((h3) => resourceOf(h3) === null).slice(0, 5));
    expect(settleResources({ pool: EMPTY_POOL, since: T0 }, plain, T0 + 5 * HOUR).since).toBe(
      T0 + 5 * HOUR,
    );
  });

  it('still moves the clock forward when every producing cell is dormant', () => {
    // Same reasoning as plain ground: nothing is earned right now, so the clock must
    // still advance, or a cell that wakes up later would be paid for the dormant span.
    const stale = cellsAt(
      sample()
        .filter((h3) => resourceOf(h3) !== null)
        .slice(0, 3),
      T0 - GRACE_MS - HOUR,
    );
    const settled = settleResources({ pool: EMPTY_POOL, since: T0 }, stale, T0 + 5 * HOUR);
    expect(settled.since).toBe(T0 + 5 * HOUR);
    expect(total(settled.pool)).toBe(0);
  });

  it('stops paying once a resource hits the storage cap', () => {
    // A long enough span would earn far more than the cap without one — the whole
    // point of BRDC-ECON-001's lock against turning this into an idle game. Settled in
    // daily steps with the cells kept freshly visited each time, so this tests the cap
    // in isolation from dormancy rather than tripping over the 48 h grace window too.
    const wood = sample().filter((h3) => resourceOf(h3) === 'wood').slice(0, 5);
    let state = { pool: EMPTY_POOL, since: T0 };
    let now = T0;
    for (let day = 0; day < 60; day += 1) {
      now += 24 * HOUR;
      state = settleResources(state, cellsAt(wood, now), now);
    }
    expect(state.pool.wood).toBe(BASE_STORAGE_CAP);
  });

  it('never exceeds the cap even starting already close to it', () => {
    const wood = cellsAt(sample().filter((h3) => resourceOf(h3) === 'wood').slice(0, 5));
    const almostFull = { ...EMPTY_POOL, wood: BASE_STORAGE_CAP - 1 };
    const settled = settleResources({ pool: almostFull, since: T0 }, wood, T0 + HOUR);
    expect(settled.pool.wood).toBe(BASE_STORAGE_CAP);
  });

  it('banks past BASE_STORAGE_CAP when a raised cap is passed (BRDC-BUILD-001)', () => {
    const wood = cellsAt(sample().filter((h3) => resourceOf(h3) === 'wood').slice(0, 5));
    const full = { ...EMPTY_POOL, wood: BASE_STORAGE_CAP };
    const raised = BASE_STORAGE_CAP + 250;
    const settled = settleResources({ pool: full, since: T0 }, wood, T0 + HOUR, raised);
    expect(settled.pool.wood).toBeGreaterThan(BASE_STORAGE_CAP);
    expect(settled.pool.wood).toBeLessThanOrEqual(raised);
  });

  it('adds a flat per-hour building bonus, and it counts as production (BRDC-BUILD-001)', () => {
    // A player holding only plain ground plus a Market: no terrain trickle, but the
    // building bonus still pays and still moves the clock.
    const plain = cellsAt(sample().filter((h3) => resourceOf(h3) === null).slice(0, 3));
    const settled = settleResources({ pool: EMPTY_POOL, since: T0 }, plain, T0 + 3 * HOUR, undefined, {
      gold: 2,
    });
    expect(settled.since).toBe(T0 + 3 * HOUR);
    expect(settled.pool.gold).toBe(6);
  });

  it('pays a per-day bonus one whole day at a time (BRDC-BUILD-002 fishery)', () => {
    const start = { pool: EMPTY_POOL, since: T0, sinceDay: T0 };
    const halfDay = settleResources(start, [], T0 + 12 * HOUR, undefined, undefined, { tokens: 1 });
    expect(halfDay.pool.tokens).toBe(0);
    expect(halfDay.sinceDay).toBe(T0);

    const oneDay = settleResources(start, [], T0 + 24 * HOUR, undefined, undefined, { tokens: 1 });
    expect(oneDay.pool.tokens).toBe(1);
    expect(oneDay.sinceDay).toBe(T0 + 24 * HOUR);
  });

  it('per-day bonus is the same settled hourly or once', () => {
    let hourly: ReturnType<typeof settleResources> = { pool: EMPTY_POOL, since: T0, sinceDay: T0 };
    for (let h = 1; h <= 48; h += 1) {
      hourly = settleResources(hourly, [], T0 + h * HOUR, undefined, undefined, { tokens: 1 });
    }
    const once = settleResources(
      { pool: EMPTY_POOL, since: T0, sinceDay: T0 },
      [],
      T0 + 48 * HOUR,
      undefined,
      undefined,
      { tokens: 1 },
    );
    expect(hourly.pool.tokens).toBe(2);
    expect(hourly.pool.tokens).toBe(once.pool.tokens);
  });
});

describe('terrainFromTiles', () => {
  it('reads a lake from a water layer', () => {
    expect(terrainFromTiles([{ sourceLayer: 'water', properties: { class: 'lake' } }])).toBe('lake');
    expect(terrainFromTiles([{ sourceLayer: 'waterway', properties: {} }])).toBe('lake');
  });

  it('reads the coast from ocean water or a coastline', () => {
    expect(terrainFromTiles([{ sourceLayer: 'water', properties: { class: 'ocean' } }])).toBe('coast');
    expect(terrainFromTiles([{ properties: { natural: 'coastline' } }])).toBe('coast');
  });

  it('reads woodland from land cover or a natural tag', () => {
    expect(terrainFromTiles([{ sourceLayer: 'landcover', properties: { class: 'wood' } }])).toBe('forest');
    expect(terrainFromTiles([{ properties: { natural: 'wood' } }])).toBe('forest');
  });

  it('reads rock as mountain and scrub as hill — tags, not elevation', () => {
    expect(terrainFromTiles([{ properties: { natural: 'peak' } }])).toBe('mountain');
    expect(terrainFromTiles([{ properties: { natural: 'scrub' } }])).toBe('hill');
  });

  it('reads a marketplace or shops as market', () => {
    expect(terrainFromTiles([{ sourceLayer: 'landuse', properties: { class: 'commercial' } }])).toBe('market');
    expect(terrainFromTiles([{ properties: { shop: 'bakery' } }])).toBe('market');
  });

  it('returns null when the tiles say nothing', () => {
    expect(terrainFromTiles([])).toBeNull();
    expect(terrainFromTiles([{ sourceLayer: 'building', properties: {} }])).toBeNull();
  });

  it('checks water before land cover when a feature carries both', () => {
    const shoreline = [
      { sourceLayer: 'landcover', properties: { class: 'wood' } },
      { sourceLayer: 'water', properties: { class: 'ocean' } },
    ];
    expect(terrainFromTiles(shoreline)).toBe('coast');
  });
});

describe('spending', () => {
  const pool: ResourcePool = { ...EMPTY_POOL, food: 30, wood: 10, gold: 5 };

  it('refuses what cannot be paid for', () => {
    expect(canAfford(pool, { wood: 11 })).toBe(false);
    expect(spend(pool, { wood: 11 })).toBeNull();
  });

  it('takes exactly the cost and nothing else', () => {
    expect(spend(pool, { food: 10, gold: 5 })).toEqual({ ...pool, food: 20, gold: 0 });
  });

  it('allows spending down to nothing but never below', () => {
    expect(canAfford(pool, { gold: 5 })).toBe(true);
    expect(spend(pool, { gold: 6 })).toBeNull();
  });
});
