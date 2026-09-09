/**
 * What the map has to say that is not the game itself (BRDC-HUD-004).
 *
 * The conditions are states — a device that will not persist, a save from an older schema,
 * the age of the shared world, a dev clock running ahead — but the *telling* is an event.
 * This turns the former into the latter: a list, built fresh each render, minus whatever
 * the player has already waved away.
 *
 * Pure, so the rule is testable without a browser. The timing and the DOM belong to
 * `MapNotices`.
 */

export interface Notice {
  /** Stable across renders, so dismissing one keeps it dismissed. */
  id: string;
  text: string;
  /** Dev-only notices are styled apart; they never reach a player's build. */
  dev?: boolean;
  /**
   * No timer: it waits to be waved away by hand. For the one kind of notice that reports
   * something already done and not repeatable — missing it would be the silent loss the
   * notice exists to prevent.
   */
  sticky?: boolean;
}

export interface NoticeConditions {
  /** False when this device will not persist progress. */
  durable: boolean;
  /** True when a save from an older schema was found and reset. */
  schemaReset: boolean;
  /** How many Works the one-per-cell migration took down, already paid back. */
  razed: number;
  /** Age of the newest world shard in ms, or null when there is none. */
  worldStirredMs: number | null;
  /** Dev clock running ahead. */
  shifted: boolean;
  offsetDays: number;
}

/**
 * What the one-per-cell migration took, in one sentence (PIVOT-2026-09-09 §6).
 *
 * Exported because the map is not the only place it can be said: a player who opens the
 * Wager from the title screen makes a repository there, and that is where the migration's
 * report would otherwise be consumed and lost. One sentence, one place it is written.
 *
 * It says both halves — what went, and that the cost is already back — because this is
 * the only notice reporting something the game did to the realm without being asked.
 */
export function razedLine(count: number): string {
  const works = count === 1 ? 'One Work' : `${count} Works`;
  return `A hex holds one Work now. ${works} came down, and every stone of it is back in your pouch.`;
}

/** Hours, floored at one — "0 h ago" reads as a bug rather than as freshness. */
function hoursAgo(ms: number): number {
  return Math.max(1, Math.round(ms / 3_600_000));
}

/**
 * The notices that apply right now, minus the ones already dismissed.
 *
 * Order is deliberate: what threatens the player's progress first, what is merely
 * informational last.
 */
export function noticesFor(c: NoticeConditions, dismissed: ReadonlySet<string>): Notice[] {
  const all: Notice[] = [];

  if (!c.durable) {
    all.push({
      id: 'durable',
      text: 'This device will not keep your progress. The Void forgets between visits.',
    });
  }
  if (c.schemaReset) {
    all.push({
      id: 'schema',
      text: 'A sanctuary from an older age was found, and could not be read. It has returned to the Void.',
    });
  }
  if (c.razed > 0) all.push({ id: 'razed', sticky: true, text: razedLine(c.razed) });
  if (c.worldStirredMs !== null) {
    all.push({
      id: 'world',
      text: `Other realms last stirred ${hoursAgo(c.worldStirredMs)} h ago.`,
    });
  }
  if (c.shifted) {
    all.push({
      id: 'clock',
      dev: true,
      text: `Time is running ${c.offsetDays} days ahead · T to advance · Shift+T to return`,
    });
  }

  return all.filter((n) => !dismissed.has(n.id));
}
