/**
 * Closing a season on the Worker (BRDC-SEASON-004, SEASON-007).
 *
 * Infinite 2026-09-29: *"cloudflaressa olevat vanhat kingdomit, surreal kingdom, sampan
 * majamaa jne.. arkistoidaan kanssa"* — every realm the Worker still holds goes into the
 * Chronicles as a retired kingdom, whether or not its player ever opens the game again.
 * The Fortresses standing at the close are kept as the next season's ruins. With `wipe`
 * the player files and shards are then cleared, and the new season starts on an empty map.
 *
 * Idempotent: a kingdom's Chronicle key is its player and the era, so a second run
 * rewrites the same rows rather than adding more; the ruins list is overwritten whole.
 */
import { cellAreaM2 } from '@es3/core/geo';
import type { PlayerFile } from '@es3/core/data';
import type { KV } from './index.js';

const PLAYER = 'player:';
const SHARD = 'shard:';
const LEGACY = 'legacy:';
export const RUINS = 'season:ruins';

export interface ArchiveResult {
  archived: string[];
  ruins: number;
  wiped: boolean;
}

export async function archiveSeason(kv: KV, now: number, era: string, wipe: boolean): Promise<ArchiveResult> {
  const { keys } = await kv.list({ prefix: PLAYER });
  const archived: string[] = [];
  const ruins = new Set<string>();
  const slug = era.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'season';

  // A realm its player already retired by hand since they last published is in the
  // Chronicles once already — archiving it again made every such kingdom appear twice.
  const retired = new Map<string, number>();
  for (const { name } of (await kv.list({ prefix: LEGACY })).keys) {
    const row = JSON.parse((await kv.get(name)) ?? 'null') as { id?: string; playerId?: string; retiredAt?: number } | null;
    if (row?.playerId && row.id && !row.id.startsWith('archive-')) {
      retired.set(row.playerId, Math.max(retired.get(row.playerId) ?? 0, row.retiredAt ?? 0));
    }
  }

  for (const { name } of keys) {
    const raw = await kv.get(name);
    if (!raw) continue;
    const file = JSON.parse(raw) as PlayerFile;
    const s = file.source;
    if ((retired.get(s.id) ?? -1) >= (file.submittedAt ?? Infinity)) continue;
    const cells = s.cells ?? [];
    for (const c of cells) if (c.b?.includes('fortress')) ruins.add(c.h3);
    const entry = {
      id: `archive-${slug}`,
      playerId: s.id,
      name: (s.nation ?? s.name ?? 'A nameless realm').slice(0, 60),
      retiredAt: file.submittedAt ?? now,
      level: s.level ?? 1,
      cells: cells.length,
      areaM2: Math.round(cells.reduce((sum, c) => sum + cellAreaM2(c.h3), 0)),
      population: 0,
      provinces: 0,
      achievements: 0,
      secretSites: 0,
      wonders: 0,
      cipherShards: 0,
      era: era.slice(0, 60),
    };
    await kv.put(`${LEGACY}${s.id}:${entry.id}`, JSON.stringify(entry));
    archived.push(entry.name);
  }

  await kv.put(RUINS, JSON.stringify({ era, at: now, cells: [...ruins].sort() }));

  if (wipe) {
    for (const { name } of keys) await kv.delete(name);
    const shards = await kv.list({ prefix: SHARD });
    for (const { name } of shards.keys) await kv.delete(name);
  }
  return { archived, ruins: ruins.size, wiped: wipe };
}

/**
 * Take archived rows back out of the Chronicles (BRDC-SEASON-004): every row of one
 * archive run (`id`, e.g. `archive-season-2-deep-awakens`), and/or every archived row
 * under one of `names`. Only rows an archive run wrote (`archive-*`) are touched; a
 * kingdom a player retired by hand is never removed here.
 */
export async function forgetArchived(
  kv: KV,
  id: string | null,
  names: readonly string[],
  rows: readonly string[] = [],
): Promise<string[]> {
  const { keys } = await kv.list({ prefix: LEGACY });
  const removed: string[] = [];
  for (const { name } of keys) {
    const raw = await kv.get(name);
    if (!raw) continue;
    const e = JSON.parse(raw) as { id?: string; name?: string; playerId?: string };
    // `rows` names exact rows (`<playerId>:<id>`), of any kind — the one way to take out a
    // row a player retired by hand, and only when asked for by name.
    const exact = rows.includes(`${e.playerId}:${e.id}`);
    if (!exact && !e.id?.startsWith('archive-')) continue;
    if (exact || e.id === id || (e.name !== undefined && names.includes(e.name))) {
      await kv.delete(name);
      removed.push(`${e.name} (${e.id})`);
    }
  }
  return removed;
}
