/**
 * The shared world, one region at a time.
 *
 * `world/<res6>.json` is how Phases 0–2 fake a server: a cron job (`scripts/build-world.mjs`)
 * merges players' submitted territory into one file per res-6 region, publishes them to
 * Pages, and every client reads the shards for whatever it is looking at. It is read
 * state, never truth — it says what other people *claim* to hold. Disputes are settled by
 * the Wager, not by the file (the same compromise `PIVOT-2026-08-27.md` §5 made for
 * combat).
 *
 * Pure, like `challenge.ts`, and it shares that module's `checksum` — a torn-file
 * detector, not a signature. A client cannot be stopped from lying about its own
 * strength, and pretending otherwise would be worse than saying so; Phase 3's server is
 * where authority lives.
 *
 * Published locations are Keeps (`getCastle`), never Hearths — a Hearth is where someone
 * actually lives, and this file sits on an open URL (BRDC-CASTLE-001).
 */
import { MAX_SHARD_CELLS, WORLD_VERSION } from '../rules/constants.js';
import { regionOf } from '../geo/cells.js';
import { checksum } from './challenge.js';
import type { Cell, H3Index, PlayerId } from '../types/domain.js';

export interface WorldPlayer {
  id: PlayerId;
  name: string;
  /** Their Keep — the public decoy, never the Hearth (BRDC-CASTLE-001). */
  castle: H3Index | null;
  cells: Array<{ h3: H3Index; strength: number }>;
}

export interface WorldShard {
  v: number;
  /** The res-6 region every cell in this shard belongs to. */
  region: H3Index;
  generatedAt: number;
  players: WorldPlayer[];
  /** FNV-1a over everything above. Catches a truncated file, not an edited strength. */
  sum: string;
}

export type WorldFault = 'not-json' | 'not-a-shard' | 'wrong-version' | 'damaged' | 'too-large';

export type WorldParse = { ok: true; shard: WorldShard } | { ok: false; fault: WorldFault };

export type WorldImportResult =
  | { ok: true; region: H3Index; players: number; cells: number; generatedAt: number }
  | { ok: false; fault: WorldFault };

export interface WorldSource {
  id: PlayerId;
  name: string;
  castle: H3Index | null;
  cells: readonly Cell[];
}

/**
 * Bucket every source's ground by res-6 region and seal one shard per populated region.
 *
 * A player's cells routinely span more than one region, so the same player appears in
 * several shards, each carrying only the cells that belong there. A region past
 * `MAX_SHARD_CELLS` keeps the strongest across everyone in it — a busy city is a
 * directory of shards, but one region's file still has a ceiling.
 */
export function buildShards(
  sources: readonly WorldSource[],
  now: number,
): Map<H3Index, WorldShard> {
  const names = new Map<PlayerId, { name: string; castle: H3Index | null }>();
  const byRegion = new Map<H3Index, Array<{ id: PlayerId; h3: H3Index; strength: number }>>();

  for (const source of sources) {
    names.set(source.id, { name: source.name, castle: source.castle });
    for (const cell of source.cells) {
      const region = regionOf(cell.h3);
      const bucket = byRegion.get(region) ?? [];
      bucket.push({ id: source.id, h3: cell.h3, strength: Math.round(cell.strength) });
      byRegion.set(region, bucket);
    }
  }

  const shards = new Map<H3Index, WorldShard>();
  for (const [region, flat] of byRegion) {
    const kept = [...flat].sort((a, b) => b.strength - a.strength).slice(0, MAX_SHARD_CELLS);

    const grouped = new Map<PlayerId, Array<{ h3: H3Index; strength: number }>>();
    for (const { id, h3, strength } of kept) {
      const list = grouped.get(id) ?? [];
      list.push({ h3, strength });
      grouped.set(id, list);
    }

    const players: WorldPlayer[] = [];
    for (const [id, cells] of grouped) {
      const who = names.get(id);
      players.push({ id, name: who?.name ?? id, castle: who?.castle ?? null, cells });
    }

    const payload = { v: WORLD_VERSION, region, generatedAt: now, players };
    shards.set(region, { ...payload, sum: checksum(payload) });
  }
  return shards;
}

export function encodeWorld(shard: WorldShard): string {
  return JSON.stringify(shard);
}

/**
 * Read one shard. Every refusal is a named fault: a shard dropped on the floor silently
 * is a world that is quietly wrong, and the whole point of the file is that it is not.
 */
export function parseWorld(text: string): WorldParse {
  let raw: unknown;
  try {
    raw = JSON.parse(text.trim());
  } catch {
    return { ok: false, fault: 'not-json' };
  }

  if (typeof raw !== 'object' || raw === null) return { ok: false, fault: 'not-a-shard' };
  const s = raw as Partial<WorldShard>;

  if (
    typeof s.v !== 'number' ||
    typeof s.region !== 'string' ||
    typeof s.generatedAt !== 'number' ||
    !Array.isArray(s.players) ||
    typeof s.sum !== 'string'
  ) {
    return { ok: false, fault: 'not-a-shard' };
  }
  if (s.v !== WORLD_VERSION) return { ok: false, fault: 'wrong-version' };

  const cellCount = s.players.reduce(
    (n, p) => n + (Array.isArray(p?.cells) ? p.cells.length : 0),
    0,
  );
  if (cellCount > MAX_SHARD_CELLS) return { ok: false, fault: 'too-large' };

  const { sum, ...payload } = s as WorldShard;
  if (sum !== checksum(payload)) return { ok: false, fault: 'damaged' };

  return { ok: true, shard: s as WorldShard };
}

/**
 * The shard's cells as this game can store and draw them — everyone but the local player.
 *
 * Marked `imported`: it is someone else's ground, refreshed by cron, and this device
 * never witnesses its visits. `lastVisitedAt` is set to `now` for completeness, but the
 * `imported` flag is what actually keeps decay off it (`rules/decay.ts`).
 */
export function worldToCells(shard: WorldShard, mineId: PlayerId, now: number): Cell[] {
  const cells: Cell[] = [];
  for (const player of shard.players) {
    if (player.id === mineId) continue;
    for (const c of player.cells) {
      cells.push({
        h3: c.h3,
        ownerId: player.id,
        strength: c.strength,
        lastVisitedAt: now,
        visitDays: [],
        imported: true,
      });
    }
  }
  return cells;
}

/** How stale a shard is, for the "other realms last stirred N h ago" readout. */
export function worldAgeMs(shard: WorldShard, now: number): number {
  return Math.max(0, now - shard.generatedAt);
}
