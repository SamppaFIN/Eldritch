/**
 * Mechanics open one at a time, and each opening is a moment (BRDC-TUTOR-001).
 *
 * `steps.ts` is the standing hint — *what to do next*. This is the other half: *a thing
 * you could not do before, you can do now*. They are different jobs and both are needed,
 * because a game with ten resources, sixteen Works, a technology tree, four schools of
 * magic and a city state on the map cannot say all of it at the start. The player is on
 * their way out of the door at the start.
 *
 * **Thresholds are read from state, never from events.** "Your third hex" is a question
 * `owned` answers at any moment; a counter fed by events loses the lap that took three
 * hexes at once, and loses everything if the game was closed between two of them. The
 * ticket names this as its implementation rule and `steps.ts` already works this way.
 *
 * **One at a time.** Founding a Hearth hands over seven cells in one go, so several
 * thresholds go true in the same instant. `nextUnlock` returns the first unseen one and
 * nothing else — acknowledge it and the next appears. A wall of tutorial at the moment
 * the player is walking out of the door is the failure this is guarding against.
 *
 * The words live in the app (`features/tutor/unlocks.tsx`), the same split `BUILDINGS`
 * and `catalogue.tsx` make: numbers and conditions here, copy and glyphs there.
 */
import { HEARTH_RING } from './constants.js';

export type UnlockId = 'resources' | 'building' | 'temple' | 'magic' | 'neighbours' | 'siege';

/**
 * The state every threshold is judged against.
 *
 * Small on purpose — everything here is something `MapView` already knows, because a
 * reach that needs a new query is a reach that will be computed wrong somewhere.
 */
export interface Reach {
  /** Cells held right now. A founded Hearth starts at `HEARTH_RING`. */
  owned: number;
  /** Technologies researched. A researched tech that can be cast is a Rite. */
  researched: number;
  /** Rival cells on screen. Seeing one is what makes sieging worth explaining. */
  rivalCells: number;
}

/**
 * Ground the player actually walked for, past what founding handed them.
 *
 * The plan's §3 table counts "your first hex, your third, your fifth", written before
 * the Hearth handed over its whole ring. Counting the gift as progress would fire three
 * lessons in the first second. Counting from the ring keeps the plan's intent — early,
 * spaced, one per short walk — against the game that actually exists.
 */
export function walked(owned: number): number {
  return Math.max(0, owned - HEARTH_RING);
}

/** In the order they are taught. Each is checked against the state that satisfies it. */
const GATES: readonly { id: UnlockId; open: (r: Reach) => boolean }[] = [
  { id: 'resources', open: (r) => r.owned >= 1 },
  { id: 'building', open: (r) => walked(r.owned) >= 1 },
  { id: 'temple', open: (r) => walked(r.owned) >= 3 },
  // Not "cast a spell": you cannot cast before researching, so the moment a Rite becomes
  // castable is the moment to say magic exists. Teaching a mechanic the player cannot
  // reach yet is the mistake `FirstLook` was built to undo.
  { id: 'magic', open: (r) => r.researched >= 1 },
  { id: 'neighbours', open: (r) => walked(r.owned) >= 8 },
  // Seeing rival ground, not closing a loop. Loop closure is behind a setting that is off
  // by default (BRDC-CLAIM-009), and the game has already once opened by instructing a
  // mechanic that was not running.
  //
  // It also needs a hex walked for, and that is not decoration: the mock world seeds
  // neighbours, so rival ground is on screen from the first second. Caught by
  // `tutor.spec` — founding taught "the ground pays" and then, with no pause, how to
  // take somebody else's. Sieging is last in teaching order for a reason.
  { id: 'siege', open: (r) => walked(r.owned) >= 1 && r.rivalCells > 0 },
];

export const UNLOCK_IDS: readonly UnlockId[] = GATES.map((g) => g.id);

/**
 * What the player gets for reading one, in wisdom.
 *
 * The ticket asks for "a small reward for trying — teaching that costs something gets
 * read". Wisdom because it is the one resource no ground produces, so it is the one a
 * gift actually moves; ten is half the cheapest technology, so the first lesson leaves
 * the research rung within reach instead of merely pointing at it.
 */
export const UNLOCK_REWARD = 10;

/** Everything this reach satisfies, in teaching order. */
export function unlockedBy(reach: Reach): UnlockId[] {
  return GATES.filter((g) => g.open(reach)).map((g) => g.id);
}

/**
 * The one to show now, or null when there is nothing new.
 *
 * First unseen satisfied gate, in teaching order — so a player who founds a Hearth and
 * walks ten hexes before opening the game again is taught resources, then building, then
 * the temple, one tap apart, rather than all at once.
 */
export function nextUnlock(reach: Reach, seen: ReadonlySet<UnlockId>): UnlockId | null {
  return GATES.find((g) => !seen.has(g.id) && g.open(reach))?.id ?? null;
}
