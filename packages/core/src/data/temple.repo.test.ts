/**
 * BRDC-TEMPLE-001 — consecrating a temple with resources, through the repository.
 *
 * The rule maths (`consecrateCost`) is unit-tested in `rules/mana.test.ts`. This is the
 * store seam: ownership and Hearth guards, the pouch being charged, and the consecrated
 * cell being a temple everywhere — a Place with a mana rate — the moment it is paid for.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_POOL, TEMPLE_THRESHOLD_MS, cellAt, consecrateCost } from '@es3/core';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-09-01T12:00:00Z');
const HOUR = 3_600_000;

/** A repo with a Hearth and one plain owned cell — claimed, but no time spent in it. */
async function repoWithGround() {
  const store = new MemoryStore();
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  const repo = new MockRepository({ store, newId: () => 'me', seed: 3 });
  await repo.setHome(ORIGIN, T0);

  const g = cellAt({ lat: ORIGIN.lat + 0.01, lng: ORIGIN.lng + 0.01 });
  await store.set(K.cell(g), {
    h3: g,
    ownerId: 'me',
    strength: 300,
    lastVisitedAt: T0,
    visitDays: [],
  });
  return { repo, store, g };
}

const fund = (store: MemoryStore, pool: Partial<typeof EMPTY_POOL>) =>
  store.set('resources', { pool: { ...EMPTY_POOL, ...pool }, since: T0, sinceDay: T0 });

describe('consecrating a temple (BRDC-TEMPLE-001)', () => {
  let repo: MockRepository;
  let store: MemoryStore;
  let ground: string;

  beforeEach(async () => {
    ({ repo, store, g: ground } = await repoWithGround());
  });

  it('turns paid ground into a temple with a mana rate', async () => {
    await fund(store, { stone: 500, gold: 500 });
    expect(await repo.consecrateTemple(ground, T0)).toEqual({ ok: true });

    const place = (await repo.getPlaces()).find((p) => p.h3 === ground);
    expect(place?.kind).toBe('temple');
    expect(place?.manaPerHour).toBeGreaterThan(0);
  });

  it('charges stone and gold from the pouch', async () => {
    await fund(store, { stone: 500, gold: 500 });
    const cost = consecrateCost(0);
    await repo.consecrateTemple(ground, T0);

    const pool = await repo.getResources(T0);
    expect(pool.stone).toBe(500 - (cost.stone ?? 0));
    expect(pool.gold).toBe(500 - (cost.gold ?? 0));
  });

  it('makes the new temple produce mana over the following hours', async () => {
    await fund(store, { stone: 500, gold: 500 });
    await repo.consecrateTemple(ground, T0);
    expect((await repo.getResources(T0 + 12 * HOUR)).mana).toBeGreaterThan(0);
  });

  it('refuses, and spends nothing, when the pouch cannot pay', async () => {
    await fund(store, { stone: 5, gold: 5 });
    expect(await repo.consecrateTemple(ground, T0)).toEqual({
      ok: false,
      refused: 'cannot-afford',
    });
    expect((await repo.getResources(T0)).stone).toBe(5);
    expect((await repo.getPlaces()).some((p) => p.h3 === ground)).toBe(false);
  });

  it('refuses the Hearth — it is already the Anchor', async () => {
    await fund(store, { stone: 500, gold: 500 });
    const home = (await repo.getHome()) as string;
    expect(await repo.consecrateTemple(home, T0)).toEqual({ ok: false, refused: 'is-hearth' });
  });

  it('refuses ground the player does not hold', async () => {
    await fund(store, { stone: 500, gold: 500 });
    const elsewhere = cellAt({ lat: ORIGIN.lat - 0.05, lng: ORIGIN.lng - 0.05 });
    expect(await repo.consecrateTemple(elsewhere, T0)).toEqual({
      ok: false,
      refused: 'not-yours',
    });
  });

  it('refuses a cell that is already a revealed place', async () => {
    await fund(store, { stone: 500, gold: 500 });
    await store.set(K.dwell, { [ground]: TEMPLE_THRESHOLD_MS + 60_000 });
    expect(await repo.consecrateTemple(ground, T0)).toEqual({
      ok: false,
      refused: 'already-a-place',
    });
  });

  it('discounts the price by the dwell already banked, and is free at the threshold', async () => {
    await store.set(K.dwell, { [ground]: TEMPLE_THRESHOLD_MS / 2 });
    const half = consecrateCost(TEMPLE_THRESHOLD_MS / 2);
    await fund(store, { stone: half.stone ?? 0, gold: half.gold ?? 0 });

    expect(await repo.consecrateTemple(ground, T0)).toEqual({ ok: true });
    const pool = await repo.getResources(T0);
    expect(pool.stone).toBe(0);
    expect(pool.gold).toBe(0);
    expect((await repo.getPlaces()).find((p) => p.h3 === ground)?.kind).toBe('temple');
  });
});
