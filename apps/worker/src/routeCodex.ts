/**
 * Route mode's own leaderboard, split out of `index.ts` for the same reason `clan.ts`
 * and `history.ts` already are — a self-contained concern `index.ts`'s routes call into
 * rather than own (BRDC-MODE-002).
 *
 * Route mode's promise (CLAUDE.md §10) is that it measures nothing the Adventure Codex
 * does — no consciousness, no works, no provinces. That means splitting `live` in two
 * before either table is built, not filtering rows out of one shared result.
 */
import type { WorldSource } from '@es3/core/data';

/** One shared-world KV key for the whole table, like `CODEX`/`CLAN_CODEX` in `index.ts`. */
export const ROUTE_CODEX = 'route-codex';

export function splitByMode(live: WorldSource[]): {
  adventurers: WorldSource[];
  routers: WorldSource[];
} {
  const routers = live.filter((s) => s.mode === 'route');
  const adventurers = live.filter((s) => s.mode !== 'route');
  return { adventurers, routers };
}
