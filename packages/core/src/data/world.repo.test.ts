/**
 * BRDC-SHARE-001 — `importWorld` through the repository.
 *
 * The format is world.test.ts's job. This is the half that touches the store: a shard
 * becomes rival cells on the map, it never decays, and it never overwrites your ground.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { destination } from '../geo/project.js';
import { cellAt, ringToCells } from '../geo/cells.js';
import { buildShards, encodeWorld } from './world.js';
import type { WorldSource } from './world.js';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import type { BBox, Cell } from '../types/domain.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-08-31T12:00:00Z');
const DAY = 86_400_000;

const around = (c: { lat: number; lng: number }, half = 0.02): BBox => ({
  west: c.lng - half,
  east: c.lng + half,
  south: c.lat - half,
  north: c.lat + half,
});

function square(sw: { lat: number; lng: number }, side: number) {
  const ne = destination(destination(sw, 0, side), 90, side);
  return [sw, { lat: sw.lat, lng: ne.lng }, ne, { lat: ne.lat, lng: sw.lng }];
}

/** Distinct h3s filling a `side`-metre block at `from` — the count the tests assert against. */
function rivalCells(id: string, from: { lat: number; lng: number }, side: number): Cell[] {
  return ringToCells(square(from, side)).map((h3) => ({
    h3,
    ownerId: id,
    strength: 250,
    lastVisitedAt: T0,
    visitDays: [],
  }));
}

function shardText(sources: WorldSource[], now = T0) {
  return encodeWorld([...buildShards(sources, now).values()][0]!);
}

describe('importWorld', () => {
  let repo: MockRepository;
  beforeEach(() => {
    repo = new MockRepository({ store: new MemoryStore(), newId: () => 'me', seed: 3 });
  });

  const rivalGround = rivalCells('rival', ORIGIN, 100);
  const n = rivalGround.length;
  const oneRival: WorldSource = { id: 'rival', name: 'rival', castle: cellAt(ORIGIN), cells: rivalGround };

  it('merges a shard as imported rival cells', async () => {
    const result = await repo.importWorld(shardText([oneRival]), T0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.players).toBe(1);
    expect(result.cells).toBe(n);
    expect(result.generatedAt).toBe(T0);

    const rival = (await repo.getCells(around(ORIGIN), T0)).filter((c) => c.ownerId === 'rival');
    expect(rival.length).toBe(n);
    expect(rival.every((c) => c.imported === true)).toBe(true);
  });

  it('does not decay imported cells, however long the map is watched', async () => {
    await repo.importWorld(shardText([oneRival]), T0);

    expect((await repo.runDecay(T0 + 30 * DAY)).released).toEqual([]);
    const later = (await repo.getCells(around(ORIGIN), T0 + 60 * DAY)).filter(
      (c) => c.ownerId === 'rival',
    );
    expect(later.length).toBe(n);
  });

  it("never overwrites the local player's own ground", async () => {
    const mine = await repo.setHome(ORIGIN, T0);
    const claimsMyCell: WorldSource = {
      id: 'rival',
      name: 'rival',
      castle: null,
      cells: [{ h3: mine, ownerId: 'rival', strength: 999, lastVisitedAt: T0, visitDays: [] }],
    };

    await repo.importWorld(shardText([claimsMyCell]), T0);

    const here = (await repo.getCells(around(ORIGIN), T0)).find((c) => c.h3 === mine);
    expect(here?.ownerId).toBe('me');
  });

  it('is idempotent — a re-import changes nothing', async () => {
    const text = shardText([oneRival]);
    await repo.importWorld(text, T0);
    const second = await repo.importWorld(text, T0 + 1_000);

    expect(second.ok).toBe(true);
    if (second.ok) expect(second.cells).toBe(n);
    const rival = (await repo.getCells(around(ORIGIN), T0)).filter((c) => c.ownerId === 'rival');
    expect(rival.length).toBe(n);
  });

  it('refuses a damaged shard without touching the map', async () => {
    expect(await repo.importWorld('{"v":1,"garbage":true}', T0)).toEqual({
      ok: false,
      fault: 'not-a-shard',
    });
  });
});
