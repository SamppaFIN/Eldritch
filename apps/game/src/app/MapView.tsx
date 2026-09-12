/**
 * The map screen: position source, trail, map and HUD wired together.
 *
 * The wiring is a deterministic chain — repository, then position, then trail, then
 * render — with every stage carrying an explicit ready flag. v2 wired this through an
 * event bus, spawned entities before the map was listening, and lost them silently.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { levelState, load, speedMs } from '@es3/core';
import type { BBox, Collected, RevealedPlace, TrailPoint } from '@es3/core';
import { GlassPanel } from '@es3/ui';
import { MapCanvas, type MapHandle } from '../features/map/MapCanvas.js';
import type { BasemapState } from '../features/map/useMap.js';
import { useInitialPosition } from '../features/map/useInitialPosition.js';
import { usePositionSource } from '../features/trail/usePositionSource.js';
import { useTrail } from '../features/trail/useTrail.js';
import { useKeepAlive } from '../features/trail/useKeepAlive.js';
import { useSimulateKey } from '../features/trail/useSimulateKey.js';
import { useTerritory } from '../features/territory/useTerritory.js';
import { ClaimBurst } from '../features/territory/ClaimBurst.js';
import { MomentFx, useMomentTriggers, useMoments } from '../features/fx/index.js';
import { CellPanel } from '../features/territory/CellPanel.js';
import { HearthPanel } from '../features/territory/HearthPanel.js';
import { ResearchDialog } from '../features/territory/ResearchDialog.js';
import { useSelection } from '../features/territory/useSelection.js';
import { usePouchPolling } from '../features/territory/usePouchPolling.js';
import { useClaimSync } from '../features/territory/useClaimSync.js';
import { DiscoveryModal } from '../features/territory/DiscoveryModal.js';
import { useFumingLake } from '../features/quest/useFumingLake.js';
import { QuestReveal } from '../features/quest/QuestReveal.js';
import { useCipher } from '../features/cipher/useCipher.js';
import { CipherReveal } from '../features/cipher/CipherReveal.js';
import { AdventureDialog } from '../features/quest/AdventureDialog.js';
import { EncounterDialog } from '../features/quest/EncounterDialog.js';
import { useCellTerrain } from '../features/map/useCellTerrain.js';
import { useStandingCell } from '../features/map/useStandingCell.js';
import { useMapAside } from '../features/map/useMapAside.js';
import { useBoot } from '../features/map/useBoot.js';
import { EditorPanel } from '../features/editor/EditorPanel.js';
import { EDITOR_AVAILABLE, useEditor } from '../features/editor/useEditor.js';
import { WagerDialog } from '../features/wager/WagerDialog.js';
import { PlaceReveal } from '../features/territory/PlaceReveal.js';
import { useGameClock } from '../features/time/useGameClock.js';
import { ZOOM_FIRST_LOOK, ZOOM_WALKING } from '../features/map/useMap.js';
import { Hud } from '../features/hud/Hud.js';
import { PouchGain, latestGain } from '../features/hud/PouchGain.js';
import { SanctumDialogs } from '../features/hud/Sanctum.js';
import { useShownCells } from '../features/territory/useShownCells.js';
import { FirstLook } from '../features/hud/FirstLook.js';
import { UnlockTeacher } from '../features/tutor/UnlockTeacher.js';
import { WonderMoment } from '../features/wonder/WonderMoment.js';
import { MapNotices } from '../features/hud/MapNotices.js';
import { geoTrouble } from '../features/hud/notices.js';
import { SettingsMenu } from '../features/hud/SettingsMenu.js';
import { useSettings } from '../features/hud/useSettings.js';
import { useNation } from '../features/nation/useNation.js';
import { useSharedWorld } from '../features/territory/useSharedWorld.js';
import './mapview.css';

export interface MapViewProps {
  onLeave: () => void;
}

export function MapView({ onLeave }: MapViewProps) {
  const [basemap, setBasemap] = useState<BasemapState>('loading');
  const [bbox, setBbox] = useState<BBox | null>(null);
  const [confirming, setConfirming] = useState<'withdraw' | 'reset' | null>(null);
  const [places, setPlaces] = useState<RevealedPlace[]>([]);
  const [settings, onSettingsChange] = useSettings();
  const [nation] = useNation();

  // A lit screen + near-silent loop is the only way a backgrounded page keeps getting fixes.
  const keepAlive = useKeepAlive();

  const clock = useGameClock();

  // Only the opening camera position; live permission state is usePositionSource's job.
  const { centre, settled, permission } = useInitialPosition();

  const { repository, alerts, profile, setProfile, castle } = useBoot(clock.now, clock);

  const simulate = useSimulateKey();
  // Dev only, and compiled out of a player's build (BRDC-MAP-EDIT-001).
  const editor = useEditor();

  const { point, status, source } = usePositionSource({
    enabled: settled,
    origin: centre,
    simulate,
  });

  // The world exists as soon as the game knows where you are, not once trail is written.
  useEffect(() => {
    if (!repository || !point) return;
    void repository.seedAround(point, clock.now());
  }, [repository, point, clock]);

  const trail = useTrail({ repository, point, collecting: true });

  // Places re-read on a reveal, and once at start so a returning player's Anchor is there.
  useEffect(() => {
    if (!repository || !trail.ready) return;
    void repository.getPlaces().then(setPlaces);
  }, [repository, trail.ready, trail.revealed]);

  const territory = useTerritory({
    repository,
    runId: trail.runId,
    // Attempted whenever the trail grows, so a lap fills the moment it closes.
    trailVersion: trail.points.length,
    bbox,
    now: clock.now,
    position: point,
    home: castle,
    loopClosure: settings.loopClosure,
  });

  const world = useSharedWorld({
    repository,
    bbox,
    now: clock.now,
    onMerged: territory.refresh,
    enabled: settings.shareWorld,
  });

  // Stable primitives, not a fresh `clock` object each render (BRDC-ECON-003 field bug).
  // `castle` is here because the Hearth is founded *after* the repository exists
  // (BRDC-ECON-008): the first read saw an empty pouch, the founding stash landed a moment
  // later, and nothing asked again for a minute — so the HUD showed nothing and the build
  // menu, which judges affordability from this same copy, refused everything.
  const pouchTriggers = [clock.offsetDays, territory.lastClaim?.at ?? 0, trail.points.length, castle];
  const { resources, forecast, setResources } = usePouchPolling(repository, clock.now, pouchTriggers);
  const [collected, setCollected] = useState<Collected | null>(null);

  // Help, History and the Character screen — none about the cell underfoot (BRDC-CHAR-001).
  const laps = trail.points.length + (territory.lastClaim?.at ?? 0);
  const aside = useMapAside(
    repository,
    clock.now,
    laps,
    (h3) => inspect.onCellTap(h3),
    () => void territory.refresh(),
  );

  const onViewportChange = useCallback((next: BBox) => setBbox(next), []);
  const onCellTerrain = useCellTerrain(repository, territory.refresh);

  // Selection, the panels it opens, the one action they offer. Lifted out of MapView.
  const inspect = useSelection({
    repository,
    cells: territory.cells,
    places,
    now: clock.now,
    trailVersion: trail.points.length,
    onWarded: setResources,
    refreshTerritory: territory.refresh,
  });

  // What the map may draw: fog of war, minus wherever a Scrying is looking.
  const shownCells = useShownCells({ cells: territory.cells, owned: territory.owned, active: inspect.spell.active, xp: profile?.xp ?? 0, now: clock.now });

  const pace = useMemo(() => {
    const pts = trail.points;
    if (pts.length < 2) return null;
    return speedMs(pts[pts.length - 2] as TrailPoint, pts[pts.length - 1] as TrailPoint);
  }, [trail.points]);

  // The cell underfoot — held against GPS jitter while still (BRDC-DWELL-002).
  const standingOn = useStandingCell(point, pace);
  const mapRef = useRef<MapHandle | null>(null);

  const moments = useMoments();

  // After ground changes hands: re-read the HUD, play the flare, raise "New ground"
  // (CLAIM-009), draw a moment for a milestone it crossed (FX-001).
  const { awakening, discovery } = useClaimSync({
    repository, lastClaim: territory.lastClaim, standingOn, now: clock.now,
    settings, refreshTerritory: territory.refresh, recordClaim: territory.recordClaim,
    setProfile, setResources, onMoment: moments.show,
  });

  // The Fuming Lake (BRDC-QUEST-001, -002): begun and advanced from its own hexes.
  /*
   * A sheet is covering the map (BRDC-HUD-005). The HUD drops to the walking bar: its
   * stats answer "how am I doing while walking", and with a panel open the player is
   * reading the panel — the readout is height taken off what they came to read.
   */
  const sheetOpen =
    inspect.selected !== null || inspect.sanctum || inspect.researchOpen || aside.anyOpen;

  const quest = useFumingLake(repository, clock.now, territory.owned.length, standingOn, inspect.selected, territory.lastClaim?.at ?? 0);
  const cipher = useCipher(repository, standingOn, clock.now, trail.points.length);
  useMomentTriggers({ show: moments.show, xp: profile?.xp, riteLearned: inspect.research.lastRite, questEnded: quest.adventures.justEnded });

  // Owning nothing opens the map wide; holding ground opens at walking zoom. Read once.
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
    <main className="mapview" data-editing={editor.on ? editor.mode : undefined}>
      <MapCanvas
        ref={mapRef}
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
        buildingIcons={settings.buildingIcons}
        bannerId={nation.bannerId}
        onBasemapChange={setBasemap}
        // While the editor is open the map belongs to it: a tap paints and must not also
        // open a cell card (BRDC-MAP-EDIT-002).
        onCellTap={editor.on ? undefined : inspect.onCellTap}
        editor={EDITOR_AVAILABLE ? editor : undefined}
        onPlaceTap={inspect.onPlaceTap}
        onCastleTap={inspect.onCastleTap}
        onViewportChange={onViewportChange}
        onCellTerrain={onCellTerrain}
      />

      <ClaimBurst claim={territory.lastClaim} />
      <MomentFx moments={moments} />
      <DiscoveryModal
        discovered={discovery.discovered}
        owned={territory.owned}
        revealed={discovery.revealed}
        onOpenCell={inspect.onCellTap}
        onReveal={discovery.onReveal}
      />
      <PlaceReveal revealed={trail.revealed} />
      <QuestReveal found={quest.justFound} onDismiss={quest.dismissFound} settings={settings} />
      <CipherReveal found={cipher.justFound} view={cipher.view} settings={settings} onDismiss={cipher.dismiss} />
      {quest.questHex ? (
        <AdventureDialog binding={quest.adventures} onHex={quest.atStageHex} onClose={() => quest.openQuestHex(null)} />
      ) : null}
      <EncounterDialog encounter={discovery.encounter} standingOn={standingOn} onChoose={discovery.onEncounterChoice} />

      {inspect.sanctum ? (
        <HearthPanel
          owned={territory.owned}
          resources={resources}
          places={places}
          level={levelState(profile?.xp ?? 0).level}
          levelName={levelState(profile?.xp ?? 0).name}
          now={clock.now()}
          adventures={quest.adventures}
          repository={repository}
          onPouch={setResources}
          forecast={forecast}
          onWager={inspect.openWager}
          onPublish={settings.shareWorld ? world.publish : undefined}
          onWeakest={inspect.onCellTap}
          onClose={inspect.close}
        />
      ) : null}

      <WagerDialog
        open={inspect.wager}
        repository={repository}
        onClose={inspect.closeWager}
        onImported={territory.refresh}
      />
      <ResearchDialog open={inspect.researchOpen} research={inspect.research} pool={resources} wisdomPerHour={forecast?.perHour.wisdom ?? 0} onClose={inspect.closeResearch} />

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
        city={inspect.city}
        onQuestOpen={() => quest.openQuestHex(inspect.selected)}
        revealed={discovery.revealed}
        onReveal={discovery.onReveal}
        research={inspect.research}
        wisdomPerHour={forecast?.perHour.wisdom ?? 0}
        revealRivals={settings.revealRivals}
        onWiki={aside.openHelp}
        onClose={inspect.close}
      />

      <FirstLook
        owned={territory.owned.length} works={inspect.build.myBuildings.length}
        researched={inspect.build.researched.length} rivalCells={territory.cells.length}
        rivalBearing={territory.rivalBearing}
      />

      {discovery.wonderFound ? <WonderMoment id={discovery.wonderFound} onClose={discovery.clearWonder} /> : null}
      <UnlockTeacher
        repository={repository} paceMs={pace} onSee={aside.openHelp}
        reach={{
          owned: territory.owned.length,
          researched: inspect.build.researched.length,
          rivalCells: territory.cells.length,
        }}
        busy={aside.anyOpen || inspect.cell !== null || inspect.sanctum}
        onPaid={() => void repository?.getResources(clock.now()).then(setResources)}
      />

      <MapNotices
        {...alerts} geo={geoTrouble(permission, status)} worldStirredMs={world.stirredMs}
        shifted={clock.shifted} offsetDays={clock.offsetDays}
      />

      <Hud
        compact={sheetOpen}
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
        onInspectHere={() => { if (standingOn) inspect.onCellTap(standingOn); mapRef.current?.focusHere(); }}
        onCollect={() => void repository?.collect(clock.now()).then(setCollected)}
        unobservedMs={trail.unobservedMs}
        settings={settings}
        waypoint={quest.waypoint}
        onWaypointSeen={quest.onWaypointSeen}
        onOpenCharacter={aside.openCharacter}
        onOpenResearch={inspect.openResearch}
        onOpenKeep={castle ? inspect.onCastleTap : undefined}
        onHelp={aside.openHelp}
        onOpenLog={aside.openLog}
      />

      {aside.node}
      {EDITOR_AVAILABLE ? <EditorPanel editor={editor} /> : null}
      <PouchGain collected={latestGain(collected, discovery.revealGain)} settings={settings} />

      <SettingsMenu
        settings={settings}
        onChange={onSettingsChange}
        onRetreat={() => setConfirming('withdraw')}
        onDeleteProgress={() => setConfirming('reset')}
        onOpenLog={aside.openLog} onOpenCodex={aside.openCodex} onOpenLands={aside.openLands} onOpenGpx={aside.openGpx}
        onOpenEditor={EDITOR_AVAILABLE ? editor.toggle : undefined}
        onOpenGuide={aside.openGuide}
        repository={repository}
        position={point}
        onDebugGrant={() => void repository?.debugGrant(clock.now()).then(() => repository?.getResources(clock.now()).then(setResources))}
        onResetPouch={() => void repository?.resetResources(clock.now()).then(setResources)}
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
