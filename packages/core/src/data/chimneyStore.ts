/**
 * The chimneys in the store (BRDC-CHIMNEY-001): which you hold, and lighting them the
 * first time all three are yours — the fog lifts about a kilometre around them and stays
 * lifted, as a Watchtower's sight does. Resets with the season, like the sight it wrote.
 */
import { CHIMNEYS, CHIMNEY_SIGHT_RINGS, chimneyCentre, chimneysLit } from '../rules/chimney.js';
import type { ChimneyId } from '../rules/chimney.js';
import { sightRings } from './revealStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index } from '../types/domain.js';

export interface ChimneyView {
  sites: readonly { id: ChimneyId; name: string; h3: H3Index; held: boolean }[];
  /** When all three were first held and the beacons lit, or null. */
  litAt: number | null;
}

export interface ChimneyApi {
  /** The three, and whether they are lit — lighting them now if all three just became yours. */
  view(now: number): Promise<ChimneyView>;
}

export function chimneyApi(store: () => KeyValueStore, owned: (now: number) => Promise<readonly Cell[]>): ChimneyApi {
  return {
    async view(now) {
      const cells = await owned(now);
      const held = new Set(cells.map((c) => c.h3));
      let litAt = (await store().get<{ litAt: number }>(K.chimneys))?.litAt ?? null;
      if (litAt === null && chimneysLit(cells)) {
        await sightRings(store(), chimneyCentre(), CHIMNEY_SIGHT_RINGS, now);
        await store().set(K.chimneys, { litAt: now });
        litAt = now;
      }
      return { sites: CHIMNEYS.map((c) => ({ id: c.id, name: c.name, h3: c.h3, held: held.has(c.h3) })), litAt };
    },
  };
}
