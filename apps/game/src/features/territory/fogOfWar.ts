/**
 * Which cells the map draws at all — split out of `territoryFeatures.ts` at its line
 * ceiling when the weather (BRDC-WEATHER-001) began to move how far the fog lifts.
 */
import { cellsWithin, emptyCell } from '@es3/core';
import type { Cell } from '@es3/core';

/**
 * Fog of war: the only cells the map draws are the ones you hold, the ring of cells
 * around them, and what you have seen — revealed, or sighted from afar. A rival's ground
 * from the shared world is drawn only there (2026-09-30; until then every imported cell
 * showed, BRDC-WAGER-JSON-006). A clanmate's ground always shows. Everything else is
 * left as bare basemap.
 *
 * A neighbour with no stored cell of its own still appears — as `emptyCell(h3)` — so it
 * can carry the pale reveal tint and its terrain glyph. The full set stays available to
 * the rest of the game (selection, the rival compass); only what reaches the map is
 * narrowed here.
 */
export function withFogOfWar(
  all: readonly Cell[],
  owned: readonly Cell[],
  /** A running Scrying lifts the fog where it looks, and only while it runs. */
  scried: readonly Cell[] = [],
  /** Hexes seen for good — sighted from afar (a Watchtower, Dream-Sight) or revealed. */
  seen: ReadonlySet<string> = new Set(),
  /** Rings past your ground the map shows: 1, or 0 in fog and 2 on a clear day (BRDC-WEATHER-001). */
  rings = 1,
): Cell[] {
  // Owned first, so a held cell outside the viewport read never draws as bare ground and
  // then flicks purple when the next refresh lands (BRDC-PERF-002).
  const byH3 = new Map([...owned, ...all].map((c) => [c.h3, c]));
  const visible = new Set<string>();
  for (const cell of owned) {
    for (const n of cellsWithin(cell.h3, rings)) visible.add(n);
  }
  // Seen ground stays lifted, and a rival's shows only there (field report 2026-09-30:
  // *"näen jo punaisella yhden alueen"*). A clanmate's ground is shared sight.
  for (const h3 of seen) visible.add(h3);
  for (const cell of all) if (cell.imported && cell.ally) visible.add(cell.h3);
  // Added here rather than merged into `all`, because this is exactly what the Rite does:
  // it lifts the fog, it does not create ground. Nothing about it is written anywhere, so
  // when the spell stops running these simply stop arriving (BRDC-SPELL-002).
  for (const cell of scried) visible.add(cell.h3);
  return [...visible].map((h3) => byH3.get(h3) ?? emptyCell(h3));
}
