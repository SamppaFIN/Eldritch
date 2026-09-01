/**
 * The cipher, in the store (BRDC-CIPHER-001).
 *
 * `rules/cipher.js` says which cells hold a fragment and when the set is whole;
 * `cipher.json` holds the words. This seam records what has been walked onto
 * (`K.cipherShards`) and assembles the view the Character screen reads. `resetAll` clears
 * it with the store.
 */
import { SHARD_COUNT, cipherComplete } from '../rules/cipher.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import raw from './cipher.json';

const DATA = raw as { fragments: { line: string }[]; inscription: string };

export interface CipherFragment {
  index: number;
  line: string;
  held: boolean;
}
export interface CipherView {
  held: number[];
  complete: boolean;
  fragments: CipherFragment[];
  /** The whole writing — only once every fragment is held. */
  inscription: string | null;
}

export async function readShards(store: KeyValueStore): Promise<number[]> {
  return (await store.get<number[]>(K.cipherShards)) ?? [];
}

/** Record a walk onto a fragment cell. Returns the index if new, `null` if already held. */
export async function recordShard(
  store: KeyValueStore,
  index: number,
  now: number,
): Promise<number | null> {
  const held = await readShards(store);
  if (held.includes(index)) return null;
  await store.set(K.cipherShards, [...held, index]);
  await writeLogEntry(store, { at: now, kind: 'quest', ref: `shard:${index}` });
  return index;
}

export async function cipherView(store: KeyValueStore): Promise<CipherView> {
  const held = await readShards(store);
  const complete = cipherComplete(held);
  const fragments: CipherFragment[] = Array.from({ length: SHARD_COUNT }, (_, i) => ({
    index: i,
    line: DATA.fragments[i]?.line ?? '',
    held: held.includes(i),
  }));
  return { held, complete, fragments, inscription: complete ? DATA.inscription : null };
}
