/**
 * A journey through a gate, in the store (BRDC-OTHERWORLD-001).
 *
 * Stepping through costs a point of health, as any test does; each encounter is then faced
 * on its own, so a journey left half-way waits in the save (`K.otherWorld`) the way a
 * gate's pending roll does. Closing the gate from the inside goes through the gates' own
 * seal, so the Doom hears of it the same way.
 */
import { CLOSED_FROM_INSIDE_CLUES, JOURNEY_STAGES, WORLDS, journeyCards, worldOf } from '../rules/otherWorld.js';
import type { WorldCard, WorldId } from '../rules/otherWorld.js';
import { FIRST_INVESTIGATOR, addClues, afterTest, diceFor, isHome, luckFor, recover, rollTest } from '../rules/investigator.js';
import type { Investigator } from '../rules/investigator.js';
import { gainCondition } from '../rules/condition.js';
import { isOpen } from '../rules/gate.js';
import type { Gate } from '../rules/gate.js';
import { mythosDice } from '../rules/doom.js';
import type { ResourceKind } from '../rules/terrain.js';
import { mythosToday } from './mythosStore.js';
import { commit } from './pouch.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { GateApi } from './gateStore.js';
import type { H3Index } from '../types/domain.js';

interface Journey {
  gateId: string;
  stage: number;
}

export interface JourneyView {
  gateId: string;
  world: { id: WorldId; name: string };
  /** 1-based, of `JOURNEY_STAGES`. */
  stage: number;
  of: number;
  card: WorldCard;
}

export type JourneyOutcome =
  | { ok: true; pass: boolean; said: string; closed?: true; ended: boolean }
  | { ok: false; refused: 'no-gate' | 'not-there' | 'home' | 'travelling' | 'no-journey' | 'no-keep' };

export interface OtherWorldApi {
  /** The world a gate opens on, as glimpsed from its hex. */
  glimpse(gateId: string): { name: string; text: string };
  /** The journey under way, if any — wherever the investigator now stands. */
  journey(): Promise<JourneyView | null>;
  enter(gateId: string, standing: H3Index | null, now: number): Promise<JourneyOutcome>;
  /** Face the encounter the journey has reached. */
  face(now: number, rng?: () => number): Promise<JourneyOutcome>;
}

export function otherWorldApi(store: () => KeyValueStore, gates: () => GateApi): OtherWorldApi {
  const inv = async (now: number) => recover((await store().get<Investigator>(K.investigator)) ?? FIRST_INVESTIGATOR(now), now);
  const viewOf = (j: Journey): JourneyView => {
    const w = WORLDS[worldOf(j.gateId)];
    return { gateId: j.gateId, world: { id: w.id, name: w.name }, stage: j.stage + 1, of: JOURNEY_STAGES, card: journeyCards(j.gateId)[j.stage] as WorldCard };
  };
  const openGate = async (gateId: string) => ((await store().get<{ gates: Gate[] }>(K.gates))?.gates ?? []).find((g) => g.id === gateId && isOpen(g));

  return {
    glimpse(gateId) {
      const w = WORLDS[worldOf(gateId)];
      return { name: w.name, text: w.glimpse };
    },

    async journey() {
      const j = await store().get<Journey>(K.otherWorld);
      return j ? viewOf(j) : null;
    },

    async enter(gateId, standing, now) {
      if (!(await store().get<{ keep?: unknown }>('resources'))?.keep) return { ok: false, refused: 'no-keep' };
      if (await store().get<Journey>(K.otherWorld)) return { ok: false, refused: 'travelling' };
      const gate = await openGate(gateId);
      if (!gate) return { ok: false, refused: 'no-gate' };
      if (gate.h3 !== standing) return { ok: false, refused: 'not-there' };
      const i = await inv(now);
      if (isHome(i, now)) return { ok: false, refused: 'home' };
      await store().set(K.investigator, afterTest(i, 1, 0, now));
      await store().set(K.otherWorld, { gateId, stage: 0 });
      return { ok: true, pass: true, said: WORLDS[worldOf(gateId)].glimpse, ended: false };
    },

    async face(now, rng = Math.random) {
      const j = await store().get<Journey>(K.otherWorld);
      if (!j) return { ok: false, refused: 'no-journey' };
      const card = journeyCards(j.gateId)[j.stage] as WorldCard;
      const i = await inv(now);
      const roll = rollTest(diceFor(i, card.skill, now) + mythosDice(await mythosToday(store(), now), card.skill), card.need, luckFor(i, now), rng);
      if (!roll.pass) {
        await store().set(K.investigator, gainCondition(afterTest(i, 0, card.fail.sanity, now), card.fail.condition, now));
        await store().delete(K.otherWorld);
        return { ok: true, pass: false, said: `${card.fail.text} You are thrown back through the gate; it stays open.`, ended: true };
      }
      await store().set(K.investigator, addClues(i, card.pass.clues ?? 0));
      const gain = card.pass.gain ?? {};
      if (Object.keys(gain).length > 0) {
        await commit(store(), now, (cur) => {
          const pool = { ...cur.pool };
          for (const [k, v] of Object.entries(gain) as [ResourceKind, number][]) pool[k] += v;
          return { ...cur, pool };
        });
      }
      if (j.stage + 1 < JOURNEY_STAGES) {
        await store().set(K.otherWorld, { ...j, stage: j.stage + 1 });
        return { ok: true, pass: true, said: card.pass.text, ended: false };
      }
      // The last encounter passed: the gate closes behind you, from the inside.
      await store().delete(K.otherWorld);
      const closed = (await openGate(j.gateId)) ? await gates().close(j.gateId, now) : false;
      if (closed) await store().set(K.investigator, addClues(await inv(now), CLOSED_FROM_INSIDE_CLUES));
      return { ok: true, pass: true, said: `${card.pass.text} ${closed ? 'The gate closes behind you, from the inside.' : 'The gate was shut while you were away.'}`, ...(closed ? { closed: true as const } : {}), ended: true };
    },
  };
}
