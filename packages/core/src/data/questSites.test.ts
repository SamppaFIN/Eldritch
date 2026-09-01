/**
 * BRDC-QUEST-001 — which landmarks the map draws, and finding a secret by walking onto it.
 */
import { describe, expect, it } from 'vitest';
import {
  FUMING_PATH,
  QUEST_SITES,
  STAGE_SITE,
  secretSiteAt,
  siteCell,
  visibleQuestSites,
} from './questSites.js';

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

describe('STAGE_SITE', () => {
  it('maps every path stage to its own site, and both endings to the water', () => {
    for (const stage of FUMING_PATH) expect(STAGE_SITE[stage]).toBe(stage);
    expect(STAGE_SITE.servitude).toBe('deep');
  });

  it('only ever names a real quest site', () => {
    for (const site of Object.values(STAGE_SITE)) expect(QUEST_SITES[site]).toBeDefined();
  });

  it('has no entry for the failure loops', () => {
    expect(STAGE_SITE['death-by-fumes']).toBeUndefined();
    expect(STAGE_SITE['death-by-troll']).toBeUndefined();
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
