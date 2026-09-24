import type { BuildingDef } from '../types.js';

/** 02 · Temple of the Birches (BRDC-WORKS-003). */
export const TEMPLE: BuildingDef = {
  kind: 'temple',
  name: 'Temple of the Birches',
  subtitle: 'Koivujen temppeli · Revealed, not built',
  sprite: 'temple',
  hue: '0.79 0.14 220',
  lore: {
    text: 'They did not build the temple. They found it standing among the birches on the sixth morning, and its door opened onto a staircase longer than the hill was tall.',
    source: 'Statement of a berry-picker, 1934',
  },
  note: 'Rites are cast here and nowhere else. A temple you lose takes its learned research with it.',
  reach: {
    label: 'Blessing',
    rings: 1,
    maxRings: 2,
    text: 'Cells inside the blessing earn mana when walked. The Bell of Tides widens it.',
  },
  tree: {
    name: 'Litany of the Deep',
    tiers: [
      {
        tier: 1,
        choice: false,
        nodes: [
          {
            id: 'temple.kindled-altar',
            name: 'Kindled Altar',
            text: '+2 mana per hour from the altar alone',
            hl: '+2 mana per hour',
            effects: [{ kind: 'produce', yields: { mana: 2 } }],
            cost: { wisdom: 20 },
            lore: 'The flame is blue at the base and something else at the tip. Looking at the tip too long is discouraged.',
          },
        ],
      },
      {
        tier: 2,
        choice: false,
        nodes: [
          {
            id: 'temple.choir',
            name: 'Choir of Stillness',
            text: 'Every rite cast here costs 20% less mana',
            hl: '20% less mana',
            effects: [{ kind: 'costDiscount', resource: 'mana', pct: 20, target: 'rite' }],
            cost: { wisdom: 30, mana: 40 },
            lore: 'They sing with their mouths closed. The birches outside lean towards the sound.',
          },
        ],
      },
      {
        tier: 3,
        choice: true,
        nodes: [
          {
            id: 'temple.eye',
            name: 'Eye of the Dreamer',
            text: 'Reveals the six cells around every temple you hold',
            hl: 'Reveals the six cells',
            effects: [{ kind: 'reveal', rings: 1, around: 'temples' }],
            cost: { wisdom: 60, mana: 60 },
            lore: 'Close your eyes in the nave and you see the surrounding streets — from above, and slightly wrong.',
          },
          {
            id: 'temple.bell',
            name: 'Bell of Tides',
            text: 'Blessing reaches +1 ring',
            hl: '+1 ring',
            effects: [{ kind: 'reach', rings: 1 }],
            cost: { wisdom: 60, iron: 40 },
            lore: 'The bell is rung at low water. There is no tide on Pyhäjärvi. It rings on schedule regardless.',
          },
        ],
      },
      {
        tier: 4,
        choice: false,
        nodes: [
          {
            id: 'temple.reliquary',
            name: 'Reliquary',
            text: 'A found artefact placed here doubles its bonus',
            hl: 'doubles its bonus',
            effects: [{ kind: 'special', id: 'artefactDouble' }],
            cost: { culture: 100, gold: 80 },
            lore: 'The reliquary accepts gifts. It has, twice, returned them — to people who had not given them.',
          },
        ],
      },
      {
        tier: 5,
        choice: true,
        nodes: [
          {
            id: 'temple.open-stair',
            name: 'Open the Stair',
            text: 'Unlocks the rite Descent — walk below the map',
            hl: 'Unlocks the rite Descent',
            effects: [{ kind: 'special', id: 'unlockRite' }],
            cost: { mana: 250, wisdom: 150 },
            lore: 'The staircase goes down four hundred steps. The bottom step is warm, and wet, and breathing.',
          },
          {
            id: 'temple.seal-stair',
            name: 'Seal the Stair',
            text: 'This temple can never be lost to a rival siege',
            hl: 'never be lost',
            effects: [{ kind: 'special', id: 'siegeImmune' }],
            cost: { stone: 250, culture: 150 },
            lore: 'Some doors are best closed from this side. The masons were paid double and asked no questions.',
          },
        ],
      },
    ],
  },
};
