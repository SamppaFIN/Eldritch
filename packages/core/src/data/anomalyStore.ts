/**
 * Dealing with an anomaly, in the store (BRDC-EVENT-001).
 *
 * The rules are pure (`rules/anomaly.js`, `rules/chain.js`); this is the seam that
 * touches the pouch and the cell, beside `templeStore.js` and `spellStore.js`. Settle,
 * ask the rule, write and log on success. XP deltas are returned for the repository to
 * apply — the seam does not reach the profile.
 */
import {
  anomalyAt,
  beginInvestigation,
  investigationProgress,
  isResolved,
  resolveReward,
} from '../rules/anomaly.js';
import { applyChoice } from '../rules/chain.js';
import type { AnomalyKind, ChoiceRefusal, InvestigateRefusal } from '../rules/index.js';
import type { ResourceKind, ResourcePool } from '../rules/terrain.js';
import { settlePouch, writePouch } from './pouch.js';
import { chainForCell } from './chainStore.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index, PlayerId } from '../types/domain.js';

export interface Anomaly {
  h3: H3Index;
  kind: AnomalyKind;
  /** untouched · clock running · investigation finished, not yet looked at · in a story */
  state: 'dormant' | 'investigating' | 'ready' | 'chain';
  /** 0..1 while investigating. */
  progress: number;
  /** The current stage of an event chain, when `state` is `'chain'`. */
  stage?: { text: string; choices: readonly { text: string }[] };
}

/**
 * The anomalies on ground the player holds, as the map and the panel need them. A
 * finished anomaly is not listed — it is spent, and the log remembers what it gave.
 */
export function describeAnomalies(owned: readonly Cell[], now: number): Anomaly[] {
  const out: Anomaly[] = [];
  for (const cell of owned) {
    const kind = anomalyAt(cell.h3);
    if (kind === null || cell.anomaly?.done) continue;

    const a = cell.anomaly;
    if (!a) {
      out.push({ h3: cell.h3, kind, state: 'dormant', progress: 0 });
    } else if (a.stage !== undefined) {
      const s = chainForCell(cell.h3).stages[a.stage];
      out.push({
        h3: cell.h3,
        kind,
        state: 'chain',
        progress: 1,
        ...(s ? { stage: { text: s.text, choices: s.choices.map((c) => ({ text: c.text })) } } : {}),
      });
    } else if (isResolved(cell, now)) {
      out.push({ h3: cell.h3, kind, state: 'ready', progress: 1 });
    } else {
      out.push({ h3: cell.h3, kind, state: 'investigating', progress: investigationProgress(cell, now) });
    }
  }
  return out;
}

export type InvestigateOutcome =
  | { ok: true }
  | { ok: false; refused: InvestigateRefusal | 'not-yours' };

export type ResolveOutcome =
  | { ok: true; reward: { pool: Partial<ResourcePool>; xp: number } | null; chainOpened: boolean; xp: number }
  | { ok: false; refused: 'not-yours' | 'nothing-here' | 'not-ready' };

export type ChoiceOutcome =
  | { ok: true; next: number | 'end'; xp: number }
  | { ok: false; refused: ChoiceRefusal | 'not-yours' | 'not-in-chain' };

async function ownedCell(store: KeyValueStore, h3: string, me: PlayerId): Promise<Cell | null> {
  const cell = await store.get<Cell>(K.cell(h3));
  return cell && cell.ownerId === me ? cell : null;
}

export async function investigateAt(
  store: KeyValueStore,
  h3: string,
  me: PlayerId,
  owned: readonly Cell[],
  now: number,
): Promise<InvestigateOutcome> {
  const cell = await ownedCell(store, h3, me);
  if (!cell) return { ok: false, refused: 'not-yours' };

  const state = await settlePouch(store, owned, now);
  const result = beginInvestigation(cell, state.pool, now);
  if (!result.ok) return result;

  await writePouch(store, result.pool, now);
  await store.set(K.cell(h3), result.cell);
  await writeLogEntry(store, { at: now, kind: 'anomaly', ref: 'begin' });
  return { ok: true };
}

export async function resolveAt(
  store: KeyValueStore,
  h3: string,
  me: PlayerId,
  owned: readonly Cell[],
  now: number,
): Promise<ResolveOutcome> {
  const cell = await ownedCell(store, h3, me);
  if (!cell) return { ok: false, refused: 'not-yours' };
  if (!cell.anomaly || cell.anomaly.done || cell.anomaly.stage !== undefined) {
    return { ok: false, refused: 'nothing-here' };
  }
  if (!isResolved(cell, now)) return { ok: false, refused: 'not-ready' };

  // A chain anomaly opens its story instead of paying out; a reward one pays and closes.
  if (anomalyAt(h3) === 'chain') {
    await store.set(K.cell(h3), { ...cell, anomaly: { ...cell.anomaly, stage: 0 } });
    await writeLogEntry(store, { at: now, kind: 'anomaly', ref: 'resolve' });
    return { ok: true, reward: null, chainOpened: true, xp: 0 };
  }

  const reward = resolveReward(h3);
  const state = await settlePouch(store, owned, now);
  const pool = { ...state.pool };
  for (const [k, v] of Object.entries(reward.pool) as [ResourceKind, number][]) pool[k] += v;
  await writePouch(store, pool, now);
  await store.set(K.cell(h3), { ...cell, anomaly: { startedAt: cell.anomaly.startedAt, done: true } });
  await writeLogEntry(store, { at: now, kind: 'anomaly', ref: 'resolve' });
  return { ok: true, reward, chainOpened: false, xp: reward.xp };
}

export async function chooseAt(
  store: KeyValueStore,
  h3: string,
  me: PlayerId,
  owned: readonly Cell[],
  choiceIndex: number,
  now: number,
): Promise<ChoiceOutcome> {
  const cell = await ownedCell(store, h3, me);
  if (!cell) return { ok: false, refused: 'not-yours' };
  const stage = cell.anomaly?.stage;
  if (cell.anomaly?.done || stage === undefined) return { ok: false, refused: 'not-in-chain' };

  const state = await settlePouch(store, owned, now);
  const result = applyChoice(chainForCell(h3), stage, choiceIndex, state.pool);
  if (!result.ok) return result;

  await writePouch(store, result.pool, now);
  const anomaly =
    result.next === 'end'
      ? { startedAt: cell.anomaly!.startedAt, done: true as const }
      : { startedAt: cell.anomaly!.startedAt, stage: result.next };
  await store.set(K.cell(h3), { ...cell, anomaly });
  await writeLogEntry(store, { at: now, kind: 'anomaly', ref: 'choice' });
  return { ok: true, next: result.next, xp: result.xp };
}
