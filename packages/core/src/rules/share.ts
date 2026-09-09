/**
 * How a contested cell's yield divides (PIVOT-2026-09-09 §5).
 *
 * Split out of `terrain.ts` at its four-hundred-line ceiling, and it earns its own file:
 * the same fraction answers two questions — what the pouch collects from a shared hex,
 * and what the detail card shows as the ownership ring. One rule, one place.
 */
import type { Cell } from '../types/domain.js';

/**
 * The fraction of a cell's trickle the local player keeps.
 *
 * `1` for ground held outright. A cell an imported challenge also claims (`cell.shared`)
 * is split by **the separate days each side has walked it** (PIVOT-2026-09-09 §5): a
 * share earned by turning up is one a player can go and change, where a share fixed by
 * who happened to be stronger when a message was imported is not. Strength at import is
 * the fallback — for a tag written before days travelled, and for a real tie — and an
 * even split the last resort. Reinforcing on a new day drops `shared` entirely.
 *
 * Both day counts must be numbers: an absent one means "this import carried no days",
 * which is not "they were never here", and reading it as zero hands over the whole cell.
 */
export function localShare(cell: Cell): number {
  const s = cell.shared;
  if (!s) return 1;
  const { myDays: mine, theirDays: theirs } = s;
  if (typeof mine === 'number' && typeof theirs === 'number' && mine + theirs > 0 && mine !== theirs) {
    return mine / (mine + theirs);
  }
  const total = s.mineAtImport + s.theirsAtImport;
  if (total > 0 && s.mineAtImport !== s.theirsAtImport) return s.mineAtImport / total;
  return 0.5;
}
