/**
 * The map's set-aside panels — Help, History, Character (BRDC-CHAR-001).
 *
 * None of them is about the ground under your feet, and all three are opened from the HUD
 * or the menu and closed with ESC. Bundled into one hook so MapView holds a line, not
 * fourteen: the open state, the log fetch, the encounter registry (BRDC-WIKI-002), and
 * the renders live here.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { ActiveSpell, Cell, GameRepository, LogEntry, TechId } from '@es3/core';
import { HelpPanel } from '../help/HelpPanel.js';
import type { HelpView } from '../help/HelpPanel.js';
import type { HelpTopic } from '../help/help.js';
import { isDerived } from '../help/wikiPages.js';
import type { WikiRef } from '../help/wikiPages.js';
import { GuideNews } from '../help/GuideNews.js';
import { useEncountered } from '../help/useEncountered.js';
import { LogPanel } from '../log/LogPanel.js';
import { CharacterPanel } from '../character/CharacterPanel.js';

export interface MapAside {
  node: ReactNode;
  /** Straight to one page, from where the concept appears. A hand topic is recorded met;
   *  a derived Work/tech/Rite ref just opens (BRDC-WIKI-003). */
  openHelp: (ref: WikiRef) => void;
  /** The guide's front page, from the menu. */
  openGuide: () => void;
  openLog: () => void;
  openCharacter: () => void;
}

export function useMapAside(
  repository: GameRepository | null,
  now: () => number,
  /** Bumped after a lap, so the log, the character screen and the registry re-read. */
  version: number,
  /** Select a cell on the map — a Work page's "show on map" (BRDC-WIKI-004). Held in a
   *  ref so `useSelection` can be declared after this hook without a TDZ. */
  onShowCell: (h3: string) => void,
): MapAside {
  const showCell = useRef(onShowCell);
  showCell.current = onShowCell;
  const [help, setHelp] = useState<HelpView | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [characterOpen, setCharacterOpen] = useState(false);
  const { seen, news, dismissNews, note } = useEncountered(repository, version);

  // Live data for a derived page's status line — "held on 3 cells", "yours to cast"
  // (BRDC-WIKI-003). Only fetched while the guide is open.
  const [owned, setOwned] = useState<readonly Cell[]>([]);
  const [researched, setResearched] = useState<readonly TechId[]>([]);
  const [spells, setSpells] = useState<readonly ActiveSpell[]>([]);

  useEffect(() => {
    if (!repository || !logOpen) return;
    void repository.getLog().then(setLogEntries);
  }, [repository, logOpen, version]);

  useEffect(() => {
    if (!repository || help === null || help === 'index') return;
    void repository.getOwnedCells(now()).then(setOwned);
    void repository.getResearched().then(setResearched);
    void repository.getActiveSpells(now()).then(setSpells);
  }, [repository, help, now, version]);

  /** Open one page. A hand topic is folded into the registry; a derived ref just opens. */
  const openTopic = useCallback(
    (ref: WikiRef) => {
      if (!isDerived(ref)) note(ref as HelpTopic);
      setHelp(ref);
    },
    [note],
  );

  const node = (
    <>
      <HelpPanel
        topic={help}
        seen={seen}
        ctx={{ ownedCells: owned, researched, spells, now: now() }}
        onShowCell={(h3) => {
          setHelp(null);
          showCell.current(h3);
        }}
        onNavigate={setHelp}
        onClose={() => setHelp(null)}
      />
      <GuideNews topic={news} onOpen={openTopic} onDismiss={dismissNews} />
      <LogPanel
        open={logOpen}
        entries={logEntries}
        now={now()}
        onTopic={openTopic}
        onClose={() => setLogOpen(false)}
      />
      <CharacterPanel
        open={characterOpen}
        repository={repository}
        now={now}
        version={version}
        onTopic={openTopic}
        onClose={() => setCharacterOpen(false)}
      />
    </>
  );

  return {
    node,
    openHelp: openTopic,
    openGuide: () => setHelp('index'),
    openLog: () => setLogOpen(true),
    openCharacter: () => setCharacterOpen(true),
  };
}
