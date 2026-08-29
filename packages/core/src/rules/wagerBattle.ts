/**
 * The Wager — resolved on the client, identically on both phones.
 *
 * Locked decision (Infinite, 2026-08-29): client first, server at the end. Which makes
 * determinism the whole design constraint, not a nicety. Two phones that disagree about
 * who won have no referee to settle it, so the rule is stricter than "no randomness":
 *
 *   1. **No result is ever sent.** Each side sends its sanctuary and its choice of
 *      defence; both then compute the same outcome from the same inputs. There is no
 *      message saying "I won" because there is nothing to lie in.
 *   2. **Order cannot matter.** The two sides are sorted by id before anything happens,
 *      so the challenger and the challenged run the identical fight.
 *   3. **The seed comes from both.** Neither side can pick a favourable one — it is
 *      derived from both ids and both musters, and changing it means changing your own
 *      sanctuary.
 *   4. **Integer arithmetic only**, and no `Math.random` anywhere near it.
 *
 * What this cannot do is stop someone editing their own sanctuary before sending it.
 * Nothing on a client can. That is what the Phase 3 server is for, and saying so is
 * better than a checksum pretending to be a referee.
 */
import { prng } from '../sim/walk.js';
import {
  ANCHOR_BONUS,
  BASE_STRENGTH,
  LEVEL_STRENGTH_BONUS,
  ORC_BITE,
  WAGER_ROUNDS,
  WALL_GUARD,
} from './constants.js';
import type { H3Index, PlayerId } from '../types/domain.js';

/**
 * What the player builds on their border once the Hearth is found.
 *
 * A wall is passive and blunts every blow. Orcs are active and bite back harder while
 * guarding less. Neither is stronger — a wall outlasts a grinder and orcs punish a
 * turtle — and the choice is made before you know who you will face, which is what
 * makes it a choice at all.
 */
export type Defence = 'wall' | 'orcs';

export interface Combatant {
  id: PlayerId;
  name: string;
  level: number;
  /** Ground held, strongest first or not — the order does not matter. */
  cells: ReadonlyArray<{ h3: H3Index; strength: number }>;
  home: H3Index | null;
  defence: Defence;
}

export interface WagerRound {
  n: number;
  /** Damage dealt this round, by side, keyed in canonical order. */
  dealt: [number, number];
  /** Might remaining after the round, in the same order. */
  left: [number, number];
}

export interface WagerOutcome {
  winner: PlayerId;
  loser: PlayerId;
  /** True when neither side could break the other inside WAGER_ROUNDS. */
  onPoints: boolean;
  rounds: WagerRound[];
  /** The two sides in the order the fight was computed, so a log can be read. */
  order: [PlayerId, PlayerId];
  seed: number;
}

/**
 * Everything a sanctuary brings to a fight, as one integer.
 *
 * Held ground is the bulk of it, which is the point of the game: the person who walked
 * more arrives with more. Level and an Anchor Stone are the rest.
 */
export function muster(c: Combatant): number {
  const ground = c.cells.reduce((sum, cell) => sum + Math.round(cell.strength), 0);
  const anchor = c.home === null ? 0 : ANCHOR_BONUS;
  return ground + c.level * LEVEL_STRENGTH_BONUS * 10 + anchor;
}

/** What one side takes off the other per round, before the defender's guard. */
function bite(c: Combatant): number {
  return (
    BASE_STRENGTH +
    c.level * LEVEL_STRENGTH_BONUS +
    (c.defence === 'orcs' ? ORC_BITE : 0) +
    Math.round(c.cells.length / 2)
  );
}

/** How much of a blow a side turns aside, as a percentage. */
function guard(c: Combatant): number {
  return c.defence === 'wall' ? WALL_GUARD : 0;
}

/**
 * A seed neither side chose.
 *
 * Built from both ids and both musters, folded in a way that does not care which is
 * which. Picking a favourable seed would mean changing your own sanctuary, which changes
 * the muster, which changes the seed — the snake eats its own tail on purpose.
 */
export function wagerSeed(a: Combatant, b: Combatant): number {
  const stamp = (c: Combatant) => {
    let h = 2166136261;
    const text = `${c.id}:${muster(c)}`;
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  // XOR, so the two sides commute.
  return (stamp(a) ^ stamp(b)) >>> 0;
}

/**
 * Fight it out.
 *
 * Both sides strike every round — there is no initiative and no first-mover advantage,
 * because whoever went first would have to be chosen, and any rule for choosing is a
 * thumb on the scale one of the two phones would have to accept on faith.
 */
export function resolveWager(x: Combatant, y: Combatant): WagerOutcome {
  // Canonical order. Everything below is symmetric in fact; this makes it symmetric in
  // arithmetic too, which is what stops two phones drifting apart.
  const [a, b] = x.id <= y.id ? [x, y] : [y, x];

  const seed = wagerSeed(a, b);
  const roll = prng(seed);

  let left: [number, number] = [muster(a), muster(b)];
  const rounds: WagerRound[] = [];

  const swing = (attacker: Combatant, defender: Combatant): number => {
    // ±20%, in whole units. Enough that a fight is not a subtraction anyone can do in
    // their head beforehand, not enough that walking stops mattering.
    const variance = 0.8 + roll() * 0.4;
    const raw = Math.round(bite(attacker) * variance);
    return Math.max(1, Math.round((raw * (100 - guard(defender))) / 100));
  };

  for (let n = 1; n <= WAGER_ROUNDS && left[0] > 0 && left[1] > 0; n += 1) {
    // Both blows are computed against the standing musters before either lands, so
    // neither side benefits from being evaluated first.
    const dealt: [number, number] = [swing(a, b), swing(b, a)];
    left = [Math.max(0, left[0] - dealt[1]), Math.max(0, left[1] - dealt[0])];
    rounds.push({ n, dealt, left: [...left] });
  }

  const broken = left[0] <= 0 || left[1] <= 0;
  const aWins = left[0] === left[1] ? tieBreak(a, b) : left[0] > left[1];

  return {
    winner: aWins ? a.id : b.id,
    loser: aWins ? b.id : a.id,
    onPoints: !broken,
    rounds,
    order: [a.id, b.id],
    seed,
  };
}

/**
 * Exact draws happen, and something has to give.
 *
 * More ground first, then more consciousness, then the id — arbitrary but identical on
 * both phones, which is the only property that matters once the game has run out of
 * reasons to prefer one side.
 */
function tieBreak(a: Combatant, b: Combatant): boolean {
  if (a.cells.length !== b.cells.length) return a.cells.length > b.cells.length;
  if (a.level !== b.level) return a.level > b.level;
  return a.id <= b.id;
}
