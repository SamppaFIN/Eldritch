import { describe, expect, it } from 'vitest';
import { addRouteDistance, readRouteDistance } from './distanceStore.js';
import { MemoryStore } from './kv.js';

describe('addRouteDistance / readRouteDistance (BRDC-MODE-002)', () => {
  it('starts at zero', async () => {
    expect(await readRouteDistance(new MemoryStore())).toBe(0);
  });

  it('accumulates across calls', async () => {
    const store = new MemoryStore();
    await addRouteDistance(store, 120);
    await addRouteDistance(store, 30.5);
    expect(await readRouteDistance(store)).toBeCloseTo(150.5, 5);
  });

  it('ignores a non-positive amount rather than corrupting the total', async () => {
    const store = new MemoryStore();
    await addRouteDistance(store, 100);
    await addRouteDistance(store, 0);
    await addRouteDistance(store, -50);
    expect(await readRouteDistance(store)).toBe(100);
  });
});
