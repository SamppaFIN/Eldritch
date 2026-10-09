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
  /** The town's terror as last read (BRDC-TERROR-001). */
  terror?: number;
  /** The mysteries' roads as last read (BRDC-MYSTERY-001): what an off-line realm still shows. */
  cluesGathered?: number;
  sealedGates?: number;
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
  remember(season: { seed: string; opensAt: number; phase?: SeasonPhase; terror?: number; cluesGathered?: number; sealedGates?: number }): Promise<void>;
  /** The mysteries' roads as last heard, for a realm that cannot reach the Worker (BRDC-MYSTERY-001). */
  known(): Promise<{ cluesGathered: number; sealedGates: number } | null>;
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
      if (b && b.seed === season.seed && b.opensAt === season.opensAt && b.phase === season.phase && b.terror === season.terror && b.cluesGathered === season.cluesGathered && b.sealedGates === season.sealedGates) return;
      const same = b && b.seed === season.seed && b.opensAt === season.opensAt;
      await store().set(K.mythos, {
        ...(same ? b : {}), seed: season.seed, opensAt: season.opensAt,
        ...(season.phase ? { phase: season.phase } : {}), ...(season.terror !== undefined ? { terror: season.terror } : {}),
        ...(season.cluesGathered !== undefined ? { cluesGathered: season.cluesGathered } : {}),
        ...(season.sealedGates !== undefined ? { sealedGates: season.sealedGates } : {}),
      });
    },
    async known() {
      const b = await book();
      return b ? { cluesGathered: b.cluesGathered ?? 0, sealedGates: b.sealedGates ?? 0 } : null;
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
