/**
 * BRDC-QUEST-004 — the tale keeps its shape and moves to the player.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { anchorQuestSites, questSiteAt, siteCell, QUEST_SITES, QUEST_SITE_IDS, FUMING_PATH } from './questSites.js';
import { bearing } from '../geo/project.js';
import { haversine } from '../geo/haversine.js';
import { cellAt } from '../geo/cells.js';

/** Somewhere that is emphatically not Tampere. */
const HELSINKI = { lat: 60.1699, lng: 24.9384 };
const AUSTRALIA = { lat: -33.8688, lng: 151.2093 };

afterEach(() => anchorQuestSites(null));

describe('unanchored', () => {
  it('stays exactly where it was written', () => {
    for (const id of QUEST_SITE_IDS) {
      expect(questSiteAt(id)).toEqual(QUEST_SITES[id]);
    }
  });
});

describe('anchored to a player\u2019s own ground', () => {
  /*
   * The bug this fixes: every place was a fixed coordinate in one Tampere park, so the
   * tale could not be *begun* by anybody who lives anywhere else — beginning it means
   * standing on the statue.
   */
  it('puts the statue under the anchor, so the tale can be begun at all', () => {
    anchorQuestSites(HELSINKI);
    expect(siteCell('statue')).toBe(cellAt(HELSINKI));
  });

  it('keeps every bearing and distance the walk was authored with', () => {
    const shape = QUEST_SITE_IDS.map((id) => ({
      id,
      bearing: bearing(QUEST_SITES.statue, QUEST_SITES[id]),
      metres: haversine(QUEST_SITES.statue, QUEST_SITES[id]),
    }));

    anchorQuestSites(HELSINKI);
    for (const { id, bearing: deg, metres } of shape) {
      const moved = questSiteAt(id);
      // A degree of slack: the earth is not flat and the walk is a few hundred metres.
      expect(haversine(HELSINKI, moved)).toBeCloseTo(metres, 0);
      if (metres > 1) expect(bearing(HELSINKI, moved)).toBeCloseTo(deg, 0);
    }
  });

  it('keeps the distances between the places themselves, not just from the statue', () => {
    const legs = FUMING_PATH.slice(1).map((to, i) => ({
      from: FUMING_PATH[i] as (typeof FUMING_PATH)[number],
      to,
      metres: haversine(QUEST_SITES[FUMING_PATH[i] as 'statue'], QUEST_SITES[to]),
    }));

    anchorQuestSites(HELSINKI);
    for (const leg of legs) {
      expect(haversine(questSiteAt(leg.from), questSiteAt(leg.to))).toBeCloseTo(leg.metres, 0);
    }
  });

  it('works in the other hemisphere, which is the whole point', () => {
    anchorQuestSites(AUSTRALIA);
    expect(siteCell('statue')).toBe(cellAt(AUSTRALIA));
    expect(haversine(AUSTRALIA, questSiteAt('lake'))).toBeCloseTo(
      haversine(QUEST_SITES.statue, QUEST_SITES.lake),
      0,
    );
  });

  it('gives every place its own hex — none of them collapse onto each other', () => {
    anchorQuestSites(HELSINKI);
    const cells = new Set(QUEST_SITE_IDS.map(siteCell));
    expect(cells.size).toBe(QUEST_SITE_IDS.length);
  });

  it('puts it back where it was written when the anchor is dropped', () => {
    anchorQuestSites(HELSINKI);
    anchorQuestSites(null);
    expect(questSiteAt('lake')).toEqual(QUEST_SITES.lake);
  });
});
