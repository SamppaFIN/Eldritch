/**
 * The shared season, read from the Worker (BRDC-SEASON-002). `null` before any season has
 * been opened, and on any failure — the game stays playable without it, like the shards.
 */
import type { Season } from '@es3/core';
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
