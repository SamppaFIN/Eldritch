/**
 * No hands, no harvest (BRDC-PROG-002, Eldritch-Progression.pdf LAW I).
 *
 * A building yields only while someone works in it, and each worker yields the full
 * per-worker amount. Slots grow with the building's level (`slots` in `balance.ts`) up to
 * the building's own ceiling. Only a Season 2 save staffs anything — the staff map lives
 * in its Keep record; a Season 1 save keeps producing the old way.
 *
 * The per-worker table is the document's WORK table. A Work the document does not list
 * yields its old hourly rate per worker, one slot — so nothing in the catalogue goes dead.
 */
import { slots } from './balance.js';
import { BUILDINGS, worksOn } from './build.js';
import { DORMANT_AFTER_MS, terrainForCell } from './terrain.js';
import { bountyOn, bountyYield } from './bounty.js';
import { neighboursOf } from '../geo/cells.js';
import type { ResourcePool, TerrainKind } from './terrain.js';
import type { BuildingId, Cell, H3Index } from '../types/domain.js';
import type { Boon } from './citizens.js';
import { activeMasterworks } from './masterwork.js';
import { realmSanity, sanityYield } from './sanity.js';

/** Workers per building, keyed `h3|buildingId`. */
export type StaffMap = Readonly<Record<string, number>>;

export const staffKey = (h3: H3Index, id: BuildingId): string => `${h3}|${id}`;

interface WorkRow {
  perWorker: Partial<ResourcePool>;
  maxSlots: number;
}

/** The document's WORK table: per worker per hour, and the most hands a building takes. */
export const WORK_TABLE: Partial<Record<BuildingId, WorkRow>> = {
  farm: { perWorker: { food: 3 }, maxSlots: 3 },
  sawmill: { perWorker: { wood: 2 }, maxSlots: 3 },
  quarry: { perWorker: { stone: 2 }, maxSlots: 3 },
  forge: { perWorker: { iron: 2, wood: -1 }, maxSlots: 3 },
  market: { perWorker: { gold: 3 }, maxSlots: 3 },
  watchtower: { perWorker: { wisdom: 1 }, maxSlots: 2 },
  tavern: { perWorker: { culture: 1, gold: 1 }, maxSlots: 2 },
};

function rowFor(id: BuildingId): WorkRow {
  return WORK_TABLE[id] ?? { perWorker: BUILDINGS[id].produces ?? {}, maxSlots: 1 };
}

/** A hex whose bounty pays food — wheat, herd, deer, fish… (the document's food deposit). */
export const isFoodDeposit = (cell: Cell): boolean => (bountyYield(bountyOn(cell)).food ?? 0) > 0;

/** Hands a building can take at this level. */
export const slotsFor = (id: BuildingId, level: number): number => Math.min(rowFor(id).maxSlots, slots(level));

export const staffed = (staff: StaffMap): number => Object.values(staff).reduce((s, n) => s + n, 0);

/** One labelled piece of a staffed hex's hourly yield (BRDC-YIELD-001). */
export interface StaffedPart {
  h3: H3Index;
  resource: keyof ResourcePool;
  amount: number;
  /** `worker`: hands in a Work · `ground`: what the ground beside adds · `rite`: a Tide boon. */
  kind: 'worker' | 'ground' | 'rite';
  work: BuildingId | null;
  hands: number;
  rite?: string;
}

/**
 * The staffed yield, hex by hex, before the realm's multipliers. A building with no hands
 * yields nothing. The ground adds to it (the document's NOTE column): a Farmstead on a food
 * deposit doubles each worker's yield, a Sawmill gains a timber for every held forest hex
 * beside it, and a Market a gold for every held settlement (trade) hex beside it.
 */
export function staffedParts(cells: readonly Cell[], staff: StaffMap, now: number): StaffedPart[] {
  const out: StaffedPart[] = [];
  const held = new Map(cells.map((c) => [c.h3, c]));
  const heldBeside = (h3: H3Index, kind: TerrainKind) =>
    neighboursOf(h3).filter((h) => {
      const n = held.get(h);
      return n !== undefined && terrainForCell(n).kind === kind;
    }).length;
  for (const cell of cells) {
    if (now - cell.lastVisitedAt > DORMANT_AFTER_MS) continue;
    for (const work of worksOn(cell)) {
      const hands = staff[staffKey(cell.h3, work.id)] ?? 0;
      if (hands <= 0) continue;
      const mult = work.id === 'farm' && isFoodDeposit(cell) ? 2 : 1;
      for (const [k, v] of Object.entries(rowFor(work.id).perWorker) as [keyof ResourcePool, number][]) {
        out.push({ h3: cell.h3, resource: k, amount: v * hands * (v > 0 ? mult : 1), kind: 'worker', work: work.id, hands });
      }
      if (work.id === 'sawmill') out.push({ h3: cell.h3, resource: 'wood', amount: heldBeside(cell.h3, 'forest'), kind: 'ground', work: work.id, hands });
      if (work.id === 'market') out.push({ h3: cell.h3, resource: 'gold', amount: heldBeside(cell.h3, 'settlement'), kind: 'ground', work: work.id, hands }); // trade cells in reach
    }
  }
  return out;
}

