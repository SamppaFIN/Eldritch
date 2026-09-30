/**
 * Researching a node on a building, in the store (BRDC-WORKS-002). Settle → ask → write,
 * the order `wardWith` and `growHearthAt` take: the trickle owed up to now is banked
 * before it is spent, and nothing is written on a refusal.
 */
import { MAX_STRENGTH } from '../rules/constants.js';
import { WORKS_DEFS } from '../rules/works/defs/index.js';
import { researchNode, revealsAround, tierNumberOf, worksLevel } from '../rules/works/tree.js';
import { towerSight } from './towerSight.js';
import { ageOf } from '../rules/lore.js';
import { readLore } from './loreStore.js';
import type { WorksRefusal } from '../rules/works/tree.js';
import type { WorksKind } from '../rules/works/types.js';
import type { Cell, H3Index } from '../types/domain.js';
import { settlePouch, writePouch } from './pouch.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import { readTrees, worksContext } from './worksTrees.js';

export interface WorksView {
  kind: WorksKind;
  learned: string[];
  level: number;
}

export type WorksResearchOutcome =
  | { ok: true; view: WorksView; cell: Cell }
  | { ok: false; refused: WorksRefusal | 'no-work' };

/** What stands on `cell` as a page, and what it has learned — or null for bare ground. */
export async function worksViewAt(store: KeyValueStore, cell: Cell): Promise<WorksView | null> {
  const { trees, kindAt } = await worksContext(store);
  const kind = kindAt(cell);
  if (!kind) return null;
  const learned = [...(trees[cell.h3] ?? [])];
  return { kind, learned, level: worksLevel(WORKS_DEFS[kind], learned) };
}

export async function researchWorkAt(
  store: KeyValueStore,
  h3: H3Index,
  nodeId: string,
  owned: readonly Cell[],
  now: number,
): Promise<WorksResearchOutcome> {
  const cell = owned.find((c) => c.h3 === h3);
  if (!cell) return { ok: false, refused: 'not-yours' };
  const { kindAt } = await worksContext(store);
  const kind = kindAt(cell);
  if (!kind) return { ok: false, refused: 'no-work' };

  const def = WORKS_DEFS[kind];
  const trees = await readTrees(store);
  const state = await settlePouch(store, owned, now);
  // Season 2 (PROG-005, LAW II): in Age N a building learns tiers I–N and no further.
  if (state.keep && tierNumberOf(def, nodeId) > ageOf(await readLore(store))) return { ok: false, refused: 'age' };
  const result = researchNode(def, trees[h3] ?? [], nodeId, state.pool, true);
  if (!result.ok) return result;

  await writePouch(store, result.pool, now);
  trees[h3] = result.learned;
  await store.set(K.worksTree, trees);

  // The one effect that happens once, at the moment of learning: strength on this cell.
  let next = cell;
  const boost = result.node.effects.reduce(
    (s, e) => s + (e.kind === 'cellStrength' && e.scope === 'cell' ? e.amount : 0),
    0,
  );
  if (boost > 0) {
    next = { ...cell, strength: Math.min(MAX_STRENGTH, cell.strength + boost) };
    await store.set(K.cell(h3), next);
  }
  // A Watchtower's tree widens its sight, and what it sees stays seen (2026-09-30).
  if (revealsAround(def) && result.node.effects.some((e) => e.kind === 'reach' || e.kind === 'reveal')) {
    await towerSight(store, h3, now);
  }
  return { ok: true, view: { kind, learned: result.learned, level: worksLevel(def, result.learned) }, cell: next };
}

/** The repository's door to building pages (BRDC-WORKS-002). */
export interface WorksApi {
  /** Which page a hex is and what it has learned — `null` on bare ground. A rival's
   *  research is not shared yet, so their page reads as nothing learned. */
  viewAt(h3: H3Index, now: number): Promise<WorksView | null>;
  research(h3: H3Index, nodeId: string, now: number): Promise<WorksResearchOutcome>;
}

export function worksApi(
  store: () => KeyValueStore,
  me: () => Promise<string>,
  owned: (now: number) => Promise<readonly Cell[]>,
): WorksApi {
  return {
    viewAt: async (h3) => {
      const cell = await store().get<Cell>(K.cell(h3));
      if (!cell) return null;
      const view = await worksViewAt(store(), cell);
      if (!view || cell.ownerId === (await me())) return view;
      return { ...view, learned: [], level: 0 };
    },
    research: async (h3, nodeId, now) => researchWorkAt(store(), h3, nodeId, await owned(now), now),
  };
}
