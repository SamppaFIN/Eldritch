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
