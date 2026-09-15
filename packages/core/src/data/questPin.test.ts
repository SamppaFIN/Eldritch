/**
 * BRDC-QUEST-005 — the tale stays where it was walked to.
 *
 * Field report: the quest's places moved while the map did not. They were derived from
 * the castle's centre on every read, and the castle is re-assigned whenever the Hearth
 * is, so re-anchoring sold the whole tale down the road. These lock the pin.
 */
import { describe, expect, it } from 'vitest';
import { anchorQuestSites, pinQuestCells, resolveQuestCells, siteCell } from './questSites.js';

const HOME = { lat: 61.4729, lng: 23.7259 };
/** Somewhere else entirely — a second Hearth, or a castle re-assignment. */
const ELSEWHERE = { lat: 60.1699, lng: 24.9384 };

describe('quest cells', () => {
  it('move with the anchor while nothing is pinned — the bug, reproduced', () => {
    pinQuestCells({});
    anchorQuestSites(HOME);
    const before = siteCell('statue');
    anchorQuestSites(ELSEWHERE);
    expect(siteCell('statue')).not.toBe(before);
  });

  it('stay put once pinned, however the anchor moves', () => {
    pinQuestCells({});
    anchorQuestSites(HOME);
    pinQuestCells(resolveQuestCells());
    const pinned = siteCell('statue');

    anchorQuestSites(ELSEWHERE);
    expect(siteCell('statue')).toBe(pinned);
    anchorQuestSites(null);
    expect(siteCell('statue')).toBe(pinned);
  });

  it('pins every site, not only the one the tale starts at', () => {
    pinQuestCells({});
    anchorQuestSites(HOME);
    const cells = resolveQuestCells();
    pinQuestCells(cells);
    anchorQuestSites(ELSEWHERE);
    for (const [id, h3] of Object.entries(cells)) {
      expect(siteCell(id as keyof typeof cells)).toBe(h3);
    }
  });
});
