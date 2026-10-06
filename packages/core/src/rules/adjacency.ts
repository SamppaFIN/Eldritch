/**
 * What a Work's neighbours add to it (BRDC-ADJ-001) — Civilization VI's district bonus in
 * this game's shape, so where a Work stands is a decision rather than a copy.
 *
 * Four rules (defaults, Infinite tunes them):
 *   - a Farm beside water (lake or coast)        +1 food
 *   - a Work beside another of its own kind      +1 of what it makes, per neighbour, up to +2
 *   - a Library beside a temple                  +2 wisdom
 *   - a Market beside another Market             (the second rule already pays it)
 *
 * Only your own neighbours count for "beside its own kind" — a Work that stands counts even
 * while its own hex sleeps; water and temples count wherever they are. Pure: the realm is
 * handed in, nothing is read.
 */
import { neighboursOf } from '../geo/cells.js';
import { BUILDINGS, worksOn } from './build.js';
import type { BuildingId } from './build.js';
import { terrainAt, terrainForCell } from './terrain.js';
import type { ResourceKind } from './terrain.js';
import type { Cell, H3Index } from '../types/domain.js';

export const ADJ_WATER_FOOD = 1;
export const ADJ_KIN_STEP = 1;
export const ADJ_KIN_CAP = 2;
export const ADJ_TEMPLE_WISDOM = 2;

export interface AdjacencyLine {
  resource: ResourceKind;
  amount: number;
  /** Said on the card: "beside water", "beside 2 Farms", "beside a temple". */
  why: string;
  work: BuildingId;
}

export interface AdjacencyWorld {
  /** Your own held cells, by hex. */
  owned: ReadonlyMap<H3Index, Cell>;
  /** Hexes a temple stands on. */
  temples: ReadonlySet<H3Index>;
}

const WATER = new Set(['lake', 'coast']);
const kindOf = (h3: H3Index, world: AdjacencyWorld) => {
  const c = world.owned.get(h3);
  return (c ? terrainForCell(c) : terrainAt(h3)).kind;
};

/** The first thing a Work makes — what a neighbour of its own kind adds more of. */
function mainProduct(id: BuildingId): ResourceKind | null {
  const p = BUILDINGS[id].produces;
  const first = p ? (Object.keys(p) as ResourceKind[]).find((k) => (p[k] ?? 0) > 0) : undefined;
  return first ?? null;
}

/** The lines one Work earns from where it stands. */
export function adjacencyFor(h3: H3Index, id: BuildingId, world: AdjacencyWorld): AdjacencyLine[] {
  const near = neighboursOf(h3);
  const out: AdjacencyLine[] = [];
  if (id === 'farm' && near.some((n) => WATER.has(kindOf(n, world)))) {
    out.push({ resource: 'food', amount: ADJ_WATER_FOOD, why: 'beside water', work: id });
  }
  const kin = near.filter((n) => {
    const c = world.owned.get(n);
    return c !== undefined && worksOn(c).some((w) => w.id === id);
  }).length;
  const product = mainProduct(id);
  if (kin > 0 && product) {
    out.push({ resource: product, amount: Math.min(ADJ_KIN_CAP, kin * ADJ_KIN_STEP), why: `beside ${kin} of its kind`, work: id });
  }
  if (id === 'library' && near.some((n) => world.temples.has(n))) {
    out.push({ resource: 'wisdom', amount: ADJ_TEMPLE_WISDOM, why: 'beside a temple', work: id });
  }
  return out;
}

/** Every Work on a cell, its lines together. */
export function adjacencyOnCell(cell: Cell, world: AdjacencyWorld): AdjacencyLine[] {
  return worksOn(cell).flatMap((w) => adjacencyFor(cell.h3, w.id, world));
}
