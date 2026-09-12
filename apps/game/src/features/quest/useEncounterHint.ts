/**
 * The hint sentence for an encounter that points at a wonder (BRDC-EVENT-002).
 *
 * A hook, and it does one thing that matters: it computes nothing unless the encounter on
 * screen actually asked for a hint. Three of the thirty-four do. The national province set
 * behind `wonderHint` is about 3600 cells and a tenth of a second to build, so paying for
 * it on every step-claim would be a tax on the common case for the sake of the rare one.
 */
import { useMemo } from 'react';
import { nationProvinces } from '@es3/core';
import type { Encounter, H3Index } from '@es3/core';
import { wonderHint } from './wonderHint.js';

export function useEncounterHint(
  encounter: Encounter | null,
  standingOn: H3Index | null,
): string | null {
  return useMemo(() => {
    if (!encounter?.hint || !standingOn) return null;
    return wonderHint(standingOn, nationProvinces());
  }, [encounter, standingOn]);
}
