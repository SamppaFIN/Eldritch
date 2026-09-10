/**
 * The merge side of the shared world — the half only the Worker runs (BRDC-CODEX-001).
 *
 * `world.ts` reached its four hundred lines, and this is where it wanted to come apart:
 * everything here answers "what does the server do with everybody's submissions", and
 * nothing in the game client calls any of it. The read side (parsing a shard, turning it
 * into rival cells) and the write side (sealing your own ground) stay in `world.ts`.
 *
 * Pure, like everything it was split from. `apps/worker` imports these three.
 */
import { MAX_SHARD_CELLS, WORLD_VERSION } from '../rules/constants.js';
import { regionOf } from '../geo/cells.js';
import { checksum } from './challenge.js';
import type { WireCell } from './challenge.js';
import { trimWire } from './world.js';
import type { WorldFault, WorldPlayer, WorldShard, WorldSource } from './world.js';
import type { H3Index, PlayerId } from '../types/domain.js';

export interface PlayerFile {
  source: WorldSource;
  submittedAt: number;
}

export type PlayerFileParse = { ok: true; file: PlayerFile } | { ok: false; fault: WorldFault };

export function buildPlayerFile(source: WorldSource, submittedAt: number): PlayerFile {
  return { source, submittedAt };
}

export function encodePlayerFile(file: PlayerFile): string {
  return JSON.stringify(file);
}

export function parsePlayerFile(text: string): PlayerFileParse {
  let raw: unknown;
  try {
    raw = JSON.parse(text.trim());
  } catch {
    return { ok: false, fault: 'not-json' };
  }
  if (typeof raw !== 'object' || raw === null) return { ok: false, fault: 'not-a-shard' };
  const f = raw as Partial<PlayerFile>;
  if (
    typeof f.submittedAt !== 'number' ||
    !Number.isFinite(f.submittedAt) ||
    typeof f.source !== 'object' ||
    f.source === null ||
    typeof f.source.id !== 'string' ||
    !Array.isArray(f.source.cells)
  ) {
    return { ok: false, fault: 'not-a-shard' };
  }
  return { ok: true, file: { source: f.source as WorldSource, submittedAt: f.submittedAt } };
}

/** The un-stale players' ground, ready for `buildShards`. */
export function mergePlayerFiles(
  files: readonly PlayerFile[],
  now: number,
  ttlMs: number,
): WorldSource[] {
  return files.filter((f) => now - f.submittedAt <= ttlMs).map((f) => f.source);
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
  const who = new Map<
    PlayerId,
    {
      name: string;
      nation?: string;
      banner?: string;
      castle: H3Index | null;
      level?: number;
      leyM?: number;
    }
  >();
  const byRegion = new Map<H3Index, Array<{ id: PlayerId } & WireCell>>();

  for (const source of sources) {
    who.set(source.id, {
      name: source.name,
      ...(source.nation ? { nation: source.nation } : {}),
      ...(source.banner ? { banner: source.banner } : {}),
      castle: source.castle,
      ...(source.level ? { level: source.level } : {}),
      ...(source.leyM ? { leyM: source.leyM } : {}),
    });
    for (const cell of source.cells) {
      const region = regionOf(cell.h3);
      const bucket = byRegion.get(region) ?? [];
      bucket.push({ id: source.id, ...trimWire(cell) });
      byRegion.set(region, bucket);
    }
  }

  const shards = new Map<H3Index, WorldShard>();
  for (const [region, flat] of byRegion) {
    const kept = [...flat].sort((a, b) => b.strength - a.strength).slice(0, MAX_SHARD_CELLS);

    const grouped = new Map<PlayerId, WireCell[]>();
    for (const { id, ...wire } of kept) {
      const list = grouped.get(id) ?? [];
      list.push(wire);
      grouped.set(id, list);
    }

    const players: WorldPlayer[] = [];
    for (const [id, cells] of grouped) {
      const w = who.get(id);
      players.push({
        id,
        name: w?.name ?? id,
        ...(w?.nation ? { nation: w.nation } : {}),
        ...(w?.banner ? { banner: w.banner } : {}),
        castle: w?.castle ?? null,
        ...(w?.level ? { level: w.level } : {}),
        ...(w?.leyM ? { leyM: w.leyM } : {}),
        cells,
      });
    }

    const payload = { v: WORLD_VERSION, region, generatedAt: now, players };
    shards.set(region, { ...payload, sum: checksum(payload) });
  }
  return shards;
}

