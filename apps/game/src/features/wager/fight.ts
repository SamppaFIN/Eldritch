/**
 * The round log, turned into something a person can watch.
 *
 * The battle rules produce a list of numbers in canonical order — sorted by id, so that
 * two phones compute the same fight. That order is meaningless to a player, who only
 * wants to know which bar is theirs. This turns one into the other, and nothing here
 * decides anything: the fight is already over before this runs.
 */
import type { WagerOutcome } from '@es3/core';

export interface FightFrame {
  n: number;
  /** Might remaining, 0-1 of the starting muster. */
  mine: number;
  theirs: number;
  /** Damage this round, for the number that flashes up. */
  dealtByMe: number;
  dealtByThem: number;
}

/**
 * Replay the log from the local player's point of view.
 *
 * The starting musters are not in the outcome and do not need to be: a side's might
 * before round one is what it had after, plus what was taken off it. Deriving beats
 * widening the wire format for a progress bar.
 */
export function fightFrames(outcome: WagerOutcome, me: string): FightFrame[] {
  const first = outcome.rounds[0];
  if (!first) return [];

  const startA = first.left[0] + first.dealt[1];
  const startB = first.left[1] + first.dealt[0];
  // Canonical order is by id and says nothing to a player. This is the only place that
  // matters, and it matters on every frame.
  const iAmA = outcome.order[0] === me;

  const startMine = iAmA ? startA : startB;
  const startTheirs = iAmA ? startB : startA;

  return outcome.rounds.map((round) => ({
    n: round.n,
    // Guarded against a zero muster: a player with no ground at all still gets a bar
    // rather than a NaN width, which renders as nothing and looks like a bug.
    mine: startMine > 0 ? (iAmA ? round.left[0] : round.left[1]) / startMine : 0,
    theirs: startTheirs > 0 ? (iAmA ? round.left[1] : round.left[0]) / startTheirs : 0,
    dealtByMe: iAmA ? round.dealt[0] : round.dealt[1],
    dealtByThem: iAmA ? round.dealt[1] : round.dealt[0],
  }));
}
