/**
 * Which codex topics the player has actually met (BRDC-WIKI-002).
 *
 * The Guide is not a manual handed over at the start — it fills as the game happens to
 * you. A topic is recorded the first time its mechanic fires (the History log is the
 * source of truth for that), or the first time a link opens its page. Three topics are
 * always available, because they are the instructions, not a reward.
 */
import { load, saveNow } from '@es3/core';
import type { HelpTopic } from './help.js';
import { SEASON_THREE_TOPICS } from './helpSeasonThree.js';

const KEY = 'seen-topics';

/** Always in the Guide — how to play, the first walk, what the words mean, and the season's
 *  own pages: those are the instructions for the season, not a reward for meeting it. */
export const ALWAYS_SEEN: readonly HelpTopic[] = ['how-to-play', 'first-walk', 'vocabulary', ...SEASON_THREE_TOPICS];

export function readSeen(): Set<HelpTopic> {
  const stored = load<HelpTopic[] | null>(KEY, null);
  return new Set([...ALWAYS_SEEN, ...(Array.isArray(stored) ? stored : [])]);
}

/**
 * Record topics as met. Returns the ones that were new this call — the caller announces
 * them. `ALWAYS_SEEN` topics never count as new.
 */
export function markSeen(seen: Set<HelpTopic>, topics: readonly HelpTopic[]): HelpTopic[] {
  const added: HelpTopic[] = [];
  for (const t of topics) {
    if (seen.has(t)) continue;
    seen.add(t);
    added.push(t);
  }
  if (added.length > 0) {
    saveNow(KEY, [...seen].filter((t) => !ALWAYS_SEEN.includes(t)));
  }
  return added;
}
