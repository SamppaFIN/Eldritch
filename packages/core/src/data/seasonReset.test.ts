import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { FOREVER_KEYS, resetForSeason } from './seasonReset.js';

describe('resetForSeason', () => {
  it('wipes the season and keeps what stays forever', async () => {
    const store = new MemoryStore();
    await store.set(K.hallOfFame, [{ name: 'Surreal Kingdom' }]);
    await store.set(K.profile, { id: 'me' });
    await store.set(K.cell('8b112492eb03fff'), { h3: '8b112492eb03fff' });
    await resetForSeason(store);
    expect(await store.keys()).toEqual([...FOREVER_KEYS]);
    expect(await store.get(K.hallOfFame)).toEqual([{ name: 'Surreal Kingdom' }]);
  });

  it('writes nothing back for a forever key that was never set', async () => {
    const store = new MemoryStore();
    await store.set(K.profile, { id: 'me' });
    await resetForSeason(store);
    expect(await store.keys()).toEqual([]);
  });
});
