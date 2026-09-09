import { describe, expect, it } from 'vitest';
import {
  BASE_BUILDING_CAP,
  CELL_BUILDING_CAP,
  GRANARY_CAPACITY,
  buildingCapacity,
} from '@es3/core';
import type { BuildingId } from '@es3/core';

/**
 * BRDC-BUILD-008 — the wall behind "ostaminen jumissa".
 *
 * `BASE_BUILDING_CAP` is a player-wide limit, not a per-hex one, and nothing in the panel
 * said so: the refusal printed its own slug ("at capacity") and the count was never shown
 * until you hit it. These pin the arithmetic the message now quotes, so the copy and the
 * rule cannot drift apart.
 */
const g = (n: number): BuildingId[] => Array.from({ length: n }, () => 'granary' as BuildingId);

describe('buildingCapacity', () => {
  it('starts at the base cap with nothing built', () => {
    expect(buildingCapacity([])).toBe(BASE_BUILDING_CAP);
  });

  it('a Granary raises it by its own constant, which the refusal quotes', () => {
    expect(buildingCapacity(g(1))).toBe(BASE_BUILDING_CAP + GRANARY_CAPACITY);
    expect(buildingCapacity(g(3))).toBe(BASE_BUILDING_CAP + 3 * GRANARY_CAPACITY);
  });

  it('a Granary nets less than it grants, because it occupies a slot itself', () => {
    // The number that matters to a player with a lot of ground: each Granary is worth
    // GRANARY_CAPACITY - 1 more *other* Works, not GRANARY_CAPACITY.
    const free = (n: number) => buildingCapacity(g(n)) - n;
    expect(free(0)).toBe(BASE_BUILDING_CAP);
    expect(free(1) - free(0)).toBe(GRANARY_CAPACITY - 1);
    expect(free(5) - free(4)).toBe(GRANARY_CAPACITY - 1);
  });

  it('the per-hex cap is a different, smaller number — the two refusals are not the same wall', () => {
    expect(CELL_BUILDING_CAP).toBeLessThan(BASE_BUILDING_CAP);
  });
});
