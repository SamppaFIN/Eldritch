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
