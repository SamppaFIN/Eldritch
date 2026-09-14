/**
 * BRDC-GPX-001 — an imported track takes the same ground a walk would.
 *
 * This is the requirement in PIVOT §9, and the only one that matters: the import has no
 * claiming path of its own. It reads a file into `TrailPoint[]` and hands them to
 * `submitTrail`, so the same filters run, the same adjacency rule applies, and dwell
 * accrues the same way.
 */
import { describe, expect, it } from 'vitest';
import { EMPTY_POOL, cellAt, parseGpx } from '@es3/core';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';
import type { TrailPoint } from '../types/domain.js';

const T0 = Date.parse('2026-09-11T10:00:00Z');
const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
/** A metre or so north per step, walked at a sane pace. */
const STEP_LAT = 12 / 111_320;

/** A straight walk north: eight points, ten seconds apart. */
function walk(): TrailPoint[] {
  return Array.from({ length: 8 }, (_, i) => ({
    lat: ORIGIN.lat + i * STEP_LAT,
    lng: ORIGIN.lng,
    t: T0 + i * 10_000,
    accuracy: 10,
  }));
}

const asGpx = (points: readonly TrailPoint[]) =>
  `<?xml version="1.0"?><gpx version="1.1"><trk><trkseg>${points
    .map(
      (p) =>
        `<trkpt lat="${p.lat}" lon="${p.lng}"><time>${new Date(p.t).toISOString()}</time></trkpt>`,
    )
    .join('')}</trkseg></trk></gpx>`;

async function repo() {
  const store = new MemoryStore();
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  await store.set('resources', { pool: { ...EMPTY_POOL }, since: T0, sinceDay: T0 });
  const r = new MockRepository({ store, newId: () => 'me', seed: 3 });
  await r.setHome(ORIGIN, T0);
  return r;
}

/** Walk the points through the ordinary trail path and report the ground held. */
async function groundAfter(points: TrailPoint[]): Promise<string[]> {
  const r = await repo();
  const run = await r.startRun(T0);
  await r.submitTrail(run, points);
  return (await r.getOwnedCells(T0 + 100_000)).map((c) => c.h3).sort();
}

describe('an imported track and a walked one', () => {
  it('take exactly the same ground', async () => {
    const points = walk();
    const parsed = parseGpx(asGpx(points));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const walked = await groundAfter(points);
    const imported = await groundAfter(parsed.points);
    expect(imported).toEqual(walked);
    // And it is not the trivial pass of both taking nothing.
    expect(walked.length).toBeGreaterThan(7);
  });

  /*
   * The anti-cheat filters are the walk's, not the import's — so a file with a teleport
   * in it is thrown out exactly the way a bad fix is (claude.md §15). A patiently forged
   * file is still indistinguishable from a walk; that is Phase 5's problem, and saying so
   * is better than pretending otherwise.
   */
  it('throws out a leap no walker could make, because the walk path does', async () => {
    const teleport = [
      ...walk(),
      { lat: ORIGIN.lat + 2, lng: ORIGIN.lng, t: T0 + 80_000, accuracy: 10 },
    ];
    const held = await groundAfter(teleport);
    const honest = await groundAfter(walk());
    expect(held).toEqual(honest);
  });

  it('reads back the points it was given, to the metre', async () => {
    const points = walk();
    const parsed = parseGpx(asGpx(points));
    if (!parsed.ok) return;
    for (const [i, p] of parsed.points.entries()) {
      expect(p.lat).toBeCloseTo(points[i]?.lat ?? 0, 9);
      expect(p.t).toBe(points[i]?.t);
    }
  });
});

/*
 * BRDC-GPX-003, reported from the field: *"importista tulleet heksat eivät tulleet mulle."*
 *
 * A track recorded away from the realm takes nothing, and that is the adjacency rule
 * doing its job — ground must touch ground, or a stray fix founds a colony across town
 * (`growInto`). What was missing was the game *saying* so: the import counted the fixes
 * it accepted and went quiet about the ground it could not take, which reads as a broken
 * import rather than as a rule.
 */
describe('a track recorded away from the realm', () => {
  /** The same eight-point walk, two kilometres north of anything the player holds. */
  const farWalk = (): TrailPoint[] =>
    walk().map((p) => ({ ...p, lat: p.lat + 0.02 }));

  it('takes no ground, because none of it touches ground already held', async () => {
    const home = await groundAfter([]);
    const after = await groundAfter(farWalk());
    expect(after).toEqual(home);
  });

  it('reports how many hexes were out of reach rather than going quiet', async () => {
    const r = await repo();
    const run = await r.startRun(T0);
    const result = await r.submitTrail(run, farWalk());

    expect(result.accepted).toBe(8);
    expect(result.grown.filter((g) => g.kind === 'claimed')).toHaveLength(0);
    expect(result.outOfReach).toBeGreaterThan(0);
  });

  it('counts hexes, not fixes — several fixes stand on the same hex', async () => {
    const points = farWalk();
    const r = await repo();
    const run = await r.startRun(T0);
    const result = await r.submitTrail(run, points);

    expect(result.outOfReach).toBe(new Set(points.map((p) => cellAt(p))).size);
    // And that is genuinely fewer than the fixes, or the assertion above proves nothing.
    expect(result.outOfReach).toBeLessThan(points.length);
  });

  it('is zero on a walk that starts on the player own ground', async () => {
    const r = await repo();
    const run = await r.startRun(T0);
    const result = await r.submitTrail(run, walk());
    expect(result.outOfReach).toBe(0);
  });
});
