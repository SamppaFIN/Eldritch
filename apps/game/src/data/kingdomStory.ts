/**
 * Asking the Worker for a retired kingdom's chronicle (BRDC-HALL-002).
 *
 * The reward for retiring is a short AI-written story about the kingdom you once had. The
 * key that writes it lives only on the Worker (`apps/worker`); the client never holds one.
 * Every failure here is swallowed — the caller always has `fallbackChronicle` from
 * `@es3/core` to fall back to, so a story is never missing, only ever less than AI-written.
 */
import type { HallOfFameEntry } from '@es3/core';
import { WORLD_API } from './worldSource.js';

export async function fetchKingdomStory(entry: HallOfFameEntry): Promise<string | null> {
  try {
    const res = await fetch(`${WORLD_API}/kingdom-story`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: entry.name,
        level: entry.level,
        areaM2: entry.areaM2,
        population: entry.population,
        provinces: entry.provinces,
        achievements: entry.achievements,
        wonders: entry.wonders,
        secretSites: entry.secretSites,
        cipherShards: entry.cipherShards,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { story?: string };
    return data.story ?? null;
  } catch {
    return null;
  }
}
