/** BRDC-SUZERAIN-001 — envoys posted and read back on the Worker. */
import { describe, expect, it } from 'vitest';
import { listEnvoys, publishEnvoys } from './envoys.js';
import type { KV } from './index.js';

function memoryKv(): KV & { ttl: Map<string, number | undefined> } {
  const m = new Map<string, string>();
  const ttl = new Map<string, number | undefined>();
  return {
    ttl,
    get: async (k) => m.get(k) ?? null,
    put: async (k, v, o) => void (m.set(k, v), ttl.set(k, o?.expirationTtl)),
    delete: async (k) => void m.delete(k),
    list: async (o) => ({ keys: [...m.keys()].filter((k) => !o?.prefix || k.startsWith(o.prefix)).map((name) => ({ name })) }),
  };
}

describe('envoys on the Worker', () => {
  it('keeps one row per realm, the latest winning, and lists them all', async () => {
    const kv = memoryKv();
    await publishEnvoys(kv, { playerId: 'a', name: 'Infinite', envoys: { 'harmala-fishers': 2 } }, 1);
    await publishEnvoys(kv, { playerId: 'a', envoys: { 'harmala-fishers': 4 } }, 2);
    await publishEnvoys(kv, { playerId: 'b', envoys: { 'harmala-fishers': 3 } }, 3);
    const rows = await listEnvoys(kv);
    expect(rows.map((r) => [r.playerId, r.envoys['harmala-fishers']]).sort()).toEqual([['a', 4], ['b', 3]]);
    expect(kv.ttl.get('envoys:a')).toBeGreaterThan(0);
  });

  it('refuses a row without a player or envoys, and cleans the numbers', async () => {
    const kv = memoryKv();
    expect(await publishEnvoys(kv, { envoys: {} }, 1)).toBeNull();
    expect(await publishEnvoys(kv, { playerId: 'a' }, 1)).toBeNull();
    const row = await publishEnvoys(kv, { playerId: 'a', envoys: { x: 2.7, y: -1, z: 'many' } }, 1);
    expect(row?.envoys).toEqual({ x: 2 });
  });
});
