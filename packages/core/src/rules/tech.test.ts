/**
 * BRDC-TECH-001 — the tree is a DAG, wisdom is spent, and eras fall out of what is known.
 *
 * The cycle test is the acceptance gate: a loop in the table locks the game silently.
 */
import { describe, expect, it } from 'vitest';
import { EMPTY_POOL } from './terrain.js';
import type { ResourcePool, TerrainKind } from './terrain.js';
import type { Cell } from '../types/domain.js';
import {
  ERAS,
  TECHS,
  TEMPLE_SCHOOLS,
  canResearch,
  eraChanged,
  eraOf,
  hasTech,
  research,
  researchBonus,
  researchable,
  researchableFor,
  researchableSchoolless,
  riteChain,
} from './tech.js';
import type { Era, TechId } from './tech.js';

const ALL = Object.keys(TECHS) as TechId[];
const ofEra = (era: Era): TechId[] => ALL.filter((id) => TECHS[id].era === era);
const rich = (n = 10_000): ResourcePool => ({ ...EMPTY_POOL, wisdom: n });

describe('the tree is a well-formed DAG', () => {
  it('has no cycles', () => {
    const state = new Map<TechId, 'visiting' | 'done'>();
    const walk = (id: TechId): void => {
      const mark = state.get(id);
      if (mark === 'done') return;
      if (mark === 'visiting') throw new Error(`cycle through ${id}`);
      state.set(id, 'visiting');
      for (const req of TECHS[id].requires) walk(req);
      state.set(id, 'done');
    };
    expect(() => ALL.forEach(walk)).not.toThrow();
  });

  it('every prerequisite exists and is no later an era than its dependant', () => {
    for (const id of ALL) {
      for (const req of TECHS[id].requires) {
        expect(TECHS[req], `${id} requires missing ${req}`).toBeDefined();
        expect(ERAS.indexOf(TECHS[req].era)).toBeLessThanOrEqual(ERAS.indexOf(TECHS[id].era));
      }
    }
  });

  it('every era has at least one tech, and the last era is medieval', () => {
    for (const era of ERAS) expect(ofEra(era).length).toBeGreaterThan(0);
    expect(ERAS[ERAS.length - 1]).toBe('medieval');
  });
});

describe('canResearch / researchable', () => {
  it('opens a tech only once every prerequisite is held', () => {
    expect(canResearch([], 'mining')).toBe(false);
    expect(canResearch(['toolmaking'], 'mining')).toBe(false);
    expect(canResearch(['toolmaking', 'masonry'], 'mining')).toBe(true);
  });

  it('lists the roots at the start and never something already known', () => {
    expect(researchable([]).sort()).toEqual(ofEra('prehistory').sort());
    expect(researchable(['forestry'])).not.toContain('forestry');
  });
});

describe('researchableFor / researchableSchoolless (BRDC-TEMPLE-002)', () => {
  it('every technology has a school or none, and the two sets add up to the whole tree', () => {
    const schoolless = ALL.filter((id) => !TECHS[id].school);
    const schooled = ALL.filter((id) => TECHS[id].school);
    expect(schoolless.length + schooled.length).toBe(ALL.length);
    expect(new Set(TEMPLE_SCHOOLS).size).toBe(6);
  });

  it('a temple only ever offers its own school, and only what the frontier allows', () => {
    const researched: TechId[] = ['toolmaking', 'forestry', 'masonry', 'mining', 'seafaring'];
    expect(researchableFor(researched, 'earth')).toEqual(['fortification']);
    expect(researchableFor(researched, 'spirit')).toEqual(['astronomy']);
    // water's rite-tech (tide-lore) needs seafaring, which is held — so it is on the frontier.
    expect(researchableFor(researched, 'water')).toEqual(['tide-lore']);
  });

  it("the Keep's own list never includes a schooled tech", () => {
    const researched: TechId[] = ['toolmaking', 'forestry', 'masonry', 'mining', 'seafaring'];
    const keep = researchableSchoolless(researched);
    expect(keep).not.toContain('fortification');
    expect(keep).not.toContain('astronomy');
    expect(keep).toContain('early-farming'); // still an open root, still schoolless
  });
});

describe('research', () => {
  it('spends exactly the wisdom cost and adds the id', () => {
    const out = research(['toolmaking'], 'masonry', rich(100));
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.pool.wisdom).toBe(100 - TECHS.masonry.cost);
    expect(out.researched).toContain('masonry');
  });

  it('refuses by name and touches nothing', () => {
    expect(research([], 'mining', rich()).ok).toBe(false);
    expect(research([], 'mining', rich())).toEqual({ ok: false, refused: 'locked' });
    expect(research(['forestry'], 'forestry', rich())).toEqual({
      ok: false,
      refused: 'already-known',
    });
    expect(research(['toolmaking'], 'masonry', rich(1))).toEqual({
      ok: false,
      refused: 'cannot-afford',
    });
  });

  it('does not mutate its inputs', () => {
    const researched: TechId[] = ['toolmaking'];
    const pool = rich(100);
    research(researched, 'masonry', pool);
    expect(researched).toEqual(['toolmaking']);
    expect(pool.wisdom).toBe(100);
  });
});

