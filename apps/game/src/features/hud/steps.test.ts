import { describe, expect, it } from 'vitest';
import { GOAL_CELLS, HEARTH_RING, nextStep } from './steps.js';
import type { Progress } from './steps.js';

/**
 * PIVOT-2026-09-09 §1 — the opening is a ladder, and it is read from state.
 *
 * The rule `BRDC-TUTOR-001` sets out: a threshold is a question about the world right
 * now, never a counter fed by events. These are the cases where the two answers differ.
 */
const at = (p: Partial<Progress>): Progress => ({ owned: HEARTH_RING, works: 0, researched: 0, ...p });

describe('nextStep', () => {
  it('opens by asking for the first step off the Hearth ring', () => {
    expect(nextStep(at({}))?.id).toBe('walk');
  });

  it('still asks to walk while the ring is all there is, however it was reached', () => {
    expect(nextStep(at({ owned: HEARTH_RING - 3 }))?.id).toBe('walk');
    expect(nextStep(at({ owned: HEARTH_RING }))?.id).toBe('walk');
  });

  it('moves to building the moment ground was actually taken', () => {
    expect(nextStep(at({ owned: HEARTH_RING + 1 }))?.id).toBe('build');
  });

  it('asks for research once something stands', () => {
    expect(nextStep(at({ owned: HEARTH_RING + 1, works: 1 }))?.id).toBe('research');
  });

  it('then asks for more ground, because that is what research pays on', () => {
    expect(nextStep(at({ owned: HEARTH_RING + 1, works: 1, researched: 1 }))?.id).toBe('expand');
  });

  it('is finished at the goal — ten hexes, a Work and a technology', () => {
    expect(nextStep({ owned: GOAL_CELLS, works: 1, researched: 1 })).toBeNull();
  });

  /*
   * The case an event counter gets wrong. A player who walks a long lap can arrive with
   * ten hexes and nothing built; the ladder must put them on 'build', not congratulate
   * them for a step it never saw them take.
   */
  it('skips the rungs a big lap jumped over, rather than replaying them', () => {
    expect(nextStep({ owned: 40, works: 0, researched: 0 })?.id).toBe('build');
    expect(nextStep({ owned: 40, works: 3, researched: 0 })?.id).toBe('research');
    expect(nextStep({ owned: 40, works: 3, researched: 2 })).toBeNull();
  });

  it('says one thing to do and one reason, never a paragraph', () => {
    for (const p of [at({}), at({ owned: 9 }), at({ owned: 9, works: 1 })]) {
      const step = nextStep(p);
      expect(step).not.toBeNull();
      expect(step?.hint.split('.').filter(Boolean)).toHaveLength(1);
      expect(step?.because.length).toBeLessThan(90);
    }
  });
});
