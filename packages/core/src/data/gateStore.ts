/**
 * Gates and the investigator, in the store (BRDC-DOOM-002).
 *
 * The rules are pure (`rules/gate.ts`, `rules/investigator.ts`). This keeps a Season 2
 * realm's gates (`K.gates`) and its investigator (`K.investigator`), opens a gate at the
 * dawns that draw one, lets the Horror bite, and runs the test at the gate: roll, spend
 * clues on rerolls, then accept. Anything that moves the shared Doom — a seal, a gate
 * left open 48 h — goes into an outbox for the Worker (part 3); the local game never
 * waits on the network.
 */
import { dawnsSince } from '../rules/doom.js';
import {
  GATE_TEST_NEED,
  gateAtDawn,
  gatesNear,
  horrorBite,
  isOpen,
  overdue,
} from '../rules/gate.js';
import type { Gate } from '../rules/gate.js';
import {
  FIRST_INVESTIGATOR,
  addClues,
  afterTest,
  diceFor,
  isHome,
  recover,
  reroll,
  rollTest,
  sealClues,
} from '../rules/investigator.js';
import type { Investigator, Roll } from '../rules/investigator.js';
import { MAX_STRENGTH } from '../rules/constants.js';
import { hexDistance } from '../geo/cells.js';
import { readLore } from './loreStore.js';
import { commit, settlePouch } from './pouch.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index } from '../types/domain.js';

interface GateBook {
  gates: Gate[];
  /** The last dawn a gate was drawn for. */
  dawn: number;
  /** Strength already taken by each gate's Horror, by gate id. */
  bitten: Record<string, number>;
  /** Doom moves the Worker has not been told of yet: +1 overdue, −1 sealed. */
  outbox: { gateId: string; delta: 1 | -1 }[];
}

interface Pending {
  gateId: string;
  roll: Roll;
}

interface InvestigatorBook extends Investigator {
  pending?: Pending;
}

export interface GateView {
  gates: (Gate & { rings: number })[];
  investigator: Investigator & { home: boolean };
  sealClues: number;
  pending: Pending | null;
}

export type GateOutcome =
  | { ok: true; roll?: Roll; sealed?: boolean }
  | { ok: false; refused: 'no-keep' | 'not-there' | 'home' | 'no-gate' | 'no-clues' | 'nothing-pending' };

export interface SeasonClock {
  seed: string;
  opensAt: number;
}

export interface GateApi {
  /** Open the gates the dawns since the last look drew, let the Horrors bite. */
  sync(season: SeasonClock | null, realm: string, now: number): Promise<void>;
  view(now: number): Promise<GateView | null>;
  /** Roll the Lore test at a gate you stand on. Stamina is paid now. */
  attempt(gateId: string, standing: H3Index | null, now: number, rng?: () => number): Promise<GateOutcome>;
  /** Spend a clue to reroll one die of the pending roll. */
  reroll(index: number, now: number, rng?: () => number): Promise<GateOutcome>;
  /** Take the pending roll: pass seals the gate, fail costs two sanity. */
  accept(now: number): Promise<GateOutcome>;
  /** Seal the nearest open gate without walking to it — a wonder's gift (SEASON-008). */
  sealFromAfar(now: number): Promise<boolean>;
  /** Spend five clues (three with Elder Signs) to seal a gate you stand on. */
  seal(gateId: string, standing: H3Index | null, now: number): Promise<GateOutcome>;
  /** The Doom moves not yet sent, and a way to clear the ones the Worker took (`gateId:delta`). */
  outbox(): Promise<GateBook['outbox']>;
  delivered(moves: readonly string[]): Promise<void>;
}

const EMPTY: GateBook = { gates: [], dawn: -1, bitten: {}, outbox: [] };

