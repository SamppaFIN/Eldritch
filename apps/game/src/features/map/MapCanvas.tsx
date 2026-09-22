/**
 * The map surface and the player marker.
 *
 * The marker is a DOM element rather than a GeoJSON layer on purpose: there is exactly
 * one of it, it needs a CSS glow and a pulse that follow the design tokens, and
 * MapLibre keeps it anchored for free. Everything there are many of — the trail, the
 * territory — goes through GeoJSON sources instead.
 */
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Marker } from 'maplibre-gl';
import type { MapLayerMouseEvent, MapMouseEvent } from 'maplibre-gl';
import { cellAt, cellCentre, nationRegionAt, QUEST_SITES, siteCell } from '@es3/core';
import { useEditorPaint } from '../editor/useEditorPaint.js';
import type { Editor } from '../editor/useEditor.js';
import type {
  BBox,
  Cell,
  H3Index,
  LatLng,
  PlayerId,
  QuestSiteId,
  RevealedPlace,
  TradeRoute,
  TrailPoint,
  WalkedEdge,
} from '@es3/core';
import { setTrailData } from '../trail/TrailLayer.js';
import { setPathData } from '../trail/PathLayer.js';
import { setAuraData } from './AuraLayer.js';
import { setTradeData } from './TradeLayer.js';
import { CELL_FILL_LAYER, setTerritoryData } from '../territory/TerritoryLayer.js';
import { setArcData } from '../territory/strengthArcs.js';
import { useNationLayer } from '../territory/useNationLayer.js';
import { NATION_FILL_LAYER, NATION_FLY_ZOOM } from '../territory/layerIds.js';
import { useMapLayers } from './useMapLayers.js';
import { useBuildingIcons } from './useBuildingIcons.js';
import { PLACE_CORE_LAYER, PLACE_HALO_LAYER, setPlaceData } from '../territory/PlaceMarkers.js';
import { CASTLE_CORE_LAYER, CASTLE_HALO_LAYER, setCastleData } from '../territory/CastleMarker.js';
import { QUEST_MARK_LAYER, setQuestData } from '../territory/QuestMarkers.js';
import { useAwakening } from './useAwakening.js';
import { useHearthTour } from './useHearthTour.js';
import { useCameraFollow } from './useCameraFollow.js';
import { useAccuracyRing } from './useAccuracyRing.js';
import { CameraControl } from './CameraControl.js';
import { useMap } from './useMap.js';
import type { BasemapState } from './useMap.js';
import type { BannerId } from '../nation/nation.js';
import { useNearbySurvey } from './useNearbySurvey.js';
import { useTerrainResolver } from './useTerrainResolver.js';
import type { TerrainUpdate } from './useTerrainResolver.js';
import 'maplibre-gl/dist/maplibre-gl.css';
import './map.css';

/** Stable defaults, so an absent prop does not re-fire the terrain resolver each render. */
const NO_CELLS: readonly Cell[] = [];
const noResolve = (_: TerrainUpdate[]): void => {};
const EMPTY_REVEALED: Readonly<Record<H3Index, number>> = {};

