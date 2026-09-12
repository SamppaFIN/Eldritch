/**
 * What a stranger says when they point at a wonder (BRDC-EVENT-002).
 *
 * The ticket is explicit: *"Vihje on suunta ja etäisyys, ei koordinaatti."* A hex index
 * handed over in dialogue ends the search instead of starting it — the whole point of
 * BRDC-WONDER-001's split is that the province is known and the door is not, and a hint
 * that gave away the door would undo it.
 *
 * So this rounds hard on purpose. A bearing to the nearest eighth and a distance to the
 * nearest kilometre is enough to decide which way to walk on Saturday and nowhere near
 * enough to walk straight to it.
 */
import { bearing, cellCentre, haversine, wondersNear } from '@es3/core';
import type { H3Index } from '@es3/core';
import { compassPoint } from '../hud/FirstLook.js';

/** Below this, "somewhere close" says more than a number rounded to zero would. */
const NEAR_M = 1_500;

/**
 * One sentence, or null when there is nothing near enough to be worth mentioning.
 *
 * `nation` is passed in rather than computed so the caller decides whether to pay for the
 * national province set at all: a hint is rare, and most encounters never ask for one.
 */
export function wonderHint(from: H3Index, nation: readonly H3Index[]): string | null {
  const here = cellCentre(from);
  let best: { metres: number; deg: number } | null = null;

  for (const [, province] of wondersNear(from, nation)) {
    const centre = cellCentre(province);
    const metres = haversine(here, centre);
    if (!best || metres < best.metres) {
      best = { metres, deg: bearing(here, centre) };
    }
  }
  if (!best) return null;

  // The wonder is not named. Being told *that* something is out there and roughly where is
  // a reason to walk; being told what it is turns the walk into an errand.
  const where = compassPoint(best.deg);
  if (best.metres < NEAR_M) return `Something of that kind is close, to the ${where}.`;
  return `Something of that kind lies ${Math.round(best.metres / 1000)} km to the ${where}.`;
}
