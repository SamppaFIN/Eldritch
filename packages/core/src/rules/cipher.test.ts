import { describe, expect, it } from 'vitest';
import { cellAt, neighboursOf } from '../geo/cells.js';
import { revealOf } from './reveal.js';
import { SHARD_COUNT, cipherComplete, cipherShardAt } from './cipher.js';

/** A wide patch of real cells, grown outward from a hash-terrain origin. */
function sample(n = 6000): string[] {
  const start = cellAt({ lat: 62.6, lng: 25.7 });
  const seen = new Set<string>([start]);
  const queue = [start];
  while (seen.size < n && queue.length) {
    for (const nb of neighboursOf(queue.shift() as string)) {
      if (!seen.has(nb)) {
        seen.add(nb);
        queue.push(nb);
      }
    }
  }
  return [...seen];
}

describe('cipherShardAt', () => {
  const cells = sample();

  it('is deterministic — the same cell answers the same, always', () => {
    for (const h of cells.slice(0, 200)) {
      expect(cipherShardAt(h)).toBe(cipherShardAt(h));
    }
  });

  it('only ever returns an index in range, or null', () => {
    for (const h of cells) {
      const s = cipherShardAt(h);
      if (s !== null) {
        expect(Number.isInteger(s)).toBe(true);
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThan(SHARD_COUNT);
      }
    }
  });

  it('lands on roughly one per cent of ground, and never on rare or legendary cells', () => {
    let hits = 0;
    for (const h of cells) {
      if (cipherShardAt(h) !== null) {
        hits += 1;
        expect(revealOf(h)).toBe('common');
      }
    }
    const rate = hits / cells.length;
    expect(rate).toBeGreaterThan(0.003);
    expect(rate).toBeLessThan(0.03);
  });

  it('covers every fragment index somewhere in a wide enough patch', () => {
    const seen = new Set(cells.map(cipherShardAt).filter((s): s is number => s !== null));
    expect(seen.size).toBe(SHARD_COUNT);
  });
});

describe('cipherComplete', () => {
  it('is false until every index is held, then true', () => {
    expect(cipherComplete([0, 1, 2, 3, 4, 5])).toBe(false);
    expect(cipherComplete([6, 5, 4, 3, 2, 1, 0])).toBe(true);
  });

  it('tolerates duplicates and disorder', () => {
    expect(cipherComplete([3, 3, 0, 1, 2, 6, 5, 4, 0])).toBe(true);
  });
});
