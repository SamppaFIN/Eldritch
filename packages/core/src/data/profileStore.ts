/**
 * The player profile, in the store.
 *
 * One record under `K.profile`: id, name, colour, level, xp. Created on first read.
 * Lifted out of MockRepository to keep it under its line limit — the same split as
 * `pouch.js` and `runStore.js`. `level` is always derived from `xp` on write so the two
 * can never drift (v2's level-118 route).
 */
import { levelForXp } from '../rules/level.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { PlayerProfile } from '../types/domain.js';

const NAME_MAX = 24;

export async function readProfile(
  store: KeyValueStore,
  newId: () => string,
): Promise<PlayerProfile> {
  const existing = await store.get<PlayerProfile>(K.profile);
  if (existing) return existing;
  const profile: PlayerProfile = { id: newId(), name: 'Seeker', colorHue: 285, level: 1, xp: 0 };
  await store.set(K.profile, profile);
  return profile;
}

export async function addXpTo(
  store: KeyValueStore,
  newId: () => string,
  amount: number,
): Promise<PlayerProfile> {
  const profile = await readProfile(store, newId);
  const xp = Math.max(0, profile.xp + amount);
  const updated: PlayerProfile = { ...profile, xp, level: levelForXp(xp) };
  await store.set(K.profile, updated);
  return updated;
}

/** Set the player's name. Trimmed and capped; an empty string keeps the old name. */
export async function setName(
  store: KeyValueStore,
  newId: () => string,
  name: string,
): Promise<PlayerProfile> {
  const profile = await readProfile(store, newId);
  const trimmed = name.trim().slice(0, NAME_MAX);
  if (!trimmed) return profile;
  const updated: PlayerProfile = { ...profile, name: trimmed };
  await store.set(K.profile, updated);
  return updated;
}
