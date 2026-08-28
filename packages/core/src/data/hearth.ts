/**
 * Accepting the Hearth — the storage half.
 *
 * Split out of MockRepository when it reached four hundred lines. Small, but a real
 * seam: this is the one place a cell is claimed without anybody walking to it.
 */
import { cellAt } from '../geo/cells.js';
import { emptyCell, resolveCapture } from '../rules/capture.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index, LatLng, PlayerProfile } from '../types/domain.js';

/**
 * Claim the ground the player agreed to start from.
 *
 * Adjacency waived — this is the seed the growth rule already allows for, made explicit.
 * The player said yes to standing here, so the ground is theirs before they take a step.
 * Without it the Hearth would be a marker floating over land belonging to nobody.
 */
export async function claimHearth(
  store: KeyValueStore,
  profile: PlayerProfile,
  position: LatLng,
  now: number,
): Promise<H3Index> {
  const h3 = cellAt(position);
  const current = (await store.get<Cell>(K.cell(h3))) ?? emptyCell(h3);
  const { cell } = resolveCapture(current, { id: profile.id, level: profile.level }, now);

  await store.set(K.cell(h3), cell);
  await store.set(K.home, h3);
  return h3;
}
