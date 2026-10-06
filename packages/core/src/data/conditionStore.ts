/**
 * Conditions in the store (BRDC-CONDITION-001): the walking cures and the prices that fall
 * due, applied when the realm is read — the Keep opening, the map refreshing as you walk —
 * so no step has to remember a condition exists.
 *
 * A Debt left unpaid takes the weakest hex you hold that is not the Hearth (released the
 * way decay releases one); a Dark Pact takes its sanity when it ends.
 */
import { CONDITIONS, DEBT_GOLD, PACT_SANITY, activeConditions, cureByWalking, dropCondition, dueConditions, hasCondition, seizedBy } from '../rules/condition.js';
import type { ConditionId } from '../rules/condition.js';
import { FIRST_INVESTIGATOR, afterTest, recover } from '../rules/investigator.js';
import type { Investigator } from '../rules/investigator.js';
import { settlePouch, writePouch } from './pouch.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index } from '../types/domain.js';

export interface ConditionView {
  id: ConditionId;
  name: string;
  text: string;
  cure: string;
  endsAt: number;
}

export function conditionViews(inv: Investigator, now: number): ConditionView[] {
  return activeConditions(inv, now).map((c) => ({ id: c.id, ...CONDITIONS[c.id], endsAt: c.at + CONDITIONS[c.id].hours * 3_600_000 }));
}

export interface ConditionWorld {
  owned: readonly Cell[];
  home: H3Index | null;
  temples: ReadonlySet<H3Index>;
}

/** Walking cures, then the prices of whatever ended. Returns the hex a debt took, if any. */
export async function settleConditions(store: KeyValueStore, world: ConditionWorld, now: number): Promise<H3Index | null> {
  const stored = await store.get<Investigator>(K.investigator);
  if (!stored?.conditions?.length) return null;
  let inv = cureByWalking(recover(stored, now), world.owned, world.home, world.temples);
  const due = dueConditions(inv, now);
  let seized: H3Index | null = null;
  if (due.debt) {
    seized = seizedBy(world.owned, world.home);
    if (seized) {
      await store.delete(K.cell(seized));
      await writeLogEntry(store, { at: now, kind: 'quest', ref: `debt:${seized}` });
    }
  }
  if (due.pact) inv = afterTest(inv, 0, PACT_SANITY, now);
  for (const c of due.ended) inv = dropCondition(inv, c.id);
  if (inv !== stored) await store.set(K.investigator, inv);
  return seized;
}

export type PayOutcome = { ok: true } | { ok: false; refused: 'no-debt' | 'cannot-afford' };

/** Pay the debt from the pouch. */
export async function payDebt(store: KeyValueStore, owned: readonly Cell[], now: number): Promise<PayOutcome> {
  const inv = recover((await store.get<Investigator>(K.investigator)) ?? FIRST_INVESTIGATOR(now), now);
  if (!hasCondition(inv, 'debt', now)) return { ok: false, refused: 'no-debt' };
  const state = await settlePouch(store, owned, now);
  if (state.pool.gold < DEBT_GOLD) return { ok: false, refused: 'cannot-afford' };
  await writePouch(store, { ...state.pool, gold: state.pool.gold - DEBT_GOLD }, now);
  await store.set(K.investigator, dropCondition(inv, 'debt'));
  return { ok: true };
}
