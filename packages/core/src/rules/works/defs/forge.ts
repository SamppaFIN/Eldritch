import type { BuildingDef } from '../types.js';

/** 06 · Forge (BRDC-WORKS-003). */
export const FORGE: BuildingDef = {
  kind: 'forge',
  name: 'Forge',
  subtitle: 'Paja · Built on hill or settlement',
  sprite: 'forge',
  hue: '0.68 0.19 40',
  lore: {
    text: 'The bellows were rebuilt twice. Both times the smith swore the fire had been breathing on its own.',
    source: 'Insurance claim, Härmälänranta works, 1947',
  },
  note: 'Iron gates towers and every siege bonus.',
  reach: {
    label: 'Smelting',
    rings: 1,
    maxRings: 1,
    text: 'Bog iron and ore deposits in the ring are smelted here automatically.',
  },
  tree: {
    name: 'The Unquenched Fire',
    tiers: [
      {
        tier: 1,
        choice: false,
        nodes: [
          {
            id: 'forge.hot-hearth',
            name: 'Hot Hearth',
            text: '+2 iron per hour',
            hl: '+2 iron per hour',
            effects: [{ kind: 'produce', yields: { iron: 2 } }],
            cost: { stone: 30, wood: 20 },
            lore: 'The hearth has never fully gone out. Not in the fire of 1947, not in the flood of 1966.',
          },
        ],
      },
      {
        tier: 2,
        choice: false,
        nodes: [
          {
            id: 'forge.bloomery',
            name: 'Bloomery',
            text: 'Bog iron deposits in reach give +2 iron each',
            hl: '+2 iron each',
            effects: [{ kind: 'depositBonus', deposit: 'bog-iron', resource: 'iron', amount: 2 }],
            cost: { stone: 40, iron: 30 },
            lore: 'The bloom comes out of the furnace in the shape of a closed hand.',
          },
        ],
      },
      {
        tier: 3,
        choice: true,
        nodes: [
          {
            id: 'forge.tempered-edge',
            name: 'Tempered Edge',
            text: 'Your claims gain +20 strength against rivals',
            hl: '+20 strength',
            effects: [{ kind: 'claimStrength', amount: 20, scope: 'rival' }],
            cost: { iron: 60, gold: 30 },
            lore: 'Quench the blade in lake water and it holds an edge for a century. Also, it hums.',
          },
          {
            id: 'forge.bell-founder',
            name: 'Bell-Founder',
            text: 'The Iron Bell Foundry wonder costs 25% less iron',
            hl: '25% less iron',
            effects: [{ kind: 'special', id: 'wonderDiscount' }],
            cost: { iron: 60, culture: 40 },
            lore: 'They cast a practice bell first. It was never rung. It rang anyway.',
          },
        ],
      },
      {
        tier: 4,
        choice: false,
        nodes: [
          {
            id: 'forge.star-metal',
            name: 'Star-Metal',
            text: 'Every iron smelted gives +1 mana',
            hl: '+1 mana',
            effects: [{ kind: 'produceFrom', from: 'iron', resource: 'mana', ratio: 1 }],
            cost: { iron: 100, mana: 80 },
            lore: 'Iron that fell from the sky in 1842. It is heavier on moonless nights.',
          },
        ],
      },
      {
        tier: 5,
        choice: false,
        nodes: [
          {
            id: 'forge.unquenched',
            name: 'The Unquenched',
            text: '+5 iron; this cell is immune to decay',
            hl: '+5 iron',
            effects: [
              { kind: 'produce', yields: { iron: 5 } },
              { kind: 'decayFloor', floor: 'immune', scope: 'cell' },
            ],
            cost: { iron: 200, wood: 120 },
            lore: 'Let the fire decide when it is finished. It has not decided yet.',
          },
        ],
      },
    ],
  },
};
