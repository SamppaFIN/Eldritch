/**
 * The real moon (BRDC-MOON-001), worked out from the date — no network, the same sky on
 * every phone. A full-moon day (UTC) makes mana half again, raises the Doom by one for the
 * day and wakes a Farm's Harvest Moon; a new-moon day shows anomalies a ring further.
 *
 * Meeus's lunar phases (Astronomical Algorithms ch. 49) with the six largest terms: within
 * about an hour of the true instant, which is all a whole-day reading needs — the mean
 * month alone drifts up to half a day and puts a phase on the wrong date.
 *
 * Pure.
 */
const DAY_MS = 86_400_000;
const RAD = Math.PI / 180;
export const SYNODIC_MS = 29.530588861 * DAY_MS;

export const FULL_MOON_MANA = 1.5;
export const FULL_MOON_DOOM = 1;
export const HARVEST_MOON_FOOD = 3;

export type MoonDay = 'full' | 'new' | null;

/** The instant of lunation `k` (integer: new moon, +0.5: full) counted from 2000-01-06. */
function phaseAt(k: number): number {
  const jde = 2451550.09766 + 29.530588861 * k;
  const m = (2.5534 + 29.1053567 * k) * RAD;
  const mp = (201.5643 + 385.81693528 * k) * RAD;
  const f = (160.7108 + 390.67050284 * k) * RAD;
  const full = k % 1 !== 0;
  const fix =
    (full ? -0.40614 : -0.4072) * Math.sin(mp) +
    (full ? 0.17302 : 0.17241) * Math.sin(m) +
    0.0161 * Math.sin(2 * mp) +
    0.0104 * Math.sin(2 * f) +
    0.00737 * Math.sin(mp - m) -
    0.00515 * Math.sin(mp + m);
  return (jde + fix - 2440587.5) * DAY_MS;
}

/** Does the UTC day holding `now` hold a new (`offset` 0) or full (0.5) moon? */
function dayHolds(now: number, offset: number): boolean {
  const start = Math.floor(now / DAY_MS) * DAY_MS;
  const near = Math.round((start - phaseAt(0)) / SYNODIC_MS);
  for (const k of [near - 1, near, near + 1]) {
    const at = phaseAt(k + offset);
    if (at >= start && at < start + DAY_MS) return true;
  }
  return false;
}

/** A full-moon day, a new-moon day, or an ordinary one. */
export function moonDay(now: number): MoonDay {
  if (dayHolds(now, 0.5)) return 'full';
  if (dayHolds(now, 0)) return 'new';
  return null;
}

export const isFullMoon = (now: number): boolean => moonDay(now) === 'full';
export const isNewMoon = (now: number): boolean => moonDay(now) === 'new';
