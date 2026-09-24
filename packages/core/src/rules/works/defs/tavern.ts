import type { BuildingDef } from '../types.js';

/** 09 · The Drowned Man (BRDC-WORKS-003). */
export const TAVERN: BuildingDef = {
  kind: 'tavern',
  name: 'The Drowned Man',
  subtitle: 'Hukkunut mies · taverna · Built on settlement or trade',
  sprite: 'tavern',
  hue: '0.60 0.10 200',
  lore: {
    text: 'The Drowned Man serves ale that tastes faintly of salt. The regulars say it is the only honest drink in Tampere, and that the landlord has not blinked since 1980.',
    source: 'Review card, pinned behind the bar',
  },
  note: 'The quest board lives here. Every active chain in the province is listed on its wall and nowhere else.',
  reach: {
    label: 'Rumour',
    rings: 1,
    maxRings: 2,
    text: 'Caches inside the ring appear on the quest board as rumours. Whispering Corner widens it.',
  },
  tree: {
    name: 'Last Orders',
    tiers: [
      {
        tier: 1,
        choice: false,
        nodes: [
          {
            id: 'tavern.quest-board',
            name: 'Quest Board',
            text: 'Lists every quest in the province',
            hl: 'every quest in the province',
            // What the Tavern already does (BRDC-TAVERN-001) — learning it names it.
            effects: [],
            cost: { wood: 30, gold: 10 },
            lore: 'Notices go up overnight. The handwriting is always the same, whoever pins them.',
          },
        ],
      },
      {
        tier: 2,
        choice: false,
        nodes: [
          {
            id: 'tavern.hearth-and-hops',
            name: 'Hearth and Hops',
            text: 'An adjacent Ale Cellar gives double gold',
            hl: 'double gold',
            effects: [{ kind: 'special', id: 'adjacentMult' }],
            cost: { food: 40, gold: 20 },
            lore: 'The hops are dried over the hearth. The smoke smells of seaweed, forty kilometres from any sea.',
          },
        ],
      },
      {
        tier: 3,
        choice: true,
        nodes: [
          {
            id: 'tavern.travellers-rest',
            name: 'Travellers’ Rest',
            text: '+1 active quest slot',
            hl: '+1 active quest slot',
            effects: [{ kind: 'special', id: 'questSlot' }],
            cost: { wood: 60, gold: 40 },
            lore: 'Room seven is always taken. The key is always on its hook.',
          },
          {
            id: 'tavern.whispering-corner',
            name: 'Whispering Corner',
            text: 'Rumour reaches +1 ring; one cache revealed a day',
            hl: '+1 ring',
            effects: [
              { kind: 'reach', rings: 1 },
              { kind: 'special', id: 'cacheRumour' },
            ],
            cost: { culture: 40, wisdom: 40 },
            lore: 'Sit in the corner booth and you will hear something useful. You will not see who said it.',
          },
        ],
      },
      {
        tier: 4,
        choice: false,
        nodes: [
          {
            id: 'tavern.private-room',
            name: 'The Private Room',
            text: 'Wager stakes won here +50% tokens',
            hl: '+50% tokens',
            effects: [{ kind: 'special', id: 'wagerBonus' }],
            cost: { gold: 100, culture: 50 },
            lore: 'Bets are settled in the back. The losers leave by the other door.',
          },
        ],
      },
      {
        tier: 5,
        choice: false,
        nodes: [
          {
            id: 'tavern.last-round',
            name: 'The Last Round',
            text: 'Once a week, restore one fading cell to full strength',
            hl: 'restore one fading cell',
            effects: [{ kind: 'special', id: 'restoreFading' }],
            cost: { gold: 150, mana: 100 },
            lore: 'Time, gentlemen. The landlord rings the bell, and for one hour the clocks in the district agree with him.',
          },
        ],
      },
    ],
  },
};
