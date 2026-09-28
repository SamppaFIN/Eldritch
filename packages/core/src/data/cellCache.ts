/**
 * Every stored cell, held in memory after the first read (BRDC-PERF-003, SCALE-001).
 *
 * `getOwnedCells` and `runDecay` want every cell, and each read was a full IndexedDB
 * scan — every key, then every value — on every pouch settle and every step. A profile of
 * twenty seconds' walking with a thousand hexes spent three of them in IndexedDB `get`.
 *
 * Write-through: it wraps the game's own IndexedDB store (`createRepository`), and every
 * write in the game goes through that store, so the cache is updated in the same call.
 * Tests keep the plain store: they write cells straight into it behind the repository.
 * Values are kept as JSON and parsed on every read, so a caller can no more mutate stored
 * state through a returned object than it could with IndexedDB. One tab is the one writer; a second tab of the same game
 * would not see this tab's writes until it reloads.
 */
import type { KeyValueStore } from './kv.js';

export const CELL_KEY_PREFIX = 'cell:';

const isCell = (key: string) => key.startsWith(CELL_KEY_PREFIX);

export function cellCache(inner: KeyValueStore): KeyValueStore {
  let cells: Map<string, string> | null = null;
  let loading: Promise<Map<string, string>> | null = null;

  const load = (): Promise<Map<string, string>> => {
    if (cells) return Promise.resolve(cells);
    loading ??= (async () => {
      const keys = await inner.keys(CELL_KEY_PREFIX);
      const values = await inner.getMany<unknown>(keys);
      const map = new Map<string, string>();
      keys.forEach((k, i) => {
        if (values[i] !== undefined) map.set(k, JSON.stringify(values[i]));
      });
      cells = map;
      loading = null;
      return map;
    })();
    return loading;
  };
  const parse = <T,>(raw: string | undefined): T | undefined => (raw === undefined ? undefined : (JSON.parse(raw) as T));

  return {
    async get<T>(key: string) {
      if (!isCell(key)) return inner.get<T>(key);
      return parse<T>((await load()).get(key));
    },
    async set<T>(key: string, value: T) {
      await inner.set(key, value);
      if (isCell(key)) (await load()).set(key, JSON.stringify(value));
    },
    async delete(key: string) {
      await inner.delete(key);
      if (isCell(key)) (await load()).delete(key);
    },
    async keys(prefix = '') {
      if (!prefix.startsWith(CELL_KEY_PREFIX)) return inner.keys(prefix);
      return [...(await load()).keys()].filter((k) => k.startsWith(prefix));
    },
    async getMany<T>(keys: string[]) {
      if (keys.length === 0 || !keys.every(isCell)) {
        if (!keys.some(isCell)) return inner.getMany<T>(keys);
        return Promise.all(keys.map((k) => this.get<T>(k)));
      }
      const map = await load();
      return keys.map((k) => parse<T>(map.get(k)));
    },
    async clear() {
      await inner.clear();
      cells = null;
      loading = null;
    },
  };
}
