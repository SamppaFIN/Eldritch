/**
 * BRDC-SPELL-001 — the spell table, casting, and effects that end themselves.
 */
import { describe, expect, it } from 'vitest';
import { EMPTY_POOL } from './terrain.js';
import type { ResourcePool } from './terrain.js';
import { TECHS } from './tech.js';
import type { TechId } from './tech.js';
import {
  BULWARK_SHELTER_MS,
  SPELLS,
  activeSpells,
  castSpell,
  domainSpellBonus,
  spellRemaining,
} from './spell.js';
import type { ActiveSpell, CastContext, SpellId } from './spell.js';
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
});

describe('bulwark, wired', () => {
  it('grants a whole Bulwark duration of decay-clock time, baked into the cell', () => {
    // The repo bakes BULWARK_SHELTER_MS into Cell.shelteredMs on cast; projectCell then
    // subtracts it. The end-to-end effect is spell.repo.test.ts / decay.test.ts.
    expect(BULWARK_SHELTER_MS).toBe(SPELLS.bulwark.durationMs);
    expect(BULWARK_SHELTER_MS).toBeGreaterThan(0);
  });
});
