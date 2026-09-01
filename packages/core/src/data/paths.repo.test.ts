/**
 * BRDC-TRAIL-003 — the walked-path store, driven through the repository.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { PATH_TIERS } from '../rules/constants.js';
import { destination } from '../geo/project.js';
import { simulatePolygon } from '../sim/walk.js';
import type { LatLng, TrailPoint } from '../types/domain.js';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-09-01T12:00:00Z');

function square(sw: LatLng, side: number): LatLng[] {
  const ne = destination(destination(sw, 0, side), 90, side);
  return [sw, { lat: sw.lat, lng: ne.lng }, ne, { lat: ne.lat, lng: sw.lng }];
}

const lap = (at: number): TrailPoint[] =>
  simulatePolygon(square(ORIGIN, 140), { seed: 21, noiseM: 1, startTime: at });

describe('walked paths through the repository', () => {
  let repo: MockRepository;

  beforeEach(async () => {
    const store = new MemoryStore();
    await store.set(SCHEMA_KEY, SCHEMA_VERSION);
    repo = new MockRepository({ store, newId: () => 'me', seed: 7 });
  });

  async function walk(at: number): Promise<void> {
    const runId = await repo.startRun(at);
    await repo.submitTrail(runId, lap(at));
    await repo.closeLoop(runId, at + 600_000);
  }

  it('records where the player walked, as drawable tiered edges', async () => {
    await walk(T0);
    const paths = await repo.getWalkedPaths();
    expect(paths.length).toBeGreaterThan(0);
    expect(paths.every((p) => PATH_TIERS.includes(p.tier))).toBe(true);
    expect(paths[0]?.a).toMatchObject({ lat: expect.any(Number), lng: expect.any(Number) });
  });

  it('a route walked day after day wears past a footpath', async () => {
    for (let d = 0; d < 12; d += 1) await walk(T0 + d * 86_400_000);
    const worst = Math.max(
      ...(await repo.getWalkedPaths()).map((p) => PATH_TIERS.indexOf(p.tier)),
    );
    expect(worst).toBeGreaterThan(0);
  });

  it('closing a loop and starting a new run does not erase the paths', async () => {
    await walk(T0);
    const before = (await repo.getWalkedPaths()).length;
    expect(before).toBeGreaterThan(0);

    await repo.startRun(T0 + 3_600_000); // a fresh run, not a step walked
    expect((await repo.getWalkedPaths()).length).toBe(before);
  });
});
