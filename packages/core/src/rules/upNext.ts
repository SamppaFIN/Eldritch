/**
 * What finishes next (BRDC-NEXT-001) — 4X's "one more turn" made visible: the next Lore
 * the wisdom will pay for, the next citizen, the stores running out, a task nearly done.
 *
 * Pure. The caller reads the store views and hands in rows; this only says how long and
 * which three come first: anything with a clock, soonest first, then progress, furthest
 * along first.
 */
export interface UpNextItem {
  id: string;
  /** What finishes: "Lookouts", "Next citizen", "Cornelius Needs Company". */
  label: string;
  /** Hours until it is done or due; 0 = now. Absent for progress-only rows. */
  hours?: number;
  have?: number;
  need?: number;
}

/** Hours until `have` reaches `cost` at `perHour`; 0 if already there, null if it never will. */
export function hoursToAfford(cost: number, have: number, perHour: number): number | null {
  if (have >= cost) return 0;
  if (perHour <= 0) return null;
  return (cost - have) / perHour;
}

const fraction = (i: UpNextItem) => (i.need ? (i.have ?? 0) / i.need : 0);

export function rankUpNext(items: readonly UpNextItem[], limit = 3): UpNextItem[] {
  const timed = items.filter((i) => i.hours !== undefined).sort((a, b) => (a.hours as number) - (b.hours as number));
  const progress = items.filter((i) => i.hours === undefined && i.need).sort((a, b) => fraction(b) - fraction(a));
  return [...timed, ...progress].slice(0, limit);
}

/** "now" · "40 min" · "5 h" · "2 d" — what a row says for its clock. */
export function whenText(hours: number): string {
  if (hours <= 0) return 'now';
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${Math.round(hours)} h`;
  return `${Math.round(hours / 24)} d`;
}

/** One row as the strip says it: "Lookouts 2 h", "Cornelius Needs Company 3/5", or the bare label. */
export function upNextText(i: UpNextItem): string {
  if (i.hours !== undefined) return `${i.label} ${whenText(i.hours)}`;
  if (!i.need) return i.label;
  return `${i.label} ${i.have ?? 0}/${i.need ?? 0}`;
}
