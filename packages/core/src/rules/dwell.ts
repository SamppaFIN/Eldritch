/**
 * Where you actually spend your life.
 *
 * The game already watches your position for hours. This is what it does with that:
 * time is attributed to the cell you were standing in, and a cell that accumulates
 * enough of it stops being ground and becomes a place.
 *
 * Nothing is chosen from a menu. The game does not ask where you live — it works it
 * out, and says so only once it is sure. That is the whole idea, and it is the reason
 * this is worth building before anything else in the new notes.
 */
import { DWELL_MOVE_CONFIRM_MS, OBSERVATION_GAP_MS } from './constants.js';
import { neighboursOf } from '../geo/cells.js';
import type { H3Index } from '../types/domain.js';

/**
 * The longest gap a single reading may be credited with.
 *
 * A phone in a pocket goes quiet for eight hours and then reports from the same cell.
 * Without a cap that one gap crowns your bedroom, or worse, crowns wherever you happened
 * to be when the screen went off.
 */
export const MAX_DWELL_GAP_MS = 40 * 60_000;

/**
 * Time in one cell before it means something.
 *
 * The prototype used 90 minutes. This is 45: something should reveal itself on the
 * first evening, or nobody finds out the mechanic exists. It rises for later places so
 * the Anchor is not immediately buried in a crowd of temples.
 */
export const ANCHOR_THRESHOLD_MS = 45 * 60_000;
export const TEMPLE_THRESHOLD_MS = 90 * 60_000;

/** Accumulated time per cell, in milliseconds. */
export type DwellMap = Readonly<Record<H3Index, number>>;

export interface DwellReading {
  h3: H3Index;
  /** Epoch ms of the reading. */
  t: number;
}

/**
 * Credit the gap between two readings to where the player was standing.
 *
 * The time is credited to the *previous* cell, not the new one: you were there for the
 * gap, and you have only just arrived here.
 */
export function accrueDwell(
  dwell: DwellMap,
  previous: DwellReading | null,
  next: DwellReading,
): DwellMap {
  if (!previous) return dwell;

  const gap = next.t - previous.t;
  if (gap <= 0) return dwell;

  /*
   * A long gap only counts as standing still if the player was still there afterwards.
   * Come back in a different cell and the gap covered walking, not sitting — crediting
   * it in full would crown whichever cell the screen happened to go off in.
   */
  const cap = previous.h3 === next.h3 ? MAX_DWELL_GAP_MS : OBSERVATION_GAP_MS;
  const credited = Math.min(gap, cap);
  return { ...dwell, [previous.h3]: (dwell[previous.h3] ?? 0) + credited };
}

/**
 * The sticky-dwell anchor: the cell time is really being spent in, plus a candidate the
 * player may be moving into and how long it has held (BRDC-DWELL-002).
 */
export interface DwellAnchor {
  h3: H3Index;
  pendingH3: H3Index | null;
  pendingSince: number;
}

/** A fresh anchor sitting squarely on `h3`. */
export function dwellAnchorAt(h3: H3Index): DwellAnchor {
  return { h3, pendingH3: null, pendingSince: 0 };
}

/**
 * Which cell this reading's time belongs to, holding against GPS jitter between adjacent
 * hexes (BRDC-DWELL-002).
 *
 * `stationary` is the caller's call — fixes close in time, or a near-zero speed. While it
 * holds and the raw cell is only a neighbour of the anchor, time stays on the anchor. A
 * fix a full cell away is a real move and commits at once; a neighbour that holds for
 * `DWELL_MOVE_CONFIRM_MS` commits too, so a genuine slow drift is not stuck forever.
 */
