/**
 * Sending and receiving a challenge.
 *
 * The format lives in challenge.ts, which is pure. This is the half that touches the
 * store — split out when MockRepository reached its four hundred lines for the third
 * time. The rule is to split, and the seam is real: everything here is about moving a
 * rival's ground in and out of storage.
 */
import {
  buildChallenge,
  challengeToCells,
  challengeToCombatant,
  encodeChallenge,
  parseChallenge,
} from './challenge.js';
import type { Challenge, ChallengeFault } from './challenge.js';
import { applySpoils } from '../rules/spoils.js';
import { resolveWager } from '../rules/wagerBattle.js';
import type { WagerOutcome } from '../rules/wagerBattle.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Combatant, Defence } from '../rules/wagerBattle.js';
import type { Cell, H3Index, PlayerProfile } from '../types/domain.js';

export function sealChallenge(
  profile: PlayerProfile,
  cells: readonly Cell[],
  home: H3Index | null,
  defence: Defence,
  now: number,
): string {
  return encodeChallenge(
    buildChallenge({
      name: profile.name,
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
  outcome: WagerOutcome;
  /** Their cells weakened by the victory, and by how much in total. */
  weakened: number;
  taken: number;
}

export type ImportResult = { ok: true; report: WagerReport } | { ok: false; fault: ChallengeFault };

/**
 * Accept a Wager: take their ground onto the map, fight it, and settle the spoils.
 *
 * One transaction, because they are one act. Splitting them would leave a state where a
 * rival's territory exists but the duel has not happened — and a second call could then
 * fight the same message again after a walk had changed the seed.
 *
 * Their cells are written straight in, overwriting whatever was there: a cell cannot
 * belong to two people, and the challenge is the newer claim, since it arrived after
 * everything already on the map. What it must never do is take the local player's own
 * ground. A message from a friend is not a capture; corrupting your map is not a game
 * mechanic. Where their claim overlaps yours the cell stays yours, but it is tagged
 * `shared` (BRDC-WAGER-JSON-002): the hourly yield is then split by each side's strength
 * at import, and walking the cell again on a new day takes the whole yield back.
 */
export async function openChallenge(
  store: KeyValueStore,
  text: string,
  me: PlayerProfile,
  ownCells: readonly Cell[],
  home: H3Index | null,
  now: number,
): Promise<ImportResult> {
  const parsed = parseChallenge(text, me.id);
  if (!parsed.ok) return parsed;

  const challenge = parsed.challenge;
  const fought = (await store.get<string[]>(K.fought)) ?? [];
  if (fought.includes(challenge.sum)) return { ok: false, fault: 'already-fought' };

  const theirs = challengeToCells(challenge, now);
  const overlap = new Set<H3Index>();
  for (const cell of theirs) {
    const existing = await store.get<Cell>(K.cell(cell.h3));
    if (existing?.ownerId === me.id) {
      overlap.add(cell.h3);
      await store.set(K.cell(cell.h3), {
        ...existing,
        shared: {
          with: challenge.id,
          mineAtImport: existing.strength,
          theirsAtImport: cell.strength,
        },
      });
      continue;
    }
    await store.set(K.cell(cell.h3), cell);
  }

  const outcome = resolveWager(
    ownCombatant(me, ownCells, home, await readDefence(store)),
    challengeToCombatant(challenge),
  );

  // Only their newly arrived ground can be softened — a cell you also hold stays yours,
  // tagged `shared`, and the spoils never touch it.
  const spoils = applySpoils(
    theirs.filter((c) => !overlap.has(c.h3)),
    outcome,
    me.id,
  );
  for (const cell of spoils.cells) await store.set(K.cell(cell.h3), cell);

  await store.set(K.fought, [...fought, challenge.sum].slice(-200));

  return {
    ok: true,
    report: { challenge, outcome, weakened: spoils.weakened, taken: spoils.taken },
  };
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
