/**
 * Retiring a kingdom (BRDC-HALL-001) — the snapshot's own numbers, and that the wipe it
 * does really is `resetAll`'s wipe with one key spared.
 */
import { describe, expect, it } from 'vitest';
import { cellAt } from '../geo/cells.js';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { readHallOfFame, retireKingdom, setKingdomStory } from './hallOfFameStore.js';
import type { Cell, PlayerProfile } from '../types/domain.js';

const cell = (lat: number, lng: number): Cell => ({
  h3: cellAt({ lat, lng }),
  ownerId: 'me',
  strength: 100,
  lastVisitedAt: 0,
  visitDays: [],
});

const profile = (xp: number): PlayerProfile => ({
  id: 'me',
  name: 'Pyynikin Poika',
  colorHue: 0,
  level: 1,
  xp,
  mode: 'adventure',
});

describe('readHallOfFame', () => {
  it('is empty for a store nothing has ever retired to', async () => {
    expect(await readHallOfFame(new MemoryStore())).toEqual([]);
  });
});

describe('retireKingdom', () => {
  it('snapshots the figures a walker would recognise as what they built', async () => {
    const store = new MemoryStore();
    const owned = [cell(61.473, 23.726), cell(61.4731, 23.7261), cell(61.673, 23.726)];
    const entry = await retireKingdom(store, profile(1_500), owned, 5_000, () => 'kingdom-1');

    expect(entry.id).toBe('kingdom-1');
    expect(entry.name).toBe('Pyynikin Poika');
    expect(entry.retiredAt).toBe(5_000);
    expect(entry.xp).toBe(1_500);
    expect(entry.cells).toBe(3);
    expect(entry.provinces).toBe(2); // two of the three share a res-6 region
    expect(entry.areaM2).toBeGreaterThan(0);
    expect(entry.population).toBeGreaterThan(0);
    expect(entry.achievements).toBe(0);
    expect(entry.secretSites).toBe(0);
    expect(entry.wonders).toBe(0);
    expect(entry.cipherShards).toBe(0);
  });

  it('counts achievements, finds and shards already on the store', async () => {
    const store = new MemoryStore();
    await store.set(K.achievements, { a: 1, b: 2 });
    await store.set(K.questFinds, ['relic-1']);
    await store.set(K.wonderFinds, { 'shore-idol': { h3: 'x', at: 1 } });
    await store.set(K.cipherShards, [1, 2, 3]);

    const entry = await retireKingdom(store, profile(0), [], 0, () => 'k');
    expect(entry.achievements).toBe(2);
    expect(entry.secretSites).toBe(1);
    expect(entry.wonders).toBe(1);
    expect(entry.cipherShards).toBe(3);
  });

  it('wipes the store exactly as resetAll does, keeping only the archive', async () => {
    const store = new MemoryStore();
    await store.set(K.achievements, { a: 1 });
    await store.set('home', 'some-h3');

    await retireKingdom(store, profile(0), [], 0, () => 'k');

    expect(await store.get(K.achievements)).toBeUndefined();
    expect(await store.get('home')).toBeUndefined();
    expect(await readHallOfFame(store)).toHaveLength(1);
  });

  it('accumulates across repeated retirements, oldest first', async () => {
    const store = new MemoryStore();
    await retireKingdom(store, profile(100), [], 1_000, () => 'first');
    await retireKingdom(store, profile(200), [], 2_000, () => 'second');

    const archive = await readHallOfFame(store);
    expect(archive.map((e) => e.id)).toEqual(['first', 'second']);
  });

  it('retires an empty kingdom without error', async () => {
    const entry = await retireKingdom(new MemoryStore(), profile(0), [], 0, () => 'k');
    expect(entry.cells).toBe(0);
    expect(entry.areaM2).toBe(0);
    expect(entry.population).toBe(0);
    expect(entry.provinces).toBe(0);
  });

  it('has no story until one is revealed (BRDC-HALL-002)', async () => {
    const entry = await retireKingdom(new MemoryStore(), profile(0), [], 0, () => 'k');
    expect(entry.story).toBeUndefined();
  });
});

describe('setKingdomStory', () => {
  it('attaches a chronicle to the matching entry, leaving others untouched', async () => {
    const store = new MemoryStore();
    await retireKingdom(store, profile(100), [], 1_000, () => 'first');
    await retireKingdom(store, profile(200), [], 2_000, () => 'second');

    await setKingdomStory(store, 'first', 'Once there was a kingdom.');

    const archive = await readHallOfFame(store);
    expect(archive.find((e) => e.id === 'first')?.story).toBe('Once there was a kingdom.');
    expect(archive.find((e) => e.id === 'second')?.story).toBeUndefined();
  });

  it('is a no-op for an id that does not exist', async () => {
    const store = new MemoryStore();
    await retireKingdom(store, profile(0), [], 0, () => 'k');
    await setKingdomStory(store, 'nope', 'text');
    expect((await readHallOfFame(store))[0]?.story).toBeUndefined();
  });
});
