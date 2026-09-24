import type { BuildingDef } from '../types.js';

/** 01 · The Keep (BRDC-WORKS-003). Transcribed from the Works Codex design. */
export const KEEP: BuildingDef = {
  kind: 'keep',
  name: 'The Keep',
  subtitle: 'Linna · Seat of the realm',
  sprite: 'keep',
  hue: '0.86 0.17 92',
  lore: {
    text: 'Every Keep is built on something that was already there. The masons dug four metres down and found the foundation already laid — and still warm.',
    source: 'Marginalia, Härmälä parish register, 1911',
  },
  note: 'The only building that cannot be lost to decay. It is your Hearth: where the realm began.',
  reach: {
    label: 'Influence',
    rings: 1,
    maxRings: 2,
    text: 'Every claim you make inside the ring starts stronger. The High Seat extends it one ring further.',
  },
  tree: {
    name: 'The Old Foundation',
    tiers: [
      {
        tier: 1,
        choice: false,
        nodes: [
          {
            id: 'keep.warded-walls',
            name: 'Warded Walls',
            text: "+50 strength on the Keep's own cell",
            hl: '+50 strength',
            effects: [{ kind: 'cellStrength', amount: 50, scope: 'cell' }],
            cost: { stone: 40 },
            lore: 'The mortar was mixed with lake water drawn at midnight. Nobody wrote down why.',
          },
        ],
      },
      {
        tier: 2,
        choice: false,
        nodes: [
          {
            id: 'keep.mustering-yard',
            name: 'Mustering Yard',
            text: 'Claims inside your influence start at +15 strength',
            hl: '+15 strength',
            effects: [{ kind: 'claimStrength', amount: 15, scope: 'reach' }],
            cost: { stone: 60, gold: 20 },
            lore: 'The drill sergeant counts the recruits every dawn. Some mornings there is one extra.',
          },
        ],
      },
      {
        tier: 3,
        choice: true,
        nodes: [
          {
            id: 'keep.deep-cellar',
            name: 'The Deep Cellar',
            text: 'Food storage cap +200 food, and stores never rot',
            hl: '+200 food',
            effects: [
              { kind: 'storageCap', resource: 'food', amount: 200 },
              { kind: 'special', id: 'noRot' },
            ],
            cost: { stone: 80, wisdom: 30 },
            lore: 'Something beneath the cellar breathes in winter. The frost on the barrels forms in rings.',
          },
          {
            id: 'keep.high-seat',
            name: 'The High Seat',
            text: 'Influence reaches +1 ring',
            hl: '+1 ring',
            effects: [{ kind: 'reach', rings: 1 }],
            cost: { stone: 80, gold: 40 },
            lore: 'From the high seat you can see every roof in the reach. Some of them have windows facing inward.',
          },
        ],
      },
      {
        tier: 4,
        choice: false,
        nodes: [
          {
            id: 'keep.council',
            name: 'Council of Whispers',
            text: '+2 wisdom per hour for every province you hold',
            hl: '+2 wisdom per hour',
            effects: [{ kind: 'producePer', resource: 'wisdom', amount: 2, per: 'province' }],
            cost: { gold: 120, culture: 60 },
            lore: 'The councillors meet in a room without a door. They are always already seated when you arrive.',
          },
        ],
      },
      {
        tier: 5,
        choice: true,
        nodes: [
          {
            id: 'keep.crown',
            name: 'Crown of the Sleeper',
            text: 'The Keep cannot be besieged while you walk within 500 m',
            hl: 'cannot be besieged',
            effects: [{ kind: 'special', id: 'siegeImmune' }],
            cost: { mana: 200, stone: 150 },
            lore: 'Wear it, and you dream the same dream as the thing under the lake. It does not notice you. Yet.',
          },
          {
            id: 'keep.unbroken-line',
            name: 'The Unbroken Line',
            text: 'Cells on your province borders never decay below 200',
            hl: 'never decay below 200',
            effects: [{ kind: 'decayFloor', floor: 200, scope: 'border' }],
            cost: { culture: 200, stone: 150 },
            lore: 'A line drawn in salt, walked every solstice, and never once crossed from the other side.',
          },
        ],
      },
    ],
  },
};