describe('eras are derived, complete-then-advance, capped', () => {
  it('starts at prehistory and stays there until it is complete', () => {
    expect(eraOf([])).toBe('prehistory');
    expect(eraOf(['early-farming', 'forestry'])).toBe('prehistory');
  });

  it('advances one era per completed era', () => {
    expect(eraOf(ofEra('prehistory'))).toBe('antiquity');
    expect(eraOf([...ofEra('prehistory'), ...ofEra('antiquity')])).toBe('medieval');
  });

  it('never advances past the last era', () => {
    expect(eraOf(ALL)).toBe('medieval');
  });

  it('hasTech is a plain membership check', () => {
    expect(hasTech(['forestry'], 'forestry')).toBe(true);
    expect(hasTech(['forestry'], 'mining')).toBe(false);
  });
});

describe('eraChanged', () => {
  it('names the new era exactly on the boundary, null otherwise', () => {
    const prehistory = ofEra('prehistory');
    const oneShort = prehistory.slice(0, -1);
    expect(eraChanged(oneShort, prehistory)).toBe('antiquity');
    expect(eraChanged(prehistory, [...prehistory, 'masonry'])).toBeNull();
  });
});

describe('riteChain (BRDC-TEMPLE-003)', () => {
  it('lists the rite-tech and every prerequisite, roots first', () => {
    expect(riteChain([], 'spirit')).toEqual(['forestry', 'seafaring', 'astronomy']);
    expect(riteChain([], 'earth')).toEqual(['toolmaking', 'masonry', 'mining', 'fortification']);
    expect(riteChain([], 'fire')).toEqual(['toolmaking', 'masonry', 'mining', 'smithing']);
  });

  it('drops the steps already researched', () => {
    expect(riteChain(['forestry'], 'spirit')).toEqual(['seafaring', 'astronomy']);
    expect(riteChain(['forestry', 'seafaring'], 'water')).toEqual(['tide-lore']);
  });

  it('is empty once the rite itself is known', () => {
    expect(riteChain(['forestry', 'seafaring', 'astronomy'], 'spirit')).toEqual([]);
  });

  it('returns a non-empty chain ending in the school rite for every school', () => {
    for (const school of TEMPLE_SCHOOLS) {
      const chain = riteChain([], school);
      expect(chain.length).toBeGreaterThan(0);
      expect(TECHS[chain[chain.length - 1] as TechId].school).toBe(school);
    }
  });

  it('orders every step after the steps it depends on', () => {
    const chain = riteChain([], 'air');
    const seen = new Set<TechId>();
    for (const id of chain) {
      for (const req of TECHS[id].requires) expect(seen.has(req)).toBe(true);
      seen.add(id);
    }
  });
});

describe('researchBonus — research pays on its own ground (PIVOT-2026-09-09 §3)', () => {
  const T0 = Date.parse('2026-09-09T12:00:00Z');
  /** A held cell of a given terrain, walked just now. */
  const cell = (h3: string, kind: TerrainKind): Cell => ({
    h3,
    ownerId: 'me',
    strength: 100,
    lastVisitedAt: T0,
    visitDays: [],
    terrain: { kind, source: 'hash' },
  });

  it('pays nothing before anything is researched', () => {
    expect(researchBonus([], [cell('a', 'forest')], T0)).toEqual({});
  });

  it('lifts only the ground its technology speaks to', () => {
    const owned = [cell('a', 'forest'), cell('b', 'mountain')];
    // Forestry is wood; the mountain is untouched by it.
    expect(researchBonus(['forestry'], owned, T0)).toEqual({ wood: 2 });
  });

  it('stacks the technologies that share a resource, and only those', () => {
    const owned = [cell('a', 'hill')]; // stone
    const stone = ['toolmaking', 'masonry', 'fortification'] as TechId[];
    expect(researchBonus(stone, owned, T0)).toEqual({ stone: 2 + 4 + 10 });
  });

  it('pays per cell, so territory is what makes research worth anything', () => {
    const three = ['a', 'b', 'c'].map((h) => cell(h, 'forest'));
    expect(researchBonus(['forestry'], three, T0)).toEqual({ wood: 3 * 2 });
  });

  /*
   * The reason the bonus is aimed rather than universal. Thirteen technologies applied to
   * every hex would compound to +82/h on one cell against a base trickle of 2; aimed at
   * their own ground the worst case is +16, which is a strong cell and not a broken one.
   */
  it('never compounds the whole tree onto one hex', () => {
    const worst = Math.max(
      ...(['forest', 'hill', 'mountain', 'lake', 'coast', 'market'] as TerrainKind[]).map(
        (k) => Object.values(researchBonus(ALL, [cell('a', k)], T0))[0] ?? 0,
      ),
    );
    const everything = ALL.reduce((sum, id) => sum + (TECHS[id].yield?.perCell ?? 0), 0);
    expect(worst).toBeLessThan(everything / 3);
    expect(worst).toBe(16);
  });

  it('a hex you have stopped walking to stops paying, research or no research', () => {
    const stale = { ...cell('a', 'forest'), lastVisitedAt: T0 - 10 * 86_400_000 };
    expect(researchBonus(['forestry'], [stale], T0)).toEqual({});
  });

  it('plain ground produces nothing, so nothing lifts it', () => {
    expect(researchBonus(ALL, [cell('a', 'plain')], T0)).toEqual({});
  });
});
