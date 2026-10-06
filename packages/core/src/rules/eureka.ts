/**
 * Eurekas (BRDC-EUREKA-001) — Civilization VI's "do the thing and you half-know it", in a
 * game where the thing is walking: every Lore has one condition read from the realm as it
 * stands, and a Lore whose condition holds costs half its wisdom.
 *
 * Read from the realm, never counted: held ground of a kind, a Work standing, a temple
 * found, hexes revealed. Walking takes the ground, so walking is what moves them — and
 * nothing here needs a counter a step has to remember to bump, or counts backwards.
 *
 * Pure. The conditions are defaults, Infinite tunes them.
 */
import { worksOn } from './build.js';
import type { BuildingId } from './build.js';
import { terrainForCell } from './terrain.js';
import type { TerrainKind } from './terrain.js';
import type { LoreId } from './lore.js';
import type { Cell } from '../types/domain.js';

export const EUREKA_DISCOUNT = 0.5;

export interface EurekaState {
  owned: readonly Cell[];
  /** Temples found (places of kind temple). */
  temples: number;
  /** Hexes revealed. */
  revealed: number;
}

export interface Eureka {
  /** What to do, said on the Lore row: "Hold 3 forest hexes". */
  text: string;
  have: number;
  need: number;
  met: boolean;
}

type Rule = { text: string; need: number; have: (s: EurekaState) => number };

const ground = (kinds: readonly TerrainKind[]) => (s: EurekaState) =>
  s.owned.filter((c) => kinds.includes(terrainForCell(c).kind)).length;
const works = (id: BuildingId) => (s: EurekaState) => s.owned.filter((c) => worksOn(c).some((w) => w.id === id)).length;

const RULES: Readonly<Record<LoreId, Rule>> = {
  husbandry: { text: 'Hold 3 plain hexes', need: 3, have: ground(['plain']) },
  granaries: { text: 'Raise a Farm', need: 1, have: works('farm') },
  'crop-rotation': { text: 'Hold 2 Farms', need: 2, have: works('farm') },
  'salt-marsh-drains': { text: 'Hold 3 hexes of marsh, lake or coast', need: 3, have: ground(['marsh', 'lake', 'coast']) },
  woodcraft: { text: 'Hold 3 forest hexes', need: 3, have: ground(['forest']) },
  'stone-and-bellows': { text: 'Hold 2 hill or mountain hexes', need: 2, have: ground(['hill', 'mountain']) },
  'deep-survey': { text: 'Reveal 10 hexes', need: 10, have: (s) => s.revealed },
  'black-mortar': { text: 'Have 5 Works standing', need: 5, have: (s) => s.owned.reduce((n, c) => n + worksOn(c).length, 0) },
  kindling: { text: 'Find a temple', need: 1, have: (s) => s.temples },
  'ley-reading': { text: 'Find 2 temples', need: 2, have: (s) => s.temples },
  'elder-signs': { text: 'Finish studying an anomaly', need: 1, have: (s) => s.owned.filter((c) => c.anomaly?.done).length },
  'drowned-liturgy': { text: 'Raise a Temple Grove', need: 1, have: works('temple-grove') },
  lookouts: { text: 'Hold 12 hexes', need: 12, have: (s) => s.owned.length },
  'night-trade': { text: 'Raise a Market', need: 1, have: works('market') },
  'signal-fires': { text: 'Raise a Watchtower', need: 1, have: works('watchtower') },
  'the-pale-accord': { text: 'Hold 60 hexes', need: 60, have: (s) => s.owned.length },
};

export function eurekaFor(id: LoreId, s: EurekaState): Eureka {
  const r = RULES[id];
  const have = Math.min(r.need, r.have(s));
  return { text: r.text, have, need: r.need, met: have >= r.need };
}

/** A Lore's price with its eureka met, or as it stands. */
export const eurekaCost = (cost: number, met: boolean): number => (met ? Math.floor(cost * (1 - EUREKA_DISCOUNT)) : cost);
