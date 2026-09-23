/**
 * Chronicles — retired kingdoms, shared (BRDC-HALL-003).
 *
 * `retireKingdom` (`@es3/core`) already archives a kingdom locally on the device that
 * retired it; this is the same gesture published, so Infinite's own two kingdoms — and
 * anyone else's — stay visible to everyone rather than trapped on one phone. Split out of
 * `index.ts` for the same reason `clan.ts`/`history.ts` are: a self-contained concern that
 * only needs `Env`'s KV, not the rest of the shared-world state.
 *
 * No rate limit: retiring already wipes the retiring device, which is rare on its own.
 */
import type { KV } from './index.js';

export interface LegacyEntry {
  id: string;
  playerId: string;
  name: string;
  retiredAt: number;
  level: number;
  /** Absent on rows published before this field was kept. */
  xp?: number;
  cells: number;
  areaM2: number;
  population: number;
  provinces: number;
  achievements: number;
  secretSites: number;
  wonders: number;
  cipherShards: number;
  /** A free, player-written label for when this kingdom stood — "Stone Age", or
   *  whatever they choose. Purely flavour, never validated beyond a length cap. */
  era?: string;
}

const LEGACY = 'legacy:';
const MAX_TEXT = 60;

function isLegacyEntry(v: unknown): v is LegacyEntry {
  const e = v as Partial<LegacyEntry> | null;
  return (
    !!e &&
    typeof e.id === 'string' &&
    typeof e.playerId === 'string' &&
    typeof e.name === 'string' &&
    typeof e.retiredAt === 'number' &&
    typeof e.level === 'number' &&
    typeof e.areaM2 === 'number'
  );
}

/** Store one kingdom's chronicle, once — the id it was retired with keeps this
 *  idempotent against a retried publish. `null` for anything that will not parse. */
export async function publishLegacy(kv: KV, raw: unknown): Promise<LegacyEntry | null> {
  if (!isLegacyEntry(raw)) return null;
  const entry: LegacyEntry = {
    id: raw.id,
    playerId: raw.playerId,
    name: raw.name.slice(0, MAX_TEXT),
    retiredAt: raw.retiredAt,
    level: raw.level,
    ...(typeof raw.xp === 'number' ? { xp: raw.xp } : {}),
    cells: raw.cells ?? 0,
    areaM2: raw.areaM2,
    population: raw.population ?? 0,
    provinces: raw.provinces ?? 0,
    achievements: raw.achievements ?? 0,
    secretSites: raw.secretSites ?? 0,
    wonders: raw.wonders ?? 0,
    cipherShards: raw.cipherShards ?? 0,
    ...(typeof raw.era === 'string' && raw.era.trim() ? { era: raw.era.trim().slice(0, MAX_TEXT) } : {}),
  };
  await kv.put(LEGACY + entry.playerId + ':' + entry.id, JSON.stringify(entry));
  return entry;
}

/** Every published kingdom, newest first. Torn rows are skipped, not fatal. */
export async function listLegacy(kv: KV): Promise<LegacyEntry[]> {
  const { keys } = await kv.list({ prefix: LEGACY });
  const out: LegacyEntry[] = [];
  for (const key of keys) {
    const raw = await kv.get(key.name);
    if (!raw) continue;
    try {
      const entry = JSON.parse(raw) as unknown;
      if (isLegacyEntry(entry)) out.push(entry);
    } catch {
      /* a row that will not parse is one kingdom missing, not a broken archive */
    }
  }
  return out.sort((a, b) => b.retiredAt - a.retiredAt);
}
