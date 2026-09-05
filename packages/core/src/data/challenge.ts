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
import type { BuildingId, Cell, H3Index, PlayerId, TerrainKind } from '../types/domain.js';

/**
 * One cell on the wire (BRDC-WAGER-JSON-004, -006).
 *
 * `h3` and `strength` are the ground; `t` and `b` are the picture — the terrain the
 * sender had resolved and the building on the border; `d` is how many distinct days the
 * sender has held the cell, which breaks a tie when a shared cell's yield is split. All
 * optional: a message from before a given change, or a cell whose terrain was never read,
 * simply omits them and imports without. `world.ts` sends the same shape.
 */
export interface WireCell {
  h3: H3Index;
  strength: number;
  t?: TerrainKind;
  b?: BuildingId;
  d?: number;
}

/** A stored cell, trimmed to what travels. */
export function toWireCell(c: Cell): WireCell {
  const w: WireCell = { h3: c.h3, strength: Math.round(c.strength) };
  if (c.terrain) w.t = c.terrain.kind;
  if (c.building) w.b = c.building.id;
  if (c.ownedDays) w.d = c.ownedDays;
  return w;
}

export interface Challenge {
  v: number;
  /** Who sent it. Display only — it never becomes the local player. */
  name: string;
  /** Their nation's name and flag (BRDC-NATION-001, -004), if they have set one. */
  nation?: string;
  banner?: string;
  id: PlayerId;
  level: number;
  /** Ground held, at the moment of export. */
  cells: WireCell[];
  /**
   * Their Keep — the Hearth cell, since the BRDC-CASTLE-001 reversal. Only ever read as a
   * null check for the Anchor bonus (`wagerBattle.ts`), so the exact cell never matters
   * here.
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
  | 'yourself';

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
  /** Nation name and flag, from `es3:nation` — threaded in at the app boundary. */
  nation?: string;
  banner?: string;
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
    ...(from.nation ? { nation: from.nation } : {}),
    ...(from.banner ? { banner: from.banner } : {}),
    id: from.id,
    level: from.level,
    // Strongest first, so a challenge that has to be truncated keeps what matters.
    cells: [...from.cells]
      .sort((a, b) => b.strength - a.strength)
      .slice(0, MAX_CHALLENGE_CELLS)
      .map(toWireCell),
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
  const from = { name: challenge.nation ?? challenge.name, seenAt: challenge.sentAt } as {
    name: string;
    banner?: string;
    seenAt: number;
  };
  if (challenge.banner) from.banner = challenge.banner;
  return challenge.cells.map((c) => ({
    h3: c.h3,
    ownerId: challenge.id,
    strength: c.strength,
    lastVisitedAt: now,
    visitDays: [],
    // Their truth, not ours: it must not decay or produce on this device
    // (BRDC-WAGER-JSON-004), though feet still take it like any ground.
    imported: true as const,
    importedFrom: from,
    // Days they have held it — read only when this cell overlaps yours and the shared
    // yield split needs a tie-breaker (BRDC-WAGER-JSON-006).
    ...(c.d ? { ownedDays: c.d } : {}),
    // Their reading, carried over — not a firm local one, so it reads as estimated.
    ...(c.t ? { terrain: { kind: c.t, source: 'hash' as const } } : {}),
    ...(c.b ? { building: { id: c.b, builtAt: now } } : {}),
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
