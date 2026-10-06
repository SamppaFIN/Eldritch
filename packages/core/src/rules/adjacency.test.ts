/** BRDC-ADJ-001 — what a Work's neighbours add to it. */
import { describe, expect, it } from 'vitest';
import { adjacencyFor, adjacencyOnCell, ADJ_KIN_CAP } from './adjacency.js';
import type { AdjacencyWorld } from './adjacency.js';
import { terrainAt } from './terrain.js';
import { cellAt, cellsWithin, neighboursOf } from '../geo/cells.js';
import type { BuildingId, Cell } from '../types/domain.js';

const T = Date.parse('2026-10-06T12:00:00Z');
const cell = (h3: string, works: BuildingId[] = []): Cell => ({
  h3, ownerId: 'me', strength: 100, lastVisitedAt: T, visitDays: [],
  buildings: works.map((id) => ({ id, builtAt: T })),
});
const world = (cells: Cell[], temples: string[] = []): AdjacencyWorld => ({
  owned: new Map(cells.map((c) => [c.h3, c])),
  temples: new Set(temples),
});

// The core's own hash has no water near Härmälä (lakes come from the Worldseed data the
// app loads), so a test lays its water down as a held lake cell beside the Farm.
const dry = cellAt({ lat: 61.4729, lng: 23.7258 });
const lakeBeside = (h: string): Cell => ({ ...cell(neighboursOf(h)[0] as string), terrain: { kind: 'lake', source: 'tiles' } });

describe('adjacencyFor', () => {
  it('a Farm beside water gets +1 food; away from it, nothing', () => {
    expect(neighboursOf(dry).some((n) => ['lake', 'coast'].includes(terrainAt(n).kind))).toBe(false);
    expect(adjacencyFor(dry, 'farm', world([cell(dry, ['farm']), lakeBeside(dry)]))).toContainEqual({ resource: 'food', amount: 1, why: 'beside water', work: 'farm' });
    expect(adjacencyFor(dry, 'farm', world([cell(dry, ['farm'])]))).toEqual([]);
  });

  it('a Work beside its own kind makes one more per neighbour, up to two', () => {
    const [a, b, c, d] = [dry, ...neighboursOf(dry)] as string[];
    const one = world([cell(a as string, ['sawmill']), cell(b as string, ['sawmill'])]);
    expect(adjacencyFor(a as string, 'sawmill', one)).toEqual([{ resource: 'wood', amount: 1, why: 'beside 1 of its kind', work: 'sawmill' }]);
    const three = world([cell(a as string, ['sawmill']), cell(b as string, ['sawmill']), cell(c as string, ['sawmill']), cell(d as string, ['sawmill'])]);
    expect(adjacencyFor(a as string, 'sawmill', three)[0]?.amount).toBe(ADJ_KIN_CAP);
  });

  it('a lone Work has no kin', () => {
    // `owned` is your own ground only, so a rival's Sawmill next door is never in it.
    expect(adjacencyFor(dry, 'sawmill', world([cell(dry, ['sawmill'])]))).toEqual([]);
  });

  it('a Library beside a temple gets +2 wisdom', () => {
    const t = neighboursOf(dry)[0] as string;
    expect(adjacencyFor(dry, 'library', world([cell(dry, ['library'])], [t]))).toContainEqual({ resource: 'wisdom', amount: 2, why: 'beside a temple', work: 'library' });
  });

  it('adjacencyOnCell gathers every Work on the hex', () => {
    const t = neighboursOf(dry)[1] as string;
    const c = cell(dry, ['farm', 'library']);
    expect(adjacencyOnCell(c, world([c, lakeBeside(dry)], [t])).map((l) => l.why).sort()).toEqual(['beside a temple', 'beside water']);
  });
});

describe('the golden realm (yield.golden.test.ts)', () => {
  it('its +1 food is the Farm on ring[1], beside the (sleeping) Farm on ring[6]', () => {
    // A Work that stands counts as kin even while its own hex sleeps; it is still there.
    const ring = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 2);
    const [a, b] = [ring[1], ring[6]] as string[];
    expect(neighboursOf(a as string)).toContain(b);
    expect(adjacencyFor(a as string, 'farm', world([cell(a as string, ['farm']), cell(b as string, ['farm'])]))).toEqual([{ resource: 'food', amount: 1, why: 'beside 1 of its kind', work: 'farm' }]);
  });
});
