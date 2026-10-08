/**
 * The Book That Came Back (BRDC-PAGES-001) — Agnes's book, returned with more pages than
 * it left with. Ten pages are found on the ground: a rumour passed, or an anomaly
 * finished, sometimes turns one up. Each teaches a rite without a temple — learned at
 * once, or a rank deeper if it is already known — and each read takes a point of sanity
 * for good. A mind holds five at most, so which pages to read is the choice.
 *
 * Pure. The store keeps which were found and read (`pageStore.ts`).
 */
import { RITES } from './rites.js';
import type { Rank, RiteBook, RiteId } from './rites.js';
import { SANITY_MAX, sanityCap } from './investigator.js';
import type { Investigator } from './investigator.js';
import type { H3Index } from '../types/domain.js';

export interface Page {
  id: string;
  title: string;
  text: string;
  rite: RiteId;
}

export const PAGES: readonly Page[] = [
  { id: 'p1', title: 'On Salt and Thresholds', text: 'A circle is a door that has agreed to stay shut.', rite: 'salt-circle' },
  { id: 'p2', title: 'The Shoal Hymn', text: 'Sung at the jetty, it is a song. Sung under the ice, it is an invitation.', rite: 'call-the-shoal' },
  { id: 'p3', title: 'Seeing in Sleep', text: 'Close one eye to the room and open the other to the lake.', rite: 'dream-sight' },
  { id: 'p4', title: 'A Voice Not Yours', text: 'Borrow it politely. Return it before it learns your name.', rite: 'borrowed-voice' },
  { id: 'p5', title: 'Brackish Psalm', text: 'Where the river meets the lake, the water forgets which god it owes.', rite: 'brackish-blessing' },
  { id: 'p6', title: 'The Sign Burned Into Birch', text: 'Five points and an eye. Carve it on anything that should not open.', rite: 'elder-sign' },
  { id: 'p7', title: 'Clues That Are Not There', text: 'The page is blank. Read it anyway; it is about you.', rite: 'hollow-clue' },
  { id: 'p8', title: 'Calm of the Watcher', text: 'Stand the night through and the night stands down.', rite: 'watchers-calm' },
  { id: 'p9', title: 'High Water Tables', text: 'A ledger of floods, each one entered a day before it came.', rite: 'high-water' },
  { id: 'p10', title: 'The Name Between Names', text: 'Not written here. Written around here, in the margins of every other page.', rite: 'name-between-names' },
];

/** About two in five of the rumours passed and anomalies finished turn up a page. */
export const PAGE_FIND_SHARE = 0.4;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}

/** Does what was done on this hex turn up a page? The same answer on every phone. */
export const pageFoundAt = (h3: H3Index): boolean => hash(`page:${h3}`) < PAGE_FIND_SHARE;

/** Can this investigator read one more page? Not when it would leave less than 1 sanity to hold. */
export const canReadPage = (inv: Pick<Investigator, 'pagesRead'>): boolean => SANITY_MAX - (inv.pagesRead ?? 0) - 1 >= 1;

/** What reading does to the rite book: learn the page's rite at rank I, or take it a rank deeper. */
export function readPageInto(book: RiteBook, page: Page): { ok: true; book: RiteBook; said: string } | { ok: false; refused: 'mastered' } {
  const rank = book.learned[page.rite];
  if (rank === 3) return { ok: false, refused: 'mastered' };
  const next = ((rank ?? 0) + 1) as Rank;
  const name = RITES[page.rite].name;
  return { ok: true, book: { ...book, learned: { ...book.learned, [page.rite]: next } }, said: rank ? `${name} deepens to rank ${next}.` : `${name} is yours, without a temple.` };
}

/** The investigator after a read: one page more, and sanity no higher than the new cap. */
export function afterReading(inv: Investigator): Investigator {
  const read = { ...inv, pagesRead: (inv.pagesRead ?? 0) + 1 };
  return { ...read, sanity: Math.min(read.sanity, sanityCap(read)) };
}
