/**
 * What happens after ground changes hands, in one place (BRDC-CLAIM-009).
 *
 * A claim — a closed loop, or a step onto new ground — moves XP, the pouch and the map.
 * This owns the re-reads that make the HUD follow, the gold flare the map plays, and the
 * step-claim trigger and its "New ground" signal. Lifted out of MapView, which is at its
 * line ceiling.
 */
import { useCallback, useEffect, useMemo } from 'react';
import { ACHIEVEMENTS, cellAreaM2, saveNow } from '@es3/core';
import type {
  CaptureOutcome,
  GameRepository,
  H3Index,
  PlayerProfile,
  ResourcePool,
} from '@es3/core';
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
  /** Announce a step-claim as a `ClaimEvent`, the same way a closure announces itself. */
  recordClaim: (event: ClaimEvent) => void;
  setProfile: (p: PlayerProfile) => void;
  setResources: (r: ResourcePool) => void;
  /** Draw an effect for a milestone crossed by this claim (BRDC-FX-001). */
  onMoment?: MomentsApi['show'];
}): ClaimSync {
  const { repository, lastClaim, standingOn, now, settings, refreshTerritory } = opts;
  const { setProfile, setResources, onMoment, recordClaim } = opts;

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

  /*
   * Each path syncs once, by the route that suits it (BRDC-CLAIM-013).
   *
   * A closure syncs off its event, here. A step-claim calls `syncHud` directly from
   * `useDiscovery`'s promise, and it has to: routing it through the event instead costs a
   * render, and `refreshTerritory` arriving a tick late is enough to break the reveal on
   * the hex the player just took — measured, not assumed (`step-claim.spec.ts:142`).
   */
  useEffect(() => {
    if (lastClaim?.kind === 'loop') syncHud();
  }, [lastClaim, syncHud]);

  /*
   * A step-claim now announces itself the same way a closure does (BRDC-CLAIM-013).
   *
   * Both paths land on one `ClaimEvent`, which is what the spoils line, the chime, the
   * buzz, the burst and the gold flare all read. Before this, the step path only called
   * `syncHud` — state was re-read and nothing was ever said, on the game's default way
   * to play.
   */
  const onStepClaimed = useCallback(
    (outcome: CaptureOutcome, h3: H3Index) => {
      recordClaim({ kind: 'step', outcomes: [outcome], areaM2: cellAreaM2(h3), at: now() });
    },
    [recordClaim, now],
  );

  const discovery = useDiscovery(
    repository, standingOn, now, settings.loopClosure, syncHud, onStepClaimed,
  );

  /*
   * The gold flare is a closure's, for now (BRDC-CLAIM-013).
   *
   * `useAwakening` drives a requestAnimationFrame loop for AWAKENING_MS — two
   * `setPaintProperty` calls per frame for 2.4 s, plus a DOM node held for 3.9 s. A
   * closure pays that once for a whole block. A step-claim lands every ~40 m of walking,
   * and firing it per hex stacked the animations badly enough to break the reveal on the
   * hex just taken (`step-claim.spec.ts`, measured both ways). A cheap single-hex flare
   * is worth having, but it is its own piece of work, not a side effect of this wiring.
   */
  const awakening = useMemo(
    () => (lastClaim?.kind === 'loop' ? awakeningReveal(lastClaim) : null),
    [lastClaim],
  );

  return { awakening, discovery };
}
