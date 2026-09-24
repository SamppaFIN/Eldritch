import type { BuildingDef } from '../types.js';

/** 07 · Night Market (BRDC-WORKS-003). */
export const MARKET: BuildingDef = {
  kind: 'market',
  name: 'Night Market',
  subtitle: 'Yötori · Built on trade',
  sprite: 'market',
  hue: '0.33 0.11 320',
  lore: {
    text: 'Prices at the Wednesday market are quoted in coin. Prices at the other market — the one after the lamps go out — are quoted in years.',
    source: 'Overheard at the Kenkätie stalls, 2019',
  },
  note: 'Gold and culture. Take the market and its route becomes yours.',
  reach: {
    label: 'Trade Route',
    rings: 2,
    maxRings: 2,
    text: 'Trade cells in the ring pay the market’s holder once the Caravan Road is learned.',
  },
  tree: {
    name: 'The Last Bargain',
    tiers: [
      {
        tier: 1,
        choice: false,
        nodes: [
          {
            id: 'market.stalls',
            name: 'Stalls',
            text: '+2 gold per hour',
            hl: '+2 gold per hour',
            effects: [{ kind: 'produce', yields: { gold: 2 } }],
            cost: { wood: 30 },
            lore: 'Stalls go up at dusk. By dawn there is one more stall than there were traders.',
          },
        ],
      },
      {
        tier: 2,
        choice: false,
        nodes: [
          {
            id: 'market.weights',
            name: 'Weights and Measures',
            text: 'Every trade loses 10% less to the exchange',
            hl: '10% less',
            effects: [{ kind: 'costDiscount', resource: 'all', pct: 10, target: 'trade' }],
            cost: { iron: 40, gold: 20 },
            lore: 'The weights are honest. The scale, less so.',
          },
        ],
      },
      {
        tier: 3,
        choice: true,
        nodes: [
          {
            id: 'market.caravan-road',
            name: 'Caravan Road',
            text: '+1 gold for each trade cell in reach',
            hl: '+1 gold',
            effects: [{ kind: 'producePer', resource: 'gold', amount: 1, per: 'cellInReach', terrain: 'market' }],
            cost: { gold: 60, stone: 40 },
            lore: 'Caravans arrive from towns that are not on the map. Their coin spends anyway.',
          },
          {
            id: 'market.after-dark',
            name: 'The After-Dark Stalls',
            text: '+2 culture, but −1 food each hour',
            hl: '+2 culture',
            effects: [{ kind: 'produce', yields: { culture: 2, food: -1 } }],
            cost: { culture: 60 },
            lore: 'What is sold there cannot be bought back.',
          },
        ],
      },
      {
        tier: 4,
        choice: false,
        nodes: [
          {
            id: 'market.counting-house',
            name: 'Counting House',
            text: 'Gold storage cap +500 gold',
            hl: '+500 gold',
            effects: [{ kind: 'storageCap', resource: 'gold', amount: 500 }],
            cost: { gold: 120, stone: 60 },
            lore: 'The accountants count in base twelve. The thirteenth column is never totalled.',
          },
        ],
      },
      {
        tier: 5,
        choice: false,
        nodes: [
          {
            id: 'market.last-bargain',
            name: 'The Last Bargain',
            text: 'Trade anything for anything, once',
            hl: 'anything for anything',
            effects: [{ kind: 'special', id: 'tradeAnything' }],
            cost: { gold: 400, culture: 200 },
            lore: 'Once, you may ask the market for anything. It will name a price. You will pay it.',
          },
        ],
      },
    ],
  },
};
