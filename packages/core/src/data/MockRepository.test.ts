import { cellToLatLng } from 'h3-js';
import { beforeEach, describe, expect, it } from 'vitest';
import { haversine } from '../geo/haversine.js';
import { destination } from '../geo/project.js';
import { MAX_ACCURACY_M, MIN_POINT_INTERVAL_MS } from '../rules/constants.js';
import { simulateWalk } from '../sim/walk.js';
import type { BBox, TrailPoint } from '../types/domain.js';
import { MockRepository } from './MockRepository.js';
import { SEED_NEIGHBOURS } from './seed.js';
import { MemoryStore } from './kv.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = 1_760_000_000_000;

/** Deterministic ids, so a failing test names the same run every time. */
function makeRepo(seed = 1) {
  let n = 0;
  return new MockRepository({
    store: new MemoryStore(),
    newId: () => `id-${++n}`,
    seed,
  });
}

function walk(durationMs = 300_000): TrailPoint[] {
  return simulateWalk({
    start: ORIGIN,
    pattern: 'straight',
    durationMs,
    startTime: T0,
    seed: 77,
  });
}

const around = (centre: { lat: number; lng: number }, km: number): BBox => ({
  west: centre.lng - km / 50,
  east: centre.lng + km / 50,
  south: centre.lat - km / 111,
  north: centre.lat + km / 111,
});

let repo: MockRepository;
beforeEach(() => {
  repo = makeRepo();
});

describe('profile', () => {
  it('creates one on first ask and keeps it', async () => {
    const first = await repo.getProfile();
    expect(first.level).toBe(1);
    expect(first.xp).toBe(0);
    expect(await repo.getProfile()).toEqual(first);
  });

  it('derives level from xp, never stores them independently', async () => {
    const updated = await repo.addXp(1_500);
    expect(updated.xp).toBe(1_500);
    expect(updated.level).toBe(10);
  });

  it('cannot be pushed past the cap', async () => {
    const updated = await repo.addXp(1_000_000);
    expect(updated.level).toBe(20);
  });

  it('will not go below zero xp', async () => {
    expect((await repo.addXp(-100)).xp).toBe(0);
  });
});

describe('run lifecycle', () => {
  it('starts a run and reports it as active', async () => {
    const id = await repo.startRun(T0);
    const run = await repo.getActiveRun();
    expect(run?.id).toBe(id);
    expect(run?.status).toBe('active');
  });

  it('has no active run before one is started', async () => {
    expect(await repo.getActiveRun()).toBeNull();
  });

  it('closes a previous run rather than keeping two open', async () => {
    const first = await repo.startRun(T0);
    const second = await repo.startRun(T0 + 60_000);

    expect((await repo.getActiveRun())?.id).toBe(second);
    expect(await repo.getTrailPoints(first)).toEqual([]);
  });

  it('ends a run and clears the active pointer', async () => {
    const id = await repo.startRun(T0);
    await repo.endRun(id);
    expect(await repo.getActiveRun()).toBeNull();
  });

  it('rejects points for an unknown run', async () => {
    await expect(repo.submitTrail('nope', walk())).rejects.toThrow(/Unknown run/);
  });
});

describe('submitTrail', () => {
  it('stores accepted points and accumulates distance', async () => {
    const id = await repo.startRun(T0);
    const result = await repo.submitTrail(id, walk());

    expect(result.accepted).toBeGreaterThan(10);
    expect(result.distanceM).toBeGreaterThan(100);
    expect(await repo.getTrailPoints(id)).toHaveLength(result.accepted);

    const run = await repo.getActiveRun();
    expect(run?.pointCount).toBe(result.accepted);
    expect(run?.distanceM).toBeCloseTo(result.distanceM, 3);
  });

  it('validates rather than trusting its caller', async () => {
    const id = await repo.startRun(T0);
    const bad: TrailPoint[] = [
      { ...ORIGIN, t: T0, accuracy: MAX_ACCURACY_M + 50 },
      { ...destination(ORIGIN, 0, 40), t: T0 + MIN_POINT_INTERVAL_MS, accuracy: 6 },
      // Same instant as the previous fix: too soon.
      { ...destination(ORIGIN, 0, 80), t: T0 + MIN_POINT_INTERVAL_MS, accuracy: 6 },
    ];
    const result = await repo.submitTrail(id, bad);

    expect(result.accepted).toBe(1);
    expect(new Map(result.rejected.map((r) => [r.reason, r.count]))).toEqual(
      new Map([
        ['accuracy', 1],
        ['interval', 1],
      ]),
    );
  });

  it('carries the last point across separate batches', async () => {
    const id = await repo.startRun(T0);
    const points = walk();
    const half = Math.floor(points.length / 2);

    const a = await repo.submitTrail(id, points.slice(0, half));
    const b = await repo.submitTrail(id, points.slice(half));

    // If `previous` were dropped between batches, the first point of the second
    // batch would be accepted unconditionally and the trail would gain a free jump.
    expect(await repo.getTrailPoints(id)).toHaveLength(a.accepted + b.accepted);
    const stored = await repo.getTrailPoints(id);
    for (let i = 1; i < stored.length; i++) {
      expect((stored[i] as TrailPoint).t).toBeGreaterThan((stored[i - 1] as TrailPoint).t);
    }
  });

  it('survives an empty batch', async () => {
    const id = await repo.startRun(T0);
    const result = await repo.submitTrail(id, []);
    expect(result).toEqual({ accepted: 0, rejected: [], distanceM: 0 });
  });
});

