/**
 * BRDC-KEEP-002 — the Altar through the repository, and what a held place pays.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_POOL, MANA_ANCHOR_RATE } from '@es3/core';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-09-01T12:00:00Z');

let repo: MockRepository;
let store: MemoryStore;

beforeEach(async () => {
  store = new MemoryStore();
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  await store.set('resources', {
    pool: { ...EMPTY_POOL, stone: 500, gold: 500, mana: 100 },
    since: T0,
    sinceDay: T0,
  });
  repo = new MockRepository({ store, newId: () => 'me', seed: 3 });
  await repo.setHome(ORIGIN, T0);
});

const anchor = async () => (await repo.getPlaces()).find((p) => p.kind === 'anchor');

describe('the Altar', () => {
  it('starts as the bare Anchor and lights one step at a time', async () => {
    expect(await anchor()).toMatchObject({ expansion: 0, manaPerHour: MANA_ANCHOR_RATE });

    const r = await repo.raiseAltar(T0);
    expect(r).toEqual({ ok: true, level: 1 });
    const lit = await anchor();
    expect(lit?.expansion).toBe(1);
    expect(lit?.manaPerHour).toBeGreaterThan(MANA_ANCHOR_RATE); // 6 → 9

    // 40 stone + 30 gold for the first step.
    const pool = await repo.getResources(T0);
    expect(pool.stone).toBe(460);
    expect(pool.gold).toBe(470);
  });

  it('caps at level 3', async () => {
    expect((await repo.raiseAltar(T0)).ok).toBe(true);
    expect((await repo.raiseAltar(T0)).ok).toBe(true);
    expect((await repo.raiseAltar(T0)).ok).toBe(true);
    expect(await repo.raiseAltar(T0)).toEqual({ ok: false, refused: 'at-max' });
  });

  it('refuses when the pouch cannot cover the step', async () => {
    await store.set('resources', { pool: { ...EMPTY_POOL, stone: 5 }, since: T0, sinceDay: T0 });
    expect(await repo.raiseAltar(T0)).toEqual({ ok: false, refused: 'cannot-afford' });
  });

  it('a reset takes the Altar with it', async () => {
    await repo.raiseAltar(T0);
    await repo.resetAll();
    expect(await anchor()).toBeUndefined(); // no home, no Anchor
  });
});

describe('what a place pays (PIVOT-2026-09-09 P3)', () => {
  it('pays its rate into mana and wisdom alike, every hour', async () => {
    const before = await repo.getResources(T0);
    const after = await repo.getResources(T0 + 3 * 3_600_000);

    // The Hearth's Anchor is the only place here, so its rate is the whole of both.
    expect(after.mana - before.mana).toBe(3 * MANA_ANCHOR_RATE);
    expect(after.wisdom - before.wisdom).toBe(3 * MANA_ANCHOR_RATE);
  });

  it('raising the Altar raises both, not just the mana it is named for', async () => {
    const base = await repo.getResources(T0);
    await repo.raiseAltar(T0);
    const raised = (await anchor())?.manaPerHour ?? 0;
    expect(raised).toBeGreaterThan(MANA_ANCHOR_RATE);

    const after = await repo.getResources(T0 + 3_600_000);
    expect(after.wisdom - base.wisdom).toBe(raised);
    expect(after.mana - base.mana).toBe(raised);
  });
});
