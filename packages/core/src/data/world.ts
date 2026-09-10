/**
 * The shared world, one region at a time.
 *
 * `world/<res6>` is how Phases 0–2 fake a server: a Cloudflare Worker over KV
 * (`apps/worker`, BRDC-SHARE-003) merges players' submitted territory into one shard per
 * res-6 region, and every client reads the shards for whatever it is looking at. It is read
 * state, never truth — it says what other people *claim* to hold. Disputes are settled by
 * the Wager, not by the file (the same compromise `PIVOT-2026-08-27.md` §5 made for
 * combat).
 *
 * Pure, like `challenge.ts`, and it shares that module's `checksum` — a torn-file
 * detector, not a signature. A client cannot be stopped from lying about its own
 * strength, and pretending otherwise would be worse than saying so; Phase 3's server is
 * where authority lives.
 *
 * Published locations are Keeps (`getCastle`). Since the BRDC-CASTLE-001 reversal the Keep
 * is the Hearth cell — the game is among friends, and this file carries the real home.
 */
import { MAX_SHARD_CELLS, WORLD_VERSION } from '../rules/constants.js';
import { checksum, toWireCell } from './challenge.js';
import type { WireCell } from './challenge.js';
import type { Cell, H3Index, PlayerId } from '../types/domain.js';

export interface WorldPlayer {
  id: PlayerId;
  name: string;
  /** Their nation's name and flag (BRDC-NATION-001, BRDC-WAGER-JSON-004), if set. */
  nation?: string;
  banner?: string;
  /** Their Keep — the Hearth cell, published (BRDC-CASTLE-001 reversal). */
  castle: H3Index | null;
  cells: WireCell[];
  /** Consciousness level and metres of distinct ground walked (BRDC-CODEX-001).
   *  Additive — an older submission carries neither, and the Codex reads them as unknown
   *  rather than as zero. */
  level?: number;
  leyM?: number;
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
  /** Nation name and flag, threaded in from `es3:nation` at the app boundary. */
  nation?: string;
  banner?: string;
  castle: H3Index | null;
  /**
   * h3, strength, and — when known — terrain and the border building. A full `Cell` is
   * accepted (it satisfies `WireCell`); `toWireCell` trims one that carries terrain.
   */
  cells: readonly WireCell[];
  /** What the Codex ranks that the cells cannot answer (BRDC-CODEX-001). Both additive. */
  level?: number;
  leyM?: number;
}

/**
 * One player's own territory, signed, on its way *into* the world.
 *
 * The write path: the client seals this and the player carries it to the cron job as a
 * GitHub issue body. The checksum is the same torn-message detector `challenge.ts` uses —
 * the merge job still cannot trust the numbers, only that the message arrived whole.
 */
export interface WorldSubmission {
  v: number;
  id: PlayerId;
  name: string;
  nation?: string;
  banner?: string;
  castle: H3Index | null;
  cells: WireCell[];
  level?: number;
  leyM?: number;
  sum: string;
}

/** h3, strength, and terrain/building/days when the source carried them. */
export function trimWire(c: WireCell): WireCell {
  const w: WireCell = { h3: c.h3, strength: Math.round(c.strength) };
  if (c.t) w.t = c.t;
  if (c.b) w.b = c.b;
  if (c.d) w.d = c.d;
  return w;
}

export function buildSubmission(source: WorldSource): WorldSubmission {
  const payload = {
    v: WORLD_VERSION,
    id: source.id,
    name: source.name,
    ...(source.nation ? { nation: source.nation } : {}),
    ...(source.banner ? { banner: source.banner } : {}),
    castle: source.castle,
    ...(source.level ? { level: source.level } : {}),
    ...(source.leyM ? { leyM: Math.round(source.leyM) } : {}),
    cells: [...source.cells]
      .sort((a, b) => b.strength - a.strength)
      .slice(0, MAX_SHARD_CELLS)
      .map(trimWire),
  };
  return { ...payload, sum: checksum(payload) };
}

