/**
 * Calendar days, in UTC.
 *
 * Reinforcement is per day, so "which day is it" is a rule, not a formatting choice.
 * UTC rather than local time because Phase 3 computes the same thing in Postgres, and
 * a player who walks at 23:50 must not earn two days' credit by crossing a timezone —
 * or lose a streak by flying east.
 */

/** `YYYY-MM-DD` for an epoch-millisecond instant. */
export function utcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** The UTC day before `day`. */
export function previousDay(day: string): string {
  return utcDay(Date.parse(`${day}T00:00:00Z`) - 86_400_000);
}

/** Whole UTC days between two instants, as a positive count. */
export function daysBetween(fromMs: number, toMs: number): number {
  return Math.abs(toMs - fromMs) / 86_400_000;
}
