/**
 * Where a hex's yield comes from (BRDC-YIELD-001, Infinite's handoff F-01).
 *
 * One context, two answers from the same functions: `realmBonus` is the hourly bonus the
 * settle pays — the exact sum and rounding the pouch always used — and `computeHexYield`
 * is one hex's share of it, itemised for the card and the map. Neither recomputes a rule:
 * every source below is the rule function the pouch already called, given one hex.
 *
 * The realm's multipliers (masterworks, sanity, Second Lake, dark time) act on the realm's
 * total and round there. On a hex they show as `other` lines, each the hex's raw share —
 * so a hex's `totals` is exactly its contributions, and the realm's is within a unit of the
 * sum of its hexes.
 */
import type { Cell, H3Index } from '../types/domain.js';
import type { ResourceKind, ResourcePool } from './terrain.js';
import { trickleRate, terrainForCell } from './terrain.js';
import { buildingBonus, worksOn } from './build.js';
import { bountyBonus, bountyOn } from './bounty.js';
import { landmarkBonus } from './landmark.js';
import { placeBonus } from './mana.js';
import type { Place } from './dwell.js';
import { researchBonus } from './tech.js';
import type { TechId } from './tech.js';
import { resourceAura } from './aura.js';
import { activeSpells } from './spell.js';
import type { ActiveSpell } from './spell.js';
import { domainSpellBonus } from './spellEffects.js';
import { boonParts, staffedBonus, staffedCells, staffedModifiers, staffedParts } from './staffing.js';
import { calmAt } from './citizens.js';
import type { KeepState } from './citizens.js';
import { worksBonus, worksBonusByCell } from './works/bonus.js';
import type { KindAt, WorksTrees } from './works/bonus.js';
import { BUILDING_NAMES_PLAIN } from '../data/counselNames.js';

export type YieldSource = 'terrain' | 'building' | 'citizen' | 'tech' | 'temple' | 'anomaly' | 'other';

export interface YieldContribution {
  resource: ResourceKind;
  amount: number;
  source: YieldSource;
  label: string;
  sourceId?: string;
}

export interface HexYield {
  totals: Partial<ResourcePool>;
  contributions: YieldContribution[];
}

export interface YieldContext {
  now: number;
  owned: readonly Cell[];
  /** A Season 2 Keep; absent on a Season 1 save. */
  keep?: KeepState | undefined;
  places: readonly Place[];
  expansions: Readonly<Record<H3Index, number>>;
  revealed: Readonly<Record<H3Index, number>>;
  researched: readonly TechId[];
  spells: readonly ActiveSpell[];
  trees: WorksTrees;
  kindAt: KindAt;
  /** The dark-time factor on everything produced (BRDC-EVENT-001), 1 the rest of the year. */
  factor: number;
}

const title = (id: string): string => id.replace(/(^|-)(\w)/g, (_, dash: string, c: string) => (dash ? ' ' : '') + c.toUpperCase());
const workName = (id: string): string => BUILDING_NAMES_PLAIN[id as keyof typeof BUILDING_NAMES_PLAIN] ?? title(id);

function addInto(into: Partial<ResourcePool>, from: Partial<ResourcePool>): void {
  for (const [k, v] of Object.entries(from) as [ResourceKind, number][]) into[k] = (into[k] ?? 0) + v;
}

/** The cells a Works tree pays on: every held cell, or only the staffed ones on a Season 2 save. */
const working = (ctx: YieldContext): readonly Cell[] => (ctx.keep ? staffedCells(ctx.owned, ctx.keep.staff ?? {}) : ctx.owned);

/** The hourly bonus the settle pays — the pouch's own sum, in its own order (golden-tested). */
export function realmBonus(ctx: YieldContext): Partial<ResourcePool> {
  const { owned, now, keep } = ctx;
  const merged: Partial<ResourcePool> = keep
    ? staffedBonus(owned, keep.staff ?? {}, now, keep.boons, keep.granary.citizens, keep.gatesNear, calmAt(keep, now))
    : { ...buildingBonus(owned, now) };
  addInto(merged, placeBonus(ctx.places, ctx.expansions, owned, now));
  addInto(merged, domainSpellBonus(activeSpells(ctx.spells, now), now));
  addInto(merged, resourceAura(owned, now));
  addInto(merged, researchBonus(ctx.researched, owned, now));
  // Bounties pay only on ground that has been revealed (BRDC-BOUNTY-001).
  addInto(merged, bountyBonus(owned, ctx.revealed, now));
  addInto(merged, landmarkBonus(owned, now));
  addInto(merged, worksBonus(working(ctx), ctx.trees, ctx.kindAt, now));
  return merged;
}

