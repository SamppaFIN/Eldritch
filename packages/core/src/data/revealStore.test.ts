/**
 * BRDC-SEED-005 — a Worldseed rebuild does not get to keep a reveal it already broke.
 *
 * `revealAt` itself already has a real, working caller across the app (`useLands`,
 * `RevealControl`) — this is the one thing this ticket adds: noticing when the built seed
 * changed, and giving back exactly the hexes it could have moved.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cellAt, enableWorldseed, harmalaBuiltAt, SEED_BOX } from '@es3/core';
import type { H3Index } from '@es3/core';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { reconcileSeedReveals, staleReveals } from './revealStore.js';

const T0 = Date.parse('2026-09-16T12:00:00Z');

/** A real res-11 hex, comfortably inside `SEED_BOX`. */
const INSIDE = cellAt({
  lat: (SEED_BOX.south + SEED_BOX.north) / 2,
  lng: (SEED_BOX.west + SEED_BOX.east) / 2,
});
/** Well outside it — Helsinki. */
const OUTSIDE = cellAt({ lat: 60.1699, lng: 24.9384 });

describe('staleReveals', () => {
  const revealed: Record<H3Index, number> = { [INSIDE]: T0, [OUTSIDE]: T0 };

  it('is silent on a build this device has already reconciled against', () => {
    expect(staleReveals(revealed, 'build-2', 'build-2')).toEqual([]);
  });

  it('is silent with no build loaded at all — Worldseed reading off, or in a test', () => {
    expect(staleReveals(revealed, '', undefined)).toEqual([]);
  });

  it('names only the seeded hexes once the build has moved on', () => {
    expect(staleReveals(revealed, 'build-3', 'build-2')).toEqual([INSIDE]);
  });

  it('treats a device that has never reconciled as behind the current build', () => {
    expect(staleReveals(revealed, 'build-1', undefined)).toEqual([INSIDE]);
  });
});

describe('reconcileSeedReveals', () => {
  it('does nothing when Worldseed reading is off — harmalaBuiltAt() reports no build', async () => {
    const store = new MemoryStore();
    await store.set(K.revealed, { [INSIDE]: T0 });

    const cleared = await reconcileSeedReveals(store);

    expect(cleared).toEqual([]);
    expect(await store.get(K.revealed)).toEqual({ [INSIDE]: T0 });
    expect(await store.get(K.seedBuiltAt)).toBeUndefined();
  });

  describe('with the built seed on', () => {
    beforeAll(() => enableWorldseed(true));
    afterAll(() => enableWorldseed(false));

    it('clears every seeded reveal on a device that has never reconciled', async () => {
      // A device updating from before BRDC-SEED-005 existed has no `seedBuiltAt` at all —
      // exactly the players this ticket exists for, who revealed real ground against one
      // or more builds already superseded. Treated as behind, not as a build that never
      // existed: every seeded reveal it holds is suspect until proven otherwise.
      const store = new MemoryStore();
      await store.set(K.revealed, { [INSIDE]: T0 });

      const cleared = await reconcileSeedReveals(store);

      expect(cleared).toEqual([INSIDE]);
      expect(await store.get(K.revealed)).toEqual({});
      expect(await store.get(K.seedBuiltAt)).toBe(harmalaBuiltAt());
    });

    it('does nothing on the second open of the same build', async () => {
      const store = new MemoryStore();
      await store.set(K.revealed, { [INSIDE]: T0 });
      await store.set(K.seedBuiltAt, harmalaBuiltAt());

      const cleared = await reconcileSeedReveals(store);

      expect(cleared).toEqual([]);
      expect(await store.get(K.revealed)).toEqual({ [INSIDE]: T0 });
    });

    it('never touches a reveal outside the seeded area', async () => {
      const store = new MemoryStore();
      await store.set(K.revealed, { [OUTSIDE]: T0 });

      await reconcileSeedReveals(store);

      expect(await store.get(K.revealed)).toEqual({ [OUTSIDE]: T0 });
    });
  });
});
