/**
 * Which cells the map is allowed to draw (BRDC-MAP-002, BRDC-SPELL-002).
 *
 * Two rules, and they pull in opposite directions, which is why they live together:
 *
 * - **Fog of war** hides everything but owned ground and its ring, so the map is something
 *   you uncover by walking rather than something you are handed.
 * - **Scrying** lifts that fog wherever it is looking, and only while it runs. Its hexes
 *   are built here from the running spell and written nowhere at all — when the Rite
 *   expires they stop being produced and the ground goes dark again by itself. No timer,
 *   no cleanup, the same read-time model as decay.
 *
 * Lifted out of `MapView`, which was at its four-hundred-line ceiling for the third time
 * in a day. This is a real seam rather than a place to put spare lines: it answers one
 * question, and both halves of the answer belong to it.
 */
import { useEffect, useMemo, useState } from 'react';
import { levelState, scriedCells } from '@es3/core';
import type { ActiveSpell, Cell, GameRepository } from '@es3/core';
import { withFogOfWar } from './territoryFeatures.js';

export interface UseShownCellsOptions {
  /** Everything the store knows about in the viewport. */
  cells: readonly Cell[];
  /** The player's own ground, which is what the fog opens around. */
  owned: readonly Cell[];
  /** Running Rites, read for any Scrying among them. */
  active: readonly ActiveSpell[];
  /** The caster's XP — Scrying's reach grows with Consciousness. */
  xp: number;
  now: () => number;
  /** Read for the hexes seen from afar and revealed, which the fog stays lifted over. */
  repository?: GameRepository | null;
}

export function useShownCells({ cells, owned, active, xp, now, repository = null }: UseShownCellsOptions): Cell[] {
  // Re-read whenever the ground changes: building, staffing and rites all refresh it.
  const [seen, setSeen] = useState<ReadonlySet<string>>(new Set());
  useEffect(() => {
    if (!repository) return;
    let live = true;
    void Promise.all([repository.getSighted(), repository.getRevealed()]).then(([s, r]) => {
      if (live) setSeen(new Set([...Object.keys(s), ...Object.keys(r)]));
    });
    return () => {
      live = false;
    };
  }, [repository, cells, owned]);
  // The level, not the XP: every step's few XP used to hand the map a fresh array and a
  // full rebuild, and only the level changes what a Scrying sees (BRDC-PERF-002).
  const level = levelState(xp).level;
  return useMemo(
    () => withFogOfWar(cells, owned, scriedCells(active, level, now()), seen),
    // `now` is a function identity, stable for the session; the real triggers are above it.
    [cells, owned, active, level, now, seen],
  );
}
