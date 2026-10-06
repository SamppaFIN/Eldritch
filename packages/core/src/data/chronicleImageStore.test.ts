/** BRDC-HALL-004 — a retired kingdom's picture is kept, flagged on its entry, and outlives the next season. */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { chronicleImageApi } from './chronicleImageStore.js';
import { readHallOfFame } from './hallOfFameStore.js';
import { resetForSeason } from './seasonReset.js';
import type { HallOfFameEntry } from './hallOfFameStore.js';

const entry = (id: string): HallOfFameEntry => ({
  id, name: 'Infinite', retiredAt: 0, level: 3, xp: 900, cells: 40, areaM2: 86_000,
  population: 12, provinces: 1, achievements: 2, secretSites: 0, wonders: 1, cipherShards: 0,
});

describe('chronicleImageApi', () => {
  it('keeps the picture and marks the Hall entry', async () => {
    const store = new MemoryStore();
    await store.set(K.hallOfFame, [entry('a'), entry('b')]);
    const images = chronicleImageApi(() => store);
    await images.set('a', 'data:image/jpeg;base64,AAAA');
    expect(await images.get('a')).toBe('data:image/jpeg;base64,AAAA');
    expect(await images.get('b')).toBeNull();
    const hall = await readHallOfFame(store);
    expect(hall.find((e) => e.id === 'a')?.image).toBe(true);
    expect(hall.find((e) => e.id === 'b')?.image).toBeUndefined();
  });

  it('ignores a kingdom that is not in the Hall', async () => {
    const store = new MemoryStore();
    const images = chronicleImageApi(() => store);
    await images.set('ghost', 'data:image/jpeg;base64,AAAA');
    expect(await images.get('ghost')).toBeNull();
  });

  it('survives the next season wipe', async () => {
    const store = new MemoryStore();
    await store.set(K.hallOfFame, [entry('a')]);
    const images = chronicleImageApi(() => store);
    await images.set('a', 'data:image/jpeg;base64,AAAA');
    await resetForSeason(store);
    expect(await images.get('a')).toBe('data:image/jpeg;base64,AAAA');
  });
});
