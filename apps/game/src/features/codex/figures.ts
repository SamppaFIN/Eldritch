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
import { placementIn } from '@es3/core';
import type { Metric, MetricId, PlayerId } from '@es3/core';

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

/**
 * An honorary title for whoever leads a measure outright (field report 2026-09-16,
 * Infinite: *"give honorary title to the player that holds the title, like landlord who
 * holds the most area"*). Lore, not a mechanic — the same register `MILESTONES`
 * (`consciousness.ts`) uses for a level name, kept out of that table on purpose so a
 * Codex title is never confused for a Consciousness rank.
 */
export const METRIC_TITLE: Readonly<Record<MetricId, string>> = {
  land: 'The Landlord',
  leyline: 'The Pathwalker',
  consciousness: 'The Farseer',
  population: 'The Sovereign',
  works: 'The Artificer',
  provinces: 'The Far-Warden',
  footfall: 'The Devoted',
};

/**
 * Every title this realm currently holds outright — every measure it is 1st of, ties
 * included (`placementIn`'s own rule: level with the leader shares the lead, it is not
 * "2nd of 7"). `[]` while unlisted or leading nothing, the same "nothing to say yet" the
 * table above it already leaves silent.
 */
export function titlesHeld(metrics: readonly Metric[], me: PlayerId): MetricId[] {
  return metrics.filter((m) => placementIn(m, me)?.rank === 1).map((m) => m.id);
}

const round = (n: number, places = 0): string =>
  n.toLocaleString('en-GB', { maximumFractionDigits: places });

/**
 * m² under a hectare, hectares under a square kilometre, km² above that.
 *
 * Three bands because the Sigil document gives all three, and a realm crosses two of them
 * in its first week: one cell is `1 622 m²` (its `hereStats`), a seven-cell realm is
 * `1.1 ha` (its `keepStats`), and the leaders are in km².
 *
 * BRDC-KEEP-008 merged three copies of this and picked two bands, which made the HUD and
 * the Keep agree on a figure that was wrong at the scale a player actually lives at —
 * 11 353 m² is a number you count, not a size you feel. The document had said hectares
 * all along; the spec was in a chat log rather than the repo, which is why it took until
 * the file landed here to notice.
 */
export function formatArea(m2: number): string {
  if (m2 < 10_000) return `${round(Math.round(m2))} m²`;
  if (m2 < 1_000_000) return `${round(m2 / 10_000, 1)} ha`;
  return `${round(m2 / 1_000_000, 2)} km²`;
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

/** "3rd" — a placing on its own, for a sentence that already says what it is placing in. */
export function ordinal(n: number): string {
  const tens = n % 100;
  const suffix = tens >= 11 && tens <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th';
  return `${n}${suffix}`;
}

/** "3rd of 7" — the rank said the way a person reads a placing, not as "rank: 3". */
export function placeWord(rank: number, of: number): string {
  return `${ordinal(rank)} of ${of}`;
}

/**
 * The step to the place above you, or the lead you hold over the place below.
 *
 * "3rd of 7" says where you stand, not whether the next rung is one walk away or a
 * season away — and the player was left doing that subtraction against three reference
 * figures in their head (BRDC-CODEX-003). Both numbers are already in `ranked`; this is
 * only the arithmetic, said in the measure's own unit.
 *
 * Ties are why the comparisons are strict: realms level with you share your rank, so the
 * place above is the nearest *distinct* figure, not the next row of the table.
 * `null` when there is nobody to measure against — a realm alone, or a field all level.
 */
export function gapLine(metric: Metric, mineValue: number, rank: number): string | null {
  const above = metric.ranked.filter((r) => r.value > mineValue).map((r) => r.value);
  if (above.length > 0) {
    return `${formatMetric(metric.id, Math.min(...above) - mineValue)} behind ${ordinal(rank - 1)}`;
  }
  const below = metric.ranked.filter((r) => r.value < mineValue).map((r) => r.value);
  if (below.length === 0) return null;
  return `${formatMetric(metric.id, mineValue - Math.max(...below))} ahead`;
}

/** Where a value falls between the field's worst and best, as 0–100 — the Codex's own
 *  comparison bar (Sigil §06, BRDC-CARD-005). Every measure here reads "more is better",
 *  so this is a plain linear position, not a second rank. A field with no spread at all
 *  (everyone level, or one realm alone) reads as full — there is nowhere lower to be. */
export function barPct(value: number, worst: number, best: number): number {
  if (best <= worst) return 100;
  return Math.max(0, Math.min(100, ((value - worst) / (best - worst)) * 100));
}

export interface OverallStanding {
  rank: number;
  of: number;
}

/**
 * The one number the header leads with — "you are 7th overall" (Sigil §06) — the mean of
 * every measure's own rank a realm is actually listed in, rounded to the nearest placing.
 * `null` when the realm is not listed in any of them yet, the same "nothing to average"
 * case `CodexPanel`'s own `listed` check already handles for the table underneath it.
 */
export function overallStanding(metrics: readonly Metric[], me: PlayerId): OverallStanding | null {
  const placements = metrics.map((m) => placementIn(m, me)).filter((p) => p !== null);
  if (placements.length === 0) return null;
  const rank = Math.round(placements.reduce((sum, p) => sum + p.rank, 0) / placements.length);
  const of = Math.max(...placements.map((p) => p.of));
  return { rank, of };
}
