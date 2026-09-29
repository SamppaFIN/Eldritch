/**
 * Gates (BRDC-DOOM-002, Eldritch-Progression.pdf "Gates", P5, LAW IV).
 *
 * A gate opens on a named cell. While open it drains realm sanity (−2 for every gate
 * within 3 rings of your ground) and its Horror eats the strength of the cells nearest
 * it. Walk to it and pass a Lore test (2 successes), or spend five clues, to seal it —
 * the Doom falls by one and the sealer gains two clues. Left open 48 hours it adds one
 * to the Doom.
 *
 * Where gates open: at dawn, one may open within three rings of a realm's border — the
 * week-4 line "gates start opening near the border". The draw is a hash of the season's
 * seed, the dawn and the realm, so it is stable on a phone and needs no server.
 */
import { neighboursOf } from '../geo/cells.js';
import { hexDistance } from '../geo/cells.js';
import type { Cell, H3Index } from '../types/domain.js';

export interface Gate {
  id: string;
  h3: H3Index;
  openedAt: number;
  sealedAt?: number;
  /** Set once the 48 h have passed and the Doom has been told. */
  doomedAt?: number;
}

export const GATE_DOOM_MS = 48 * 3_600_000;
export const GATE_TEST_NEED = 2;
export const GATE_SANITY_RINGS = 3;
/** Strength the Horror eats from each held cell beside the gate, per day it stays open. */
export const HORROR_BITE_PER_DAY = 20;
/** The share of dawns on which a gate opens near a realm. */
export const GATE_CHANCE = 0.35;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/** The cells just outside a realm's border, out to three rings: where a gate may open. */
function gateSites(held: readonly Cell[]): H3Index[] {
  const own = new Set(held.map((c) => c.h3));
  let ring = new Set<H3Index>(own);
  const out = new Set<H3Index>();
  for (let r = 0; r < 3; r += 1) {
    const next = new Set<H3Index>();
    for (const h of ring) for (const n of neighboursOf(h)) if (!own.has(n) && !out.has(n)) next.add(n);
    for (const n of next) out.add(n);
    ring = next;
  }
  return [...out].sort();
}

/** The gate this dawn opens near this realm, if any. */
export function gateAtDawn(seed: string, dawn: number, realm: string, held: readonly Cell[], now: number): Gate | null {
  if (held.length === 0 || hash(`${seed}:gate:${realm}:${dawn}`) >= GATE_CHANCE) return null;
  const sites = gateSites(held);
  if (sites.length === 0) return null;
  const h3 = sites[Math.floor(hash(`${seed}:site:${realm}:${dawn}`) * sites.length)] as H3Index;
  return { id: `${seed}:${dawn}:${h3}`, h3, openedAt: now };
}

export const isOpen = (g: Gate): boolean => g.sealedAt === undefined;

/** Open gates within three rings of any held cell — the sanity formula's `gatesNear`. */
export function gatesNear(gates: readonly Gate[], held: readonly Cell[]): number {
  return gates.filter(
    (g) => isOpen(g) && held.some((c) => hexDistance(c.h3, g.h3) <= GATE_SANITY_RINGS),
  ).length;
}

/** Open gates that have waited 48 h and not yet told the Doom. */
export const overdue = (gates: readonly Gate[], now: number): Gate[] =>
  gates.filter((g) => isOpen(g) && g.doomedAt === undefined && now - g.openedAt >= GATE_DOOM_MS);

/** What the Horror has eaten from a held cell beside an open gate, by now. */
export function horrorBite(gate: Gate, cell: Cell, now: number): number {
  if (!isOpen(gate) || hexDistance(gate.h3, cell.h3) > 1) return 0;
  return Math.floor(((now - gate.openedAt) / 86_400_000) * HORROR_BITE_PER_DAY);
}