describe('seeded neighbours', () => {
  it('appear once the game knows where the player is', async () => {
    expect(await repo.getCells(around(ORIGIN, 5), T0)).toEqual([]);

    const id = await repo.startRun(T0);
    await repo.submitTrail(id, walk());

    const cells = await repo.getCells(around(ORIGIN, 5), T0);
    expect(cells.length).toBeGreaterThan(30);
  });

  it('are three distinct rivals, none of them the player', async () => {
    const me = await repo.getProfile();
    const id = await repo.startRun(T0);
    await repo.submitTrail(id, walk());

    const owners = new Set((await repo.getCells(around(ORIGIN, 5), T0)).map((c) => c.ownerId));
    expect(owners).toEqual(new Set(SEED_NEIGHBOURS.map((n) => n.id)));
    expect(owners.has(me.id)).toBe(false);
  });

  it('seed only once, however many batches arrive', async () => {
    const id = await repo.startRun(T0);
    await repo.submitTrail(id, walk());
    const first = (await repo.getCells(around(ORIGIN, 5), T0)).length;

    await repo.submitTrail(id, walk(600_000));
    expect((await repo.getCells(around(ORIGIN, 5), T0)).length).toBe(first);
  });

  it('place territory relative to the player, not at fixed coordinates', async () => {
    const elsewhere = { lat: -33.8688, lng: 151.2093 }; // Sydney
    const other = makeRepo();
    const id = await other.startRun(T0);
    await other.submitTrail(
      id,
      simulateWalk({ start: elsewhere, pattern: 'straight', durationMs: 300_000, startTime: T0 }),
    );

    const cells = await other.getCells(around(elsewhere, 5), T0);
    expect(cells.length).toBeGreaterThan(30);
  });

  it('put one rival close enough to reach on a first walk', async () => {
    const id = await repo.startRun(T0);
    await repo.submitTrail(id, walk());

    const cells = await repo.getCells(around(ORIGIN, 5), T0);
    const nearest = Math.min(
      ...cells.map((c) => haversine(ORIGIN, centreOf(c.h3))),
    );
    expect(nearest).toBeLessThan(400);
  });

  it('vary in strength, so some territory is soft and some is not', async () => {
    const id = await repo.startRun(T0);
    await repo.submitTrail(id, walk());

    const strengths = (await repo.getCells(around(ORIGIN, 5), T0)).map((c) => c.strength);
    expect(Math.min(...strengths)).toBeLessThan(150);
    expect(Math.max(...strengths)).toBeGreaterThan(400);
  });

  it('are deterministic for a seed', async () => {
    const a = makeRepo(4242);
    const b = makeRepo(4242);
    for (const r of [a, b]) {
      const id = await r.startRun(T0);
      await r.submitTrail(id, walk());
    }
    expect(await a.getCells(around(ORIGIN, 5), T0)).toEqual(
      await b.getCells(around(ORIGIN, 5), T0),
    );
  });
});

describe('viewport and ownership queries', () => {
  it('returns nothing for a bbox on the other side of the world', async () => {
    const id = await repo.startRun(T0);
    await repo.submitTrail(id, walk());
    expect(await repo.getCells(around({ lat: -33.8, lng: 151.2 }, 5), T0)).toEqual([]);
  });

  it('reports no owned cells before the player has claimed anything', async () => {
    const id = await repo.startRun(T0);
    await repo.submitTrail(id, walk());
    expect(await repo.getOwnedCells(T0)).toEqual([]);
  });
});

describe('not yet implemented, and honest about it', () => {
  it('closeLoop reports "not closed" until BRDC-CLAIM-005', async () => {
    const id = await repo.startRun(T0);
    await repo.submitTrail(id, walk());
    expect(await repo.closeLoop(id, T0)).toEqual({ closed: false });
  });

  it('runDecay is a no-op until BRDC-CLAIM-004', async () => {
    expect(await repo.runDecay(T0)).toEqual({ weakened: [], released: [] });
  });
});

describe('resetAll', () => {
  it('clears everything, including the seed flag', async () => {
    const id = await repo.startRun(T0);
    await repo.submitTrail(id, walk());
    await repo.addXp(500);

    await repo.resetAll();

    expect(await repo.getActiveRun()).toBeNull();
    expect(await repo.getCells(around(ORIGIN, 5), T0)).toEqual([]);
    expect((await repo.getProfile()).xp).toBe(0);
  });
});

/** Local helper so the test does not depend on a repository internal. */
function centreOf(h3: string): { lat: number; lng: number } {
  const [lat, lng] = cellToLatLng(h3);
  return { lat, lng };
}
