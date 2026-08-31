import { beforeEach, describe, expect, it } from 'vitest';
import { cellAt, ringToCells } from '../geo/cells.js';
import { destination } from '../geo/project.js';
import { BASE_STRENGTH, MAX_STRENGTH } from '../rules/constants.js';
import { utcDay } from '../rules/day.js';
import { simulatePolygon } from '../sim/walk.js';
import type { BBox, Cell, TrailPoint } from '../types/domain.js';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-08-27T12:00:00Z');
const DAY = (n: number) => T0 + n * 86_400_000;
const RIVAL = 'the-pale-warden';

function square(sw: { lat: number; lng: number }, side: number) {
  const ne = destination(destination(sw, 0, side), 90, side);
  return [sw, { lat: sw.lat, lng: ne.lng }, ne, { lat: ne.lat, lng: sw.lng }];
}

/** A walked lap of a 140 m block, starting at `at`. */
function lap(at: number, seed = 21): TrailPoint[] {
  return simulatePolygon(square(ORIGIN, 140), { seed, noiseM: 2, startTime: at });
}

const BOX: BBox = {
  west: ORIGIN.lng - 0.02,
  east: ORIGIN.lng + 0.02,
  south: ORIGIN.lat - 0.02,
  north: ORIGIN.lat + 0.02,
};

let repo: MockRepository;
let store: MemoryStore;

beforeEach(async () => {
  store = new MemoryStore();
  // The tests below seed rival cells straight into `store`. Stamp the schema version so
  // `versioned()` (BRDC-PERSIST-002) reads it as a current save rather than wiping it as
  // an unversioned one on the first repo call.
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  let n = 0;
  repo = new MockRepository({ store, newId: () => `id-${++n}`, seed: 7 });
});

/** Walk a lap and close it. Returns the claim result. */
async function walkAndClose(at: number, seed = 21) {
  const runId = await repo.startRun(at);
  await repo.submitTrail(runId, lap(at, seed));
  const result = await repo.closeLoop(runId, at + 600_000);
  return { runId, result };
}

describe('closing a loop', () => {
  it('claims the ground inside it', async () => {
    const { result } = await walkAndClose(T0);
    expect(result.closed).toBe(true);
    if (!result.closed) return;

    /*
     * Since BRDC-GROW-001 the walk itself has already taken the cells underfoot, so a
     * closed lap is a mix: the perimeter is reinforced, the interior is new. The loop's
     * job is the inside — the part feet never touched.
     */
    expect(result.outcomes.length).toBeGreaterThan(3);
    expect(result.outcomes.some((o) => o.kind === 'claimed')).toBe(true);
    expect(result.areaM2).toBeGreaterThan(10_000);
  });

  it('gives more ground than the walk alone did', async () => {
    const runId = await repo.startRun(T0);
    await repo.submitTrail(runId, lap(T0));
    const walked = (await repo.getOwnedCells(T0)).length;

    await repo.closeLoop(runId, T0 + 600_000);
    expect((await repo.getOwnedCells(T0)).length).toBeGreaterThan(walked);
  });

  it('gives the claimed cells to the player at base strength', async () => {
    await walkAndClose(T0);
    const owned = await repo.getOwnedCells(T0);
    const me = await repo.getProfile();

    expect(owned.length).toBeGreaterThan(3);
    for (const cell of owned) {
      expect(cell.ownerId).toBe(me.id);
      expect(cell.strength).toBe(BASE_STRENGTH);
    }
  });

  it('pays XP, which raises the level', async () => {
    const before = await repo.getProfile();
    await walkAndClose(T0);
    const after = await repo.getProfile();

    expect(after.xp).toBeGreaterThan(before.xp);
    expect(after.level).toBe(await levelOf(after.xp));
  });

  it('does nothing for a walk that never closes', async () => {
    const runId = await repo.startRun(T0);
    // Straight out and straight back: ends where it started, encloses nothing.
    const far = destination(ORIGIN, 30, 220);
    await repo.submitTrail(runId, simulatePolygon([ORIGIN, far], { seed: 4, noiseM: 1 }));

    expect(await repo.closeLoop(runId, T0 + 600_000)).toEqual({ closed: false });
    expect(await repo.getOwnedCells(T0)).toEqual([]);
  });

  it('spends the ring, so the same lap cannot be claimed twice', async () => {
    const { runId } = await walkAndClose(T0);
    // Without trimming, the very next fix would close the identical loop again.
    expect(await repo.closeLoop(runId, T0 + 700_000)).toEqual({ closed: false });
  });
});

describe('walking the same block again', () => {
  it('reinforces rather than reclaims', async () => {
    await walkAndClose(T0);
    const { result } = await walkAndClose(DAY(1), 22);

    expect(result.closed).toBe(true);
    if (!result.closed) return;
    expect(result.outcomes.some((o) => o.kind === 'reinforced')).toBe(true);
    expect(result.outcomes.some((o) => o.kind === 'claimed')).toBe(false);
  });

  it('pays the streak bonus for consecutive days', async () => {
    await walkAndClose(T0);
    await walkAndClose(DAY(1), 22);
    const owned = await repo.getOwnedCells(DAY(1));

    // 100 + 50 for a consecutive day, rather than 100 + 25.
    const strongest = Math.max(...owned.map((c) => c.strength));
    expect(strongest).toBe(BASE_STRENGTH + 50);
  });

  it('pays nothing extra for a second lap the same day', async () => {
    await walkAndClose(T0);
    const before = (await repo.getOwnedCells(T0)).map((c) => c.strength);
    await walkAndClose(T0 + 3_600_000, 23);
    const after = (await repo.getOwnedCells(T0)).map((c) => c.strength);

    expect(Math.max(...after)).toBe(Math.max(...before));
  });
});

