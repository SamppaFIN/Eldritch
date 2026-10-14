/** BRDC-IDENTITY-001 — a recovered id keeps this phone's realm yours. */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { adoptIdentity } from './identityStore.js';
import { cellAt, cellsWithin } from '../geo/cells.js';
import type { Cell, PlayerProfile } from '../types/domain.js';

const T0 = Date.parse('2026-10-14T09:00:00Z');
const [a, b, c] = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 1) as [string, string, string];
const cell = (h3: string, ownerId: string): Cell => ({ h3, ownerId, strength: 140, lastVisitedAt: T0, visitDays: [], buildings: [{ id: 'farm', builtAt: T0 }] });

describe('adopting a recovered identity', () => {
  it('rewrites your cells to the new id, leaves rivals alone, and keeps everything else', async () => {
    const store = new MemoryStore();
    await store.set<PlayerProfile>(K.profile, { id: 'old', name: 'Wanderer', colorHue: 1, level: 3, xp: 120, mode: 'adventure' });
    await store.set(K.cell(a), cell(a, 'old'));
    await store.set(K.cell(b), cell(b, 'old'));
    await store.set(K.cell(c), cell(c, 'rival'));

    expect(await adoptIdentity(store, 'recovered', 'Infinite')).toBe(2);
    expect(await store.get(K.profile)).toEqual({ id: 'recovered', name: 'Infinite', colorHue: 1, level: 3, xp: 120, mode: 'adventure' });
    expect(await store.get(K.cell(a))).toEqual(cell(a, 'recovered'));
    expect(await store.get(K.cell(c))).toEqual(cell(c, 'rival'));
  });

  it('keeps the old name when the recovered one is empty', async () => {
    const store = new MemoryStore();
    await store.set<PlayerProfile>(K.profile, { id: 'old', name: 'Wanderer', colorHue: 1, level: 1, xp: 0, mode: 'adventure' });
    await adoptIdentity(store, 'new', '  ');
    expect((await store.get<PlayerProfile>(K.profile))?.name).toBe('Wanderer');
  });
});
