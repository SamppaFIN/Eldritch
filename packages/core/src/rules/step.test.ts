/**
 * BRDC-CLAIM-009 — claiming ground by walking into it.
 */
import { describe, expect, it } from 'vitest';
import { cellAt, neighboursOf } from '../geo/cells.js';
import { destination } from '../geo/project.js';
import { claimableStep } from './step.js';
import type { Cell } from '../types/domain.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };

const held = (h3: string): Cell => ({
  h3,
  ownerId: 'me',
  strength: 200,
  lastVisitedAt: 0,
  visitDays: [],
});

describe('claimableStep', () => {
  it('takes a cell that borders your ground', () => {
    const home = cellAt(ORIGIN);
    const neighbour = neighboursOf(home)[0] as string;
    expect(claimableStep(neighbour, [held(home)], home)).toBe(neighbour);
  });

  it('takes nothing off your border', () => {
    const home = cellAt(ORIGIN);
    const faraway = cellAt(destination(ORIGIN, 0, 5_000));
    expect(claimableStep(faraway, [held(home)], home)).toBeNull();
  });

  it('takes the Hearth itself, so the first cell can be claimed with no territory', () => {
    const home = cellAt(ORIGIN);
    expect(claimableStep(home, [], home)).toBe(home);
  });

  it('takes nothing when you are already standing on your own ground', () => {
    const home = cellAt(ORIGIN);
    expect(claimableStep(home, [held(home)], home)).toBeNull();
  });

  it('takes nothing when there is no cell underfoot', () => {
    expect(claimableStep(null, [held(cellAt(ORIGIN))], cellAt(ORIGIN))).toBeNull();
  });
});
