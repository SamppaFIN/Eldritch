/**
 * BRDC-CLAIM-009 — step-claim and reveal through the repository.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_POOL, cellAt, neighboursOf } from '@es3/core';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-09-02T12:00:00Z');

/** A repo with a Hearth and one bare, unowned cell bordering it — the mock seeds rivals. */
async function repoWithHearth() {
  const store = new MemoryStore();
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  const repo = new MockRepository({ store, newId: () => 'me', seed: 3 });
  await repo.setHome(ORIGIN, T0);
  const home = cellAt(ORIGIN);
  const [near] = neighboursOf(home);
  await store.delete(K.cell(near as string)); // clear any seeded rival on it
  return { repo, store, home, near: near as string };
}

describe('claimStep', () => {
  let repo: MockRepository;
  let store: MemoryStore;
  let near: string;

  beforeEach(async () => {
    ({ repo, store, near } = await repoWithHearth());
  });

  it('claims a bare hex that borders your ground', async () => {
    expect(await repo.claimStep(near, T0)).toEqual({ claimed: near });
    const owned = await repo.getOwnedCells(T0);
    expect(owned.some((c) => c.h3 === near && c.ownerId === 'me')).toBe(true);
  });

  it('claims nothing far off your border', async () => {
    const faraway = cellAt({ lat: ORIGIN.lat + 0.5, lng: ORIGIN.lng + 0.5 });
    expect(await repo.claimStep(faraway, T0)).toEqual({ claimed: null });
  });

  it('pays XP for a step-claim', async () => {
    const before = (await repo.getProfile()).xp;
    await repo.claimStep(near, T0);
    expect((await repo.getProfile()).xp).toBeGreaterThan(before);
  });

  it('does not claim the same hex twice', async () => {
    await repo.claimStep(near, T0);
    expect(await repo.claimStep(near, T0)).toEqual({ claimed: null });
  });

  it('will not take a rival cell, even one on your border', async () => {
    const other = neighboursOf(cellAt(ORIGIN))[3] as string;
    await store.set(K.cell(other), {
      h3: other,
      ownerId: 'them',
      strength: 200,
      lastVisitedAt: T0,
      visitDays: [],
    });
    expect(await repo.claimStep(other, T0)).toEqual({ claimed: null });
  });
});

describe('revealCell', () => {
  let repo: MockRepository;
  let store: MemoryStore;
  let near: string;

  beforeEach(async () => {
    ({ repo, store, near } = await repoWithHearth());
    await store.set('resources', { pool: { ...EMPTY_POOL }, since: T0, sinceDay: T0 });
    await repo.claimStep(near, T0); // a cell the player holds, to reveal
  });

  it('reveals a held cell once, refuses the second time', async () => {
    expect((await repo.revealCell(near, T0)).ok).toBe(true);
    expect(await repo.revealCell(near, T0)).toEqual({ ok: false, refused: 'already-revealed' });
  });

  it('records the reveal, so getRevealed carries it', async () => {
    await repo.revealCell(near, T0);
    expect((await repo.getRevealed())[near]).toBe(T0);
  });

  it('refuses a cell the player does not hold', async () => {
    const stranger = cellAt({ lat: ORIGIN.lat + 1, lng: ORIGIN.lng + 1 });
    expect(await repo.revealCell(stranger, T0)).toEqual({ ok: false, refused: 'not-yours' });
  });

  it('returns the tier and the bonus it granted', async () => {
    const r = await repo.revealCell(near, T0);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(['common', 'uncommon', 'rare', 'legendary']).toContain(r.tier);
      expect(r.bonus).toBeTypeOf('object');
    }
  });
});
