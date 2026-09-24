import type { BuildingDef } from '../types.js';

/** 04 · Sawmill (BRDC-WORKS-003). */
export const SAWMILL: BuildingDef = {
  kind: 'sawmill',
  name: 'Sawmill',
  subtitle: 'Saha · Built on forest',
  sprite: 'sawmill',
  hue: '0.72 0.12 70',
  lore: {
    text: 'The blades are sharpened on Sundays. The logs from the eastern stand come in already split, and nobody on the crew will say who split them.',
    source: 'Foreman’s log, Rantaperkiö mill, 1922',
  },
  note: 'Timber is spent on almost every other building.',
  reach: {
    label: 'Felling',
    rings: 1,
    maxRings: 2,
    text: 'Forest cells you hold in the ring give +1 timber an hour each. The Log Flume pulls from the second ring.',
    effect: { kind: 'producePer', resource: 'wood', amount: 1, per: 'cellInReach', terrain: 'forest' },
  },
  tree: {
    name: 'The Split Grain',
    tiers: [
      {
        tier: 1,
        choice: false,
        nodes: [
          {
            id: 'sawmill.iron-teeth',
            name: 'Iron Teeth',
            text: '+2 timber per hour',
            hl: '+2 timber per hour',
            effects: [{ kind: 'produce', yields: { wood: 2 } }],
            cost: { iron: 30 },
            lore: 'New blades every season. The old ones are buried, not melted. That is the rule.',
          },
        ],
      },
      {
        tier: 2,
        choice: false,
        nodes: [
          {
            id: 'sawmill.log-flume',
            name: 'Log Flume',
            text: 'Felling reaches +1 ring of forest',
            hl: '+1 ring',
            effects: [{ kind: 'reach', rings: 1 }],
            cost: { wood: 60, stone: 20 },
            lore: 'Logs float down the flume at night. Sometimes more arrive than were cut.',
          },
        ],
      },
      {
        tier: 3,
        choice: true,
        nodes: [
          {
            id: 'sawmill.charcoal-pits',
            name: 'Charcoal Pits',
            text: 'Your Forges yield +20% iron',
            hl: '+20% iron',
            effects: [{ kind: 'worksMult', target: 'forge', resource: 'iron', pct: 20 }],
            cost: { wood: 80 },
            lore: 'The pits smoulder for weeks. The smoke drifts against the wind, towards the temple.',
          },
          {
            id: 'sawmill.old-growth-pact',
            name: 'Old-Growth Pact',
            text: 'Ancient Oak deposits in reach yield double timber',
            hl: 'double timber',
            effects: [{ kind: 'depositBonus', deposit: 'ancient-oak', resource: 'wood', mult: 2 }],
            cost: { culture: 60, mana: 40 },
            lore: 'Ask the oldest tree before you cut its children. It will answer. Do not ask what it wants in return.',
          },
        ],
      },
      {
        tier: 4,
        choice: false,
        nodes: [
          {
            id: 'sawmill.shipwright',
            name: 'Shipwright’s Slip',
            text: 'Water cells no longer break a walk streak',
            hl: 'no longer break a walk streak',
            effects: [{ kind: 'special', id: 'streakWater' }],
            cost: { wood: 120, iron: 40 },
            lore: 'The first boat off the slip came back empty. The second came back with a passenger nobody had sent.',
          },
        ],
      },
      {
        tier: 5,
        choice: false,
        nodes: [
          {
            id: 'sawmill.pale-timber',
            name: 'The Pale Timber',
            text: '+4 timber; temples built from it gain a blessing ring',
            hl: '+4 timber',
            effects: [
              { kind: 'produce', yields: { wood: 4 } },
              { kind: 'special', id: 'templeRing' },
            ],
            cost: { wood: 200, mana: 100 },
            lore: 'White wood, grainless, that grows only where something is buried. It never rots and never burns.',
          },
        ],
      },
    ],
  },
};
