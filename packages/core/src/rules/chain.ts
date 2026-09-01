/**
 * Event chains: a multi-stage story with choices that have consequences (BRDC-EVENT-001).
 *
 * A chain is *data* — a list of stages, each with choice buttons that apply an effect
 * and point at the next stage or the end. New chains are written as JSON
 * (`data/chains.json`), never as code. The state machine is here; the stories are not,
 * and the dialogue UI is `BRDC-QUEST-001`.
 *
 * State lives on the cell (`Cell.anomaly.stage`), so a chain survives a reload and a
 * player can leave one half-finished and come back to it.
 */
import { canAfford, spend } from './terrain.js';
import type { ResourceKind, ResourcePool } from './terrain.js';

export interface ChainEffect {
  /** Resource deltas — negative is allowed and must be affordable. */
  pool?: Partial<ResourcePool>;
  xp?: number;
}

export interface ChainChoice {
  text: string;
  effect?: ChainEffect;
  /** Index of the next stage, or `'end'` to close the chain. */
  next: number | 'end';
}

export interface ChainStage {
  text: string;
  choices: ChainChoice[];
}

export interface Chain {
  id: string;
  stages: ChainStage[];
}

export type ChoiceRefusal = 'no-such-stage' | 'no-such-choice' | 'cannot-afford';

export type ChoiceResult =
  | { ok: true; pool: ResourcePool; xp: number; next: number | 'end' }
  | { ok: false; refused: ChoiceRefusal };

/**
 * Read a chain bundle. A malformed chain throws here — at module load, not at play —
 * the same discipline `world.ts` takes with a shard.
 */
export function parseChains(raw: unknown): Record<string, Chain> {
  if (typeof raw !== 'object' || raw === null) throw new Error('chains: not an object');
  const out: Record<string, Chain> = {};

  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    const chain = value as Partial<Chain>;
    if (!Array.isArray(chain.stages) || chain.stages.length === 0) {
      throw new Error(`chain "${id}": needs a non-empty stages array`);
    }
    chain.stages.forEach((stage, s) => {
      if (typeof stage?.text !== 'string' || !Array.isArray(stage.choices) || stage.choices.length === 0) {
        throw new Error(`chain "${id}" stage ${s}: needs text and at least one choice`);
      }
      stage.choices.forEach((choice, c) => {
        if (typeof choice?.text !== 'string') {
          throw new Error(`chain "${id}" stage ${s} choice ${c}: needs text`);
        }
        const valid =
          choice.next === 'end' ||
          (typeof choice.next === 'number' && choice.next >= 0 && choice.next < chain.stages!.length);
        if (!valid) throw new Error(`chain "${id}" stage ${s} choice ${c}: next out of range`);
      });
    });
    out[id] = { id, stages: chain.stages as ChainStage[] };
  }
  return out;
}

/**
 * Take a choice at `stage` of `chain`, paying from `pool`.
 *
 * Pure. Refuses a bad stage or choice index, and an effect whose negative pool it cannot
 * pay. On success returns the paid pool, the XP delta, and where the chain goes next.
 */
export function applyChoice(
  chain: Chain,
  stage: number,
  choiceIndex: number,
  pool: ResourcePool,
): ChoiceResult {
  const s = chain.stages[stage];
  if (!s) return { ok: false, refused: 'no-such-stage' };
  const choice = s.choices[choiceIndex];
  if (!choice) return { ok: false, refused: 'no-such-choice' };

  let next = pool;
  const cost: Partial<ResourcePool> = {};
  const gain: Partial<ResourcePool> = {};
  for (const [k, v] of Object.entries(choice.effect?.pool ?? {}) as [ResourceKind, number][]) {
    if (v < 0) cost[k] = -v;
    else if (v > 0) gain[k] = v;
  }
  if (Object.keys(cost).length > 0) {
    if (!canAfford(pool, cost)) return { ok: false, refused: 'cannot-afford' };
    next = spend(pool, cost) as ResourcePool;
  }
  for (const [k, v] of Object.entries(gain) as [ResourceKind, number][]) {
    next = { ...next, [k]: next[k] + v };
  }

  return { ok: true, pool: next, xp: choice.effect?.xp ?? 0, next: choice.next };
}
