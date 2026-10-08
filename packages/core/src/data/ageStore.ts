/**
 * The week's golden or dark age, in the store (BRDC-AGE-001).
 *
 * The week turns over on its first look: the pouch is settled at the old week's rate, the
 * Legacy subtotal is marked, and the new week is judged against the two before it
 * (`rules/age.ts`). A golden week offers one boon, chosen once.
 */
import { BOONS, BOON_IDS, WEEK_NAME, rollWeek, weekEffect, weekKey } from '../rules/age.js';
import type { BoonId, WeekKind, WeekState } from '../rules/age.js';
import type { Legacy } from '../rules/legacy.js';
import { settlePouch } from './pouch.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell } from '../types/domain.js';

export interface WeekView {
  kind: WeekKind;
  /** "A golden week", "A dark week", "An ordinary week". */
  name: string;
  boon: { id: BoonId; name: string } | null;
  /** The boons to choose from — a golden week with none chosen yet. */
  choices: readonly { id: BoonId; name: string; perHour: Partial<Record<string, number>> }[];
  /** A dark week's promise is held: the next golden week comes easier. */
  promise: boolean;
}

export type WeekOutcome = { ok: true } | { ok: false; refused: 'not-golden' | 'chosen' | 'unknown' };

export interface WeekApi {
  /** This week, turned over first if it is new. */
  view(now: number): Promise<WeekView>;
  chooseBoon(id: BoonId, now: number): Promise<WeekOutcome>;
}

export function weekApi(
  store: () => KeyValueStore,
  owned: (now: number) => Promise<readonly Cell[]>,
  tally: (now: number) => Promise<Legacy>,
): WeekApi {
  const turn = async (now: number): Promise<WeekState> => {
    const state = await store().get<WeekState>(K.week);
    if (state?.week === weekKey(now)) return state;
    await settlePouch(store(), await owned(now), now);
    const next = rollWeek(state, now, (await tally(now)).subtotal);
    await store().set(K.week, next);
    return next;
  };

  return {
    async view(now) {
      const state = await turn(now);
      const { kind, boon } = weekEffect(state, now);
      return {
        kind,
        name: WEEK_NAME[kind],
        boon: boon ? { id: boon, name: BOONS[boon].name } : null,
        choices: kind === 'golden' && !boon ? BOON_IDS.map((id) => ({ id, ...BOONS[id] })) : [],
        promise: !!state.promise,
      };
    },

    async chooseBoon(id, now) {
      if (!BOONS[id]) return { ok: false, refused: 'unknown' };
      const state = await turn(now);
      if (state.kind !== 'golden') return { ok: false, refused: 'not-golden' };
      if (state.boon) return { ok: false, refused: 'chosen' };
      await settlePouch(store(), await owned(now), now);
      await store().set(K.week, { ...state, boon: id });
      return { ok: true };
    },
  };
}
