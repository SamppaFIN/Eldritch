/**
 * The words and figures a building page says (BRDC-WORKS-001). Pure, so the page's copy
 * can be tested without rendering it.
 */
import { BUILDINGS, RESOURCE_KINDS, activeEffects } from '@es3/core';
import type { BuildingDef, BuildingId, Effect, NodeState, ResourceKind, ResourcePool, WorksRefusal } from '@es3/core';

export const ROMAN = ['I', 'II', 'III', 'IV', 'V'] as const;

/** A state is never colour alone (§14): a mark and a word, always. */
export const STATE_LABEL: Readonly<Record<NodeState, string>> = {
  learned: '✓ Learned',
  available: '◆ Available',
  locked: '○ Locked',
  closed: 'Closed by choice',
  dormant: '○ Not yet awake',
};

/** Errors say what to do (§14). */
export const REFUSAL_TEXT: Readonly<Record<WorksRefusal | 'no-work', string>> = {
  'not-yours': 'This is not your ground. Step onto it to take it.',
  unknown: 'That research is not part of this building.',
  already: 'Already learned here.',
  locked: 'Learn the tier above it first.',
  closed: 'The other choice on this tier was taken. It stays closed.',
  dormant: 'The game cannot do this yet. It wakes in a later update.',
  short: 'Not enough in the pouch yet.',
  'no-work': 'Nothing stands here to research.',
};

/** What a building gives an hour: its own base, a place's mana, and what it has learned. */
export function givesOf(def: BuildingDef, learned: readonly string[], placeMana = 0): Partial<ResourcePool> {
  const out: Partial<ResourcePool> = {};
  const add = (k: ResourceKind, v: number) => {
    if (v !== 0) out[k] = (out[k] ?? 0) + v;
  };
  if (def.kind in BUILDINGS) {
    const base = BUILDINGS[def.kind as BuildingId].produces ?? {};
    for (const [k, v] of Object.entries(base) as [ResourceKind, number][]) add(k, v);
  }
  if (placeMana > 0) add('mana', placeMana);
  for (const e of activeEffects(def, learned)) {
    if (e.kind === 'produce') for (const [k, v] of Object.entries(e.yields) as [ResourceKind, number][]) add(k, v);
  }
  return out;
}

/** The resource an effect is about, for the colour of its highlighted words. */
export function effectResource(effects: readonly Effect[]): ResourceKind | null {
  for (const e of effects) {
    if (e.kind === 'produce') {
      const first = RESOURCE_KINDS.find((k) => (e.yields[k] ?? 0) > 0);
      if (first) return first;
    }
    if (e.kind === 'producePer' || e.kind === 'storageCap' || e.kind === 'produceFrom' || e.kind === 'worksMult') return e.resource;
    if (e.kind === 'convert') return e.to;
    if (e.kind === 'depositBonus') return e.resource;
  }
  return null;
}

/** "Short 20 stone" — what is missing, not what failed. */
export function shortLine(cost: Partial<ResourcePool>, pool: ResourcePool | null, word: (k: ResourceKind) => string): string | null {
  const parts = (Object.entries(cost) as [ResourceKind, number][])
    .map(([k, v]) => [k, v - (pool?.[k] ?? 0)] as const)
    .filter(([, gap]) => gap > 0)
    .map(([k, gap]) => `${gap} ${word(k)}`);
  return parts.length > 0 ? `Short ${parts.join(' and ')}.` : null;
}
