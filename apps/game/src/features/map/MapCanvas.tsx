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
import type { BBox, Cell, H3Index, LatLng, PlayerId, RevealedPlace, TrailPoint } from '@es3/core';
import { ensureTrailLayers, removeTrailLayers, setTrailData } from '../trail/TrailLayer.js';
import {
  ensureTerritoryLayers,
  removeTerritoryLayers,
  setTerritoryData,
} from '../territory/TerritoryLayer.js';
import {
  ensurePlaceLayers,
  removePlaceLayers,
  setPlaceData,
} from '../territory/PlaceMarkers.js';
import {
  AWAKENING_MS,
  ensureAwakeningLayers,
  removeAwakeningLayers,
  setAwakeningCells,
  setAwakeningProgress,
} from '../territory/AwakeningLayer.js';
import { useMap } from './useMap.js';
import type { BasemapState } from './useMap.js';
import 'maplibre-gl/dist/maplibre-gl.css';
import './map.css';

export interface MapCanvasProps {
  /** Where to open the camera. Later fixes move the player, not the map's identity. */
  initialCentre: LatLng;
  /** Current position, or null before the first fix. */
  position: LatLng | null;
  /** Reported accuracy in metres, drawn as a ring. */
  accuracyM?: number | undefined;
  /** The ley-line so far. */
  trail?: readonly TrailPoint[];
  /** Visible territory. */
  cells?: readonly Cell[];
  playerId?: PlayerId | null;
  /** Cells the game has worked out are places. */
  places?: readonly RevealedPlace[];
  /**
   * Cells a closure has just taken, and when.
   *
   * The timestamp is what makes a second claim of the same ground animate again — the
   * cell list alone can be identical two laps running.
   */
  awakening?: { cells: readonly H3Index[]; at: number } | null;
  /** Called when the viewport settles, so the caller can query that region. */
  onViewportChange?: (bbox: BBox) => void;
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
  cells,
  playerId = null,
  places,
  awakening = null,
  initialZoom,
  follow = true,
  onBasemapChange,
  onViewportChange,
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
    ensureTrailLayers(map);
    // Last, so a place is never buried under the ground it sits in.
    ensurePlaceLayers(map);
    // Above everything: this is a moment, and it is over in two seconds.
    ensureAwakeningLayers(map);
    return () => {
      // Guard: React may run cleanup after the map has already been torn down.
      if (map.loaded()) {
        removeAwakeningLayers(map);
        removePlaceLayers(map);
        removeTrailLayers(map);
        removeTerritoryLayers(map);
      }
    };
  }, [map, ready]);

  useEffect(() => {
    if (!map || !ready || !cells) return;
    setTerritoryData(map, cells, playerId);
  }, [map, ready, cells, playerId]);

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
    if (!map || !ready || !places) return;
    setPlaceData(map, places);
  }, [map, ready, places]);

  /*
   * The ground wakes up.
   *
   * The claim is already painted by the time this runs — the reveal is a gold flare over
   * the top of it, rippling out from the middle of what was taken. Driven frame by frame
   * rather than by CSS, because the shapes are on the GPU and not in the DOM.
   */
  useEffect(() => {
    if (!map || !ready || !awakening || awakening.cells.length === 0) return;

    setAwakeningCells(map, awakening.cells);

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduced) {
      // Still say something happened, without the sweep across the screen.
      setAwakeningProgress(map, 1.2);
      const timer = setTimeout(() => setAwakeningProgress(map, 0), 600);
      return () => clearTimeout(timer);
    }

    let frame = 0;
    const started = performance.now();
    const tick = (t: number) => {
      // 0 → 2: one unit of stagger across the cells, one of flare for each of them.
      const progress = ((t - started) / AWAKENING_MS) * 2;
      setAwakeningProgress(map, Math.min(progress, 2));
      if (progress < 2) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      // Leaving it mid-flare would freeze a gold wash over the map until the next claim.
      if (map.loaded()) setAwakeningProgress(map, 0);
    };
  }, [map, ready, awakening]);

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
