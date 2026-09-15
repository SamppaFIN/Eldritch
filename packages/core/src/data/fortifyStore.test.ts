/**
 * BRDC-BUILD-012, part B — every path that takes or releases ground respects a Fortress.
 *
 * Part A made the rules and nothing called them. These are the paths that would have done
 * the damage: a viewport read that deletes decayed hexes without seeing a Fortress one hex
 * past its edge, a loop close that ages and deletes cell by cell, and founding a Hearth,
 * which besieged the ring it landed on with no floor at all. Each has a control beside it,
 * so a fixture that never reached the Fortress cannot pass by accident.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { cellAt, cellsWithin, neighboursOf, ringToCells } from '../geo/cells.js';
import { destination } from '../geo/project.js';
import { detectLoop } from '../geo/loopDetection.js';
import { simulatePolygon } from '../sim/walk.js';
import type { Cell } from '../types/domain.js';
import { sweepAndPersist, underFortressAt } from './cellStore.js';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { MockRepository } from './MockRepository.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-08-27T12:00:00Z');
const RIVAL = 'the-pale-warden';
const FORTRESS = [{ id: 'fortress' as const, builtAt: 0 }];
const LONG_AGO = T0 - 400 * 86_400_000;

const held = (h3: string, strength: number, over: Partial<Cell> = {}): Cell => ({
  h3,
  ownerId: RIVAL,
  strength,
  lastVisitedAt: T0,
  visitDays: [],
  ...over,
});

describe('a decay read that deletes (sweepAndPersist)', () => {
  const FORT = cellAt(ORIGIN);
  const EDGE = neighboursOf(FORT)[0] as string;

  it('keeps a protected hex whose Fortress lies outside the cells it was handed', async () => {
    const store = new MemoryStore();
    await store.set(K.cell(FORT), held(FORT, 500, { buildings: FORTRESS }));
    const faded = held(EDGE, 5, { lastVisitedAt: LONG_AGO });
    await store.set(K.cell(EDGE), faded);

    const sweep = await sweepAndPersist(store, [faded], T0);
    expect(sweep.released).toEqual([]);
    expect(await store.get(K.cell(EDGE))).toBeDefined();
  });

  it('control: the same hex with no Fortress by it is released and deleted', async () => {
    const store = new MemoryStore();
    const faded = held(EDGE, 5, { lastVisitedAt: LONG_AGO });
    await store.set(K.cell(EDGE), faded);

    const sweep = await sweepAndPersist(store, [faded], T0);
    expect(sweep.released).toEqual([EDGE]);
    expect(await store.get(K.cell(EDGE))).toBeUndefined();
  });

  it('underFortressAt reads the ring to answer for a single hex', async () => {
    const store = new MemoryStore();
    const far = cellsWithin(FORT, 2).find((h) => !cellsWithin(FORT, 1).includes(h)) as string;
    await store.set(K.cell(FORT), held(FORT, 500, { buildings: FORTRESS }));
    await store.set(K.cell(EDGE), held(EDGE, 100));
    await store.set(K.cell(far), held(far, 100));
    expect(await underFortressAt(store, EDGE)).toBe(true);
    expect(await underFortressAt(store, far)).toBe(false);
  });
});

describe('through the repository', () => {
  let store: MemoryStore;
  let repo: MockRepository;

  beforeEach(async () => {
    store = new MemoryStore();
    await store.set(SCHEMA_KEY, SCHEMA_VERSION);
    let n = 0;
    repo = new MockRepository({ store, newId: () => `id-${++n}`, seed: 7 });
  });

  /** A walked lap of a 140 m block from ORIGIN — the same shape claiming.test.ts closes. */
  function lap(at: number) {
    const ne = destination(destination(ORIGIN, 0, 140), 90, 140);
    const corners = [ORIGIN, { lat: ORIGIN.lat, lng: ne.lng }, ne, { lat: ne.lat, lng: ORIGIN.lng }];
    return simulatePolygon(corners, { seed: 21, noiseM: 2, startTime: at });
  }

  /** Walk the lap, put a long-abandoned rival hex on its ring, then close the loop. */
  async function closeAroundRival(withFortress: boolean) {
    const runId = await repo.startRun(T0);
    const points = lap(T0);
    await repo.submitTrail(runId, points);
    const detected = detectLoop(points, { level: 1 });
    if (!detected.closed) throw new Error('fixture: the lap did not close');

    const target = ringToCells(detected.loop.points)[3] as string;
    const fort = neighboursOf(target)[0] as string;
    await store.set(K.cell(target), held(target, 5, { lastVisitedAt: LONG_AGO }));
    if (withFortress) await store.set(K.cell(fort), held(fort, 500, { buildings: FORTRESS }));

    await repo.closeLoop(runId, T0 + 600_000);
    return store.get<Cell>(K.cell(target));
  }

  it('closing a loop neither deletes nor takes a hex under a Fortress, however long it was left', async () => {
    const after = await closeAroundRival(true);
    expect(after?.ownerId).toBe(RIVAL);
    expect(after?.strength).toBeGreaterThanOrEqual(1);
  });

  it('control: the same hex with no Fortress is released and taken by the loop', async () => {
    const after = await closeAroundRival(false);
    expect(after?.ownerId).not.toBe(RIVAL);
  });

  async function foundBeside(withFortress: boolean) {
    const beside = neighboursOf(cellAt(ORIGIN))[0] as string;
    await store.set(
      K.cell(beside),
      held(beside, 1, withFortress ? { buildings: FORTRESS } : {}),
    );
    await repo.setHome(ORIGIN, T0);
    return store.get<Cell>(K.cell(beside));
  }

  it("founding a Hearth cannot take a rival's fortified hex in its ring", async () => {
    const after = await foundBeside(true);
    expect(after?.ownerId).toBe(RIVAL);
  });

  it('control: without the Fortress, the Hearth takes that hex', async () => {
    const after = await foundBeside(false);
    expect(after?.ownerId).not.toBe(RIVAL);
  });
});
