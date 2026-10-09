/** BRDC-TERROR-001 — a gate's move on the Worker moves the town's terror with the Doom. */
import { describe, expect, it } from 'vitest';
import { handleSeasonState } from './seasonState.js';
import type { KV } from './index.js';

function memoryKv(): KV {
  const m = new Map<string, string>();
  return {
    get: async (k) => m.get(k) ?? null,
    put: async (k, v) => void m.set(k, v),
    delete: async (k) => void m.delete(k),
    list: async (o) => ({ keys: [...m.keys()].filter((k) => !o?.prefix || k.startsWith(o.prefix)).map((name) => ({ name })) }),
  };
}

const send = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const bare = (status: number) => new Response(null, { status });

async function call(kv: KV, method: string, path: string, body?: unknown) {
  const url = new URL(`https://w.example${path}`);
  const req = new Request(url, { method, ...(body ? { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } } : {}) });
  return handleSeasonState(req, url, kv, 'key', send, bare, async () => []);
}

describe('the town’s terror on the Worker', () => {
  it('rises with a gate left open, falls with a seal, once each way per gate', async () => {
    const kv = memoryKv();
    await kv.put('season:state', JSON.stringify({ n: 3, name: 'S3', seed: 's3', phase: 'open', opensAt: Date.now(), doom: 0, bossHp: 0, bossMaxHp: 0 }));
    await call(kv, 'POST', '/season/doom', { gateId: 'a', delta: 1 });
    await call(kv, 'POST', '/season/doom', { gateId: 'b', delta: 1 });
    await call(kv, 'POST', '/season/doom', { gateId: 'b', delta: 1 }); // the same move twice counts once
    let season = (await (await call(kv, 'GET', '/season'))?.json()) as { terror?: number };
    expect(season.terror).toBe(2);
    await call(kv, 'POST', '/season/doom', { gateId: 'a', delta: -1 });
    season = (await (await call(kv, 'GET', '/season'))?.json()) as { terror?: number };
    expect(season.terror).toBe(1);
  });
});
