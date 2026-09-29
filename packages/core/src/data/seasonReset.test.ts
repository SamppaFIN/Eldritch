import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { FOREVER_KEYS, resetForSeason } from './seasonReset.js';

describe('resetForSeason', () => {
  it('wipes the season and keeps what stays forever', async () => {
    const store = new MemoryStore();
    await store.set(K.hallOfFame, [{ name: 'Surreal Kingdom' }]);
    await store.set(K.titles, ['Season 2 · Warden of Doors']);
    await store.set(K.profile, { id: 'me' });
    await store.set(K.cell('8b112492eb03fff'), { h3: '8b112492eb03fff' });
    await resetForSeason(store);
    expect(await store.keys()).toEqual([K.hallOfFame, K.titles]);
    expect(FOREVER_KEYS).toContain(K.heirloom);
    expect(await store.get(K.hallOfFame)).toEqual([{ name: 'Surreal Kingdom' }]);
    expect(await store.get(K.titles)).toEqual(['Season 2 · Warden of Doors']);
  });

  it('writes nothing back for a forever key that was never set', async () => {
    const store = new MemoryStore();
    await store.set(K.profile, { id: 'me' });
    await resetForSeason(store);
    expect(await store.keys()).toEqual([]);
  });
});
