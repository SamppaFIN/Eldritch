/**
 * The map surface and the player marker.
 *
 * The marker is a DOM element rather than a GeoJSON layer on purpose: there is exactly
 * one of it, it needs a CSS glow and a pulse that follow the design tokens, and
 * MapLibre keeps it anchored for free. Everything there are many of — the trail, the
 * territory — goes through GeoJSON sources instead.
 */
import { useEffect, useRef } from 'react';
import { Marker } from 'maplibre-gl';
import type { MapLayerMouseEvent, MapMouseEvent } from 'maplibre-gl';
import { QUEST_SITES, siteCell } from '@es3/core';
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
import { ensureTrailLayers, removeTrailLayers, setTrailData } from '../trail/TrailLayer.js';
import { ensurePathLayers, removePathLayers, setPathData } from '../trail/PathLayer.js';
import { ensureAuraLayers, removeAuraLayers, setAuraData } from './AuraLayer.js';
import { ensureTradeLayer, removeTradeLayer, setTradeData } from './TradeLayer.js';
import {
  CELL_FILL_LAYER,
  ensureTerritoryLayers,
  removeTerritoryLayers,
  setTerritoryData,
} from '../territory/TerritoryLayer.js';
import {
  PLACE_CORE_LAYER,
  PLACE_HALO_LAYER,
  ensurePlaceLayers,
  removePlaceLayers,
  setPlaceData,
} from '../territory/PlaceMarkers.js';
import { CASTLE_CORE_LAYER, CASTLE_HALO_LAYER, ensureCastleLayer, removeCastleLayer, setCastleData } from '../territory/CastleMarker.js';
import { ensureAwakeningLayers, removeAwakeningLayers } from '../territory/AwakeningLayer.js';
import {
  QUEST_MARK_LAYER,
  ensureQuestLayers,
  removeQuestLayers,
  setQuestData,
} from '../territory/QuestMarkers.js';
import { useAwakening } from './useAwakening.js';
import { useMap } from './useMap.js';
import type { BasemapState } from './useMap.js';
import { useTerrainResolver } from './useTerrainResolver.js';
import type { TerrainUpdate } from './useTerrainResolver.js';
import 'maplibre-gl/dist/maplibre-gl.css';
import './map.css';

/** Stable defaults, so an absent prop does not re-fire the terrain resolver each render. */
const NO_CELLS: readonly Cell[] = [];
const noResolve = (_: TerrainUpdate[]): void => {};

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
  /** Visible territory. */
  cells?: readonly Cell[];
  playerId?: PlayerId | null;
  /** Cells the game has worked out are places. */
  places?: readonly RevealedPlace[];
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
  /** Called when a hexagon is tapped, with its H3 index. */
  onCellTap?: (h3: string) => void;
  /** Called when an Anchor Stone or temple marker is tapped. */
  onPlaceTap?: (h3: string) => void;
  /** Called when the Keep marker is tapped — opens the nation panel. */
  onCastleTap?: () => void;
  /** Called when the viewport settles, so the caller can query that region. */
  onViewportChange?: (bbox: BBox) => void;
  /** Terrain resolved from the map's own tiles, for the caller to persist. */
  onCellTerrain?: (updates: TerrainUpdate[]) => void;
  /** Opening zoom. Wider on a first launch, so the world is not empty. */
  initialZoom?: number;
  /** Keep the camera on the player. False once they pan away by hand. */
  follow?: boolean;
  onBasemapChange?: (state: BasemapState) => void;
}

export function MapCanvas({
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
  follow = true,
  onBasemapChange,
  onCellTap,
  onPlaceTap,
  onCastleTap,
  onViewportChange,
  onCellTerrain,
}: MapCanvasProps) {
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

  // Territory first, then the trail: the ley-line the player is drawing right now
  // must never be buried under the ground they already hold.
  useEffect(() => {
    if (!map || !ready) return;
    ensureTerritoryLayers(map);
    // Under the live ley-line: a worn path is history, the trail is now (BRDC-TRAIL-003).
    ensurePathLayers(map);
    // Above territory, under the trail: it answers "what does this cell reach".
    ensureAuraLayers(map);
    ensureTradeLayer(map);
    ensureTrailLayers(map);
    // Last, so a place is never buried under the ground it sits in.
    ensurePlaceLayers(map);
    // The Keep alongside places: it is a marker of the same weight, not territory.
    ensureCastleLayer(map);
    // Adventure landmarks — a handful of gold sigils, drawn with the place markers.
    ensureQuestLayers(map);
    // Above everything: this is a moment, and it is over in two seconds.
    ensureAwakeningLayers(map);
    return () => {
      // Guard: React may run cleanup after the map has already been torn down.
      if (map.loaded()) {
        removeAwakeningLayers(map);
        removeQuestLayers(map);
        removeCastleLayer(map);
        removePlaceLayers(map);
        removeTrailLayers(map);
        removeTradeLayer(map);
        removeAuraLayers(map);
        removePathLayers(map);
        removeTerritoryLayers(map);
      }
    };
  }, [map, ready]);

  useEffect(() => {
    if (!map || !ready || !cells) return;
    setTerritoryData(map, cells, playerId, now, castle);
  }, [map, ready, cells, playerId, now, castle]);

  /*
   * Tapping a hexagon — but only one that is actually drawn. A rendered cell carries its
   * H3 as the feature id; a tap on bare basemap past the fog ring is ignored, rather than
   * opening a detail panel for a hex the player has never seen (field report 2026-09-02).
   * A quest sigil out there still selects its own cell, so the tale stays reachable.
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

      // Only the sigil itself, not its wide glow — a halo hit would swallow taps on the
      // hexes around a quest site and open nothing (field report 2026-09-02).
      const questId = hits(e, [QUEST_MARK_LAYER])[0]?.id;
      if (typeof questId === 'string' && questId in QUEST_SITES) {
        onCellTap(siteCell(questId as QuestSiteId));
        return;
      }

      const id = hits(e, [CELL_FILL_LAYER])[0]?.id;
      if (typeof id === 'string') onCellTap(id);
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

  // Move the marker and the camera on each fix.
  useEffect(() => {
    if (!map || !ready || !position || !markerRef.current) return;

    markerRef.current.setLngLat([position.lng, position.lat]);

    if (follow) {
      // easeTo, not jumpTo: a hard cut on every fix reads as a stutter while walking.
      map.easeTo({ center: [position.lng, position.lat], duration: 900 });
    }
  }, [map, ready, position, follow]);

  // The accuracy ring is sized in metres, so it has to be redrawn on zoom.
  useEffect(() => {
    if (!map || !ready || !position || accuracyM === undefined) return;

    const ring = accuracyRef.current;
    if (!ring) return;

    const resize = () => {
      // Web Mercator ground resolution at 256 px tiles. The `+ 8` that belongs in the
      // tile-pixel form of this identity does not belong here, and putting it in makes
      // the ring 256x too large — a 12 m fix drew a 5000 px circle.
      const metresPerPixel =
        (156543.03392 * Math.cos((position.lat * Math.PI) / 180)) / Math.pow(2, map.getZoom());
      // Clamped: a 50 m fix at low zoom would otherwise swallow the screen, and the
      // ring is meant to inform, not alarm.
      const px = Math.min(320, Math.max(24, (accuracyM * 2) / metresPerPixel));
      ring.style.width = `${px}px`;
      ring.style.height = `${px}px`;
    };

    resize();
    map.on('zoom', resize);
    return () => {
      map.off('zoom', resize);
    };
  }, [map, ready, position, accuracyM]);

  return <div ref={containerRef} className="es-map" data-basemap={basemap} />;
}
