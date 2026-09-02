/**
 * What a quest site's hex offers when you tap it (BRDC-QUEST-002, -003).
 *
 * The Fuming Lake is begun and advanced from the hex it happens at — and only while the
 * player is *standing on* that hex, not merely looking at it from across the map. This is
 * the pure decision: given the selected cell, where the player actually is, the adventure
 * view and the secrets found — is there a step to take here, what does the button say,
 * and what has happened at this spot.
 */
import { FUMING_PATH, QUEST_SITE_IDS, QUEST_SITES, SITE_VERB, STAGE_SITE, siteCell } from '@es3/core';
import type { AdventureView, H3Index, QuestSiteId } from '@es3/core';

export interface QuestCellInfo {
  site: QuestSiteId;
  /** The button label. */
  label: string;
  /** Tapping it opens the dialogue. False for a landmark, and false when you are not here. */
  canAct: boolean;
  /** One line of what has happened here, or what to do. */
  history: string;
}

const siteOf = (h3: string): QuestSiteId | null =>
  QUEST_SITE_IDS.find((id) => siteCell(id) === h3) ?? null;

const index = (site: QuestSiteId): number =>
  FUMING_PATH.indexOf(site as (typeof FUMING_PATH)[number]);

/**
 * Whether the player is standing on the hex the active stage is acted on (BRDC-QUEST-003).
 *
 * The adventure's choices advance the tale, and a GPS game's whole premise is that you
 * walk to where the next thing happens. A stage with no site — the failure loops — is
 * always allowed, and a tale not under way has nothing to gate.
 */
export function atStageHex(
  fuming: AdventureView | undefined,
  standingOn: H3Index | null,
): boolean {
  if (fuming?.state !== 'active') return true;
  const site = STAGE_SITE[fuming.stageId ?? ''];
  return !site || siteCell(site) === standingOn;
}

export function questCellInfo(
  h3: string,
  fuming: AdventureView | undefined,
  finds: readonly string[],
  standingOn: H3Index | null = h3,
): QuestCellInfo | null {
  const site = siteOf(h3);
  if (!site) return null;

  const found = finds.includes(site);
  const state = fuming?.state;
  const here = h3 === standingOn;

  // The statue starts the tale — until it is under way.
  if (site === 'statue' && (state === undefined || state === 'available')) {
    return here
      ? { site, label: SITE_VERB.statue, canAct: true, history: 'The tale starts here.' }
      : { site, label: SITE_VERB.statue, canAct: false, history: 'Walk to the statue to begin.' };
  }

  if (state === 'active') {
    const stageSite = STAGE_SITE[fuming?.stageId ?? ''];
    if (site === stageSite) {
      return here
        ? { site, label: SITE_VERB[site], canAct: true, history: 'You are at this point in the tale.' }
        : { site, label: SITE_VERB[site], canAct: false, history: 'Walk here to take this step.' };
    }
    if (found) {
      return { site, label: SITE_VERB[site], canAct: false, history: 'You found this by walking here.' };
    }
    if (stageSite && index(site) >= 0 && index(stageSite) >= 0 && index(site) < index(stageSite)) {
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
