/**
 * Who your investigator is (BRDC-INVEST-001, handoff F-40/F-41): four archetypes, each one
 * skill raised and one ability in the realm. Chosen once per kingdom (D2) and kept with
 * the investigator, so the season wipe clears it and the next kingdom chooses again.
 *
 * The skill test stays the one dice pool (`rollTest`, Infinite 2026-10-05): `resolveCheck`
 * only names the act. Sanity at zero is the same 12 h sent home as ever (D3, `afterTest`).
 *
 * Pure. The abilities are read where they act: the yield rules (Librarian), a Watchtower's
 * sight (Surveyor), a Work's price (Dockworker), the anomalies listed (Medium).
 */
import raw from './investigators.json';
import { diceFor, luckFor, rollTest } from './investigator.js';
import type { Investigator, Roll, Skill } from './investigator.js';
import type { ResourceKind, ResourcePool } from './terrain.js';

export type ArchetypeId = 'librarian' | 'surveyor' | 'dockworker' | 'medium';

export interface Archetype {
  id: ArchetypeId;
  name: string;
  title: string;
  /** The skill raised to `ARCHETYPE_SKILL` on choosing. */
  skill: Skill;
  perk: string;
  story: string;
}

export const ARCHETYPES = raw as readonly Archetype[];
export const archetypeOf = (id: ArchetypeId | undefined): Archetype | null => ARCHETYPES.find((a) => a.id === id) ?? null;

/** What the chosen skill is raised to — never lowered if it already stands higher. */
export const ARCHETYPE_SKILL = 4;
/** The Librarian: wisdom produced in the realm, +20 %. */
export const LIBRARIAN_WISDOM = 0.2;
/** The Surveyor: rings a Watchtower sees beyond its own. */
export const SURVEYOR_SIGHT = 1;
/** The Dockworker: off every Work's price. */
export const DOCKWORKER_DISCOUNT = 0.1;
/** The Medium: rings beyond your ground where anomalies show. */
export const MEDIUM_RINGS = 1;

/** The skills as the screen names them; the code keeps its own words. */
export const SKILL_NAME: Readonly<Record<Skill, string>> = { will: 'Will', lore: 'Lore', fight: 'Vigor', observe: 'Wit' };

/** Choose once. A kingdom that already chose keeps its investigator as it is. */
export function chooseArchetype<T extends Investigator>(inv: T, id: ArchetypeId): T {
  if (inv.archetype) return inv;
  const a = archetypeOf(id);
  if (!a) return inv;
  return { ...inv, archetype: id, skills: { ...inv.skills, [a.skill]: Math.max(inv.skills[a.skill], ARCHETYPE_SKILL) } };
}

/** A Work's price for this investigator: the Dockworker's tenth off, each part floored. */
export function priceFor(cost: Readonly<Partial<ResourcePool>>, archetype: ArchetypeId | undefined): Readonly<Partial<ResourcePool>> {
  if (archetype !== 'dockworker') return cost;
  const out: Partial<ResourcePool> = {};
  for (const [k, v] of Object.entries(cost) as [ResourceKind, number][]) out[k] = Math.floor(v * (1 - DOCKWORKER_DISCOUNT));
  return out;
}

export interface Check {
  skill: Skill;
  /** Successes needed. */
  need: number;
}

/** A skill test, by name: the investigator's dice and luck on the one dice pool. */
export function resolveCheck(inv: Investigator, check: Check, rng: () => number, now = 0): Roll {
  return rollTest(diceFor(inv, check.skill, now), check.need, luckFor(inv, now), rng);
}
