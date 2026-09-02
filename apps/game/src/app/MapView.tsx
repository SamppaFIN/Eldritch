/**
 * The map screen: position source, trail, map and HUD wired together.
 *
 * The wiring is a deterministic chain — repository, then position, then trail, then
 * render — with every stage carrying an explicit ready flag. v2 wired this through an
 * event bus, spawned entities before the map was listening, and lost them silently.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { levelState, load, saveNow, speedMs } from '@es3/core';
import type {
  BBox,
  GameRepository,
  H3Index,
  PlayerProfile,
  RevealedPlace,
  TrailPoint,
} from '@es3/core';
import { GlassPanel } from '@es3/ui';
import { MapCanvas } from '../features/map/MapCanvas.js';
import type { BasemapState } from '../features/map/useMap.js';
import { useInitialPosition } from '../features/map/useInitialPosition.js';
import { usePositionSource } from '../features/trail/usePositionSource.js';
import { useTrail } from '../features/trail/useTrail.js';
import { useKeepAlive } from '../features/trail/useKeepAlive.js';
import { useSimulateKey } from '../features/trail/useSimulateKey.js';
import { useTerritory } from '../features/territory/useTerritory.js';
import { ClaimBurst } from '../features/territory/ClaimBurst.js';
import { CellPanel } from '../features/territory/CellPanel.js';
import { UnexploredNote } from '../features/territory/UnexploredNote.js';
import { HearthPanel } from '../features/territory/HearthPanel.js';
import { useSelection } from '../features/territory/useSelection.js';
import { usePouchPolling } from '../features/territory/usePouchPolling.js';
import { awakeningReveal, hasDetail, withFogOfWar } from '../features/territory/territoryFeatures.js';
import { useFumingLake } from '../features/quest/useFumingLake.js';
import { QuestReveal } from '../features/quest/QuestReveal.js';
import { useCipher } from '../features/cipher/useCipher.js';
import { CipherReveal } from '../features/cipher/CipherReveal.js';
import { AdventureDialog } from '../features/quest/AdventureDialog.js';
import { useCellTerrain } from '../features/map/useCellTerrain.js';
import { useStandingCell } from '../features/map/useStandingCell.js';
import { useMapAside } from '../features/map/useMapAside.js';
import { WagerDialog } from '../features/wager/WagerDialog.js';
import { PlaceReveal } from '../features/territory/PlaceReveal.js';
import { useGameClock } from '../features/time/useGameClock.js';
import { ZOOM_FIRST_LOOK, ZOOM_WALKING } from '../features/map/useMap.js';
import { Hud } from '../features/hud/Hud.js';
import { WelcomeBack } from '../features/hud/WelcomeBack.js';
import { PouchGain } from '../features/hud/PouchGain.js';
import { SanctumDialogs } from '../features/hud/Sanctum.js';
import { FirstLook } from '../features/hud/FirstLook.js';
import { MapNotices } from '../features/hud/MapNotices.js';
import { SettingsMenu } from '../features/hud/SettingsMenu.js';
import { useSettings } from '../features/hud/useSettings.js';
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
  const [bbox, setBbox] = useState<BBox | null>(null);
  const [confirming, setConfirming] = useState<'withdraw' | 'reset' | null>(null);
  const [places, setPlaces] = useState<RevealedPlace[]>([]);
  const [castle, setCastle] = useState<H3Index | null>(null);
  const [settings, onSettingsChange] = useSettings();

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

  const simulate = useSimulateKey();

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
    home: castle,
  });

  const worldStirredMs = useWorld({
    repository,
    bbox,
    now: clock.now,
    onMerged: territory.refresh,
  });

  const { resources, forecast, gain, setResources } = usePouchPolling(repository, clock.now, [
    clock,
    territory.lastClaim,
    trail.points.length,
  ]);

  // Help, History and the Character screen — none about the cell underfoot (BRDC-CHAR-001).
  const aside = useMapAside(repository, clock.now, trail.points.length + (territory.lastClaim?.at ?? 0));
  const [welcomed, setWelcomed] = useState(false);

  // Profile is re-read after a claim: XP and level change with the ground.
  useEffect(() => {
    if (!repository || !territory.lastClaim) return;
    void repository.getProfile().then(setProfile);
    // Remembered, so the next session opens at walking zoom rather than explaining
    // the game again to someone who has already played it.
    saveNow('opening-zoom', ZOOM_WALKING);
  }, [repository, territory.lastClaim]);

  // What the map should light up after a lap — the cells that changed hands (pure helper).
  const awakening = useMemo(() => awakeningReveal(territory.lastClaim), [territory.lastClaim]);

  // Fog of war (BRDC-MAP-002): the map draws only owned ground and its ring.
  const shownCells = useMemo(() => withFogOfWar(territory.cells, territory.owned), [territory.cells, territory.owned]);
  const onViewportChange = useCallback((next: BBox) => setBbox(next), []);
  const onCellTerrain = useCellTerrain(repository, territory.refresh);

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

  const pace = useMemo(() => {
    const pts = trail.points;
    if (pts.length < 2) return null;
    return speedMs(pts[pts.length - 2] as TrailPoint, pts[pts.length - 1] as TrailPoint);
  }, [trail.points]);

  // The cell underfoot — held against GPS jitter while still, so dwell does not scatter
  // (BRDC-DWELL-002). The one the player most often wants.
  const standingOn = useStandingCell(point, pace);

  // The Fuming Lake (BRDC-QUEST-001, -002): begun and advanced from its own hexes.
  const quest = useFumingLake(repository, clock.now, territory.owned.length, standingOn, inspect.selected, territory.lastClaim?.at ?? 0);
  const cipher = useCipher(repository, standingOn, clock.now, trail.points.length);

  /*
   * A player who owns nothing has never seen the game do anything, so the map opens
   * wide enough to show someone else's territory. Once they hold ground, walking zoom.
   *
   * Read once: the camera must not lurch outward the moment a claim decays away.
   */
  const [openingZoom] = useState(() =>
    load<number>('opening-zoom', 0) > 0 ? ZOOM_WALKING : ZOOM_FIRST_LOOK,
  );

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
        walkedPaths={trail.walkedPaths}
        auraCells={inspect.auraCells}
        tradeRoutes={inspect.trade.routes}
        cells={shownCells}
        playerId={profile?.id ?? null}
        places={places}
        questSites={quest.questSites}
        castle={castle}
        now={clock.now()}
        awakening={awakening}
        initialZoom={openingZoom}
        onBasemapChange={setBasemap}
        onCellTap={inspect.onCellTap}
        onPlaceTap={inspect.onPlaceTap}
        onCastleTap={inspect.onCastleTap}
        onViewportChange={onViewportChange}
        onCellTerrain={onCellTerrain}
      />

      <ClaimBurst claim={territory.lastClaim} />
      <PlaceReveal revealed={trail.revealed} />
      <QuestReveal found={quest.justFound} onDismiss={quest.dismissFound} settings={settings} />
      <CipherReveal found={cipher.justFound} view={cipher.view} settings={settings} onDismiss={cipher.dismiss} />
      {quest.questHex ? (
        <AdventureDialog binding={quest.adventures} onHex={quest.atStageHex} onClose={() => quest.openQuestHex(null)} />
      ) : null}

      {inspect.sanctum ? (
        <HearthPanel
          owned={territory.owned}
          resources={resources}
          places={places.filter((p) => p.kind === 'temple').length}
          level={levelState(profile?.xp ?? 0).level}
          levelName={levelState(profile?.xp ?? 0).name}
          now={clock.now()}
          research={inspect.research}
          adventures={quest.adventures}
          repository={repository}
          onPouch={setResources}
          forecast={forecast}
          onWager={inspect.openWager}
          onWeakest={inspect.onCellTap}
          onClose={inspect.close}
        />
      ) : null}

      <WagerDialog open={inspect.wager} repository={repository} onClose={inspect.closeWager} />

      {inspect.cell && !hasDetail(inspect.cell, standingOn) ? (
        <UnexploredNote onClose={inspect.close} />
      ) : (
        <CellPanel
          cell={inspect.cell}
          me={profile?.id ?? null}
          resources={resources}
          now={clock.now()}
          refusal={inspect.refusal}
          here={inspect.selected !== null && inspect.selected === standingOn}
          place={inspect.place}
          onWard={inspect.onWard}
          spell={inspect.spell}
          trade={inspect.trade}
          build={inspect.build}
          anomaly={inspect.anomaly}
          quest={quest.questCell}
          onQuestOpen={() => quest.openQuestHex(inspect.selected)}
          onClose={inspect.close}
        />
      )}

      <FirstLook
        show={territory.owned.length === 0 && territory.lastClaim === null}
        rivalCells={territory.cells.length}
        rivalBearing={territory.rivalBearing}
      />

      <MapNotices
        durable={durable}
        schemaReset={schemaReset}
        worldStirredMs={worldStirredMs}
        shifted={clock.shifted}
        offsetDays={clock.offsetDays}
      />

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
        spells={inspect.spell.active}
        now={clock.now()}
        standing={standingOn !== null}
        onInspectHere={() => standingOn && inspect.onCellTap(standingOn)}
        unobservedMs={trail.unobservedMs}
        settings={settings}
        waypoint={quest.waypoint}
        onWaypointSeen={quest.onWaypointSeen}
        onOpenCharacter={aside.openCharacter}
        onOpenKeep={castle ? inspect.onCastleTap : undefined}
        onHelp={aside.openHelp}
        onOpenLog={aside.openLog}
      />

      {aside.node}
      <WelcomeBack gain={welcomed ? null : gain} settings={settings} onDismiss={() => setWelcomed(true)} />
      <PouchGain gain={gain} settings={settings} />

      <SettingsMenu
        settings={settings}
        onChange={onSettingsChange}
        onRetreat={() => setConfirming('withdraw')}
        onDeleteProgress={() => setConfirming('reset')}
        onOpenLog={aside.openLog}
        onOpenGuide={aside.openGuide}
        repository={repository}
        position={point}
        onDebugGrant={() => void repository?.debugGrant(clock.now()).then(() => repository?.getResources(clock.now()).then(setResources))}
        visible={inspect.cell === null && !inspect.sanctum}
      />

      <SanctumDialogs
        confirming={confirming}
        setConfirming={setConfirming}
        onLeave={onLeave}
        repository={repository}
        ownedCells={territory.owned.length}
        distanceM={trail.distanceM}
      />
    </main>
  );
}
