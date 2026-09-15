import { afterEach, describe, expect, it } from 'vitest';
import {
  QUEST_SITE_IDS,
  anchorQuestSites,
  cellAt,
  cellCentre,
  pinQuestCells,
  questSiteAt,
} from '@es3/core';
import type { QuestSiteId } from '@es3/core';
import { questSitesToGeoJson } from './QuestMarkers.js';

/**
 * Quest markers are drawn where the rules look (BRDC-SIGIL-006).
 *
 * v0.6.13 pinned the tale to real hexes and moved every rule onto `siteCell`, but this layer
 * kept drawing at `questSiteAt` — a position worked out from the Keep afresh on every read.
 * Move the Hearth and the marker slid while the quest stayed put, and tapping the marker
 * opened a hex it was no longer drawn on. Infinite's original report — "quest pisteet onkin
 * kartalla eri paikoissa" — still visible on the map after the fix meant to end it.
 */
describe('quest markers', () => {
  const ID = QUEST_SITE_IDS[0] as QuestSiteId;
  const PINNED = cellAt({ lat: 61.47290805, lng: 23.72588249 });

  afterEach(() => {
    pinQuestCells({});
    anchorQuestSites(null);
  });

  it('stand on the pinned hex, not wherever the Keep would put them now', () => {
    pinQuestCells({ [ID]: PINNED });
    // The Keep moves a long way. The derivation follows it; the drawn marker must not.
    anchorQuestSites({ lat: 60.17, lng: 24.94 });

    const feature = questSitesToGeoJson([ID]).features[0];
    const centre = cellCentre(PINNED);
    expect(feature?.geometry.coordinates).toEqual([centre.lng, centre.lat]);

    const drifted = questSiteAt(ID);
    expect(feature?.geometry.coordinates).not.toEqual([drifted.lng, drifted.lat]);
  });
});