export function encodeSubmission(submission: WorldSubmission): string {
  return JSON.stringify(submission);
}

export type SubmissionParse =
  | { ok: true; source: WorldSource }
  | { ok: false; fault: WorldFault };

/** Read one player's submission. Same refusals as `parseWorld`, same reasons. */
export function parseSubmission(text: string): SubmissionParse {
  let raw: unknown;
  try {
    raw = JSON.parse(text.trim());
  } catch {
    return { ok: false, fault: 'not-json' };
  }

  if (typeof raw !== 'object' || raw === null) return { ok: false, fault: 'not-a-shard' };
  const s = raw as Partial<WorldSubmission>;

  if (
    typeof s.v !== 'number' ||
    typeof s.id !== 'string' ||
    typeof s.name !== 'string' ||
    !Array.isArray(s.cells) ||
    typeof s.sum !== 'string'
  ) {
    return { ok: false, fault: 'not-a-shard' };
  }
  if (s.v !== WORLD_VERSION) return { ok: false, fault: 'wrong-version' };
  if (s.cells.length > MAX_SHARD_CELLS) return { ok: false, fault: 'too-large' };

  const { sum, ...payload } = s as WorldSubmission;
  if (sum !== checksum(payload)) return { ok: false, fault: 'damaged' };

  return {
    ok: true,
    source: {
      id: s.id,
      name: s.name,
      ...(s.nation ? { nation: s.nation } : {}),
      ...(s.banner ? { banner: s.banner } : {}),
      castle: s.castle ?? null,
      ...(typeof s.level === 'number' ? { level: s.level } : {}),
      ...(typeof s.leyM === 'number' ? { leyM: s.leyM } : {}),
      cells: s.cells,
    },
  };
}

/**
 * One player's ground on disk, between rebuilds (BRDC-SHARE-002).
 *
 * The cron job keeps the latest of these per player under `world/players/<id>.json` and
 * merges all the un-stale ones on every rebuild, so a player who does not re-publish for
 * a while still holds their ground on other maps — until `WORLD_PLAYER_TTL_MS` passes.
 * Trusted repo content (the *submission* was checksum-checked on the way in), so the read
 * is a light structural one, not a signature.
 */
export interface WorldIdentity {
  nation?: string;
  banner?: string;
}

/** Assemble the local player's own ground for publishing. Mirrors `exportChallengeFrom`. */
export function worldSourceFrom(
  me: { id: PlayerId; name: string; level?: number },
  owned: readonly Cell[],
  castle: H3Index | null,
  identity: WorldIdentity = {},
  /** Metres of distinct ground walked, for the Codex (BRDC-CODEX-001). */
  leyM = 0,
): WorldSource {
  return {
    id: me.id,
    name: me.name,
    ...(identity.nation ? { nation: identity.nation } : {}),
    ...(identity.banner ? { banner: identity.banner } : {}),
    castle,
    ...(me.level ? { level: me.level } : {}),
    ...(leyM > 0 ? { leyM: Math.round(leyM) } : {}),
    cells: owned.map(toWireCell),
  };
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
    const from = { name: player.nation ?? player.name, seenAt: shard.generatedAt } as {
      name: string;
      banner?: string;
      seenAt: number;
    };
    if (player.banner) from.banner = player.banner;
    for (const c of player.cells) {
      cells.push({
        h3: c.h3,
        ownerId: player.id,
        strength: c.strength,
        lastVisitedAt: now,
        visitDays: [],
        imported: true,
        importedFrom: from,
        ...(c.t ? { terrain: { kind: c.t, source: 'hash' as const } } : {}),
        ...(c.b?.length ? { buildings: c.b.map((id) => ({ id, builtAt: now })) } : {}),
      });
    }
  }
  return cells;
}

/** How stale a shard is, for the "other realms last stirred N h ago" readout. */
export function worldAgeMs(shard: WorldShard, now: number): number {
  return Math.max(0, now - shard.generatedAt);
}
