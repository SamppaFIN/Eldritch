/**
 * The shared season, read from the Worker (BRDC-SEASON-002). `null` before any season has
 * been opened, and on any failure — the game stays playable without it, like the shards.
 */
import type { BoardRow, Season, Title } from '@es3/core';
import { WORLD_API } from './worldSource.js';

export async function fetchSeason(): Promise<Season | null> {
  try {
    const res = await fetch(`${WORLD_API}/season`, { cache: 'no-store' });
    if (res.status !== 200) return null;
    const data = (await res.json().catch(() => null)) as Season | null;
    return data && typeof data.n === 'number' && typeof data.phase === 'string' ? data : null;
  } catch {
    return null;
  }
}

/**
 * Tell the Worker a gate moved the shared Doom (BRDC-DOOM-002). Returns `gateId:delta` for
 * each move it accepted, so the outbox can be cleared of exactly those; any failure keeps them queued.
 */
export async function postDoom(moves: readonly { gateId: string; delta: 1 | -1 }[]): Promise<string[]> {
  const done: string[] = [];
  for (const m of moves) {
    try {
      const res = await fetch(`${WORLD_API}/season/doom`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(m),
      });
      if (res.ok) done.push(`${m.gateId}:${m.delta}`);
    } catch {
      break;
    }
  }
  return done;
}

let once: Promise<Season | null> | null = null;
/** The season, fetched once a session — for reads made on every hex tap (rumours). */
export function seasonOnce(): Promise<Season | null> {
  once ??= fetchSeason();
  return once;
}

export interface Reckoning {
  bossHp: number;
  bossMaxHp: number;
  phase: string;
  standings: { realm: string; damage: number }[];
}

/** The Ancient One's strength and every realm's damage (BRDC-DOOM-004); null off-line. */
export async function fetchReckoning(): Promise<Reckoning | null> {
  try {
    const res = await fetch(`${WORLD_API}/season/reckoning`, { cache: 'no-store' });
    return res.status === 200 ? ((await res.json().catch(() => null)) as Reckoning | null) : null;
  } catch {
    return null;
  }
}

/** Land a blow. `true` only when the Worker took it. */
export async function postStrike(realm: string, damage: number): Promise<boolean> {
  try {
    const res = await fetch(`${WORLD_API}/season/strike`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ realm, damage }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface Boards {
  n: number;
  board: BoardRow[];
  records: Title[];
}

/** Publish this realm's Legacy (BRDC-SEASON-005); the Worker takes one an hour. */
export async function postLegacy(row: BoardRow): Promise<boolean> {
  try {
    const res = await fetch(`${WORLD_API}/season/legacy`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(row),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** A season's Legacy board and Hall of Records; null off-line. */
export async function fetchBoards(n: number): Promise<Boards | null> {
  try {
    const res = await fetch(`${WORLD_API}/season/boards?n=${n}`, { cache: 'no-store' });
    return res.status === 200 ? ((await res.json().catch(() => null)) as Boards | null) : null;
  } catch {
    return null;
  }
}

/** The Hall of Ages; null off-line. */
export async function fetchAges(): Promise<{ realm: string; name: string; score: number }[] | null> {
  try {
    const res = await fetch(`${WORLD_API}/season/ages`, { cache: 'no-store' });
    return res.status === 200 ? (((await res.json().catch(() => null)) as { ages?: [] } | null)?.ages ?? null) : null;
  } catch {
    return null;
  }
}

let ruins: Promise<string[]> | null = null;
/** The last season's Fortresses — this season's ruins (BRDC-SEASON-007) — once a session. */
export function ruinsOnce(): Promise<string[]> {
  ruins ??= (async () => {
    try {
      const res = await fetch(`${WORLD_API}/season/ruins`, { cache: 'no-store' });
      if (res.status !== 200) return [];
      const data = (await res.json().catch(() => null)) as { cells?: unknown } | null;
      return Array.isArray(data?.cells) ? (data.cells as string[]) : [];
    } catch {
      return [];
    }
  })();
  return ruins;
}
