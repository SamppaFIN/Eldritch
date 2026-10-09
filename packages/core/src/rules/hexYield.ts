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
import { LIBRARIAN_WISDOM } from './archetype.js';
import type { ArchetypeId } from './archetype.js';
import { DORMANT_AFTER_MS, trickleRate, terrainForCell } from './terrain.js';
import { adjacencyFor } from './adjacency.js';
import type { AdjacencyLine } from './adjacency.js';
import type { MythosCard } from './doom.js';
import { BUILDINGS, buildingBonus, worksOn } from './build.js';
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
import { boonParts, staffKey, staffedBonus, staffedCells, staffedModifiers, staffedParts } from './staffing.js';
import type { StaffedModifiers, StaffedPart } from './staffing.js';
import { calmAt } from './citizens.js';
import type { KeepState } from './citizens.js';
import { worksBonus, worksBonusByCell } from './works/bonus.js';
import type { KindAt, WorksTrees } from './works/bonus.js';
import { BUILDING_NAMES_PLAIN } from '../data/counselNames.js';
import { ERAS, eraBonus } from './era.js';
import { BOONS, boonBonus } from './age.js';
import { FULL_MOON_MANA, HARVEST_MOON_FOOD, isFullMoon } from './moon.js';
import { routeActive, routeGold, routesGold } from './tradeRoute.js';
import type { TradeRoute } from './tradeRoute.js';
import { SUZERAIN_BONUS } from './suzerain.js';
import { cityStateById } from './cityState.js';
import { FLOOD_FACTOR, floodsAt } from './choir.js';
import { terrorEffects } from './terror.js';
import type { CityStateId } from './cityState.js';
import type { BoonId, WeekKind } from './age.js';
import type { EraId } from './era.js';

export type YieldSource = 'terrain' | 'building' | 'citizen' | 'tech' | 'temple' | 'anomaly' | 'adjacency' | 'other';

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
  /** Who the investigator is (BRDC-INVEST-001) — the Librarian lifts wisdom. */
  archetype?: ArchetypeId | undefined;
  /** Today's Mythos card, when a season is known (BRDC-MYTHOS-001). */
  mythos?: MythosCard | null | undefined;
  /** The realm's character at each Age entered (BRDC-ERA-001). */
  eras?: readonly EraId[] | undefined;
  /** This week's golden or dark age (BRDC-AGE-001): its factor on everything made, and a golden week's boon. */
  week?: { factor: number; kind: WeekKind; boon?: BoonId } | undefined;
  /** Trade routes walked (BRDC-TRADEROUTE-001): gold an hour while their ends hold. */
  routes?: readonly TradeRoute[] | undefined;
  /** Villages this realm is suzerain of (BRDC-SUZERAIN-001): each pays its speciality. */
  suzerain?: readonly CityStateId[] | undefined;
  /** The Reckoning's flood (BRDC-CHOIR-001): lake and coast hexes make half until the Choir is silenced. */
  flooded?: boolean | undefined;
  /** The town's terror (BRDC-TERROR-001): at 8, every Market makes a quarter less. */
  terror?: number | undefined;
}

const title = (id: string): string => id.replace(/(^|-)(\w)/g, (_, dash: string, c: string) => (dash ? ' ' : '') + c.toUpperCase());
const workName = (id: string): string => BUILDING_NAMES_PLAIN[id as keyof typeof BUILDING_NAMES_PLAIN] ?? title(id);

function addInto(into: Partial<ResourcePool>, from: Partial<ResourcePool>): void {
  for (const [k, v] of Object.entries(from) as [ResourceKind, number][]) into[k] = (into[k] ?? 0) + v;
}

/** The cells a Works tree pays on: every held cell, or only the staffed ones on a Season 2 save. */
const working = (ctx: YieldContext): readonly Cell[] => (ctx.keep ? staffedCells(ctx.owned, ctx.keep.staff ?? {}) : ctx.owned);

