/**
 * Conditions (BRDC-CONDITION-001) — Eldritch Horror's lasting consequences: a failed
 * rumour or task can leave a card on the investigator, each with a price and a way out.
 *
 * Every one ends on its own clock, so none can lock the game. Two lift sooner by walking —
 * Paranoia when you walk your Hearth hex again, a Curse when you walk a temple — read from
 * the cells' own `lastVisitedAt`, so no step has to remember them. A Debt is paid in the
 * Keep; left unpaid it takes your weakest hex when it falls due. A Dark Pact gives dice
 * now and takes sanity when it ends.
 *
 * Pure. Durations and prices are defaults (Infinite tunes them).
 */
import type { Investigator, Luck, Skill } from './investigator.js';
import type { Cell, H3Index } from '../types/domain.js';

export type ConditionId = 'debt' | 'paranoia' | 'cursed' | 'amnesia' | 'blessed' | 'dark-pact';

export interface ConditionDef {
  name: string;
  /** What it does, as the Keep says it. */
  text: string;
  /** How it ends sooner, if it can. */
  cure: string;
  hours: number;
}

const H = 3_600_000;
export const DEBT_GOLD = 50;
export const PACT_SANITY = 3;

export const CONDITIONS: Readonly<Record<ConditionId, ConditionDef>> = {
  debt: { name: 'Debt', text: `You owe ${DEBT_GOLD} gold. Unpaid, it takes your weakest hex.`, cure: `Pay ${DEBT_GOLD} gold in the Keep.`, hours: 72 },
  paranoia: { name: 'Paranoia', text: 'Wit tests roll one die fewer.', cure: 'Walk your Hearth hex.', hours: 48 },
  cursed: { name: 'Cursed', text: 'Only a 6 succeeds on any test.', cure: 'Walk a temple.', hours: 48 },
  amnesia: { name: 'Amnesia', text: 'Clues cannot be spent on a reroll.', cure: 'It passes in a day.', hours: 24 },
  blessed: { name: 'Blessed', text: 'A 4 or better succeeds on any test.', cure: 'It fades in a day.', hours: 24 },
  'dark-pact': { name: 'Dark Pact', text: `Lore tests roll two dice more. When it ends, it takes ${PACT_SANITY} sanity.`, cure: 'It cannot be broken.', hours: 72 },
};

export interface HeldCondition {
  id: ConditionId;
  /** When it came. */
  at: number;
}

const endsAt = (c: HeldCondition) => c.at + CONDITIONS[c.id].hours * H;

/** The conditions still running at `now`. */
export const activeConditions = (inv: Investigator, now: number): HeldCondition[] =>
  (inv.conditions ?? []).filter((c) => endsAt(c) > now);

export const hasCondition = (inv: Investigator, id: ConditionId, now: number): boolean =>
  activeConditions(inv, now).some((c) => c.id === id);

/** A condition comes; one already held starts its clock again. */
export function gainCondition<T extends Investigator>(inv: T, id: ConditionId, now: number): T {
  return { ...inv, conditions: [...(inv.conditions ?? []).filter((c) => c.id !== id), { id, at: now }] };
}

export function dropCondition<T extends Investigator>(inv: T, id: ConditionId): T {
  return { ...inv, conditions: (inv.conditions ?? []).filter((c) => c.id !== id) };
}

/** The dice conditions add to a test of this skill. */
export function conditionDice(inv: Investigator, skill: Skill, now: number): number {
  let n = 0;
  if (skill === 'observe' && hasCondition(inv, 'paranoia', now)) n -= 1;
  if (skill === 'lore' && hasCondition(inv, 'dark-pact', now)) n += 2;
  return n;
}

/** The luck conditions impose; Cursed and Blessed together cancel out. */
export function conditionLuck(inv: Investigator, now: number): Luck | null {
  const cursed = hasCondition(inv, 'cursed', now);
  const blessed = hasCondition(inv, 'blessed', now);
  if (cursed === blessed) return null;
  return cursed ? 'cursed' : 'blessed';
}

/** Lift what walking has lifted: Paranoia on the Hearth hex, a Curse on a temple. */
export function cureByWalking<T extends Investigator>(inv: T, owned: readonly Cell[], home: H3Index | null, temples: ReadonlySet<H3Index>): T {
  const walked = (c: HeldCondition, where: (h3: H3Index) => boolean) => owned.some((cell) => where(cell.h3) && cell.lastVisitedAt > c.at);
  const kept = (inv.conditions ?? []).filter((c) => {
    if (c.id === 'paranoia') return !walked(c, (h) => h === home);
    if (c.id === 'cursed') return !walked(c, (h) => temples.has(h));
    return true;
  });
  return kept.length === (inv.conditions ?? []).length ? inv : { ...inv, conditions: kept };
}

/** What fell due by `now`: the conditions that ended, and the prices they leave. */
export function dueConditions(inv: Investigator, now: number): { ended: HeldCondition[]; debt: boolean; pact: boolean } {
  const ended = (inv.conditions ?? []).filter((c) => endsAt(c) <= now);
  return { ended, debt: ended.some((c) => c.id === 'debt'), pact: ended.some((c) => c.id === 'dark-pact') };
}

/** The hex an unpaid debt takes: the weakest you hold that is not the Hearth. */
export function seizedBy(owned: readonly Cell[], home: H3Index | null): H3Index | null {
  const pool = owned.filter((c) => c.h3 !== home).sort((a, b) => a.strength - b.strength || a.h3.localeCompare(b.h3));
  return pool[0]?.h3 ?? null;
}