/** The Tide boons, hex by hex: Call the Shoal on one Farmstead, High Water on every hand. */
export function boonParts(cells: readonly Cell[], staff: StaffMap, now: number, boons: readonly Boon[]): StaffedPart[] {
  const out: StaffedPart[] = [];
  const held = new Map(cells.map((c) => [c.h3, c]));
  for (const b of boons) {
    if (b.until <= now) continue;
    if (b.scope === 'target' && b.target && held.get(b.target)?.buildings?.some((w) => w.id === 'farm')) {
      out.push({ h3: b.target, resource: 'food', amount: b.value, kind: 'rite', work: 'farm', hands: 0, rite: b.rite });
    }
    if (b.scope === 'workers') {
      for (const c of cells) {
        const hands = staff[staffKey(c.h3, 'farm')] ?? 0;
        if (hands > 0) out.push({ h3: c.h3, resource: 'food', amount: b.value * hands, kind: 'rite', work: 'farm', hands, rite: b.rite });
      }
    }
  }
  return out;
}

/** What the realm puts on top of its staffed yield: masterworks, sanity, Second Lake. */
export interface StaffedModifiers {
  foundry: boolean;
  cathedral: boolean;
  /** The sanity factor (PROG-008), 1 when the realm is sane or no Keep counts citizens. */
  sanity: number;
  /** Second Lake's per cent, 0 when none runs. */
  lift: number;
}

export function staffedModifiers(
  cells: readonly Cell[],
  staff: StaffMap,
  now: number,
  boons: readonly Boon[] = [],
  citizens?: number,
  gatesNear = 0,
  calm = 0,
): StaffedModifiers {
  const awake = activeMasterworks(cells);
  return {
    foundry: awake.includes('foundry'),
    cathedral: awake.includes('sunken-cathedral'),
    sanity: citizens === undefined ? 1 : sanityYield(realmSanity(cells, staff, citizens, gatesNear, calm)),
    lift: boons.reduce((s, b) => s + (b.scope === 'yield' && b.until > now ? b.value : 0), 0),
  };
}

/**
 * Per-hour production of every awake, staffed building — the parts above, summed, with the
 * realm's multipliers applied in the order and rounding they always had, then the boons.
 */
export function staffedBonus(
  cells: readonly Cell[],
  staff: StaffMap,
  now: number,
  boons: readonly Boon[] = [],
  /** The Keep's citizens — given, the realm's sanity shapes the yield (PROG-008). */
  citizens?: number,
  gatesNear = 0,
  calm = 0,
): Partial<ResourcePool> {
  const out: Partial<ResourcePool> = {};
  const add = (k: keyof ResourcePool, v: number) => (out[k] = (out[k] ?? 0) + v);
  for (const p of staffedParts(cells, staff, now)) add(p.resource, p.amount);
  const m = staffedModifiers(cells, staff, now, boons, citizens, gatesNear, calm);
  // Masterworks (PROG-006): a Foundry lifts iron and stone by half, a Sunken Cathedral mana.
  if (m.foundry) for (const k of ['iron', 'stone'] as const) if (out[k]) out[k] = Math.round((out[k] ?? 0) * 1.5);
  if (m.cathedral && out.mana) out.mana = Math.round(out.mana * 1.5);
  // A mad realm works at four fifths (PROG-008) — what it makes, not what it spends.
  if (m.sanity !== 1) for (const k of Object.keys(out) as (keyof ResourcePool)[]) if ((out[k] ?? 0) > 0) out[k] = Math.floor((out[k] ?? 0) * m.sanity);
  // Second Lake (PROG-007): every staffed building makes a share more while it lasts.
  if (m.lift > 0) for (const k of Object.keys(out) as (keyof ResourcePool)[]) if ((out[k] ?? 0) > 0) out[k] = Math.round((out[k] ?? 0) * (1 + m.lift / 100));
  for (const p of boonParts(cells, staff, now, boons)) add(p.resource, p.amount);
  return out;
}

/** The cells with at least one staffed building — only these feed the Works trees. */
export function staffedCells(cells: readonly Cell[], staff: StaffMap): Cell[] {
  return cells.filter((c) => worksOn(c).some((w) => (staff[staffKey(c.h3, w.id)] ?? 0) > 0));
}

export type StaffRefusal = 'no-idle' | 'full' | 'none-there';

/**
 * Send one idle citizen to (`+1`) or call one back from (`-1`) a building. `level` is the
 * building's Works level, which sets its slots.
 */
export function assignWorker(
  staff: StaffMap,
  citizens: number,
  h3: H3Index,
  id: BuildingId,
  delta: 1 | -1,
  level: number,
): { ok: true; staff: StaffMap } | { ok: false; refused: StaffRefusal } {
  const key = staffKey(h3, id);
  const here = staff[key] ?? 0;
  if (delta > 0) {
    if (staffed(staff) >= citizens) return { ok: false, refused: 'no-idle' };
    if (here >= slotsFor(id, level)) return { ok: false, refused: 'full' };
  } else if (here <= 0) {
    return { ok: false, refused: 'none-there' };
  }
  const next = { ...staff, [key]: here + delta };
  if (next[key] === 0) delete next[key];
  return { ok: true, staff: next };
}

/** When citizens leave, the last-assigned workers go first until the staff fits. */
export function trimStaff(staff: StaffMap, citizens: number): StaffMap {
  let over = staffed(staff) - citizens;
  if (over <= 0) return staff;
  const next: Record<string, number> = { ...staff };
  for (const key of Object.keys(next).reverse()) {
    if (over <= 0) break;
    const take = Math.min(over, next[key] ?? 0);
    next[key] = (next[key] ?? 0) - take;
    over -= take;
    if (next[key] === 0) delete next[key];
  }
  return next;
}
