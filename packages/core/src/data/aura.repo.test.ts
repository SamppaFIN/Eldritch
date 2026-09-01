/**
 * BRDC-BUILD-003 — area auras and loyalty, driven through the repository.
 */
import { describe, expect, it } from 'vitest';
import { EMPTY_POOL, TEMPLE_THRESHOLD_MS, cellAt, neighboursOf } from '@es3/core';
import type { ResourcePool } from '@es3/core';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-09-01T12:00:00Z');
const HOUR = 3_600_000;
const GRACE = 48 * HOUR;
const FAR = cellAt({ lat: 61.51, lng: 23.79 });

async function repoWith(pool: Partial<ResourcePool>, researched: string[] = []) {
  const store = new MemoryStore();
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  await store.set('resources', { pool: { ...EMPTY_POOL, ...pool }, since: T0, sinceDay: T0 });
  await store.set('researched', researched);
  const repo = new MockRepository({ store, newId: () => 'me', seed: 3 });
  const home = await repo.setHome(ORIGIN, T0);
  return { repo, store, home };
}

/** Seed a cell the player already holds. */
async function own(store: MemoryStore, h3: string) {
  await store.set(K.cell(h3), { h3, ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [] });
}

describe('area auras through the repository', () => {
  it('a Library beside a temple pours wisdom into the domain', async () => {
    const { repo, store } = await repoWith({ stone: 999, culture: 999 }, ['astronomy']);
    const temple = cellAt({ lat: ORIGIN.lat + 0.01, lng: ORIGIN.lng + 0.01 });
    await own(store, temple);
    await store.set(K.dwell, { [temple]: TEMPLE_THRESHOLD_MS + 60_000 });

    expect(await repo.build(temple, 'library', T0)).toMatchObject({ ok: true });
    expect((await repo.getResources(T0 + 6 * HOUR)).wisdom).toBeGreaterThan(0);
  });

  it('a Library with no temple nearby is refused by name', async () => {
    const { repo, store } = await repoWith({ stone: 999, culture: 999 }, ['astronomy']);
    await own(store, FAR);
    expect(await repo.build(FAR, 'library', T0)).toEqual({ ok: false, refused: 'needs-a-temple' });
  });

  it('a Monument makes the ground beside it decay slower, not never', async () => {
    const { repo, store, home } = await repoWith({ stone: 999, culture: 999 });
    const beside = neighboursOf(home)[0] as string;
    await own(store, beside);
    expect(await repo.build(beside, 'monument', T0)).toMatchObject({ ok: true });

    const bare = (await repoWith({})).repo;
    const at = T0 + GRACE + 72 * HOUR;
    const loyal = (await repo.getOwnedCells(at)).find((c) => c.h3 === home);
    const exposed = (await bare.getOwnedCells(at)).find((c) => c.h3 === home);

    expect(loyal && exposed).toBeTruthy();
    expect((loyal as { strength: number }).strength).toBeGreaterThan(
      (exposed as { strength: number }).strength,
    );
    // Slower, not stopped: it has still lost ground.
    expect((loyal as { strength: number }).strength).toBeLessThan(100);
  });
});
