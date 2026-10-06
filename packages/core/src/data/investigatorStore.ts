/**
 * Who your investigator is, in the store (BRDC-INVEST-001): read what the Keep shows, and
 * choose once. The investigator belongs to a Season 2 realm — a Season 1 save has none,
 * so there is nothing to read and nothing to choose there.
 *
 * Same record the gates and the rumour deck use (`K.investigator`); `chooseArchetype`
 * spreads it, so a gate roll pending there rides through a choice untouched.
 */
import { archetypeOf, chooseArchetype } from '../rules/archetype.js';
import type { Archetype, ArchetypeId } from '../rules/archetype.js';
import { FIRST_INVESTIGATOR, isHome, recover } from '../rules/investigator.js';
import type { Investigator, Skill } from '../rules/investigator.js';
import type { ResourceState } from '../rules/terrain.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';

export interface InvestigatorView {
  /** Null until chosen. */
  archetype: Archetype | null;
  skills: Record<Skill, number>;
  stamina: number;
  sanity: number;
  clues: number;
  home: boolean;
}

export type ChooseOutcome =
  | { ok: true; view: InvestigatorView }
  | { ok: false; refused: 'chosen' | 'no-keep' | 'unknown' };

export interface InvestigatorApi {
  /** Null on a Season 1 save. */
  view(now: number): Promise<InvestigatorView | null>;
  /** Once per kingdom: the archetype is locked from then until the season wipe. */
  choose(id: ArchetypeId, now: number): Promise<ChooseOutcome>;
}

const viewOf = (inv: Investigator, now: number): InvestigatorView => ({
  archetype: archetypeOf(inv.archetype),
  skills: inv.skills,
  stamina: inv.stamina,
  sanity: inv.sanity,
  clues: inv.clues,
  home: isHome(inv, now),
});

export function investigatorApi(store: () => KeyValueStore): InvestigatorApi {
  const hasKeep = async () => Boolean((await store().get<ResourceState>('resources'))?.keep);
  const read = async (now: number) => recover((await store().get<Investigator>(K.investigator)) ?? FIRST_INVESTIGATOR(now), now);
  return {
    async view(now) {
      return (await hasKeep()) ? viewOf(await read(now), now) : null;
    },
    async choose(id, now) {
      if (!(await hasKeep())) return { ok: false, refused: 'no-keep' };
      if (!archetypeOf(id)) return { ok: false, refused: 'unknown' };
      const inv = await read(now);
      if (inv.archetype) return { ok: false, refused: 'chosen' };
      const next = chooseArchetype(inv, id);
      await store().set(K.investigator, next);
      return { ok: true, view: viewOf(next, now) };
    },
  };
}
