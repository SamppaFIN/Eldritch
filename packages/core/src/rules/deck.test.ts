import { describe, expect, it } from 'vitest';
import { cellAt, cellsWithin } from '../geo/cells.js';
import { DECKS, cardById, deckFor, rumourAt } from './deck.js';

describe('encounter decks (BRDC-DOOM-003)', () => {
  it('four decks of at least six cards, every id unique', () => {
    for (const deck of ['forest', 'lake', 'settlement', 'hill'] as const) {
      expect(DECKS.filter((c) => c.deck === deck).length).toBeGreaterThanOrEqual(6);
    }
    expect(new Set(DECKS.map((c) => c.id)).size).toBe(DECKS.length);
    expect(DECKS.every((c) => c.need >= 1 && c.need <= 3 && c.pass.text && c.fail.text)).toBe(true);
  });

  it('the tavern board raises skills; every ground maps to a deck', () => {
    expect(DECKS.filter((c) => c.pass.skillUp).length).toBeGreaterThanOrEqual(4);
    for (const k of ['plain', 'forest', 'hill', 'mountain', 'lake', 'coast', 'market', 'marsh', 'settlement'] as const) {
      expect(deckFor(k)).not.toBeNull();
    }
  });

  it('about one hex in eight holds a rumour, the same on every draw, from its own deck', () => {
    const hexes = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 12);
    const found = hexes.map((h) => rumourAt('s2', h, 'forest')).filter((c) => c !== null);
    expect(found.length / hexes.length).toBeGreaterThan(0.06);
    expect(found.length / hexes.length).toBeLessThan(0.2);
    expect(found.every((c) => c?.deck === 'forest')).toBe(true);
    const h = hexes.find((x) => rumourAt('s2', x, 'lake')) as string;
    expect(rumourAt('s2', h, 'lake')).toEqual(rumourAt('s2', h, 'lake'));
    expect(cardById(rumourAt('s2', h, 'lake')?.id as string)).not.toBeNull();
  });
});
