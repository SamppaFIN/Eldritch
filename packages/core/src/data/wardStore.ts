/**
 * Warding a cell, in the store (BRDC-WARD-001).
 *
 * The rule is pure (`rules/ward.js`); `wardWith` moves the timber (`pouch.js`, beside
 * `researchWith`). This is the thin orchestration that was the last such verb still
 * inline in MockRepository — project the cell, ask, write and log only on success.
 */
import { projectCell } from '../rules/decay.js';
import { underFortressAt } from './cellStore.js';
import { wardWith } from './pouchSpend.js';
import { hasPerk } from '../rules/perks.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { WardResult } from '../rules/ward.js';
import type { Cell, H3Index, PlayerId } from '../types/domain.js';

/** The UTC day, as the free Ward counts it. */
const utcDay = (now: number): string => new Date(now).toISOString().slice(0, 10);

/** Is today's free Ward still there (Enlightened, BRDC-MIND-001)? */
export async function freeWardReady(store: KeyValueStore, level: number, now: number): Promise<boolean> {
  return hasPerk(level, 'free-ward') && (await store.get<string>(K.freeWard)) !== utcDay(now);
}

export async function wardAt(
  store: KeyValueStore,
  h3: H3Index,
  me: PlayerId,
  owned: readonly Cell[],
  now: number,
  /** Consciousness level: from Enlightened, one Ward a day is free. */
  level = 0,
): Promise<WardResult> {
  // Projected first, so a cell decay has already released cannot be propped up from the
  // grave — and so the strength being paid to raise is the one on screen.
  const stored = await store.get<Cell>(K.cell(h3));
  // A long-unwalked hex under a Fortress is still held (BRDC-BUILD-012).
  const live = stored ? projectCell(stored, now, 1, null, await underFortressAt(store, h3)) : null;
  if (!live) return { warded: false, refused: 'not-yours' };

  const free = await freeWardReady(store, level, now);
  const result = await wardWith(store, live, me, owned, now, free ? {} : undefined);
  if (result.warded) {
    if (free) await store.set(K.freeWard, utcDay(now));
    await store.set(K.cell(h3), result.cell);
    await writeLogEntry(store, { at: now, kind: 'ward' });
  }
  return result;
}
