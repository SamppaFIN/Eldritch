/**
 * The Tavern's own board: every tale under way, and where to go next (BRDC-TAVERN-001).
 *
 * Worldseed: *"Every active chain in the province is listed here and nowhere else — so the
 * Tavern is not decoration, it is how the player finds out there is anything to do."* The
 * game has one adventure today (`adventures.json`), so this reads the player's whole list
 * rather than filtering by province — there is nothing yet for a province filter to narrow,
 * and chains carry no province of their own to filter by. Written generically enough that a
 * second adventure just shows up here, not hand-added.
 *
 * Whether an on-site start (the statue) should stop working once this exists is still open
 * (the ticket's own "Päätös Infiniteltä") — this only adds a second place to see progress,
 * it does not take the first one away.
 */
import { QUEST_SITES, STAGE_SITE } from '@es3/core';
import type { AdventureView } from '@es3/core';

export interface QuestBoardEntry {
  title: string;
  /** Where the next step happens, or what to do when a stage has no site. */
  step: string;
}

export function questBoardEntries(adventures: readonly AdventureView[]): QuestBoardEntry[] {
  return adventures
    .filter((a): a is AdventureView & { state: 'active' } => a.state === 'active')
    .map((a) => {
      const site = STAGE_SITE[a.stageId ?? ''];
      return { title: a.title, step: site ? `Walk to ${QUEST_SITES[site].label}.` : 'Continue the tale.' };
    });
}
