/**
 * The Fuming Lake, wired for the map screen (BRDC-QUEST-001, -002).
 *
 * One hook so MapView holds one line, not eight: the adventure book, the secrets found by
 * walking, which landmarks the map should draw, the action for the selected hex, and the
 * "new waypoint" announcement. The dialogue is opened from a hex — `questHex` is which one.
 */
import { useMemo, useState } from 'react';
import { siteCell, visibleQuestSites } from '@es3/core';
import type { GameRepository, H3Index } from '@es3/core';
import { useAdventure } from './useAdventure.js';
import type { AdventureBinding } from './useAdventure.js';
import { useQuestFinds } from './useQuestFinds.js';
import { useQuestWaypoint } from './useQuestWaypoint.js';
import { questCellInfo } from './questCell.js';
import type { QuestCellInfo } from './questCell.js';

export interface FumingLake {
  adventures: AdventureBinding;
  questSites: readonly string[];
  questCell: QuestCellInfo | null;
  waypoint: string | null;
  onWaypointSeen: () => void;
  justFound: ReturnType<typeof useQuestFinds>['justFound'];
  dismissFound: () => void;
  questHex: H3Index | null;
  openQuestHex: (h3: H3Index | null) => void;
}

export function useFumingLake(
  repository: GameRepository | null,
  now: () => number,
  ownedCount: number,
  standingOn: H3Index | null,
  selected: H3Index | null,
  clearWaypointKey: number,
): FumingLake {
  const [questHex, setQuestHex] = useState<H3Index | null>(null);
  const adventures = useAdventure(repository, now(), ownedCount);
  const fuming = adventures.list.find((a) => a.id === 'fuming-lake');
  const stage = fuming?.state === 'done' ? 'deep' : (fuming?.stageId ?? null);
  const finds = useQuestFinds(repository, standingOn, fuming?.state === 'active', now);
  const questSites = useMemo(() => visibleQuestSites(stage, finds.finds), [stage, finds.finds]);
  const wp = useQuestWaypoint(questSites, clearWaypointKey);
  const notStarted = fuming?.state !== 'active' && fuming?.state !== 'done';

  return {
    adventures,
    questSites,
    questCell: selected ? questCellInfo(selected, fuming, finds.finds) : null,
    waypoint: wp.waypoint,
    onWaypointSeen: wp.dismiss,
    justFound: finds.justFound,
    dismissFound: finds.dismiss,
    questHex,
    // Tapping the statue's action begins the tale and shows its first page in one step.
    openQuestHex: (h3: H3Index | null) => {
      if (h3 && notStarted && h3 === siteCell('statue')) adventures.onStart('fuming-lake');
      setQuestHex(h3);
    },
  };
}
