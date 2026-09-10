/**
 * How each Codex measure is written out (BRDC-CODEX-001).
 *
 * Pure, so the words and the units are tested without a browser — and so the table and
 * the "where you stand" line can never disagree about what a number means.
 *
 * The units are chosen for the scale a walking player actually reaches. Land is km² only
 * once there is a km² to show; a realm of seven hexes is 11 353 m² and reading that as
 * "0.01 km²" tells them nothing.
 */
import type { MetricId } from '@es3/core';

export const METRIC_NAME: Readonly<Record<MetricId, string>> = {
  land: 'Land',
  leyline: 'Ley-line',
  consciousness: 'Consciousness',
  population: 'Population',
  works: 'Works',
  provinces: 'Provinces',
  footfall: 'Footfall',
};

/** One line each, said in terms of what the player did to earn it. */
export const METRIC_BLURB: Readonly<Record<MetricId, string>> = {
  land: 'Ground held, measured true — hexes are not all the same size.',
  leyline: 'Distinct ground walked. A hundred laps of one block is one block.',
  consciousness: 'The level your walking has taken you to.',
  population: 'A gauge on the ground you hold and the Works standing on it.',
  works: 'Buildings raised across the realm. One to a hex.',
  provinces: 'Separate regions your ground reaches into.',
  footfall: 'Every day walked on every hex, added up. Only time buys this one.',
};

const round = (n: number, places = 0): string =>
  n.toLocaleString('en-GB', { maximumFractionDigits: places });

/** m² under a square kilometre, km² above it. */
export function formatArea(m2: number): string {
  return m2 < 1_000_000 ? `${round(Math.round(m2))} m²` : `${round(m2 / 1_000_000, 2)} km²`;
}

/** m under a kilometre, km above it. */
export function formatDistance(m: number): string {
  return m < 1_000 ? `${round(Math.round(m))} m` : `${round(m / 1_000, 1)} km`;
}

export function formatMetric(id: MetricId, value: number): string {
  if (id === 'land') return formatArea(value);
  if (id === 'leyline') return formatDistance(value);
  if (id === 'footfall') return `${round(Math.round(value))} ${value === 1 ? 'day' : 'days'}`;
  return round(Math.round(value));
}

/** "3rd of 7" — the rank said the way a person reads a placing, not as "rank: 3". */
export function placeWord(rank: number, of: number): string {
  const tens = rank % 100;
  const suffix =
    tens >= 11 && tens <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][rank % 10] ?? 'th';
  return `${rank}${suffix} of ${of}`;
}