/**
 * What each awake hex's Works earn from their neighbours (BRDC-ADJ-001). On a Season 2 save
 * only a Work with hands in it counts, as for every other yield. Cached per context.
 */
const adjacencyCache = new WeakMap<YieldContext, Map<H3Index, AdjacencyLine[]>>();
function adjacencyMap(ctx: YieldContext): Map<H3Index, AdjacencyLine[]> {
  const hit = adjacencyCache.get(ctx);
  if (hit) return hit;
  const world = {
    owned: new Map(ctx.owned.map((c) => [c.h3, c] as const)),
    temples: new Set(ctx.places.filter((p) => p.kind === 'temple').map((p) => p.h3)),
  };
  const staff = ctx.keep?.staff ?? {};
  const out = new Map<H3Index, AdjacencyLine[]>();
  for (const c of ctx.owned) {
    if (ctx.now - c.lastVisitedAt > DORMANT_AFTER_MS) continue;
    const works = worksOn(c).filter((w) => !ctx.keep || (staff[staffKey(c.h3, w.id)] ?? 0) > 0);
    const lines = works.flatMap((w) => adjacencyFor(c.h3, w.id, world));
    if (lines.length > 0) out.set(c.h3, lines);
  }
  adjacencyCache.set(ctx, out);
  return out;
}

/** What today's Mythos card makes on one hex: its hands on a Farm or Market (BRDC-MYTHOS-001). */
function mythosOnCell(cell: Cell, ctx: YieldContext): Partial<ResourcePool> {
  const e = ctx.mythos?.effect;
  if (e?.kind !== 'hands' || ctx.now - cell.lastVisitedAt > DORMANT_AFTER_MS) return {};
  if (!worksOn(cell).some((w) => w.id === e.work)) return {};
  const hands = ctx.keep ? (ctx.keep.staff?.[staffKey(cell.h3, e.work)] ?? 0) : 1;
  return hands > 0 ? { [e.resource]: e.perHand * hands } : {};
}

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
  for (const lines of adjacencyMap(ctx).values()) for (const l of lines) merged[l.resource] = (merged[l.resource] ?? 0) + l.amount;
  for (const c of owned) addInto(merged, mythosOnCell(c, ctx));
  const realm = ctx.mythos?.effect;
  if (realm?.kind === 'realm') merged[realm.resource] = (merged[realm.resource] ?? 0) + realm.perHour;
  addInto(merged, eraBonus(ctx.eras ?? []));
  addInto(merged, boonBonus(ctx.week?.boon));
  const routeGoldNow = routesGold(ctx.routes ?? [], owned);
  if (routeGoldNow > 0) merged.gold = (merged.gold ?? 0) + routeGoldNow;
  for (const id of ctx.suzerain ?? []) addInto(merged, SUZERAIN_BONUS[id] ?? {});
  // The Librarian (BRDC-INVEST-001). No ground trickles wisdom, so all of it is here.
  if (ctx.archetype === 'librarian' && (merged.wisdom ?? 0) > 0) merged.wisdom = (merged.wisdom as number) * (1 + LIBRARIAN_WISDOM);
  // The full moon (BRDC-MOON-001). The Harvest Moon is the hex card's own line, read back.
  if (isFullMoon(now)) {
    for (const c of owned.filter((x) => harvestMoonOn(x, ctx))) {
      for (const l of computeHexYield(c, ctx).contributions) if (l.label === 'Harvest Moon') merged.food = (merged.food ?? 0) + l.amount;
    }
    if (merged.mana) merged.mana *= FULL_MOON_MANA;
  }
  // The terror's line, read back from the card the same way (BRDC-TERROR-001).
  if (terrorEffects(ctx.terror ?? 0).marketFactor < 1) {
    for (const c of owned.filter((x) => worksOn(x).some((w) => w.id === 'market'))) {
      for (const l of computeHexYield(c, ctx).contributions) if (l.label === 'Terror') merged[l.resource] = (merged[l.resource] ?? 0) + l.amount;
    }
  }
  // The flood is the hex card's own line, read back, after everything it halves.
  if (ctx.flooded) {
    for (const c of owned.filter((x) => floodsAt(terrainForCell(x).kind))) {
      for (const l of computeHexYield(c, ctx).contributions) if (l.label === 'Flooded') merged[l.resource] = (merged[l.resource] ?? 0) + l.amount;
    }
  }
  return merged;
}

