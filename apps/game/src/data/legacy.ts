/**
 * Chronicles — retired kingdoms, shared (BRDC-HALL-003).
 *
 * `retireKingdom` already archives locally; this is the same entry, best-effort POSTed to
 * the Worker so it does not stay trapped on the device that retired it. Every failure here
 * is swallowed the same way `publishSubmission` swallows the shared world's — the local
 * archive (`HallOfFamePanel`) is always the source of truth, this is only a shop window.
 */
import type { HallOfFameEntry } from '@es3/core';
import { WORLD_API } from './worldSource.js';

/** A shared row. `xp` is optional: the Worker did not keep it at first, and a row it
 *  holds from then still has to render (the Chronicles tab threw on exactly that). */
export interface LegacyEntry extends Omit<HallOfFameEntry, 'xp'> {
  playerId: string;
  xp?: number;
}

/** `true` only once the Worker actually accepted it — `HallOfFamePanel`'s "Share" button
 *  reads this so it never claims a kingdom joined the Chronicles when it did not. */
export async function publishLegacy(playerId: string, entry: HallOfFameEntry): Promise<boolean> {
  try {
    const res = await fetch(`${WORLD_API}/legacy`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...entry, playerId }),
    });
    return res.ok;
  } catch {
    return false; // offline or blocked — the kingdom is still safe in the local Hall of Fame
  }
}

/** Every published kingdom, newest first. `null` only when the Worker could not be
 *  reached at all — an empty list is a real, distinct answer (nobody has retired yet). */
export async function fetchLegacy(): Promise<LegacyEntry[] | null> {
  try {
    const res = await fetch(`${WORLD_API}/legacy`, { cache: 'no-store' });
    if (res.status === 204) return [];
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as { entries?: LegacyEntry[] } | null;
    return Array.isArray(data?.entries) ? data.entries : [];
  } catch {
    return null;
  }
}
