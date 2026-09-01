/**
 * Adventures: a story with stages, gated choices, and consequences (BRDC-QUEST-001).
 *
 * The chain engine (`chain.ts`) with two things added: a **speaker and portrait** for a
 * graphical dialogue, and a **gate** on a choice — a condition on the pouch, the terrain
 * you hold, how much ground you hold, or whether you have claimed a named place. An
 * adventure ties walking, territory and resources into one tale, which is the point.
 *
 * Data, not code: `data/adventures.json`. The state machine is here; the stories are
 * not, and the dialogue UI is the app's. State lives under `K.adventures` so an
 * adventure survives a reload and can be left half-finished.
 */
import { canAfford } from './terrain.js';
import type { ResourceKind, ResourcePool, TerrainKind } from './terrain.js';
import type { ChainEffect } from './chain.js';

export type { ChainEffect } from './chain.js';

export interface AdventureGate {
  /** Have at least this in the pouch. */
  pool?: Partial<ResourcePool>;
  /** Hold at least one cell of this terrain. */
  terrain?: TerrainKind;
  /** Hold at least this many cells. */
  ownedCells?: number;
  /** Have claimed the cell at this named site (`data/questSites.ts`). */
  holdsSite?: string;
}

export interface AdventureChoice {
  text: string;
  requires?: AdventureGate;
  effect?: ChainEffect;
  next: string | 'end';
  /** A codex slug this choice unlocks (the app resolves it). */
  unlocks?: string;
}

export interface AdventureStage {
  /** Who is talking — drives the portrait sigil. */
  speaker: string;
  /** Short lines first, then the longer narration the UI can let the player skip. */
  text: string[];
  choices: AdventureChoice[];
}

export interface Adventure {
  id: string;
  title: string;
  start: string;
  stages: Record<string, AdventureStage>;
}

/** Everything a gate is checked against, resolved by the repository. */
export interface AdventureContext {
  pool: ResourcePool;
  terrains: ReadonlySet<TerrainKind>;
  ownedCount: number;
  heldSites: ReadonlySet<string>;
}

export type AdvanceRefusal = 'no-such-stage' | 'no-such-choice' | 'gate' | 'cannot-afford';

export type AdvanceResult =
  | { ok: true; next: string | 'end'; effect: ChainEffect; unlocks?: string }
  | { ok: false; refused: AdvanceRefusal };

/** Whether the player meets a choice's gate right now. Pure. */
export function gateMet(gate: AdventureGate | undefined, ctx: AdventureContext): boolean {
  if (!gate) return true;
  if (gate.terrain && !ctx.terrains.has(gate.terrain)) return false;
  if (gate.ownedCells !== undefined && ctx.ownedCount < gate.ownedCells) return false;
  if (gate.holdsSite && !ctx.heldSites.has(gate.holdsSite)) return false;
  if (gate.pool && !canAfford(ctx.pool, gate.pool)) return false;
  return true;
}

/**
 * Read a bundle. A malformed adventure throws here — at load, not at play — the same
 * discipline `chain.ts` and `world.ts` take.
 */
export function parseAdventures(raw: unknown): Record<string, Adventure> {
  if (typeof raw !== 'object' || raw === null) throw new Error('adventures: not an object');
  const out: Record<string, Adventure> = {};

  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    const a = value as Partial<Adventure>;
    if (typeof a.title !== 'string' || typeof a.start !== 'string' || typeof a.stages !== 'object' || !a.stages) {
      throw new Error(`adventure "${id}": needs title, start, stages`);
    }
    const stageIds = new Set(Object.keys(a.stages));
    if (!stageIds.has(a.start)) throw new Error(`adventure "${id}": start "${a.start}" is not a stage`);

    for (const [sid, stage] of Object.entries(a.stages) as [string, AdventureStage][]) {
      if (!Array.isArray(stage?.text) || !Array.isArray(stage.choices) || stage.choices.length === 0) {
        throw new Error(`adventure "${id}" stage "${sid}": needs text and at least one choice`);
      }
      for (const [i, c] of stage.choices.entries()) {
        if (typeof c?.text !== 'string') throw new Error(`adventure "${id}" stage "${sid}" choice ${i}: needs text`);
        if (c.next !== 'end' && !stageIds.has(c.next)) {
          throw new Error(`adventure "${id}" stage "${sid}" choice ${i}: next "${c.next}" is not a stage`);
        }
      }
    }
    out[id] = { id, title: a.title, start: a.start, stages: a.stages as Record<string, AdventureStage> };
  }
  return out;
}

/** Take a choice at `stageId`. Pure — the repository applies the effect and moves the state. */
export function advanceAdventure(
  adventure: Adventure,
  stageId: string,
  choiceIndex: number,
  ctx: AdventureContext,
): AdvanceResult {
  const stage = adventure.stages[stageId];
  if (!stage) return { ok: false, refused: 'no-such-stage' };
  const choice = stage.choices[choiceIndex];
  if (!choice) return { ok: false, refused: 'no-such-choice' };
  if (!gateMet(choice.requires, ctx)) return { ok: false, refused: 'gate' };

  // A negative pool effect must be affordable — separate from the gate, which may pass
  // on a different resource.
  const cost: Partial<ResourcePool> = {};
  for (const [k, v] of Object.entries(choice.effect?.pool ?? {}) as [ResourceKind, number][]) {
    if (v < 0) cost[k] = -v;
  }
  if (Object.keys(cost).length > 0 && !canAfford(ctx.pool, cost)) {
    return { ok: false, refused: 'cannot-afford' };
  }

  return {
    ok: true,
    next: choice.next,
    effect: choice.effect ?? {},
    ...(choice.unlocks ? { unlocks: choice.unlocks } : {}),
  };
}
