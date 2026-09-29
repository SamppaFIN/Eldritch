/**
 * The temples' schools, in the store (BRDC-PROG-007).
 *
 * The rules are pure (`rules/rites.ts`); this keeps the realm's book (`K.rites`), pays in
 * mana from the pouch, and applies what a cast does: strength on a cell or on every cell,
 * a timed food boon in the Keep record, or grain straight into the granary. A Season 2
 * save only — a Season 1 save still casts the old spells.
 */
import { MAX_STRENGTH } from '../rules/constants.js';
import { growBox } from '../rules/balance.js';
import { ageOf } from '../rules/lore.js';
import {
  EMPTY_BOOK,
  RITES,
  RITE_COOLDOWN_MS,
  RITE_IDS,
  RITE_MANA,
  castRite,
  dedicate,
  deepenCost,
  deepenRite,
  learnCost,
  learnRite,
  rankCeiling,
  riteText,
  rivalRite,
  schoolSlots,
  tierCeiling,
} from '../rules/rites.js';
import type { Rank, RiteBook, RiteId, RiteRefusal, School, Tier } from '../rules/rites.js';
import { readLore } from './loreStore.js';
import { commit, settlePouch } from './pouch.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index } from '../types/domain.js';

export interface RiteRow {
  id: RiteId;
  name: string;
  school: School;
  tier: Tier;
  rank: Rank | 0;
  /** What it does at its current rank (rank I when not learned). */
  text: string;
  mana: number;
  state: 'learned' | 'available' | 'sealed' | 'closed';
  /** The mana the next step costs: learning, or deepening. */
  nextCost: number | null;
  readyAt: number | null;
  wired: boolean;
}

export interface RiteView {
  schools: School[];
  slots: number;
  mana: number;
  rankCap: Rank;
  rites: RiteRow[];
}

export type RiteOutcome = { ok: true; said: string } | { ok: false; refused: RiteRefusal | 'no-keep' | 'no-target' };

export interface RiteApi {
  view(now: number): Promise<RiteView | null>;
  dedicate(school: School, now: number): Promise<RiteOutcome>;
  learn(id: RiteId, now: number): Promise<RiteOutcome>;
  deepen(id: RiteId, now: number): Promise<RiteOutcome>;
  /** `target` is the hex a cell rite lands on (Salt Circle, Call the Shoal). */
  cast(id: RiteId, now: number, target?: H3Index): Promise<RiteOutcome>;
}

async function readBook(store: KeyValueStore): Promise<RiteBook> {
  return (await store.get<RiteBook>(K.rites)) ?? EMPTY_BOOK;
}

export function riteApi(store: () => KeyValueStore, owned: (now: number) => Promise<readonly Cell[]>): RiteApi {
  /** Settle, check there is a Season 2 Keep, and hand back what every verb needs. */
  const open = async (now: number) => {
    const cells = await owned(now);
    const state = await settlePouch(store(), cells, now);
    return { cells, state, book: await readBook(store()), lore: await readLore(store()) };
  };
  const payMana = (mana: number, now: number) => commit(store(), now, (cur) => ({ ...cur, pool: { ...cur.pool, mana } }));

  return {
    view: async (now) => {
      const { state, book, lore } = await open(now);
      if (!state.keep) return null;
      const cap = tierCeiling(lore);
      const rankCap = rankCeiling(ageOf(lore));
      return {
        schools: book.schools,
        slots: schoolSlots(lore),
        mana: state.pool.mana,
        rankCap,
        rites: RITE_IDS.filter((id) => book.schools.includes(RITES[id].school)).map((id) => {
          const rank = book.learned[id] ?? 0;
          const other = rivalRite(id);
          const last = book.castAt[id];
          return {
            id,
            name: RITES[id].name,
            school: RITES[id].school,
            tier: RITES[id].tier,
            rank,
            text: riteText(id, (rank || 1) as Rank),
            mana: RITE_MANA[RITES[id].tier],
            state: rank ? 'learned' : other && book.learned[other] ? 'closed' : RITES[id].tier > cap ? 'sealed' : 'available',
            nextCost: rank === 0 ? learnCost(id) : rank < rankCap ? deepenCost(id, (rank + 1) as Rank) : null,
            readyAt: last !== undefined && now - last < RITE_COOLDOWN_MS ? last + RITE_COOLDOWN_MS : null,
            wired: RITES[id].effect.kind !== 'waits',
          };
        }),
      };
    },

    dedicate: async (school, now) => {
      const { state, book, lore } = await open(now);
      if (!state.keep) return { ok: false, refused: 'no-keep' };
      const r = dedicate(book, school, lore);
      if (!r.ok) return r;
      await store().set(K.rites, r.book);
      return { ok: true, said: `The temple is given to the School of the ${school[0]?.toUpperCase()}${school.slice(1)}.` };
    },

    learn: async (id, now) => {
      const { state, book, lore } = await open(now);
      if (!state.keep) return { ok: false, refused: 'no-keep' };
      const r = learnRite(book, id, lore, state.pool.mana);
      if (!r.ok) return r;
      await payMana(r.mana, now);
      await store().set(K.rites, r.book);
      return { ok: true, said: `${RITES[id].name} learned.` };
    },

    deepen: async (id, now) => {
      const { state, book, lore } = await open(now);
      if (!state.keep) return { ok: false, refused: 'no-keep' };
      const r = deepenRite(book, id, lore, state.pool.mana);
      if (!r.ok) return r;
      await payMana(r.mana, now);
      await store().set(K.rites, r.book);
      return { ok: true, said: `${RITES[id].name} deepens to rank ${r.book.learned[id]}.` };
    },

    cast: async (id, now, target) => {
      const { cells, state, book } = await open(now);
      const keep = state.keep;
      if (!keep) return { ok: false, refused: 'no-keep' };
      const effect = RITES[id].effect;
      const needsTarget = (effect.kind === 'cellStrength' || effect.kind === 'farmFood') && effect.scope === 'target';
      const aim = cells.find((c) => c.h3 === target);
      if (needsTarget && !aim) return { ok: false, refused: 'no-target' };
      const r = castRite(book, id, state.pool.mana, now);
      if (!r.ok) return r;
      const v = RITES[id].values[r.rank - 1] as number;

      if (effect.kind === 'cellStrength') {
        for (const c of effect.scope === 'all' ? cells : aim ? [aim] : []) {
          await store().set(K.cell(c.h3), { ...c, strength: Math.min(MAX_STRENGTH, c.strength + v) });
        }
      }
      const boons = (keep.boons ?? []).filter((b) => b.until > now);
      await commit(store(), now, (cur) => {
        if (!cur.keep) return cur;
        const k = cur.keep;
        if (effect.kind === 'farmFood') {
          const boon = { rite: id, scope: effect.scope, value: v, until: now + effect.hours * 3_600_000, ...(aim ? { target: aim.h3 } : {}) };
          return { ...cur, pool: { ...cur.pool, mana: r.mana }, keep: { ...k, boons: [...boons, boon] } };
        }
        if (effect.kind === 'granaryFill') {
          const need = growBox(k.granary.citizens);
          const box = Math.min(need, k.granary.box + (need * v) / 100);
          return { ...cur, pool: { ...cur.pool, mana: r.mana }, keep: { ...k, granary: { ...k.granary, box } } };
        }
        return { ...cur, pool: { ...cur.pool, mana: r.mana } };
      });
      await store().set(K.rites, r.book);
      await writeLogEntry(store(), { at: now, kind: 'spell', ref: id });
      return { ok: true, said: riteText(id, r.rank) };
    },
  };
}
