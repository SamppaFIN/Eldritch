import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { MockRepository } from './MockRepository.js';
import { CELL_PREFIX } from './cellStore.js';

/**
 * How many times one batch of points reads the whole cell store (BRDC-GPX-004).
 *
 * The field measurement was nine seconds of a mobile import inside `getOwnedCells`, and
 * the reason was arithmetic rather than mystery: `submitWalk` scanned every stored cell
 * twice — once for `hasGround`, once for `getOwnedCells` — and a live trail submitting
 * beside an import doubled it again.
 *
 * A wall-clock assertion here would measure the CI runner's mood. The count does not
 * move, so the count is what is pinned.
 */
class CountingStore extends MemoryStore {
  fullScans = 0;
  override async keys(prefix = ''): Promise<string[]> {
    if (prefix === CELL_PREFIX) this.fullScans += 1;
    return super.keys(prefix);
  }
}

describe('what one walk batch costs', () => {
  it('reads every stored cell once, not twice', async () => {
    const store = new CountingStore();
    const repo = new MockRepository({ store });
    await repo.getProfile();

    const runId = await repo.startRun(1_700_000_000_000);
    const base = { lat: 61.4729, lng: 23.7258, accuracy: 8 };
    const points = Array.from({ length: 6 }, (_, i) => ({
      lat: base.lat + i * 0.0004,
      lng: base.lng,
      accuracy: 8,
      t: 1_700_000_000_000 + i * 6_000,
    }));

    store.fullScans = 0;
    await repo.submitTrail(runId, points);

    expect(store.fullScans).toBe(1);
  });
});
