/** BRDC-PAGES-001 — a page's price, and the rite it opens. */
import { describe, expect, it } from 'vitest';
import { PAGES, afterReading, canReadPage, pageFoundAt, readPageInto } from './pages.js';
import { EMPTY_BOOK, RITES } from './rites.js';
import { FIRST_INVESTIGATOR, recover, sanityCap } from './investigator.js';
import { cellAt, cellsWithin } from '../geo/cells.js';

const T0 = Date.parse('2026-10-08T12:00:00Z');
const page = PAGES[0] as (typeof PAGES)[number];

describe('the Book', () => {
  it('holds ten pages, each a real rite', () => {
    expect(PAGES).toHaveLength(10);
    for (const p of PAGES) expect(RITES[p.rite]).toBeDefined();
  });
  it('turns up on about two hexes in five, the same on every phone', () => {
    const hexes = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 6);
    const share = hexes.filter(pageFoundAt).length / hexes.length;
    expect(share).toBeGreaterThan(0.25);
    expect(share).toBeLessThan(0.55);
  });
});

describe('reading a page', () => {
  it('teaches its rite without a temple, then deepens it, and stops at rank III', () => {
    const one = readPageInto(EMPTY_BOOK, page);
    expect(one).toMatchObject({ ok: true, said: 'Salt Circle is yours, without a temple.' });
    const learned = one.ok ? one.book : EMPTY_BOOK;
    expect(learned.learned['salt-circle']).toBe(1);
    expect(readPageInto({ ...learned, learned: { 'salt-circle': 2 } }, page)).toMatchObject({ ok: true, said: 'Salt Circle deepens to rank 3.' });
    expect(readPageInto({ ...learned, learned: { 'salt-circle': 3 } }, page)).toEqual({ ok: false, refused: 'mastered' });
  });

  it('costs a point of sanity for good, and a mind holds five', () => {
    let inv = FIRST_INVESTIGATOR(T0);
    expect(sanityCap(inv)).toBe(6);
    inv = afterReading(inv);
    expect(inv).toMatchObject({ pagesRead: 1, sanity: 5 });
    // Rest never brings back what a page took.
    expect(recover({ ...inv, sanity: 2, restedAt: T0 }, T0 + 48 * 3_600_000).sanity).toBe(5);
    for (let i = 0; i < 4; i += 1) inv = afterReading(inv);
    expect(inv.pagesRead).toBe(5);
    expect(sanityCap(inv)).toBe(1);
    expect(canReadPage(inv)).toBe(false);
  });
});
