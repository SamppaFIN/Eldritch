import { describe, expect, it } from 'vitest';
import { cellCache } from './cellCache.js';
import { MemoryStore } from './kv.js';

class Counting extends MemoryStore {
  scans = 0;
  override async keys(prefix = ''): Promise<string[]> {
    this.scans += 1;
    return super.keys(prefix);
  }
}

describe('cellCache (BRDC-PERF-003)', () => {
  it('scans the store once, then answers from memory', async () => {
    const inner = new Counting();
    await inner.set('cell:r1:a', { h3: 'a' });
    const c = cellCache(inner);
    expect(await c.keys('cell:')).toEqual(['cell:r1:a']);
    expect(await c.keys('cell:r1:')).toEqual(['cell:r1:a']);
    await c.getMany(['cell:r1:a']);
    expect(inner.scans).toBe(1);
  });

  it('writes through: a set or delete is read back at once, and reaches the store', async () => {
    const inner = new MemoryStore();
    const c = cellCache(inner);
    await c.keys('cell:');
    await c.set('cell:r1:b', { h3: 'b', strength: 5 });
    expect(await c.get('cell:r1:b')).toEqual({ h3: 'b', strength: 5 });
    expect(await inner.get('cell:r1:b')).toEqual({ h3: 'b', strength: 5 });
    await c.delete('cell:r1:b');
    expect(await c.get('cell:r1:b')).toBeUndefined();
    expect(await c.keys('cell:')).toEqual([]);
  });

  it('a returned cell is a copy: mutating it changes nothing stored', async () => {
    const c = cellCache(new MemoryStore());
    await c.set('cell:r1:a', { h3: 'a', strength: 1 });
    const got = (await c.get<{ strength: number }>('cell:r1:a'))!;
    got.strength = 999;
    expect(await c.get('cell:r1:a')).toEqual({ h3: 'a', strength: 1 });
  });

  it('other keys pass straight through', async () => {
    const inner = new MemoryStore();
    const c = cellCache(inner);
    await c.set('profile', { id: 'me' });
    expect(await inner.get('profile')).toEqual({ id: 'me' });
    expect(await c.getMany(['profile', 'cell:r1:x'])).toEqual([{ id: 'me' }, undefined]);
  });

  it('clear empties both the store and the cache', async () => {
    const inner = new MemoryStore();
    const c = cellCache(inner);
    await c.set('cell:r1:a', { h3: 'a' });
    await c.clear();
    expect(await c.keys('cell:')).toEqual([]);
    expect(await inner.keys('cell:')).toEqual([]);
  });
});
