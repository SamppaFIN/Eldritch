/**
 * Map lifecycle, kept out of the component.
 *
 * Initialisation is a deterministic sequence with an explicit ready flag — not an event
 * bus. v2 spawned entities before the map was listening and the shrines silently never
 * appeared; nothing here may fire before `ready` is true.
 */
import { useEffect, useRef, useState } from 'react';
import { Map as MapLibreMap } from 'maplibre-gl';
import type { ErrorEvent } from 'maplibre-gl';
import { createMapStyle } from './style.js';

export type BasemapState = 'loading' | 'ready' | 'void';

export interface UseMapResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  map: MapLibreMap | null;
  ready: boolean;
  /** 'void' means tiles are unreachable and the game is running on the fallback. */
  basemap: BasemapState;
}

export interface UseMapOptions {
  centre: { lat: number; lng: number };
  zoom?: number;
}

export function useMap({ centre, zoom = 16 }: UseMapOptions): UseMapResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const [basemap, setBasemap] = useState<BasemapState>('loading');

  // The initial centre is read once. Afterwards the camera follows the player, and
  // re-running this effect on every GPS fix would tear the map down mid-walk.
  const initial = useRef(centre);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = new MapLibreMap({
      container,
      style: createMapStyle(),
      center: [initial.current.lng, initial.current.lat],
      zoom,
      attributionControl: { compact: true },
      // The player is walking. Tilt and rotate are accidents waiting to happen.
      pitchWithRotate: false,
      dragRotate: false,
      touchPitch: false,
      // Battery: no continuous repaint, and no fade-in of collided labels.
      fadeDuration: 0,
    });
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;

    const onLoad = () => {
      setBasemap((b) => (b === 'void' ? b : 'ready'));
      setReady(true);
    };

    /*
     * Tiles unreachable.
     *
     * The style itself is local, so it always builds; only the tiles can go missing.
     * When they do we do NOT swap styles — the background is already --void-black and
     * a restyle would only throw away the layers for nothing. We report it instead,
     * because the player standing in a dead spot deserves to be told that the streets
     * are gone rather than left wondering whether the game broke.
     *
     * Anything that is not a tile problem is logged, not swallowed: v2 lost its shrines
     * to an error nobody ever saw.
     */
    const onError = (e: ErrorEvent & { sourceId?: string }) => {
      const message = e.error?.message ?? '';
      if (e.sourceId === 'openmaptiles' || /tile|glyph|sprite|source/i.test(message)) {
        setBasemap('void');
        setReady(true);
        return;
      }
      console.error('Map error', e.error);
    };

    /** Coverage came back. Someone walked out of a tunnel. */
    const onSourceData = (e: { sourceId?: string; isSourceLoaded?: boolean }) => {
      if (e.sourceId === 'openmaptiles' && e.isSourceLoaded) setBasemap('ready');
    };

    map.on('load', onLoad);
    map.on('error', onError);
    map.on('sourcedata', onSourceData);

    return () => {
      map.off('load', onLoad);
      map.off('error', onError);
      map.off('sourcedata', onSourceData);
      map.remove();
      mapRef.current = null;
      setReady(false);
      setBasemap('loading');
    };
    // zoom is an initial camera value, not a live binding.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { containerRef, map: mapRef.current, ready, basemap };
}
