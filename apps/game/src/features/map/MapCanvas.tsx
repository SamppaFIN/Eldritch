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
import type { BBox, Cell, LatLng, PlayerId, TrailPoint } from '@es3/core';
import { ensureTrailLayers, removeTrailLayers, setTrailData } from '../trail/TrailLayer.js';
import {
  ensureTerritoryLayers,
  removeTerritoryLayers,
  setTerritoryData,
} from '../territory/TerritoryLayer.js';
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
    return () => {
      // Guard: React may run cleanup after the map has already been torn down.
      if (map.loaded()) {
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
