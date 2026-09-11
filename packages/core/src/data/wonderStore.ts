/**
 * Finding a wonder, and remembering who found it (BRDC-WONDER-001).
 *
 * The province is fate and is computed everywhere alike (`wonderPlace.ts`). The exact hex
 * is not and cannot be: it depends on terrain, and terrain is `'tiles' | 'hash'` depending
 * on what a device has actually seen. So the hex is *registered* by whoever walks it
 * first — which is also the better game. The province is a rumour you can tell a friend;
 * the door is not.
 *
 * Finding is bound to revealing rather than to standing. Revealing is already the game's
 * one deliberate "look closely at this hex" verb, it is free and once per cell, and
 * binding the largest event in the game to an act the player chose beats having it happen
 * to them while their phone is in a pocket.
 */
import { wonderFits } from '../rules/wonder.js';
import type { WonderId } from '../rules/wonder.js';
import { wonderInProvince } from '../rules/wonderPlace.js';
import { WONDER_PROVINCE_RES } from '../rules/wonderPlace.js';
import { terrainForCell } from '../rules/terrain.js';
import { nationProvinces } from './wonderNation.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index } from '../types/domain.js';
import { cellToParent } from 'h3-js';

export interface WonderFind {
  h3: H3Index;
  at: number;
}

export type WonderFinds = Partial<Record<WonderId, WonderFind>>;

export async function readWonderFinds(store: KeyValueStore): Promise<WonderFinds> {
  return (await store.get<WonderFinds>(K.wonderFinds)) ?? {};
}

/**
 * Register this hex as a wonder's seat, if it is one and nobody has claimed it.
 *
 * Returns the id when this call is the finding, and null every other time — wrong
 * province, wrong ground, or somebody already got there. Three conditions, all cheap, and
 * the order is deliberate: province first, because it rejects almost everything.
 */
export async function findWonderAt(
  store: KeyValueStore,
  cell: Cell,
  now: number,
): Promise<WonderId | null> {
  const province = cellToParent(cell.h3, WONDER_PROVINCE_RES);
  const id = wonderInProvince(province, cell.h3, nationProvinces());
  if (!id) return null;

  if (!wonderFits(id, terrainForCell(cell).kind)) return null;

  const finds = await readWonderFinds(store);
  if (finds[id]) return null;

  await store.set<WonderFinds>(K.wonderFinds, { ...finds, [id]: { h3: cell.h3, at: now } });
  // `ref` is a slug the app resolves to a name — the wonder's id, not its hex.
  await writeLogEntry(store, { at: now, kind: 'wonder', ref: id });
  return id;
}
