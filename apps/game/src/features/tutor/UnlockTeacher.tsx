/**
 * When to teach the next mechanic, and what that costs the screen (BRDC-TUTOR-001).
 *
 * A component and not a hook, and that distinction is load-bearing. As a hook it lived in
 * `MapView`, so its store read re-rendered `MapView` a moment after boot — and `MapView`
 * is where the camera follow lives. `map.spec`'s "marker sits exactly on the camera
 * centre" went 2.5 px out against a 1 px bound. Owning its own state keeps every render
 * it causes inside this subtree. The same root cause as `useNearbySurvey`'s first cut,
 * found the same way: by putting the code back and watching the test recover.
 *
 * Three rules from the ticket, all of them here:
 *
 * 1. **Read from state.** The reach is counts `MapView` already holds; no counter, no
 *    event. A lap that took three hexes at once is judged the same as three separate
 *    walks, and closing the game between two of them loses nothing.
 * 2. **Never interrupt the walk.** A card that takes the screen while someone is moving
 *    is a card read at a kerb. It waits until the pace drops.
 * 3. **Skippable, and one at a time.** "Not now" waves it for the session without paying;
 *    the lesson returns on the next walk. Only the button marks it taught.
 */
import { useCallback, useEffect, useState } from 'react';
import { nextUnlock } from '@es3/core';
import type { GameRepository, Reach, UnlockId } from '@es3/core';
import { UnlockMoment } from './UnlockMoment.js';
import type { WikiRef } from '../help/wikiPages.js';

/**
 * Pace at or under which the player counts as standing still, in m/s.
 *
 * An ordinary walk is about 1.4 m/s. Below one, they have slowed or stopped — which is
 * when a card can be read. `null`, meaning no trail to measure yet, is also quiet: on a
 * desktop or a cold start nobody is walking anywhere.
 */
export const QUIET_SPEED_MS = 1;

export interface UnlockTeacherProps {
  /** Null before boot has made one. A hook cannot be called conditionally, so it waits. */
  repository: GameRepository | null;
  reach: Reach;
  /** Current pace in m/s, or null when there is nothing to measure. */
  paceMs: number | null;
  /**
   * True while any other screen is open — a cell card, the Keep, the wiki.
   *
   * A lesson arriving over a panel the player deliberately opened is an interruption, and
   * it lands on top of the controls they were reaching for. It waits for a clear map.
   */
  busy: boolean;
  onSee: (ref: WikiRef) => void;
  /** Called after a lesson is paid, so the pouch on screen catches up. */
  onPaid: () => void;
}

export function UnlockTeacher({
  repository,
  reach,
  paceMs,
  busy,
  onSee,
  onPaid,
}: UnlockTeacherProps) {
  const [seen, setSeen] = useState<ReadonlySet<UnlockId> | null>(null);
  /** Waved away this session: not taught, not paid, back on the next walk. */
  const [waved, setWaved] = useState<ReadonlySet<UnlockId>>(new Set());

  useEffect(() => {
    if (!repository) return;
    let live = true;
    void repository.getUnlocksSeen().then((s) => live && setSeen(s));
    return () => {
      live = false;
    };
  }, [repository]);

  const id = seen ? nextUnlock(reach, seen) : null;
  const quiet = paceMs === null || paceMs <= QUIET_SPEED_MS;
  const showing = id && !waved.has(id) && quiet && !busy ? id : null;

  const onRead = useCallback(() => {
    if (!showing || !repository) return;
    // Marked in the store first so a slow grant cannot show the card twice, and
    // optimistically here so the card leaves under the thumb rather than after a round trip.
    setSeen((prev) => new Set([...(prev ?? []), showing]));
    void repository.markUnlockSeen(showing, Date.now()).then(onPaid);
  }, [repository, showing, onPaid]);

  const onLater = useCallback(() => {
    if (showing) setWaved((prev) => new Set([...prev, showing]));
  }, [showing]);

  if (!showing) return null;
  return <UnlockMoment id={showing} onRead={onRead} onLater={onLater} onSee={onSee} />;
}
