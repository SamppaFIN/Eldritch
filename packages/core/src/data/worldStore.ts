/**
 * The shared world, both directions, where it touches the store.
 *
 * The format lives in world.ts, which is pure. This is the half that reads the repository —
 * split out when MockRepository reached its four hundred lines, the same seam as pouch.ts,
 * wager.ts and cellStore.ts. Moving other players' ground in (`mergeWorld`), and sealing
 * the local player's own for publishing (`exportWorldSource`).
 */
import { parseWorld, worldSourceFrom, worldToCells } from './world.js';
import type { WorldIdentity, WorldImportResult, WorldSource } from './world.js';
import { leyLineM } from '../geo/paths.js';
import { readPaths } from './pathStore.js';
import { muster } from './wagerRepo.js';
import type { MusterDeps } from './wagerRepo.js';
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

/**
 * The local player's own ground, sealed for publishing (BRDC-SHARE-002).
 *
 * Same `muster` the Wager gathers — who you are, the ground still standing, the Keep —
 * turned into a `WorldSource` the client POSTs to the Worker.
 *
 * The ley-line goes with it (BRDC-CODEX-001). It is measured here rather than stored as a
 * running total because the walked-path map is the only honest source: it holds one entry
 * per distinct stretch, so a hundred laps of one block measure one block. A counter would
 * have to decide what to do about that, and it would get it wrong.
 */
export async function exportWorldSource(
  deps: MusterDeps,
  identity: WorldIdentity,
  now: number,
  store: KeyValueStore,
): Promise<WorldSource> {
  const m = await muster(deps, now);
  return worldSourceFrom(m.me, m.owned, m.castle, identity, leyLineM(await readPaths(store)));
}
