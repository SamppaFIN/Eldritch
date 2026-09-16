/**
 * BRDC-SEED-003 — allocating bonus resource deposits, one area at a time.
 *
 * Ported from `worldseed.ts`'s own `BONUS_RESOURCES` and `allocate()` — that function has
 * a real body (unlike `partition`/`place`, which are signatures only), so this keeps its
 * logic close to verbatim and only adapts the types: `Area.terrain` is the game's
 * `TerrainKind` (`BRDC-TERRAIN-005`'s nine, after `worldseedTerrain.ts`'s conversion) rather
 * than Worldseed's own seven, and `Yield` is folded onto the game's `ResourceKind` (its
 * `timber` is this game's `wood`; everything else already matches by name).
 *
 * These 28 are additive to the 10 `bounty.ts` already has (`BRDC-SEED-000` D2/D3) — nothing
 * here replaces or renames an existing find.
 */
import type { ResourceKind, TerrainKind } from '../rules/terrain.js';
import type { H3Index } from '../types/domain.js';
import type { Area } from './worldseedPartition.js';

/** Worldseed's own yield vocabulary. `timber` is this game's `wood`; the rest match. */
export type Yield = 'timber' | 'stone' | 'iron' | 'food' | 'gold' | 'wisdom' | 'mana' | 'culture' | 'tokens';

export function yieldToResource(y: Yield): ResourceKind {
  return y === 'timber' ? 'wood' : y;
}

export type RequireFlag = 'shoreline' | 'island' | 'deepWater' | 'leyCrossing' | 'oldGrowth' | 'poiNearby';

export interface BonusResourceDef {
  readonly id: string;
  readonly name: string;
  readonly nameFi: string;
  readonly sprite: string;
  readonly yields: Partial<Record<Yield, number>>;
  readonly affinity: Partial<Record<TerrainKind, number>>;
  readonly rarity: number;
  readonly require?: readonly RequireFlag[];
}

/**
 * worldseed.ts's BONUS_RESOURCES, verbatim data — 28, grouped by their home terrain in the
 * source. Affinity keys use the game's terrain names (`water`→`lake`+`coast`, `trade`→`market`).
 *
 * Six ids here (`fish`, `deer`, `wheat`, `granite`, `marble`, `gems`) are also `BountyId`s
 * in `bounty.ts`, naming two different definitions under the same word — real fish, twice,
 * with different yields. Harmless while the two pools stay in separate systems (this one
 * seeded per-area inside Härmälä, that one hashed per-hex everywhere else), but
 * `BRDC-RES-001` merges the pools for hexes outside a seeded area, and that reconciliation
 * has to pick one `fish`, not silently prefer whichever table is checked first. Left with
 * their original names rather than invented here, since disambiguating them is that
 * ticket's decision to make, not this one's to guess.
 */
