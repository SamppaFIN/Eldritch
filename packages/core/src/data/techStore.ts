/**
 * The researched-technology list, in the store (BRDC-TECH-001).
 *
 * The tree and the spend rule are pure (`rules/tech.js`); `researchWith` moves the wisdom
 * (`pouch.js`, beside `wardWith`). This is the thin seam that owns the list itself and the
 * era boundary — split out so MockRepository does not grow a fourth verb inline.
 */
import { eraChanged } from '../rules/tech.js';
import type { TechId, TechResult } from '../rules/tech.js';
import { researchWith } from './pouch.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell } from '../types/domain.js';

export async function readResearched(store: KeyValueStore): Promise<TechId[]> {
  return (await store.get<TechId[]>(K.researched)) ?? [];
}

/**
 * Research one technology and persist it. `era` is set only when this research completed
 * the previous era — the moment the caller marks with a ceremony.
 */
export async function researchTech(
  store: KeyValueStore,
  id: TechId,
  owned: readonly Cell[],
  now: number,
): Promise<TechResult> {
  const before = await readResearched(store);
  const result = await researchWith(store, before, id, owned, now);
  if (!result.ok) return result;

  await store.set(K.researched, result.researched);
  return { ok: true, researched: result.researched, era: eraChanged(before, result.researched) };
}
