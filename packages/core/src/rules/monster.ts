/**
 * Creatures that walk (BRDC-MONSTER-001) — Arkham Horror's moving monsters: about one gate
 * in two lets something out, and it comes for the Keep, one ring a day along the shortest
 * road. Where it reaches your ground the hex loses strength, once per hex; standing on the
 * hex it is on, the investigator may face it on Vigor. Left alone, it wanders off after a
 * week.
 *
 * Everything is read from the gate and the clock — where it is now is a function, never a
 * position someone stored.
 *
 * Pure.
 */
import { hexPath } from '../geo/cells.js';
import type { Gate } from './gate.js';
import type { H3Index } from '../types/domain.js';

export const MONSTER_SHARE = 0.5;
export const MONSTER_BITE = 50;
export const MONSTER_NEED = 2;
export const MONSTER_LIFE_DAYS = 7;
const DAY_MS = 86_400_000;

export interface Creature {
  gateId: string;
  name: string;
  /** Where it stands now. */
  h3: H3Index;
  /** Every hex it has walked so far, its own included — what it has bitten. */
  walked: readonly H3Index[];
  /** At the Keep: it goes no further. */
  arrived: boolean;
}

const NAMES = ['A Thing of Wet Feathers', 'The Long-Armed Swimmer', 'A Shape in a Borrowed Coat', 'The Crawling Choir-Boy', 'A Hound of Angles'];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** Does this gate let something out? The same answer for everyone. */
export const releases = (gateId: string): boolean => hash(`monster:${gateId}`) < MONSTER_SHARE;

/** The creature a gate let out, where it is at `now` — or null: none, gone, or nowhere to go. */
export function creatureAt(gate: Gate, keep: H3Index | null, now: number): Creature | null {
  if (!keep || !releases(gate.id)) return null;
  const days = Math.floor((now - gate.openedAt) / DAY_MS);
  if (days < 0 || days >= MONSTER_LIFE_DAYS) return null;
  const road = hexPath(gate.h3, keep);
  const at = Math.min(days, road.length - 1);
  return {
    gateId: gate.id,
    name: NAMES[Math.floor(hash(`name:${gate.id}`) * NAMES.length)] as string,
    h3: road[at] as H3Index,
    walked: road.slice(0, at + 1),
    arrived: at === road.length - 1,
  };
}