export const BONUS_RESOURCES: readonly BonusResourceDef[] = [
  // WATER
  { id: 'fish', name: 'Fish', nameFi: 'Kalaparvi', sprite: '#rFish', yields: { food: 2 }, affinity: { lake: 1.0, coast: 1.0, marsh: 0.3 }, rarity: 0.9 },
  { id: 'reeds', name: 'Reed Bed', nameFi: 'Ruovikko', sprite: '#rReeds', yields: { timber: 1, food: 1 }, affinity: { lake: 0.6, coast: 0.6, marsh: 1.0 }, rarity: 0.7 },
  { id: 'waterfowl', name: 'Waterfowl', nameFi: 'Vesilinnut', sprite: '#rFowl', yields: { food: 3 }, affinity: { lake: 0.7, coast: 0.7, marsh: 0.9 }, rarity: 0.45 },
  { id: 'leycrystal', name: 'Ley Crystal', nameFi: 'Leykristalli', sprite: '#rLey', yields: { mana: 4 }, affinity: { lake: 0.8, coast: 0.8, marsh: 0.5, hill: 0.6 }, rarity: 0.08, require: ['leyCrossing'] },

  // FOREST
  { id: 'oak', name: 'Ancient Oak', nameFi: 'Ikitammi', sprite: '#rOak', yields: { timber: 3 }, affinity: { forest: 1.0 }, rarity: 0.35, require: ['oldGrowth'] },
  { id: 'birch', name: 'Birch Stand', nameFi: 'Koivikko', sprite: '#rBirch', yields: { timber: 2 }, affinity: { forest: 1.0, plain: 0.3 }, rarity: 0.85 },
  { id: 'deer', name: 'Deer', nameFi: 'Hirvi', sprite: '#rDeer', yields: { food: 2 }, affinity: { forest: 1.0, marsh: 0.4 }, rarity: 0.55 },
  { id: 'mushrooms', name: 'Mushrooms', nameFi: 'Sienimaa', sprite: '#rMush', yields: { food: 1, wisdom: 1 }, affinity: { forest: 0.9, marsh: 0.5 }, rarity: 0.6 },
  { id: 'berries', name: 'Berry Ground', nameFi: 'Mustikkamaa', sprite: '#rBerry', yields: { food: 2, culture: 1 }, affinity: { forest: 0.8, marsh: 0.6 }, rarity: 0.6 },

  // PLAIN
  { id: 'wheat', name: 'Wheat', nameFi: 'Vehnäpelto', sprite: '#rWheat', yields: { food: 2 }, affinity: { plain: 1.0 }, rarity: 0.8 },
  { id: 'cattle', name: 'Cattle', nameFi: 'Karja', sprite: '#rCattle', yields: { food: 3 }, affinity: { plain: 1.0 }, rarity: 0.5 },
  { id: 'horses', name: 'Horses', nameFi: 'Hevoset', sprite: '#rHorses', yields: { gold: 2 }, affinity: { plain: 0.9, market: 0.5 }, rarity: 0.35 },
  { id: 'hay', name: 'Hay Meadow', nameFi: 'Heinäniitty', sprite: '#rHay', yields: { food: 1 }, affinity: { plain: 1.0 }, rarity: 0.9 },

  // HILL
  { id: 'granite', name: 'Granite', nameFi: 'Graniitti', sprite: '#rGranite', yields: { stone: 3 }, affinity: { hill: 1.0 }, rarity: 0.8 },
  { id: 'marble', name: 'Marble', nameFi: 'Marmori', sprite: '#rMarble', yields: { stone: 3, culture: 1 }, affinity: { hill: 1.0 }, rarity: 0.25 },
  { id: 'ironore', name: 'Iron Ore', nameFi: 'Rautamalmi', sprite: '#rIron', yields: { iron: 3 }, affinity: { hill: 1.0, marsh: 0.4 }, rarity: 0.45 },
  { id: 'gems', name: 'Gems', nameFi: 'Jalokivet', sprite: '#rGems', yields: { culture: 2, gold: 1 }, affinity: { hill: 0.8 }, rarity: 0.12 },

  // MARSH
  { id: 'peat', name: 'Peat Cut', nameFi: 'Turvesuo', sprite: '#rPeat', yields: { timber: 2 }, affinity: { marsh: 1.0 }, rarity: 0.8 },
  { id: 'bogiron', name: 'Bog Iron', nameFi: 'Järvimalmi', sprite: '#rBogIron', yields: { iron: 2 }, affinity: { marsh: 1.0, lake: 0.3, coast: 0.3 }, rarity: 0.4 },
  { id: 'wisp', name: "Will-o'-Wisp", nameFi: 'Virvatuli', sprite: '#rWisp', yields: { mana: 2, wisdom: 1 }, affinity: { marsh: 0.9 }, rarity: 0.15 },

  // TRADE
  { id: 'goldvein', name: 'Gold Vein', nameFi: 'Kultasuoni', sprite: '#rGold', yields: { gold: 2 }, affinity: { market: 0.7, hill: 0.8 }, rarity: 0.2 },
  { id: 'stall', name: 'Market Stall', nameFi: 'Kauppakoju', sprite: '#rStall', yields: { gold: 2 }, affinity: { market: 1.0, settlement: 0.5 }, rarity: 0.85 },
  { id: 'caravan', name: 'Caravan Rest', nameFi: 'Karavaanari', sprite: '#rCaravan', yields: { gold: 2, culture: 1 }, affinity: { market: 0.9 }, rarity: 0.4 },
  { id: 'scrap', name: 'Scrap Heap', nameFi: 'Romukasa', sprite: '#rScrap', yields: { iron: 2 }, affinity: { market: 0.8, settlement: 0.4 }, rarity: 0.5 },

  // SETTLEMENT
  { id: 'sauna', name: 'Smoke Sauna', nameFi: 'Savusauna', sprite: '#rSauna', yields: { culture: 2, wisdom: 1 }, affinity: { settlement: 1.0, forest: 0.4 }, rarity: 0.4, require: ['shoreline'] },
  { id: 'ale', name: 'Ale Cellar', nameFi: 'Olutkellari', sprite: '#rAle', yields: { gold: 1, culture: 1 }, affinity: { settlement: 1.0, market: 0.6 }, rarity: 0.6 },
  { id: 'orchard', name: 'Orchard', nameFi: 'Omenatarha', sprite: '#rOrchard', yields: { food: 2, culture: 1 }, affinity: { settlement: 0.8, plain: 0.6 }, rarity: 0.5 },
  { id: 'vineyard', name: 'Vineyard', nameFi: 'Viinitarha', sprite: '#rVine', yields: { culture: 2 }, affinity: { settlement: 0.5, plain: 0.5, hill: 0.6 }, rarity: 0.12 },
];

