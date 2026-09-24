import type { BuildingDef } from '../types.js';

/** 05 · Quarry (BRDC-WORKS-003). */
export const QUARRY: BuildingDef = {
  kind: 'quarry',
  name: 'Quarry',
  subtitle: 'Louhos · Built on hills',
  sprite: 'quarry',
  hue: '0.70 0.02 280',
  lore: {
    text: 'At nine metres the granite turns black and smooth, as though polished from the other side.',
    source: 'Blasting report, Pereen rise, 1959 — sealed',
  },
  note: 'Stone raises every other work. The seam starts at this cell alone.',
  reach: {
    label: 'Seam',
    rings: 0,
    maxRings: 2,
    text: 'Works only its own cell until Deep Gallery follows the seam outward: hill cells you hold in reach then give +1 stone an hour each.',
    effect: { kind: 'producePer', resource: 'stone', amount: 1, per: 'cellInReach', terrain: 'hill' },
  },
  tree: {
    name: 'The Black Seam',
    tiers: [
      {
        tier: 1,
        choice: false,
        nodes: [
          {
            id: 'quarry.drill',
            name: 'Drill and Wedge',
            text: '+2 stone per hour',
            hl: '+2 stone per hour',
            effects: [{ kind: 'produce', yields: { stone: 2 } }],
            cost: { iron: 30, wood: 20 },
            lore: 'Drive the wedge at dawn. Stop when the stone starts ringing back.',
          },
        ],
      },
      {
        tier: 2,
        choice: false,
        nodes: [
          {
            id: 'quarry.cut-stone',
            name: 'Cut Stone',
            text: 'Every building costs 10% less stone',
            hl: '10% less stone',
            effects: [{ kind: 'costDiscount', resource: 'stone', pct: 10, target: 'build' }],
            cost: { stone: 60 },
            lore: 'The blocks come out square without being dressed. The masons are grateful and uneasy.',
          },
        ],
      },
      {
        tier: 3,
        choice: true,
        nodes: [
          {
            id: 'quarry.black-seam',
            name: 'Follow the Black Seam',
            text: '+1 iron and +1 mana per hour — and something taps back',
            hl: '+1 iron and +1 mana per hour',
            effects: [{ kind: 'produce', yields: { iron: 1, mana: 1 } }],
            cost: { stone: 80, wisdom: 40 },
            lore: 'The seam is warmer than the rock around it. At night the drillholes sweat.',
          },
          {
            id: 'quarry.masons-guild',
            name: 'Mason’s Guild',
            text: 'All works in the province +50 strength',
            hl: '+50 strength',
            effects: [{ kind: 'cellStrength', amount: 50, scope: 'provinceWorks' }],
            cost: { stone: 80, gold: 40 },
            lore: 'The guild keeps its own calendar. It has one more month than ours.',
          },
        ],
      },
      {
        tier: 4,
        choice: false,
        nodes: [
          {
            id: 'quarry.deep-gallery',
            name: 'Deep Gallery',
            text: 'Seam reaches +2 rings of hill',
            hl: '+2 rings',
            effects: [{ kind: 'reach', rings: 2 }],
            cost: { stone: 150, iron: 60 },
            lore: 'The gallery goes further than the survey says the hill extends.',
          },
        ],
      },
      {
        tier: 5,
        choice: false,
        nodes: [
          {
            id: 'quarry.floor-beneath',
            name: 'The Floor Beneath',
            text: 'Unlocks the wonder Ten Thousand Steps',
            hl: 'Unlocks the wonder',
            effects: [{ kind: 'special', id: 'unlockWonder' }],
            cost: { stone: 300, wisdom: 150 },
            lore: 'Below the last gallery the floor is dressed stone. Nobody laid it. The steps go down.',
          },
        ],
      },
    ],
  },
};
