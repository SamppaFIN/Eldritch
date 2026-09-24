import type { BuildingDef, WorksKind } from '../types.js';
import { KEEP } from './keep.js';
import { TEMPLE } from './temple.js';
import { FARM } from './farm.js';
import { SAWMILL } from './sawmill.js';
import { QUARRY } from './quarry.js';
import { FORGE } from './forge.js';
import { MARKET } from './market.js';
import { WATCHTOWER } from './watchtower.js';
import { TAVERN } from './tavern.js';

/** Every building page, in the design's own order (BRDC-WORKS-003). */
export const WORKS_DEFS: Readonly<Record<WorksKind, BuildingDef>> = {
  keep: KEEP,
  temple: TEMPLE,
  farm: FARM,
  sawmill: SAWMILL,
  quarry: QUARRY,
  forge: FORGE,
  market: MARKET,
  watchtower: WATCHTOWER,
  tavern: TAVERN,
};

export const WORKS_KINDS = Object.keys(WORKS_DEFS) as WorksKind[];
