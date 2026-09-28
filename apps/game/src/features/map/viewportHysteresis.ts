/**
 * Load a padded area and re-read only when the view leaves it (BRDC-PERF-002).
 *
 * Every camera move used to set a new bbox, and every new bbox re-read the whole store
 * and rebuilt the map — while walking, that is every GPS fix the camera follows. Half a
 * screen of margin on each side means a walk re-reads when it crosses into new ground,
 * not every step.
 */
import type { BBox } from '@es3/core';

/** Half a view on each side. */
export const PAD = 0.5;
/** Wider than this (about zoom 10, the nation view) the view is not padded: a padded
 *  country is a lot of cells to read for no benefit. */
export const WIDE_DEG = 0.4;
/** A loaded area this many times the view is stale after zooming in: re-read it smaller. */
export const SHRINK_AT = 16;

const area = (b: BBox) => (b.east - b.west) * (b.north - b.south);

export function contains(outer: BBox, inner: BBox): boolean {
  return outer.west <= inner.west && outer.east >= inner.east && outer.south <= inner.south && outer.north >= inner.north;
}

export function padBBox(b: BBox, pad = PAD): BBox {
  const dx = (b.east - b.west) * pad;
  const dy = (b.north - b.south) * pad;
  return { west: b.west - dx, east: b.east + dx, south: b.south - dy, north: b.north + dy };
}

/** The area to have loaded for `view`: the one already loaded when it still covers it. */
export function nextLoaded(loaded: BBox | null, view: BBox): BBox {
  if (loaded && contains(loaded, view) && area(loaded) <= area(view) * SHRINK_AT) return loaded;
  return view.east - view.west > WIDE_DEG ? view : padBBox(view);
}
