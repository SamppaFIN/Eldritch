/**
 * What each opening mechanic is called, and what it says (BRDC-TUTOR-001).
 *
 * The gates and the reward are core's (`rules/unlock.ts`); the words, the geometry and
 * the onward link are the app's — the same split `BUILDINGS` and `catalogue.tsx` make.
 *
 * Rules the copy is held to, from `claude.md` §14: it is read outdoors, in daylight, one
 * thumb, while walking. So: one sentence of what this is, one of what to do with it, both
 * under twenty words. Nothing here repeats a wiki page; `see` points at one instead.
 */
import { BUILDINGS } from '@es3/core';
import type { BuildingId, ResourceKind, ResourceLesson, UnlockId } from '@es3/core';
import type { WikiRef } from '../help/wikiPages.js';
import { BUILDING_NAME } from '../territory/names.js';

export interface UnlockCopy {
  /** What just became available, as a name. */
  title: string;
  /** What it is, in one sentence. */
  what: string;
  /** What to do about it, in one sentence, imperative. */
  now: string;
  /**
   * The page to read next, or null where the wiki has none yet.
   *
   * `neighbours` is the null: the city state is on the map and can be walked to, but
   * there is no page about city states to send anyone to. That gap is BRDC-WIKI-001's,
   * and a link to nothing would be worse than no link.
   */
  see: WikiRef | null;
}

/**
 * A resource met for the first time (field report 2026-09-30: *"jos löydät questin tai UUDEN
 * resurssin, niin peli ilmoittaa mitä sillä voi tehdä"*). What it is, then what it buys —
 * the Works that cost it, read from `BUILDINGS`, so the list never goes stale.
 */
const RESOURCE_WHAT: Readonly<Record<Exclude<ResourceKind, 'tokens'>, [string, string]>> = {
  wood: ['Timber', 'Forest hexes and Sawmills give it.'],
  stone: ['Stone', 'Hills and Quarries give it.'],
  iron: ['Iron', 'Hills and Forges give it.'],
  food: ['Food', 'Your citizens eat it. A full granary births a new one.'],
  gold: ['Gold', 'Markets and settlements give it.'],
  wisdom: ['Wisdom', 'Watchtowers, temples and the Keep give it.'],
  mana: ['Mana', 'Temples and the Keep give it.'],
  culture: ['Culture', 'Monuments and Taverns give it.'],
};

const HAND_USE: Partial<Record<ResourceKind, string>> = {
  food: 'Staff Farmsteads and keep the granary filling.',
  wisdom: 'Spend it in Research on the Lore — it opens new Works.',
  mana: 'Cast Rites with it, from the Keep and from a hex card.',
};

function usesOf(kind: ResourceKind): string {
  const works = (Object.keys(BUILDINGS) as BuildingId[])
    .filter((id) => !BUILDINGS[id].masterwork && (BUILDINGS[id].cost[kind] ?? 0) > 0)
    .map((id) => BUILDING_NAME[id]);
  if (works.length === 0) return 'Keep it: the Keep and the Lore will ask for it.';
  const shown = works.slice(0, 4);
  return `Works that cost it: ${shown.join(', ')}${works.length > shown.length ? ' and more' : ''}.`;
}

const RESOURCE_COPY = Object.fromEntries(
  (Object.keys(RESOURCE_WHAT) as Exclude<ResourceKind, 'tokens'>[]).map((k) => [
    `res-${k}`,
    {
      title: `New resource · ${RESOURCE_WHAT[k][0]}`,
      what: RESOURCE_WHAT[k][1],
      now: HAND_USE[k] ? `${HAND_USE[k]} ${usesOf(k)}` : usesOf(k),
      see: null,
    },
  ]),
) as Record<ResourceLesson, UnlockCopy>;

export const UNLOCK_COPY: Readonly<Record<UnlockId, UnlockCopy>> = {
  ...RESOURCE_COPY,
  resources: {
    title: 'The ground pays',
    // "once when taken" went with the claim payout (2026-09-29, v0.6.67).
    what: 'Every hex you hold gives what its ground is made of, every hour you hold it.',
    // Was "open your pouch in the footer", and the field report was blunt: the pouch is
    // under the Keep. The footer row is a glance, not a place you go — and it is hidden
    // entirely whenever a sheet is open (BRDC-HUD-005). Name the button that is always there.
    now: 'Open the Keep to see what you hold and what is coming in.',
    see: 'awakening',
  },
  building: {
    title: 'Works',
    what: 'A Work is a building on one hex. It makes that hex produce far more than bare ground.',
    now: 'Open Here on a hex you hold and raise your first one.',
    see: 'work',
  },
  temple: {
    title: 'Temples and mana',
    what: 'Stand in one place long enough and a Temple reveals itself. Temples make mana.',
    now: 'Mana is what Rites are cast with — and a Temple picks a school.',
    see: 'mana',
  },
  magic: {
    title: 'Rites',
    what: 'A researched technology that can be cast is a Rite. Mana pays for it.',
    now: 'Open the Keep and look for what you can cast.',
    see: 'rite',
  },
  neighbours: {
    title: 'City states',
    what: 'Some settlements on the map are not players. They trade, and they do not decay.',
    now: 'Walk to one and look for its quay — a hex that will deal with you.',
    see: null,
  },
  siege: {
    title: 'Taking ground that is held',
    // This season a walk takes red ground at once (v0.7.3); the old copy taught the siege.
    what: 'Red ground is another realm’s. Walk onto it and it is yours at once.',
    now: 'Their Hearth and a standing Fortress still hold — those take several walks.',
    see: 'corruption',
  },
};
