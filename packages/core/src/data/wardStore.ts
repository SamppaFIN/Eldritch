/**
 * Warding a cell, in the store (BRDC-WARD-001).
 *
 * The rule is pure (`rules/ward.js`); `wardWith` moves the timber (`pouch.js`, beside
 * `researchWith`). This is the thin orchestration that was the last such verb still
 * inline in MockRepository — project the cell, ask, write and log only on success.
 */
import { projectCell } from '../rules/decay.js';
import { wardWith } from './pouch.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { WardResult } from '../rules/ward.js';
import type { Cell, H3Index, PlayerId } from '../types/domain.js';

export async function wardAt(
  store: KeyValueStore,
  h3: H3Index,
  me: PlayerId,
  owned: readonly Cell[],
  now: number,
): Promise<WardResult> {
  // Projected first, so a cell decay has already released cannot be propped up from the
  // grave — and so the strength being paid to raise is the one on screen.
  const stored = await store.get<Cell>(K.cell(h3));
  const live = stored ? projectCell(stored, now) : null;
  if (!live) return { warded: false, refused: 'not-yours' };

  const result = await wardWith(store, live, me, owned, now);
  if (result.warded) {
    await store.set(K.cell(h3), result.cell);
    await writeLogEntry(store, { at: now, kind: 'ward' });
  }
  return result;
}
