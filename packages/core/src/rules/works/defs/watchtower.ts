import type { BuildingDef } from '../types.js';

/** 08 · Watchtower (BRDC-WORKS-003). Not buildable yet — BRDC-BUILD-013 moved it. */
export const WATCHTOWER: BuildingDef = {
  kind: 'watchtower',
  name: 'Watchtower',
  subtitle: 'Vartiotorni · Built on hill or plain',
  sprite: 'watchtower',
  hue: '0.79 0.14 220',
  lore: {
    text: 'From the top you can see the whole lake. On clear nights you can see a second lake beneath it, with its own lights.',
    source: 'Night-watch logbook, entry of 3 October',
  },
  note: 'It produces little. Its value is what it shows you — rival claims, fading cells and caches inside its sight.',
  reach: {
    label: 'Sight',
    rings: 0,
    maxRings: 3,
    text: 'Lookout sees ring one. Second Platform adds ring two. Spyglass of Ground Lenses adds ring three.',
  },
  tree: {
    name: 'What the Lake Sees',
    tiers: [
      {
        tier: 1,
        choice: false,
        nodes: [
          {
            id: 'watchtower.lookout',
            name: 'Lookout',
            text: 'Reveals the six cells around the tower',
            hl: 'Reveals the six cells',
            effects: [
              { kind: 'reach', rings: 1 },
              { kind: 'reveal', rings: 1, around: 'self' },
            ],
            cost: { wood: 30, stone: 20 },
            lore: 'The first watchman kept a list of every boat on the lake. Some entries have no oars.',
          },
        ],
      },
      {
        tier: 2,
        choice: false,
        nodes: [
          {
            id: 'watchtower.second-platform',
            name: 'Second Platform',
            text: 'Sight reaches +1 ring',
            hl: '+1 ring',
            effects: [{ kind: 'reach', rings: 1 }],
            cost: { stone: 60, iron: 30 },
            lore: 'The stair to the second platform has thirty steps going up and thirty-one coming down.',
          },
        ],
      },
      {
        tier: 3,
        choice: true,
        nodes: [
          {
            id: 'watchtower.signal-fire',
            name: 'Signal Fire',
            text: 'Rival sieges inside your sight are announced the moment they start',
            hl: 'announced the moment they start',
            effects: [{ kind: 'special', id: 'siegeAlert' }],
            cost: { wood: 40, wisdom: 30 },
            lore: 'Light the fire when something moves on the water. Keep it lit until it stops.',
          },
          {
            id: 'watchtower.spyglass',
            name: 'Spyglass of Ground Lenses',
            text: 'Sight reaches +1 ring',
            hl: '+1 ring',
            effects: [{ kind: 'reach', rings: 1 }],
            cost: { iron: 60, wisdom: 40 },
            lore: 'The lenses were ground from lake ice that never melted. They show a little further than they should.',
          },
        ],
      },
      {
        tier: 4,
        choice: false,
        nodes: [
          {
            id: 'watchtower.night-watch',
            name: 'Night Watch',
            text: 'Fading cells in sight decay half as fast',
            hl: 'half as fast',
            effects: [{ kind: 'decayMult', pct: 50 }],
            cost: { food: 80, wisdom: 60 },
            lore: 'Someone is always on watch. The roster has one name nobody recognises, and it is always their turn.',
          },
        ],
      },
      {
        tier: 5,
        choice: true,
        nodes: [
          {
            id: 'watchtower.beacon',
            name: 'Beacon to the Other Lake',
            text: 'See rival research in every work inside your sight',
            hl: 'See rival research',
            effects: [{ kind: 'special', id: 'seeRivalResearch' }],
            cost: { mana: 200, wisdom: 100 },
            lore: 'Answer the lights beneath the water. They have been signalling for a long time.',
          },
          {
            id: 'watchtower.looks-back',
            name: 'The Tower Looks Back',
            text: 'Rival claims inside your sight lose 40 strength',
            hl: 'lose 40 strength',
            effects: [{ kind: 'special', id: 'rivalStrengthInReach' }],
            cost: { iron: 200, mana: 100 },
            lore: 'Stare long enough from the top and whatever is out there knows it is being watched. It minds.',
          },
        ],
      },
    ],
  },
};