/** A Market's gold, a quarter of it gone while the town is terrified — the realm's own gold, as the settle pays it. */
function terrorLines(out: readonly YieldContribution[], ctx: YieldContext, cell: Cell): YieldContribution[] {
  const factor = terrorEffects(ctx.terror ?? 0).marketFactor;
  if (factor >= 1 || !worksOn(cell).some((w) => w.id === 'market')) return [];
  const gold = out.reduce((s, c) => (c.resource === 'gold' && c.source !== 'terrain' ? s + c.amount : s), 0);
  return gold > 0 ? [{ resource: 'gold', amount: -gold * (1 - factor), source: 'other', label: 'Terror' }] : [];
}

/** Half of everything a lake or coast hex makes, taken back while the Choir sings. */
function floodLines(out: readonly YieldContribution[], ctx: YieldContext, cell: Cell): YieldContribution[] {
  if (!ctx.flooded || !floodsAt(terrainForCell(cell).kind)) return [];
  const sum: Partial<ResourcePool> = {};
  for (const c of out) sum[c.resource] = (sum[c.resource] ?? 0) + c.amount;
  return (Object.entries(sum) as [ResourceKind, number][])
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ resource: k, amount: -v * (1 - FLOOD_FACTOR), source: 'other' as const, label: 'Flooded' }));
}

/** A Farm that learned the Harvest Moon (WORKS-002's `periodic`), on ground still walked. */
const harvestMoonOn = (cell: Cell, ctx: YieldContext): boolean =>
  ctx.now - cell.lastVisitedAt <= DORMANT_AFTER_MS && worksOn(cell).some((w) => w.id === 'farm') && (ctx.trees[cell.h3] ?? []).includes('farm.harvest-moon');

/** The full moon's lines on what has been made so far: a Farm's Harvest Moon, then mana half again. */
function moonLines(out: readonly YieldContribution[], ctx: YieldContext, cell?: Cell): YieldContribution[] {
  if (!isFullMoon(ctx.now)) return [];
  const sum = (k: ResourceKind) => out.reduce((s, c) => (c.resource === k ? s + c.amount : s), 0);
  const lines: YieldContribution[] = [];
  const food = sum('food');
  if (cell && food > 0 && harvestMoonOn(cell, ctx)) lines.push({ resource: 'food', amount: food * (HARVEST_MOON_FOOD - 1), source: 'building', label: 'Harvest Moon', sourceId: 'farm.harvest-moon' });
  // The realm's own mana, as the settle multiplies it — the ground's trickle is not in it.
  const mana = out.reduce((s, c) => (c.resource === 'mana' && c.source !== 'terrain' ? s + c.amount : s), 0);
  if (mana !== 0) lines.push({ resource: 'mana', amount: mana * (FULL_MOON_MANA - 1), source: 'other', label: 'Full moon' });
  return lines;
}

/** The Librarian's share of some wisdom, as a line of its own; nothing for anyone else. */
function librarianLine(ctx: YieldContext, wisdom: number): YieldContribution[] {
  return ctx.archetype === 'librarian' && wisdom > 0
    ? [{ resource: 'wisdom', amount: wisdom * LIBRARIAN_WISDOM, source: 'other', label: 'Librarian' }]
    : [];
}

