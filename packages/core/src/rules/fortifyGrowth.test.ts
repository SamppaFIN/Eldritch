/**
 * BRDC-BUILD-012, part B — walking into fortified ground.
 *
 * `growInto` is how most ground changes hands: a player walks onto a rival's hex that
 * touches their own. With a Fortress of the rival's standing by it, that hex holds at 1.
 */
import { describe, expect, it } from 'vitest';
import { cellAt, neighboursOf } from '../geo/cells.js';
import { growInto } from './growth.js';
import type { Cell } from '../types/domain.js';

const CENTRE = cellAt({ lat: 61.4729, lng: 23.7259 });
const TARGET = neighboursOf(CENTRE)[0] as string;
const MINE_BESIDE = neighboursOf(TARGET).find((h) => h !== CENTRE) as string;
const ME = { id: 'me', level: 1 };
const RIVAL = 'the-pale-warden';
const NOW = Date.parse('2026-08-28T12:00:00Z');
const FORTRESS = [{ id: 'fortress' as const, builtAt: 0 }];

const held = (h3: string, owner: string, strength: number, over: Partial<Cell> = {}): Cell => ({
  h3,
  ownerId: owner,
  strength,
  lastVisitedAt: NOW,
  visitDays: [],
  ...over,
});
const map = (...cells: Cell[]) => new Map(cells.map((c) => [c.h3, c]));

describe('walking into a rival hex', () => {
  it('under their Fortress it holds at 1, even when already at 1', () => {
    const known = map(
      held(CENTRE, RIVAL, 500, { buildings: FORTRESS }),
      held(TARGET, RIVAL, 1),
      held(MINE_BESIDE, 'me', 200),
    );
    const r = growInto(TARGET, known, ME, NOW, true);
    expect(r.outcome?.kind).toBe('damaged');
    expect(r.cell?.ownerId).toBe(RIVAL);
    expect(r.cell?.strength).toBe(1);
  });

  it('control: with no Fortress beside it, the same hex is taken', () => {
    const known = map(held(TARGET, RIVAL, 1), held(MINE_BESIDE, 'me', 200));
    const r = growInto(TARGET, known, ME, NOW, true);
    expect(r.outcome?.kind).toBe('taken');
    expect(r.cell?.ownerId).toBe('me');
  });
});
