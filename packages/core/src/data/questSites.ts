/**
 * The named places of the Fuming Lake (BRDC-QUEST-001).
 *
 * Real Härmälä coordinates, lifted from v2's `QuestFumingLake.js`. The statue is the
 * canonical origin; the lake at (61.4753, 23.7280) is what fixes the water in
 * `terrainSeed.ts`. An adventure gate can require the player to *hold* one of these
 * cells — you walked there and claimed it.
 */
import { cellAt } from '../geo/cells.js';
import type { H3Index, LatLng } from '../types/domain.js';

export type QuestSiteId =
  | 'statue'
  | 'lake'
  | 'trinket'
  | 'hermit'
  | 'staff'
  | 'troll'
  | 'wisdom'
  | 'deep'
  | 'healing-shrine'
  | 'sanity-shrine';

export const QUEST_SITES: Readonly<Record<QuestSiteId, LatLng & { label: string }>> = {
  statue: { lat: 61.47290805294704, lng: 23.725882485862012, label: 'Statue of the Boy' },
  lake: { lat: 61.47525973065058, lng: 23.728040739777192, label: 'The Fuming Lake' },
  trinket: { lat: 61.47414451871632, lng: 23.728673812249834, label: 'Shiny Trinket' },
  hermit: { lat: 61.47307544507844, lng: 23.732610983055974, label: "Hermit's Hovel" },
  staff: { lat: 61.473586729904675, lng: 23.733321862539352, label: 'Ancient Staff' },
  troll: { lat: 61.47658474193526, lng: 23.730553569085355, label: 'Troll Bridge' },
  wisdom: { lat: 61.475937533235395, lng: 23.724059855235694, label: 'Wisdom Stone' },
  deep: { lat: 61.477750840409435, lng: 23.7272125677718, label: 'The Deep' },
  'healing-shrine': { lat: 61.47295360880876, lng: 23.726675342590156, label: 'Healing Shrine' },
  'sanity-shrine': { lat: 61.476970066258765, lng: 23.730978272652262, label: 'Sanity Shrine' },
};

export const QUEST_SITE_IDS = Object.keys(QUEST_SITES) as QuestSiteId[];

/** The ownership cell a quest site falls in. */
export function siteCell(id: QuestSiteId): H3Index {
  return cellAt(QUEST_SITES[id]);
}
