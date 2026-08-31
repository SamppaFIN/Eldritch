/**
 * BRDC-SCALE-001 — `cellsInBBox` is a bounded read.
 *
 * The RED it closes: every cell query was a full scan of everything the device had ever
 * stored. With the res-6 region in the key, a viewport query touches only the regions it
 * overlaps. This proves that with a counting store — what was read, and what was not.
 */
import { describe, expect, it } from 'vitest';
import { destination } from '../geo/project.js';
import { regionOf, ringToCells } from '../geo/cells.js';
import { cellsInBBox, setStoredTerrain } from './cellStore.js';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import type { BBox, Cell } from '../types/domain.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-08-31T12:00:00Z');

/** A `side`-metre box with `sw` as its south-west corner. */
function square(sw: { lat: number; lng: number }, side: number) {
  const ne = destination(destination(sw, 0, side), 90, side);
  return [sw, { lat: sw.lat, lng: ne.lng }, ne, { lat: ne.lat, lng: sw.lng }];
}

function cell(h3: string): Cell {
  return { h3, ownerId: 'p1', strength: 200, lastVisitedAt: T0, visitDays: [] };
}

const boxAround = (c: { lat: number; lng: number }, halfDeg: number): BBox => ({
  west: c.lng - halfDeg,
  east: c.lng + halfDeg,
  south: c.lat - halfDeg,
  north: c.lat + halfDeg,
});

/** Records every key handed to `getMany`, so a test can name what was and was not read. */
class CountingStore extends MemoryStore {
  readKeys: string[] = [];
  override async getMany<T>(keys: string[]): Promise<Array<T | undefined>> {
    this.readKeys.push(...keys);
    return super.getMany<T>(keys);
  }
}

const NEAR = ringToCells(square(ORIGIN, 200));
/** 200 km east — a different res-6 region by a wide margin. */
const FAR = ringToCells(square(destination(ORIGIN, 90, 200_000), 200));

async function seedBoth(store: MemoryStore) {
  for (const h3 of [...NEAR, ...FAR]) await store.set(K.cell(h3), cell(h3));
}

describe('cellsInBBox', () => {
  it('returns the cells in the box', async () => {
    const store = new MemoryStore();
    await seedBoth(store);

    const found = new Set((await cellsInBBox(store, boxAround(ORIGIN, 0.02))).map((c) => c.h3));

    expect(NEAR.every((h3) => found.has(h3))).toBe(true);
  });

  it('returns nothing from a region the box does not touch', async () => {
    const store = new MemoryStore();
    await seedBoth(store);

    const found = new Set((await cellsInBBox(store, boxAround(ORIGIN, 0.02))).map((c) => c.h3));

    expect(FAR.some((h3) => found.has(h3))).toBe(false);
  });

  it('reads only the overlapping regions, not every stored cell', async () => {
    const store = new CountingStore();
    await seedBoth(store);

    await cellsInBBox(store, boxAround(ORIGIN, 0.02));

    const farRegion = regionOf(FAR[0] as string);
    expect(store.readKeys.some((k) => k.includes(farRegion))).toBe(false);
    expect(store.readKeys.length).toBeGreaterThan(0);
    expect(store.readKeys.length).toBeLessThan(NEAR.length + FAR.length);
  });
});

describe('setStoredTerrain (BRDC-TERRAIN-002)', () => {
  const h3 = NEAR[0] as string;

  it('does nothing for a cell with no stored row — empty ground keeps the hash', async () => {
    const store = new MemoryStore();
    await setStoredTerrain(store, h3, { kind: 'mountain', source: 'tiles' });
    expect(await store.get(K.cell(h3))).toBeUndefined();
  });

  it('writes terrain onto an existing cell and leaves the rest alone', async () => {
    const store = new MemoryStore();
    const owned: Cell = { h3, ownerId: 'p1', strength: 300, lastVisitedAt: T0, visitDays: ['2026-08-31'] };
    await store.set(K.cell(h3), owned);

    await setStoredTerrain(store, h3, { kind: 'forest', source: 'tiles' });

    expect(await store.get<Cell>(K.cell(h3))).toEqual({
      ...owned,
      terrain: { kind: 'forest', source: 'tiles' },
    });
  });

  it('is a no-op when the same terrain is already recorded', async () => {
    class CountingStore extends MemoryStore {
      sets = 0;
      override async set<T>(key: string, value: T): Promise<void> {
        this.sets += 1;
        return super.set(key, value);
      }
    }
    const store = new CountingStore();
    await store.set(K.cell(h3), {
      h3,
      ownerId: 'p1',
      strength: 300,
      lastVisitedAt: T0,
      visitDays: [],
      terrain: { kind: 'forest', source: 'tiles' },
    } satisfies Cell);
    const before = store.sets;

    await setStoredTerrain(store, h3, { kind: 'forest', source: 'tiles' });
    expect(store.sets).toBe(before);
  });
});
