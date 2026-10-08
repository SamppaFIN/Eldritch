/**
 * Envoys on the shared world (BRDC-SUZERAIN-001): post this realm's, read everyone's.
 * Best-effort, like every Worker call here — off-line, a village is decided alone.
 */
import type { CityStateId, EnvoyRow } from '@es3/core';
import { WORLD_API } from './worldSource.js';

export async function postEnvoys(playerId: string, name: string, envoys: Partial<Record<CityStateId, number>>): Promise<boolean> {
  try {
    const res = await fetch(`${WORLD_API}/envoys`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ playerId, name, envoys }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Every realm's envoys; null off-line. */
export async function fetchEnvoys(): Promise<EnvoyRow[] | null> {
  try {
    const res = await fetch(`${WORLD_API}/envoys`, { cache: 'no-store' });
    if (res.status !== 200) return null;
    return ((await res.json().catch(() => null)) as { rows?: EnvoyRow[] } | null)?.rows ?? null;
  } catch {
    return null;
  }
}
