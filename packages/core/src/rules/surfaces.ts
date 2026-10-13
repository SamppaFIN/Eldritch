/**
 * What the screen shows, opened as the Keeper's Charter reaches it (BRDC-ONBOARD-005).
 *
 * A new realm saw the Keep's four tabs, Research, Lands and the standard on its first day,
 * before it held ten hexes — the single biggest source of "sekava". Each surface now
 * opens with the Charter step that teaches it. And use opens it too: a surface whose step
 * the realm has already *done* is open whatever the Charter says, so a veteran — or a
 * player who found it some other way — never loses anything.
 *
 * Pure. The store hands in the realm and the claimed steps (`charterStore`).
 */
import { CHARTER_STEPS, stepDone } from './charter.js';
import type { CharterState } from './charter.js';

/** Each surface, and the Charter step that teaches it. */
export const SURFACE_STEP = {
  lands: 'realm',
  research: 'lookouts',
  'realm-tab': 'keep-2',
  standard: 'standard',
  'investigator-tab': 'investigator',
  'season-tab': 'ambition',
} as const;

export type Surface = keyof typeof SURFACE_STEP;
export const SURFACES = Object.keys(SURFACE_STEP) as Surface[];

/** The surfaces open now: those whose step the Charter has reached, or the realm has done. */
export function openSurfaces(s: CharterState, claimed: readonly string[]): Surface[] {
  const at = CHARTER_STEPS.findIndex((x) => !claimed.includes(x.id));
  const reached = at === -1 ? CHARTER_STEPS.length : at;
  return SURFACES.filter((surface) => {
    const i = CHARTER_STEPS.findIndex((x) => x.id === SURFACE_STEP[surface]);
    return i <= reached || stepDone(CHARTER_STEPS[i] as (typeof CHARTER_STEPS)[number], s);
  });
}
