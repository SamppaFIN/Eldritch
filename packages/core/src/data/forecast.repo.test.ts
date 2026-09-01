/**
 * BRDC-STATS-001 — the forecast is what the pouch actually earns, not a re-derived guess.
 */
import { describe, expect, it } from 'vitest';
import { BASE_STORAGE_CAP, EMPTY_POOL, cellAt } from '@es3/core';
import type { ResourcePool } from '@es3/core';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const HOUR = 3_600_000;

async function producingRepo(pool: Partial<ResourcePool>, visitedAt: number, now: number) {
  const store = new MemoryStore();
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  await store.set('resources', { pool: { ...EMPTY_POOL, ...pool }, since: now, sinceDay: now });
  const repo = new MockRepository({ store, newId: () => 'me', seed: 3 });
  await repo.setHome(ORIGIN, now);

  // Two held forest cells — the terrain trickle, resolved so it does not depend on the hash.
  for (const d of [0.001, -0.001]) {
    const h = cellAt({ lat: ORIGIN.lat + d, lng: ORIGIN.lng });
    await store.set(K.cell(h), {
      h3: h,
      ownerId: 'me',
      strength: 300,
      lastVisitedAt: visitedAt,
      visitDays: [],
      terrain: { kind: 'forest', source: 'tiles' },
    });
  }
  return repo;
}

describe('forecastRates through the repository', () => {
  const T0 = Date.parse('2026-09-01T12:00:00Z');

  it('the per-hour forecast times N is exactly what N hours of settling pays', async () => {
    const repo = await producingRepo({}, T0, T0);
    const f = await repo.getForecast(T0);
    expect(f.perHour.wood).toBeGreaterThan(0);

    const start = (await repo.getResources(T0)).wood;
    const after5 = (await repo.getResources(T0 + 5 * HOUR)).wood;
    expect(after5 - start).toBe((f.perHour.wood ?? 0) * 5);
  });

  it('the per-day forecast is exactly what a day of settling pays', async () => {
    const repo = await producingRepo({}, T0, T0);
    const f = await repo.getForecast(T0);

    const start = (await repo.getResources(T0)).wood;
    const afterDay = (await repo.getResources(T0 + 24 * HOUR)).wood;
    expect(afterDay - start).toBe(f.perDay.wood ?? 0);
  });

  it('a resource at the storage ceiling forecasts nothing', async () => {
    const repo = await producingRepo({ wood: BASE_STORAGE_CAP }, T0, T0);
    expect((await repo.getForecast(T0)).perHour.wood ?? 0).toBe(0);
  });

  it('the dark time is in the forecast', async () => {
    const winterNow = Date.parse('2026-12-21T12:00:00Z');
    const summer = await (await producingRepo({}, T0, T0)).getForecast(T0);
    const winter = await (await producingRepo({}, winterNow, winterNow)).getForecast(winterNow);
    expect(winter.perHour.wood).toBeLessThan(summer.perHour.wood as number);
    expect(winter.perHour.wood).toBeGreaterThan(0);
  });
});
