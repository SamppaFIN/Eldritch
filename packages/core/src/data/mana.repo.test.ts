/**
 * BRDC-MANA-001 — mana and temple expansion through the repository.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { BASE_STORAGE_CAP, EMPTY_POOL, TEMPLE_THRESHOLD_MS, cellAt } from '@es3/core';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-09-01T12:00:00Z');
const HOUR = 3_600_000;

/**
 * A repo with a Hearth (the Anchor) and one held cell dwelt past the temple threshold —
 * a real revealed temple to expand and draw mana from.
 */
async function templeRepo() {
  const store = new MemoryStore();
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  const repo = new MockRepository({ store, newId: () => 'me', seed: 3 });
  await repo.setHome(ORIGIN, T0);

  const t = cellAt({ lat: ORIGIN.lat + 0.01, lng: ORIGIN.lng + 0.01 });
  await store.set(K.cell(t), {
    h3: t,
    ownerId: 'me',
    strength: 300,
    lastVisitedAt: T0,
    visitDays: [],
  });
  await store.set(K.dwell, { [t]: TEMPLE_THRESHOLD_MS + 60_000 });
  return { repo, store, t };
}

describe('mana and temple expansion', () => {
  let repo: MockRepository;
  let store: MemoryStore;
  let temple: string;

  beforeEach(async () => {
    ({ repo, store, t: temple } = await templeRepo());
  });

  it('getPlaces carries a mana rate and an expansion level', async () => {
    const places = await repo.getPlaces();
    const t = places.find((p) => p.h3 === temple);
    expect(t?.kind).toBe('temple');
    expect(t?.expansion).toBe(0);
    expect(t?.manaPerHour).toBeGreaterThan(0);
  });

  it('mana accrues from the Anchor and the temples the player holds', async () => {
    await store.set('resources', { pool: { ...EMPTY_POOL }, since: T0, sinceDay: T0 });
    expect((await repo.getResources(T0 + 12 * HOUR)).mana).toBeGreaterThan(0);
  });

  it('mana obeys the pouch ceiling (BRDC-ECON-001)', async () => {
    await store.set('resources', {
      pool: { ...EMPTY_POOL, mana: BASE_STORAGE_CAP - 5 },
      since: T0,
      sinceDay: T0,
    });
    // Forty awake hours would add hundreds; the cap pins it.
    expect((await repo.getResources(T0 + 40 * HOUR)).mana).toBe(BASE_STORAGE_CAP);
  });

  it('expands a revealed temple, spends stone and gold, and the level sticks', async () => {
    await store.set('resources', {
      pool: { ...EMPTY_POOL, stone: 999, gold: 999 },
      since: T0,
      sinceDay: T0,
    });

    expect(await repo.expandTemple(temple, T0)).toMatchObject({ ok: true, level: 1 });
    expect((await repo.getResources(T0)).stone).toBe(999 - 40);

    // The second call sees the persisted level 1 and moves to 2.
    expect(await repo.expandTemple(temple, T0)).toMatchObject({ ok: true, level: 2 });
  });

  it('a higher expansion produces more mana per hour', async () => {
    await store.set('resources', {
      pool: { ...EMPTY_POOL, stone: 999, gold: 999 },
      since: T0,
      sinceDay: T0,
    });
    const before = (await repo.getPlaces()).find((p) => p.h3 === temple)?.manaPerHour ?? 0;
    await repo.expandTemple(temple, T0);
    const after = (await repo.getPlaces()).find((p) => p.h3 === temple)?.manaPerHour ?? 0;
    expect(after).toBeGreaterThan(before);
  });

  it('refuses to expand the Anchor — it is not a build target', async () => {
    const home = await repo.getHome();
    expect(await repo.expandTemple(home as string, T0)).toEqual({
      ok: false,
      refused: 'not-a-temple',
    });
  });

  it('refuses when the pouch cannot pay, leaving it untouched', async () => {
    await store.set('resources', { pool: { ...EMPTY_POOL, stone: 5 }, since: T0, sinceDay: T0 });
    expect(await repo.expandTemple(temple, T0)).toEqual({ ok: false, refused: 'cannot-afford' });
    expect((await repo.getResources(T0)).stone).toBe(5);
  });
});
