import { describe, expect, it } from 'vitest';
import { localShare } from './share.js';
import type { Cell } from '../types/domain.js';

/**
 * PIVOT-2026-09-09 §5 — *"enemmän käynyt = suurempi osuus"*.
 *
 * The share used to be settled by whoever happened to be stronger the moment a Wager
 * message was imported, with days only breaking a tie. That is a verdict a player cannot
 * argue with by playing. Days decide it now, and these are the edges of that.
 */
const cell = (shared?: Cell['shared']): Cell => ({
  h3: '8b1fb46622dcfff',
  ownerId: 'me',
  strength: 100,
  lastVisitedAt: 0,
  visitDays: [],
  ...(shared ? { shared } : {}),
});

describe('localShare', () => {
  it('is all of it on ground held outright', () => {
    expect(localShare(cell())).toBe(1);
  });

  it('divides by the separate days each side walked it', () => {
    expect(
      localShare(cell({ with: 'r', mineAtImport: 100, theirsAtImport: 100, myDays: 6, theirDays: 2 })),
    ).toBe(0.75);
  });

  /*
   * The case that inverted with this change, and the reason for it: three times their
   * strength at the moment of import, but they have walked it nine days to my one. Feet
   * are what this game measures, and feet are what a player can go and change.
   */
  it('lets days beat strength, not the other way round', () => {
    expect(
      localShare(cell({ with: 'r', mineAtImport: 150, theirsAtImport: 50, myDays: 1, theirDays: 9 })),
    ).toBe(0.1);
  });

  it('falls back to strength for a tag written before days travelled', () => {
    expect(localShare(cell({ with: 'r', mineAtImport: 150, theirsAtImport: 50 }))).toBe(0.75);
  });

  it('falls back to strength on a genuine tie in days', () => {
    expect(
      localShare(cell({ with: 'r', mineAtImport: 150, theirsAtImport: 50, myDays: 4, theirDays: 4 })),
    ).toBe(0.75);
  });

  /*
   * An absent count means "this import carried no days", which is not "they were never
   * here". Reading it as zero would hand the local player the whole cell on a
   * technicality — the one way this rule could quietly cheat somebody.
   */
  it('treats a count only one side carries as unknown, never as zero', () => {
    expect(localShare(cell({ with: 'r', mineAtImport: 100, theirsAtImport: 100, myDays: 9 }))).toBe(0.5);
    expect(localShare(cell({ with: 'r', mineAtImport: 100, theirsAtImport: 100, theirDays: 9 }))).toBe(0.5);
  });

  it('splits evenly when nothing separates the two sides at all', () => {
    expect(localShare(cell({ with: 'r', mineAtImport: 0, theirsAtImport: 0 }))).toBe(0.5);
  });
});
