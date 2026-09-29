import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { heirloomApi } from './heirloomStore.js';
import { keepApi } from './citizenStore.js';
import { resetForSeason } from './seasonReset.js';
import { settlePouch } from './pouch.js';
import { K } from './keys.js';

const T0 = Date.parse('2026-10-01T12:00:00Z');

describe('the heirloom crosses once (BRDC-SEASON-006)', () => {
  it('survives the season wipe and is spent on the new Keep', async () => {
    const store = new MemoryStore();
    const heirloom = heirloomApi(() => store);
    await heirloom.choose('foundation-stone', 1);
    await resetForSeason(store);
    expect(await heirloom.chosen()).toEqual({ id: 'foundation-stone', fromSeason: 1 });
    await keepApi(() => store, async () => []).found(T0);
    expect(await heirloom.claim(T0)).toBe('foundation-stone');
    expect((await settlePouch(store, [], T0)).keep?.level).toBe(2);
    expect(await heirloom.chosen()).toBeNull();
    expect(await heirloom.claim(T0)).toBeNull();
  });

  it('the Watchman’s Log brings wisdom and Lookouts; Salt of the Shore brings clues', async () => {
    const store = new MemoryStore();
    const heirloom = heirloomApi(() => store);
    await keepApi(() => store, async () => []).found(T0);
    await heirloom.choose('watchmans-log', 1);
    await heirloom.claim(T0);
    expect(await store.get(K.lore)).toEqual(['lookouts']);
    expect((await settlePouch(store, [], T0)).pool.wisdom).toBeGreaterThanOrEqual(60);
    await heirloom.choose('salt-of-the-shore', 1);
    await heirloom.claim(T0);
    expect((await store.get<{ clues: number }>(K.investigator))?.clues).toBe(3);
  });
});
