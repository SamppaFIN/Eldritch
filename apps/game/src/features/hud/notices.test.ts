import { describe, expect, it } from 'vitest';
import { geoTrouble, noticesFor } from './notices.js';
import type { NoticeConditions } from './notices.js';

/**
 * BRDC-HUD-004 — the notices used to be four `position: fixed` paragraphs on identical
 * coordinates, rendered straight off their conditions. Two at once drew on top of each
 * other, and none of them ever left. The list is the rule; these are its edges.
 */
const QUIET: NoticeConditions = {
  durable: true,
  schemaReset: false,
  razed: 0,
  geo: null,
  worldStirredMs: null,
  shifted: false,
  offsetDays: 0,
};
const NONE = new Set<string>();

describe('noticesFor', () => {
  it('says nothing when there is nothing to say', () => {
    expect(noticesFor(QUIET, NONE)).toEqual([]);
  });

  it('returns every live condition, so two at once are two notices', () => {
    const both = noticesFor({ ...QUIET, durable: false, schemaReset: true }, NONE);
    expect(both.map((n) => n.id)).toEqual(['durable', 'schema']);
  });

  it('puts what threatens progress before what merely informs', () => {
    const all = noticesFor(
      { ...QUIET, durable: false, schemaReset: true, razed: 2, worldStirredMs: 7_200_000, shifted: true, offsetDays: 3 },
      NONE,
    );
    expect(all.map((n) => n.id)).toEqual(['durable', 'schema', 'razed', 'world', 'clock']);
  });

  it('leaves out anything already waved away, even while its condition holds', () => {
    const conditions = { ...QUIET, durable: false, schemaReset: true };
    expect(noticesFor(conditions, new Set(['durable'])).map((n) => n.id)).toEqual(['schema']);
    expect(noticesFor(conditions, new Set(['durable', 'schema']))).toEqual([]);
  });

  it('floors the world age at an hour — "0 h ago" reads as a bug, not as freshness', () => {
    const [fresh] = noticesFor({ ...QUIET, worldStirredMs: 1_000 }, NONE);
    expect(fresh?.text).toContain('1 h ago');
    const [older] = noticesFor({ ...QUIET, worldStirredMs: 7_200_000 }, NONE);
    expect(older?.text).toContain('2 h ago');
  });

  it('marks the dev clock as dev, and nothing else', () => {
    const all = noticesFor(
      { ...QUIET, durable: false, schemaReset: true, worldStirredMs: 1, shifted: true, offsetDays: 2 },
      NONE,
    );
    expect(all.filter((n) => n.dev).map((n) => n.id)).toEqual(['clock']);
    expect(all.find((n) => n.id === 'clock')?.text).toContain('2 days ahead');
  });

  /*
   * PIVOT-2026-09-09 §6. This is the only notice that reports something the game did to
   * the player's realm without being asked, so it is the only one that must not expire on
   * a timer — `MapNotices` skips the timer for a sticky notice.
   */
  it('reports the Works the one-per-cell migration took, and does not expire', () => {
    const [one] = noticesFor({ ...QUIET, razed: 1 }, NONE);
    expect(one?.text).toContain('One Work');
    expect(one?.sticky).toBe(true);

    const [many] = noticesFor({ ...QUIET, razed: 9 }, NONE);
    expect(many?.text).toContain('9 Works');
    expect(many?.text).toContain('back in your pouch');
  });

  it('says nothing about razing when the migration took nothing', () => {
    expect(noticesFor({ ...QUIET, razed: 0 }, NONE)).toEqual([]);
  });

  /*
   * BRDC-GEO-001. Without a location there is no game at all, so this notice waits to be
   * read rather than sliding past in seven seconds like the informational ones.
   */
  it('explains a refused location, and does not let the advice expire', () => {
    const [notice] = noticesFor({ ...QUIET, geo: 'denied' }, NONE);
    expect(notice?.id).toBe('geo');
    expect(notice?.sticky).toBe(true);
    expect(notice?.text).toMatch(/refused/i);
    expect(notice?.text).toMatch(/Location Services/);
  });

  it('says something different when the browser simply never answered', () => {
    const [notice] = noticesFor({ ...QUIET, geo: 'blocked' }, NONE);
    expect(notice?.text).toMatch(/never answered/i);
  });
});

describe('geoTrouble', () => {
  it('stays quiet while the sky is merely slow', () => {
    expect(geoTrouble('pending', 'searching')).toBeNull();
    expect(geoTrouble('pending', 'pending')).toBeNull();
    expect(geoTrouble('granted', 'tracking')).toBeNull();
  });

  /*
   * The opening fix times out routinely on a cold start indoors and the watch succeeds a
   * few seconds later. A page that shouts about settings every time that happens is a
   * page whose warnings nobody reads by the time one is true.
   */
  it('says nothing about an opening timeout that tracking then recovered from', () => {
    expect(geoTrouble('timed-out', 'tracking')).toBeNull();
  });

  it('speaks once tracking has given up too', () => {
    expect(geoTrouble('timed-out', 'searching')).toBe('blocked');
    expect(geoTrouble('granted', 'unavailable')).toBe('blocked');
  });

  it('calls a refusal a refusal, from either half', () => {
    expect(geoTrouble('denied', 'pending')).toBe('denied');
    expect(geoTrouble('pending', 'denied')).toBe('denied');
  });
});