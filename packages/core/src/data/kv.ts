/**
 * A tiny key-value port, so the repository logic can be tested without a browser.
 *
 * IndexedDB is the real backing store (trail points run to thousands per walk, and
 * localStorage is 5 MB and synchronous — that was v2's `eldritch_stepMarkers` mistake).
 * But IndexedDB's own correctness is Mozilla's problem, not ours. What is worth testing
 * is run lifecycle, filtering and seeding, so those run against MemoryStore.
 *
 * The browser adapter lives in apps/game — it needs the DOM, and packages/core does not.
 */

export interface KeyValueStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  /** Keys beginning with `prefix`, in insertion order. */
  keys(prefix?: string): Promise<string[]>;
  clear(): Promise<void>;
}

/** In-memory store. Used by tests, and as the fallback when IndexedDB is unavailable. */
export class MemoryStore implements KeyValueStore {
  private readonly map = new Map<string, string>();

  async get<T>(key: string): Promise<T | undefined> {
    const raw = this.map.get(key);
    return raw === undefined ? undefined : (JSON.parse(raw) as T);
  }

  async set<T>(key: string, value: T): Promise<void> {
    // Serialising here rather than storing the object keeps MemoryStore honest:
    // callers cannot accidentally mutate stored state through a retained reference,
    // which IndexedDB would not allow either.
    this.map.set(key, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    this.map.delete(key);
  }

  async keys(prefix = ''): Promise<string[]> {
    return [...this.map.keys()].filter((k) => k.startsWith(prefix));
  }

  async clear(): Promise<void> {
    this.map.clear();
  }
}
