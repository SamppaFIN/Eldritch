/**
 * IndexedDB adapter for KeyValueStore.
 *
 * Lives here rather than in packages/core because it needs the DOM. It is deliberately
 * thin: one object store, keys as strings, values structured-cloned. All the behaviour
 * worth testing sits in MockRepository, which runs against MemoryStore.
 *
 * A phone walk produces thousands of trail points, which is why this is IndexedDB and
 * not localStorage — v2 kept its step markers in localStorage and hit the 5 MB wall.
 */
import type { KeyValueStore } from '@es3/core';

const DB_NAME = 'es3';
const DB_VERSION = 1;
const STORE = 'kv';

export class IdbStore implements KeyValueStore {
  private db: Promise<IDBDatabase> | null = null;

  private open(): Promise<IDBDatabase> {
    this.db ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) {
          request.result.createObjectStore(STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
    });
    return this.db;
  }

  private async run<T>(
    mode: IDBTransactionMode,
    body: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const db = await this.open();
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = body(tx.objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
    });
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.run<T | undefined>('readonly', (s) => s.get(key) as IDBRequest<T | undefined>);
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.run('readwrite', (s) => s.put(value as unknown as object, key));
  }

  async delete(key: string): Promise<void> {
    await this.run('readwrite', (s) => s.delete(key));
  }

  /**
   * Keys beginning with `prefix`, read with a range instead of a full-table scan.
   *
   * The previous version pulled every key in the database into JS with `getAllKeys()`
   * and filtered by `startsWith` — trail points, runs and cells all mixed together,
   * every time anything asked for just one kind. IndexedDB orders string keys
   * lexicographically, so a bounded range does the same filtering inside the browser's
   * own index instead of after the fact.
   */
  async keys(prefix = ''): Promise<string[]> {
    const range = prefix ? IDBKeyRange.bound(prefix, prefix + '￿') : undefined;
    const all = await this.run<IDBValidKey[]>('readonly', (s) => s.getAllKeys(range));
    return all.map(String);
  }

  async clear(): Promise<void> {
    await this.run('readwrite', (s) => s.clear());
  }

  /**
   * One transaction, N requests — not N transactions.
   *
   * `get()` in a loop was the real cost behind reading a whole territory: each call
   * opens its own `db.transaction()`, and a browser walks with thousands of stored
   * cells pays that setup thousands of times a second while the trail is being
   * submitted. A single transaction holding every request is the standard IndexedDB
   * fix and needs nothing else to change — same keys in, same values out, same order.
   */
  async getMany<T>(keys: string[]): Promise<Array<T | undefined>> {
    if (keys.length === 0) return [];
    const db = await this.open();
    return new Promise<Array<T | undefined>>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const results = new Array<T | undefined>(keys.length);

      keys.forEach((key, i) => {
        const request = store.get(key) as IDBRequest<T | undefined>;
        request.onsuccess = () => {
          results[i] = request.result;
        };
        request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
      });

      tx.oncomplete = () => resolve(results);
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    });
  }
}

/**
 * Private browsing, blocked site data, and some embedded webviews all make IndexedDB
 * throw or hang. The game must still start; it just will not remember anything, and
 * the caller is told so it can say that out loud rather than pretending.
 */
export async function idbAvailable(): Promise<boolean> {
  if (typeof indexedDB === 'undefined') return false;
  try {
    const probe = new IdbStore();
    await probe.get('__probe');
    return true;
  } catch {
    return false;
  }
}
