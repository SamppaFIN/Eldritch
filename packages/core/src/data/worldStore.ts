/**
 * Merging a shared-world shard into the store.
 *
 * The format lives in world.ts, which is pure. This is the half that touches the store —
 * split out when MockRepository reached its four hundred lines, the same seam as
 * pouch.ts, wager.ts and cellStore.ts. Everything here is about moving other players'
 * ground in, and nothing else.
 */
import { parseWorld, worldToCells } from './world.js';
import type { WorldImportResult } from './world.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, PlayerId } from '../types/domain.js';

/**
 * Import one `world/<res6>.json` shard as read-only rival cells.
 *
 * Never overwrites a cell the local player owns — a file cannot take ground, a
 * disagreement is settled by the Wager. Never fights. A bad shard is a named fault and
 * the map is untouched. Safe to call again with the same or a fresher shard.
 */
export async function mergeWorld(
  store: KeyValueStore,
  text: string,
  meId: PlayerId,
  now: number,
): Promise<WorldImportResult> {
  const parsed = parseWorld(text);
  if (!parsed.ok) return parsed;

  let written = 0;
  for (const cell of worldToCells(parsed.shard, meId, now)) {
    const existing = await store.get<Cell>(K.cell(cell.h3));
    if (existing?.ownerId === meId) continue;
    await store.set(K.cell(cell.h3), cell);
    written += 1;
  }

  return {
    ok: true,
    region: parsed.shard.region,
    players: parsed.shard.players.filter((p) => p.id !== meId).length,
    cells: written,
    generatedAt: parsed.shard.generatedAt,
  };
}
