import { describe, expect, it } from 'vitest';
import { destination } from '../geo/project.js';
import { simulatePolygon, simulateWalk } from '../sim/walk.js';
import type { BBox } from '../types/domain.js';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';

/**
 * BRDC-REGRESSION-000 item 3 — the one v2 could not see.
 *
 * v2 initialised through an event bus. EntitySpawner emitted `entity:spawned` before
 * MapSystem had subscribed, so the shrines were never added to the map. Nothing threw,
 * nothing logged, and the only symptom was an absence: a feature that simply was not
 * there some of the time. It survived for weeks.
 *
 * v3 boots through a plain `await` chain, which is meant to make that impossible. This
 * asserts it a hundred times rather than trusting it once — an ordering bug that fires
 * one run in twenty looks exactly like no bug at all.
 */
const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-08-27T12:00:00Z');

const BOX: BBox = {
  west: ORIGIN.lng - 0.02,
  east: ORIGIN.lng + 0.02,
  south: ORIGIN.lat - 0.02,
  north: ORIGIN.lat + 0.02,
};

function square(sw: { lat: number; lng: number }, side: number) {
  const ne = destination(destination(sw, 0, side), 90, side);
  return [sw, { lat: sw.lat, lng: ne.lng }, ne, { lat: ne.lat, lng: sw.lng }];
}

/** The boot sequence the app runs, in the order it runs it. */
async function boot(seed: number) {
  const repo = new MockRepository({ store: new MemoryStore(), seed });

  const profile = await repo.getProfile();
  const runId = await repo.startRun(T0);
  const trail = simulateWalk({
    start: ORIGIN,
    pattern: 'straight',
    durationMs: 120_000,
    startTime: T0,
    seed,
  });
  await repo.submitTrail(runId, trail);

  return {
    repo,
    profile,
    runId,
    active: await repo.getActiveRun(),
    points: await repo.getTrailPoints(runId),
    cells: await repo.getCells(BOX, T0),
  };
}

describe('boot is deterministic — nothing goes missing', () => {
  it('produces a complete world a hundred times running', async () => {
    for (let i = 0; i < 100; i++) {
      const state = await boot(1000 + i);

      // Every one of these was silently absent in v2 at least once.
      expect(state.profile.id, `run ${i}: no profile`).toBeTruthy();
      expect(state.profile.level, `run ${i}: level not derived`).toBe(1);
      expect(state.active?.id, `run ${i}: run did not survive its own creation`).toBe(state.runId);
      expect(state.points.length, `run ${i}: trail empty`).toBeGreaterThan(0);
      expect(state.cells.length, `run ${i}: neighbours never spawned`).toBeGreaterThan(20);
    }
  });

  it('spawns the same world for the same seed, every time', async () => {
    const a = await boot(4242);
    const b = await boot(4242);

    expect(b.cells.map((c) => c.h3).sort()).toEqual(a.cells.map((c) => c.h3).sort());
    expect(b.points).toEqual(a.points);
  });

  it('never seeds twice, however the boot is interleaved', async () => {
    // The v2 failure mode in reverse: not a listener that missed an event, but an
    // event fired twice because two paths both thought they owned it.
    for (let i = 0; i < 25; i++) {
      const repo = new MockRepository({ store: new MemoryStore(), seed: 500 + i });
      const runId = await repo.startRun(T0);
      const trail = simulateWalk({
        start: ORIGIN,
        pattern: 'curve',
        durationMs: 120_000,
        startTime: T0,
        seed: i,
      });

      // Submit in overlapping halves, as a flaky network or a busy phone would.
      const half = Math.floor(trail.length / 2);
      await Promise.all([
        repo.submitTrail(runId, trail.slice(0, half)),
        repo.submitTrail(runId, trail.slice(half)),
      ]);

      const cells = await repo.getCells(BOX, T0);
      const unique = new Set(cells.map((c) => c.h3));
      expect(unique.size, `run ${i}: duplicate cells`).toBe(cells.length);
    }
  });

  it('claims the same ground for the same walk, every time', async () => {
    // Claiming is the part where an ordering slip would be most expensive and least
    // visible: a lap that yields eleven cells one run and nine the next.
    const lap = simulatePolygon(square(ORIGIN, 140), { seed: 9, noiseM: 2, startTime: T0 });
    const counts = new Set<number>();

    for (let i = 0; i < 25; i++) {
      const repo = new MockRepository({ store: new MemoryStore(), seed: 77 });
      const runId = await repo.startRun(T0);
      await repo.submitTrail(runId, lap);
      const result = await repo.closeLoop(runId, T0 + 600_000);

      expect(result.closed, `run ${i}: the lap did not close`).toBe(true);
      if (result.closed) counts.add(result.outcomes.length);
    }

    expect(counts.size, `the same lap yielded ${[...counts].join('/')} cells`).toBe(1);
  });
});
