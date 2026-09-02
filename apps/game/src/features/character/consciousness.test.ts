/**
 * BRDC-CHAR-001 / BRDC-WIKI-002 — the Consciousness ladder.
 */
import { describe, expect, it } from 'vitest';
import { milestoneForLevel, visibleMilestones } from './consciousness.js';

describe('milestoneForLevel', () => {
  it('takes the lower milestone for a level between two', () => {
    expect(milestoneForLevel(1).name).toBe('Dormant');
    expect(milestoneForLevel(6).name).toBe('Awakening');
    expect(milestoneForLevel(14).name).toBe('Aware');
    expect(milestoneForLevel(25).name).toBe('Transcendent');
  });
});

describe('visibleMilestones (BRDC-WIKI-002)', () => {
  it('shows only what has been reached, plus the next one unexplained', () => {
    const { reached, next } = visibleMilestones(6);
    expect(reached.map((m) => m.name)).toEqual(['Dormant', 'Awakening']);
    expect(next?.name).toBe('Aware');
  });

  it('a new player sees one rung and the next', () => {
    const { reached, next } = visibleMilestones(1);
    expect(reached.map((m) => m.name)).toEqual(['Dormant']);
    expect(next?.name).toBe('Awakening');
  });

  it('at the cap there is no next', () => {
    const { reached, next } = visibleMilestones(20);
    expect(reached).toHaveLength(5);
    expect(next).toBeNull();
  });
});
