/**
 * Your standard, planted where you stand (BRDC-STANDARD-001, handoff F-13).
 *
 * One at a time: planting again moves it. Only on your own ground — and the store says so,
 * not just the button (D1, Infinite 2026-10-05). It carries no mechanic; it is a mark.
 * "Raise your banner" still means publishing the realm — this is *Plant your standard*.
 */
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index } from '../types/domain.js';

export interface Standard {
  h3: H3Index;
  at: number;
}

export type PlantOutcome = { ok: true; standard: Standard } | { ok: false; refused: 'no-position' | 'not-yours' };

export interface StandardApi {
  at(): Promise<Standard | null>;
  /** `standing` is the GPS hex underfoot, never a hex chosen on the map. */
  plant(standing: H3Index | null, now: number): Promise<PlantOutcome>;
}

export function standardApi(store: () => KeyValueStore, owned: (now: number) => Promise<readonly Cell[]>): StandardApi {
  return {
    at: async () => (await store().get<Standard>(K.standard)) ?? null,
    plant: async (standing, now) => {
      if (!standing) return { ok: false, refused: 'no-position' };
      if (!(await owned(now)).some((c) => c.h3 === standing)) return { ok: false, refused: 'not-yours' };
      const standard = { h3: standing, at: now };
      await store().set(K.standard, standard);
      return { ok: true, standard };
    },
  };
}
