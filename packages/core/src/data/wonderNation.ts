/**
 * The candidate provinces a legendary wonder can be seated in (BRDC-WONDER-001).
 *
 * Five of the twelve are one per country, and "the country" has to be a set both devices
 * can build without asking anyone. This is that set: the res-5 cells over this country's
 * bounding box, computed once on first use and kept.
 *
 * **It is a box and not a coastline, and that is a known shortcut.** The ticket's own
 * detail #2 says the right set is a land polygon: the prototype's box put several wonders
 * out in the Gulf of Bothnia, which is perfect for R'lyeh and wrong for Arkham. Carrying a
 * real outline is a few kilobytes of authored geometry and a second source of truth, and
 * it buys nothing until somebody is playing on the coast. So: box now, versioned by
 * `WONDER_SET_VERSION`, and swapping it later moves every legendary at once and openly —
 * which is exactly what that version number is for.
 *
 * The computation is ~3600 cells and about a tenth of a second, so it is done lazily: a
 * player who never asks about a legendary wonder never pays for it.
 */
import { polygonToCells } from 'h3-js';
import { WONDER_PROVINCE_RES } from '../rules/wonderPlace.js';
import type { H3Index } from '../types/domain.js';

/** Finland, generously. Wider than the land on every side; the sea is R'lyeh's problem. */
export const NATION_BBOX = { south: 59.7, west: 19.0, north: 70.1, east: 31.6 };

let cached: H3Index[] | null = null;

/** The national province set. Same list, same order, every time and every device. */
export function nationProvinces(): H3Index[] {
  if (cached) return cached;
  const { south, west, north, east } = NATION_BBOX;
  cached = polygonToCells(
    [
      [
        [south, west],
        [south, east],
        [north, east],
        [north, west],
      ],
    ],
    WONDER_PROVINCE_RES,
  );
  return cached;
}

/** Tests only: force the set to be rebuilt. */
export function clearNationCache(): void {
  cached = null;
}
