/**
 * Who your investigator is, in the store (BRDC-INVEST-001): read what the Keep shows, and
 * choose once. The investigator belongs to a Season 2 realm — a Season 1 save has none,
 * so there is nothing to read and nothing to choose there.
 *
 * Same record the gates and the rumour deck use (`K.investigator`); `chooseArchetype`
 * spreads it, so a gate roll pending there rides through a choice untouched.
 */
import { archetypeOf, chooseArchetype } from '../rules/archetype.js';
import { allyOf } from '../rules/ally.js';
import type { Ally } from '../rules/ally.js';
import type { Archetype, ArchetypeId } from '../rules/archetype.js';
import { FIRST_INVESTIGATOR, isHome, recover } from '../rules/investigator.js';
import type { Investigator, Skill } from '../rules/investigator.js';
import type { ResourceState } from '../rules/terrain.js';
import { K } from './keys.js';
import { conditionViews, payDebt, settleConditions } from './conditionStore.js';
import type { ConditionView, PayOutcome } from './conditionStore.js';
import { worksOn } from '../rules/build.js';
import type { Cell, H3Index, RevealedPlace } from '../types/domain.js';
import type { KeyValueStore } from './kv.js';

export interface InvestigatorView {
  /** Null until chosen. */
  archetype: Archetype | null;
  skills: Record<Skill, number>;
  stamina: number;
  sanity: number;
  clues: number;
  home: boolean;
  /** Who walks with them, and who offered to (BRDC-ALLY-001). */
  ally: Ally | null;
  allyOffer: Ally | null;
  /** Lasting conditions, with how each ends (BRDC-CONDITION-001). */
  conditions: ConditionView[];
  /** Every clue gathered this season, spent or not — the town's mysteries count it (BRDC-MYSTERY-001). */
  cluesGathered: number;
}

export type ChooseOutcome =
  | { ok: true; view: InvestigatorView }
  | { ok: false; refused: 'chosen' | 'no-keep' | 'unknown' };

export interface InvestigatorApi {
  /** Null on a Season 1 save. */
  view(now: number): Promise<InvestigatorView | null>;
  /** Once per kingdom: the archetype is locked from then until the season wipe. */
  choose(id: ArchetypeId, now: number): Promise<ChooseOutcome>;
  /** Take the ally on offer in place of the one you have, or send them on their way. */
  answerAlly(take: boolean, now: number): Promise<InvestigatorView | null>;
  /** Apply walking cures and due prices; the map calls this as you walk. */
  settle(now: number): Promise<void>;
  payDebt(now: number): Promise<PayOutcome>;
}

const viewOf = (inv: Investigator, now: number): InvestigatorView => ({
  archetype: archetypeOf(inv.archetype),
  skills: inv.skills,
  stamina: inv.stamina,
  sanity: inv.sanity,
  clues: inv.clues,
  home: isHome(inv, now),
  ally: allyOf(inv.ally),
  allyOffer: allyOf(inv.allyOffer),
  conditions: conditionViews(inv, now),
  cluesGathered: inv.cluesGathered ?? 0,
});

export function investigatorApi(
  store: () => KeyValueStore,
  owned: (now: number) => Promise<readonly Cell[]> = async () => [],
  home: () => Promise<H3Index | null> = async () => null,
  places: () => Promise<readonly RevealedPlace[]> = async () => [],
): InvestigatorApi {
  const hasKeep = async () => Boolean((await store().get<ResourceState>('resources'))?.keep);
  const settle = async (now: number) => {
    const [cells, h, found] = await Promise.all([owned(now), home(), places()]);
    const temples = new Set([...found.filter((p) => p.kind === 'temple').map((p) => p.h3), ...cells.filter((c) => worksOn(c).some((w) => w.id === 'temple-grove')).map((c) => c.h3)]);
    await settleConditions(store(), { owned: cells, home: h, temples }, now);
  };
  const read = async (now: number) => recover((await store().get<Investigator>(K.investigator)) ?? FIRST_INVESTIGATOR(now), now);
  return {
    async view(now) {
      if (!(await hasKeep())) return null;
      await settle(now);
      return viewOf(await read(now), now);
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
    async answerAlly(take, now) {
      if (!(await hasKeep())) return null;
      const inv = await read(now);
      if (!inv.allyOffer) return viewOf(inv, now);
      const { allyOffer, ...rest } = inv;
      const next: Investigator = take ? { ...rest, ally: allyOffer } : rest;
      await store().set(K.investigator, next);
      return viewOf(next, now);
    },
    settle,
    async payDebt(now) {
      return payDebt(store(), await owned(now), now);
    },
  };
}
