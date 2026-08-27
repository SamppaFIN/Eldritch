/**
 * The shape of the reveal — pure, so the timing can be tested without a browser.
 *
 * Closing a loop hands the player everything inside it at once. Painting all of it in
 * the same frame reads as a state change: the map simply looks different afterwards and
 * nobody sees anything happen. A ripple outward from the middle reads as the ground
 * waking up, which is what the mechanic is called.
 *
 * Each cell carries a `delay` in 0–1, its share of the way from the centre of the claim
 * to its furthest edge. The layer animates one number across all of them.
 */
import type { Feature, FeatureCollection, Polygon } from 'geojson';
import { cellBoundary } from '@es3/core';
import type { H3Index } from '@es3/core';

/** Mean of a cell's boundary vertices. Exact enough to order a ripple by. */
function centreOf(ring: readonly (readonly [number, number])[]): [number, number] {
  let lng = 0;
  let lat = 0;
  for (const [x, y] of ring) {
    lng += x;
    lat += y;
  }
  return [lng / ring.length, lat / ring.length];
}

export function awakeningFeatures(cells: readonly H3Index[]): FeatureCollection<Polygon> {
  if (cells.length === 0) return { type: 'FeatureCollection', features: [] };

  const rings = cells.map((h3) => ({ h3, ring: cellBoundary(h3) }));
  const centres = rings.map(({ ring }) => centreOf(ring));

  const origin = centreOf(centres);
  /*
   * Longitude degrees are narrower than latitude ones this far north, so a raw
   * coordinate distance would ripple as an ellipse. Cosine correction is enough here —
   * this orders an animation, it does not measure ground.
   */
  const scale = Math.cos((origin[1] * Math.PI) / 180);
  const distances = centres.map(([lng, lat]) =>
    Math.hypot((lng - origin[0]) * scale, lat - origin[1]),
  );
  // A single cell has nowhere to ripple to, and dividing by its own zero would strand
  // every delay at NaN — which renders as nothing at all.
  const furthest = Math.max(...distances) || 1;

  const features: Feature<Polygon>[] = rings.map(({ h3, ring }, i) => ({
    type: 'Feature',
    id: h3,
    properties: { delay: (distances[i] as number) / furthest },
    geometry: { type: 'Polygon', coordinates: [ring.map(([lng, lat]) => [lng, lat])] },
  }));

  return { type: 'FeatureCollection', features };
}
