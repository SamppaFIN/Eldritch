/**
 * The Wager, carried by hand.
 *
 * Multiplayer with no server: you export your sanctuary as a block of text, send it to a
 * friend however you like — WhatsApp, a note, a photograph of a screen — and their game
 * imports it as a rival holding real ground. Phases 0–2 have no backend by design, and
 * this is the shape multiplayer takes until Phase 3 arrives.
 *
 * The payload is deliberately small and deliberately dumb: cells, strength, a name, a
 * level. No trail, no dwell, no pouch. What travels is what the other player has to be
 * able to see and fight over, and nothing that would let a challenge rewrite their own
 * save.
 */
import { CHALLENGE_VERSION } from '../rules/constants.js';
import type { Combatant, Defence } from '../rules/wagerBattle.js';
import type { Cell, H3Index, PlayerId } from '../types/domain.js';

export interface Challenge {
  v: number;
  /** Who sent it. Display only — it never becomes the local player. */
  name: string;
  id: PlayerId;
  level: number;
  /** Ground held, at the moment of export. */
  cells: Array<{ h3: H3Index; strength: number }>;
  /**
   * Their Keep, if they have one — never their Hearth (BRDC-CASTLE-001). Only ever
   * read as a null check for the Anchor bonus (`wagerBattle.ts`), which is why the
   * decoy location is exactly as good here as the real one.
   */
  home: H3Index | null;
  /**
   * What they built on their border.
   *
   * It travels because both phones have to compute the same fight from the same inputs.
   * A defence kept secret would mean sending the *result* instead — and a result is a
   * claim, which on a client is a thing to be lied about.
   */
  defence: Defence;
  sentAt: number;
  /** Checksum over everything above. Not security — a torn message detector. */
  sum: string;
}

/** How many cells a challenge may carry. A city is not a text message. */
export const MAX_CHALLENGE_CELLS = 2_000;

export type ChallengeFault =
  | 'not-json'
  | 'not-a-challenge'
  | 'wrong-version'
  | 'damaged'
  | 'too-large'
  | 'yourself'
  /**
   * Already fought.
   *
   * The fight is deterministic, so importing the same message twice gives the same
   * answer — but walking a little first and importing it again would not. A challenge is
   * spent the moment it is resolved, or the loser simply waits and tries again.
   */
  | 'already-fought';

export type ChallengeResult =
  | { ok: true; challenge: Challenge }
  | { ok: false; fault: ChallengeFault };

/**
 * FNV-1a over the payload, in hex.
 *
 * This catches a message that lost its last line in a chat app, not someone editing
 * their strength upward — a client-side checksum cannot do the second thing and pretending
 * otherwise would be worse than admitting it. Phase 3's server is where authority lives.
 */
export function checksum(payload: object): string {
  const text = JSON.stringify(payload);
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export interface ChallengeSource {
  name: string;
  id: PlayerId;
  level: number;
  cells: readonly Cell[];
  home: H3Index | null;
  defence: Defence;
  now: number;
}

export function buildChallenge(from: ChallengeSource): Challenge {
  const payload: Omit<Challenge, 'sum'> = {
    v: CHALLENGE_VERSION,
    name: from.name,
    id: from.id,
    level: from.level,
    // Strongest first, so a challenge that has to be truncated keeps what matters.
    cells: [...from.cells]
      .sort((a, b) => b.strength - a.strength)
      .slice(0, MAX_CHALLENGE_CELLS)
      .map((c) => ({ h3: c.h3, strength: Math.round(c.strength) })),
    home: from.home,
    defence: from.defence,
    sentAt: from.now,
  };
  return { ...payload, sum: checksum(payload) };
}

/** Pretty-printed: this gets pasted into a chat window and read by a person. */
export function encodeChallenge(challenge: Challenge): string {
  return JSON.stringify(challenge, null, 1);
}

/**
 * Read a challenge someone sent.
 *
 * Every refusal is a named fault rather than an exception, because every one of them has
 * to become a sentence a player can act on. `mine` is the local player's id: importing
 * your own export would hand you a rival that is you, and quietly corrupt the map.
 */
export function parseChallenge(text: string, mine: PlayerId): ChallengeResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text.trim());
  } catch {
    return { ok: false, fault: 'not-json' };
  }

  if (typeof raw !== 'object' || raw === null) return { ok: false, fault: 'not-a-challenge' };
  const c = raw as Partial<Challenge>;

  if (
    typeof c.v !== 'number' ||
    !Array.isArray(c.cells) ||
    typeof c.id !== 'string' ||
    (c.defence !== 'wall' && c.defence !== 'orcs')
  ) {
    return { ok: false, fault: 'not-a-challenge' };
  }
  if (c.v !== CHALLENGE_VERSION) return { ok: false, fault: 'wrong-version' };
  if (c.cells.length > MAX_CHALLENGE_CELLS) return { ok: false, fault: 'too-large' };
  if (c.id === mine) return { ok: false, fault: 'yourself' };

  const { sum, ...payload } = c as Challenge;
  if (sum !== checksum(payload)) return { ok: false, fault: 'damaged' };

  return { ok: true, challenge: c as Challenge };
}

/** The rival's ground, as cells this game can store and draw. */
export function challengeToCells(challenge: Challenge, now: number): Cell[] {
  return challenge.cells.map((c) => ({
    h3: c.h3,
    ownerId: challenge.id,
    strength: c.strength,
    // Their clock is not ours and their timestamps cannot be trusted to be sane. Dating
    // the ground to the moment of import means it decays from here, like everything else.
    lastVisitedAt: now,
    visitDays: [],
  }));
}

/** The sender, as something the battle rules can fight. */
export function challengeToCombatant(challenge: Challenge): Combatant {
  return {
    id: challenge.id,
    name: challenge.name,
    level: challenge.level,
    cells: challenge.cells,
    home: challenge.home,
    defence: challenge.defence,
  };
}
