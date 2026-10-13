/**
 * BRDC-MIND-001 — from Enlightened (level 15), one Ward a day costs nothing.
 */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { freeWardReady, wardAt } from './wardStore.js';
import { EMPTY_POOL } from '../rules/terrain.js';
import { cellAt } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-13T09:00:00Z');
const H3 = cellAt({ lat: 61.4729, lng: 23.7258 });
const cell: Cell = { h3: H3, ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [] };

async function emptyPouch(): Promise<MemoryStore> {
  const store = new MemoryStore();
  await store.set(K.cell(H3), cell);
  await store.set('resources', { pool: { ...EMPTY_POOL }, since: T0, sinceDay: T0 });
  return store;
}

describe('the free Ward', () => {
  it('wards once a day with an empty pouch at Enlightened, and only once', async () => {
    const store = await emptyPouch();
    expect(await freeWardReady(store, 15, T0)).toBe(true);
    expect(await wardAt(store, H3, 'me', [cell], T0, 15)).toMatchObject({ warded: true });
    expect(await freeWardReady(store, 15, T0)).toBe(false);
    expect(await wardAt(store, H3, 'me', [cell], T0 + 60_000, 15)).toEqual({ warded: false, refused: 'cannot-afford' });
    // The next UTC day brings it back.
    expect(await freeWardReady(store, 15, T0 + 24 * 3_600_000)).toBe(true);
  });

  it('is not there below Enlightened', async () => {
    const store = await emptyPouch();
    expect(await freeWardReady(store, 14, T0)).toBe(false);
    expect(await wardAt(store, H3, 'me', [cell], T0, 14)).toEqual({ warded: false, refused: 'cannot-afford' });
  });
});
