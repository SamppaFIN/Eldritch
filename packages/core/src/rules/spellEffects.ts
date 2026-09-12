/**
 * What a running Rite does, and the numbers it does it with (BRDC-SPELL-002).
 *
 * Split out of `spell.ts` when three more Rites took it past four hundred lines.
 * `spell.ts` is the table and the casting — what a Rite *is* and whether you may cast it;
 * this is what one already cast *does*. They change for different reasons: a cost is
 * balance, an effect is mechanics.
 */
import { SPELLS, activeSpells } from './spell.js';
import type { ActiveSpell } from './spell.js';
import type { ResourcePool } from './terrain.js';
import { emptyCell } from './capture.js';
import { cellsWithin } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';

const HOUR = 3_600_000;

/**
 * The decay-clock time a fresh Bulwark grants a cell (BRDC-SPELL-001).
 *
 * Baked into `Cell.shelteredMs` at cast, not applied from the running spell — the hours
 * are bought once and stay off the clock even after the spell's countdown ends.
 */
export const BULWARK_SHELTER_MS = SPELLS.bulwark.durationMs;

/**
 * Decay-clock time Aegis grants each cell it covers (BRDC-SPELL-002).
 *
 * Shorter per cell than Bulwark's, because it covers nineteen of them. The trade is
 * breadth against depth, which is the whole reason to have both.
 */
export const AEGIS_SHELTER_MS = 12 * HOUR;

/** Scrying's reach at Consciousness 1, in rings. Three is thirty-seven hexes. */
export const SCRY_BASE_REACH = 3;
/** Consciousness levels per extra ring. */
export const SCRY_LEVELS_PER_RING = 4;
/** Rings Scrying will ever reach, however high the level climbs. */
export const SCRY_MAX_REACH = 8;

/**
 * How far Scrying sees at a given Consciousness level (BRDC-SPELL-002).
 *
 * The ticket asks for range and duration in `constants.ts`. They are here instead, for the
 * reason this file already gives about `cost`, `durationMs` and `reach`: these are numbers
 * belonging to one Rite, and the table is where a Rite's numbers live. `constants.ts` is
 * also full at 395 of its 400 lines, and splitting the single source of truth to add three
 * numbers that have a better home would be the wrong trade.
 *
 * Capped, because the map is not the game: a Rite that showed a whole city would replace
 * walking with reading, and at eight rings it already shows 217 hexes.
 */
export function scryReach(level: number): number {
  const rings = SCRY_BASE_REACH + Math.floor(Math.max(1, level) / SCRY_LEVELS_PER_RING);
  return Math.min(SCRY_MAX_REACH, rings);
}

/**
 * The per-hour resource bonus from every running `domain` spell.
 *
 * Folds in beside `buildingBonus` and `manaBonus` in `pouch.ts#perHourBonus`; that is the
 * whole wiring of the research school. `{}` when nothing is running.
 */
export function domainSpellBonus(
  spells: readonly ActiveSpell[],
  now: number,
): Partial<ResourcePool> {
  const out: Partial<ResourcePool> = {};
  for (const s of activeSpells(spells, now)) {
    const bonus = SPELLS[s.id].domainBonusPerH;
    if (!bonus || SPELLS[s.id].scope !== 'domain') continue;
    for (const [k, v] of Object.entries(bonus) as [keyof ResourcePool, number][]) {
      out[k] = (out[k] ?? 0) + v;
    }
  }
  return out;
}

/**
 * The hexes a running Scrying is showing right now (BRDC-SPELL-002).
 *
 * Ownerless cells built on the spot from the running spell, never read from a store and
 * never written to one. That is the whole mechanism behind "magic shows and forgets": when
 * `activeSpells` drops the expired scry, these stop being produced and the ground goes
 * dark again by itself. No cleanup, no timer, nothing to sweep — the same read-time model
 * as decay.
 *
 * These are candidates, not replacements: the caller merges them behind whatever it
 * already has, so a scry can never paint over ground that is held, decaying or carrying a
 * Work. Without this the Rite would be invisible — it writes nothing, so if nobody built
 * its cells nobody would ever see what 55 mana bought.
 */
export function scriedCells(
  active: readonly ActiveSpell[],
  level: number,
  now: number,
): Cell[] {
  const out: Cell[] = [];
  const seen = new Set<string>();
  for (const spell of activeSpells(active, now)) {
    if (spell.id !== 'scrying' || !spell.target) continue;
    for (const h3 of cellsWithin(spell.target, scryReach(level))) {
      if (seen.has(h3)) continue;
      seen.add(h3);
      out.push(emptyCell(h3));
    }
  }
  return out;
}
