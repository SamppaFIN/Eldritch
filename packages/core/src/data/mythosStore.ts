/**
 * Today's Mythos card, in the store (BRDC-MYTHOS-001).
 *
 * The card is a hash of the season's seed and the day, so the store keeps only the
 * season's clock — remembered whenever the app reads the season from the Worker — and the
 * day whose headline was last shown. No season remembered, no card: a realm offline from
 * the start plays on with no Mythos at all, never waiting on the network.
 */
import { dawnsSince, mythosFor } from '../rules/doom.js';
import type { MythosCard } from '../rules/doom.js';
import type { SeasonPhase } from '../rules/season.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';

interface MythosBook {
  seed: string;
  opensAt: number;
  /** The season's phase as last read — the Choir's flood reads it (BRDC-CHOIR-001). */
  phase?: SeasonPhase;
  /** The last day whose headline was shown. */
  seenDay?: number;
}

export interface MythosToday {
  card: MythosCard;
  /** Dawns since the season opened. */
  day: number;
  /** Today's headline has already been shown. */
  seen: boolean;
}

export interface MythosApi {
  /** Keep the season's clock (seed and opening), as the Worker last said it. */
  remember(season: { seed: string; opensAt: number; phase?: SeasonPhase }): Promise<void>;
  today(now: number): Promise<MythosToday | null>;
  /** Today's headline has been read. */
  markSeen(now: number): Promise<void>;
}

/** Today's card, or null when no season has been remembered. What the effects read. */
export async function mythosToday(store: KeyValueStore, now: number): Promise<MythosCard | null> {
  const b = await store.get<MythosBook>(K.mythos);
  return b ? mythosFor(b, now) : null;
}

export function mythosApi(store: () => KeyValueStore): MythosApi {
  const book = () => store().get<MythosBook>(K.mythos);
  return {
    async remember(season) {
      const b = await book();
      if (b && b.seed === season.seed && b.opensAt === season.opensAt && b.phase === season.phase) return;
      const same = b && b.seed === season.seed && b.opensAt === season.opensAt;
      await store().set(K.mythos, { ...(same ? b : {}), seed: season.seed, opensAt: season.opensAt, ...(season.phase ? { phase: season.phase } : {}) });
    },
    async today(now) {
      const b = await book();
      if (!b) return null;
      const day = dawnsSince(b.opensAt, now);
      return { card: mythosFor(b, now), day, seen: b.seenDay === day };
    },
    async markSeen(now) {
      const b = await book();
      if (b) await store().set(K.mythos, { ...b, seenDay: dawnsSince(b.opensAt, now) });
    },
  };
}
