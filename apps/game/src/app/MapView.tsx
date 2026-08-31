/**
 * The map screen: position source, trail, map and HUD wired together.
 *
 * The wiring is a deterministic chain — repository, then position, then trail, then
 * render — with every stage carrying an explicit ready flag. v2 wired this through an
 * event bus, spawned entities before the map was listening, and lost them silently.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { cellAt, clearAll, levelState, load, saveNow, speedMs } from '@es3/core';
import type {
  BBox,
  GameRepository,
  H3Index,
  PlayerProfile,
  ResourcePool,
  RevealedPlace,
  Terrain,
  TrailPoint,
} from '@es3/core';
import { GlassPanel } from '@es3/ui';
import { MapCanvas } from '../features/map/MapCanvas.js';
import type { BasemapState } from '../features/map/useMap.js';
import { useInitialPosition } from '../features/map/useInitialPosition.js';
import { usePositionSource } from '../features/trail/usePositionSource.js';
import { useTrail } from '../features/trail/useTrail.js';
import { useKeepAlive } from '../features/trail/useKeepAlive.js';
import { useTerritory } from '../features/territory/useTerritory.js';
import { ClaimBurst } from '../features/territory/ClaimBurst.js';
import { CellPanel } from '../features/territory/CellPanel.js';
import { HearthPanel } from '../features/territory/HearthPanel.js';
import { useSelection } from '../features/territory/useSelection.js';
import { WagerDialog } from '../features/wager/WagerDialog.js';
import { PlaceReveal } from '../features/territory/PlaceReveal.js';
import { useGameClock } from '../features/time/useGameClock.js';
import { ZOOM_FIRST_LOOK, ZOOM_WALKING } from '../features/map/useMap.js';
import { Hud } from '../features/hud/Hud.js';
import { ResetDialog, WithdrawDialog } from '../features/hud/Sanctum.js';
import { FirstLook } from '../features/hud/FirstLook.js';
import { createRepository } from '../data/createRepository.js';
import { useWorld } from '../features/territory/useWorld.js';
import './mapview.css';

export interface MapViewProps {
  onLeave: () => void;
}

export function MapView({ onLeave }: MapViewProps) {
  const [repository, setRepository] = useState<GameRepository | null>(null);
  const [durable, setDurable] = useState(true);
  const [schemaReset, setSchemaReset] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [basemap, setBasemap] = useState<BasemapState>('loading');
  const [simulate, setSimulate] = useState(false);
  const [bbox, setBbox] = useState<BBox | null>(null);
  const [confirming, setConfirming] = useState<'withdraw' | 'reset' | null>(null);
  const [places, setPlaces] = useState<RevealedPlace[]>([]);
  const [castle, setCastle] = useState<H3Index | null>(null);
  const [resources, setResources] = useState<ResourcePool | null>(null);

  /*
   * Held open by the player, never by default.
   *
   * It keeps the screen lit and a near-silent loop playing, which is the only way a web
   * page keeps receiving fixes once it stops being looked at. It costs battery, so the
   * game asks rather than assumes.
   */
  const keepAlive = useKeepAlive();

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
      setSchemaReset(handle.reset);
      setProfile(await handle.repository.getProfile());
      // A returning player already has a Keep; setHome below only fires for a fresh one.
      setCastle(await handle.repository.getCastle());
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

  /*
   * Write the accepted Hearth through, once.
   *
   * App records the acceptance in localStorage because it has no repository; this is
   * where it becomes a claimed cell and an Anchor Stone. Guarded on `getHome` rather
   * than on the note, so a save that already has one is never overwritten.
   */
  useEffect(() => {
    if (!repository) return;
    const mark = load<{ position: { lat: number; lng: number } } | null>('hearth', null);
    if (!mark) return;
    void (async () => {
      if (await repository.getHome()) return;
      await repository.setHome(mark.position, clock.now());
      setProfile(await repository.getProfile());
      setCastle(await repository.getCastle());
    })();
  }, [repository, clock]);

  // The world exists as soon as the game knows where you are, not once a batch of
  // trail points has been written.
  useEffect(() => {
    if (!repository || !point) return;
    void repository.seedAround(point, clock.now());
  }, [repository, point, clock]);

  const trail = useTrail({ repository, point, collecting: true });

  /*
   * Places are re-read whenever one reveals itself, and once at start so a returning
   * player's Anchor is on the map before they have walked a step.
   */
  useEffect(() => {
    if (!repository || !trail.ready) return;
    void repository.getPlaces().then(setPlaces);
  }, [repository, trail.ready, trail.revealed]);

  const territory = useTerritory({
    repository,
    runId: trail.runId,
    // Closure is attempted whenever the trail grows, so a lap fills the moment it
    // closes rather than on the next timer tick.
    trailVersion: trail.points.length,
    bbox,
    now: clock.now,
    position: point,
  });

  const worldStirredMs = useWorld({
    repository,
    bbox,
    now: clock.now,
    onMerged: territory.refresh,
  });

  /*
   * The pouch, re-read whenever the ground changes and once a minute besides.
   *
   * Reading it settles the trickle, so this is also what pays the player for holding
   * land — but the payment is computed from the clock, not from the polling, and asking
   * more often does not earn more.
   */
  useEffect(() => {
    if (!repository) return;
    let alive = true;
    const read = () => {
      void repository.getResources(clock.now()).then((pool) => {
        if (alive) setResources(pool);
      });
    };
    read();
    const timer = setInterval(read, 60_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [repository, clock, territory.lastClaim, trail.points.length]);

  // Profile is re-read after a claim: XP and level change with the ground.
  useEffect(() => {
    if (!repository || !territory.lastClaim) return;
    void repository.getProfile().then(setProfile);
    // Remembered, so the next session opens at walking zoom rather than explaining
    // the game again to someone who has already played it.
    saveNow('opening-zoom', ZOOM_WALKING);
  }, [repository, territory.lastClaim]);

  /*
   * What the map should light up, derived rather than stored: a claim is already in
   * hand, and the reveal is only the cells that changed hands in it.
   */
  const awakening = useMemo(() => {
    const claim = territory.lastClaim;
    if (!claim) return null;
    const cells = claim.outcomes
      .filter((o) => o.kind === 'claimed' || o.kind === 'taken')
      .map((o) => o.h3);
    return cells.length > 0 ? { cells, at: claim.at } : null;
  }, [territory.lastClaim]);

  const onViewportChange = useCallback((next: BBox) => setBbox(next), []);

  const onCellTerrain = useCallback(
    async (updates: { h3: string; terrain: Terrain }[]) => {
      if (!repository) return;
      for (const u of updates) await repository.setCellTerrain(u.h3, u.terrain);
      await territory.refresh();
    },
    [repository, territory.refresh],
  );

  /*
   * Everything about what the player is inspecting, in one place.
   *
   * Lifted out when MapView crossed four hundred lines. A real seam rather than a
   * convenient cut: selection, the panels it opens and the one action they offer are one
   * concern, and none of the rest of this file needs to know how it works.
   */
  const inspect = useSelection({
    repository,
    cells: territory.cells,
    places,
    now: clock.now,
    trailVersion: trail.points.length,
    onWarded: setResources,
    refreshTerritory: territory.refresh,
  });

  /** The cell under the player's feet, which is the one they most often want. */
  const standingOn = useMemo(() => (point ? cellAt(point) : null), [point]);

  /*
   * A player who owns nothing has never seen the game do anything, so the map opens
   * wide enough to show someone else's territory. Once they hold ground, walking zoom.
   *
   * Read once: the camera must not lurch outward the moment a claim decays away.
   */
  const [openingZoom] = useState(() =>
    load<number>('opening-zoom', 0) > 0 ? ZOOM_WALKING : ZOOM_FIRST_LOOK,
  );

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
        places={places}
        castle={castle}
        awakening={awakening}
        initialZoom={openingZoom}
        onBasemapChange={setBasemap}
        onCellTap={inspect.onCellTap}
        onPlaceTap={inspect.onPlaceTap}
        onViewportChange={onViewportChange}
        onCellTerrain={onCellTerrain}
      />

      <ClaimBurst claim={territory.lastClaim} />

      <PlaceReveal revealed={trail.revealed} />

      {inspect.sanctum ? (
        <HearthPanel
          owned={territory.owned}
          resources={resources}
          places={places.filter((p) => p.kind === 'temple').length}
          level={levelState(profile?.xp ?? 0).level}
          levelName={levelState(profile?.xp ?? 0).name}
          now={clock.now()}
          onWager={inspect.openWager}
          onWeakest={inspect.onCellTap}
          onClose={inspect.close}
        />
      ) : null}

      <WagerDialog open={inspect.wager} repository={repository} onClose={inspect.closeWager} />

      <CellPanel
        cell={inspect.cell}
        me={profile?.id ?? null}
        resources={resources}
        now={clock.now()}
        refusal={inspect.refusal}
        here={inspect.selected !== null && inspect.selected === standingOn}
        dwellMs={inspect.dwellMs}
        hasAnchor={places.some((p) => p.kind === 'anchor')}
        onWard={inspect.onWard}
        onClose={inspect.close}
      />

      <FirstLook
        show={territory.owned.length === 0 && territory.lastClaim === null}
        rivalCells={territory.cells.length}
        rivalBearing={territory.rivalBearing}
      />

      {!durable ? (
        <p className="mapview__warning" role="status">
          This device will not keep your progress. The Void forgets between visits.
        </p>
      ) : null}

      {schemaReset ? (
        <p className="mapview__warning" role="status">
          A sanctuary from an older age was found, and could not be read. It has returned to the Void.
        </p>
      ) : null}

      {worldStirredMs !== null ? (
        <p className="mapview__warning" role="status">
          Other realms last stirred {Math.max(1, Math.round(worldStirredMs / 3_600_000))} h ago.
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
        lastClaim={territory.lastClaim}
        fading={territory.fading}
        fadingInHours={territory.fadingInHours}
        released={territory.released}
        keepAlive={keepAlive}
        resources={resources}
        standing={standingOn !== null}
        onInspectHere={() => standingOn && inspect.onCellTap(standingOn)}
        unobservedMs={trail.unobservedMs}
        onWithdraw={() => setConfirming('withdraw')}
        onReset={() => setConfirming('reset')}
      />

      <WithdrawDialog
        open={confirming === 'withdraw'}
        ownedCells={territory.owned.length}
        distanceM={trail.distanceM}
        onConfirm={onLeave}
        onCancel={() => setConfirming(null)}
      />

      <ResetDialog
        open={confirming === 'reset'}
        onConfirm={() => {
          void (async () => {
            await repository.resetAll();
            // A full reload rather than clearing React state by hand: after a wipe
            // there is nothing to preserve, and rebuilding from boot is the one path
            // already tested a hundred times over.
            clearAll();
            window.location.reload();
          })();
        }}
        onCancel={() => setConfirming(null)}
      />
    </main>
  );
}
