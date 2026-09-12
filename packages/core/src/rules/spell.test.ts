/**
 * BRDC-SPELL-001 — the spell table, casting, and effects that end themselves.
 */
import { describe, expect, it } from 'vitest';
import { EMPTY_POOL } from './terrain.js';
import type { ResourcePool } from './terrain.js';
import { TECHS } from './tech.js';
import type { TechId } from './tech.js';
import {
  SPELLS,
  activeSpells,
  castSpell,
  spellRemaining,
} from './spell.js';
import { BULWARK_SHELTER_MS, domainSpellBonus } from './spellEffects.js';
import type { ActiveSpell, CastContext, SpellId } from './spell.js';
import { cellAt, neighboursOf } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-09-01T12:00:00Z');
const ALL_TECH = Object.keys(TECHS) as TechId[];

const pool = (over: Partial<ResourcePool> = {}): ResourcePool => ({ ...EMPTY_POOL, ...over });
const cell = (h3: string, ownerId: string | null = 'me'): Cell => ({
  h3,
  ownerId,
  strength: 300,
  lastVisitedAt: T0,
  visitDays: [],
});

const ctx = (over: Partial<CastContext> = {}): CastContext => ({
  playerId: 'me',
  researched: ALL_TECH,
  pool: pool({ mana: 999 }),
  owned: [cell('home')],
  active: [],
  ...over,
});

describe('SPELLS table', () => {
  it('every spell has a real unlocking tech, in the same school as the spell (BRDC-TEMPLE-002)', () => {
    for (const s of Object.values(SPELLS)) {
      expect(TECHS[s.tech]).toBeDefined();
      expect(TECHS[s.tech]?.school).toBe(s.school);
    }
  });

  it('every wager spell targets an enemy cell; every home spell does not', () => {
    for (const s of Object.values(SPELLS)) {
      if (s.via === 'wager') expect(s.scope).toBe('enemy-cell');
      else expect(s.scope).not.toBe('enemy-cell');
    }
  });
});

describe('castSpell', () => {
  it('casts a domain spell, debiting mana, without a target', () => {
    const r = castSpell(ctx(), 'insight', null, T0);
    expect(r).toMatchObject({ ok: true, spell: { id: 'insight', castAt: T0 } });
    if (r.ok) {
      expect(r.spell.target).toBeUndefined();
      expect(r.pool.mana).toBe(999 - SPELLS.insight.cost);
    }
  });

  it('casts an own-cell spell onto a cell the player holds', () => {
    const r = castSpell(ctx(), 'bulwark', 'home', T0);
    expect(r).toMatchObject({ ok: true, spell: { id: 'bulwark', target: 'home' } });
  });

  it('refuses in order — unknown, wager, locked, target, ownership, duplicate, mana', () => {
    expect(castSpell(ctx(), 'nope' as SpellId, null, T0)).toEqual({
      ok: false,
      refused: 'unknown-spell',
    });
    expect(castSpell(ctx(), 'snare', 'x', T0)).toEqual({ ok: false, refused: 'carry-in-a-wager' });
    expect(castSpell(ctx({ researched: [] }), 'insight', null, T0)).toEqual({
      ok: false,
      refused: 'locked',
    });
    expect(castSpell(ctx(), 'bulwark', null, T0)).toEqual({ ok: false, refused: 'needs-a-target' });
    expect(castSpell(ctx(), 'bulwark', 'someone-elses', T0)).toEqual({
      ok: false,
      refused: 'not-your-cell',
    });
    expect(
      castSpell(ctx({ active: [{ id: 'insight', castAt: T0 }] }), 'insight', null, T0),
    ).toEqual({ ok: false, refused: 'already-running' });
    expect(castSpell(ctx({ pool: pool({ mana: 1 }) }), 'insight', null, T0)).toEqual({
      ok: false,
      refused: 'cannot-afford',
    });
  });

  it('never mutates the pool it was handed', () => {
    const p = pool({ mana: 999 });
    const snap = { ...p };
    castSpell(ctx({ pool: p }), 'insight', null, T0);
    expect(p).toEqual(snap);
  });

  it('lets the same bulwark run on two different cells', () => {
    const running: ActiveSpell[] = [{ id: 'bulwark', target: 'home', castAt: T0 }];
    const r = castSpell(ctx({ owned: [cell('home'), cell('other')], active: running }), 'bulwark', 'other', T0);
    expect(r.ok).toBe(true);
  });
});

