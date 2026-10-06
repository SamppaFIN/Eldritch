/** BRDC-INVEST-001 — four investigators, chosen once, each with a skill and an ability. */
import { describe, expect, it } from 'vitest';
import { ARCHETYPES, archetypeOf, chooseArchetype, priceFor, resolveCheck, SKILL_NAME } from './archetype.js';
import { FIRST_INVESTIGATOR, rollTest, diceFor } from './investigator.js';

/** A seeded rng that returns its values in turn. */
const seq = (...v: number[]) => { let i = 0; return () => v[i++ % v.length] as number; };

describe('archetypes', () => {
  it('are four, each raising a different skill', () => {
    expect(ARCHETYPES.map((a) => a.id)).toEqual(['librarian', 'surveyor', 'dockworker', 'medium']);
    expect(new Set(ARCHETYPES.map((a) => a.skill)).size).toBe(4);
    for (const a of ARCHETYPES) expect(a.story.length).toBeGreaterThan(40);
  });

  it('name the skills as the screen does', () => {
    expect(SKILL_NAME).toEqual({ will: 'Will', lore: 'Lore', fight: 'Vigor', observe: 'Wit' });
  });
});

describe('chooseArchetype', () => {
  it('raises the chosen skill to 4 and keeps the rest', () => {
    const inv = chooseArchetype(FIRST_INVESTIGATOR(0), 'dockworker');
    expect(inv.archetype).toBe('dockworker');
    expect(inv.skills).toEqual({ lore: 3, will: 2, fight: 4, observe: 2 });
  });

  it('never lowers a skill already above 4', () => {
    const strong = { ...FIRST_INVESTIGATOR(0), skills: { lore: 5, will: 2, fight: 2, observe: 2 } };
    expect(chooseArchetype(strong, 'librarian').skills.lore).toBe(5);
  });

  it('is locked once chosen', () => {
    const once = chooseArchetype(FIRST_INVESTIGATOR(0), 'medium');
    expect(chooseArchetype(once, 'surveyor')).toBe(once);
  });

  it('keeps whatever else the record carries (a pending gate roll)', () => {
    const book = { ...FIRST_INVESTIGATOR(0), pending: { gateId: 'g1' } };
    expect(chooseArchetype(book, 'medium').pending).toEqual({ gateId: 'g1' });
  });

  it('ignores an unknown archetype', () => {
    const inv = FIRST_INVESTIGATOR(0);
    expect(chooseArchetype(inv, 'pirate' as never)).toBe(inv);
    expect(archetypeOf(undefined)).toBeNull();
  });
});

describe('priceFor', () => {
  it('takes a tenth off for the Dockworker, floored', () => {
    expect(priceFor({ wood: 25, stone: 10 }, 'dockworker')).toEqual({ wood: 22, stone: 9 });
  });
  it('leaves everyone else at full price', () => {
    const cost = { wood: 25 };
    expect(priceFor(cost, 'librarian')).toBe(cost);
    expect(priceFor(cost, undefined)).toBe(cost);
  });
});

describe('resolveCheck', () => {
  it('is the dice pool by name: same dice, same luck, same result', () => {
    const inv = chooseArchetype(FIRST_INVESTIGATOR(0), 'medium');
    const rng = [0.9, 0.1, 0.7, 0.8, 0.2, 0.95];
    const named = resolveCheck(inv, { skill: 'will', need: 2 }, seq(...rng));
    const raw = rollTest(diceFor(inv, 'will'), 2, 'normal', seq(...rng));
    expect(named).toEqual(raw);
    expect(named.faces).toHaveLength(6); // 2 + Will 4
  });
});
