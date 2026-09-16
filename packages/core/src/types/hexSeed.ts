/**
 * BRDC-SEED-004 — what a Worldseed-covered hex knows about itself before anyone visits.
 *
 * One record per hex, assembled offline (`scripts/build-hexseed.mjs`) from BRDC-SEED-002's
 * landmark reconciliation and BRDC-SEED-003's terrain/deposit build. `structure` and
 * `quest` mirror `worldseed.ts`'s own `HexSeed` shape but are not populated by any script
 * yet — wonder placement is `BRDC-WONDER-002`'s ticket, and quests already have their own
 * confirmed sites (`questSites.ts`) rather than a per-hex seed.
 */
import type { H3Index, TerrainKind } from './domain.js';

export interface HexSeedResource {
  /** A `BonusResourceDef.id` (`worldseedAllocate.ts`) — resolve yields from there, not here. */
  readonly id: string;
}

export interface HexSeedLandmark {
  readonly name: string;
  readonly osmId: string;
  readonly lore: string;
  readonly kind: string;
  /** Written by a person vs. generated from an OSM tag alone (`BRDC-SEED-002`). */
  readonly authored: boolean;
}

export interface HexSeed {
  readonly h3: H3Index;
  readonly terrain: TerrainKind;
  /** 0–1, from the classifier. < 0.5 shows the grey "?" badge (`BRDC-CARD-001`). */
  readonly confidence: number;
  readonly resource?: HexSeedResource;
  readonly landmark?: HexSeedLandmark;
  /** Not produced yet — `BRDC-WONDER-002`. */
  readonly structure?: { readonly kind: string; readonly id?: string };
  /** Not produced yet — quests use `questSites.ts` instead of a per-hex seed. */
  readonly quest?: { readonly chain: string; readonly node?: number; readonly item?: string };
}
