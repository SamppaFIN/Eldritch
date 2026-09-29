/**
 * Highscores, the Hall of Records and the Hall of Ages (BRDC-SEASON-005,
 * Eldritch-season.pdf S5, S6 and "LEADERBOARDS").
 *
 * The season's Legacy board (Global — with six friends it is also Friends; Region and
 * Faction are parked with the factions), seven titles with one winner each — the one board
 * where a mid-ranked realm can be first — and the Hall of Ages: the sum of a realm's best
 * three seasons, which rewards coming back without demanding every season.
 */
import type { LegacyCounts } from './legacy.js';

export interface BoardRow {
  realm: string;
  name: string;
  legacy: number;
  counts: LegacyCounts;
}

export interface Title {
  id: string;
  name: string;
  what: string;
  /** null when nobody has any of it. */
  holder: { realm: string; name: string; value: number } | null;
}

const TITLES: readonly { id: string; name: string; what: string; of: (c: LegacyCounts) => number }[] = [
  { id: 'unsleeping', name: 'The Unsleeping', what: 'Most damage in the Reckoning', of: (c) => c.damage },
  { id: 'warden-of-doors', name: 'Warden of Doors', what: 'Most gates sealed', of: (c) => c.gatesSealed },
  { id: 'wide-reach', name: 'The Wide Reach', what: 'Most cells at the end', of: (c) => c.cells },
  { id: 'mother-of-multitudes', name: 'Mother of Multitudes', what: 'Most citizens', of: (c) => c.citizens },
  // The document's "first to reach Age V" needs a clock the season does not keep yet; the
  // deepest Lore stands in for it and says so.
  { id: 'the-learned', name: 'The Learned', what: 'Most Lore learned', of: (c) => c.lore },
  { id: 'mason-of-wonders', name: 'Mason of Wonders', what: 'Most masterworks', of: (c) => c.masterworks + c.dormantMasterworks },
  { id: 'sane-among-the-mad', name: 'Sane Among the Mad', what: 'Highest sanity at the end', of: (c) => c.sanity },
];

/** The Legacy board, highest first; ties keep the order they came in. */
export const legacyBoard = (rows: readonly BoardRow[]): BoardRow[] => [...rows].sort((a, b) => b.legacy - a.legacy);

/** One title per category. A category nobody scored in stays empty; the first to the top keeps a tie. */
export function hallOfRecords(rows: readonly BoardRow[]): Title[] {
  return TITLES.map(({ id, name, what, of }) => {
    let holder: Title['holder'] = null;
    for (const r of rows) {
      const value = of(r.counts);
      if (value > 0 && (!holder || value > holder.value)) holder = { realm: r.realm, name: r.name, value };
    }
    return { id, name, what, holder };
  });
}

/** The Hall of Ages: each realm's best three seasons, summed. */
export function hallOfAges(seasons: readonly (readonly BoardRow[])[]): { realm: string; name: string; score: number }[] {
  const byRealm = new Map<string, { name: string; totals: number[] }>();
  for (const season of seasons) {
    for (const r of season) {
      const entry = byRealm.get(r.realm) ?? { name: r.name, totals: [] };
      entry.totals.push(r.legacy);
      entry.name = r.name;
      byRealm.set(r.realm, entry);
    }
  }
  return [...byRealm.entries()]
    .map(([realm, { name, totals }]) => ({ realm, name, score: [...totals].sort((a, b) => b - a).slice(0, 3).reduce((s, t) => s + t, 0) }))
    .sort((a, b) => b.score - a.score);
}
