/**
 * The built Worldseed data, read (BRDC-SEED-004).
 *
 * `scripts/build-hexseed.mjs` is the only place that writes `./seed/<area>.json`; this is
 * the only place that reads it. Same module-level on/off shape as `enableTerrainSurvey`
 * (`terrainSeed.ts`) and for the same reason: a field test's data should not silently
 * change every economy and terrain test in the core suite, so it is off by default and the
 * app switches it on at boot.
 */
import type { H3Index } from '../types/domain.js';
import type { HexSeed } from '../types/hexSeed.js';
import harmala from './seed/harmala.json' with { type: 'json' };

let enabled = false;

/** Turn the built Worldseed data on (the app, at boot) or off (tests, by default). */
export function enableWorldseed(on = true): void {
  enabled = on;
}

interface HexSeedDoc {
  readonly area: string;
  /** When `scripts/build-hexseed.mjs` last wrote this file — the one fingerprint that
   *  changes whenever a rebuild could have moved a hex's terrain or resource
   *  (`BRDC-SEED-005`'s own reason for existing: a hex revealed against an older build
   *  can promise a payout the current one no longer agrees with). */
  readonly builtAt: string;
  readonly hexes: Readonly<Record<string, Omit<HexSeed, 'h3'>>>;
}

// One area today (Härmälä) — a second area is another entry here, not a new code path.
const AREAS: readonly HexSeedDoc[] = [harmala as unknown as HexSeedDoc];

/** The built seed for a hex, or `null` when the data is off or the hex is in no area. */
export function hexSeedOf(h3: H3Index): HexSeed | null {
  if (!enabled) return null;
  for (const doc of AREAS) {
    const hex = doc.hexes[h3];
    if (hex) return { h3, ...hex };
  }
  return null;
}

/**
 * When the loaded Worldseed build was made — one string, changed by any rebuild.
 *
 * Not per-hex: a rebuild can move a deposit from one hex in an area to another without
 * touching either hex's own record, so comparing a single hex's own fields to itself
 * would miss exactly the case that matters. One build-wide fingerprint catches every
 * such move at once, at the cost of treating the whole seeded area as suspect together —
 * the trade `BRDC-SEED-005` makes deliberately, since a full-area re-reveal costs the
 * player nothing but a tap.
 */
export function harmalaBuiltAt(): string {
  if (!enabled) return '';
  return (AREAS[0] as HexSeedDoc | undefined)?.builtAt ?? '';
}
