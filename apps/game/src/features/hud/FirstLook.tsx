/**
 * What the game asks of you next, said one rung at a time (PIVOT-2026-09-09 §1).
 *
 * This used to say one thing, once: *"Walk a closed loop. The ground inside it becomes
 * yours."* Two problems with that by now. It went quiet the moment anything was claimed,
 * which is exactly when a new player has their first question — and since
 * `BRDC-CLAIM-009` put loop closure behind a setting that is off by default, **the first
 * sentence the game said to anybody instructed a mechanic that was not running.**
 *
 * It is the opening ladder now: take ground, make it produce, make all of it produce
 * more, then go and get more of it. The rungs are `steps.ts`, read from state and tested
 * without a browser; this is the line they are said on. It goes quiet for good at the
 * goal — ten hexes, a Work and a technology.
 *
 * BRDC-TUTOR-003: and it can be waved away. It was six lines of centred text floating in
 * the middle of the map with no way to be rid of it — on the one screen whose whole job
 * is showing you where you are. It is a card now, hugging the HUD, dismissed by a tap and
 * back on the next rung: a hint you have read is not a hint any more.
 *
 * BRDC-ONBOARD-004: the ladder is the Keeper's Charter now — one voice, so this says the
 * Charter's current step and no longer keeps a ladder of its own (`steps.ts` is gone).
 */
import { useEffect, useState } from 'react';
import type { CharterPage, GameRepository } from '@es3/core';
import './first-look.css';

export interface FirstLookProps {
  repository: GameRepository | null;
  now: () => number;
  /** Hexes held — re-read the Charter whenever the ground changes. */
  owned: number;
  /** Rival cells on screen, so the last line can be honest about them. */
  rivalCells: number;
  /** Bearing to the nearest rival ground, degrees from north, or null. */
  rivalBearing: number | null;
}

/**
 * The compass point, said the way a person would.
 *
 * This was hard-coded to "east" and the territory was north-east, which is a small
 * lie in the first sentence the game says to anybody. Pointing somewhere is only
 * useful if the direction is the real one.
 */
export function compassPoint(bearingDeg: number): string {
  const points = [
    'north',
    'north-east',
    'east',
    'south-east',
    'south',
    'south-west',
    'west',
    'north-west',
  ];
  const index = Math.round((((bearingDeg % 360) + 360) % 360) / 45) % 8;
  return points[index] as string;
}

export function FirstLook({ repository, now, owned, rivalCells, rivalBearing }: FirstLookProps) {
  const [page, setPage] = useState<CharterPage | null>(null);
  useEffect(() => {
    if (!repository) return;
    let live = true;
    void repository.charter.view(now()).then((p) => live && setPage(p));
    return () => {
      live = false;
    };
  }, [repository, now, owned]);
  // Kept by step, not by a flag: waving away one step must not silence the next as well.
  const [waved, setWaved] = useState<string | null>(null);
  if (!page || waved === page.step.id) return null;
  const hint = page.ready ? `${page.short} — claim it in the Keep.` : page.title;

  return (
    <aside className="first-look">
      <button
        type="button"
        className="first-look__card"
        aria-label={`Dismiss: ${hint}`}
        onClick={() => setWaved(page.step.id)}
      >
        <span className="first-look__line">{hint}</span>
        {page.ready ? null : <span className="first-look__sub">{page.why}</span>}
        {page.step.id === 'first-step' && rivalCells > 0 && rivalBearing !== null ? (
          <span className="first-look__sub">
            Someone already holds ground to the {compassPoint(rivalBearing)}.
          </span>
        ) : null}
      </button>
    </aside>
  );
}