export function stickyDwell(
  anchor: DwellAnchor,
  raw: H3Index,
  t: number,
  stationary: boolean,
): { cell: H3Index; anchor: DwellAnchor } {
  if (raw === anchor.h3) return { cell: raw, anchor: dwellAnchorAt(raw) };

  const adjacent = neighboursOf(anchor.h3).includes(raw);
  if (!stationary || !adjacent) return { cell: raw, anchor: dwellAnchorAt(raw) };

  if (anchor.pendingH3 !== raw) {
    return { cell: anchor.h3, anchor: { ...anchor, pendingH3: raw, pendingSince: t } };
  }
  if (t - anchor.pendingSince >= DWELL_MOVE_CONFIRM_MS) {
    return { cell: raw, anchor: dwellAnchorAt(raw) };
  }
  return { cell: anchor.h3, anchor };
}

/** Fold a whole sequence of readings, for replaying a recorded walk. */
export function accrueAll(dwell: DwellMap, readings: readonly DwellReading[]): DwellMap {
  let result = dwell;
  for (let i = 1; i < readings.length; i++) {
    result = accrueDwell(result, readings[i - 1] as DwellReading, readings[i] as DwellReading);
  }
  return result;
}

export type PlaceKind = 'anchor' | 'temple';

export interface Place {
  h3: H3Index;
  kind: PlaceKind;
  dwellMs: number;
  /** 0 for the Anchor, then 1, 2, … for temples in order of time spent. */
  rank: number;
}

/**
 * Which cells have earned a name.
 *
 * The most-dwelt cell over the anchor threshold is the Anchor Stone. Everything else
 * over the temple threshold is a temple, in order. A player with one strong place and
 * nothing else has an Anchor and no temples, which is the common case and correct.
 */
export function revealPlaces(dwell: DwellMap): Place[] {
  const ranked = Object.entries(dwell)
    .filter(([, ms]) => ms >= ANCHOR_THRESHOLD_MS)
    .sort((a, b) => b[1] - a[1]);

  const places: Place[] = [];
  ranked.forEach(([h3, dwellMs], index) => {
    if (index === 0) {
      places.push({ h3, kind: 'anchor', dwellMs, rank: 0 });
    } else if (dwellMs >= TEMPLE_THRESHOLD_MS) {
      places.push({ h3, kind: 'temple', dwellMs, rank: places.length });
    }
  });

  return places;
}

/**
 * Places, when the player has already accepted a Hearth.
 *
 * The Hearth is chosen, not discovered: the adventure opens by asking the player to
 * accept the ground they are standing on. So it is the Anchor by right, and time can
 * only ever reveal temples afterwards — otherwise a long afternoon in a café would
 * quietly take the title away from the place they agreed to start from.
 *
 * With no Hearth this is exactly `revealPlaces`, which is what a save from before this
 * existed will hit.
 */
export function placesWithHome(dwell: DwellMap, home: H3Index | null): Place[] {
  if (!home) return revealPlaces(dwell);

  const temples = Object.entries(dwell)
    .filter(([h3, ms]) => h3 !== home && ms >= TEMPLE_THRESHOLD_MS)
    .sort((a, b) => b[1] - a[1]);

  return [
    { h3: home, kind: 'anchor', dwellMs: dwell[home] ?? 0, rank: 0 },
    ...temples.map(([h3, dwellMs], i) => ({
      h3,
      kind: 'temple' as const,
      dwellMs,
      rank: i + 1,
    })),
  ];
}

/** The Anchor, if one has revealed itself. */
export function anchorOf(places: readonly Place[]): Place | null {
  return places.find((p) => p.kind === 'anchor') ?? null;
}

/**
 * How close the next reveal is, 0-1, for a progress readout.
 *
 * Only meaningful for the cell the player is standing in: "this place is becoming
 * something" is a far better prompt than silence followed by a sudden crowning.
 */
export function revealProgress(dwellMs: number, hasAnchor: boolean): number {
  const threshold = hasAnchor ? TEMPLE_THRESHOLD_MS : ANCHOR_THRESHOLD_MS;
  return Math.min(1, Math.max(0, dwellMs / threshold));
}