describe('activeSpells and spellRemaining', () => {
  const spells: ActiveSpell[] = [{ id: 'insight', castAt: T0 }];

  it('keeps a spell within its duration and drops it after', () => {
    expect(activeSpells(spells, T0 + SPELLS.insight.durationMs - 1)).toHaveLength(1);
    expect(activeSpells(spells, T0 + SPELLS.insight.durationMs)).toHaveLength(0);
  });

  it('counts down and clamps at zero', () => {
    expect(spellRemaining(spells[0] as ActiveSpell, T0)).toBe(SPELLS.insight.durationMs);
    expect(spellRemaining(spells[0] as ActiveSpell, T0 + SPELLS.insight.durationMs + 5)).toBe(0);
  });
});

describe('domainSpellBonus (insight, wired)', () => {
  it('adds a running insight to the per-hour pool, and nothing once it expires', () => {
    const spells: ActiveSpell[] = [{ id: 'insight', castAt: T0 }];
    expect(domainSpellBonus(spells, T0)).toEqual({ wisdom: SPELLS.insight.domainBonusPerH?.wisdom });
    expect(domainSpellBonus(spells, T0 + SPELLS.insight.durationMs)).toEqual({});
  });

  it('ignores a bulwark — it is not a domain spell', () => {
    expect(domainSpellBonus([{ id: 'bulwark', target: 'home', castAt: T0 }], T0)).toEqual({});
  });

  it('wires the fire, water and nature rites the same way (BRDC-TEMPLE-003)', () => {
    expect(domainSpellBonus([{ id: 'forgeheart', castAt: T0 }], T0)).toEqual({ iron: 4 });
    expect(domainSpellBonus([{ id: 'wellspring', castAt: T0 }], T0)).toEqual({ food: 5 });
    expect(domainSpellBonus([{ id: 'greenwake', castAt: T0 }], T0)).toEqual({ wood: 6 });
  });
});

describe('bulwark, wired', () => {
  it('grants a whole Bulwark duration of decay-clock time, baked into the cell', () => {
    // The repo bakes BULWARK_SHELTER_MS into Cell.shelteredMs on cast; projectCell then
    // subtracts it. The end-to-end effect is spell.repo.test.ts / decay.test.ts.
    expect(BULWARK_SHELTER_MS).toBe(SPELLS.bulwark.durationMs);
    expect(BULWARK_SHELTER_MS).toBeGreaterThan(0);
  });
});

describe('the two Rites that reach past your feet (PIVOT-2026-09-09 §7)', () => {
  const HOME = cellAt({ lat: 61.4729, lng: 23.7259 });
  const [BESIDE] = neighboursOf(HOME) as [string];
  const FAR = cellAt({ lat: 61.5, lng: 23.9 });
  const here = (over: Partial<CastContext> = {}) =>
    ctx({ owned: [cell(HOME)], pool: pool({ mana: 999 }), ...over });

  it('both act at once rather than running — nothing to store, nothing to sweep', () => {
    for (const id of ['farsight', 'quickening'] as SpellId[]) {
      expect(SPELLS[id].via).toBe('home');
      expect(SPELLS[id].durationMs).toBe(0);
      expect(activeSpells([{ id, castAt: T0 }], T0)).toEqual([]);
    }
  });

  it('Farsight lands on any hex at all — that is the whole point of looking', () => {
    const result = castSpell(here(), 'farsight', FAR, T0);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.pool.mana).toBe(999 - SPELLS.farsight.cost);
  });

  it('but it still needs somewhere to look', () => {
    expect(castSpell(here(), 'farsight', null, T0)).toEqual({
      ok: false,
      refused: 'needs-a-target',
    });
  });

  it('Quickening takes free ground that touches yours', () => {
    expect(castSpell(here(), 'quickening', BESIDE, T0).ok).toBe(true);
  });

  it('and refuses ground that touches nothing of yours', () => {
    expect(castSpell(here(), 'quickening', FAR, T0)).toEqual({
      ok: false,
      refused: 'not-on-your-border',
    });
  });

  /*
   * The refusal that matters most: aimed at your own hex it says so, rather than charging
   * 120 mana to claim what you already hold.
   */
  it('and refuses ground already yours, by name', () => {
    expect(castSpell(here(), 'quickening', HOME, T0)).toEqual({
      ok: false,
      refused: 'already-held',
    });
  });

  it('costs more than anything else mana buys — walking must stay the cheap way', () => {
    const others = (Object.keys(SPELLS) as SpellId[])
      .filter((id) => id !== 'quickening')
      .map((id) => SPELLS[id].cost);
    expect(SPELLS.quickening.cost).toBeGreaterThan(Math.max(...others));
  });

  it('gives air the home Rite it never had', () => {
    const homeSchools = (Object.keys(SPELLS) as SpellId[])
      .filter((id) => SPELLS[id].via === 'home')
      .map((id) => SPELLS[id].school);
    expect(homeSchools).toContain('air');
  });
});
