/**
 * A building's own page and research tree, as data (BRDC-WORKS-002).
 *
 * Every tree has the same shape: five tiers, tier III always a choice of two, tier V
 * sometimes. The effect a node has is typed, so the page can colour it and a rule can
 * apply it; the sentence around it is copy.
 */
import type { ResourceKind, ResourcePool } from '../terrain.js';
import type { TerrainKind } from '../../types/domain.js';

/** Which page — a Work that stands on a cell, or the Keep and a Temple, which are places. */
export type WorksKind =
  | 'keep'
  | 'temple'
  | 'farm'
  | 'sawmill'
  | 'quarry'
  | 'forge'
  | 'market'
  | 'watchtower'
  | 'tavern';

/** Group B: the design names it, but the game has no mechanic for it yet. */
export type SpecialId =
  | 'siegeImmune'
  | 'siegeAlert'
  | 'seeRivalResearch'
  | 'rivalDecayInReach'
  | 'rivalStrengthInReach'
  | 'unlockRite'
  | 'unlockWonder'
  | 'wonderDiscount'
  | 'questSlot'
  | 'wagerBonus'
  | 'periodic'
  | 'tradeAnything'
  | 'streakWater'
  | 'restoreFading'
  | 'adjacentMult'
  | 'artefactDouble'
  | 'noRot'
  | 'cacheRumour'
  | 'templeRing'
  | 'blessingMana';

export type Effect =
  | { kind: 'produce'; yields: Partial<ResourcePool> }
  | {
      kind: 'producePer';
      resource: ResourceKind;
      amount: number;
      per: 'province' | 'cellInReach';
      /** Only held cells of this ground count, for `cellInReach`. */
      terrain?: TerrainKind;
    }
  | { kind: 'reach'; rings: number }
  | { kind: 'storageCap'; resource: ResourceKind; amount: number }
  | { kind: 'cellStrength'; amount: number; scope: 'cell' | 'provinceWorks' }
  | { kind: 'claimStrength'; amount: number; scope: 'reach' | 'rival' }
  | { kind: 'decayFloor'; floor: number | 'immune'; scope: 'cell' | 'border' }
  | { kind: 'costDiscount'; resource: ResourceKind | 'all'; pct: number; target: 'build' | 'rite' | 'trade' }
  | { kind: 'convert'; from: ResourceKind; fromAmount: number; to: ResourceKind; toAmount: number }
  | { kind: 'depositBonus'; deposit: string; resource: ResourceKind; amount?: number; mult?: number }
  | { kind: 'reveal'; rings: number; around: 'self' | 'temples' }
  | { kind: 'worksMult'; target: WorksKind; resource: ResourceKind; pct: number }
  | { kind: 'produceFrom'; from: ResourceKind; resource: ResourceKind; ratio: number }
  | { kind: 'decayMult'; pct: number }
  | { kind: 'special'; id: SpecialId };

export type EffectKind = Effect['kind'];

export interface WorksNode {
  /** `<kind>.<slug>`, unique across every tree. */
  id: string;
  name: string;
  /** The rule, in a sentence. */
  text: string;
  /** The part of `text` the typed effect stands for — drawn highlighted, in its colour. */
  hl: string;
  effects: readonly Effect[];
  lore: string;
  cost: Readonly<Partial<ResourcePool>>;
}

export interface WorksTier {
  tier: 1 | 2 | 3 | 4 | 5;
  /** Two nodes, and learning one closes the other on this building. */
  choice: boolean;
  nodes: readonly WorksNode[];
}

export interface BuildingDef {
  kind: WorksKind;
  name: string;
  /** "Maatila · Built on plains" */
  subtitle: string;
  /** Sprite key in the game's `buildingSprites`, or a place glyph for keep / temple. */
  sprite: string;
  /** `L C H` for the page's glow, OKLCH. */
  hue: string;
  lore: { text: string; source: string };
  /** What the building is for, in one or two sentences. */
  note: string;
  /** The building's one radius. `effect` is what the ring does on its own, when the game
   *  can do it — without one, only the tree's own reach effects make a ring matter. */
  reach: { label: string; rings: number; maxRings: number; text: string; effect?: Effect } | null;
  tree: { name: string; tiers: readonly WorksTier[] };
}
