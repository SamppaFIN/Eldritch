import { describe, expect, it } from 'vitest';
import { watchRemoval } from './mapLife.js';

/** Just enough of MapLibre's Evented to fire `remove` by hand. */
function fakeMap() {
  const listeners = new Map<string, Set<() => void>>();
  const set = (type: string): Set<() => void> => {
    const existing = listeners.get(type);
    if (existing) return existing;
    const created = new Set<() => void>();
    listeners.set(type, created);
    return created;
  };
  return {
    on(type: string, fn: () => void) {
      set(type).add(fn);
      return this;
    },
    off(type: string, fn: () => void) {
      set(type).delete(fn);
      return this;
    },
    fire(type: string) {
      for (const fn of [...set(type)]) fn();
    },
    listening: (type: string) => set(type).size,
  };
}

/*
 * BRDC-SIGIL-006. The sprite loaders await rasterisation, then write into the map's atlas.
 * A map removed in the gap made every write throw "reading 'getImage'" — uncaught, because
 * the loaders are fire-and-forget. This is the check they now make after the await.
 */
describe('watchRemoval', () => {
  it('reports a map that was removed while the work was pending', () => {
    const map = fakeMap();
    const life = watchRemoval(map as never);
    expect(life.gone()).toBe(false);
    map.fire('remove');
    expect(life.gone()).toBe(true);
  });

  it('stops listening once the work is back, and holds no reference after', () => {
    const map = fakeMap();
    const life = watchRemoval(map as never);
    expect(map.listening('remove')).toBe(1);
    life.stop();
    expect(map.listening('remove')).toBe(0);
    // A removal after the work finished is not this loader's business.
    map.fire('remove');
    expect(life.gone()).toBe(false);
  });
});
