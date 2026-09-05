/**
 * Sending and receiving a challenge.
 *
 * The format lives in challenge.ts, which is pure. This is the half that touches the
 * store — split out when MockRepository reached its four hundred lines for the third
 * time. The rule is to split, and the seam is real: everything here is about moving a
 * rival's ground in and out of storage.
 *
 * Since BRDC-WAGER-JSON-006 accepting a Wager is territory only — no duel. The battle
 * (`wagerBattle.ts`, `spoils.ts`) is left parked for Phase 5's real multiplayer;
 * `ownCombatant` and the defence readers below stay with it. `sealChallenge` still ships
 * `defence` on the wire so un-parking needs no version bump.
 */
import { buildChallenge, challengeToCells, encodeChallenge, parseChallenge } from './challenge.js';
import type { Challenge, ChallengeFault } from './challenge.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Combatant, Defence } from '../rules/wagerBattle.js';
import type { Cell, H3Index, PlayerProfile } from '../types/domain.js';

/**
 * The nation's face, from `es3:nation` (BRDC-NATION-001, -004). Passed in at the app
 * boundary because `packages/core` does not read localStorage.
 */
export interface WagerIdentity {
  nation?: string;
  banner?: string;
}

export function sealChallenge(
  profile: PlayerProfile,
  cells: readonly Cell[],
  home: H3Index | null,
  defence: Defence,
  now: number,
  identity?: WagerIdentity,
): string {
  return encodeChallenge(
    buildChallenge({
      name: profile.name,
      ...(identity?.nation ? { nation: identity.nation } : {}),
      ...(identity?.banner ? { banner: identity.banner } : {}),
      id: profile.id,
      level: profile.level,
      cells,
      home,
      defence,
      now,
    }),
  );
}

export interface WagerReport {
  challenge: Challenge;
  /** Their cells written onto the map as rival ground. */
  imported: number;
  /** Their cells that overlap yours — kept yours, tagged `shared`. */
  shared: number;
}

export type ImportResult = { ok: true; report: WagerReport } | { ok: false; fault: ChallengeFault };

/**
 * Accept a Wager: take their ground onto the map. No duel (BRDC-WAGER-JSON-006) — a
 * friend's sanctuary appears as ground you can walk over, and where it overlaps yours
 * the cell is shared. Safe to run again with the same or a fresher message; there is no
 * spent state, and the shared split is recomputed from whatever the message now says.
 *
 * Their cells are written straight in, overwriting whatever was there: a cell cannot
 * belong to two people, and the challenge is the newer claim. What it must never do is
 * take the local player's own ground. Where their claim overlaps yours the cell stays
 * yours, tagged `shared` (BRDC-WAGER-JSON-002, -006): the hourly yield is then split by
 * each side's strength at import — or, when those tie, by the days each has held it —
 * and walking the cell again on a new day takes the whole yield back.
 */
export async function openChallenge(
  store: KeyValueStore,
  text: string,
  me: PlayerProfile,
  now: number,
): Promise<ImportResult> {
  const parsed = parseChallenge(text, me.id);
  if (!parsed.ok) return parsed;

  const challenge = parsed.challenge;
  const withName = challenge.nation ?? challenge.name;

  let imported = 0;
  let shared = 0;
  for (const cell of challengeToCells(challenge, now)) {
    const existing = await store.get<Cell>(K.cell(cell.h3));
    if (existing?.ownerId === me.id) {
      shared += 1;
      await store.set(K.cell(cell.h3), {
        ...existing,
        shared: {
          with: challenge.id,
          withName,
          mineAtImport: existing.strength,
          theirsAtImport: cell.strength,
          myDays: existing.ownedDays ?? 0,
          theirDays: cell.ownedDays ?? 0,
        },
      });
      continue;
    }
    imported += 1;
    await store.set(K.cell(cell.h3), cell);
  }

  return { ok: true, report: { challenge, imported, shared } };
}

/**
 * What the local player brings to a Wager.
 *
 * Assembled here rather than in the UI so that both halves of a duel are built the same
 * way: the sender's side comes out of a challenge message, this side comes out of the
 * store, and neither may drift from the other.
 */
export function ownCombatant(
  profile: PlayerProfile,
  cells: readonly Cell[],
  home: H3Index | null,
  defence: Defence,
): Combatant {
  return {
    id: profile.id,
    name: profile.name,
    level: profile.level,
    cells: cells.map((c) => ({ h3: c.h3, strength: Math.round(c.strength) })),
    home,
    defence,
  };
}

/**
 * What the player built on their border. A wall until they choose otherwise.
 *
 * The default matters more than it looks: an unset defence would make two phones compute
 * different fights, so there is no such thing as unset — only "wall, so far".
 */
export async function readDefence(store: KeyValueStore): Promise<Defence> {
  return (await store.get<Defence>(K.defence)) ?? 'wall';
}

export async function writeDefence(store: KeyValueStore, defence: Defence): Promise<void> {
  await store.set(K.defence, defence);
}
