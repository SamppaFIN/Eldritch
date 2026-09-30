/**
 * The temples' schools, in the store (BRDC-PROG-007).
 *
 * The rules are pure (`rules/rites.ts`); this keeps the realm's book (`K.rites`), pays in
 * mana from the pouch, and applies what a cast does through the stores that own each thing:
 * cells, the Keep record (boons, calm, granary), the pouch, the investigator, the gates.
 * A Season 2 save only — a Season 1 save still casts the old spells.
 */
import { MAX_STRENGTH } from '../rules/constants.js';
import { emptyCell, resolveCapture } from '../rules/capture.js';
import { FIRST_INVESTIGATOR, SANITY_MAX, STAMINA_MAX, addClues, recover } from '../rules/investigator.js';
import type { Investigator } from '../rules/investigator.js';
import { RESOURCE_KINDS } from '../rules/terrain.js';
import { cellsWithin, hexDistance, neighboursOf } from '../geo/cells.js';
import { growBox } from '../rules/balance.js';
import { ageOf } from '../rules/lore.js';
import {
  EMPTY_BOOK,
  RITES,
  RITE_COOLDOWN_MS,
  RITE_IDS,
  RITE_MANA,
  castRite,
  castsOnHex,
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
import type { Rank, RiteBook, RiteEffect, RiteId, RiteRefusal, School, Tier } from '../rules/rites.js';
import { readLore } from './loreStore.js';
import { commit, settlePouch } from './pouch.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { GateApi } from './gateStore.js';
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
}

export interface RiteView {
  schools: School[];
  slots: number;
  mana: number;
  rankCap: Rank;
  rites: RiteRow[];
}

export type RiteOutcome =
  | { ok: true; said: string }
  | { ok: false; refused: RiteRefusal | 'no-keep' | 'no-target' | 'no-gate' | 'nothing-near' };

export interface RiteApi {
  view(now: number): Promise<RiteView | null>;
  dedicate(school: School, now: number): Promise<RiteOutcome>;
  learn(id: RiteId, now: number): Promise<RiteOutcome>;
  deepen(id: RiteId, now: number): Promise<RiteOutcome>;
  /** `target` is the hex a cell rite lands on (`castsOnHex`). */
  cast(id: RiteId, now: number, target?: H3Index): Promise<RiteOutcome>;
}

async function readBook(store: KeyValueStore): Promise<RiteBook> {
  return (await store.get<RiteBook>(K.rites)) ?? EMPTY_BOOK;
}

