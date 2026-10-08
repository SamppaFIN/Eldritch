/**
 * The season's ambition, in the store (BRDC-AMBITION-001).
 *
 * Chosen once, in the Keep, and locked: one ambition per season. The record resets with
 * the season like everything not in `FOREVER_KEYS`, so the next season asks again. The
 * progress is read from the realm each time (`rules/ambition.ts`), never counted here.
 */
import { AMBITIONS, AMBITION_IDS, ambitionProgress } from '../rules/ambition.js';
import type { Ambition, AmbitionId } from '../rules/ambition.js';
import type { Progress } from '../rules/tasks.js';
import { isOpen } from '../rules/gate.js';
import type { Gate } from '../rules/gate.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, RevealedPlace } from '../types/domain.js';

export interface AmbitionView {
  /** The three to choose from while none is chosen. */
  choices: readonly Ambition[];
  chosen: Ambition | null;
  progress: Progress | null;
  met: boolean;
}

export type AmbitionOutcome = { ok: true } | { ok: false; refused: 'unknown' | 'locked' };

export interface AmbitionApi {
  view(now: number): Promise<AmbitionView>;
  /** Choose the season's ambition. Once chosen it is locked until the season ends. */
  choose(id: AmbitionId, now: number): Promise<AmbitionOutcome>;
}

/** The chosen ambition and how far along it is, or null while none is chosen. */
export async function readAmbition(
  store: KeyValueStore,
  owned: readonly Cell[],
  places: readonly RevealedPlace[],
): Promise<{ ambition: Ambition; progress: Progress } | null> {
  const chosen = await store.get<{ id: AmbitionId; at: number }>(K.ambition);
  const ambition = chosen ? AMBITIONS[chosen.id] : undefined;
  if (!ambition) return null;
  const gates = (await store.get<{ gates: Gate[] }>(K.gates))?.gates ?? [];
  const progress = ambitionProgress(ambition.id, {
    owned,
    templePlaces: places.filter((p) => p.kind === 'temple').map((p) => p.h3),
    gatesSealed: gates.filter((g) => !isOpen(g)).length,
  });
  return { ambition, progress };
}

/** The ambition as the Hall keeps it: "Keeper of Temples · met", or null if none was chosen. */
export async function ambitionSaid(store: KeyValueStore, owned: readonly Cell[], places: readonly RevealedPlace[]): Promise<string | null> {
  const read = await readAmbition(store, owned, places);
  return read ? `${read.ambition.title} · ${read.progress.have >= read.progress.need ? 'met' : 'not met'}` : null;
}

export function ambitionApi(
  store: () => KeyValueStore,
  owned: (now: number) => Promise<readonly Cell[]>,
  places: () => Promise<readonly RevealedPlace[]>,
): AmbitionApi {
  return {
    async view(now) {
      const read = await readAmbition(store(), await owned(now), await places());
      if (!read) return { choices: AMBITION_IDS.map((id) => AMBITIONS[id]), chosen: null, progress: null, met: false };
      return { choices: [], chosen: read.ambition, progress: read.progress, met: read.progress.have >= read.progress.need };
    },

    async choose(id, now) {
      if (!AMBITIONS[id]) return { ok: false, refused: 'unknown' };
      if (await store().get(K.ambition)) return { ok: false, refused: 'locked' };
      await store().set(K.ambition, { id, at: now });
      return { ok: true };
    },
  };
}
