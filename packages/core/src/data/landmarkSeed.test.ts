import { describe, expect, it } from 'vitest';
import { matchLandmark, seedLandmarks } from './landmarkSeed.js';
import type { OsmElement, WrittenLandmark } from './landmarkSeed.js';
import harmalaSeed from './seed/harmala.registered.json' with { type: 'json' };
import harmalaOsm from './seed/harmala.landmarks.osm.json' with { type: 'json' };

// The real, frozen Overpass fixture (BRDC-SEED-002) — no network call in a test run.
const OSM = harmalaOsm.elements as unknown as OsmElement[];
const WRITTEN = harmalaSeed.landmarks as unknown as WrittenLandmark[];

describe('matchLandmark', () => {
  it('matches the statue by distance — an unnamed OSM sculpture a few metres away', () => {
    const statue = WRITTEN.find((l) => l.name === 'Statue of the Boy')!;
    const hit = matchLandmark(statue, OSM);
    expect(hit?.osmId).toBe('node/9487963785');
    expect(hit?.tags.artwork_type).toBe('sculpture');
  });

  it('matches the church by exact name, even though it sits ~500 m from the written coordinate', () => {
    const kirkko = WRITTEN.find((l) => l.name.endsWith('kirkko'))!;
    const hit = matchLandmark(kirkko, OSM);
    expect(hit?.osmId).toBe('way/193548188');
    expect(hit?.tags.amenity).toBe('place_of_worship');
  });

  it('finds nothing for a written landmark with no name match and no OSM feature nearby', () => {
    const villa = WRITTEN.find((l) => l.name.startsWith('Villa'))!;
    expect(matchLandmark(villa, OSM)).toBeNull();
  });

  it('returns null against an empty OSM set', () => {
    const statue = WRITTEN.find((l) => l.name === 'Statue of the Boy')!;
    expect(matchLandmark(statue, [])).toBeNull();
  });
});

describe('seedLandmarks', () => {
  const { landmarks, unmatchedWritten } = seedLandmarks(WRITTEN, OSM);

  it('matches the statue and the church, and reports the other four as unmatched', () => {
    expect(unmatchedWritten.sort()).toEqual(
      [
        'Villa Härmälänranta',
        'Härmälän veneenlaskupaikka',
        'Härmälän Pumptrack',
        'Rantaperkiön tekonurmikenttä',
      ].sort(),
    );
  });

  it('keeps every written landmark, authored, whether matched or not', () => {
    const authored = landmarks.filter((l) => l.authored);
    expect(authored).toHaveLength(WRITTEN.length);
    expect(authored.map((l) => l.name).sort()).toEqual(WRITTEN.map((l) => l.name).sort());
  });

  it('gives an unmatched landmark its own written coordinate, not an OSM one', () => {
    const villa = landmarks.find((l) => l.name.startsWith('Villa'))!;
    expect(villa.at).toEqual([61.472113, 23.729288]);
    expect(villa.osmId).toBe('authored:villa-h-rm-l-nranta');
  });

  it('gives a matched landmark the OSM coordinate, not the hand-transcribed one', () => {
    const kirkko = landmarks.find((l) => l.name.endsWith('kirkko'))!;
    expect(kirkko.at).toEqual([61.467841, 23.750912]);
  });

  it('generates the rest of the district from unclaimed OSM elements, none authored', () => {
    const generated = landmarks.filter((l) => !l.authored);
    expect(generated).toHaveLength(OSM.length - 2); // 13 elements, 2 claimed by written matches
    expect(generated.some((l) => l.name.toLowerCase().includes('viewpoint'))).toBe(true);
    expect(generated.every((l) => l.lore.length > 0)).toBe(true);
  });

  it('names a generated landmark from its own OSM name tag when it has one', () => {
    const camp = landmarks.find((l) => l.osmId === 'way/96706277')!;
    expect(camp.name).toBe('Härmälän leirintäalue');
    expect(camp.authored).toBe(false);
  });

  it('falls back to a generic name and lore for an unnamed feature', () => {
    const ruins = landmarks.find((l) => l.osmId === 'way/140160123')!;
    expect(ruins.kind).toBe('ruins');
    expect(ruins.name).toBe('Ruins');
    expect(ruins.lore.length).toBeGreaterThan(0);
  });

  it('claims each OSM element at most once, however many written landmarks are near it', () => {
    const ids = landmarks.map((l) => l.osmId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