export function riteApi(
  store: () => KeyValueStore,
  owned: (now: number) => Promise<readonly Cell[]>,
  gates: () => GateApi,
): RiteApi {
  /** Settle, check there is a Season 2 Keep, and hand back what every verb needs. */
  const open = async (now: number) => {
    const cells = await owned(now);
    const state = await settlePouch(store(), cells, now);
    return { cells, state, book: await readBook(store()), lore: await readLore(store()) };
  };
  const inv = async (now: number) => recover((await store().get<Investigator>(K.investigator)) ?? FIRST_INVESTIGATOR(now), now);
  /** Free hexes beside your ground, nearest the Hearth first — what Unseen Hand may claim. */
  const freeEdge = async (cells: readonly Cell[]): Promise<H3Index[]> => {
    const mine = new Set(cells.map((c) => c.h3));
    const edge = [...new Set(cells.flatMap((c) => neighboursOf(c.h3)))].filter((h) => !mine.has(h));
    const found = await store().getMany<Cell>(edge.map((h) => K.cell(h)));
    const free = edge.filter((_, i) => (found[i]?.ownerId ?? null) === null);
    const home = (await store().get<H3Index>(K.home)) ?? cells[0]?.h3;
    return home ? free.sort((a, z) => hexDistance(home, a) - hexDistance(home, z)) : free;
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
      const effect: RiteEffect = RITES[id].effect;
      const aim = cells.find((c) => c.h3 === target);
      if (castsOnHex(id) && !aim) return { ok: false, refused: 'no-target' };
      // What a rite needs to exist before it is paid for: an open gate, free ground beside yours.
      if (effect.kind === 'seal' && ((await gates().view(now))?.gates.length ?? 0) === 0) return { ok: false, refused: 'no-gate' };
      const edge = effect.kind === 'claimNear' ? await freeEdge(cells) : [];
      if (effect.kind === 'claimNear' && edge.length === 0) return { ok: false, refused: 'nothing-near' };
      const r = castRite(book, id, state.pool.mana, now);
      if (!r.ok) return r;
      const v = RITES[id].values[r.rank - 1] as number;
      let mana = r.mana;
      const until = (hours: number) => now + hours * 3_600_000;

      switch (effect.kind) {
        case 'cellStrength': {
          const ring = aim ? new Set(cellsWithin(aim.h3, 1)) : new Set<H3Index>();
          const hit = effect.scope === 'all' ? cells : effect.scope === 'ring' ? cells.filter((c) => ring.has(c.h3)) : aim ? [aim] : [];
          for (const c of hit) await store().set(K.cell(c.h3), { ...c, strength: Math.min(MAX_STRENGTH, c.strength + v) });
          break;
        }
        case 'cellFloor':
          if (aim && aim.strength < v) await store().set(K.cell(aim.h3), { ...aim, strength: Math.min(MAX_STRENGTH, v) });
          break;
        case 'reveal': {
          const revealed = (await store().get<Record<H3Index, number>>(K.revealed)) ?? {};
          for (const h of aim ? cellsWithin(aim.h3, v) : []) revealed[h] ??= now;
          await store().set(K.revealed, revealed);
          break;
        }
        case 'walkedMana':
          mana += v * cells.filter((c) => now - c.lastVisitedAt < 24 * 3_600_000).length;
          break;
        case 'clues':
          await store().set(K.investigator, addClues(await inv(now), v));
          break;
        case 'restore': {
          const { homeAt: _home, ...i } = await inv(now);
          await store().set(K.investigator, addClues({ ...i, stamina: STAMINA_MAX, sanity: SANITY_MAX, restedAt: now }, v));
          break;
        }
        case 'dice':
          await store().set(K.investigator, { ...(await inv(now)), voice: { dice: v, until: until(effect.hours) } });
          break;
        case 'blessed':
          await store().set(K.investigator, { ...(await inv(now)), blessedUntil: until(v) });
          break;
        case 'seal': {
          for (let n = effect.per === 'gates' ? v : 1; n > 0 && (await gates().sealFromAfar(now)); n -= 1);
          if (effect.per === 'clues') await store().set(K.investigator, addClues(await inv(now), v));
          break;
        }
        case 'claimNear': {
          const me = cells[0]?.ownerId as string;
          for (const h3 of edge.slice(0, v)) await store().set(K.cell(h3), resolveCapture(emptyCell(h3), { id: me, level: 0 }, now).cell);
          await writeLogEntry(store(), { at: now, kind: 'awaken', count: Math.min(v, edge.length) });
          break;
        }
        default:
          break;
      }
      const boons = (keep.boons ?? []).filter((b) => b.until > now);
      await commit(store(), now, (cur) => {
        const pool = { ...cur.pool, mana };
        if (effect.kind === 'pouchShare') {
          for (const k of RESOURCE_KINDS) if (k !== 'mana') pool[k] = Math.floor(pool[k] * (1 + v / 100));
        }
        if (!cur.keep) return { ...cur, pool };
        const k = cur.keep;
        if (effect.kind === 'farmFood') {
          const boon = { rite: id, scope: effect.scope, value: v, until: until(effect.hours), ...(aim ? { target: aim.h3 } : {}) };
          return { ...cur, pool, keep: { ...k, boons: [...boons, boon] } };
        }
        if (effect.kind === 'yieldBoon') {
          return { ...cur, pool, keep: { ...k, boons: [...boons, { rite: id, scope: 'yield' as const, value: v, until: until(effect.hours) }] } };
        }
        if (effect.kind === 'calm') return { ...cur, pool, keep: { ...k, calm: { value: v, until: until(effect.hours) } } };
        if (effect.kind === 'granaryFill') {
          const need = growBox(k.granary.citizens);
          const box = Math.min(need, k.granary.box + (need * v) / 100);
          return { ...cur, pool, keep: { ...k, granary: { ...k.granary, box } } };
        }
        return { ...cur, pool };
      });
      await store().set(K.rites, r.book);
      await writeLogEntry(store(), { at: now, kind: 'spell', ref: id });
      return { ok: true, said: riteText(id, r.rank) };
    },
  };
}
