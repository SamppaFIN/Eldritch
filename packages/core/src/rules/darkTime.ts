/**
 * Dark times: the world's own winter (BRDC-EVENT-001).
 *
 * A stretch of the calendar when production falls. It is decay's cousin, not a new
 * system — one factor read from the same clock, derived from the date so that every
 * player is in the same winter and can say so to a friend. No timer, no background job.
 *
 * The window is the fortnight around the December solstice — the darkest fourteen days
 * of the year where this game is set — and production runs at `DARK_TIME_FACTOR` through
 * it. Both the window and the factor are tunable; this file is the mechanism.
 *
 * A player is meant to see it coming (`inDays`), because a surprise penalty is a bad
 * game and predictable scarcity is design.
 */
const DAY = 86_400_000;

/** Production multiplier while a dark time is in force. */
export const DARK_TIME_FACTOR = 0.6;
/** Days either side of the Dec 21 solstice that count as dark. */
export const DARK_RADIUS_DAYS = 7;

export interface DarkTime {
  active: boolean;
  /** Multiplier on production: `DARK_TIME_FACTOR` while active, `1` otherwise. */
  factor: number;
  /** Epoch ms when this state ends — the coming thaw, or the coming onset. */
  changesAt: number;
  /** Whole days until `changesAt`, for a "winter is coming" readout. */
  inDays: number;
}

/**
 * The dark-time state at `now`. Deterministic: the same instant always gives the same
 * answer, on every device, with no network.
 */
export function darkTimeAt(now: number): DarkTime {
  const year = new Date(now).getUTCFullYear();
  const radius = DARK_RADIUS_DAYS * DAY;
  // The neighbouring solstices too, so the check is correct in late December and early January.
  const solstices = [year - 1, year, year + 1].map((y) => Date.UTC(y, 11, 21));

  for (const s of solstices) {
    if (now >= s - radius && now < s + radius) {
      const changesAt = s + radius;
      return { active: true, factor: DARK_TIME_FACTOR, changesAt, inDays: daysTo(changesAt, now) };
    }
  }

  const next =
    solstices.map((s) => s - radius).find((start) => start > now) ??
    Date.UTC(year + 2, 11, 21) - radius;
  return { active: false, factor: 1, changesAt: next, inDays: daysTo(next, now) };
}

function daysTo(then: number, now: number): number {
  return Math.max(0, Math.ceil((then - now) / DAY));
}