describe('walking over someone else', () => {
  /** Hand every cell of the block to a rival at the given strength. */
  async function giveBlockToRival(strength: number, visitedAt = T0) {
    for (const h3 of ringToCells(square(ORIGIN, 140))) {
      const cell: Cell = {
        h3,
        ownerId: RIVAL,
        strength,
        lastVisitedAt: visitedAt,
        visitDays: [utcDay(visitedAt)],
      };
      await store.set(K.cell(h3), cell);
    }
  }

  it('damages a strong block without taking it', async () => {
    await giveBlockToRival(MAX_STRENGTH);
    const { result } = await walkAndClose(T0);

    expect(result.closed).toBe(true);
    if (!result.closed) return;
    // A lap also crosses ground outside the rival's block, so not every outcome is
    // an attack. What matters is that nothing of theirs changed hands.
    expect(result.outcomes.some((o) => o.kind === 'damaged')).toBe(true);
    expect(result.outcomes.every((o) => o.kind !== 'taken')).toBe(true);
  });

  it('takes a weak block outright', async () => {
    await giveBlockToRival(40);
    const { result } = await walkAndClose(T0);

    expect(result.closed).toBe(true);
    if (!result.closed) return;
    // The perimeter falls to the walk and the interior to the loop. Nothing of the
    // rival's survives the lap.
    expect(result.outcomes.every((o) => o.kind !== 'damaged')).toBe(true);
    expect((await repo.getOwnedCells(T0)).length).toBeGreaterThan(3);

    const rivalLeft = (await repo.getCells(BOX, T0)).filter((c) => c.ownerId === RIVAL);
    expect(rivalLeft).toEqual([]);
  });

  it('needs several laps on separate days to take a home block', async () => {
    await giveBlockToRival(MAX_STRENGTH);

    let laps = 0;
    while ((await repo.getOwnedCells(DAY(laps))).length === 0 && laps < 10) {
      laps++;
      await walkAndClose(DAY(laps), 20 + laps);
    }

    expect(laps).toBeGreaterThanOrEqual(1);
    expect(laps).toBeLessThanOrEqual(6);
  });

  it('finds empty ground where a rival has already rotted away', async () => {
    // Besieging a cell nobody has walked for a month should not meet a defender.
    await giveBlockToRival(BASE_STRENGTH, T0);
    const { result } = await walkAndClose(DAY(40));

    expect(result.closed).toBe(true);
    if (!result.closed) return;
    expect(result.outcomes.some((o) => o.kind === 'claimed')).toBe(true);
    expect(result.outcomes.every((o) => o.kind !== 'damaged')).toBe(true);
  });

  it('is worn down by the walk as well as by the loop', async () => {
    // Walking across a rival's ground costs them, even on a lap that never closes.
    await giveBlockToRival(MAX_STRENGTH);
    const id = await repo.startRun(T0);
    const result = await repo.submitTrail(id, lap(T0));

    expect(result.grown.some((o) => o.kind === 'damaged')).toBe(true);
  });
});

describe('decay through the repository', () => {
  it('lets go of ground nobody has walked', async () => {
    await walkAndClose(T0);
    expect((await repo.getOwnedCells(T0)).length).toBeGreaterThan(0);

    // A freshly claimed cell survives about twelve days.
    expect(await repo.getOwnedCells(DAY(11))).not.toEqual([]);
    expect(await repo.getOwnedCells(DAY(14))).toEqual([]);
  });

  it('removes released cells from storage, not just from the answer', async () => {
    await walkAndClose(T0);
    await repo.getCells(BOX, DAY(14));

    const keys = await store.keys('cell:');
    const mine = await repo.getProfile();
    for (const key of keys) {
      const cell = await store.get<Cell>(key);
      expect(cell?.ownerId).not.toBe(mine.id);
    }
  });

  it('reports what weakened and what was lost', async () => {
    await walkAndClose(T0);
    const sweep = await repo.runDecay(DAY(5));
    expect(sweep.weakened.length).toBeGreaterThan(0);
    expect(sweep.released).toEqual([]);

    const later = await repo.runDecay(DAY(20));
    expect(later.released.length).toBeGreaterThan(0);
  });

  it('does not age a cell twice for the same days', async () => {
    // getCells projects; it must not persist the projection. Two reads a moment
    // apart must agree, or a player watching the map would watch it dissolve.
    await walkAndClose(T0);
    const first = (await repo.getOwnedCells(DAY(5))).map((c) => c.strength).sort();
    const second = (await repo.getOwnedCells(DAY(5))).map((c) => c.strength).sort();
    expect(second).toEqual(first);
  });
});

describe('viewport', () => {
  it('only returns cells in view', async () => {
    await walkAndClose(T0);
    const elsewhere: BBox = { west: 150, east: 152, south: -34, north: -33 };
    expect(await repo.getCells(elsewhere, T0)).toEqual([]);
    expect((await repo.getCells(BOX, T0)).length).toBeGreaterThan(0);
  });

  it('includes the cell the player is standing in', async () => {
    await walkAndClose(T0);
    const centre = destination(destination(ORIGIN, 0, 70), 90, 70);
    const cells = await repo.getCells(BOX, T0);
    expect(cells.map((c) => c.h3)).toContain(cellAt(centre));
  });
});

async function levelOf(xp: number): Promise<number> {
  const { levelForXp } = await import('../rules/level.js');
  return levelForXp(xp);
}
