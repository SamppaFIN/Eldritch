/**
 * What a quest site's hex offers when you tap it (BRDC-QUEST-002).
 *
 * The Fuming Lake is begun and advanced from the hex it happens at. This is the pure
 * decision: given a cell, the adventure view and the secrets found, is there a quest
 * action here, what does the button say, and what has happened at this spot.
 */
import { FUMING_PATH, QUEST_SITE_IDS, QUEST_SITES, SITE_VERB, STAGE_SITE, siteCell } from '@es3/core';
import type { AdventureView, QuestSiteId } from '@es3/core';

export interface QuestCellInfo {
  site: QuestSiteId;
  /** The button label. */
  label: string;
  /** Tapping it opens the dialogue. False for a spot that is only a landmark now. */
  canAct: boolean;
  /** One line of what has happened here. */
  history: string;
}

const siteOf = (h3: string): QuestSiteId | null =>
  QUEST_SITE_IDS.find((id) => siteCell(id) === h3) ?? null;

const index = (site: QuestSiteId): number =>
  FUMING_PATH.indexOf(site as (typeof FUMING_PATH)[number]);

export function questCellInfo(
  h3: string,
  fuming: AdventureView | undefined,
  finds: readonly string[],
): QuestCellInfo | null {
  const site = siteOf(h3);
  if (!site) return null;

  const found = finds.includes(site);
  const state = fuming?.state;

  // The statue starts the tale — until it is under way.
  if (site === 'statue' && (state === undefined || state === 'available')) {
    return { site, label: SITE_VERB.statue, canAct: true, history: 'The tale starts here.' };
  }

  if (state === 'active') {
    const here = STAGE_SITE[fuming?.stageId ?? ''];
    if (site === here) {
      return { site, label: SITE_VERB[site], canAct: true, history: 'You are at this point in the tale.' };
    }
    if (found) {
      return { site, label: SITE_VERB[site], canAct: false, history: 'You found this by walking here.' };
    }
    if (here && index(site) >= 0 && index(here) >= 0 && index(site) < index(here)) {
      return { site, label: QUEST_SITES[site].label, canAct: false, history: 'Behind you now.' };
    }
    return null;
  }

  if (found) {
    return { site, label: SITE_VERB[site], canAct: false, history: 'You found this by walking here.' };
  }
  if (state === 'done' && index(site) >= 0) {
    return { site, label: QUEST_SITES[site].label, canAct: false, history: 'The tale ended.' };
  }
  return null;
}
