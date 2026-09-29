/**
 * The realm's part in the Reckoning (BRDC-DOOM-004).
 *
 * The rules are pure (`rules/reckoning.ts`). This rolls a strike (a Fight test, a point
 * of stamina), casts a rite (mana), reads what makes the realm mighty — Fortresses
 * standing, a Sunken Cathedral awake, the Lamp Under the Lake lit in the last day — and
 * keeps the damage dealt but not yet sent (`unsent`), so a blow struck off-line still
 * lands when the Worker is reached. Season 2 saves only.
 */
import { MASTERWORKS, activeMasterworks } from '../rules/masterwork.js';
import { RITES } from '../rules/rites.js';
import type { RiteBook } from '../rules/rites.js';
import { RITE_MANA_COST, STRIKE_COOLDOWN_MS, riteDamage, strikeDamage } from '../rules/reckoning.js';
import type { RealmMight } from '../rules/reckoning.js';
import { FIRST_INVESTIGATOR, afterTest, diceFor, isHome, recover, rollTest } from '../rules/investigator.js';
import type { Investigator, Roll } from '../rules/investigator.js';
import { worksOn } from '../rules/build.js';
import { commit, settlePouch } from './pouch.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell } from '../types/domain.js';

interface ReckoningBook {
  lastStrikeAt?: number;
  unsent: number;
  dealt: number;
}

export type BlowOutcome =
  | { ok: true; damage: number; roll?: Roll }
  | { ok: false; refused: 'no-keep' | 'home' | 'resting' | 'cannot-afford' };

export interface ReckoningApi {
  might(now: number): Promise<RealmMight>;
  /** A Fight test; every success lands. */
  strike(now: number, rng?: () => number): Promise<BlowOutcome>;
  /** Thirty mana into harm. */
  rite(now: number): Promise<BlowOutcome>;
  /** Damage dealt here the Worker has not taken yet, and all this realm has dealt. */
  ledger(): Promise<{ unsent: number; dealt: number; readyAt: number | null }>;
  /** The Worker took `damage` of the unsent. */
  sent(damage: number): Promise<void>;
  /** Damage dealt some other way — a wonder's rite (SEASON-008). */
  land(damage: number): Promise<void>;
}

export function reckoningApi(store: () => KeyValueStore, owned: (now: number) => Promise<readonly Cell[]>): ReckoningApi {
  const book = async () => (await store().get<ReckoningBook>(K.reckoning)) ?? { unsent: 0, dealt: 0 };
  const inv = async (now: number) =>
    recover((await store().get<Investigator>(K.investigator)) ?? FIRST_INVESTIGATOR(now), now);

  const might = async (now: number): Promise<RealmMight> => {
    const cells = await owned(now);
    const rites = await store().get<RiteBook>(K.rites);
    const lampAt = rites?.castAt['lamp-under-the-lake'];
    const lampRank = rites?.learned['lamp-under-the-lake'];
    const lit = lampAt !== undefined && lampRank !== undefined && now - lampAt < 24 * 3_600_000;
    return {
      fortresses: cells.filter((c) => worksOn(c).some((w) => w.id === MASTERWORKS.fortress.becomes)).length,
      cathedral: activeMasterworks(cells).includes('sunken-cathedral'),
      lampPct: lit ? (RITES['lamp-under-the-lake'].values[lampRank - 1] as number) : 0,
    };
  };
  const land = async (damage: number) => {
    const b = await book();
    await store().set(K.reckoning, { ...b, unsent: b.unsent + damage, dealt: b.dealt + damage });
  };

  return {
    might,

    strike: async (now, rng = Math.random) => {
      if (!(await settlePouch(store(), await owned(now), now)).keep) return { ok: false, refused: 'no-keep' };
      const b = await book();
      if (b.lastStrikeAt !== undefined && now - b.lastStrikeAt < STRIKE_COOLDOWN_MS) return { ok: false, refused: 'resting' };
      const i = await inv(now);
      if (isHome(i, now)) return { ok: false, refused: 'home' };
      const roll = rollTest(diceFor(i, 'fight'), 1, 'normal', rng);
      await store().set(K.investigator, afterTest(i, 1, 0, now));
      const damage = strikeDamage(roll, await might(now));
      await store().set(K.reckoning, { ...b, lastStrikeAt: now });
      await land(damage);
      return { ok: true, damage, roll };
    },

    rite: async (now) => {
      const state = await settlePouch(store(), await owned(now), now);
      if (!state.keep) return { ok: false, refused: 'no-keep' };
      if (state.pool.mana < RITE_MANA_COST) return { ok: false, refused: 'cannot-afford' };
      await commit(store(), now, (cur) => ({ ...cur, pool: { ...cur.pool, mana: cur.pool.mana - RITE_MANA_COST } }));
      const damage = riteDamage(await might(now));
      await land(damage);
      return { ok: true, damage };
    },

    ledger: async () => {
      const b = await book();
      return { unsent: b.unsent, dealt: b.dealt, readyAt: b.lastStrikeAt !== undefined ? b.lastStrikeAt + STRIKE_COOLDOWN_MS : null };
    },

    land,

    sent: async (damage) => {
      const b = await book();
      await store().set(K.reckoning, { ...b, unsent: Math.max(0, b.unsent - damage) });
    },
  };
}
