/**
 * BRDC-QUEST-001 — the adventure state machine.
 *
 * The engine is pure: `gateMet` reads a context, `advanceAdventure` takes a choice,
 * `parseAdventures` refuses a malformed bundle at load. The shipped bundle
 * (`data/adventures.json`) is validated here too — every branch reaches an end, no
 * stage is stranded.
 */
import { describe, expect, it } from 'vitest';
import { advanceAdventure, gateMet, parseAdventures } from './adventure.js';
import type { Adventure, AdventureContext } from './adventure.js';
import { EMPTY_POOL } from './terrain.js';
import raw from '../data/adventures.json';

const ctx = (over: Partial<AdventureContext> = {}): AdventureContext => ({
  pool: { ...EMPTY_POOL },
  terrains: new Set(),
  ownedCount: 0,
  heldSites: new Set(),
  ...over,
});

describe('gateMet', () => {
  it('an absent gate is always met', () => {
    expect(gateMet(undefined, ctx())).toBe(true);
  });

  it('a terrain gate needs a held cell of that kind', () => {
    expect(gateMet({ terrain: 'lake' }, ctx())).toBe(false);
    expect(gateMet({ terrain: 'lake' }, ctx({ terrains: new Set(['lake']) }))).toBe(true);
  });

  it('an ownedCells gate is a floor', () => {
    expect(gateMet({ ownedCells: 5 }, ctx({ ownedCount: 4 }))).toBe(false);
    expect(gateMet({ ownedCells: 5 }, ctx({ ownedCount: 5 }))).toBe(true);
  });

  it('a holdsSite gate needs that named cell claimed', () => {
    expect(gateMet({ holdsSite: 'wisdom' }, ctx())).toBe(false);
    expect(gateMet({ holdsSite: 'wisdom' }, ctx({ heldSites: new Set(['wisdom']) }))).toBe(true);
  });

  it('a pool gate needs the resource in the pouch', () => {
    expect(gateMet({ pool: { gold: 20 } }, ctx())).toBe(false);
    expect(gateMet({ pool: { gold: 20 } }, ctx({ pool: { ...EMPTY_POOL, gold: 20 } }))).toBe(true);
  });
});

describe('parseAdventures', () => {
  it('accepts the shipped bundle', () => {
    const book = parseAdventures(raw);
    expect(book['fuming-lake']?.start).toBe('statue');
  });

  it('rejects a next that points nowhere', () => {
    const bad = {
      x: { title: 'X', start: 's', stages: { s: { speaker: 'N', text: ['t'], choices: [{ text: 'go', next: 'ghost' }] } } },
    };
    expect(() => parseAdventures(bad)).toThrow(/ghost/);
  });

  it('rejects a stage with no choices', () => {
    const bad = { x: { title: 'X', start: 's', stages: { s: { speaker: 'N', text: ['t'], choices: [] } } } };
    expect(() => parseAdventures(bad)).toThrow(/at least one choice/);
  });

  it('rejects a start that is not a stage', () => {
    const bad = { x: { title: 'X', start: 'nope', stages: { s: { speaker: 'N', text: ['t'], choices: [{ text: 'go', next: 'end' }] } } } };
    expect(() => parseAdventures(bad)).toThrow(/start/);
  });
});

describe('advanceAdventure — the Fuming Lake troll', () => {
  const fuming = parseAdventures(raw)['fuming-lake'] as Adventure;
  const rich = { ...EMPTY_POOL, gold: 50, iron: 50, wisdom: 50 };

  it('the trinket route gets past the troll', () => {
    const r = advanceAdventure(fuming, 'troll', 0, ctx({ pool: rich, heldSites: new Set(['trinket']) }));
    expect(r).toMatchObject({ ok: true, next: 'deep' });
    expect(r.ok && r.effect.xp).toBe(40);
  });

  it('the staff route gets past the troll', () => {
    const r = advanceAdventure(fuming, 'troll', 1, ctx({ pool: rich, heldSites: new Set(['staff']) }));
    expect(r).toMatchObject({ ok: true, next: 'deep' });
  });

  it('the wisdom route gets past the troll and pays more', () => {
    const r = advanceAdventure(fuming, 'troll', 2, ctx({ pool: rich, heldSites: new Set(['wisdom']) }));
    expect(r).toMatchObject({ ok: true, next: 'deep' });
    expect(r.ok && r.effect.xp).toBe(60);
  });

  it('refuses a route whose site the player does not hold', () => {
    const r = advanceAdventure(fuming, 'troll', 2, ctx({ pool: rich }));
    expect(r).toEqual({ ok: false, refused: 'gate' });
  });

  it('refuses an ungated choice whose cost the pouch cannot cover', () => {
    const toll: Adventure = {
      id: 't',
      title: 'T',
      start: 's',
      stages: {
        s: { speaker: 'N', text: ['pay'], choices: [{ text: 'pay 20 gold', effect: { pool: { gold: -20 } }, next: 'end' }] },
      },
    };
    expect(advanceAdventure(toll, 's', 0, ctx())).toEqual({ ok: false, refused: 'cannot-afford' });
    expect(advanceAdventure(toll, 's', 0, ctx({ pool: { ...EMPTY_POOL, gold: 20 } }))).toMatchObject({ ok: true });
  });

  it('names bad stages and choices', () => {
    expect(advanceAdventure(fuming, 'ghost', 0, ctx())).toEqual({ ok: false, refused: 'no-such-stage' });
    expect(advanceAdventure(fuming, 'troll', 99, ctx())).toEqual({ ok: false, refused: 'no-such-choice' });
  });

  it('the servitude ending unlocks the codex and pays 500', () => {
    const r = advanceAdventure(fuming, 'servitude', 0, ctx());
    expect(r).toMatchObject({ ok: true, next: 'end', unlocks: 'cthulhu-awakening' });
    expect(r.ok && r.effect.xp).toBe(500);
  });
});

describe('the shipped Fuming Lake graph', () => {
  const fuming = parseAdventures(raw)['fuming-lake'] as Adventure;

  it('every stage is reachable from the start and every branch can end', () => {
    const seen = new Set<string>();
    const queue = [fuming.start];
    let reachesEnd = false;
    while (queue.length) {
      const id = queue.shift() as string;
      if (seen.has(id)) continue;
      seen.add(id);
      for (const c of fuming.stages[id]?.choices ?? []) {
        if (c.next === 'end') reachesEnd = true;
        else queue.push(c.next);
      }
    }
    expect(reachesEnd).toBe(true);
    expect(seen).toEqual(new Set(Object.keys(fuming.stages)));
  });
});
