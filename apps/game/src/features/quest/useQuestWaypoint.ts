/**
 * Announce a newly-revealed quest landmark (BRDC-QUEST-002).
 *
 * `visibleQuestSites` grows one entry at a time as the story advances. This watches that
 * list and, the moment it gains a site, names it for a HUD line and plays a pling — so a
 * player walking with the screen half-glanced-at knows a new place is on the map. Cleared
 * on a tap or the next claim.
 */
import { useEffect, useRef, useState } from 'react';
import { QUEST_SITES } from '@es3/core';
import type { QuestSiteId } from '@es3/core';
import { playPling } from '../hud/pling.js';

export function useQuestWaypoint(
  sites: readonly QuestSiteId[],
  clearKey: number,
): { waypoint: string | null; dismiss: () => void } {
  const seen = useRef<ReadonlySet<QuestSiteId>>(new Set(sites));
  const [waypoint, setWaypoint] = useState<string | null>(null);

  useEffect(() => {
    const now = new Set(sites);
    const fresh = sites.find((s) => !seen.current.has(s));
    seen.current = now;
    // Skip the very first fill (the statue is there from the start) — `waypoint` only
    // means "this just appeared".
    if (fresh && seen.current.size > 1) {
      setWaypoint(QUEST_SITES[fresh].label);
      playPling();
    }
  }, [sites]);

  useEffect(() => setWaypoint(null), [clearKey]);

  return { waypoint, dismiss: () => setWaypoint(null) };
}
