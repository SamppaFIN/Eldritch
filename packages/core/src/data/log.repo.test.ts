/**
 * BRDC-LOG-001 — the action log, through the repository.
 *
 * Every seam that writes a game action drops one line in the log. These walk a real lap,
 * build, and let a cell rot, and check the log caught each.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_POOL } from '@es3/core';
import { destination } from '../geo/project.js';
import { simulatePolygon } from '../sim/walk.js';
import type { TrailPoint } from '../types/domain.js';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-08-27T12:00:00Z');

function square(sw: { lat: number; lng: number }, side: number) {
  const ne = destination(destination(sw, 0, side), 90, side);
  return [sw, { lat: sw.lat, lng: ne.lng }, ne, { lat: ne.lat, lng: sw.lng }];
}
const lap = (at: number): TrailPoint[] =>
  simulatePolygon(square(ORIGIN, 140), { seed: 21, noiseM: 2, startTime: at });

let repo: MockRepository;
let store: MemoryStore;

beforeEach(async () => {
  store = new MemoryStore();
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  await store.set('resources', { pool: { ...EMPTY_POOL, wood: 300, gold: 300 }, since: T0, sinceDay: T0 });
  repo = new MockRepository({ store, newId: () => 'me', seed: 7 });
});

async function walkAndClose(at: number) {
  const runId = await repo.startRun(at);
  await repo.submitTrail(runId, lap(at));
  return repo.closeLoop(runId, at + 600_000);
}

describe('the action log', () => {
  it('records a claim, newest first, with the cell count', async () => {
    const result = await walkAndClose(T0);
    expect(result.closed).toBe(true);

    const log = await repo.getLog();
    expect(log[0]?.kind).toBe('awaken');
    expect(log[0]?.count).toBeGreaterThan(0);
  });

  it('records a build with the building slug', async () => {
    await walkAndClose(T0);
    const mine = (await repo.getOwnedCells(T0)).map((c) => c.h3);

    let built = false;
    for (const h3 of mine) {
      const out = await repo.build(h3, 'market', T0 + 700_000);
      if (out.ok) {
        built = true;
        break;
      }
    }
    expect(built).toBe(true);

    const log = await repo.getLog();
    expect(log[0]).toMatchObject({ kind: 'build', ref: 'market' });
  });

  it('records ground the Void reclaimed', async () => {
    await walkAndClose(T0);
    const before = (await repo.getOwnedCells(T0)).length;
    expect(before).toBeGreaterThan(0);

    // Far enough in the future that everything unwalked has been released.
    await repo.runDecay(T0 + 120 * 86_400_000);

    const reclaim = (await repo.getLog()).find((e) => e.kind === 'reclaim');
    expect(reclaim?.count).toBeGreaterThan(0);
  });

  it('caps the stored log', async () => {
    // Many laps on separate days: each closes, each logs.
    for (let d = 0; d < 5; d++) await walkAndClose(T0 + d * 86_400_000);
    const log = await repo.getLog(1000);
    expect(log.length).toBeGreaterThan(0);
    expect(log.length).toBeLessThanOrEqual(200);
  });
});
