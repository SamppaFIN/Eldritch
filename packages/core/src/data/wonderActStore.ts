/**
 * A wonder's action, in the store (BRDC-SEASON-008).
 *
 * The actions are data (`rules/wonderActs.ts`). This checks the realm holds the wonder's
 * hex and has not used it today, then does what the action says through the stores that
 * already own each thing — gates, the Keep, the investigator, the pouch, the Reckoning.
 */
import { WONDER_ACTS, WONDER_ACT_COOLDOWN_MS } from '../rules/wonderActs.js';
import type { WonderAct } from '../rules/wonderActs.js';
import { WONDERS } from '../rules/wonder.js';
import type { WonderId } from '../rules/wonder.js';
import { growBox } from '../rules/balance.js';
import { ageOf, loreCost } from '../rules/lore.js';
import { riteDamage } from '../rules/reckoning.js';
import { FIRST_INVESTIGATOR, SANITY_MAX, STAMINA_MAX, addClues, recover } from '../rules/investigator.js';
import type { Investigator } from '../rules/investigator.js';
import { readLore } from './loreStore.js';
import { sightRings } from './revealStore.js';
import { commit, settlePouch } from './pouch.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index } from '../types/domain.js';
import type { GateApi } from './gateStore.js';
import type { ReckoningApi } from './reckoningStore.js';

export interface WonderHere {
  id: WonderId;
  act: WonderAct;
  readyAt: number | null;
}

export type WonderActOutcome = { ok: true; said: string } | { ok: false; refused: 'none-here' | 'not-yours' | 'resting' | 'not-now' | 'nothing-to-do' };

export interface WonderActApi {
  /** The wonder standing on this hex and whether its action is ready; null elsewhere. */
  at(h3: H3Index, now: number): Promise<WonderHere | null>;
  use(h3: H3Index, now: number, reckoning: boolean): Promise<WonderActOutcome>;
  /** Every wonder this realm has found, and the hex it was found on — for the map. */
  finds(): Promise<{ id: WonderId; name: string; h3: H3Index }[]>;
}

const SKILL_MAX = 5;

export function wonderActApi(
  store: () => KeyValueStore,
  owned: (now: number) => Promise<readonly Cell[]>,
  gates: () => GateApi,
  reckoning: () => ReckoningApi,
): WonderActApi {
  const used = async () => (await store().get<Partial<Record<WonderId, number>>>(K.wonderActs)) ?? {};
  /**
   * The wonder on `h3`. A wonder's seat is a whole province (`wonderPlace.ts`); the hex it
   * stands on is where this realm found it (`K.wonderFinds`) — that is the hex to hold.
   */
  const wonderOn = async (h3: H3Index): Promise<WonderId | null> => {
    const finds = (await store().get<Partial<Record<WonderId, { h3: H3Index }>>>(K.wonderFinds)) ?? {};
    const hit = (Object.entries(finds) as [WonderId, { h3: H3Index }][]).find(([id, f]) => f.h3 === h3 && WONDER_ACTS[id]);
    return hit ? hit[0] : null;
  };
  const inv = async (now: number) => recover((await store().get<Investigator>(K.investigator)) ?? FIRST_INVESTIGATOR(now), now);

  return {
    at: async (h3, now) => {
      const id = await wonderOn(h3);
      if (!id) return null;
      const last = (await used())[id];
      return { id, act: WONDER_ACTS[id] as WonderAct, readyAt: last !== undefined && now - last < WONDER_ACT_COOLDOWN_MS ? last + WONDER_ACT_COOLDOWN_MS : null };
    },

    finds: async () => {
      const finds = (await store().get<Partial<Record<WonderId, { h3: H3Index }>>>(K.wonderFinds)) ?? {};
      return (Object.entries(finds) as [WonderId, { h3: H3Index }][]).map(([id, f]) => ({ id, name: WONDERS[id]?.name ?? id, h3: f.h3 }));
    },

    use: async (h3, now, inReckoning) => {
      const cells = await owned(now);
      const id = await wonderOn(h3);
      if (!id) return { ok: false, refused: 'none-here' };
      if (!cells.some((c) => c.h3 === h3)) return { ok: false, refused: 'not-yours' };
      const last = (await used())[id];
      if (last !== undefined && now - last < WONDER_ACT_COOLDOWN_MS) return { ok: false, refused: 'resting' };
      const { act, text } = WONDER_ACTS[id] as WonderAct;

      switch (act.kind) {
        case 'sealFromAfar':
          if (!(await gates().sealFromAfar(now))) return { ok: false, refused: 'nothing-to-do' };
          break;
        case 'calm':
          await commit(store(), now, (cur) => (cur.keep ? { ...cur, keep: { ...cur.keep, calm: { value: act.sanity, until: now + act.hours * 3_600_000 } } } : cur));
          break;
        case 'clues':
          await store().set(K.investigator, addClues(await inv(now), act.n));
          break;
        case 'granary':
          await commit(store(), now, (cur) => {
            if (!cur.keep) return cur;
            const g = cur.keep.granary;
            return { ...cur, keep: { ...cur.keep, granary: { ...g, box: Math.min(growBox(g.citizens), g.box + (growBox(g.citizens) * act.pct) / 100) } } };
          });
          break;
        case 'reveal':
          // Sight, not a find (2026-09-30): writing `revealed` refused each hex's own pay.
          await sightRings(store(), h3, act.rings, now);
          break;
        case 'loreRefund': {
          const wisdom = loreCost(ageOf(await readLore(store())));
          await commit(store(), now, (cur) => ({ ...cur, pool: { ...cur.pool, wisdom: cur.pool.wisdom + wisdom } }));
          break;
        }
        case 'gain':
          await commit(store(), now, (cur) => ({ ...cur, pool: { ...cur.pool, [act.resource]: cur.pool[act.resource] + act.n } }));
          break;
        case 'skill': {
          const i = await inv(now);
          await store().set(K.investigator, { ...i, skills: { ...i.skills, [act.skill]: Math.min(SKILL_MAX, i.skills[act.skill] + 1) } });
          break;
        }
        case 'restore': {
          const { homeAt: _home, ...i } = await inv(now);
          await store().set(K.investigator, { ...i, stamina: STAMINA_MAX, sanity: SANITY_MAX, restedAt: now });
          break;
        }
        case 'freeRite': {
          if (!inReckoning) return { ok: false, refused: 'not-now' };
          await reckoning().land(riteDamage(await reckoning().might(now)));
          break;
        }
      }
      await store().set(K.wonderActs, { ...(await used()), [id]: now });
      await settlePouch(store(), cells, now);
      return { ok: true, said: text };
    },
  };
}
