/**
 * The Keep — the one location published for this player (BRDC-SHARE-001), stored here.
 *
 * BRDC-CASTLE-001 first made the Keep a random decoy 300–900 m from the Hearth, so
 * `world.json` on an open URL would never carry a home address. Infinite reversed that on
 * 2026-09-01 after testing it: the game is played among friends, and a Keep the player
 * cannot see — often off-screen — next to where they just claimed is worse than
 * publishing the cell. The Keep is now the Hearth cell itself.
 *
 * Re-assigned every time `setHome` is, the same as the Hearth: a new home is a new
 * published location, and there is nothing to carry across two that share no Hearth.
 */
import { cellAt } from '../geo/cells.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { H3Index, LatLng } from '../types/domain.js';

export async function assignCastle(store: KeyValueStore, home: LatLng): Promise<H3Index> {
  const h3 = cellAt(home);
  await store.set(K.castle, h3);
  return h3;
}
