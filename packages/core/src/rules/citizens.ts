/**
 * Citizens are born of food (BRDC-PROG-001).
 *
 * Eldritch-Progression.pdf, "Food Is the Clock": surplus food fills the Keep's granary;
 * when the box is full a citizen is born and the box empties. Housing caps the Keep — a
 * full Keep stops growth and the surplus is stored instead. If food goes negative the
 * granary drains first, and after `starveGraceH` hours at zero the least useful worker
 * leaves.
 *
 * Pure: `settleGranary` is handed the hourly food balance and how long it held, and says
 * what happened in that time. The store seam (and who leaves first) is PROG-002's.
 */
import { BALANCE, growBox, housing } from './balance.js';
import { trimStaff } from './staffing.js';
import type { StaffMap } from './staffing.js';

export interface Granary {
  citizens: number;
  /** Food in the box toward the next citizen, 0 … growBox(citizens). */
  box: number;
  /** Hours spent at an empty box while hungry, toward the next departure. */
  starvedH: number;
}

export const FIRST_GRANARY: Granary = { citizens: 1, box: 0, starvedH: 0 };

export interface GranaryResult {
  granary: Granary;
  born: number;
  left: number;
  /** Surplus that could not become a citizen (Keep full) — goes to the pouch. */
  stored: number;
}

/** Food per hour the realm makes before its citizens eat, minus what they eat. */
export const foodBalance = (producedPerH: number, citizens: number): number =>
  producedPerH - BALANCE.eatPerCitizen * citizens;

/**
 * Advance the granary `hours` at a fixed hourly food balance. The balance is held fixed
 * for the whole span; a caller that knows it changed (a birth adds a mouth) passes
 * shorter spans — `settleGranary` itself re-reads nothing.
 */
export function settleGranary(g: Granary, balancePerH: number, hours: number, housingCap: number): GranaryResult {
  let { citizens, box, starvedH } = g;
  let born = 0;
  let left = 0;
  let stored = 0;

  if (balancePerH >= 0) {
    starvedH = 0;
    let food = balancePerH * hours;
    while (food > 0) {
      if (citizens >= housingCap) {
        // A full Keep: top the box up, the rest is stored, not born.
        const room = Math.max(0, growBox(citizens) - box);
        box += Math.min(room, food);
        stored += Math.max(0, food - room);
        break;
      }
      const need = growBox(citizens) - box;
      if (food < need) {
        box += food;
        break;
      }
      food -= need;
      citizens += 1;
      born += 1;
      box = 0; // the box empties
    }
  } else {
    let hunger = -balancePerH * hours;
    const drained = Math.min(box, hunger);
    box -= drained;
    hunger -= drained;
    if (hunger > 0) {
      // The rest of the span is spent at an empty box.
      starvedH += hunger / -balancePerH;
      while (starvedH >= BALANCE.starveGraceH && citizens > 0) {
        starvedH -= BALANCE.starveGraceH;
        citizens -= 1;
        left += 1;
      }
    }
  }
  return { granary: { citizens, box, starvedH }, born, left, stored };
}

/** Hours until the next citizen at this balance, or null when none is coming. */
export function hoursToNextCitizen(g: Granary, balancePerH: number, housingCap: number): number | null {
  if (balancePerH <= 0 || g.citizens >= housingCap) return null;
  return (growBox(g.citizens) - g.box) / balancePerH;
}

/** The Keep's own record: its level and its granary. Present only on a Season 2 save. */
export interface KeepState {
  level: number;
  granary: Granary;
  /** Workers per building (BRDC-PROG-002). Absent means nobody is at work. */
  staff?: StaffMap;
  /** Last collection at the Keep; stores fill for `STORE_MS` after it (PROG-002). */
  titheAt?: number;
}

/** Production accrues this long after a collection, then stops (the document's storageH). */
export const STORE_MS = BALANCE.storageH * 3_600_000;

export const FIRST_KEEP: KeepState = { level: 1, granary: FIRST_GRANARY };

interface Settled {
  pool: { food: number };
  since: number;
  keep?: KeepState;
}

/**
 * Granary first (Infinite 2026-09-29, the document's rule): the food a settle just
 * produced goes to the granary, not the pouch — only what a full Keep cannot turn into
 * citizens reaches the pouch. `before` and `after` are one `settleResources` step. A save
 * with no `keep` (every Season 1 save) is returned untouched.
 */
export function feedGranary<S extends Settled>(before: S, after: S): S {
  const keep = after.keep;
  const hours = (after.since - before.since) / 3_600_000;
  if (!keep || hours <= 0) return after;
  const produced = Math.max(0, after.pool.food - before.pool.food);
  const balance = foodBalance(produced / hours, keep.granary.citizens);
  const r = settleGranary(keep.granary, balance, hours, housing(keep.level));
  return {
    ...after,
    pool: { ...after.pool, food: before.pool.food + Math.floor(r.stored) },
    keep: {
      ...keep,
      granary: r.granary,
      // Whoever left was at work somewhere — the last-assigned hands go first.
      ...(r.left > 0 && keep.staff ? { staff: trimStaff(keep.staff, r.granary.citizens) } : {}),
    },
  };
}

/**
 * What raising the Keep from `level` costs. The document names no price (it only says
 * Granaries opens level 3); this doubling one is the ticket's own default, recorded in
 * BRDC-PROG-001, until Infinite sets another. Paid from the pouch — which, granary first,
 * only fills once the Keep is full: the realm raises its Keep when it has outgrown it.
 */
export const keepRaiseCost = (level: number): { food: number; stone: number } => ({
  food: 100 * 2 ** (level - 1),
  stone: 50 * 2 ** (level - 1),
});

/** Without research the Keep stops here; Granaries (PROG-004) lifts it to 3, and so on. */
export const KEEP_LEVEL_WITHOUT_LORE = 2;

export type KeepRaiseResult =
  | { ok: true; keep: KeepState; paid: { food: number; stone: number } }
  | { ok: false; refused: 'no-keep' | 'at-limit' | 'cannot-afford' };

export function raiseKeep(
  keep: KeepState | undefined,
  pool: { food: number; stone: number },
  maxLevel: number = KEEP_LEVEL_WITHOUT_LORE,
): KeepRaiseResult {
  if (!keep) return { ok: false, refused: 'no-keep' };
  if (keep.level >= maxLevel) return { ok: false, refused: 'at-limit' };
  const paid = keepRaiseCost(keep.level);
  if (pool.food < paid.food || pool.stone < paid.stone) return { ok: false, refused: 'cannot-afford' };
  return { ok: true, keep: { ...keep, level: keep.level + 1 }, paid };
}
