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

export interface MythosCard {
  id: string;
  headline: string;
  rule: string;
  /** The system the rule acts on, when it is not in the game yet. */
  waits?: string;
}

export const MYTHOS: readonly MythosCard[] = [
  { id: 'bells', headline: 'The Bells Ring Underwater', rule: 'All Will tests −1 die for 24 h. A gate opens at the shore.', waits: 'skill tests and gates (DOOM-002)' },
  { id: 'still-lake', headline: 'The Lake Is Still', rule: 'Mana regeneration −1 for 24 h.', waits: 'mana regeneration rules' },
  { id: 'fog', headline: 'A Fog With a Shape In It', rule: 'Observe tests −1 die for 24 h.', waits: 'skill tests (DOOM-002)' },
  { id: 'good-harvest', headline: 'An Unseasonable Harvest', rule: 'Every Farmstead worker yields +1 food for 24 h.', waits: 'daily rule effects' },
  { id: 'crows', headline: 'The Crows Count Aloud', rule: 'Watchtowers find a clue each today.', waits: 'clues (DOOM-002)' },
  { id: 'wrong-stars', headline: 'The Stars Are Wrong', rule: 'Rites cost +10 mana for 24 h.', waits: 'daily rule effects' },
  { id: 'quiet-night', headline: 'A Quiet Night', rule: 'Nothing stirs. The Doom does not rise at the next dawn.' },
  { id: 'drowned-procession', headline: 'The Drowned Procession', rule: 'Realm sanity −2 for 24 h.', waits: 'daily rule effects' },
  { id: 'open-door', headline: 'A Door Where There Was None', rule: 'A gate opens on a named cell.', waits: 'gates (DOOM-002)' },
  { id: 'market-day', headline: 'Night Market Day', rule: 'Markets yield +2 gold per hand for 24 h.', waits: 'daily rule effects' },
];

/** FNV-1a — the same spread the rest of the game hashes with. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Today's card for this season: the same on every phone, changing at dawn. */
export function mythosFor(season: Pick<Season, 'seed' | 'opensAt'>, now: number): MythosCard {
  const day = dawnsSince(season.opensAt, now);
  return MYTHOS[hash(`${season.seed}:mythos:${day}`) % MYTHOS.length] as MythosCard;
}
