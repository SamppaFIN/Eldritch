/**
 * The season's seed, salting where things are (BRDC-SEASON-007).
 *
 * Eldritch-season.pdf: "Same shoreline, new seed. Deposits, wonders and gate sites have
 * all moved." The ground itself (terrain) stays; what lies on it moves: deposits
 * (`bounty.ts`), anomaly sites and kinds (`reveal.ts`, `anomaly.ts`). Wonders do not move
 * — Infinite 2026-09-29 overruled the document (SEASON-008). Gates and rumours already
 * take the seed directly.
 *
 * One module value, set once when the shared season is read (`SeasonGate`). Empty — every
 * Season 1 day, and every test — the salt adds nothing and every hash reads as it always did.
 */
let salt = '';

export function setSeasonSalt(seed: string | null): void {
  salt = seed ? `${seed}:` : '';
}

/** Prefix for a hash key: `hash(\`bounty:${seasonSalt()}${h3}\`)`. */
export const seasonSalt = (): string => salt;
