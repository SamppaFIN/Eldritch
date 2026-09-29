/**
 * BRDC-HEARTH-003 — paying food to push the Hearth's border out one ring.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_POOL, HEARTH_FOOD_PER_HEX, cellAt, cellsWithin } from '@es3/core';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';
import type { Cell } from '../types/domain.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-09-24T12:00:00Z');

async function repoWithFood(food: number) {
  const store = new MemoryStore();
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  const repo = new MockRepository({ store, newId: () => 'me', seed: 3 });
  await repo.setHome(ORIGIN, T0);
  await store.set('resources', { pool: { ...EMPTY_POOL, food }, since: T0, sinceDay: T0 });
  const home = cellAt(ORIGIN);
  // The mock seeds rivals near the origin; clear ring 2 so what is under test is only ours.
  const ring2 = cellsWithin(home, 2).filter((h) => !cellsWithin(home, 1).includes(h));
  for (const h of ring2) await store.delete(K.cell(h));
  return { repo, store, home, ring2 };
}

describe('growHearth', () => {
  let repo: MockRepository;
  let store: MemoryStore;
  let ring2: string[];

  beforeEach(async () => {
    ({ repo, store, ring2 } = await repoWithFood(500));
  });

  const fill = (food: number) => store.set('resources', { pool: { ...EMPTY_POOL, food }, since: T0, sinceDay: T0 });

  it('buys as many hexes of the next ring as the food covers', async () => {
    expect(await repo.hearthRing()).toBe(1);
    const r = await repo.growHearth(T0);
    expect(r).toEqual({ ok: true, ring: 1, claimed: 5, already: 0, left: 7 });
    expect(await repo.hearthRing()).toBe(1);
    expect((await repo.getResources(T0)).food).toBe(500 - 5 * HEARTH_FOOD_PER_HEX);
  });

  it('reaches ring 2 when its last hex is bought', async () => {
    await repo.growHearth(T0);
    await fill(500);
    await repo.growHearth(T0);
    await fill(500);
    const last = await repo.growHearth(T0);
    expect(last).toEqual({ ok: true, ring: 2, claimed: 2, already: 10, left: 0 });
    const owned = (await repo.getOwnedCells(T0)).map((c) => c.h3);
    for (const h of ring2) expect(owned).toContain(h);
  });

  it('refuses without the food for one hex, and changes nothing', async () => {
    await fill(HEARTH_FOOD_PER_HEX - 1);
    expect(await repo.growHearth(T0)).toEqual({ ok: false, refused: 'cannot-afford' });
    expect(await repo.hearthRing()).toBe(1);
    expect(await store.get(K.cell(ring2[0] as string))).toBeUndefined();
  });

  it('never takes a rival hex and does not charge for it', async () => {
    const rival = ring2[0] as string;
    const held: Cell = { h3: rival, ownerId: 'them', strength: 200, lastVisitedAt: T0, visitDays: [] };
    await store.set(K.cell(rival), held);
    const r = await repo.growHearth(T0);
    expect(r).toEqual({ ok: true, ring: 1, claimed: 5, already: 1, left: 6 });
    expect((await store.get<Cell>(K.cell(rival)))?.ownerId).toBe('them');
  });

  it('does nothing without a Hearth', async () => {
    const bare = new MockRepository({ store: new MemoryStore(), newId: () => 'me', seed: 3 });
    expect(await bare.growHearth(T0)).toEqual({ ok: false, refused: 'no-hearth' });
  });
});
