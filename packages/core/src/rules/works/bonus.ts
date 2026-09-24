/**
 * What learned research pays, per hour, and how far it raises the pouch's ceilings
 * (BRDC-WORKS-002). Pure: the held cells, each building's learned nodes, and which page a
 * cell is, in; a bonus pool out. Only wired effects count — the same set `tree.ts` lets a
 * player learn.
 */
import { cellsWithin } from '../../geo/cells.js';
import { BUILDINGS } from '../build.js';
import { provinceCount } from '../nation.js';
import { DORMANT_AFTER_MS, RESOURCE_KINDS, terrainForCell } from '../terrain.js';
import type { ResourceKind, ResourcePool } from '../terrain.js';
import type { BuildingId, Cell, H3Index } from '../../types/domain.js';
import { WORKS_DEFS } from './defs/index.js';
import { activeEffects, isWired, reachRings } from './tree.js';
import type { Effect, WorksKind } from './types.js';

export type WorksTrees = Readonly<Record<H3Index, readonly string[]>>;
export type KindAt = (cell: Cell) => WorksKind | null;

function add(into: Partial<ResourcePool>, k: ResourceKind, v: number): void {
  if (v !== 0) into[k] = (into[k] ?? 0) + v;
}

/** Every wired effect a building has now: its ring's own, then what it has learned. */
function effectsOf(kind: WorksKind, learned: readonly string[]): Effect[] {
  const def = WORKS_DEFS[kind];
  const own = def.reach?.effect ? [def.reach.effect] : [];
  return [...own, ...activeEffects(def, learned)].filter((e) => isWired(def, e));
}

function isBuildingId(kind: WorksKind): kind is WorksKind & BuildingId {
  return kind in BUILDINGS;
}

export function worksBonus(
  owned: readonly Cell[],
  trees: WorksTrees,
  kindAt: KindAt,
  now: number,
): Partial<ResourcePool> {
  const out: Partial<ResourcePool> = {};
  const byH3 = new Map(owned.map((c) => [c.h3, c] as const));
  const provinces = provinceCount(owned);
  const pages = owned.flatMap((c) => {
    const kind = kindAt(c);
    return kind ? [{ cell: c, kind, effects: effectsOf(kind, trees[c.h3] ?? []) }] : [];
  });

  // A multiplier one building puts on another's output — Charcoal Pits on every Forge.
  const mult = new Map<string, number>();
  for (const p of pages) {
    for (const e of p.effects) {
      if (e.kind === 'worksMult') mult.set(`${e.target}:${e.resource}`, (mult.get(`${e.target}:${e.resource}`) ?? 0) + e.pct);
    }
  }

  for (const p of pages) {
    if (now - p.cell.lastVisitedAt > DORMANT_AFTER_MS) continue;
    const own: Partial<ResourcePool> = {};
    const base = isBuildingId(p.kind) ? (BUILDINGS[p.kind].produces ?? {}) : {};
    const rings = reachRings(WORKS_DEFS[p.kind], trees[p.cell.h3] ?? []);
    for (const e of p.effects) {
      if (e.kind === 'produce') {
        for (const [k, v] of Object.entries(e.yields) as [ResourceKind, number][]) add(own, k, v);
      } else if (e.kind === 'producePer' && e.per === 'province') {
        add(own, e.resource, e.amount * provinces);
      } else if (e.kind === 'producePer') {
        const near = cellsWithin(p.cell.h3, rings).filter((h) => h !== p.cell.h3);
        const count = near.filter((h) => {
          const c = byH3.get(h);
          return c !== undefined && (!e.terrain || terrainForCell(c).kind === e.terrain);
        }).length;
        add(own, e.resource, e.amount * count);
      } else if (e.kind === 'convert') {
        add(own, e.from, -e.fromAmount);
        add(own, e.to, e.toAmount);
      }
    }
    for (const k of RESOURCE_KINDS) {
      const pct = mult.get(`${p.kind}:${k}`) ?? 0;
      if (pct > 0) add(own, k, Math.floor((((base[k] ?? 0) + Math.max(0, own[k] ?? 0)) * pct) / 100));
    }
    for (const e of p.effects) {
      if (e.kind === 'produceFrom') add(own, e.resource, ((base[e.from] ?? 0) + Math.max(0, own[e.from] ?? 0)) * e.ratio);
    }
    for (const [k, v] of Object.entries(own) as [ResourceKind, number][]) add(out, k, v);
  }
  return out;
}

/** How far learned research raises each resource's ceiling. Not dormancy-filtered: a
 *  granary loft still holds grain on a week you did not walk past it. */
export function worksCapBonus(owned: readonly Cell[], trees: WorksTrees, kindAt: KindAt): Partial<ResourcePool> {
  const out: Partial<ResourcePool> = {};
  for (const c of owned) {
    const kind = kindAt(c);
    if (!kind) continue;
    for (const e of effectsOf(kind, trees[c.h3] ?? [])) {
      if (e.kind === 'storageCap') add(out, e.resource, e.amount);
    }
  }
  return out;
}
