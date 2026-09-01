/**
 * Who owns a cell after someone walks through it.
 *
 * Three cases, and the third is the one that makes the game a game.
 *
 * A free cell is simply taken. Your own cell is reinforced, but only once per calendar
 * day — walking the same block five times this afternoon does nothing after the first,
 * while walking it again tomorrow pays double. The game rewards routine, not grinding.
 *
 * An enemy cell takes damage and keeps its owner until its strength reaches zero. Taking
 * someone's established home block should cost two or three separate walks on separate
 * days. That is a better game than stealing it in one pass, and it doubles as anti-cheat:
 * a single forged route achieves nothing.
 *
 * Pure. `now` is always a parameter — decay and streaks cannot be tested by waiting.
 */
import type { Cell, CaptureOutcome, H3Index, PlayerId } from '../types/domain.js';
import {
  ANCHOR_BONUS,
  BASE_STRENGTH,
  DAY_VISIT_BONUS,
  LEVEL_STRENGTH_BONUS,
  MAX_STRENGTH,
  NEIGHBOUR_BONUS,
  NEIGHBOUR_BONUS_CAP,
  STREAK_VISIT_BONUS,
} from './constants.js';
import { previousDay, utcDay } from './day.js';
import { appendChange } from './history.js';

export interface Attacker {
  id: PlayerId;
  level: number;
  /** Cells adjacent to the target that the attacker already owns. */
  ownedNeighbours?: number;
  /** Anchor Stone support. Phase 6; the field exists so the formula does not move. */
  anchored?: boolean;
}

export interface CaptureResult {
  /** The cell as it stands afterwards. */
  cell: Cell;
  outcome: CaptureOutcome;
}

/**
 * Force brought to bear on an enemy cell.
 *
 * Capped neighbour bonus is deliberate: without it, a player with a large contiguous
 * territory would flip anything on their border in one pass, and the map would resolve
 * into one blob very quickly.
 */
export function attackPower(attacker: Attacker): number {
  const neighbours = Math.min(
    Math.max(0, attacker.ownedNeighbours ?? 0) * NEIGHBOUR_BONUS,
    NEIGHBOUR_BONUS_CAP,
  );
  const anchor = attacker.anchored ? ANCHOR_BONUS : 0;
  return BASE_STRENGTH + Math.max(0, attacker.level) * LEVEL_STRENGTH_BONUS + neighbours + anchor;
}

/** A cell nobody has ever claimed. */
export function emptyCell(h3: H3Index): Cell {
  return { h3, ownerId: null, strength: 0, lastVisitedAt: 0, visitDays: [] };
}

/**
 * Resolve one player passing through one cell.
 *
 * The cell is returned rather than mutated, so a batch can be resolved and then written
 * in one transaction — and so a failed write cannot leave half a claim behind.
 */
export function resolveCapture(
  cell: Cell,
  attacker: Attacker,
  now: number,
  defence = 0,
  /**
   * The defender's Hearth, if this cell is it. A Hearth can be besieged but never
   * actually taken (BRDC-HEARTH-002). No live path reaches this yet — `wager.ts` and
   * `spoils.ts` already refuse to touch local ground — but Phase 5's real shared-world
   * combat will, and the guard costs nothing now.
   */
  defenderHome: H3Index | null = null,
): CaptureResult {
  const strengthBefore = cell.strength;
  const previousOwner = cell.ownerId;
  const today = utcDay(now);

  /* --- Unclaimed ---------------------------------------------------------- */
  if (cell.ownerId === null) {
    return {
      cell: {
        h3: cell.h3,
        ownerId: attacker.id,
        strength: BASE_STRENGTH,
        lastVisitedAt: now,
        visitDays: [today],
        // Written once. A cell reclaimed after a release keeps whoever first found it.
        finder: cell.finder ?? attacker.id,
        revealedAt: cell.revealedAt ?? now,
        ownedDays: 1,
        history: appendChange(cell.history, {
          to: attacker.id,
          from: previousOwner,
          at: now,
          power: BASE_STRENGTH,
        }),
      },
      outcome: {
        h3: cell.h3,
        kind: 'claimed',
        strengthBefore,
        strengthAfter: BASE_STRENGTH,
        previousOwner,
      },
    };
  }

  /* --- Already ours ------------------------------------------------------- */
  if (cell.ownerId === attacker.id) {
    // The visit still counts for decay even when it earns no strength: being here
    // is what keeps a cell alive, and the day bonus is a separate reward on top.
    if (cell.visitDays.includes(today)) {
      return {
        cell: { ...cell, lastVisitedAt: now },
        outcome: {
          h3: cell.h3,
          kind: 'unchanged',
          strengthBefore,
          strengthAfter: strengthBefore,
          previousOwner,
        },
      };
    }

    const streak = cell.visitDays.includes(previousDay(today));
    const gain = streak ? STREAK_VISIT_BONUS : DAY_VISIT_BONUS;
    const strengthAfter = Math.min(MAX_STRENGTH, strengthBefore + gain);

    const reinforced: Cell = {
      ...cell,
      strength: strengthAfter,
      lastVisitedAt: now,
      // Only yesterday and today matter to the streak rule; the rest is history
      // that would grow without bound on a cell someone walks for a year.
      visitDays: [previousDay(today), today].filter(
        (d) => d === today || cell.visitDays.includes(d),
      ),
      // This branch runs only on a new day, so every pass through it is one more day held.
      ownedDays: (cell.ownedDays ?? 1) + 1,
    };
    // A fresh day's walk over contested ground reclaims the whole yield (BRDC-WAGER-JSON-002).
    delete reinforced.shared;

    return {
      cell: reinforced,
      outcome: {
        h3: cell.h3,
        kind: 'reinforced',
        strengthBefore,
        strengthAfter,
        previousOwner,
      },
    };
  }

  /* --- Someone else's ----------------------------------------------------- */
  // A Fortress on or near this cell blunts the blow (BRDC-BUILD-004). `max(0, …)` so a
  // weak pass can bounce off entirely; the defence is capped so the cell still falls to a
  // besieger with a neighbour bonus, just over more walks.
  const damage = Math.max(0, attackPower(attacker) - Math.max(0, defence));
  // The Hearth holds at 1 rather than falling: two or three walks can wear it down to
  // nothing, and it still never changes hands.
  const floor = defenderHome !== null && cell.h3 === defenderHome ? 1 : 0;
  const remaining = Math.max(floor, strengthBefore - damage);

  if (remaining > 0) {
    return {
      // lastVisitedAt is NOT advanced: the defender was not here, the attacker was.
      // Advancing it would make an attack protect the cell from decay.
      cell: { ...cell, strength: remaining },
      outcome: {
        h3: cell.h3,
        kind: 'damaged',
        strengthBefore,
        strengthAfter: remaining,
        previousOwner,
      },
    };
  }

  return {
    cell: {
      h3: cell.h3,
      ownerId: attacker.id,
      strength: BASE_STRENGTH,
      lastVisitedAt: now,
      visitDays: [today],
      // A stolen cell keeps whoever first revealed it, and its running days-held count.
      ...(cell.finder !== undefined ? { finder: cell.finder } : {}),
      ...(cell.revealedAt !== undefined ? { revealedAt: cell.revealedAt } : {}),
      ownedDays: cell.ownedDays ?? 1,
      history: appendChange(cell.history, {
        to: attacker.id,
        from: previousOwner,
        at: now,
        power: damage,
      }),
    },
    outcome: {
      h3: cell.h3,
      kind: 'taken',
      strengthBefore,
      strengthAfter: BASE_STRENGTH,
      previousOwner,
    },
  };
}
