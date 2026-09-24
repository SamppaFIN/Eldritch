/**
 * Reading the research trees, and which page a cell is (BRDC-WORKS-002). Kept apart from
 * `worksStore.ts` so the pouch can read what research pays without importing the verb
 * that spends from it.
 */
import { placesWithHome } from '../rules/dwell.js';
import type { DwellMap } from '../rules/dwell.js';
import { WORKS_DEFS } from '../rules/works/defs/index.js';
import type { KindAt, WorksTrees } from '../rules/works/bonus.js';
import type { WorksKind } from '../rules/works/types.js';
import type { Cell, H3Index } from '../types/domain.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';

export async function readTrees(store: KeyValueStore): Promise<Record<H3Index, string[]>> {
  return (await store.get<Record<H3Index, string[]>>(K.worksTree)) ?? {};
}

/** A building came down: what it had learned goes with it. */
export async function forgetTree(store: KeyValueStore, h3: H3Index): Promise<void> {
  const trees = await readTrees(store);
  if (!(h3 in trees)) return;
  delete trees[h3];
  await store.set(K.worksTree, trees);
}

/** The Hearth is the Keep, a named temple is a Temple, otherwise the Work that stands there. */
export function kindAtWith(home: H3Index | null, temples: ReadonlySet<H3Index>): KindAt {
  return (cell: Cell): WorksKind | null => {
    if (home && cell.h3 === home) return 'keep';
    if (temples.has(cell.h3)) return 'temple';
    for (const w of cell.buildings ?? []) if (w.id in WORKS_DEFS) return w.id as WorksKind;
    return null;
  };
}

export async function worksContext(store: KeyValueStore): Promise<{ trees: WorksTrees; kindAt: KindAt }> {
  const trees = await readTrees(store);
  const home = (await store.get<H3Index>(K.home)) ?? null;
  const dwell = (await store.get<DwellMap>(K.dwell)) ?? {};
  const temples = new Set(
    placesWithHome(dwell, home)
      .filter((p) => p.kind === 'temple')
      .map((p) => p.h3),
  );
  return { trees, kindAt: kindAtWith(home, temples) };
}
