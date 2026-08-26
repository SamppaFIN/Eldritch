import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NS, SAVE_VERSION, clearAll, createSaver, load, loadWith, saveNow } from './save.js';

/** Minimal in-memory localStorage. Node has none, and jsdom is overkill here. */
class MemoryStorage {
  private map = new Map<string, string>();
  throwOnSet: Error | null = null;

  get length(): number {
    return this.map.size;
  }
  key(i: number): string | null {
    return [...this.map.keys()][i] ?? null;
  }
  getItem(k: string): string | null {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    if (this.throwOnSet) throw this.throwOnSet;
    this.map.set(k, v);
  }
  removeItem(k: string): void {
    this.map.delete(k);
  }
  clear(): void {
    this.map.clear();
  }
}

let store: MemoryStorage;

beforeEach(() => {
  store = new MemoryStorage();
  vi.stubGlobal('localStorage', store);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('load / save round-trip', () => {
  it('returns what was written', () => {
    saveNow('profile', { name: 'Infinite', level: 3 });
    expect(load('profile', null)).toEqual({ name: 'Infinite', level: 3 });
  });

  it('namespaces every key under es3:', () => {
    saveNow('profile', 1);
    expect(store.key(0)).toBe(`${NS}profile`);
  });

  it('reports empty for a key that was never written', () => {
    expect(loadWith('missing', 'fallback')).toEqual({ value: 'fallback', outcome: 'empty' });
  });
});

describe('version rejection — the level-118 bug', () => {
  it('rejects an envelope from a future version', () => {
    store.setItem(`${NS}state`, JSON.stringify({ v: SAVE_VERSION + 1, d: { level: 118 } }));
    expect(loadWith('state', { level: 1 })).toEqual({ value: { level: 1 }, outcome: 'stale' });
  });

  it('rejects an envelope from an older version', () => {
    store.setItem(`${NS}state`, JSON.stringify({ v: 0, d: { level: 118 } }));
    expect(loadWith('state', { level: 1 }).outcome).toBe('stale');
  });

  it('removes the stale key so it cannot be read twice', () => {
    store.setItem(`${NS}state`, JSON.stringify({ v: 99, d: {} }));
    loadWith('state', null);
    expect(store.getItem(`${NS}state`)).toBeNull();
  });

  it('rejects v2-shaped data that has no envelope at all', () => {
    // This is literally what v2 wrote to eldritch_game_state.
    store.setItem(`${NS}state`, JSON.stringify({ level: 118, discoveries: 150 }));
    expect(loadWith('state', { level: 1 })).toEqual({ value: { level: 1 }, outcome: 'stale' });
  });
});

describe('failure modes never throw', () => {
  it('survives malformed JSON', () => {
    store.setItem(`${NS}state`, '{ not json');
    expect(loadWith('state', 'fallback')).toEqual({ value: 'fallback', outcome: 'corrupt' });
  });

  it('survives storage that throws on read', () => {
    vi.stubGlobal('localStorage', {
      getItem() {
        throw new Error('SecurityError');
      },
    });
    expect(loadWith('state', 'fallback').outcome).toBe('corrupt');
  });

  it('reports quota instead of throwing', () => {
    store.throwOnSet = Object.assign(new Error('full'), { name: 'QuotaExceededError' });
    expect(saveNow('state', { big: 'x' })).toBe('quota');
  });

  it('reports unavailable for other write failures', () => {
    store.throwOnSet = Object.assign(new Error('nope'), { name: 'SecurityError' });
    expect(saveNow('state', 1)).toBe('unavailable');
  });
});

describe('createSaver debounce', () => {
  it('writes at most once per interval', () => {
    vi.useFakeTimers();
    const save = createSaver(2_000);

    for (let i = 0; i < 10; i++) save('trail', { i });
    expect(store.getItem(`${NS}trail`)).toBeNull(); // nothing yet

    vi.advanceTimersByTime(2_000);
    expect(load('trail', null)).toEqual({ i: 9 }); // last value wins
  });

  it('flush writes immediately', () => {
    vi.useFakeTimers();
    const save = createSaver(2_000);
    save('trail', { i: 1 });
    save.flush();
    expect(load('trail', null)).toEqual({ i: 1 });
  });

  it('cancel drops pending writes', () => {
    vi.useFakeTimers();
    const save = createSaver(2_000);
    save('trail', { i: 1 });
    save.cancel();
    vi.advanceTimersByTime(10_000);
    expect(store.getItem(`${NS}trail`)).toBeNull();
  });

  it('keeps separate keys separate', () => {
    vi.useFakeTimers();
    const save = createSaver(2_000);
    save('a', 1);
    save('b', 2);
    vi.advanceTimersByTime(2_000);
    expect(load('a', null)).toBe(1);
    expect(load('b', null)).toBe(2);
  });
});

describe('clearAll', () => {
  it('removes es3 keys and leaves everything else alone', () => {
    saveNow('a', 1);
    saveNow('b', 2);
    store.setItem('eldritch_game_state', 'v2 leftovers');

    clearAll();

    expect(store.getItem(`${NS}a`)).toBeNull();
    expect(store.getItem(`${NS}b`)).toBeNull();
    expect(store.getItem('eldritch_game_state')).toBe('v2 leftovers');
  });
});
