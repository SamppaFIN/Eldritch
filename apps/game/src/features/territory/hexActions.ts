/**
 * Every action a hex offers, in one fixed order, for the row at the top of its card
 * (BRDC-DETAIL-003). The same action is always in the same place; only the ones this hex
 * can offer are listed.
 */

/** Pressing does it at once. */
export type PressId = 'quest' | 'reveal' | 'ward' | 'page' | 'consecrate' | 'expand';
/** Pressing opens its own section under the row — it needs a choice first. */
export type SectionId = 'works' | 'school' | 'rites' | 'trade' | 'city' | 'anomaly';
export type ActionId = PressId | SectionId;

export interface CellAction {
  id: ActionId;
  label: string;
  opens: boolean;
  disabled: boolean;
  /** Why it is disabled, said as what to do about it. */
  why: string | null;
}

export interface Gate {
  label: string;
  disabled?: boolean;
  why?: string | null;
}

/** What this hex offers. Absent = not offered here. */
export type CellOffer = Partial<Record<PressId, Gate>> & Partial<Record<SectionId, string>>;

export const ACTION_ORDER: readonly ActionId[] = [
  'quest',
  'reveal',
  'ward',
  'page',
  'works',
  'consecrate',
  'expand',
  'school',
  'rites',
  'trade',
  'city',
  'anomaly',
];

const PRESS: ReadonlySet<ActionId> = new Set<ActionId>(['quest', 'reveal', 'ward', 'page', 'consecrate', 'expand']);

export function cellActions(offer: CellOffer): CellAction[] {
  const out: CellAction[] = [];
  for (const id of ACTION_ORDER) {
    const o = offer[id];
    if (o === undefined) continue;
    if (PRESS.has(id)) {
      const g = o as Gate;
      out.push({ id, label: g.label, opens: false, disabled: g.disabled ?? false, why: g.disabled ? (g.why ?? null) : null });
    } else {
      out.push({ id, label: o as string, opens: true, disabled: false, why: null });
    }
  }
  return out;
}
