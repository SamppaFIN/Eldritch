/**
 * The week's golden or dark age (BRDC-AGE-001) — Civ VI's ages made weekly: a week whose
 * Legacy grew well past the one before is golden, one that fell far behind is dark.
 *
 * Decided on the week's first look (Monday, UTC) from three marks — the Legacy subtotal
 * seen at the start of this week, last week and the week before. A golden week makes
 * 10 % more of everything and offers one boon; a dark week makes 10 % less but leaves a
 * promise: the next golden week needs only to match the last, not beat it by a fifth.
 * Without three marks in a row — the season's first weeks, or a week away — it is plain.
 *
 * Pure.
 */
import type { ResourcePool } from './terrain.js';

export type WeekKind = 'golden' | 'dark' | 'plain';
export type BoonId = 'tithe' | 'harvest' | 'vision';

export const GOLDEN_AT = 1.2;
/** With a dark week's promise held, matching the week before is enough. */
export const GOLDEN_PROMISED_AT = 1;
export const DARK_AT = 0.6;
export const WEEK_FACTOR: Readonly<Record<WeekKind, number>> = { golden: 1.1, dark: 0.9, plain: 1 };

export const BOONS: Readonly<Record<BoonId, { name: string; perHour: Partial<ResourcePool> }>> = {
  tithe: { name: 'Tithe of Coin', perHour: { gold: 3 } },
  harvest: { name: 'Long Harvest', perHour: { food: 3 } },
  vision: { name: 'Clear Vision', perHour: { wisdom: 2 } },
};
export const BOON_IDS: readonly BoonId[] = ['tithe', 'harvest', 'vision'];

export const WEEK_NAME: Readonly<Record<WeekKind, string>> = { golden: 'A golden week', dark: 'A dark week', plain: 'An ordinary week' };

/** Golden, dark or plain, from what each of the last two weeks added to the Legacy. */
export function ageFor(lastWeek: number, weekBefore: number, promised = false): WeekKind {
  // Nothing gained the week before: any growth at all is a golden week.
  if (weekBefore <= 0) return lastWeek > 0 ? 'golden' : 'plain';
  if (lastWeek >= weekBefore * (promised ? GOLDEN_PROMISED_AT : GOLDEN_AT)) return 'golden';
  if (lastWeek <= weekBefore * DARK_AT) return 'dark';
  return 'plain';
}

/** The Monday (UTC) a moment's week starts on, `YYYY-MM-DD`. */
export function weekKey(now: number): string {
  const d = new Date(now);
  const back = (d.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - back)).toISOString().slice(0, 10);
}

const weekBefore = (key: string): string => weekKey(Date.parse(`${key}T00:00:00Z`) - 86_400_000);

export interface WeekState {
  /** The week this record speaks for. */
  week: string;
  kind: WeekKind;
  /** The Legacy subtotal first seen in each recent week, by `weekKey`. */
  marks: Record<string, number>;
  /** A dark week's promise, held until a golden week spends it. */
  promise?: true;
  /** The golden week's boon, once chosen. */
  boon?: BoonId;
}

/** Turn the record over to `now`'s week, marking `legacy` as its start. Same week: unchanged. */
export function rollWeek(state: WeekState | undefined, now: number, legacy: number): WeekState {
  const week = weekKey(now);
  if (state?.week === week) return state;
  const last = weekBefore(week);
  const before = weekBefore(last);
  const marks = { [before]: state?.marks[before], [last]: state?.marks[last], [week]: legacy };
  const kept = Object.fromEntries(Object.entries(marks).filter(([, v]) => v !== undefined)) as Record<string, number>;
  const a = marks[before];
  const b = marks[last];
  const kind = a !== undefined && b !== undefined ? ageFor(legacy - b, b - a, !!state?.promise) : 'plain';
  const promise = kind === 'dark' || (kind !== 'golden' && state?.promise);
  return { week, kind, marks: kept, ...(promise ? { promise: true as const } : {}) };
}

/** The factor and boon a stored record gives at `now` — plain if it speaks for another week. */
export function weekEffect(state: WeekState | undefined, now: number): { factor: number; kind: WeekKind; boon?: BoonId } {
  if (!state || state.week !== weekKey(now)) return { factor: 1, kind: 'plain' };
  return { factor: WEEK_FACTOR[state.kind], kind: state.kind, ...(state.kind === 'golden' && state.boon ? { boon: state.boon } : {}) };
}

export const boonBonus = (boon: BoonId | undefined): Partial<ResourcePool> => (boon ? { ...BOONS[boon].perHour } : {});
