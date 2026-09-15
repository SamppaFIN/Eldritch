/**
 * Accepting the Hearth — the storage half.
 *
 * Split out of MockRepository when it reached four hundred lines. Small, but a real
 * seam: this is the one place a cell is claimed without anybody walking to it.
 */
import { cellAt, cellsWithin, neighboursOf } from '../geo/cells.js';
import { emptyCell, resolveCapture } from '../rules/capture.js';
import { FORTRESS_REACH, fortified } from '../rules/aura.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index, LatLng, PlayerProfile } from '../types/domain.js';

/**
 * Claim the ground the player agreed to start from — the Hearth cell and its ring.
 *
 * Adjacency waived — this is the seed the growth rule already allows for, made explicit.
 * The player said yes to standing here, so a home *region* is theirs before they take a
 * step: the Hearth cell (which never fades, BRDC-HEARTH-002) and its six neighbours (which
 * do, unless walked). A lone cell of plain ground produced nothing and felt like nothing;
 * the ring usually includes something that pays.
 */
export async function claimHearth(
  store: KeyValueStore,
  profile: PlayerProfile,
  position: LatLng,
  now: number,
): Promise<H3Index> {
  const h3 = cellAt(position);
  const attacker = { id: profile.id, level: profile.level };

  /*
   * Founding a Hearth besieges the ring it lands on, and did so with no defence and no
   * floor — ground under a rival's Fortress would have fallen to it outright
   * (BRDC-BUILD-012). The ring, and everything a Fortress guarding it could stand on,
   * is read first.
   */
  const around = cellsWithin(h3, 1 + FORTRESS_REACH);
  const found = await store.getMany<Cell>(around.map((c) => K.cell(c)));
  const known = new Map<H3Index, Cell>();
  around.forEach((c, i) => {
    const cell = found[i];
    if (cell) known.set(c, cell);
  });

  for (const target of [h3, ...neighboursOf(h3)]) {
    const current = known.get(target) ?? emptyCell(target);
    const holds =
      current.ownerId !== null && current.ownerId !== profile.id && fortified(known, target);
    const { cell } = resolveCapture(current, attacker, now, 0, null, holds);
    await store.set(K.cell(target), cell);
  }

  await store.set(K.home, h3);
  await writeLogEntry(store, { at: now, kind: 'hearth' });
  return h3;
}
