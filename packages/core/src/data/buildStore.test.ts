/**
 * BRDC-BUILD-013 — the Forge's own "adjacent iron" gate, in isolation.
 *
 * `buildOn` itself is exercised through the repository in `build.repo.test.ts`; this is
 * the one piece of new logic that call adds — a pure function, tested directly rather
 * than through a real build (which would also need a real hex whose own terrain is hill,
 * on top of the neighbour it is testing).
 *
 * The fixtures below are real H3 hexes, confirmed by the actual hash `terrainOf` uses
 * (not asserted by construction) — every claim in a comment here was run, not guessed.
 */
import { describe, expect, it } from 'vitest';
import { ironAdjacentTo } from './buildStore.js';
import type { Cell, H3Index } from '../types/domain.js';

const T0 = Date.parse('2026-09-16T12:00:00Z');
const cell = (h3: H3Index, over: Partial<Cell> = {}): Cell => ({
  h3,
  ownerId: 'me',
  strength: 300,
  lastVisitedAt: T0,
  visitDays: [],
  ...over,
});

/** Terrain: hill. One of its real neighbours (8b088a2d93b4fff) is terrain: mountain. */
const HILL_NEAR_MOUNTAIN = '8b088a2d905afff' as H3Index;
/** A different real neighbour of HILL_NEAR_MOUNTAIN, terrain: plain — isolates the
 *  "a Mine already stands here" path from the "this neighbour is mountain" path. */
const PLAIN_NEIGHBOUR = '8b088a2d90edfff' as H3Index;
/** The confirmed statue's own hex — none of its six real neighbours are mountain. */
const NO_MOUNTAIN_NEARBY = '8b088a2dab1cfff' as H3Index;
/** Kilometres from NO_MOUNTAIN_NEARBY — reusing MOUNTAIN_NEIGHBOUR would prove nothing
 *  new, since its own terrain already makes it iron on its own. */
const NOT_A_NEIGHBOUR = PLAIN_NEIGHBOUR;

describe('ironAdjacentTo', () => {
  it('is true when a real neighbour is naturally mountain terrain', () => {
    expect(ironAdjacentTo(HILL_NEAR_MOUNTAIN, [])).toBe(true);
  });

  it('is false with no owned Mine and no natural mountain neighbour', () => {
    expect(ironAdjacentTo(NO_MOUNTAIN_NEARBY, [])).toBe(false);
  });

  it('is true when an owned Mine stands on a neighbour that is not itself mountain', () => {
    const mineOnPlain = cell(PLAIN_NEIGHBOUR, { buildings: [{ id: 'mine', builtAt: T0 }] });
    expect(ironAdjacentTo(HILL_NEAR_MOUNTAIN, [mineOnPlain])).toBe(true);
  });

  it('does not count a Mine on a cell that is not actually a neighbour', () => {
    const farAway = cell(NOT_A_NEIGHBOUR, { buildings: [{ id: 'mine', builtAt: T0 }] });
    expect(ironAdjacentTo(NO_MOUNTAIN_NEARBY, [farAway])).toBe(false);
  });
});
