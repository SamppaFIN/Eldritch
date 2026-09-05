/**
 * BRDC-TEMPLE-003 — every catalogued thing has a blurb, and the effect strings are
 * read off the rule tables, not hand-kept.
 */
import { describe, expect, it } from 'vitest';
import { BUILDINGS, SPELLS, TECHS } from '@es3/core';
import type { BuildingId, SpellId, TechId } from '@es3/core';
import {
  BUILDING_BLURB,
  SCHOOL_RITE,
  SPELL_BLURB,
  TECH_BLURB,
  buildingEffect,
  spellEffect,
  techUnlocks,
} from './catalogue.js';

describe('the blurbs cover their tables', () => {
  it('every technology, rite and building has a non-empty sentence', () => {
    for (const id of Object.keys(TECHS) as TechId[]) expect(TECH_BLURB[id]?.length).toBeGreaterThan(0);
    for (const id of Object.keys(SPELLS) as SpellId[]) expect(SPELL_BLURB[id]?.length).toBeGreaterThan(0);
    for (const id of Object.keys(BUILDINGS) as BuildingId[])
      expect(BUILDING_BLURB[id]?.length).toBeGreaterThan(0);
  });

  it('SCHOOL_RITE points each school at a rite of that school', () => {
    for (const [school, rite] of Object.entries(SCHOOL_RITE)) {
      expect(SPELLS[rite].school).toBe(school);
    }
  });
});

describe('buildingEffect', () => {
  it('reads production, capacity and auras off the row', () => {
    expect(buildingEffect('sawmill')).toBe('+5 wood / h');
    expect(buildingEffect('fishery')).toBe('+3 food / h · +1 tokens / day');
    expect(buildingEffect('storehouse')).toBe('+250 storage cap');
    expect(buildingEffect('granary')).toBe('+1 food / h · +3 build slots');
    expect(buildingEffect('library')).toBe('+1 wisdom / h within 1');
    expect(buildingEffect('fortress')).toBe('−30 to attacks within 1');
  });
});

describe('spellEffect', () => {
  it('names the domain trickle and duration, with Bulwark and the Wager pair by hand', () => {
    expect(spellEffect('insight')).toBe('+6 wisdom / h to the domain · 12 h');
    expect(spellEffect('forgeheart')).toBe('+4 iron / h to the domain · 18 h');
    expect(spellEffect('bulwark')).toBe('Shelters this cell from decay · 24 h');
    expect(spellEffect('dominion')).toBe('Carried into a Wager');
  });
});

describe('techUnlocks', () => {
  it('names the buildings and rites a tech opens, or what it leads to', () => {
    expect(techUnlocks('forestry')).toBe('Unlocks Sawmill and Lumbermill');
    expect(techUnlocks('smithing')).toBe('Unlocks the Forgeheart rite');
    expect(techUnlocks('astronomy')).toBe('Unlocks Library and the Insight rite');
    expect(techUnlocks('toolmaking')).toBe('Leads to Masonry and Mining');
  });
});
