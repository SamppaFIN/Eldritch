/**
 * The Fuming Lake, wired for the map screen (BRDC-QUEST-001, -002).
 *
 * One hook so MapView holds one line, not eight: the adventure book, the secrets found by
 * walking, which landmarks the map should draw, the action for the selected hex, and the
 * "new waypoint" announcement. The dialogue is opened from a hex — `questHex` is which one.
 */
import { useMemo, useState } from 'react';
import { hasWork, siteCell, visibleQuestSites } from '@es3/core';
import type { Cell, GameRepository, H3Index } from '@es3/core';
import { useAdventure } from './useAdventure.js';
import type { AdventureBinding } from './useAdventure.js';
import { useQuestFinds } from './useQuestFinds.js';
import { useQuestWaypoint } from './useQuestWaypoint.js';
import { atStageHex, questCellInfo } from './questCell.js';
import type { QuestCellInfo } from './questCell.js';
import { questBoardEntries } from './questBoard.js';
import type { QuestBoardEntry } from './questBoard.js';

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
  /** True while the player stands on the hex the open stage is acted on (BRDC-QUEST-003). */
  atStageHex: boolean;
  /** The Tavern's own board, for the selected cell — null off a Tavern hex, `[]` on one
   *  with nothing under way (BRDC-TAVERN-001). */
  board: readonly QuestBoardEntry[] | null;
}

export function useFumingLake(
  repository: GameRepository | null,
  now: () => number,
  ownedCount: number,
  standingOn: H3Index | null,
  selected: H3Index | null,
  clearWaypointKey: number,
  /** The selected cell itself, only to check for a Tavern — nothing else here reads it. */
  selectedCell: Cell | null = null,
): FumingLake {
  const [questHex, setQuestHex] = useState<H3Index | null>(null);
  // The clock itself, not a reading taken during render: a fresh millisecond every render
  // turned this into a loop that hammered the store (BRDC-ECON-009).
  const adventures = useAdventure(repository, now, ownedCount);
  const fuming = adventures.list.find((a) => a.id === 'fuming-lake');
  const stage = fuming?.state === 'done' ? 'deep' : (fuming?.stageId ?? null);
  const finds = useQuestFinds(repository, standingOn, fuming?.state === 'active', now);
  const questSites = useMemo(() => visibleQuestSites(stage, finds.finds), [stage, finds.finds]);
  const wp = useQuestWaypoint(questSites, clearWaypointKey);
  const notStarted = fuming?.state !== 'active' && fuming?.state !== 'done';

  return {
    adventures,
    questSites,
    questCell: selected ? questCellInfo(selected, fuming, finds.finds, standingOn) : null,
    waypoint: wp.waypoint,
    onWaypointSeen: wp.dismiss,
    justFound: finds.justFound,
    dismissFound: finds.dismiss,
    questHex,
    atStageHex: atStageHex(fuming, standingOn),
    board: selectedCell && hasWork(selectedCell, 'tavern') ? questBoardEntries(adventures.list) : null,
    // Tapping the statue's action begins the tale and shows its first page in one step —
    // and only from the statue's own hex (BRDC-QUEST-003).
    openQuestHex: (h3: H3Index | null) => {
      if (h3 && notStarted && h3 === siteCell('statue') && h3 === standingOn) {
        adventures.onStart('fuming-lake');
      }
      setQuestHex(h3);
    },
  };
}
