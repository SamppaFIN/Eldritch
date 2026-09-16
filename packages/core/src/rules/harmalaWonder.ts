/**
 * The nine local wonders (BRDC-WONDER-002), replacing the twelve hash-placed ones
 * (`rules/wonder.ts`) wherever the ground has been seeded (`BRDC-SEED-004`).
 *
 * Worldseed's own nine (`worldseed.ts`'s `WONDERS`) are placed by scoring every hex on
 * survey signals this game has no data for (`elevation`, `adjacentWater`,
 * `leyCrossings`…) — a full OSM survey neither this repo nor `BRDC-SEED-003` has. So
 * placement here is not scored: each wonder's `at` (from `seed.harmala.json`, already
 * translated by `BRDC-SEED-001`) names one hex, and `require` is a hard gate against that
 * hex's own classified terrain and flags — match, and the wonder stands there; miss, and
 * it is left unplaced rather than forced onto ground it does not fit (`BRDC-SEED-000` D6).
 *
 * Names are Worldseed's mundane ones, translated into the game's own Mythos vocabulary
 * (§12) — one evocative proper name each, the same register `rules/wonder.ts` already
 * uses, not a description. `worldseedId` keeps the traceable link back to the source
 * document; nothing reads it but a human comparing the two.
 *
 * Every one of these NINE has an effect that is new game logic — a yield multiplier, a
 * realm-wide flat bonus, a decay change, a combat modifier — none of which fits
 * `rules/wonder.ts`'s simple `{bonus, aura}` shape, and none of which is implemented yet.
 * This file is the foundation (identity, lore, placement); each effect is its own,
 * separately measured follow-up, per the ticket's own "cheapest first, measured in sim/
 * before switching on" — inventing nine untested rule changes at once is exactly what
 * that line was written to prevent.
 */
import type { TerrainKind } from './terrain.js';

export type HarmalaWonderId =
  | 'yhanthlei-bell'
  | 'dagon-spire'
  | 'drowned-eye'
  | 'ancient-loyly'
  | 'yuggoth-lens'
  | 'dunwich-grove'
  | 'carcosa-foundry'
  | 'waits-at-shore'
  | 'thousand-masks-road';

export interface HarmalaWonder {
  readonly name: string;
  /** The Worldseed source id, for tracing back to `seed.harmala.json`'s `wonders[]`. */
  readonly worldseedId: string;
  readonly lore: string;
  /** What it will do, once its own ticket implements it — not yet live game logic. */
  readonly effect: string;
  readonly requireTerrain: readonly TerrainKind[];
  readonly requireFlags: readonly string[];
}

export const HARMALA_WONDERS: Readonly<Record<HarmalaWonderId, HarmalaWonder>> = {
  'yhanthlei-bell': {
    name: "Y'ha-nthlei's Bell",
    worldseedId: 'sunken_bell',
    lore: 'A church bell went into the bog in a year nobody wrote down. The marsh has learned its note, and rings it back whenever the ice moves.',
    effect: '+6 mana/h. Marsh and water cells you hold yield double. Reveals every cache within 1 km.',
    requireTerrain: ['marsh'],
    requireFlags: [],
  },
  'dagon-spire': {
    name: 'The Dagon Spire',
    worldseedId: 'drowned_spire',
    lore: 'Something was built here before Pyhäjärvi rose to cover it, and the water never finished the job. Divers who go looking say the current pulls toward it, not past it.',
    effect: '+8 mana/h realm-wide. Reveals every water hex within 2 km.',
    requireTerrain: ['lake', 'coast'],
    requireFlags: ['deepWater'],
  },
  'drowned-eye': {
    name: 'The Drowned Eye',
    worldseedId: 'eye_of_the_lake',
    lore: 'An island is a hill that refused to drown. This one has been watching the shore longer than the shore has had a name for it.',
    effect: 'Reveals all cells within 3 km, permanently. A rival siege on your ground is announced. Opens only once the tale reaches its fifth stop.',
    requireTerrain: ['forest', 'plain'],
    requireFlags: ['island'],
  },
  'ancient-loyly': {
    name: 'The Ancient Löyly',
    worldseedId: 'great_sauna',
    lore: 'A sauna that has never gone cold, not once, not through a single winter anyone remembers. Something underneath keeps the stones hot.',
    effect: 'Decay pauses for 12 h after any walk. +4 culture/h.',
    requireTerrain: ['settlement', 'forest'],
    requireFlags: ['shoreline'],
  },
  'yuggoth-lens': {
    name: 'The Yuggoth Lens',
    worldseedId: 'ley_observatory',
    lore: 'They built it to watch the sky and found they could not stop reading what passed under the ground instead.',
    effect: '+10 wisdom/h. Every Rite costs 25% less mana.',
    requireTerrain: ['hill', 'plain'],
    requireFlags: ['leyCrossing'],
  },
  'dunwich-grove': {
    name: 'The Dunwich Grove',
    worldseedId: 'whispering_grove',
    lore: 'Old trees standing in a ring nobody planted, agreeing about something in a language that is mostly root.',
    effect: '+6 timber/h, +4 food/h. Forest cells you hold never decay below 200.',
    requireTerrain: ['forest'],
    requireFlags: ['oldGrowth'],
  },
  'carcosa-foundry': {
    name: 'The Carcosa Foundry',
    worldseedId: 'iron_bell',
    lore: 'One bell, cast once here, meant to be rung twice. Only the first ringing has happened.',
    effect: '+8 iron/h. Your claims gain +40 strength against rivals.',
    requireTerrain: ['market', 'settlement'],
    requireFlags: [],
  },
  'waits-at-shore': {
    name: 'He Who Waits at the Shore',
    worldseedId: 'the_boy_who_waits',
    lore: 'The statue does not only mark where he went in. Ground near it remembers him too, and gives more freely for it.',
    effect: '+6 culture/h. Any cell adjacent to a landmark yields double culture.',
    requireTerrain: ['plain', 'settlement', 'forest'],
    requireFlags: [],
  },
  'thousand-masks-road': {
    name: 'The Thousand Masks Road',
    worldseedId: 'ten_thousand_steps',
    lore: 'A stair cut into the rock going up, counted twice by two different people, and never to the same number. Something walks it when nobody is looking.',
    effect: '+3 to every resource per hour. Walking distance counts 1.5× toward Consciousness.',
    requireTerrain: ['hill'],
    requireFlags: [],
  },
};

export const HARMALA_WONDER_IDS = Object.keys(HARMALA_WONDERS) as HarmalaWonderId[];

/** Whether a classified hex's ground satisfies a wonder's hard requirement. */
export function harmalaWonderFits(
  id: HarmalaWonderId,
  terrain: TerrainKind,
  flags: readonly string[],
): boolean {
  const w = HARMALA_WONDERS[id];
  return w.requireTerrain.includes(terrain) && w.requireFlags.every((f) => flags.includes(f));
}
