/**
 * What happens after ground changes hands, in one place (BRDC-CLAIM-009).
 *
 * A claim — a closed loop, or a step onto new ground — moves XP, the pouch and the map.
 * This owns the re-reads that make the HUD follow, the gold flare the map plays, and the
 * step-claim trigger and its "New ground" signal. Lifted out of MapView, which is at its
 * line ceiling.
 */
import { useCallback, useEffect, useMemo } from 'react';
import { ACHIEVEMENTS, saveNow } from '@es3/core';
import type { GameRepository, H3Index, PlayerProfile, ResourcePool } from '@es3/core';
import { awakeningReveal } from './territoryFeatures.js';
import type { MomentsApi } from '../fx/useMoments.js';
import { useDiscovery } from './useDiscovery.js';
import type { DiscoveryState } from './useDiscovery.js';
import type { ClaimEvent } from './useTerritory.js';
import type { Settings } from '../hud/settings.js';
import { ZOOM_WALKING } from '../map/useMap.js';

export interface ClaimSync {
  awakening: { cells: H3Index[]; at: number } | null;
  discovery: DiscoveryState;
}

export function useClaimSync(opts: {
  repository: GameRepository | null;
  lastClaim: ClaimEvent | null;
  standingOn: H3Index | null;
  now: () => number;
  settings: Settings;
  refreshTerritory: () => Promise<void>;
  setProfile: (p: PlayerProfile) => void;
  setResources: (r: ResourcePool) => void;
  /** Draw an effect for a milestone crossed by this claim (BRDC-FX-001). */
  onMoment?: MomentsApi['show'];
}): ClaimSync {
  const { repository, lastClaim, standingOn, now, settings, refreshTerritory } = opts;
  const { setProfile, setResources, onMoment } = opts;

  const syncHud = useCallback(() => {
    if (!repository) return;
    void repository.getProfile().then(setProfile);
    void repository.getResources(now()).then(setResources);
    void refreshTerritory();
    // Achievements are stamped lazily; this is the one place the app asks live whether a
    // claim just earned one, so the moment layer can draw it (BRDC-FX-001).
    void repository.syncAchievements(now()).then((earned) => {
      for (const id of earned) {
        onMoment?.('achievement', 'Recognition', ACHIEVEMENTS.find((a) => a.id === id)?.name ?? id);
      }
    });
    // Remembered, so the next session opens at walking zoom, not the wide first-look.
    saveNow('opening-zoom', ZOOM_WALKING);
  }, [repository, now, refreshTerritory, setProfile, setResources, onMoment]);

  // A closed loop still reports through `lastClaim`; a step-claim calls `syncHud` itself.
  useEffect(() => {
    if (lastClaim) syncHud();
  }, [lastClaim, syncHud]);

  const discovery = useDiscovery(repository, standingOn, now, settings.loopClosure, syncHud);

  const awakening = useMemo(() => awakeningReveal(lastClaim), [lastClaim]);

  return { awakening, discovery };
}
