/**
 * BRDC-CIPHER-001 — collecting and assembling the cipher through the repository.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { SHARD_COUNT } from '@es3/core';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';

const T0 = Date.parse('2026-09-02T12:00:00Z');

let store: MemoryStore;
let repo: MockRepository;

beforeEach(async () => {
  store = new MemoryStore();
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  repo = new MockRepository({ store, newId: () => 'me' });
});

describe('the scattered cipher', () => {
  it('starts empty — no fragments, not whole, no writing', async () => {
    const v = await repo.getCipher();
    expect(v.held).toEqual([]);
    expect(v.complete).toBe(false);
    expect(v.inscription).toBeNull();
    expect(v.fragments).toHaveLength(SHARD_COUNT);
    expect(v.fragments.every((f) => !f.held && f.line.length > 0)).toBe(true);
  });

  it('records a fragment once and logs it; a second time is refused', async () => {
    expect(await repo.recordCipherShard(2, T0)).toBe(2);
    expect(await repo.recordCipherShard(2, T0)).toBeNull();
    expect((await repo.getCipher()).held).toEqual([2]);
    expect((await repo.getLog()).some((e) => e.kind === 'quest' && e.ref === 'shard:2')).toBe(true);
  });

  it('reveals the inscription only when all seven are held', async () => {
    for (let i = 0; i < SHARD_COUNT - 1; i += 1) await repo.recordCipherShard(i, T0);
    expect((await repo.getCipher()).complete).toBe(false);
    expect((await repo.getCipher()).inscription).toBeNull();

    await repo.recordCipherShard(SHARD_COUNT - 1, T0);
    const whole = await repo.getCipher();
    expect(whole.complete).toBe(true);
    expect(whole.inscription).toBeTruthy();
    expect(whole.fragments.every((f) => f.held)).toBe(true);
  });

  it('a reset scatters it again', async () => {
    await repo.recordCipherShard(0, T0);
    await repo.resetAll();
    expect((await repo.getCipher()).held).toEqual([]);
    expect(await store.get(K.cipherShards)).toBeUndefined();
  });
});
