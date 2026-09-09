/**
 * What to do next, worked out from where the player actually is (PIVOT-2026-09-09 §1).
 *
 * Thresholds are read from **state, not events** — "your third hex" is a question
 * `owned.length` answers at any moment, where a counter fed by events loses the case
 * where three hexes arrived in one lap, or where the player closed the game between two
 * of them. `BRDC-TUTOR-001` names that as its implementation rule and this is it.
 *
 * Pure, so the ladder can be tested without a browser, and so the copy and the thresholds
 * live in one place instead of drifting apart across three panels.
 */

export interface Progress {
  /** Cells held. A founded Hearth starts at seven — itself and its ring. */
  owned: number;
  /** Works standing anywhere. */
  works: number;
  /** Technologies researched. */
  researched: number;
}

export interface Step {
  id: 'walk' | 'build' | 'research' | 'expand';
  /** The one thing to do next, in the imperative. */
  hint: string;
  /** Why it is worth doing — one clause, never a paragraph. */
  because: string;
}

/** The Hearth and its ring, handed over at founding. Anything past this was walked for. */
export const HEARTH_RING = 7;
/** PIVOT §1's goal: "expand your home zone to ten cells and build your first building". */
export const GOAL_CELLS = 10;

const STEPS: Readonly<Record<Step['id'], Omit<Step, 'id'>>> = {
  walk: {
    hint: 'Walk into the hex beside yours.',
    because: 'Ground that touches yours becomes yours, and it pays the moment it does.',
  },
  build: {
    hint: 'Open Here and raise your first Work.',
    because: 'A Work makes its hex produce every hour, not just once.',
  },
  research: {
    hint: 'Open Research and spend your wisdom.',
    because: 'Research lifts every hex of that ground you hold — for good.',
  },
  expand: {
    hint: `Keep walking — ${GOAL_CELLS} hexes makes a realm.`,
    because: 'Every technology pays per hex, so ground is what makes them worth having.',
  },
};

/**
 * The next thing to do, or `null` once the opening is over.
 *
 * Ordered by what teaches the loop fastest: take ground, make it produce, make all of it
 * produce more, then go and get more of it. Each rung is checked against the state that
 * would satisfy it, so skipping ahead — building before the second hex, say — skips the
 * rung rather than repeating it.
 */
export function nextStep(p: Progress): Step | null {
  const id: Step['id'] | null =
    p.owned <= HEARTH_RING ? 'walk'
    : p.works === 0 ? 'build'
    : p.researched === 0 ? 'research'
    : p.owned < GOAL_CELLS ? 'expand'
    : null;
  return id ? { id, ...STEPS[id] } : null;
}
