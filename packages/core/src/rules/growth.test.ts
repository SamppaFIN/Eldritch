import { describe, expect, it } from 'vitest';
import { cellAt, neighboursOf } from '../geo/cells.js';
import { destination } from '../geo/project.js';
import { BASE_STRENGTH, MAX_STRENGTH } from './constants.js';
import { emptyCell } from './capture.js';
import { growInto, growthNeighbourhood } from './growth.js';
import type { Cell } from '../types/domain.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const HERE = cellAt(ORIGIN);
const ME = { id: 'me', level: 1 };
const RIVAL = 'the-pale-warden';
const NOW = Date.parse('2026-08-27T12:00:00Z');

function owned(h3: string, owner: string, strength = BASE_STRENGTH): Cell {
  return { h3, ownerId: owner, strength, lastVisitedAt: NOW, visitDays: [] };
}

/** A cell far enough away that it shares no edge with HERE. */
const FAR = cellAt(destination(ORIGIN, 45, 400));

describe('the first claim', () => {
  it('is taken wherever the player stands', () => {
    // A player with nothing has to start somewhere, or the game can never begin.
    const result = growInto(HERE, new Map(), ME, NOW, false);
    expect(result.skipped).toBeNull();
    expect(result.cell?.ownerId).toBe('me');
    expect(result.outcome?.kind).toBe('claimed');
  });
});

describe('adjacency', () => {
  it('takes ground that touches what you hold', () => {
    const neighbour = neighboursOf(HERE)[0] as string;
    const known = new Map([[neighbour, owned(neighbour, 'me')]]);

    const result = growInto(HERE, known, ME, NOW, true);
    expect(result.skipped).toBeNull();
    expect(result.cell?.ownerId).toBe('me');
  });

  it('silently skips ground that touches nothing', () => {
    // This is the whole anti-jump guard: a fix that lands sideways claims nothing.
    const somewhere = neighboursOf(FAR)[0] as string;
    const known = new Map([[somewhere, owned(somewhere, 'me')]]);

    const result = growInto(HERE, known, ME, NOW, true);
    expect(result.skipped).toBe('not-adjacent');
    expect(result.cell).toBeNull();
    expect(result.outcome).toBeNull();
  });

  it('does not count a rival next door as adjacency', () => {
    const neighbour = neighboursOf(HERE)[0] as string;
    const known = new Map([[neighbour, owned(neighbour, RIVAL)]]);

    expect(growInto(HERE, known, ME, NOW, true).skipped).toBe('not-adjacent');
  });

  it('lets growth resume where the signal recovers', () => {
    // A jump claims nothing; the next good fix carries on from real ground.
    const neighbour = neighboursOf(HERE)[0] as string;
    const known = new Map([[neighbour, owned(neighbour, 'me')]]);

    expect(growInto(FAR, known, ME, NOW, true).skipped).toBe('not-adjacent');
    expect(growInto(HERE, known, ME, NOW, true).skipped).toBeNull();
  });
});

describe('standing on ground that is already yours', () => {
  it('counts as a visit rather than a claim', () => {
    const known = new Map([[HERE, owned(HERE, 'me')]]);
    const result = growInto(HERE, known, ME, NOW, true);

    expect(result.outcome?.kind).toBe('reinforced');
    expect(result.cell?.lastVisitedAt).toBe(NOW);
  });

  it('needs no neighbour — you are already there', () => {
    const known = new Map([[HERE, owned(HERE, 'me')]]);
    expect(growInto(HERE, known, ME, NOW, true).skipped).toBeNull();
  });
});

describe('walking onto a rival', () => {
  it('damages rather than takes, when they are strong', () => {
    const neighbour = neighboursOf(HERE)[0] as string;
    const known = new Map([
      [HERE, owned(HERE, RIVAL, MAX_STRENGTH)],
      [neighbour, owned(neighbour, 'me')],
    ]);

    const result = growInto(HERE, known, ME, NOW, true);
    expect(result.outcome?.kind).toBe('damaged');
    expect(result.cell?.ownerId).toBe(RIVAL);
  });

  it('takes it when it finally gives', () => {
    const neighbour = neighboursOf(HERE)[0] as string;
    const known = new Map([
      [HERE, owned(HERE, RIVAL, 30)],
      [neighbour, owned(neighbour, 'me')],
    ]);

    const result = growInto(HERE, known, ME, NOW, true);
    expect(result.outcome?.kind).toBe('taken');
    expect(result.cell?.ownerId).toBe('me');
  });

  it('still needs to be reachable — a rival across town is safe', () => {
    const known = new Map([[HERE, owned(HERE, RIVAL, 10)]]);
    expect(growInto(HERE, known, ME, NOW, true).skipped).toBe('not-adjacent');
  });

  it('hits harder from ground you already surround it with', () => {
    const ring = neighboursOf(HERE);
    const oneSide = new Map<string, Cell>([
      [HERE, owned(HERE, RIVAL, MAX_STRENGTH)],
      [ring[0] as string, owned(ring[0] as string, 'me')],
    ]);
    const allSides = new Map<string, Cell>([[HERE, owned(HERE, RIVAL, MAX_STRENGTH)]]);
    for (const n of ring) allSides.set(n, owned(n, 'me'));

    const light = growInto(HERE, oneSide, ME, NOW, true).cell?.strength ?? 0;
    const heavy = growInto(HERE, allSides, ME, NOW, true).cell?.strength ?? 0;
    expect(heavy).toBeLessThan(light);
  });
});

describe('growthNeighbourhood', () => {
  it('is the cell and its six neighbours', () => {
    const needed = growthNeighbourhood(HERE);
    expect(needed).toHaveLength(7);
    expect(needed[0]).toBe(HERE);
    expect(new Set(needed).size).toBe(7);
  });
});

describe('purity', () => {
  it('never mutates the cells it was given', () => {
    const known = new Map([[HERE, owned(HERE, RIVAL, 300)]]);
    const snapshot = structuredClone(known.get(HERE));
    growInto(HERE, known, ME, NOW, false);
    expect(known.get(HERE)).toEqual(snapshot);
  });

  it('treats an unknown cell as empty ground', () => {
    const result = growInto(HERE, new Map(), ME, NOW, false);
    expect(result.outcome?.previousOwner).toBeNull();
    expect(result.cell?.strength).toBe(emptyCell(HERE).strength + BASE_STRENGTH);
  });
});
