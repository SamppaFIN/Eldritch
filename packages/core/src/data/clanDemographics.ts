/**
 * Clans, measured against each other the same way realms are (BRDC-CLAN-002).
 *
 * `demographicsOf` (`demographics.ts`) already knows how to rank any `Measurable[]` —
 * it does not know or care whether a row is one player or many. The only new thing a
 * clan league needs is folding a clan's members into **one** synthetic `Measurable`
 * before that same, already-tested function runs.
 */
import type { Measurable } from './demographics.js';
import type { WorldSource } from './world.js';

/**
 * One synthetic realm per clan, summed from its members. A player who published no
 * `clanId` is in no clan and contributes to none of these rows.
 *
 * `name` is the clan's own id — this function only ever sees `WorldSource`, which
 * carries no clan name, only the code. The Worker resolves the real name afterwards
 * from `clan:<id>` in KV, the one place it is stored.
 *
 * `level` is the **highest** member's level, not a sum: level is a measure of one
 * realm's own progress, not a quantity that grows by having more members.
 */
export function clanMeasurables(sources: readonly WorldSource[]): Measurable[] {
  const byClan = new Map<string, WorldSource[]>();
  for (const source of sources) {
    if (!source.clanId) continue;
    const members = byClan.get(source.clanId) ?? [];
    members.push(source);
    byClan.set(source.clanId, members);
  }

  return [...byClan.entries()].map(([clanId, members]) => ({
    id: clanId,
    name: clanId,
    cells: members.flatMap((m) => m.cells),
    level: Math.max(...members.map((m) => m.level ?? 1)),
    leyM: members.reduce((sum, m) => sum + (m.leyM ?? 0), 0),
  }));
}
