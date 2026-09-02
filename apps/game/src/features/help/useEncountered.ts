/**
 * Keeps the "topics met" registry in step with what the player has done (BRDC-WIKI-002).
 *
 * The History log is the record of everything that has happened, and every kind already
 * maps to a codex topic (`LOG_TOPIC`). So on each lap this reads the log, marks those
 * topics met, and surfaces the newest addition for a one-line "the Guide has a new page"
 * announcement. Deep links (`note`) fold in the same way.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameRepository } from '@es3/core';
import { LOG_TOPIC } from '../log/describe.js';
import { markSeen, readSeen } from './encountered.js';
import type { HelpTopic } from './help.js';

export interface Encountered {
  seen: ReadonlySet<HelpTopic>;
  /** The most recent newly-met topic, for the announcement — or null once dismissed. */
  news: HelpTopic | null;
  dismissNews: () => void;
  /** Fold a topic in directly (a link opened its page). Never announces — you are on it. */
  note: (topic: HelpTopic) => void;
}

export function useEncountered(repository: GameRepository | null, version: number): Encountered {
  const seen = useRef<Set<HelpTopic>>(readSeen());
  const [, bump] = useState(0);
  const [news, setNews] = useState<HelpTopic | null>(null);

  useEffect(() => {
    if (!repository) return;
    let alive = true;
    void repository.getLog().then((entries) => {
      if (!alive) return;
      const topics = entries
        .map((e) => LOG_TOPIC[e.kind])
        .filter((t): t is HelpTopic => t !== undefined);
      const added = markSeen(seen.current, topics);
      if (added.length > 0) {
        setNews(added[added.length - 1] ?? null);
        bump((n) => n + 1);
      }
    });
    return () => {
      alive = false;
    };
  }, [repository, version]);

  const note = useCallback((topic: HelpTopic) => {
    if (markSeen(seen.current, [topic]).length > 0) bump((n) => n + 1);
  }, []);

  return { seen: seen.current, news, dismissNews: () => setNews(null), note };
}
