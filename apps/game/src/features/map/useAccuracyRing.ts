/**
 * The GPS accuracy ring, sized in real metres (BRDC-MAP-004, split from MapCanvas).
 *
 * The ring is a DOM element on the player marker, not a map layer, so its pixel size has
 * to be recomputed whenever the zoom changes — a 12 m fix is a very different number of
 * pixels at z16 and z12.
 */
import { useEffect } from 'react';
import type { RefObject } from 'react';
import type { Map as MlMap } from 'maplibre-gl';
import type { LatLng } from '@es3/core';

export function useAccuracyRing(
  map: MlMap | null,
  ready: boolean,
  position: LatLng | null,
  accuracyM: number | undefined,
  ringRef: RefObject<HTMLDivElement | null>,
): void {
  useEffect(() => {
    if (!map || !ready || !position || accuracyM === undefined) return;

    const ring = ringRef.current;
    if (!ring) return;

    const resize = () => {
      // Web Mercator ground resolution at 256 px tiles — no `+ 8` here, that belongs in
      // the tile-pixel form and drew a 5000 px ring for a 12 m fix. Clamped so a 50 m
      // fix at low zoom informs rather than swallowing the screen.
      const metresPerPixel =
        (156543.03392 * Math.cos((position.lat * Math.PI) / 180)) / Math.pow(2, map.getZoom());
      const px = Math.min(320, Math.max(24, (accuracyM * 2) / metresPerPixel));
      ring.style.width = `${px}px`;
      ring.style.height = `${px}px`;
    };

    resize();
    map.on('zoom', resize);
    return () => {
      map.off('zoom', resize);
    };
  }, [map, ready, position, accuracyM, ringRef]);
}