/** Deposits per area, by hex count — worldseed.ts's own thresholds, verbatim. */
export function depositCount(areaHexes: number): 1 | 2 | 3 {
  if (areaHexes >= 40) return 3;
  if (areaHexes >= 20) return 2;
  return 1;
}

/** Expected share of hexes carrying a deposit — the build assertion's own guardrail. */
export const DEPOSIT_DENSITY = { min: 0.03, max: 0.12 };

/** Terrains that may host a deposit, and how many at most. Trade/settlement cap at 2. */
export const DEPOSIT_CAP: Readonly<Record<TerrainKind, 1 | 2 | 3>> = {
  lake: 3,
  coast: 3,
  marsh: 3,
  forest: 3,
  hill: 3,
  plain: 3,
  market: 2,
  settlement: 2,
  // Not part of Worldseed's own areas (no zone ever classifies as mountain) — capped like
  // hill so a future hand-drawn mountain area is not silently unable to host anything.
  mountain: 3,
};

export interface Deposit {
  readonly hexId: H3Index;
  readonly resource: BonusResourceDef;
}

/**
 * One area's deposits: `depositCount` draws, each weighted by affinity × rarity from the
 * pool of resources that can appear on this terrain at all, then placed on a free hex that
 * satisfies the resource's `require` flags. A resource that cannot find a satisfying hex is
 * skipped rather than forced onto the wrong ground.
 */
export function allocateArea(
  area: Area,
  hexFlags: (hexId: H3Index) => readonly string[],
  rng: () => number,
): Deposit[] {
  const cap = DEPOSIT_CAP[area.terrain];
  const n = Math.min(depositCount(area.hexes.length), cap) as 1 | 2 | 3;
  const pool = BONUS_RESOURCES.filter((r) => (r.affinity[area.terrain] ?? 0) > 0).map((r) => ({
    r,
    w: (r.affinity[area.terrain] ?? 0) * r.rarity,
  }));

  const out: Deposit[] = [];
  const taken = new Set<H3Index>();

  for (let i = 0; i < n && pool.length > 0; i += 1) {
    let roll = rng() * pool.reduce((t, p) => t + p.w, 0);
    let k = pool.findIndex((p) => (roll -= p.w) <= 0);
    if (k < 0) k = 0;
    const { r } = pool.splice(k, 1)[0]!;

    const candidates = area.hexes.filter(
      (h) => !taken.has(h) && (!r.require || r.require.every((f) => hexFlags(h).includes(f))),
    );
    if (candidates.length === 0) {
      i -= 1;
      continue;
    }
    const hexId = candidates[Math.floor(rng() * candidates.length)]!;
    taken.add(hexId);
    out.push({ hexId, resource: r });
  }
  return out;
}