export function gateApi(store: () => KeyValueStore, owned: (now: number) => Promise<readonly Cell[]>): GateApi {
  const book = async () => (await store().get<GateBook>(K.gates)) ?? EMPTY;
  const inv = async (now: number): Promise<InvestigatorBook> =>
    recover((await store().get<InvestigatorBook>(K.investigator)) ?? FIRST_INVESTIGATOR(now), now);
  const hasKeep = async (now: number) => (await settlePouch(store(), await owned(now), now)).keep !== undefined;
  /** Tell the Keep how many gates weigh on the realm's sanity (PROG-008). */
  const weigh = async (gates: readonly Gate[], now: number) => {
    const n = gatesNear(gates, await owned(now));
    await commit(store(), now, (cur) => (cur.keep && cur.keep.gatesNear !== n ? { ...cur, keep: { ...cur.keep, gatesNear: n } } : cur));
  };
  const sealGate = async (b: GateBook, gateId: string, now: number) => {
    const gates = b.gates.map((g) => (g.id === gateId ? { ...g, sealedAt: now } : g));
    await store().set(K.gates, { ...b, gates, outbox: [...b.outbox, { gateId, delta: -1 as const }] });
    await weigh(gates, now);
    await writeLogEntry(store(), { at: now, kind: 'anomaly', ref: 'gate-sealed' });
  };

  return {
    sync: async (season, realm, now) => {
      if (!season || !(await hasKeep(now))) return;
      const cells = await owned(now);
      const b = await book();
      const today = dawnsSince(season.opensAt, now);
      const gates = [...b.gates];
      for (let d = Math.max(b.dawn + 1, today - 2); d <= today; d += 1) {
        const g = gateAtDawn(season.seed, d, realm, cells, now);
        if (g && !gates.some((x) => x.id === g.id)) gates.push(g);
      }
      // Left open 48 h, a gate adds one to the Doom — once.
      const late = new Set(overdue(gates, now).map((g) => g.id));
      const outbox = [...b.outbox, ...[...late].map((gateId) => ({ gateId, delta: 1 as const }))];
      const marked = gates.map((g) => (late.has(g.id) ? { ...g, doomedAt: now } : g));
      // The Horror bites the held cells beside its gate — only what it has not bitten yet.
      const bitten = { ...b.bitten };
      for (const g of marked.filter(isOpen)) {
        for (const c of cells) {
          const key = `${g.id}|${c.h3}`;
          const due = horrorBite(g, c, now) - (bitten[key] ?? 0);
          if (due <= 0) continue;
          bitten[key] = (bitten[key] ?? 0) + due;
          await store().set(K.cell(c.h3), { ...c, strength: Math.max(1, Math.min(MAX_STRENGTH, c.strength - due)) });
        }
      }
      await store().set(K.gates, { gates: marked, dawn: today, bitten, outbox });
      await weigh(marked, now);
    },

    view: async (now) => {
      if (!(await hasKeep(now))) return null;
      const cells = await owned(now);
      const b = await book();
      const i = await inv(now);
      const rings = (g: Gate) => Math.min(...cells.map((c) => hexDistance(c.h3, g.h3)), 99);
      const { pending, ...investigator } = i;
      return {
        gates: b.gates.filter(isOpen).map((g) => ({ ...g, rings: rings(g) })).sort((a, z) => a.rings - z.rings),
        investigator: { ...investigator, home: isHome(i, now) },
        sealClues: sealClues(await readLore(store())),
        pending: pending ?? null,
      };
    },

    attempt: async (gateId, standing, now, rng = Math.random) => {
      if (!(await hasKeep(now))) return { ok: false, refused: 'no-keep' };
      const gate = (await book()).gates.find((g) => g.id === gateId && isOpen(g));
      if (!gate) return { ok: false, refused: 'no-gate' };
      if (gate.h3 !== standing) return { ok: false, refused: 'not-there' };
      const i = await inv(now);
      if (isHome(i, now)) return { ok: false, refused: 'home' };
      const roll = rollTest(diceFor(i, 'lore'), GATE_TEST_NEED, 'normal', rng);
      await store().set(K.investigator, { ...afterTest(i, 1, 0, now), pending: { gateId, roll } });
      return { ok: true, roll };
    },

    reroll: async (index, now, rng = Math.random) => {
      const i = await inv(now);
      if (!i.pending) return { ok: false, refused: 'nothing-pending' };
      if (i.clues < 1) return { ok: false, refused: 'no-clues' };
      const roll = reroll(i.pending.roll, index, rng);
      await store().set(K.investigator, { ...addClues(i, -1), pending: { ...i.pending, roll } });
      return { ok: true, roll };
    },

    accept: async (now) => {
      const i = await inv(now);
      if (!i.pending) return { ok: false, refused: 'nothing-pending' };
      const { pending, ...rest } = i;
      if (pending.roll.pass) {
        await store().set(K.investigator, addClues(rest, 2));
        await sealGate(await book(), pending.gateId, now);
        return { ok: true, roll: pending.roll, sealed: true };
      }
      await store().set(K.investigator, afterTest(rest, 0, 2, now));
      return { ok: true, roll: pending.roll, sealed: false };
    },

    sealFromAfar: async (now) => {
      const cells = await owned(now);
      const b = await book();
      const open = b.gates.filter(isOpen);
      if (open.length === 0) return false;
      const far = (g: Gate) => Math.min(...cells.map((c) => hexDistance(c.h3, g.h3)), 99);
      const nearest = [...open].sort((a, z) => far(a) - far(z))[0] as Gate;
      await sealGate(b, nearest.id, now);
      return true;
    },

    seal: async (gateId, standing, now) => {
      if (!(await hasKeep(now))) return { ok: false, refused: 'no-keep' };
      const b = await book();
      const gate = b.gates.find((g) => g.id === gateId && isOpen(g));
      if (!gate) return { ok: false, refused: 'no-gate' };
      if (gate.h3 !== standing) return { ok: false, refused: 'not-there' };
      const i = await inv(now);
      const cost = sealClues(await readLore(store()));
      if (i.clues < cost) return { ok: false, refused: 'no-clues' };
      await store().set(K.investigator, addClues(i, -cost));
      await sealGate(b, gateId, now);
      return { ok: true, sealed: true };
    },

    outbox: async () => (await book()).outbox,
    delivered: async (moves) => {
      const b = await book();
      const done = new Set(moves);
      await store().set(K.gates, { ...b, outbox: b.outbox.filter((o) => !done.has(`${o.gateId}:${o.delta}`)) });
    },
  };
}
