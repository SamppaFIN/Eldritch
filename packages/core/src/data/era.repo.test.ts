/** BRDC-ERA-001 — the Age character in the store: waits for a new Age, final once chosen, kept by the Hall. */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { eraApi } from './eraStore.js';
import { readHallOfFame, retireKingdom } from './hallOfFameStore.js';
import type { PlayerProfile } from '../types/domain.js';

const T0 = Date.parse('2026-10-08T12:00:00Z');

describe('eraApi', () => {
  it('refuses until a new Age is entered, then takes one choice per Age', async () => {
    const store = new MemoryStore();
    const api = eraApi(() => store, async () => []);
    expect(await api.choose('merchants', T0)).toEqual({ ok: false, refused: 'none-pending' });
    await store.set(K.lore, ['husbandry', 'woodcraft', 'kindling']);
    expect((await api.view(T0)).pending).toBe(2);
    expect(await api.choose('seers', T0)).toEqual({ ok: true });
    expect(await api.choose('merchants', T0)).toEqual({ ok: false, refused: 'none-pending' });
    const view = await api.view(T0);
    expect(view.pending).toBeNull();
    expect(view.chosen.map((e) => e.id)).toEqual(['seers']);
  });

  it('the Hall keeps the chain through the season wipe', async () => {
    const store = new MemoryStore();
    await store.set(K.eras, ['merchants', 'seers']);
    await retireKingdom(store, { id: 'me', name: 'Infinite', xp: 0 } as PlayerProfile, [], T0, () => 'k1');
    expect((await readHallOfFame(store))[0]?.eras).toBe('Merchants → Seers');
    expect(await store.get(K.eras)).toBeUndefined();
  });
});
