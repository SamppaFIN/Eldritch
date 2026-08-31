/**
 * BRDC-TECH-001 — researching through the repository: wisdom out, era in.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_POOL, TECHS } from '@es3/core';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';

const T0 = Date.parse('2026-08-31T12:00:00Z');

/** A repo whose pouch already holds `wisdom` — a walk never earns any. */
async function repoWith(wisdom: number): Promise<MockRepository> {
  const store = new MemoryStore();
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  await store.set('resources', { pool: { ...EMPTY_POOL, wisdom }, since: T0 });
  return new MockRepository({ store, newId: () => 'me', seed: 3 });
}

describe('researchTech', () => {
  let repo: MockRepository;
  beforeEach(async () => {
    repo = await repoWith(300);
  });

  it('starts with nothing researched', async () => {
    expect(await repo.getResearched()).toEqual([]);
  });

  it('spends wisdom, persists the tech, and reports no era change mid-era', async () => {
    const result = await repo.researchTech('forestry', T0);
    expect(result).toEqual({ ok: true, researched: ['forestry'], era: null });
    expect(await repo.getResearched()).toEqual(['forestry']);
    expect((await repo.getResources(T0)).wisdom).toBe(300 - TECHS.forestry.cost);
  });

  it('refuses a locked tech without touching wisdom', async () => {
    expect(await repo.researchTech('mining', T0)).toEqual({ ok: false, refused: 'locked' });
    expect((await repo.getResources(T0)).wisdom).toBe(300);
  });

  it('refuses a tech already known', async () => {
    await repo.researchTech('forestry', T0);
    expect(await repo.researchTech('forestry', T0)).toEqual({
      ok: false,
      refused: 'already-known',
    });
  });

  it('refuses when the pouch cannot cover the cost', async () => {
    const poor = await repoWith(5);
    expect(await poor.researchTech('toolmaking', T0)).toEqual({
      ok: false,
      refused: 'cannot-afford',
    });
  });

  it('names the new era when a research completes the previous one', async () => {
    await repo.researchTech('early-farming', T0);
    await repo.researchTech('forestry', T0);
    const last = await repo.researchTech('toolmaking', T0);
    expect(last).toEqual({
      ok: true,
      researched: ['early-farming', 'forestry', 'toolmaking'],
      era: 'antiquity',
    });
  });
});