export interface MapCanvasProps {
  /** Where to open the camera. Later fixes move the player, not the map's identity. */
  initialCentre: LatLng;
  /** Current position, or null before the first fix. */
  position: LatLng | null;
  /** Reported accuracy in metres, drawn as a ring. */
  accuracyM?: number | undefined;
  /** The ley-line so far. */
  trail?: readonly TrailPoint[];
  /** Every stretch ever walked, thickening with use (BRDC-TRAIL-003). */
  walkedPaths?: readonly WalkedEdge[];
  /** Hexes the selected cell's aura or loyalty reaches (BRDC-BUILD-004). */
  auraCells?: readonly string[];
  /** Trade Routes, drawn as lines between the cells they bind (BRDC-BUILD-004). */
  tradeRoutes?: readonly TradeRoute[];
  cells?: readonly Cell[]; // visible territory
  playerId?: PlayerId | null;
  places?: readonly RevealedPlace[]; // cells the game has worked out are places
  /** Adventure landmark ids the map should draw right now (BRDC-QUEST-001). */
  questSites?: readonly string[];
  /** The Keep — the published location, the Hearth cell (BRDC-CASTLE-001). Null before one exists. */
  castle?: H3Index | null;
  /** Game time, for the blight wash on decaying cells (BRDC-BLIGHT-001). */
  now?: number;
  /**
   * Cells a closure has just taken, and when.
   *
   * The timestamp is what makes a second claim of the same ground animate again — the
   * cell list alone can be identical two laps running.
   */
  awakening?: { cells: readonly H3Index[]; at: number } | null;
  /** Called when a hexagon is tapped, with its H3 index. Absent = taps do nothing. */
  onCellTap?: ((h3: string) => void) | undefined;
  /**
   * The map editor, when one is open (BRDC-MAP-EDIT-002). Absent in a player's build — it
   * lives here only because the grid and drag-painting need the map itself.
   */
  editor?: Editor | undefined;
  onPlaceTap?: (h3: string) => void; // an Anchor Stone or temple marker is tapped
  /** Called when the Keep marker is tapped — opens the nation panel. */
  onCastleTap?: () => void;
  /** Called when the viewport settles, so the caller can query that region. */
  onViewportChange?: (bbox: BBox) => void;
  /** Terrain resolved from the map's own tiles, for the caller to persist. */
  onCellTerrain?: (updates: TerrainUpdate[]) => void;
  /** Opening zoom. Wider on a first launch, so the world is not empty. */
  initialZoom?: number;
  /** Draw every Work as its own isometric icon (BRDC-ART-003). Off = the single glyph. */
  buildingIcons?: boolean;
  bannerId?: BannerId | null; // the Keep banner, drawn on held hexes (BRDC-BANNER-001)
  revealed?: Readonly<Record<H3Index, number>>; // revealed cells (BRDC-SIGIL-003) — gates the bounty layer
  onBasemapChange?: (state: BasemapState) => void;
}

/** What the "Here" button reaches in for (BRDC-MAP-004). */
export interface MapHandle {
  focusHere: () => void;
}