/** What belongs to the realm and to no hex: a running domain spell. */
export function realmOnlyYield(ctx: YieldContext): YieldContribution[] {
  const out: YieldContribution[] = [];
  for (const s of activeSpells(ctx.spells, ctx.now)) {
    for (const [k, v] of Object.entries(domainSpellBonus([s], ctx.now)) as [ResourceKind, number][]) {
      out.push({ resource: k, amount: v, source: 'other', label: `Spell: ${title(s.id)}`, sourceId: s.id });
    }
  }
  const e = ctx.mythos?.effect;
  if (ctx.mythos && e?.kind === 'realm') out.push({ resource: e.resource, amount: e.perHour, source: 'other', label: `Mythos: ${ctx.mythos.headline}` });
  for (const id of ctx.eras ?? []) {
    for (const [k, v] of Object.entries(ERAS[id].perHour) as [ResourceKind, number][]) out.push({ resource: k, amount: v, source: 'other', label: `Age: ${ERAS[id].name}`, sourceId: id });
  }
  const held = new Map(ctx.owned.map((c) => [c.h3, c] as const));
  for (const r of ctx.routes ?? []) {
    if (routeActive(r, held)) out.push({ resource: 'gold', amount: routeGold(r.lengthM), source: 'other', label: `Trade route: ${(r.lengthM / 1000).toFixed(1)} km`, sourceId: r.id });
  }
  for (const id of ctx.suzerain ?? []) {
    for (const [k, v] of Object.entries(SUZERAIN_BONUS[id] ?? {}) as [ResourceKind, number][]) out.push({ resource: k, amount: v, source: 'other', label: `Suzerain: ${cityStateById(id)?.name ?? id}`, sourceId: id });
  }
  const boon = ctx.week?.boon;
  if (boon) for (const [k, v] of Object.entries(BOONS[boon].perHour) as [ResourceKind, number][]) out.push({ resource: k, amount: v, source: 'other', label: `Golden week: ${BOONS[boon].name}`, sourceId: boon });
  const all = [...out, ...librarianLine(ctx, out.reduce((s, c) => (c.resource === 'wisdom' ? s + c.amount : s), 0))];
  return [...all, ...moonLines(all, ctx)];
}

/** What every hex of a realm reads, worked out once per context — without it `all` is
 *  quadratic: each hex re-ran the realm's staffing, Works tree and auras. */
interface Prepared {
  staffed: Map<H3Index, StaffedPart[]>;
  boons: Map<H3Index, StaffedPart[]>;
  works: Map<H3Index, Partial<ResourcePool>>;
  modifiers: StaffedModifiers | null;
  auraSources: readonly Cell[];
}
const prepared = new WeakMap<YieldContext, Prepared>();

function byHex(parts: readonly StaffedPart[]): Map<H3Index, StaffedPart[]> {
  const out = new Map<H3Index, StaffedPart[]>();
  for (const p of parts) out.set(p.h3, [...(out.get(p.h3) ?? []), p]);
  return out;
}

function prepare(ctx: YieldContext): Prepared {
  const hit = prepared.get(ctx);
  if (hit) return hit;
  const { owned, now, keep } = ctx;
  const staff = keep?.staff ?? {};
  const p: Prepared = {
    staffed: keep ? byHex(staffedParts(owned, staff, now)) : new Map(),
    boons: keep ? byHex(boonParts(owned, staff, now, keep.boons ?? [])) : new Map(),
    works: worksBonusByCell(working(ctx), ctx.trees, ctx.kindAt, now),
    modifiers: keep ? staffedModifiers(owned, staff, now, keep.boons, keep.granary.citizens, keep.gatesNear, calmAt(keep, now)) : null,
    auraSources: owned.filter((c) => worksOn(c).some((w) => BUILDINGS[w.id].aura)),
  };
  prepared.set(ctx, p);
  return p;
}

