/**
 * The player's clan: a code, a name, and — only on the founder's own device — the
 * bearer token that proves it (BRDC-CLAN-001).
 *
 * Small enough for localStorage, same pattern as `nation.ts`: one `es3:clan` key, one
 * shape whatever else changes. No account behind any of this — a clan's `founderId` is
 * just the local player's own untrusted `id`, exactly as trusted as `nation`/`banner`
 * already are (`WorldSource.clanId` carries it into every publish, unverified).
 */
import { load, saveNow } from '@es3/core';

export interface Clan {
  clanId: string;
  clanName: string;
  /** Present only on the device that created this clan — the one thing that lets its
   *  owner rename it or remove a member (BRDC-CLAN-003). Never sent anywhere except the
   *  admin endpoints those actions call. */
  founderToken: string | null;
}

const KEY = 'clan';
const NONE: Clan = { clanId: '', clanName: '', founderToken: null };

export function readClan(): Clan {
  const stored = load<Partial<Clan> | null>(KEY, null);
  if (!stored?.clanId || typeof stored.clanName !== 'string') return NONE;
  return {
    clanId: stored.clanId,
    clanName: stored.clanName,
    founderToken: typeof stored.founderToken === 'string' ? stored.founderToken : null,
  };
}

export function writeClan(next: Clan): Clan {
  saveNow(KEY, next);
  return next;
}

export function leaveClan(): Clan {
  saveNow(KEY, NONE);
  return NONE;
}
