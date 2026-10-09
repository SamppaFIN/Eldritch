/**
 * Creatures that walk, in the store (BRDC-MONSTER-001).
 *
 * Where each creature stands is read from its gate and the clock (`rules/monster.ts`); the
 * store keeps only what cannot be read: which have been stopped, and which of your hexes
 * each has already bitten, so a read twice never bites twice.
 */
import { MONSTER_BITE, MONSTER_NEED, creatureAt } from '../rules/monster.js';
import type { Gate } from '../rules/gate.js';
import { FIRST_INVESTIGATOR, addClues, afterTest, diceFor, isHome, luckFor, recover, rollTest } from '../rules/investigator.js';
import type { Investigator } from '../rules/investigator.js';
import { mythosDice } from '../rules/doom.js';
import { neighboursOf } from '../geo/cells.js';
import { mythosToday } from './mythosStore.js';
import { readRevealed, readSighted } from './revealStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index } from '../types/domain.js';

interface MonsterBook {
  slain: string[];
  bitten: Record<string, H3Index[]>;
}

export interface CreatureView {
  gateId: string;
  name: string;
  h3: H3Index;
  /** Under the fog until its hex is one you can see. */
  visible: boolean;
  arrived: boolean;
}

export type CreatureOutcome = { ok: true; pass: boolean; said: string } | { ok: false; refused: 'none-here' | 'not-there' | 'home' | 'no-keep' };

export interface MonsterApi {
  /** Every creature abroad, moved on to now — biting what it reached. */
  view(now: number): Promise<CreatureView[]>;
  face(gateId: string, standing: H3Index | null, now: number, rng?: () => number): Promise<CreatureOutcome>;
}

export function monsterApi(store: () => KeyValueStore, owned: (now: number) => Promise<readonly Cell[]>): MonsterApi {
  const book = async (): Promise<MonsterBook> => (await store().get<MonsterBook>(K.monsters)) ?? { slain: [], bitten: {} };
  const abroad = async (now: number) => {
    const gates = (await store().get<{ gates: Gate[] }>(K.gates))?.gates ?? [];
    const keep = (await store().get<H3Index>(K.home)) ?? null;
    const b = await book();
    return gates.filter((g) => !b.slain.includes(g.id)).map((g) => creatureAt(g, keep, now)).filter((c) => c !== null);
  };

  return {
    async view(now) {
      const creatures = await abroad(now);
      if (creatures.length === 0) return [];
      const cells = await owned(now);
      const mine = new Map(cells.map((c) => [c.h3, c]));
      const b = await book();
      const bitten = { ...b.bitten };
      let changed = false;
      for (const c of creatures) {
        const done = new Set(bitten[c.gateId] ?? []);
        for (const h3 of c.walked) {
          const cell = mine.get(h3);
          if (!cell || done.has(h3)) continue;
          await store().set(K.cell(h3), { ...cell, strength: Math.max(1, cell.strength - MONSTER_BITE) });
          done.add(h3);
          changed = true;
        }
        bitten[c.gateId] = [...done];
      }
      if (changed) await store().set(K.monsters, { ...b, bitten });
      const seen = new Set([...Object.keys(await readSighted(store())), ...Object.keys(await readRevealed(store()))]);
      for (const c of cells) {
        seen.add(c.h3);
        for (const n of neighboursOf(c.h3)) seen.add(n);
      }
      return creatures.map((c) => ({ gateId: c.gateId, name: c.name, h3: c.h3, visible: seen.has(c.h3), arrived: c.arrived }));
    },

    async face(gateId, standing, now, rng = Math.random) {
      if (!(await store().get<{ keep?: unknown }>('resources'))?.keep) return { ok: false, refused: 'no-keep' };
      const c = (await abroad(now)).find((x) => x.gateId === gateId);
      if (!c) return { ok: false, refused: 'none-here' };
      if (c.h3 !== standing) return { ok: false, refused: 'not-there' };
      const i = recover((await store().get<Investigator>(K.investigator)) ?? FIRST_INVESTIGATOR(now), now);
      if (isHome(i, now)) return { ok: false, refused: 'home' };
      const roll = rollTest(diceFor(i, 'fight', now) + mythosDice(await mythosToday(store(), now), 'fight'), MONSTER_NEED, luckFor(i, now), rng);
      if (!roll.pass) {
        await store().set(K.investigator, afterTest(i, 1, 1, now));
        return { ok: true, pass: false, said: `${c.name} throws you aside and walks on.` };
      }
      await store().set(K.investigator, addClues(afterTest(i, 1, 0, now), 1));
      const b = await book();
      await store().set(K.monsters, { ...b, slain: [...b.slain, gateId] });
      return { ok: true, pass: true, said: `${c.name} is stopped. What is left of it is a clue.` };
    },
  };
}
