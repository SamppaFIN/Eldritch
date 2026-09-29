/**
 * The Season 2 economy's numbers, in one place (BRDC-PROG-001).
 *
 * Straight from Eldritch-Progression.pdf's `HANDOFF · balance.ts`. The document's own
 * instruction is to tune these until telemetry lands within ±20 % of its pacing table
 * (week 1: 5 citizens, 10 cells … week 6: 20 citizens, 70+ cells) — so they are tuned
 * here and nowhere else, the same rule `constants.ts` follows for the territory game.
 */

export const BALANCE = {
  /** Food per citizen per hour, working or not. */
  eatPerCitizen: 2,
  /** Hours at an empty granary before the least useful worker leaves. */
  starveGraceH: 6,
  /** Production accrues this long, then stops until collected at the Keep. */
  storageH: 12,
  /** Wisdom per tech, by Age I…V. */
  ageCost: [30, 80, 160, 280, 450],
  /** Techs of an Age (of four) needed to enter the next. */
  ageAdvance: 3,
  doomMax: 13,
  doomEveryNDawns: 3,
  gateOpenDoomH: 48,
  /** Clues to seal a gate outright; Elder Signs makes it 3. */
  sealClues: 5,
  clueCap: 8,
  /** A die succeeds on this or higher; blessed 4, cursed 6. */
  successOn: 5,
} as const;

/** Food to grow from `n` citizens to `n + 1`: 29, 68, 125 … 365 at n = 15. */
export const growBox = (n: number): number => 20 + 8 * n + n * n;

/** How many the realm can house at a Keep level (Manors add 3 each, PROG-006). */
export const housing = (keepLevel: number): number => 3 + 3 * keepLevel;

/** Worker slots at a building level: 1, 2, 2, 3, 3 … */
export const slots = (level: number): number => 1 + Math.floor(level / 2);

/**
 * Culture for the `n`th cell: 50 at 10, 277 at 50 (PROG-003). Floored, not rounded: the
 * document's handoff says `Math.round`, but its own worked numbers (50, 277) are floors
 * — 50 → 277.8 — and the worked numbers are what a player is told.
 */
export const claimCost = (n: number): number => Math.floor(8 + 3 * n ** 1.15);

/** The `k`th copy of a building costs 1.25× the one before it (PROG-003). */
export const copyCost = (base: number, k: number): number => Math.round(base * 1.25 ** (k - 1));
