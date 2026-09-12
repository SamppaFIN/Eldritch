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
import type { UnlockId } from '@es3/core';
import type { WikiRef } from '../help/wikiPages.js';

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

export const UNLOCK_COPY: Readonly<Record<UnlockId, UnlockCopy>> = {
  resources: {
    title: 'The ground pays',
    what: 'Every hex you hold gives what its ground is made of, once when taken and every hour after.',
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
    what: 'Rival ground does not flip in one visit. Each walk takes strength off it.',
    now: 'Two or three walks on separate days will take an established hex.',
    see: 'corruption',
  },
};
