/** BRDC-TUTOR-001 — the gates, and the rule that they arrive one at a time. */
import { describe, expect, it } from 'vitest';
import { HEARTH_RING } from './constants.js';
import { UNLOCK_IDS, nextUnlock, unlockedBy, walked } from './unlock.js';
import type { Reach, UnlockId } from './unlock.js';

const reach = (r: Partial<Reach> = {}): Reach => ({
  owned: 0,
  researched: 0,
  rivalCells: 0,
  ...r,
});

const NONE = new Set<UnlockId>();

describe('walked', () => {
  it('does not count the ring the Hearth handed over', () => {
    expect(walked(HEARTH_RING)).toBe(0);
    expect(walked(HEARTH_RING + 3)).toBe(3);
  });

  it('never goes negative, so a razed realm does not read as progress', () => {
    expect(walked(0)).toBe(0);
  });
});

describe('the gates', () => {
  it('teaches nothing before there is any ground', () => {
    expect(unlockedBy(reach())).toEqual([]);
    expect(nextUnlock(reach(), NONE)).toBeNull();
  });

  it('opens resources the moment a Hearth is founded', () => {
    expect(nextUnlock(reach({ owned: HEARTH_RING }), NONE)).toBe('resources');
  });

  // The whole reason `walked` exists: founding hands over seven cells at once, and a
  // player who is walking out of the door must not be handed three lessons in one second.
  it('does not open building on the ring alone', () => {
    expect(unlockedBy(reach({ owned: HEARTH_RING }))).toEqual(['resources']);
  });

  it('opens building on the first hex actually walked for', () => {
    expect(unlockedBy(reach({ owned: HEARTH_RING + 1 }))).toContain('building');
  });

  it('opens the temple on the third, and neighbours on the eighth', () => {
    expect(unlockedBy(reach({ owned: HEARTH_RING + 3 }))).toContain('temple');
    expect(unlockedBy(reach({ owned: HEARTH_RING + 3 }))).not.toContain('neighbours');
    expect(unlockedBy(reach({ owned: HEARTH_RING + 8 }))).toContain('neighbours');
  });

  it('opens magic on a researched technology, not on a cast', () => {
    expect(unlockedBy(reach({ researched: 1 }))).toContain('magic');
  });

  it('opens sieging when rival ground is on screen and ground has been walked for', () => {
    const walkedOne = HEARTH_RING + 1;
    expect(unlockedBy(reach({ owned: walkedOne, rivalCells: 0 }))).not.toContain('siege');
    expect(unlockedBy(reach({ owned: walkedOne, rivalCells: 1 }))).toContain('siege');
  });

  // The mock world seeds neighbours, so rival ground is visible from the first second.
  // Without the walked clause, founding taught "the ground pays" and then immediately how
  // to take somebody else's — two lessons back to back, before a single step.
  it('does not teach sieging on the founding ring alone', () => {
    expect(unlockedBy(reach({ owned: HEARTH_RING, rivalCells: 9 }))).toEqual(['resources']);
  });
});

describe('one at a time', () => {
  const rich = reach({ owned: HEARTH_RING + 20, researched: 3, rivalCells: 5 });

  it('hands back a single lesson even when everything is satisfied at once', () => {
    expect(unlockedBy(rich)).toHaveLength(UNLOCK_IDS.length);
    expect(nextUnlock(rich, NONE)).toBe('resources');
  });

  it('walks the whole ladder one acknowledgement at a time, in teaching order', () => {
    const seen = new Set<UnlockId>();
    const order: UnlockId[] = [];
    for (let id = nextUnlock(rich, seen); id; id = nextUnlock(rich, seen)) {
      order.push(id);
      seen.add(id);
    }
    expect(order).toEqual(UNLOCK_IDS);
  });

  it('goes quiet for good once everything has been taught', () => {
    expect(nextUnlock(rich, new Set(UNLOCK_IDS))).toBeNull();
  });

  it('skips a lesson already read rather than repeating it', () => {
    expect(nextUnlock(rich, new Set<UnlockId>(['resources']))).toBe('building');
  });
});
