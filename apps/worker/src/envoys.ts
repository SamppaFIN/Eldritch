/**
 * Envoys to the villages, shared (BRDC-SUZERAIN-001).
 *
 * Each realm posts how many envoys it has sent each village; everyone reads them all and
 * decides the suzerain on their own phone (`suzerainOf` in `@es3/core`). The same trust
 * as `/legacy`: no account, one row per player id, the latest post wins. A row is kept
 * for the season's length and no longer, so a realm that stopped playing stops counting.
 */
import type { KV } from './index.js';

export interface EnvoyRow {
  playerId: string;
  name?: string;
  envoys: Record<string, number>;
  at: number;
}

const ENVOYS = 'envoys:';
const MAX_TEXT = 60;
/** A row older than this is a realm that has stopped walking. */
const ENVOY_TTL_S = 60 * 24 * 3600;

export async function publishEnvoys(kv: KV, raw: unknown, now: number): Promise<EnvoyRow | null> {
  const r = raw as Partial<EnvoyRow> | null;
  if (!r || typeof r.playerId !== 'string' || !r.playerId || typeof r.envoys !== 'object' || r.envoys === null) return null;
  const envoys: Record<string, number> = {};
  for (const [city, n] of Object.entries(r.envoys)) {
    if (typeof n === 'number' && Number.isFinite(n) && n >= 0) envoys[city.slice(0, MAX_TEXT)] = Math.min(99, Math.floor(n));
  }
  const row: EnvoyRow = { playerId: r.playerId.slice(0, MAX_TEXT), ...(typeof r.name === 'string' ? { name: r.name.slice(0, MAX_TEXT) } : {}), envoys, at: now };
  await kv.put(ENVOYS + row.playerId, JSON.stringify(row), { expirationTtl: ENVOY_TTL_S });
  return row;
}

export async function listEnvoys(kv: KV): Promise<EnvoyRow[]> {
  const { keys } = await kv.list({ prefix: ENVOYS });
  const out: EnvoyRow[] = [];
  for (const key of keys) {
    const raw = await kv.get(key.name);
    if (!raw) continue;
    try {
      out.push(JSON.parse(raw) as EnvoyRow);
    } catch {
      /* one torn row is one realm missing, not a broken list */
    }
  }
  return out;
}
