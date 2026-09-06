/**
 * One point per Work per visible cell (BRDC-ART-003) — pure, so it has a test.
 *
 * The building layer draws icons from this, not from the hex-polygon source: MapLibre
 * places one symbol per feature, so three Works on a cell means three points, each with
 * a `slot` the layer turns into a small fan so they do not stack.
 *
 * Every owner's cell is included — a rival's sawmill on the ground bordering yours is
 * intel, the same call `territoryFeatures` makes for the single glyph.
 */
import type { Feature, FeatureCollection, Point } from 'geojson';
import { cellCentre, worksOn } from '@es3/core';
import type { Cell } from '@es3/core';
import { spriteId } from './buildingSprites.js';

export interface BuildingIconProps {
  /** `map.addImage` id — `icon-image` reads this. */
  sprite: string;
  /** 0-based position in the cell's cluster; the layer fans on it. */
  slot: number;
  /** How many Works stand here, so a lone one centres and a trio spreads wider. */
  count: number;
  mine: boolean;
}

export function buildingIconFeatures(
  cells: readonly Cell[],
  me: string | null,
): FeatureCollection<Point, BuildingIconProps> {
  const features: Feature<Point, BuildingIconProps>[] = [];
  for (const cell of cells) {
    const works = worksOn(cell);
    if (works.length === 0) continue;
    const { lat, lng } = cellCentre(cell.h3);
    works.forEach((work, slot) => {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: {
          sprite: spriteId(work.id),
          slot,
          count: works.length,
          mine: cell.ownerId !== null && cell.ownerId === me,
        },
      });
    });
  }
  return { type: 'FeatureCollection', features };
}
