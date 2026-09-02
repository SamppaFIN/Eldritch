/**
 * The map's set-aside panels — Help, History, Character (BRDC-CHAR-001).
 *
 * None of them is about the ground under your feet, and all three are opened from the HUD
 * or the menu and closed with ESC. Bundled into one hook so MapView holds a line, not
 * fourteen: the open state, the log fetch, and the three renders live here.
 */
import { useEffect, useState, type ReactNode } from 'react';
import type { GameRepository, LogEntry } from '@es3/core';
import { HelpPanel } from '../help/HelpPanel.js';
import type { HelpView } from '../help/HelpPanel.js';
import type { HelpTopic } from '../help/help.js';
import { LogPanel } from '../log/LogPanel.js';
import { CharacterPanel } from '../character/CharacterPanel.js';

export interface MapAside {
  node: ReactNode;
  /** Straight to one entry, from where the concept appears. */
  openHelp: (topic: HelpTopic) => void;
  /** The guide's front page, from the menu. */
  openGuide: () => void;
  openLog: () => void;
  openCharacter: () => void;
}

export function useMapAside(
  repository: GameRepository | null,
  now: () => number,
  /** Bumped after a lap, so the log and the character screen re-read. */
  version: number,
): MapAside {
  const [help, setHelp] = useState<HelpView | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [characterOpen, setCharacterOpen] = useState(false);

  useEffect(() => {
    if (!repository || !logOpen) return;
    void repository.getLog().then(setLogEntries);
  }, [repository, logOpen, version]);

  const node = (
    <>
      <HelpPanel topic={help} onNavigate={setHelp} onClose={() => setHelp(null)} />
      <LogPanel
        open={logOpen}
        entries={logEntries}
        now={now()}
        onTopic={setHelp}
        onClose={() => setLogOpen(false)}
      />
      <CharacterPanel
        open={characterOpen}
        repository={repository}
        now={now}
        version={version}
        onTopic={setHelp}
        onClose={() => setCharacterOpen(false)}
      />
    </>
  );

  return {
    node,
    openHelp: setHelp,
    openGuide: () => setHelp('index'),
    openLog: () => setLogOpen(true),
    openCharacter: () => setCharacterOpen(true),
  };
}
