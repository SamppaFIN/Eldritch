/**
 * BRDC-MIND-001 — a perk at each Consciousness milestone.
 */
import { describe, expect, it } from 'vitest';
import { PERKS, hasPerk, perkAt, perksAt } from './perks.js';

describe('perks', () => {
  it('come one per milestone: Awakening, Aware, Enlightened, Transcendent', () => {
    expect(PERKS.map((p) => p.level)).toEqual([5, 10, 15, 20]);
    expect(perksAt(1)).toEqual([]);
    expect(perksAt(12).map((p) => p.id)).toEqual(['foresight', 'far-sight']);
    expect(perksAt(20)).toHaveLength(4);
  });

  it('are held from their level on, never before', () => {
    expect(hasPerk(14, 'free-ward')).toBe(false);
    expect(hasPerk(15, 'free-ward')).toBe(true);
    expect(hasPerk(19, 'wide-sight')).toBe(false);
    expect(hasPerk(20, 'wide-sight')).toBe(true);
  });

  it('names the one a level brings, for the level-up moment', () => {
    expect(perkAt(10)?.id).toBe('far-sight');
    expect(perkAt(11)).toBeUndefined();
  });
});