/** What belongs to the realm and to no hex: a running domain spell. */
export function realmOnlyYield(ctx: YieldContext): YieldContribution[] {
  const out: YieldContribution[] = [];
  for (const s of activeSpells(ctx.spells, ctx.now)) {
    for (const [k, v] of Object.entries(domainSpellBonus([s], ctx.now)) as [ResourceKind, number][]) {
      out.push({ resource: k, amount: v, source: 'other', label: `Spell: ${title(s.id)}`, sourceId: s.id });
    }
  }
  return out;
}

/** One hex's yield per hour, itemised. Dormant ground yields nothing, as everywhere. */
export function computeHexYield(cell: Cell, ctx: YieldContext): HexYield {
  const { now, owned, keep } = ctx;
  const out: YieldContribution[] = [];
  const push = (from: Partial<ResourcePool>, source: YieldSource, label: string, sourceId?: string) => {
    for (const [k, v] of Object.entries(from) as [ResourceKind, number][]) {
      if (v !== 0) out.push({ resource: k, amount: v, source, label, ...(sourceId ? { sourceId } : {}) });
    }
  };
  const ground = terrainForCell(cell).kind;
  const t = trickleRate(cell, now);
  if (t) push({ [t.resource]: t.perHour }, 'terrain', `Terrain: ${title(ground)}`, ground);

  if (keep) {
    const staff = keep.staff ?? {};
    const mine = staffedParts(owned, staff, now).filter((p) => p.h3 === cell.h3);
    for (const p of mine) {
      const label = p.kind === 'ground' ? `${workName(p.work ?? '')}: ground in reach` : `${workName(p.work ?? '')} · ${p.hands} ${p.hands === 1 ? 'worker' : 'workers'}`;
      push({ [p.resource]: p.amount }, p.kind === 'ground' ? 'terrain' : 'citizen', label, p.work ?? undefined);
    }
    // The realm's multipliers, as this hex's raw share of what they do to the total.
    const base: Partial<ResourcePool> = {};
    for (const p of mine) base[p.resource] = (base[p.resource] ?? 0) + p.amount;
    const m = staffedModifiers(owned, staff, now, keep.boons, keep.granary.citizens, keep.gatesNear, calmAt(keep, now));
    let running = { ...base };
    const step = (f: (k: ResourceKind, v: number) => number, label: string) => {
      const next: Partial<ResourcePool> = {};
      for (const [k, v] of Object.entries(running) as [ResourceKind, number][]) {
        next[k] = f(k, v);
        if (next[k] !== v) out.push({ resource: k, amount: (next[k] as number) - v, source: 'other', label });
      }
      running = next;
    };
    if (m.foundry) step((k, v) => (k === 'iron' || k === 'stone' ? v * 1.5 : v), 'Foundry');
    if (m.cathedral) step((k, v) => (k === 'mana' ? v * 1.5 : v), 'Sunken Cathedral');
    if (m.sanity !== 1) step((_, v) => (v > 0 ? v * m.sanity : v), 'Sanity');
    if (m.lift > 0) step((_, v) => (v > 0 ? v * (1 + m.lift / 100) : v), 'Second Lake');
    for (const p of boonParts(owned, staff, now, keep.boons ?? []).filter((b) => b.h3 === cell.h3)) {
      push({ [p.resource]: p.amount }, 'other', `Rite: ${title(p.rite ?? '')}`, p.rite);
    }
  } else {
    for (const w of worksOn(cell)) push(buildingBonus([{ ...cell, buildings: [w] }], now), 'building', workName(w.id), w.id);
  }

  for (const p of ctx.places.filter((pl) => pl.h3 === cell.h3)) {
    push(placeBonus([p], ctx.expansions, [cell], now), 'temple', p.kind === 'anchor' ? 'Anchor Stone' : 'Temple', p.kind);
  }
  push(resourceAura([cell], now, owned), 'building', 'Aura of nearby Works');
  push(researchBonus(ctx.researched, [cell], now), 'tech', 'Research');
  const bounty = bountyOn(cell);
  push(bountyBonus([cell], ctx.revealed, now), 'terrain', bounty ? `Find: ${title(bounty.id)}` : 'Find', bounty?.id);
  push(landmarkBonus([cell], now), 'other', 'Landmark');
  push(worksBonusByCell(working(ctx), ctx.trees, ctx.kindAt, now).get(cell.h3) ?? {}, 'building', 'Works research');

  if (ctx.factor !== 1) {
    const sum: Partial<ResourcePool> = {};
    for (const c of out) sum[c.resource] = (sum[c.resource] ?? 0) + c.amount;
    for (const [k, v] of Object.entries(sum) as [ResourceKind, number][]) {
      if (v > 0) out.push({ resource: k, amount: v * (ctx.factor - 1), source: 'other', label: 'Dark time' });
    }
  }

  const totals: Partial<ResourcePool> = {};
  for (const c of out) totals[c.resource] = (totals[c.resource] ?? 0) + c.amount;
  return { totals, contributions: out };
}
