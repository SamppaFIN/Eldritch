/**
 * The map screen: position source, trail, map and HUD wired together.
 *
 * The wiring is a deterministic chain — repository, then position, then trail, then
 * render — with every stage carrying an explicit ready flag. v2 wired this through an
 * event bus, spawned entities before the map was listening, and lost them silently.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { speedMs } from '@es3/core';
import type { BBox, GameRepository, PlayerProfile, TrailPoint } from '@es3/core';
import { GlassPanel } from '@es3/ui';
import { MapCanvas } from '../features/map/MapCanvas.js';
import type { BasemapState } from '../features/map/useMap.js';
import { useInitialPosition } from '../features/map/useInitialPosition.js';
import { usePositionSource } from '../features/trail/usePositionSource.js';
import { useTrail } from '../features/trail/useTrail.js';
import { useTerritory } from '../features/territory/useTerritory.js';
import { useGameClock } from '../features/time/useGameClock.js';
import { Hud } from '../features/hud/Hud.js';
import { createRepository } from '../data/createRepository.js';
import './mapview.css';

export interface MapViewProps {
  onLeave: () => void;
}

export function MapView({ onLeave }: MapViewProps) {
  const [repository, setRepository] = useState<GameRepository | null>(null);
  const [durable, setDurable] = useState(true);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [basemap, setBasemap] = useState<BasemapState>('loading');
  const [simulate, setSimulate] = useState(false);
  const [bbox, setBbox] = useState<BBox | null>(null);

  const clock = useGameClock();

  // Only the opening camera position comes from here; live permission state is
  // reported by usePositionSource, which is the thing actually watching.
  const { centre, settled } = useInitialPosition();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const handle = await createRepository();
      if (cancelled) return;
      setRepository(handle.repository);
      setDurable(handle.durable);
      setProfile(await handle.repository.getProfile());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Dev-only simulated walking, so the mechanic can be exercised without going outside.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'g') setSimulate((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const { point, status, source } = usePositionSource({
    enabled: settled,
    origin: centre,
    simulate,
  });

  const trail = useTrail({ repository, point, collecting: true });

  const territory = useTerritory({
    repository,
    runId: trail.runId,
    // Closure is attempted whenever the trail grows, so a lap fills the moment it
    // closes rather than on the next timer tick.
    trailVersion: trail.points.length,
    bbox,
    now: clock.now,
  });

  // Profile is re-read after a claim: XP and level change with the ground.
  useEffect(() => {
    if (!repository || !territory.lastClaim) return;
    void repository.getProfile().then(setProfile);
  }, [repository, territory.lastClaim]);

  const onViewportChange = useCallback((next: BBox) => setBbox(next), []);

  const pace = useMemo(() => {
    const pts = trail.points;
    if (pts.length < 2) return null;
    return speedMs(pts[pts.length - 2] as TrailPoint, pts[pts.length - 1] as TrailPoint);
  }, [trail.points]);

  if (!settled || !repository) {
    return (
      <main className="mapview mapview--waiting">
        <GlassPanel className="mapview__status">
          <p className="mapview__seeking" role="status">
            Listening for the ground beneath you…
          </p>
        </GlassPanel>
      </main>
    );
  }

  return (
    <main className="mapview">
      <MapCanvas
        initialCentre={centre}
        position={point}
        accuracyM={point?.accuracy}
        trail={trail.points}
        cells={territory.cells}
        playerId={profile?.id ?? null}
        onBasemapChange={setBasemap}
        onViewportChange={onViewportChange}
      />

      {!durable ? (
        <p className="mapview__warning" role="status">
          This device will not keep your progress. The Void forgets between visits.
        </p>
      ) : null}

      {clock.shifted ? (
        <p className="mapview__warning mapview__warning--dev" role="status">
          Time is running {clock.offsetDays} days ahead · T to advance · Shift+T to return
        </p>
      ) : null}

      <Hud
        profile={profile}
        distanceM={trail.distanceM}
        accuracyM={point?.accuracy ?? null}
        speedMs={pace}
        status={status}
        source={source}
        lastRejection={trail.lastRejection}
        basemapVoid={basemap === 'void'}
        ownedCells={territory.owned.length}
        ownedAreaM2={territory.ownedAreaM2}
        strongest={territory.strongest}
        lastClaim={territory.lastClaim}
        released={territory.released}
        onWithdraw={onLeave}
      />
    </main>
  );
}