export const MapCanvas = forwardRef<MapHandle, MapCanvasProps>(function MapCanvas({
  initialCentre,
  position,
  accuracyM,
  trail,
  walkedPaths,
  auraCells,
  tradeRoutes,
  cells,
  playerId = null,
  places,
  questSites,
  castle = null,
  now = 0,
  awakening = null,
  initialZoom,
  buildingIcons = true,
  bannerId = null,
  revealed = EMPTY_REVEALED,
  onBasemapChange,
  onCellTap,
  editor,
  onPlaceTap,
  onCastleTap,
  onViewportChange,
  onCellTerrain,
}: MapCanvasProps, ref) {
  const { containerRef, map, ready, basemap } = useMap(
    initialZoom === undefined
      ? { centre: initialCentre }
      : { centre: initialCentre, zoom: initialZoom },
  );
  const markerRef = useRef<Marker | null>(null);
  const accuracyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    onBasemapChange?.(basemap);
  }, [basemap, onBasemapChange]);

  useTerrainResolver({ map, ready, cells: cells ?? NO_CELLS, onResolved: onCellTerrain ?? noResolve });
  // Ahead of the feet, so a claim pays the map and not the hash (BRDC-SURVEY-001).
  useNearbySurvey({ map, ready, position });

  // Create the marker once the map is ready, never before.
  useEffect(() => {
    if (!map || !ready || markerRef.current) return;

    const el = document.createElement('div');
    el.className = 'es-player';
    el.setAttribute('aria-hidden', 'true');

    const ring = document.createElement('div');
    ring.className = 'es-player__accuracy';
    const core = document.createElement('div');
    core.className = 'es-player__core';
    el.append(ring, core);
    accuracyRef.current = ring;

    markerRef.current = new Marker({ element: el })
      .setLngLat([initialCentre.lng, initialCentre.lat])
      .addTo(map);

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      accuracyRef.current = null;
    };
  }, [map, ready, initialCentre]);

  useMapLayers(map, ready);

  useBuildingIcons(map, ready, cells, playerId, buildingIcons);

  useEffect(() => {
    if (!map || !ready || !cells) return;
    setTerritoryData(map, cells, playerId, now, castle, bannerId, revealed, places);
    setArcData(map, cells, playerId, now);
  }, [map, ready, cells, playerId, now, castle, bannerId, revealed, places]);

  /*
   * Tapping a hexagon. A rendered cell carries its H3 as the feature id; a tap on none
   * (a small fog ring, no ground yet) derives the hex from the coordinates instead, so
   * the map is never dead (BRDC-CLAIM-009). A quest sigil still selects its own cell.
   */
  useEffect(() => {
    if (!map || !ready || !onCellTap) return;
    // queryRenderedFeatures throws if any named layer is absent from the style — which
    // happens mid-swap in StrictMode. Query only the layers that exist right now.
    const hits = (e: MapMouseEvent, ids: string[]) => {
      const present = ids.filter((id) => map.getLayer(id));
      return present.length ? map.queryRenderedFeatures(e.point, { layers: present }) : [];
    };
    const onClick = (e: MapMouseEvent) => {
      // The Keep has its own listener; this global one fires for every click, so without
      // the guard it would re-select the cell under the Keep and close its panel.
      if (onCastleTap && hits(e, [CASTLE_CORE_LAYER, CASTLE_HALO_LAYER]).length) return;
      // The Atlas has its own listener too — below NATION_MAXZOOM there is no rendered
      // cell under the tap anyway, so without this guard it would open the empty-cell
      // panel for whatever bare hex sits under a municipality the player has never visited.
      if (hits(e, [NATION_FILL_LAYER]).length) return;

      // Only the sigil itself, not its wide glow — a halo hit would swallow taps on the
      // hexes around a quest site and open nothing (field report 2026-09-02).
      const questId = hits(e, [QUEST_MARK_LAYER])[0]?.id;
      if (typeof questId === 'string' && questId in QUEST_SITES) {
        onCellTap(siteCell(questId as QuestSiteId));
        return;
      }

      const id = hits(e, [CELL_FILL_LAYER])[0]?.id;
      if (typeof id === 'string') {
        onCellTap(id);
        return;
      }
      // Nothing drawn under the tap — take the hex from where it landed.
      onCellTap(cellAt({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
    };
    const enter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const leave = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('click', onClick);
    map.on('mouseenter', [CELL_FILL_LAYER], enter);
    map.on('mouseleave', [CELL_FILL_LAYER], leave);
    return () => {
      map.off('click', onClick);
      map.off('mouseenter', [CELL_FILL_LAYER], enter);
      map.off('mouseleave', [CELL_FILL_LAYER], leave);
    };
  }, [map, ready, onCellTap, onCastleTap]);

  /*
   * Tapping a place. On layers above the cells, so a tap on the Anchor Stone opens the
   * sanctuary rather than the one cell it sits in.
   */
  useEffect(() => {
    if (!map || !ready || !onPlaceTap) return;
    const onClick = (e: MapLayerMouseEvent) => {
      const id = e.features?.[0]?.id;
      if (typeof id === 'string') onPlaceTap(id);
    };
    const layers = [PLACE_CORE_LAYER, PLACE_HALO_LAYER];
    map.on('click', layers, onClick);
    return () => {
      map.off('click', layers, onClick);
    };
  }, [map, ready, onPlaceTap]);

  // Tapping the Keep. It sits on the Hearth cell, so without its own handler the tap
  // falls through to the hexagon beneath — but the Keep is about the whole map.
  useEffect(() => {
    if (!map || !ready || !onCastleTap) return;
    const onClick = () => onCastleTap();
    const layers = [CASTLE_CORE_LAYER, CASTLE_HALO_LAYER];
    map.on('click', layers, onClick);
    return () => {
      map.off('click', layers, onClick);
    };
  }, [map, ready, onCastleTap]);

  // Report the viewport once it settles, so the caller loads only what is on screen.
  useEffect(() => {
    if (!map || !ready || !onViewportChange) return;
    const report = () => {
      const b = map.getBounds();
      onViewportChange({
        west: b.getWest(),
        south: b.getSouth(),
        east: b.getEast(),
        north: b.getNorth(),
      });
    };
    report();
    map.on('moveend', report);
    return () => {
      map.off('moveend', report);
    };
  }, [map, ready, onViewportChange]);

  useEffect(() => {
    if (!map || !ready || !trail) return;
    setTrailData(map, trail);
  }, [map, ready, trail]);

  useEffect(() => {
    if (!map || !ready) return;
    setPathData(map, walkedPaths ?? []);
  }, [map, ready, walkedPaths]);

  useEffect(() => {
    if (!map || !ready) return;
    setAuraData(map, auraCells ?? []);
  }, [map, ready, auraCells]);

  useEffect(() => {
    if (!map || !ready) return;
    setTradeData(map, tradeRoutes ?? []);
  }, [map, ready, tradeRoutes]);

  useEffect(() => {
    if (!map || !ready || !places) return;
    setPlaceData(map, places);
  }, [map, ready, places]);

  useEffect(() => {
    if (!map || !ready) return;
    setQuestData(map, questSites ?? []);
  }, [map, ready, questSites]);

  useEffect(() => {
    if (!map || !ready) return;
    setCastleData(map, castle);
  }, [map, ready, castle]);

  // The ground wakes up: a gold flare over the fresh claim, its own file to spare lines.
  useAwakening(map, ready, awakening);

  // The Atlas, zoomed all the way out: one small fetch, its own file (BRDC-ATLAS-001).
  useNationLayer(map, ready, playerId);

  // The founding tour: once, the camera walks the six hexes around a new Hearth.
  // The camera stops chasing the player while the map is being drawn on: the editor needs
  // it to stay where it is put (BRDC-MAP-EDIT-002).
  const held = useHearthTour(map, ready, castle) || (editor?.on ?? false);

  // The camera pin, and the ways back to the player (BRDC-MAP-004).
  const { following, recenter, focusHere, unfollow } = useCameraFollow({ map, ready, position, touring: held });
  useEditorPaint(map, ready, editor ?? null);

  // Tapping a municipality on the Atlas flies out to it — a glance at a neighbour nation
  // rather than a walk there (BRDC-ATLAS-001). unfollow first, or the next GPS fix would
  // drag the camera straight back home mid-flight.
  //
  // The target comes from where the tap landed, not the tapped feature's own id: a
  // GeoJSON source's string id does not survive MapLibre's vector-tile encoding intact,
  // so `e.features[0].id` hands back a silently truncated number here — the same
  // limitation `cellAt(e.lngLat)` already works around for an ordinary hex tap below.
  useEffect(() => {
    if (!map || !ready) return;
    const onClick = (e: MapLayerMouseEvent) => {
      if (!e.features?.length) return;
      unfollow();
      const region = nationRegionAt({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      const centre = cellCentre(region);
      map.flyTo({ center: [centre.lng, centre.lat], zoom: NATION_FLY_ZOOM, essential: true });
    };
    const enter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const leave = () => {
      map.getCanvas().style.cursor = '';
    };
    map.on('click', [NATION_FILL_LAYER], onClick);
    map.on('mouseenter', [NATION_FILL_LAYER], enter);
    map.on('mouseleave', [NATION_FILL_LAYER], leave);
    return () => {
      map.off('click', [NATION_FILL_LAYER], onClick);
      map.off('mouseenter', [NATION_FILL_LAYER], enter);
      map.off('mouseleave', [NATION_FILL_LAYER], leave);
    };
  }, [map, ready, unfollow]);

  useImperativeHandle(ref, () => ({ focusHere }), [focusHere]);

  // Move the marker on each fix; the camera is the hook's job now.
  useEffect(() => {
    if (!map || !ready || !position || !markerRef.current) return;
    markerRef.current.setLngLat([position.lng, position.lat]);
  }, [map, ready, position]);

  useAccuracyRing(map, ready, position, accuracyM, accuracyRef);

  return (
    <>
      <div ref={containerRef} className="es-map" data-basemap={basemap} />
      <CameraControl following={following} onRecenter={recenter} />
    </>
  );
});
