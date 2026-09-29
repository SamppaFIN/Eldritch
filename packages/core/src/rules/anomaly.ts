/**
 * Anomalies: a cell with something wrong with it (BRDC-EVENT-001).
 *
 * Once a domain is built the map is a static picture that decay chews on and nothing
 * ever surprises. An anomaly is the surprise: strange ground you can investigate. It
 * costs, it takes time, and the reward is hidden until it resolves.
 *
 * Where anomalies are is not luck. `revealOf(h3) === 'rare'` *is* an anomaly site — a
 * deterministic hash, the same for every phone and for the Phase-5 SQL, like `terrainOf`.
 * A second salted hash splits a site into a plain hidden reward or the start of an event
 * chain (`chain.ts`).
 *
 * Pure. The passage of time is `now` read at the call, the same as decay and dwell — no
 * timer, no background job.
 */
import { seasonSalt } from './seasonSalt.js';
import { revealOf } from './reveal.js';
import { canAfford, spend } from './terrain.js';
import type { ResourceKind, ResourcePool } from './terrain.js';
import type { Cell } from '../types/domain.js';

/**
 * Studying an anomaly costs supplies — you camp on the strange ground and wait it out.
 *
 * `food`, not `wisdom`, on purpose: wisdom comes only from a Library (which needs a
 * temple) or the Insight spell (which needs mana, which needs a temple), so a cost in
 * wisdom would lock anomalies behind mid-game. Food comes from any lake or shore, which
 * is walking. Wisdom is what an anomaly *gives*, not what it takes.
 */
export const ANOMALY_INVESTIGATE_COST: Readonly<Partial<ResourcePool>> = { food: 20 };
/** How long an investigation runs before it resolves. Read at `now`, never timed. */
export const ANOMALY_INVESTIGATE_MS = 3 * 3_600_000;

export type AnomalyKind = 'reward' | 'chain';
export type InvestigateRefusal = 'not-anomaly' | 'already-resolved' | 'in-progress' | 'cannot-afford';

export type BeginResult =
  | { ok: true; cell: Cell; pool: ResourcePool }
  | { ok: false; refused: InvestigateRefusal };

/** FNV-1a over the salted index, in [0, 1). The spread `reveal.ts` and `terrain.ts` use. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

/**
 * The kind of anomaly at `h3`, or `null` if the ground is ordinary. A `rare` cell is a
 * site; whether it pays out flat or opens a chain is a stable coin-flip on the index.
 */
export function anomalyAt(h3: string): AnomalyKind | null {
  if (revealOf(h3) !== 'rare') return null;
  return hash(`anomaly:kind:${seasonSalt()}${h3}`) < 0.5 ? 'chain' : 'reward';
}

/** How far an investigation has run, 0..1. `0` when none has started, `1` once done. */
export function investigationProgress(cell: Cell, now: number): number {
  const a = cell.anomaly;
  if (!a) return 0;
  if (a.done) return 1;
  return clamp01((now - a.startedAt) / ANOMALY_INVESTIGATE_MS);
}

/** True once the investigation has run its course (or was already finished). */
export function isResolved(cell: Cell, now: number): boolean {
  return investigationProgress(cell, now) >= 1;
}

/**
 * Begin investigating the anomaly on `cell`, paying from `pool`.
 *
 * Refusals are values, not exceptions — `not-anomaly`, `already-resolved`, `in-progress`,
 * `cannot-afford`. `pool` is never mutated; the paid-down copy is returned on success.
 */
export function beginInvestigation(cell: Cell, pool: ResourcePool, now: number): BeginResult {
  if (anomalyAt(cell.h3) === null) return { ok: false, refused: 'not-anomaly' };
  if (cell.anomaly?.done) return { ok: false, refused: 'already-resolved' };
  if (cell.anomaly) return { ok: false, refused: 'in-progress' };
  if (!canAfford(pool, ANOMALY_INVESTIGATE_COST)) return { ok: false, refused: 'cannot-afford' };

  const paid = spend(pool, ANOMALY_INVESTIGATE_COST);
  if (!paid) return { ok: false, refused: 'cannot-afford' };
  return { ok: true, cell: { ...cell, anomaly: { startedAt: now } }, pool: paid };
}

/**
 * What an anomaly looks like before anyone studies it, and what studying it turns up
 * (Infinite 2026-09-29: *"useampia erilaisia ja niistä saa sitten jonkin palkinnon"*).
 * Each sign leans its reward toward one resource, so the ground says what it holds.
 */
export interface AnomalySign {
  id: string;
  name: string;
  /** Said on the untouched hex. */
  sign: string;
  /** Said when a reward anomaly gives up what it held. */
  found: string;
  resource: ResourceKind;
}

export const ANOMALY_SIGNS: readonly AnomalySign[] = [
  { id: 'hum', name: 'The Hum', sign: 'The ground hums a low note that is almost a word.', found: 'Under the note, a seam of stone that rings when struck.', resource: 'stone' },
  { id: 'door', name: 'The Standing Door', sign: 'A door stands in the open ground, with no house behind it.', found: 'Behind the door, a larder nobody stocked. It is full.', resource: 'food' },
  { id: 'weeping', name: 'The Weeping Stone', sign: 'A stone here is wet on a dry day, and the wet runs uphill.', found: 'The stone split along its tears. Something old was pressed inside.', resource: 'wisdom' },
  { id: 'shadow', name: 'The Wrong Shadow', sign: 'Something casts a shadow here, and nothing is standing in it.', found: 'Where the shadow lay, the grass had grown into coins.', resource: 'gold' },
  { id: 'bell', name: 'The Drowned Bell', sign: 'A bell rings under the turf, on the hour, every hour.', found: 'You dug to the bell. Its tongue is solid gold and it will not ring again.', resource: 'gold' },
  { id: 'ash', name: 'The Ring of Ash', sign: 'A perfect ring of ash, still warm, that no rain has ever wet.', found: 'The ash was the last of a great tree. Its roots were not.', resource: 'wood' },
  { id: 'birds', name: 'The Still Birds', sign: 'A flock sits on the grass and does not move, or breathe.', found: 'The birds were carved. Someone left them here to be found.', resource: 'culture' },
  { id: 'well', name: 'The Dry Well', sign: 'A well with no water, and a voice at the bottom counting.', found: 'The voice counted down to a hoard of iron nails.', resource: 'iron' },
];

/** The sign an anomaly at `h3` shows — deterministic, so every phone sees the same one. */
export function anomalySignOf(h3: string): AnomalySign {
  return ANOMALY_SIGNS[Math.floor(hash(`anomaly:sign:${seasonSalt()}${h3}`) * ANOMALY_SIGNS.length)] as AnomalySign;
}

/**
 * The hidden payoff of a `'reward'` anomaly, revealed only once it resolves.
 *
 * Deterministic from the index — the same find for everyone, and a reload cannot re-roll
 * it — in the sign's own resource, plus XP, and one sign in five also holds a token.
 */
export function resolveReward(h3: string): { pool: Partial<ResourcePool>; xp: number } {
  const resource = anomalySignOf(h3).resource;
  const amount = 30 + Math.floor(hash(`anomaly:amt:${h3}`) * 31); // 30..60
  const xp = 15 + Math.floor(hash(`anomaly:xp:${h3}`) * 26); // 15..40
  const pool: Partial<ResourcePool> = { [resource]: amount };
  if (hash(`anomaly:token:${h3}`) < 0.2) pool.tokens = 1;
  return { pool, xp };
}
