/**
 * A schema version for KeyValueStore-backed state.
 *
 * `SAVE_VERSION` (`persist/save.ts`) guards `localStorage` only — a small, bounded set of
 * keys under `es3:`. Most of the game's state does not live there: cells, the resource
 * pouch, the Hearth, the Keep, defence, runs and trail all pass through `KeyValueStore`
 * into IndexedDB (`apps/game/src/data/IdbStore.ts`), and that path had no version check.
 *
 * BRDC-ECON-001 changed the `ResourcePool` shape and had to sniff the old one
 * structurally in `pouch.ts`, or a `{ water, wood, gold }` pool would be read back as the
 * new nine-field shape and the first arithmetic on it would mint `NaN`. This replaces
 * that one-off with a general rule: the store carries its own version, checked once, and
 * an unknown or older one is a deliberate reset — never a silent migration, the same
 * stance `loadWith` takes for `localStorage`.
 *
 * This number and `SAVE_VERSION` are deliberately separate, like `CHALLENGE_VERSION`:
 * they version different data, in different stores, and bump for different reasons. Raise
 * `SCHEMA_VERSION` when any value written through `KeyValueStore` changes shape in a way
 * an old value could not be read as the new one.
 *
 * BRDC-PERSIST-003 added a migration path: a bump used to mean a guaranteed wipe, which
 * cost a returning player everything for a change that was often mechanical. Now, when a
 * migration is registered for every step from the stored version to the current one,
 * the data is transformed forward instead. A wipe is still the fallback — for a version
 * we do not know how to read, for data newer than the code, for data under no version
 * key at all — because inventing state is worse than admitting it is gone.
 */
import type { KeyValueStore } from './kv.js';

/** Not in `keys.ts`'s `K`: that map is game data, this is the store's own metadata. */
export const SCHEMA_KEY = 'schema:version';

/**
 * 1 → 2: BRDC-SCALE-001 changed the cell key from `cell:${h3}` to
 * `cell:${regionOf(h3)}:${h3}`. No migration is registered for it, so a v1 store is
 * still reset rather than migrated.
 */
export const SCHEMA_VERSION = 2;

/**
 * `from` version → the function that rewrites the store from `from` to `from + 1`.
 *
 * Empty for now: nothing in the store has changed shape since the migration path was
 * added. The first real shape change registers its transform here — reading old keys,
 * writing new ones — and stops being a wipe. Each entry advances exactly one version so
 * a multi-version gap composes from the steps it is made of.
 */
export const MIGRATIONS: Readonly<
  Partial<Record<number, (inner: KeyValueStore) => Promise<void>>>
> = {};

export type SchemaOutcome = 'ok' | 'migrated' | 'reset';

export interface VersionedStore extends KeyValueStore {
  /** The schema check, run once and memoised. Every other method awaits it first. */
  schema(): Promise<SchemaOutcome>;
}

/**
 * Wrap a store so its first operation verifies the schema version, once.
 *
 * The check is a memoised promise: concurrent callers on a fresh store all await the same
 * run, so `clear()` fires at most once however the boot is interleaved — the property
 * `boot.test.ts` already asserts for seeding.
 *
 * An empty store with no version key is a first launch, not a stale save: it is stamped
 * and reported `'ok'`, mirroring `loadWith` returning `'empty'` rather than `'stale'` for
 * a missing key. An older version with a full set of registered migrations is
 * transformed forward and reported `'migrated'`. Anything else — a wrong number, a
 * version newer than the code, a gap with no migration, or data sitting under no version
 * key at all — is cleared and reported `'reset'`. A deliberate `clear()` re-stamps the
 * version, so a player's own reset does not make the next open look stale.
 */
/** True when every one-step migration from `from` up to the current version exists. */
function canMigrateFrom(from: number): boolean {
  for (let v = from; v < SCHEMA_VERSION; v += 1) {
    if (typeof MIGRATIONS[v] !== 'function') return false;
  }
  return true;
}

export function versioned(inner: KeyValueStore): VersionedStore {
  const stamp = (): Promise<void> => inner.set(SCHEMA_KEY, SCHEMA_VERSION);

  let gate: Promise<SchemaOutcome> | null = null;
  const check = (): Promise<SchemaOutcome> =>
    (gate ??= (async () => {
      const stored = await inner.get<number>(SCHEMA_KEY);
      if (stored === SCHEMA_VERSION) return 'ok';
      if (stored === undefined && (await inner.keys()).length === 0) {
        await stamp();
        return 'ok';
      }

      // A known older version we have a full migration path for: walk it up one step at
      // a time rather than wiping it.
      if (
        typeof stored === 'number' &&
        stored > 0 &&
        stored < SCHEMA_VERSION &&
        canMigrateFrom(stored)
      ) {
        for (let v = stored; v < SCHEMA_VERSION; v += 1) await MIGRATIONS[v]!(inner);
        await stamp();
        return 'migrated';
      }

      await inner.clear();
      await stamp();
      return 'reset';
    })());

  return {
    async get<T>(key: string): Promise<T | undefined> {
      await check();
      return inner.get<T>(key);
    },
    async set<T>(key: string, value: T): Promise<void> {
      await check();
      return inner.set<T>(key, value);
    },
    async delete(key: string): Promise<void> {
      await check();
      return inner.delete(key);
    },
    async keys(prefix?: string): Promise<string[]> {
      await check();
      return inner.keys(prefix);
    },
    async getMany<T>(keys: string[]): Promise<Array<T | undefined>> {
      await check();
      return inner.getMany<T>(keys);
    },
    async clear(): Promise<void> {
      await check();
      await inner.clear();
      await stamp();
    },
    schema: check,
  };
}
