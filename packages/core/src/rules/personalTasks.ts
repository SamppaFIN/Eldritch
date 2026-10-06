/**
 * Each investigator's own tale (BRDC-INVEST-002): three steps, one after another, on the
 * Tavern's task engine (QUEST-009) — but kept in the Keep, under the investigator, and
 * only for the archetype it belongs to. The last step raises their skill and goes into
 * the Hall of Fame with the kingdom.
 *
 * Written in the Fuming Lake's voice, with this game's own people (no Arkham Horror names).
 */
import type { Task } from './tasks.js';

export const PERSONAL_TASKS: readonly Task[] = [
  // Agnes Lowe, the Librarian — the book that came back with more pages.
  {
    id: 'agnes-1', personal: 'librarian', title: 'The Page That Came Back', giver: 'Agnes Lowe',
    text: '"The extra page is a map of something that should not be on our ground. Study it where it is."',
    objective: { kind: 'investigate', count: 1 }, reward: { xp: 100, pool: { wisdom: 20 } },
    done: 'The anomaly has the page’s handwriting on it. Agnes does not like that at all.',
  },
  {
    id: 'agnes-2', personal: 'librarian', after: 'agnes-1', title: 'Read It Aloud', giver: 'Agnes Lowe',
    text: 'In the reading room, after closing, the page has to be read aloud once. Steady voice.',
    objective: { kind: 'check', skill: 'lore', need: 2 }, reward: { xp: 150, pool: { wisdom: 30 } },
    done: 'The page goes quiet. Somewhere a shelf settles, like a sigh.',
    fail: { text: 'The page reads you back.', sanity: 2, condition: 'amnesia' },
  },
  {
    id: 'agnes-3', personal: 'librarian', after: 'agnes-2', finale: true, title: 'Where Books Go to Rest', giver: 'Agnes Lowe',
    text: '"Take it to a temple on two days. Books want to be returned, even the wrong ones."',
    objective: { kind: 'temple', days: 2 }, reward: { xp: 250, pool: { wisdom: 50 } },
    done: 'On the second day the page is gone and the book has its usual number of pages. Agnes counts them anyway.',
  },
  // Tobias Wren, the Surveyor — the lake a metre wider every spring.
  {
    id: 'tobias-1', personal: 'surveyor', title: 'Measure the Shore', giver: 'Tobias Wren',
    text: '"Walk eight of your hexes. I want a baseline before the water moves again."',
    objective: { kind: 'visit', count: 8 }, reward: { xp: 100, pool: { stone: 25 } },
    done: 'The baseline is off by a metre in a direction that is not a direction.',
  },
  {
    id: 'tobias-2', personal: 'surveyor', after: 'tobias-1', title: 'A Tower to Sight From', giver: 'Tobias Wren',
    text: '"I need a Watchtower. The theodolite will not point at it from the ground."',
    objective: { kind: 'build', id: 'watchtower' }, reward: { xp: 150, pool: { wood: 40 } },
    done: 'From the top, the lake is exactly as wide as it should be. From the bottom, it is not.',
  },
  {
    id: 'tobias-3', personal: 'surveyor', after: 'tobias-2', finale: true, title: 'The Reading', giver: 'Tobias Wren',
    text: 'One last sighting at dusk, when the lake is honest. Keep your eye steady.',
    objective: { kind: 'check', skill: 'observe', need: 2 }, reward: { xp: 250, pool: { stone: 50 } },
    done: 'The numbers agree at last. Tobias writes them down and never looks at them again.',
    fail: { text: 'The theodolite points at you.', sanity: 2, condition: 'paranoia' },
  },
  // Mara Quill, the Dockworker — the crate that answered back.
  {
    id: 'mara-1', personal: 'dockworker', title: 'Planks for a Lid', giver: 'Mara Quill',
    text: '"That crate needs a proper lid. Raise a Sawmill and I will nail it shut myself."',
    objective: { kind: 'build', id: 'sawmill' }, reward: { xp: 100, pool: { wood: 30 } },
    done: 'The new lid fits. Something underneath it approves of the joinery.',
  },
  {
    id: 'mara-2', personal: 'dockworker', after: 'mara-1', title: 'Hold It Shut', giver: 'Mara Quill',
    text: 'At midnight the crate pushes back. Someone has to sit on it.',
    objective: { kind: 'check', skill: 'fight', need: 2 }, reward: { xp: 150, pool: { iron: 25 } },
    done: 'By morning the pushing stops. Mara’s crowbar is bent into a shape that means something.',
    fail: { text: 'The lid lifts. You owe the dock a new crate.', sanity: 1, condition: 'debt' },
  },
  {
    id: 'mara-3', personal: 'dockworker', after: 'mara-2', finale: true, title: 'The Long Way Home', giver: 'Mara Quill',
    text: '"Carry it home the long way, so it forgets the way back. Fifteen hexes."',
    objective: { kind: 'visit', count: 15 }, reward: { xp: 250, pool: { gold: 60 } },
    done: 'At the end of the walk the crate is lighter. Mara does not open it. Nobody asks her to.',
  },
  // Elias Dunmore, the Medium — the table that rapped back.
  {
    id: 'elias-1', personal: 'medium', title: 'A Quiet Room', giver: 'Elias Dunmore',
    text: '"I need to sit somewhere holy before I listen again. One day at a temple."',
    objective: { kind: 'temple', days: 1 }, reward: { xp: 100, pool: { mana: 20 } },
    done: 'In the temple the voice is silent. It is waiting, not gone.',
  },
  {
    id: 'elias-2', personal: 'medium', after: 'elias-1', title: 'Answer the Table', giver: 'Elias Dunmore',
    text: 'The table raps three times. This time, answer it. Keep your nerve.',
    objective: { kind: 'check', skill: 'will', need: 2 }, reward: { xp: 150, pool: { mana: 30 } },
    done: 'It gives a name. Elias writes it down backwards, as the old books say.',
    fail: { text: 'You answer. It answers back, and stays.', sanity: 2, condition: 'cursed' },
  },
  {
    id: 'elias-3', personal: 'medium', after: 'elias-2', finale: true, title: 'Where the Voice Lives', giver: 'Elias Dunmore',
    text: '"The name is written on two strange places on your ground. Study them both."',
    objective: { kind: 'investigate', count: 2 }, reward: { xp: 250, pool: { mana: 50 } },
    done: 'Both anomalies say the name, and then nothing. For the first time in years Elias sleeps through the night.',
  },
];
