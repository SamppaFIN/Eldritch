/**
 * The twelve wonders (BRDC-WONDER-001, plan §5 I1–I12).
 *
 * A hex that is a story rather than a number. Everything else on the map differs from its
 * neighbours by how much it pays; a wonder differs by being *somewhere*, once.
 *
 * **Terrain substitutions are baked into this table, not applied on top of it.** The plan
 * binds three wonders to ocean, tundra and desert, none of which exist in the city this
 * game is built for and walked in. The ticket settled the exchange rate — a big lake
 * stands in for the ocean (Infinite: *"järvihän on tuossa mun sijainnin vieressä
 * Härmälässä"*), bare rock and bog for tundra, a railyard or gravel pit for desert — so
 * what is written here is what is asked for. A cost that demands ground the player cannot
 * reach is not difficulty, it is a locked door; `BRDC-WARD-001` learned that once already.
 *
 * Where each one *is* lives in `wonderPlace.ts`. This file is what they are.
 */
import type { ResourcePool, TerrainKind } from './terrain.js';
import type { AuraKind } from '../types/domain.js';
import type { Rarity } from './reveal.js';

export type WonderId =
  | 'rlyeh'
  | 'the-temple'
  | 'nameless-city'
  | 'hyperborea'
  | 'kadath'
  | 'leng'
  | 'yha-nthlei'
  | 'mountains-of-madness'
  | 'arkham'
  | 'dreamlands-gate'
  | 'innsmouth'
  | 'dunwich-stones';

export interface Wonder {
  name: string;
  /** Ground it can stand on. Substitutions already applied — see the file docstring. */
  terrain: readonly TerrainKind[];
  rarity: Rarity;
  /** Added to its own hex, per hour, on top of terrain and any bounty. */
  bonus: Partial<ResourcePool>;
  /** What it does to the ground around it, and how far that reaches in hex rings. */
  aura: { kind: AuraKind; radius: number };
  /** One or two sentences. Content, so the twenty-word UI limit does not apply. */
  lore: string;
}

/**
 * The table. Fixed order, and the order is load-bearing: `wonderPlace.ts` walks it in
 * sequence so that two wonders can never be handed the same province. Reordering it moves
 * wonders, which is why it is versioned there.
 */
export const WONDERS: Readonly<Record<WonderId, Wonder>> = {
  rlyeh: {
    name: "R'lyeh",
    terrain: ['lake'],
    rarity: 'legendary',
    bonus: { mana: 6, culture: 3 },
    aura: { kind: 'mana', radius: 3 },
    lore: 'The drowned city, its geometry wrong in a way the eye reports before the mind agrees. It is not ruined. It is waiting, and it is patient in a way stone is not.',
  },
  'the-temple': {
    name: 'The Temple',
    terrain: ['lake', 'coast'],
    rarity: 'legendary',
    bonus: { culture: 5, mana: 3 },
    aura: { kind: 'mana', radius: 2 },
    lore: 'Raised before the water came, and unbothered by it. Those who dive to its door report the carvings are still sharp — as though the lake were a roof and not a grave.',
  },
  'nameless-city': {
    name: 'The Nameless City',
    terrain: ['market'],
    rarity: 'legendary',
    bonus: { wisdom: 5, gold: 3 },
    aura: { kind: 'wisdom', radius: 3 },
    lore: 'Older than any people who might have named it. The corridors are low and long, built for something that went on all fours and went a long way.',
  },
  hyperborea: {
    name: 'Hyperborea',
    terrain: ['hill', 'mountain'],
    rarity: 'legendary',
    bonus: { wisdom: 4, stone: 4 },
    aura: { kind: 'wisdom', radius: 3 },
    lore: 'The country behind the north wind, which the maps have never carried and the songs have never dropped. Bare rock, and under the bare rock, doors.',
  },
  kadath: {
    name: 'Unknown Kadath',
    terrain: ['mountain'],
    rarity: 'legendary',
    bonus: { mana: 5, wisdom: 3 },
    aura: { kind: 'mana', radius: 3 },
    lore: 'The gods live here and would rather not be visited. Every traveller who has described the way has described a different way, and all of them were telling the truth.',
  },
  leng: {
    name: 'The Plateau of Leng',
    terrain: ['mountain', 'hill'],
    rarity: 'rare',
    bonus: { mana: 4, culture: 2 },
    aura: { kind: 'mana', radius: 2 },
    lore: 'A flat place high up where the wind does not stop and the villages have no doors on the north side.',
  },
  'yha-nthlei': {
    name: "Y'ha-nthlei",
    terrain: ['coast', 'lake'],
    rarity: 'rare',
    bonus: { food: 5, gold: 3 },
    aura: { kind: 'food', radius: 3 },
    lore: 'A city under the water that trades honestly and keeps its bargains, which is the frightening part.',
  },
  'mountains-of-madness': {
    name: 'The Mountains of Madness',
    terrain: ['mountain'],
    rarity: 'rare',
    bonus: { wisdom: 5, iron: 3 },
    aura: { kind: 'defence', radius: 3 },
    lore: 'A range taller than any survey admits, and behind it the thing the range was built to keep in.',
  },
  arkham: {
    name: 'Arkham',
    terrain: ['market', 'plain'],
    rarity: 'uncommon',
    bonus: { wisdom: 4, gold: 2 },
    aura: { kind: 'wisdom', radius: 2 },
    lore: 'A university town with gambrel roofs and a library that lends almost everything.',
  },
  'dreamlands-gate': {
    name: 'The Gate of Deeper Slumber',
    terrain: ['forest'],
    rarity: 'uncommon',
    bonus: { mana: 4, wood: 2 },
    aura: { kind: 'mana', radius: 2 },
    lore: 'Seventy steps down through a wood that is only there at dusk. The two who keep the gate ask no toll and give no advice.',
  },
  innsmouth: {
    name: 'Innsmouth',
    terrain: ['coast', 'lake'],
    rarity: 'common',
    bonus: { food: 3, gold: 2 },
    aura: { kind: 'food', radius: 2 },
    lore: 'A fishing town that has not had a bad season in living memory, and does not care to explain why.',
  },
  'dunwich-stones': {
    name: 'The Dunwich Stones',
    terrain: ['hill', 'plain'],
    rarity: 'common',
    bonus: { culture: 3, stone: 2 },
    aura: { kind: 'defence', radius: 2 },
    lore: 'A ring of standing stones on a bald hill. The farmers mow around it and will not say what for.',
  },
};

export const WONDER_IDS = Object.keys(WONDERS) as WonderId[];

/** Rarity as the plan writes it, for a UI that wants to show the tier without jargon. */
export const WONDER_STARS: Readonly<Record<Rarity, string>> = {
  legendary: '★★★★★',
  rare: '★★★★',
  uncommon: '★★★',
  common: '★★',
};

/** Whether this wonder can stand on that ground. */
export function wonderFits(id: WonderId, terrain: TerrainKind): boolean {
  return WONDERS[id].terrain.includes(terrain);
}
