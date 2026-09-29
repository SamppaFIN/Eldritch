/**
 * Building names for the Counsel's sentences (BRDC-COUNSEL-001). Core has no display
 * names (the app's `names.ts` holds them); the Counsel needs a few in plain words.
 */
import type { BuildingId } from '../types/domain.js';

export const BUILDING_NAMES_PLAIN: Partial<Record<BuildingId, string>> = {
  farm: 'Farmstead',
  sawmill: 'Sawmill',
  quarry: 'Quarry',
  forge: 'Forge',
  market: 'Night Market',
  watchtower: 'Watchtower',
  tavern: 'Drowned Man',
  'temple-grove': 'Temple Grove',
};
