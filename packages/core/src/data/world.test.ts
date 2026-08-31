/**
 * BRDC-SHARE-001 — the `world/<res6>.json` shard format.
 *
 * Parallel to challenge.test.ts. What matters: a bad shard is refused by name and never
 * merged, and a shard's cells all belong to the region it claims.
 */
import { describe, expect, it } from 'vitest';
import { MAX_SHARD_CELLS, WORLD_VERSION } from '../rules/constants.js';
import { cellAt, regionOf } from '../geo/cells.js';
import { destination } from '../geo/project.js';
import {
  buildShards,
  buildSubmission,
  encodeSubmission,
  encodeWorld,
  parseSubmission,
  parseWorld,
  worldAgeMs,
  worldToCells,
} from './world.js';
import type { WorldSource } from './world.js';
import type { Cell } from '../types/domain.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-08-31T12:00:00Z');

function cell(h3: string, ownerId: string, strength = 200): Cell {
  return { h3, ownerId, strength, lastVisitedAt: T0, visitDays: [] };
}

/** A source with `count` cells stepping north from `from`. */
function source(id: string, from: { lat: number; lng: number }, count: number): WorldSource {
  const cells = Array.from({ length: count }, (_, i) => cell(cellAt(destination(from, 0, i * 40)), id));
  return { id, name: `player-${id}`, castle: cellAt(from), cells };
}

describe('buildShards / parseWorld round-trip', () => {
  it('re-reads a shard it just built', () => {
    const shards = buildShards([source('a', ORIGIN, 5)], T0);
    for (const shard of shards.values()) {
      const parsed = parseWorld(encodeWorld(shard));
      expect(parsed.ok).toBe(true);
      if (parsed.ok) expect(parsed.shard).toEqual(shard);
    }
  });

  it('puts every cell in the region its shard claims', () => {
    const shards = buildShards([source('a', ORIGIN, 40)], T0);
    expect(shards.size).toBeGreaterThan(0);
    for (const [region, shard] of shards) {
      expect(shard.region).toBe(region);
      for (const player of shard.players) {
        for (const c of player.cells) expect(regionOf(c.h3)).toBe(region);
      }
    }
  });

  it('spreads a player who spans two regions across both shards', () => {
    // 200 km east is unquestionably another res-6 region.
    const far = destination(ORIGIN, 90, 200_000);
    const spanning: WorldSource = {
      id: 'a',
      name: 'a',
      castle: null,
      cells: [...source('a', ORIGIN, 3).cells, ...source('a', far, 3).cells],
    };
    const shards = buildShards([spanning], T0);
    expect(shards.size).toBe(2);
    for (const shard of shards.values()) {
      expect(shard.players).toHaveLength(1);
      expect(shard.players[0]?.cells.length).toBe(3);
    }
  });
});

describe('parseWorld refuses a bad shard by name', () => {
  const good = encodeWorld([...buildShards([source('a', ORIGIN, 3)], T0).values()][0]!);

  it('not-json', () => {
    expect(parseWorld('{not json')).toEqual({ ok: false, fault: 'not-json' });
  });

  it('not-a-shard', () => {
    expect(parseWorld('{"v":1}')).toEqual({ ok: false, fault: 'not-a-shard' });
  });

  it('wrong-version', () => {
    const bumped = JSON.stringify({ ...JSON.parse(good), v: WORLD_VERSION + 1 });
    expect(parseWorld(bumped)).toEqual({ ok: false, fault: 'wrong-version' });
  });

  it('damaged', () => {
    const torn = JSON.stringify({ ...JSON.parse(good), sum: '00000000' });
    expect(parseWorld(torn)).toEqual({ ok: false, fault: 'damaged' });
  });

  it('too-large — and the limit is the constant, not a literal', () => {
    const huge = JSON.stringify({
      v: WORLD_VERSION,
      region: 'r',
      generatedAt: T0,
      players: [
        {
          id: 'a',
          name: 'a',
          castle: null,
          cells: Array.from({ length: MAX_SHARD_CELLS + 1 }, (_, i) => ({ h3: `h${i}`, strength: 1 })),
        },
      ],
      sum: 'whatever',
    });
    expect(parseWorld(huge)).toEqual({ ok: false, fault: 'too-large' });
  });
});

describe('worldToCells', () => {
  const shards = buildShards([source('a', ORIGIN, 4), source('b', ORIGIN, 4)], T0);
  const shard = [...shards.values()][0]!;

  it('drops the local player and marks the rest imported', () => {
    const cells = worldToCells(shard, 'a', T0 + 1_000);
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.every((c) => c.ownerId === 'b')).toBe(true);
    expect(cells.every((c) => c.imported === true)).toBe(true);
    expect(cells.every((c) => c.lastVisitedAt === T0 + 1_000)).toBe(true);
  });

  it('keeps everyone when the local player is a stranger to the shard', () => {
    const owners = new Set(worldToCells(shard, 'nobody', T0).map((c) => c.ownerId));
    expect(owners).toEqual(new Set(['a', 'b']));
  });
});

describe('worldAgeMs', () => {
  it('is the gap since generatedAt, never negative', () => {
    const shard = [...buildShards([source('a', ORIGIN, 2)], T0).values()][0]!;
    expect(worldAgeMs(shard, T0 + 3_600_000)).toBe(3_600_000);
    expect(worldAgeMs(shard, T0 - 5)).toBe(0);
  });
});

describe('submission — the signed message into the world', () => {
  const src = source('a', ORIGIN, 5);

  it('round-trips through parseSubmission', () => {
    const parsed = parseSubmission(encodeSubmission(buildSubmission(src)));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.source.id).toBe('a');
      expect(parsed.source.cells.length).toBe(src.cells.length);
    }
  });

  it('refuses a torn or wrong-version submission by name', () => {
    const good = encodeSubmission(buildSubmission(src));
    expect(parseSubmission('nope')).toEqual({ ok: false, fault: 'not-json' });
    expect(parseSubmission(JSON.stringify({ ...JSON.parse(good), sum: 'deadbeef' }))).toEqual({
      ok: false,
      fault: 'damaged',
    });
    expect(parseSubmission(JSON.stringify({ ...JSON.parse(good), v: WORLD_VERSION + 1 }))).toEqual({
      ok: false,
      fault: 'wrong-version',
    });
  });

  it('feeds buildShards — a submission becomes shards', () => {
    const parsed = parseSubmission(encodeSubmission(buildSubmission(src)));
    if (!parsed.ok) throw new Error('unreachable');
    const shards = buildShards([parsed.source], T0);
    expect(shards.size).toBeGreaterThan(0);
  });
});
