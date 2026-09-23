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
import { hasWork } from './build.js';

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
 * Resolve one step under the "last visitor owns it" ruleset (BRDC-CLAIM-017, Adventure
 * mode only — Route mode keeps calling `resolveCapture` and never reaches here).
 *
 * Unclaimed ground and reinforcing your own both behave exactly as `resolveCapture` —
 * the whole difference is the third case: a rival's ordinary ground changes hands on the
 * first step, full strength, no siege, no multi-day wear-down. The Hearth
 * (BRDC-HEARTH-002) and a standing Fortress (BRDC-BUILD-012) are the two promises this
 * does not touch — "never actually taken" is said elsewhere in this codebase about both,
 * and a claim this instant is not the same shape of claim as capturing either of them —
 * so a protected cell still falls through to the old wear-down fight.
 */
export function resolveInstantCapture(
  cell: Cell,
  attacker: Attacker,
  now: number,
  defenderHome: H3Index | null = null,
  holds = false,
): CaptureResult {
  const protectedGround = holds || (defenderHome !== null && cell.h3 === defenderHome);
  if (cell.ownerId === null || cell.ownerId === attacker.id || protectedGround) {
    return resolveCapture(cell, attacker, now, 0, defenderHome, holds);
  }

  const today = utcDay(now);
  const previousOwner = cell.ownerId;
  return {
    cell: {
      h3: cell.h3,
      ownerId: attacker.id,
      strength: BASE_STRENGTH,
      lastVisitedAt: now,
      visitDays: [today],
      // A cell taken instantly keeps whoever first revealed it and its running days-held
      // count, the same inheritance rule a worn-down siege already leaves in place.
      ...(cell.finder !== undefined ? { finder: cell.finder } : {}),
      ...(cell.revealedAt !== undefined ? { revealedAt: cell.revealedAt } : {}),
      ...(cell.buildings !== undefined ? { buildings: cell.buildings } : {}),
      ...(cell.terrain !== undefined ? { terrain: cell.terrain } : {}),
      ownedDays: cell.ownedDays ?? 1,
      history: appendChange(cell.history, {
        to: attacker.id,
        from: previousOwner,
        at: now,
        power: BASE_STRENGTH,
      }),
    },
    outcome: {
      h3: cell.h3,
      kind: 'taken',
      strengthBefore: cell.strength,
      strengthAfter: BASE_STRENGTH,
      previousOwner,
    },
  };
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
  /**
   * A Fortress of the defender's stands on this hex or beside it (BRDC-BUILD-012): the hex
   * holds at 1 like a Hearth, and only a Fortress standing *on* it can be brought down.
   * The caller decides, with `fortified`, because only the caller has the neighbours.
   */
  holds = false,
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
    // A breached Fortress heals once it is walked back to base strength (BRDC-BUILD-012).
    // Below that it is still a breach: a day's patch does not undo a siege.
    if (strengthAfter >= BASE_STRENGTH) delete reinforced.breachedOn;

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
  // nothing, and it still never changes hands. Ground under a Fortress holds the same way.
  const floor = holds || (defenderHome !== null && cell.h3 === defenderHome) ? 1 : 0;
  const remaining = Math.max(floor, strengthBefore - damage);

  /*
   * Bringing a Fortress down (BRDC-BUILD-012).
   *
   * Infinite chose that a Fortress can fall to a siege and that its ground never decays —
   * which makes this the only way one ever falls, so it has to be reachable, and it must
   * not be quick. A blow that would break through the floor marks the Fortress breached
   * (`breachedOn`). A blow that breaks through again on a *later* day brings it down: one
   * walk cannot, however many laps. What is left is the owner's ground at 1 with nothing
   * standing over it, and the next siege takes it like any other hex.
   */
  const breaksThrough =
    holds && damage > 0 && strengthBefore - damage <= 0 && hasWork(cell, 'fortress');
  if (breaksThrough && cell.breachedOn !== undefined && cell.breachedOn < today) {
    const standing = (cell.buildings ?? []).filter((w) => w.id !== 'fortress');
    const razed: Cell = { ...cell, strength: 1 };
    delete razed.breachedOn;
    if (standing.length > 0) razed.buildings = standing;
    else delete razed.buildings;
    return {
      cell: razed,
      outcome: { h3: cell.h3, kind: 'razed', strengthBefore, strengthAfter: 1, previousOwner },
    };
  }

  if (remaining > 0) {
    return {
      // lastVisitedAt is NOT advanced: the defender was not here, the attacker was.
      // Advancing it would make an attack protect the cell from decay.
      cell: breaksThrough
        ? { ...cell, strength: remaining, breachedOn: cell.breachedOn ?? today }
        : { ...cell, strength: remaining },
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
      /*
       * The Work standing here changes hands with the ground (PIVOT-2026-09-09 P1).
       *
       * It used to be dropped — taking a cell razed whatever stood on it. Infinite chose
       * inheritance over a separate owner record: the siege already decides who holds the
       * land, and a mine whose output belongs to someone who no longer holds the mountain
       * needs a second ownership model to explain it. Build somewhere worth defending.
       */
      ...(cell.buildings !== undefined ? { buildings: cell.buildings } : {}),
      // Terrain is a fact about the ground, not about who holds it; re-resolving it from
      // the map's tiles after every capture is work for no reason.
      ...(cell.terrain !== undefined ? { terrain: cell.terrain } : {}),
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
