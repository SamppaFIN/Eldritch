/**
 * The map's set-aside panels — Help, History, Character (BRDC-CHAR-001).
 *
 * None of them is about the ground under your feet, and all three are opened from the HUD
 * or the menu and closed with ESC. Bundled into one hook so MapView holds a line, not
 * fourteen: the open state, the log fetch, the encounter registry (BRDC-WIKI-002), and
 * the renders live here.
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { GameRepository, LogEntry } from '@es3/core';
import { HelpPanel } from '../help/HelpPanel.js';
import type { HelpView } from '../help/HelpPanel.js';
import type { HelpTopic } from '../help/help.js';
import { GuideNews } from '../help/GuideNews.js';
import { useEncountered } from '../help/useEncountered.js';
import { LogPanel } from '../log/LogPanel.js';
import { CharacterPanel } from '../character/CharacterPanel.js';

export interface MapAside {
  node: ReactNode;
  /** Straight to one entry, from where the concept appears. Records it as met. */
  openHelp: (topic: HelpTopic) => void;
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
): MapAside {
  const [help, setHelp] = useState<HelpView | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [characterOpen, setCharacterOpen] = useState(false);
  const { seen, news, dismissNews, note } = useEncountered(repository, version);

  useEffect(() => {
    if (!repository || !logOpen) return;
    void repository.getLog().then(setLogEntries);
  }, [repository, logOpen, version]);

  /** Open one entry and fold it into the registry — a link is an encounter too. */
  const openTopic = useCallback(
    (topic: HelpTopic) => {
      note(topic);
      setHelp(topic);
    },
    [note],
  );

  const node = (
    <>
      <HelpPanel topic={help} seen={seen} onNavigate={setHelp} onClose={() => setHelp(null)} />
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
