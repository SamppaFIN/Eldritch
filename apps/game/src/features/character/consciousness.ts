/**
 * What a Consciousness level means, in lore (BRDC-CHAR-001).
 *
 * The rule tables carry only the milestone names (`LEVELS` in core). The words are the
 * app's — a short line for the list, a paragraph for the one you are at. Five milestones;
 * a level between two takes the lower one's name and its lore.
 */
export interface Milestone {
  level: number;
  name: string;
  blurb: string;
  long: string;
}

export const MILESTONES: readonly Milestone[] = [
  {
    level: 1,
    name: 'Dormant',
    blurb: 'The ground is just ground. You have not looked at it properly yet.',
    long: 'You walk the world the way everyone does — as a surface to cross. The lines under it, the ones the Ley-line draws, are there whether you see them or not. You do not, yet. This is where everyone starts, and most people stay.',
  },
  {
    level: 5,
    name: 'Awakening',
    blurb: 'The lines under the streets have started to show through.',
    long: 'Something has shifted. The loop you walked did not just close — it *took*, and you felt it take. Consciousness 6 means the Ground answers when you ask, that a border is a real thing and not a drawing, and that the fumes over a certain lake are not weather. You are awake enough to be useful now. To what, is the question you should be asking.',
  },
  {
    level: 10,
    name: 'Aware',
    blurb: 'You can feel a rival\'s ground from across a district.',
    long: 'The map is no longer a picture you read; it is a pressure you feel. Corruption is easier — you know where a border is thin without walking it — and the places that have earned names hum at you as you pass. Being Aware is comfortable. That is the danger of it.',
  },
  {
    level: 15,
    name: 'Enlightened',
    blurb: 'The geometry was always the point. You see it everywhere now.',
    long: 'Sacred geometry stops being decoration on a loading screen and starts being the thing the loading screen was covering. Hexagons, vesicae, the flower — they are how the world is jointed. An Enlightened walker does not claim ground so much as *recognise* it was always theirs. The Deep finds this stage particularly convenient.',
  },
  {
    level: 20,
    name: 'Transcendent',
    blurb: 'There is not much of the person you were left to speak of.',
    long: 'The cap. Beyond here the curve does not go — v2 let it, and the player it made stopped being able to play. At Transcendent the distinction between you and the territory is administrative. You are a feature of the map. The map is content with this. You, what remains of you, are not consulted.',
  },
];

/** The milestone in force at a level (level 6 → Awakening). */
export function milestoneForLevel(level: number): Milestone {
  let hit = MILESTONES[0] as Milestone;
  for (const m of MILESTONES) if (level >= m.level) hit = m;
  return hit;
}
