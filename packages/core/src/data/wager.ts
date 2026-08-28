/**
 * Sending and receiving a challenge.
 *
 * The format lives in challenge.ts, which is pure. This is the half that touches the
 * store — split out when MockRepository reached its four hundred lines for the third
 * time. The rule is to split, and the seam is real: everything here is about moving a
 * rival's ground in and out of storage.
 */
import { buildChallenge, challengeToCells, encodeChallenge, parseChallenge } from './challenge.js';
import type { ChallengeResult } from './challenge.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index, PlayerId, PlayerProfile } from '../types/domain.js';

export function sealChallenge(
  profile: PlayerProfile,
  cells: readonly Cell[],
  home: H3Index | null,
  now: number,
): string {
  return encodeChallenge(
    buildChallenge({
      name: profile.name,
      id: profile.id,
      level: profile.level,
      cells,
      home,
      now,
    }),
  );
}

/**
 * Take a challenge and give its sender ground on this map.
 *
 * Their cells are written straight in, overwriting whatever was there — a cell cannot
 * belong to two people, and the challenge is the newer claim by definition, since it
 * arrived after everything already on this map.
 *
 * The one thing it must never do is take the local player's own ground. A message from a
 * friend is not a capture; corrupting your map is not a game mechanic. Their cells that
 * overlap yours are simply dropped, and you keep what you walked for.
 */
export async function openChallenge(
  store: KeyValueStore,
  text: string,
  mine: PlayerId,
  now: number,
): Promise<ChallengeResult> {
  const result = parseChallenge(text, mine);
  if (!result.ok) return result;

  for (const cell of challengeToCells(result.challenge, now)) {
    const existing = await store.get<Cell>(K.cell(cell.h3));
    if (existing?.ownerId === mine) continue;
    await store.set(K.cell(cell.h3), cell);
  }
  return result;
}
