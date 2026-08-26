/// <reference lib="dom" />
/**
 * NOTE ON PURITY: packages/core is DOM-free by rule, because game rules must be
 * testable without a browser. This one module is the deliberate exception — it is
 * the browser storage adapter, and the reference above scopes DOM types to this
 * file only. rules/ and geo/ stay pure.
 */
/**
 * One namespace, one save(), one version.
 *
 * v2 had 29 ungoverned localStorage keys and no version field. A stale save produced
 * a level-118 player whose encounters silently stopped firing. Everything here exists
 * to make that specific failure impossible.
 *
 * localStorage holds small, bounded state only. Anything that grows — trail points,
 * cells — belongs in IndexedDB (MockRepository).
 */

export const SAVE_VERSION = 1;
export const NS = 'es3:';

/** Bump-safe envelope. `v` is checked before `d` is ever trusted. */
interface Envelope<T> {
  v: number;
  d: T;
}

export type LoadOutcome = 'ok' | 'empty' | 'stale' | 'corrupt';

export interface LoadResult<T> {
  value: T;
  outcome: LoadOutcome;
}

function key(name: string): string {
  return NS + name;
}

/**
 * Reads a value. Never throws, never returns half-parsed data.
 *
 * A version mismatch is a deliberate reset, not a silent migration: the caller gets
 * `outcome: 'stale'` so it can tell the player why their sanctuary is empty.
 */
export function loadWith<T>(name: string, fallback: T): LoadResult<T> {
  let raw: string | null;
  try {
    raw = localStorage.getItem(key(name));
  } catch {
    // Private mode, disabled storage, or a browser that throws on access.
    return { value: fallback, outcome: 'corrupt' };
  }
  if (raw === null) return { value: fallback, outcome: 'empty' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    remove(name);
    return { value: fallback, outcome: 'corrupt' };
  }

  if (typeof parsed !== 'object' || parsed === null || !('v' in parsed) || !('d' in parsed)) {
    // v2-shaped data, or anything else that is not ours.
    remove(name);
    return { value: fallback, outcome: 'stale' };
  }

  const env = parsed as Envelope<T>;
  if (env.v !== SAVE_VERSION) {
    remove(name);
    return { value: fallback, outcome: 'stale' };
  }

  return { value: env.d, outcome: 'ok' };
}

/** Convenience wrapper when the caller does not care why it fell back. */
export function load<T>(name: string, fallback: T): T {
  return loadWith(name, fallback).value;
}

export type WriteOutcome = 'written' | 'quota' | 'unavailable';

/**
 * Writes immediately. Prefer `createSaver()` for anything on a hot path —
 * one write per GPS tick is how you flatten a battery.
 */
export function saveNow<T>(name: string, data: T): WriteOutcome {
  const env: Envelope<T> = { v: SAVE_VERSION, d: data };
  try {
    localStorage.setItem(key(name), JSON.stringify(env));
    return 'written';
  } catch (err) {
    if (isQuotaError(err)) return 'quota';
    return 'unavailable';
  }
}

export function remove(name: string): void {
  try {
    localStorage.removeItem(key(name));
  } catch {
    /* nothing useful to do */
  }
}

/** Clears every `es3:` key and nothing else. */
export function clearAll(): void {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k !== null && k.startsWith(NS)) doomed.push(k);
    }
    for (const k of doomed) localStorage.removeItem(k);
  } catch {
    /* nothing useful to do */
  }
}

function isQuotaError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    err.name === 'QuotaExceededError' ||
    err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    // Safari private mode
    err.name === 'QUOTA_EXCEEDED_ERR'
  );
}

export interface Saver {
  /** Queue a write. At most one actual write per `intervalMs`. */
  (name: string, data: unknown): void;
  /** Write everything pending right now — call on pagehide. */
  flush(): WriteOutcome[];
  /** Drop pending writes and cancel the timer. */
  cancel(): void;
}

/**
 * Debounced writer. Trailing-edge with a hard interval ceiling, so a continuous
 * stream of updates still lands on disk every `intervalMs` rather than never.
 */
export function createSaver(intervalMs = 2_000): Saver {
  const pending = new Map<string, unknown>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = (): WriteOutcome[] => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    const results: WriteOutcome[] = [];
    for (const [name, data] of pending) results.push(saveNow(name, data));
    pending.clear();
    return results;
  };

  const saver = ((name: string, data: unknown) => {
    pending.set(name, data);
    if (timer === null) timer = setTimeout(flush, intervalMs);
  }) as Saver;

  saver.flush = flush;
  saver.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    pending.clear();
  };

  return saver;
}
