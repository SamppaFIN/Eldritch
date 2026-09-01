/**
 * BRDC-QUEST-001 — which landmarks the map draws, and finding a secret by walking onto it.
 */
import { describe, expect, it } from 'vitest';
import { FUMING_PATH, secretSiteAt, siteCell, visibleQuestSites } from './questSites.js';

describe('visibleQuestSites', () => {
  it('shows only the statue before the adventure starts', () => {
    expect(visibleQuestSites(null, [])).toEqual(['statue']);
  });

  it('reveals one stop ahead of the current stage', () => {
    expect(visibleQuestSites('statue', [])).toEqual(['statue', 'lake']);
    expect(visibleQuestSites('lake', [])).toEqual(['statue', 'lake', 'hermit']);
    expect(visibleQuestSites('hermit', [])).toEqual(['statue', 'lake', 'hermit', 'troll']);
    expect(visibleQuestSites('troll', [])).toEqual([...FUMING_PATH]);
  });

  it('shows the whole path once past the last stop', () => {
    expect(visibleQuestSites('servitude', [])).toEqual([...FUMING_PATH]);
  });

  it('never lists a secret site until it has been found, then always does', () => {
    expect(visibleQuestSites('troll', [])).not.toContain('wisdom');
    expect(visibleQuestSites('statue', ['wisdom', 'staff'])).toEqual([
      'statue',
      'lake',
      'staff',
      'wisdom',
    ]);
  });
});

describe('secretSiteAt', () => {
  it('names the secret whose cell you are standing in', () => {
    expect(secretSiteAt(siteCell('wisdom'))).toBe('wisdom');
    expect(secretSiteAt(siteCell('trinket'))).toBe('trinket');
    expect(secretSiteAt(siteCell('staff'))).toBe('staff');
  });

  it('is null on the path and on open ground', () => {
    expect(secretSiteAt(siteCell('statue'))).toBeNull();
    expect(secretSiteAt(siteCell('troll'))).toBeNull();
  });
});
