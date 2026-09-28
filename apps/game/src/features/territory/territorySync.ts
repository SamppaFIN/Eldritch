/**
 * Send the map only what changed (BRDC-PERF-003).
 *
 * Every territory change used to `setData` the whole collection: one reinforced hex in a
 * realm of a thousand re-sent a thousand polygons, points and arcs to MapLibre's worker,
 * which re-tiled all of them. Now each source remembers what it was last sent, per hex,
 * and a change goes out as `updateData({ add, remove, update })` — MapLibre re-tiles only
 * the tiles those features touch. A large change (a reload, a pan to new ground) still
 * goes as one `setData`, which is cheaper than a diff of most of the set.
 *
 * The sources are created with `promoteId: 'h3'`, and every feature carries its hex as
 * `properties.h3`: MapLibre turns a string feature id into a number and loses an H3 index,
 * so the property is the id it can keep (BRDC-MAP-007's cause).
 */
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

/** Above this share of the set changed, one `setData` beats a diff. */
export const DIFF_LIMIT = 0.3;

export interface FeatureDiff<F> {
  add: F[];
  remove: string[];
  update: F[];
  /** What each feature was sent as, for the next diff. */
  next: Map<string, string>;
}

type Keyed = Feature<Geometry, Record<string, unknown>>;

const idOf = (f: Keyed): string => String(f.properties['h3'] ?? f.id);
const signature = (f: Keyed, geometry: boolean): string =>
  geometry ? JSON.stringify([f.properties, f.geometry]) : JSON.stringify(f.properties);

/** Pure: what changed between what was sent and `features`. */
export function diffFeatures<F extends Keyed>(
  prev: ReadonlyMap<string, string>,
  features: readonly F[],
  geometry = false,
): FeatureDiff<F> {
  const next = new Map<string, string>();
  const add: F[] = [];
  const update: F[] = [];
  for (const f of features) {
    const id = idOf(f);
    const sig = signature(f, geometry);
    next.set(id, sig);
    const was = prev.get(id);
    if (was === undefined) add.push(f);
    else if (was !== sig) update.push(f);
  }
  const remove = [...prev.keys()].filter((id) => !next.has(id));
  return { add, remove, update, next };
}

/** Every feature with its hex as `properties.h3`, which is what `promoteId` reads. */
export function keyed(fc: { features: readonly Feature<Geometry, object | null>[] }): Keyed[] {
  return fc.features.map((f) => ({ ...f, properties: { ...(f.properties ?? {}), h3: String(f.id) } }));
}

interface DiffSource {
  setData(d: FeatureCollection): void;
  updateData?(d: {
    add?: Keyed[];
    remove?: string[];
    update?: { id: string; newGeometry?: Geometry; addOrUpdateProperties?: { key: string; value: unknown }[] }[];
  }): void;
}

const sentTo = new WeakMap<object, Map<string, string>>();

export type SyncMode = 'set' | 'diff' | 'none';

/**
 * Bring one source up to `features`. Remembered per source object, so a source rebuilt
 * after a style change starts over with a `setData`.
 */
export function syncSource(map: MapLibreMap, sourceId: string, features: Keyed[], geometry = false): SyncMode {
  const source = map.getSource(sourceId) as unknown as DiffSource | undefined;
  if (!source) return 'none';
  const prev = sentTo.get(source);
  const diff = diffFeatures(prev ?? new Map(), features, geometry);
  const changed = diff.add.length + diff.remove.length + diff.update.length;
  if (prev && changed === 0) return 'none';

  const whole = () => {
    source.setData({ type: 'FeatureCollection', features });
    sentTo.set(source, diff.next);
    return 'set' as const;
  };
  if (!prev || !source.updateData || changed > Math.max(1, features.length) * DIFF_LIMIT) return whole();
  try {
    source.updateData({
      add: diff.add,
      remove: diff.remove,
      update: diff.update.map((f) => ({
        id: idOf(f),
        ...(geometry ? { newGeometry: f.geometry } : {}),
        addOrUpdateProperties: Object.entries(f.properties).map(([key, value]) => ({ key, value })),
      })),
    });
    sentTo.set(source, diff.next);
    return 'diff';
  } catch {
    return whole();
  }
}