/** One hex's yield per hour, itemised. Dormant ground yields nothing, as everywhere. */
export function computeHexYield(cell: Cell, ctx: YieldContext): HexYield {
  const { now, keep } = ctx;
  const pre = prepare(ctx);
  const out: YieldContribution[] = [];
  const push = (from: Partial<ResourcePool>, source: YieldSource, label: string, sourceId?: string) => {
    for (const [k, v] of Object.entries(from) as [ResourceKind, number][]) {
      if (v !== 0) out.push({ resource: k, amount: v, source, label, ...(sourceId ? { sourceId } : {}) });
    }
  };
  const ground = terrainForCell(cell).kind;
  const t = trickleRate(cell, now);
  if (t) push({ [t.resource]: t.perHour }, 'terrain', `Terrain: ${title(ground)}`, ground);

  if (keep && pre.modifiers) {
    const mine = pre.staffed.get(cell.h3) ?? [];
    for (const p of mine) {
      const label = p.kind === 'ground' ? `${workName(p.work ?? '')}: ground in reach` : `${workName(p.work ?? '')} · ${p.hands} ${p.hands === 1 ? 'worker' : 'workers'}`;
      push({ [p.resource]: p.amount }, p.kind === 'ground' ? 'terrain' : 'citizen', label, p.work ?? undefined);
    }
    // The realm's multipliers, as this hex's raw share of what they do to the total.
    const base: Partial<ResourcePool> = {};
    for (const p of mine) base[p.resource] = (base[p.resource] ?? 0) + p.amount;
    const m = pre.modifiers;
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
    for (const p of pre.boons.get(cell.h3) ?? []) {
      push({ [p.resource]: p.amount }, 'other', `Rite: ${title(p.rite ?? '')}`, p.rite);
    }
  } else {
    for (const w of worksOn(cell)) push(buildingBonus([{ ...cell, buildings: [w] }], now), 'building', workName(w.id), w.id);
  }

  for (const p of ctx.places.filter((pl) => pl.h3 === cell.h3)) {
    push(placeBonus([p], ctx.expansions, [cell], now), 'temple', p.kind === 'anchor' ? 'Anchor Stone' : 'Temple', p.kind);
  }
  push(resourceAura([cell], now, pre.auraSources), 'building', 'Aura of nearby Works');
  push(researchBonus(ctx.researched, [cell], now), 'tech', 'Research');
  const bounty = bountyOn(cell);
  push(bountyBonus([cell], ctx.revealed, now), 'terrain', bounty ? `Find: ${title(bounty.id)}` : 'Find', bounty?.id);
  push(landmarkBonus([cell], now), 'other', 'Landmark');
  push(pre.works.get(cell.h3) ?? {}, 'building', 'Works research');
  for (const l of adjacencyMap(ctx).get(cell.h3) ?? []) push({ [l.resource]: l.amount }, 'adjacency', `${workName(l.work)} ${l.why}`, l.work);
  if (ctx.mythos) push(mythosOnCell(cell, ctx), 'other', `Mythos: ${ctx.mythos.headline}`);
  out.push(...librarianLine(ctx, out.reduce((s, c) => (c.resource === 'wisdom' ? s + c.amount : s), 0)));
  out.push(...moonLines(out, ctx, cell));
  out.push(...terrorLines(out, ctx, cell));
  out.push(...floodLines(out, ctx, cell));

  const week = ctx.week?.factor ?? 1;
  if (ctx.factor !== 1 || week !== 1) {
    const sum: Partial<ResourcePool> = {};
    for (const c of out) sum[c.resource] = (sum[c.resource] ?? 0) + c.amount;
    for (const [k, v] of Object.entries(sum) as [ResourceKind, number][]) {
      if (v <= 0) continue;
      if (ctx.factor !== 1) out.push({ resource: k, amount: v * (ctx.factor - 1), source: 'other', label: 'Dark time' });
      // The settle multiplies the two, so the week's line is taken after the dark time's.
      if (week !== 1) out.push({ resource: k, amount: v * ctx.factor * (week - 1), source: 'other', label: ctx.week?.kind === 'golden' ? 'Golden week' : 'Dark week' });
    }
  }

  const totals: Partial<ResourcePool> = {};
  for (const c of out) totals[c.resource] = (totals[c.resource] ?? 0) + c.amount;
  return { totals, contributions: out };
}
