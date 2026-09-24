import type { BuildingDef } from '../types.js';

/** 03 · Farmstead (BRDC-WORKS-003). */
export const FARM: BuildingDef = {
  kind: 'farm',
  name: 'Farmstead',
  subtitle: 'Maatila · Built on plains',
  sprite: 'farm',
  hue: '0.87 0.21 156',
  lore: {
    text: 'The rye grows tallest over the old burial field. The farmers stopped asking why in 1868 and started asking only how much.',
    source: 'Tampere agricultural survey, unpublished appendix',
  },
  note: 'Food feeds every other work you hold.',
  reach: {
    label: 'Harvest',
    rings: 1,
    maxRings: 2,
    text: 'Plain cells you hold in the ring give +1 food an hour each. Rotation of the Fields reaches the second ring.',
    effect: { kind: 'producePer', resource: 'food', amount: 1, per: 'cellInReach', terrain: 'plain' },
  },
  tree: {
    name: 'The Hungry Furrow',
    tiers: [
      {
        tier: 1,
        choice: false,
        nodes: [
          {
            id: 'farm.tilled-rows',
            name: 'Tilled Rows',
            text: '+2 food per hour',
            hl: '+2 food per hour',
            effects: [{ kind: 'produce', yields: { food: 2 } }],
            cost: { wood: 20 },
            lore: 'The plough turns up flint arrowheads every spring. They always point towards the lake.',
          },
        ],
      },
      {
        tier: 2,
        choice: false,
        nodes: [
          {
            id: 'farm.granary-loft',
            name: 'Granary Loft',
            text: 'Food storage cap +200 food',
            hl: '+200 food',
            effects: [{ kind: 'storageCap', resource: 'food', amount: 200 }],
            cost: { wood: 40, stone: 20 },
            lore: 'The rats will not go into the loft. The cats will not come out of it.',
          },
        ],
      },
      {
        tier: 3,
        choice: true,
        nodes: [
          {
            id: 'farm.rotation',
            name: 'Rotation of the Fields',
            text: 'Harvest reaches +1 ring of plains',
            hl: '+1 ring',
            effects: [{ kind: 'reach', rings: 1 }],
            cost: { food: 40, wisdom: 30 },
            lore: 'Leave one field fallow each year, the old rule says. Nobody remembers what it is being left for.',
          },
          {
            id: 'farm.scarecrow',
            name: 'Scarecrow of Straw and Bone',
            text: 'Rival claims in your harvest lose 20 strength a day',
            hl: 'lose 20 strength a day',
            effects: [{ kind: 'special', id: 'rivalDecayInReach' }],
            cost: { wood: 30, culture: 20 },
            lore: 'It was only straw when they built it. Nobody added the bone.',
          },
        ],
      },
      {
        tier: 4,
        choice: false,
        nodes: [
          {
            id: 'farm.mill-wheel',
            name: 'Mill Wheel',
            text: 'Converts 10 food → 2 gold every hour',
            hl: '10 food → 2 gold',
            effects: [{ kind: 'convert', from: 'food', fromAmount: 10, to: 'gold', toAmount: 2 }],
            cost: { wood: 80, stone: 40 },
            lore: 'The wheel turns in both directions depending on who is watching it.',
          },
        ],
      },
      {
        tier: 5,
        choice: false,
        nodes: [
          {
            id: 'farm.harvest-moon',
            name: 'Harvest Moon',
            text: 'Once each full moon, triple food for 24 hours',
            hl: 'triple food for 24 hours',
            effects: [{ kind: 'special', id: 'periodic' }],
            cost: { food: 150, mana: 80 },
            lore: 'On the night of the harvest moon the fields are reaped by morning. The farmhands all slept through it.',
          },
        ],
      },
    ],
  },
};
