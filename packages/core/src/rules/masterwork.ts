/**
 * What many ordinary works become (BRDC-PROG-006, Eldritch-Progression.pdf P3 and
 * "MASTERWORKS · COUNT + LORE + LEVEL", LAW III).
 *
 * A masterwork needs a count of ordinary works, one of them levelled, and one tech —
 * nothing else. It is raised on one of its own ingredients: the fifth Watchtower is not
 * consumed, one of the five becomes the Fortress. If the count later drops below the
 * threshold the masterwork goes dormant (no yield, keeps its strength) until rebuilt.
 *
 * Two of the document's extra conditions are carried as written (a Manor's host stands on
 * a food deposit, a Foundry's on a hill). Two are approximated and say so: the Exchange's
 * "adjacent to a rival border" is not checked (rival borders are shared-world data), and
 * the Sunken Cathedral's "three temples of one school at tier III" reads as three Temple
 * Groves plus a learned tier III rite — temples are places, not buildings (PROG-007).
 */
import { worksOn } from './build.js';
import { terrainForCell } from './terrain.js';
import type { ResourcePool } from './terrain.js';
import { isFoodDeposit } from './staffing.js';
import type { LoreId, MasterworkId } from './lore.js';
import type { BuildingId, Cell } from '../types/domain.js';

export interface Masterwork {
  /** The building it is raised on, and becomes. */
  host: BuildingId;
  becomes: BuildingId;
  /** Ordinary works standing, the masterwork's own host counted among them. */
  count: Partial<Record<BuildingId, number>>;
  hostLevel: number;
  tech: LoreId;
  cost: Partial<ResourcePool>;
  gives: string;
  extra?: 'food-deposit' | 'hill';
}

export const MASTERWORKS: Readonly<Record<MasterworkId, Masterwork>> = {
  fortress: {
    host: 'watchtower', becomes: 'fortress', count: { watchtower: 5 }, hostLevel: 3, tech: 'signal-fires',
    cost: { stone: 120, iron: 60, wood: 40 },
    gives: 'Strength around it, and rivals cannot simply walk in. Sight 3 rings.',
  },
  manor: {
    host: 'farm', becomes: 'manor', count: { farm: 4 }, hostLevel: 3, tech: 'crop-rotation', extra: 'food-deposit',
    cost: { wood: 80, stone: 60, gold: 40 },
    gives: 'Housing +3.',
  },
  foundry: {
    host: 'forge', becomes: 'foundry', count: { quarry: 3, forge: 2 }, hostLevel: 3, tech: 'deep-survey', extra: 'hill',
    cost: { stone: 140, wood: 80, gold: 60 },
    gives: 'Iron and stone +50 % across the realm.',
  },
  exchange: {
    host: 'market', becomes: 'exchange', count: { market: 3 }, hostLevel: 0, tech: 'the-pale-accord',
    cost: { gold: 160, stone: 80, iron: 40 },
    gives: 'Convert gold to any resource, 3 : 1.',
  },
  'sunken-cathedral': {
    host: 'temple-grove', becomes: 'sunken-cathedral', count: { 'temple-grove': 3 }, hostLevel: 0, tech: 'drowned-liturgy',
    cost: { stone: 200, mana: 120, gold: 60 },
    gives: 'Mana +50 %.',
  },
};

export const MASTERWORK_IDS = Object.keys(MASTERWORKS) as MasterworkId[];

/** Every standing Work in the realm, counted by kind. */
function census(cells: readonly Cell[]): Map<BuildingId, number> {
  const n = new Map<BuildingId, number>();
  for (const c of cells) for (const w of worksOn(c)) n.set(w.id, (n.get(w.id) ?? 0) + 1);
  return n;
}

export interface Need {
  text: string;
  met: boolean;
}

/**
 * The unlock ladder for one masterwork, and the host it would be raised on (the first
 * that meets every host condition). `levelOf` reads a host's Works level.
 */
export function ladder(
  id: MasterworkId,
  cells: readonly Cell[],
  lore: readonly LoreId[],
  levelOf: (cell: Cell) => number,
): { needs: Need[]; host: Cell | null } {
  const m = MASTERWORKS[id];
  const n = census(cells);
  const needs: Need[] = Object.entries(m.count).map(([kind, want]) => ({
    text: `${want} ${kind} standing (${n.get(kind as BuildingId) ?? 0})`,
    met: (n.get(kind as BuildingId) ?? 0) >= (want as number),
  }));
  const hostOk = (c: Cell) =>
    worksOn(c).some((w) => w.id === m.host) &&
    levelOf(c) >= m.hostLevel &&
    (m.extra !== 'food-deposit' || isFoodDeposit(c)) &&
    (m.extra !== 'hill' || terrainForCell(c).kind === 'hill');
  const host = cells.find(hostOk) ?? null;
  if (m.hostLevel > 0 || m.extra) {
    const where = m.extra === 'food-deposit' ? ' on a food deposit' : m.extra === 'hill' ? ' on a hill' : '';
    needs.push({ text: `One ${m.host}${m.hostLevel ? ` at level ${m.hostLevel}` : ''}${where}`, met: host !== null });
  }
  needs.push({ text: `Lore · ${m.tech}`, met: lore.includes(m.tech) });
  return { needs, host };
}

/**
 * Dormant when the ordinary works it was raised from fall below the count. The
 * masterwork stands in its host's place, so it counts as one of its host kind.
 */
export function isDormant(id: MasterworkId, cells: readonly Cell[]): boolean {
  const m = MASTERWORKS[id];
  const n = census(cells);
  return Object.entries(m.count).some(([kind, want]) => {
    const have = (n.get(kind as BuildingId) ?? 0) + (kind === m.host ? (n.get(m.becomes) ?? 0) : 0);
    return have < (want as number);
  });
}

/** The masterworks standing and awake in a realm. */
export function activeMasterworks(cells: readonly Cell[]): MasterworkId[] {
  const n = census(cells);
  return MASTERWORK_IDS.filter((id) => (n.get(MASTERWORKS[id].becomes) ?? 0) > 0 && !isDormant(id, cells));
}
