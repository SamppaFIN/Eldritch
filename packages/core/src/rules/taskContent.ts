/**
 * The Tavern board's ten tasks (BRDC-QUEST-009), in the Fuming Lake's own voice
 * (`docs/backlog/fuming-lake.md`: Pratchett meets Lovecraft, bureaucratic Elder Gods,
 * apologetic signage) and with its own people — Cornelius the hermit, Grug the troll,
 * Management — and v2's Aurora, Hevy and the Wandering Merchant (EXTRACTION B2).
 */
import type { Task } from './tasks.js';
import { PERSONAL_TASKS } from './personalTasks.js';
import { VILLAGE_TASKS } from './suzerain.js';

export const TASKS: readonly Task[] = [
  {
    id: 'cornelius-company', title: 'Cornelius Needs Company', giver: 'Cornelius, professional hermit',
    text: '"Walk your ground for me. Five hexes. Rocks are excellent conversationalists, but they never go anywhere."',
    objective: { kind: 'visit', count: 5 }, reward: { xp: 60, pool: { food: 30 } },
    done: 'Cornelius nods at each name you give him, and tells the rocks. The rocks are thrilled.',
    ally: 'cornelius',
  },
  {
    id: 'apologetic-signage', title: 'Apologetic Signage', giver: '-Management',
    text: 'A typed notice: "Management regrets the recent unpleasantness and requests a Monument. Any Monument. -Management"',
    objective: { kind: 'build', id: 'monument' }, reward: { xp: 80, pool: { culture: 20 } },
    done: 'A second notice appears overnight: "Management is satisfied. Management is never satisfied. Disregard. -Management"',
  },
  {
    id: 'granary-question', title: 'The Granary Question', giver: 'The landlord of the Drowned Man',
    text: '"Ale needs barley, and barley needs a Farm. I have not blinked since 1980, and I am not starting for you."',
    objective: { kind: 'build', id: 'farm' }, reward: { xp: 60, pool: { gold: 25 } },
    done: 'The first barrel tastes faintly of salt. The landlord calls it perfect, without blinking.',
  },
  {
    id: 'under-the-ice', title: 'Something Under the Ice', giver: 'A fisherman with very wide eyes',
    text: '"There is a thing on your ground that should not be. Study it before it studies you."',
    objective: { kind: 'investigate', count: 1 }, reward: { xp: 100, pool: { wisdom: 20 } },
    done: 'Your notes are good. The fisherman reads them, and moves inland.',
  },
  {
    id: 'grug-riddle', title: 'What Is the Sound of One Hand Thinking?', giver: 'Grug, of the bridge',
    text: 'Grug has pinned his riddle to the board. He has also pinned the last person who answered it wrong.',
    objective: { kind: 'check', skill: 'lore', need: 2 }, reward: { xp: 120, pool: { wisdom: 30 } },
    done: 'You answer. Grug thinks about it with both hands, and lets you keep the board.',
    fail: { text: 'Grug deconstructs your answer in three sentences, then starts on you.', sanity: 2, condition: 'paranoia' },
    ally: 'grug',
  },
  {
    id: 'healing-vigil', title: 'The Healing Shrine Vigil', giver: 'The keeper of the Healing Shrine',
    text: '"Visit a temple on two different days. The gods keep office hours, and they notice who comes back."',
    objective: { kind: 'temple', days: 2 }, reward: { xp: 90, pool: { mana: 25 } },
    done: 'On the second day the shrine is warmer than the weather allows.',
  },
  {
    id: 'aurora-errand', title: "Aurora's Errand", giver: 'Aurora, the Dawn Bringer',
    text: '"Walk twelve hexes of your realm before I come again. I want to see where the light has to reach."',
    objective: { kind: 'visit', count: 12 }, reward: { xp: 150, pool: { culture: 25, mana: 15 } },
    done: 'At dawn the light finds every hex you walked, and lingers on a few.',
  },
  {
    id: 'hevy-weather', title: "Hevy's Weather", giver: 'Hevy, the Storm Bringer',
    text: 'Hevy offers a storm in a jar. Holding it shut takes nerve, not muscle.',
    objective: { kind: 'check', skill: 'will', need: 2 }, reward: { xp: 120, pool: { mana: 30 } },
    done: 'The jar stays shut. Hevy laughs like thunder far off and leaves it with you.',
    fail: { text: 'The lid lifts a hair. The storm remembers your face.', sanity: 1, condition: 'cursed' },
  },
  {
    id: 'merchant-timber', title: 'Timber for the Wandering Merchant', giver: 'The Wandering Merchant',
    text: '"A Sawmill, friend. I sell maps, charms and boost potions, and none of them float without planks."',
    objective: { kind: 'build', id: 'sawmill' }, reward: { xp: 70, pool: { gold: 40 } },
    done: 'The Merchant pays in coin that is almost certainly local currency.',
    ally: 'merchant',
  },
  {
    id: 'count-the-lurkers', title: 'Count the Shadow Lurkers', giver: 'The Night Watch',
    text: 'Something moves in the shadow of the church. The watch wants a number, not a feeling.',
    objective: { kind: 'check', skill: 'observe', need: 2 }, reward: { xp: 110, pool: { stone: 30 } },
    done: 'Seven. The watch writes it down and sleeps better for the number.',
    fail: { text: 'You count eight, then nine, then they count you.', sanity: 2 },
  },
];

/** Any task — the Tavern's, an investigator's own (BRDC-INVEST-002) or a village's (BRDC-SUZERAIN-001). */
export const taskById = (id: string): Task | null =>
  TASKS.find((t) => t.id === id) ?? PERSONAL_TASKS.find((t) => t.id === id) ?? VILLAGE_TASKS.find((t) => t.id === id) ?? null;
