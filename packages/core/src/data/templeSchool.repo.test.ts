/**
 * BRDC-TEMPLE-002 — a temple's element, and the research it gates.
 *
 * `assignSchool`'s guards are one half, through the repository the same way
 * `temple.repo.test.ts` already tests `consecrateTemple`. `researchTech`'s new
 * precondition — an awake temple of the right school — is the other half.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_POOL, TEMPLE_THRESHOLD_MS, cellAt } from '@es3/core';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-09-02T12:00:00Z');
const HOUR = 3_600_000;

/** A repo with a Hearth and one owned cell already dwelt long enough to be a temple. */
async function repoWithTemple(wisdom = 0) {
  const store = new MemoryStore();
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  const repo = new MockRepository({ store, newId: () => 'me', seed: 3 });
  await repo.setHome(ORIGIN, T0);

  const temple = cellAt({ lat: ORIGIN.lat + 0.01, lng: ORIGIN.lng + 0.01 });
  await store.set(K.cell(temple), {
    h3: temple,
    ownerId: 'me',
    strength: 300,
    lastVisitedAt: T0,
    visitDays: [],
  });
  await store.set(K.dwell, { [temple]: TEMPLE_THRESHOLD_MS });
  if (wisdom > 0) {
    await store.set('resources', { pool: { ...EMPTY_POOL, wisdom }, since: T0, sinceDay: T0 });
  }
  return { repo, store, temple };
}

describe("choosing a temple's element", () => {
  let repo: MockRepository;
  let store: MemoryStore;
  let temple: string;

  beforeEach(async () => {
    ({ repo, store, temple } = await repoWithTemple());
  });

  it('assigns a school to an owned, dwelt-in temple', async () => {
    expect(await repo.assignTempleSchool(temple, 'earth', T0)).toEqual({
      ok: true,
      school: 'earth',
    });
    expect(await repo.getTempleSchools()).toEqual({ [temple]: 'earth' });
  });

  it('refuses ground the player does not hold', async () => {
    const elsewhere = cellAt({ lat: ORIGIN.lat - 0.05, lng: ORIGIN.lng - 0.05 });
    expect(await repo.assignTempleSchool(elsewhere, 'earth', T0)).toEqual({
      ok: false,
      refused: 'not-yours',
    });
  });

  it('refuses a cell that has not dwelt long enough to be a temple', async () => {
    const bare = cellAt({ lat: ORIGIN.lat + 0.02, lng: ORIGIN.lng + 0.02 });
    await store.set(K.cell(bare), {
      h3: bare,
      ownerId: 'me',
      strength: 300,
      lastVisitedAt: T0,
      visitDays: [],
    });
    expect(await repo.assignTempleSchool(bare, 'earth', T0)).toEqual({
      ok: false,
      refused: 'not-a-temple',
    });
  });

  it('cannot be changed once chosen', async () => {
    await repo.assignTempleSchool(temple, 'earth', T0);
    expect(await repo.assignTempleSchool(temple, 'fire', T0)).toEqual({
      ok: false,
      refused: 'already-chosen',
    });
    expect(await repo.getTempleSchools()).toEqual({ [temple]: 'earth' });
  });
});

describe('researching a schooled technology needs an awake temple', () => {
  it('refuses when no temple carries that school yet', async () => {
    const { repo } = await repoWithTemple(1000);
    expect(await repo.researchTech('fortification', T0)).toEqual({
      ok: false,
      refused: 'needs-a-temple',
    });
  });

  it('succeeds once the matching temple is chosen and awake', async () => {
    const { repo, temple } = await repoWithTemple(1000);
    await repo.assignTempleSchool(temple, 'spirit', T0);
    await repo.researchTech('forestry', T0);
    await repo.researchTech('seafaring', T0);
    expect(await repo.researchTech('astronomy', T0)).toEqual({
      ok: true,
      researched: ['forestry', 'seafaring', 'astronomy'],
      era: null,
    });
  });

  it('refuses again once the matching temple has gone dormant', async () => {
    const { repo, temple } = await repoWithTemple(1000);
    await repo.assignTempleSchool(temple, 'spirit', T0);
    await repo.researchTech('forestry', T0);
    await repo.researchTech('seafaring', T0);
    // 49h past the cell's last visit — one hour past the 48h decay grace (BRDC-DECAY-002).
    expect(await repo.researchTech('astronomy', T0 + 49 * HOUR)).toEqual({
      ok: false,
      refused: 'needs-a-temple',
    });
  });

  it('a second temple of the same school does not change the outcome', async () => {
    const { repo, store, temple } = await repoWithTemple(1000);
    const temple2 = cellAt({ lat: ORIGIN.lat + 0.02, lng: ORIGIN.lng - 0.01 });
    await store.set(K.cell(temple2), {
      h3: temple2,
      ownerId: 'me',
      strength: 300,
      lastVisitedAt: T0,
      visitDays: [],
    });
    await store.set(K.dwell, { [temple]: TEMPLE_THRESHOLD_MS, [temple2]: TEMPLE_THRESHOLD_MS });
    await repo.assignTempleSchool(temple, 'spirit', T0);
    await repo.assignTempleSchool(temple2, 'spirit', T0);
    await repo.researchTech('forestry', T0);
    await repo.researchTech('seafaring', T0);
    expect(await repo.researchTech('astronomy', T0)).toEqual({
      ok: true,
      researched: ['forestry', 'seafaring', 'astronomy'],
      era: null,
    });
  });
});
