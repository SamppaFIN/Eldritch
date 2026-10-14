/**
 * Taking on a recovered identity (BRDC-IDENTITY-001).
 *
 * A recovery code brings back the *public* self — the id the shared world knows you by,
 * and your name — onto this phone. The realm on this phone stays this phone's, but it has
 * to stay *yours*: every cell you hold carries your old id as its owner, so the old id is
 * rewritten to the new one, or your own ground would turn into a rival's the moment you
 * recovered. Nothing else moves: hexes, buildings, XP and the pouch are untouched.
 */
import { allCells } from './cellStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { PlayerId, PlayerProfile } from '../types/domain.js';

/** Become `id` (and `name`, if one came back). Returns how many cells changed hands to it. */
export async function adoptIdentity(store: KeyValueStore, id: PlayerId, name: string): Promise<number> {
  const profile = await store.get<PlayerProfile>(K.profile);
  if (!profile) return 0;
  let moved = 0;
  if (profile.id !== id) {
    for (const c of await allCells(store)) {
      if (c.ownerId !== profile.id) continue;
      await store.set(K.cell(c.h3), { ...c, ownerId: id });
      moved += 1;
    }
  }
  await store.set<PlayerProfile>(K.profile, { ...profile, id, name: name.trim() || profile.name });
  return moved;
}
