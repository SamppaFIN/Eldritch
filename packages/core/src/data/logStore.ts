/**
 * The action-log store (BRDC-LOG-001).
 *
 * One key holding a capped `LogEntry[]`, read-modify-write on append — the same shape
 * `pathStore.ts` uses for walked paths. Every seam that writes a game action also drops
 * one line here, colocated with the action so nothing is logged in two voices.
 */
import { appendLog } from '../rules/log.js';
import type { LogEntry } from '../rules/log.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';

export async function readLog(store: KeyValueStore): Promise<LogEntry[]> {
  return (await store.get<LogEntry[]>(K.log)) ?? [];
}

/** Append one entry, pruned to the cap. */
export async function writeLogEntry(store: KeyValueStore, entry: LogEntry): Promise<void> {
  await store.set(K.log, appendLog(await readLog(store), entry));
}
