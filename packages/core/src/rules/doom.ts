/**
 * The Doom track and the Mythos card (BRDC-DOOM-001, Eldritch-Progression.pdf LAW IV and
 * "THE ADVENTURE LAYER", Eldritch-season.pdf S1).
 *
 * The Doom is shared by the whole server, 0 → 13. It rises every third dawn and for every
 * gate left open 48 h; sealing a gate is the only way down. At 13 the Ancient One wakes
 * (`season.ts`). Infinite 2026-09-29 left the season's length open, so the dawn clock is
 * a setting on the season (`doomEveryNDawns`), not a law: absent, only gates move it.
 *
 * Every dawn one Mythos card is drawn for everyone: a headline and a 24-hour rule. The
 * draw is a hash of the season's seed and the day, so every client draws the same card
 * with no server round-trip. Most rules act on systems still to come; each says which.
 */
import { DOOM_MAX } from './season.js';
import type { Season } from './season.js';
import type { Skill } from './investigator.js';
import type { ResourceKind } from './terrain.js';

const DAY_MS = 86_400_000;
/** Dawn is 06:00 in Finland — 03:00 UTC in summer time, close enough all year. */
const DAWN_UTC_MS = 3 * 3_600_000;

/** Dawns passed since the season opened (the opening morning's own dawn not counted). */
export function dawnsSince(opensAt: number, now: number): number {
  const day = (t: number) => Math.floor((t - DAWN_UTC_MS) / DAY_MS);
  return Math.max(0, day(now) - day(opensAt));
}

/** The Doom on the clock: every n-th dawn, plus what gates have added or taken away. */
export function doomAt(season: Season, now: number): number {
  const clock = season.doomEveryNDawns ? Math.floor(dawnsSince(season.opensAt, now) / season.doomEveryNDawns) : 0;
  return Math.max(0, Math.min(DOOM_MAX, clock + (season.doomShift ?? 0)));
}

/** From Doom 9 the home screen warns (S1). */
export const DOOM_WARN_FROM = 9;

/**
 * What a Mythos card does today (BRDC-MYTHOS-001): a die more or less on one skill, a
 * Work's hands making more, or the realm's own rate moved. A card with no effect is news.
 */
export type MythosEffect =
  | { kind: 'dice'; skill: Skill; delta: number }
  | { kind: 'hands'; work: 'farm' | 'market'; resource: ResourceKind; perHand: number }
  | { kind: 'realm'; resource: ResourceKind; perHour: number };

export interface MythosCard {
  id: string;
  headline: string;
  rule: string;
  effect?: MythosEffect;
  /** The system the rule acts on, when it is not in the game yet. */
  waits?: string;
}

/**
 * The cards come in three-day chains, so the paper tells a story (BRDC-MYTHOS-001): the
 * fisherman goes missing, the lake goes still, and then the bells ring. A chain is drawn
 * for each three days of the season, the same on every phone.
 */
export const MYTHOS_CHAINS: readonly (readonly MythosCard[])[] = [
  [
    { id: 'missing-fisherman', headline: 'A Fisherman’s Boat Comes Back Empty', rule: 'Nothing yet. Watch the lake.' },
    { id: 'still-lake', headline: 'The Lake Is Still', rule: 'Mana −1 an hour for the realm today.', effect: { kind: 'realm', resource: 'mana', perHour: -1 } },
    { id: 'bells', headline: 'The Bells Ring Underwater', rule: 'Will tests roll one die fewer today.', effect: { kind: 'dice', skill: 'will', delta: -1 } },
  ],
  [
    { id: 'good-harvest', headline: 'An Unseasonable Harvest', rule: 'Every hand on a Farm makes +1 food an hour today.', effect: { kind: 'hands', work: 'farm', resource: 'food', perHand: 1 } },
    { id: 'crows', headline: 'The Crows Count Aloud', rule: 'Watchtowers find a clue each today.', waits: 'clues from Watchtowers' },
    { id: 'market-day', headline: 'Night Market Day', rule: 'Every hand on a Market makes +2 gold an hour today.', effect: { kind: 'hands', work: 'market', resource: 'gold', perHand: 2 } },
  ],
  [
    { id: 'fog', headline: 'A Fog With a Shape In It', rule: 'Wit tests roll one die fewer today.', effect: { kind: 'dice', skill: 'observe', delta: -1 } },
    { id: 'drowned-procession', headline: 'The Drowned Procession', rule: 'Realm sanity −2 for 24 h.', waits: 'daily sanity effects' },
    { id: 'open-door', headline: 'A Door Where There Was None', rule: 'A gate opens on a named cell.', waits: 'gates opened by the Mythos' },
  ],
  [
    { id: 'wrong-stars', headline: 'The Stars Are Wrong', rule: 'Rites cost +10 mana for 24 h.', waits: 'daily rite prices' },
    { id: 'stargazer', headline: 'A Telescope Turns By Itself', rule: 'Lore tests roll one die more today.', effect: { kind: 'dice', skill: 'lore', delta: 1 } },
    { id: 'quiet-night', headline: 'A Quiet Night', rule: 'Nothing stirs. The Doom does not rise at the next dawn.' },
  ],
  [
    { id: 'humming-wire', headline: 'The Wires Hum Over Härmälä', rule: 'Wit tests roll one die more today.', effect: { kind: 'dice', skill: 'observe', delta: 1 } },
    { id: 'boy-returns', headline: 'The Boy With the Propeller Is Seen Again', rule: 'Nothing yet. He is standing very still.' },
    { id: 'sky-calm', headline: 'The Sky Is Too Calm', rule: 'Nothing moves above the airfield. Nothing at all.' },
  ],
];

/** Every card, flat — the list the Keep's history and tests read. */
export const MYTHOS: readonly MythosCard[] = MYTHOS_CHAINS.flat();

/** FNV-1a — the same spread the rest of the game hashes with. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Today's card for this season: the chain for these three days, and today's page of it. */
export function mythosFor(season: Pick<Season, 'seed' | 'opensAt'>, now: number): MythosCard {
  const day = dawnsSince(season.opensAt, now);
  const chain = MYTHOS_CHAINS[hash(`${season.seed}:mythos-chain:${Math.floor(day / 3)}`) % MYTHOS_CHAINS.length] as readonly MythosCard[];
  return chain[day % 3] as MythosCard;
}

/** The dice a card adds to (or takes from) a test of this skill today. */
export const mythosDice = (card: MythosCard | null, skill: Skill): number =>
  card?.effect?.kind === 'dice' && card.effect.skill === skill ? card.effect.delta : 0;
