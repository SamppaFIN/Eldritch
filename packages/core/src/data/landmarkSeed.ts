/**
 * BRDC-SEED-002 — reconciling the written landmarks against real OpenStreetMap data.
 *
 * `seed.<area>.json`'s landmarks carry real names and hand-written lore, but their
 * coordinates were transcribed off a reference image (`BRDC-SEED-001`'s registration fixed
 * the whole document's systematic offset, not each landmark's individual transcription
 * error — a landmark far from the statue can still be off by hundreds of metres). This
 * module is the reconciliation: match each written landmark to the real OSM feature it
 * describes, by exact name first and by distance second, and generate the rest of the
 * district's landmarks — the ones nobody wrote lore for yet — from OSM alone.
 *
 * Pure. `scripts/fetch-landmarks.mjs` is the only place OSM data enters; this only ever
 * reads the frozen fixture it produced.
 */
import { haversine } from '../geo/haversine.js';
import type { LatLng } from '../types/domain.js';

export interface OsmElement {
  readonly osmId: string;
  readonly at: readonly [number, number];
  readonly tags: Readonly<Record<string, string>>;
}

export interface WrittenLandmark {
  readonly name: string;
  readonly at: readonly [number, number];
  readonly kind: string;
  readonly lore: string;
}

/** The shape `HexSeed.landmark` wants (worldseed.ts), plus what placement needs. */
export interface LandmarkSeed {
  readonly name: string;
  readonly osmId: string;
  readonly lore: string;
  readonly kind: string;
  readonly at: readonly [number, number];
  /** Written by a person, vs. generated from OSM tags alone. */
  readonly authored: boolean;
}

/** A written landmark's own coordinate must be at least this close to count as a match. */
const MATCH_RADIUS_M = 50;

// Finnish place names carry ä/ö consistently on both sides (the written seed and OSM's own
// tags) — no ASCII transliteration to reconcile, so this only has to fold case and whitespace.
function normalizeName(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function slug(s: string): string {
  return normalizeName(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * The written landmark's real OSM feature, or `null` if none qualifies. An exact
 * (normalized) name match wins outright — a hand-transcribed coordinate is expected to
 * drift, a name is not. Failing that, the nearest OSM element within `MATCH_RADIUS_M`
 * wins; beyond that, guessing would invent a landmark rather than find one.
 */
export function matchLandmark(written: WrittenLandmark, osm: readonly OsmElement[]): OsmElement | null {
  const wanted = normalizeName(written.name);
  const byName = wanted !== '' ? osm.find((o) => normalizeName(o.tags.name ?? '') === wanted) : undefined;
  if (byName) return byName;

  let nearest: OsmElement | null = null;
  let nearestM = Infinity;
  const from: LatLng = { lat: written.at[0], lng: written.at[1] };
  for (const o of osm) {
    const d = haversine(from, { lat: o.at[0], lng: o.at[1] });
    if (d < nearestM) {
      nearestM = d;
      nearest = o;
    }
  }
  return nearest && nearestM <= MATCH_RADIUS_M ? nearest : null;
}

interface GenericTemplate {
  name: (tags: Readonly<Record<string, string>>) => string;
  lore: string;
}

/** Fallback for a tag combination none of the specific templates recognise. */
const DEFAULT_TEMPLATE: GenericTemplate = {
  name: (tags) => tags.name ?? 'Unnamed Landmark',
  lore: 'The map knows this is here. It does not know why yet.',
};

const GENERIC: Readonly<Record<string, GenericTemplate>> = {
  viewpoint: { name: (t) => t.name ?? 'Viewpoint', lore: 'A place where the view earns the walk.' },
  picnic_site: { name: (t) => t.name ?? 'Picnic Site', lore: 'Tables built for a summer that already left.' },
  information: {
    name: (t) => t.name ?? 'Information Point',
    lore: 'A desk that answers questions nobody asked twice.',
  },
  camp_site: { name: (t) => t.name ?? 'Camp Site', lore: 'People pass through and rarely stay.' },
  caravan_site: { name: (t) => t.name ?? 'Caravan Site', lore: 'People pass through and rarely stay.' },
  attraction: { name: (t) => t.name ?? 'Attraction', lore: 'Something someone thought was worth stopping for.' },
  aircraft: {
    name: (t) => t.name ?? 'Old Aircraft',
    lore: 'It came down once, on purpose or not, and never left.',
  },
  ruins: { name: (t) => t.name ?? 'Ruins', lore: 'Stone that remembers a building the ground does not.' },
  historic: { name: (t) => t.name ?? 'Historic Site', lore: 'Old enough that nobody quite agrees why.' },
};

/** Which kind wins when a feature carries several landmark tags at once. */
function classify(tags: Readonly<Record<string, string>>): { kind: string; template: GenericTemplate } {
  const kind =
    tags.artwork_type ??
    (tags.amenity === 'place_of_worship' ? 'place_of_worship' : undefined) ??
    (tags.historic && tags.historic !== 'yes' ? tags.historic : undefined) ??
    tags.tourism ??
    (tags.historic ? 'historic' : 'landmark');
  return { kind, template: GENERIC[kind] ?? DEFAULT_TEMPLATE };
}

/**
 * Every landmark for one area: the written ones (matched to OSM where a real feature is
 * within reach, kept at their own coordinate otherwise) plus a generic landmark for every
 * other OSM feature in the district's declared tag set. `unmatchedWritten` names the
 * written landmarks that found no OSM match, so they surface in review rather than vanish.
 */
export function seedLandmarks(
  written: readonly WrittenLandmark[],
  osm: readonly OsmElement[],
): { landmarks: LandmarkSeed[]; unmatchedWritten: string[] } {
  const claimed = new Set<string>();
  const landmarks: LandmarkSeed[] = [];
  const unmatchedWritten: string[] = [];

  for (const w of written) {
    const hit = matchLandmark(w, osm);
    if (hit) {
      claimed.add(hit.osmId);
      landmarks.push({ name: w.name, osmId: hit.osmId, lore: w.lore, kind: w.kind, at: hit.at, authored: true });
    } else {
      unmatchedWritten.push(w.name);
      landmarks.push({
        name: w.name,
        osmId: `authored:${slug(w.name)}`,
        lore: w.lore,
        kind: w.kind,
        at: w.at,
        authored: true,
      });
    }
  }

  for (const o of osm) {
    if (claimed.has(o.osmId)) continue;
    const { kind, template } = classify(o.tags);
    landmarks.push({ name: template.name(o.tags), osmId: o.osmId, lore: template.lore, kind, at: o.at, authored: false });
  }

  return { landmarks, unmatchedWritten };
}
