/**
 * BRDC-CHAR-001 — achievements and the name, through the repository.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { cellAt } from '../geo/cells.js';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';
import type { Cell } from '../types/domain.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-09-02T12:00:00Z');

let store: MemoryStore;
let repo: MockRepository;

beforeEach(async () => {
  store = new MemoryStore();
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  repo = new MockRepository({ store, newId: () => 'me', seed: 4 });
});

describe('achievements', () => {
  it('start all locked', async () => {
    const view = await repo.getAchievements(T0);
    expect(view.length).toBeGreaterThan(5);
    expect(view.every((a) => a.unlockedAt === null)).toBe(true);
  });

  it('unlock and stamp when the state earns them, once', async () => {
    await repo.setHome(ORIGIN, T0); // Anchor → homesteader
    // Twelve held cells → cartographer + first-ground.
    for (let i = 0; i < 12; i++) {
      const h = cellAt({ lat: ORIGIN.lat + i * 0.0006, lng: ORIGIN.lng + i * 0.0006 });
      await store.set(K.cell(h), { h3: h, ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [] } as Cell);
    }

    const first = await repo.syncAchievements(T0);
    expect(first).toEqual(expect.arrayContaining(['homesteader', 'cartographer', 'first-ground']));

    const again = await repo.syncAchievements(T0 + 60_000);
    expect(again).toEqual([]);

    const got = (await repo.getAchievements(T0)).filter((a) => a.unlockedAt !== null);
    expect(got.find((a) => a.id === 'cartographer')?.unlockedAt).toBe(T0);
  });

  it('a reset clears them', async () => {
    await repo.setHome(ORIGIN, T0);
    await repo.syncAchievements(T0);
    await repo.resetAll();
    expect((await repo.getAchievements(T0)).every((a) => a.unlockedAt === null)).toBe(true);
  });
});

describe('setPlayerName', () => {
  it('trims, caps at 24, and ignores an empty string', async () => {
    expect((await repo.setPlayerName('  Cornelius  ')).name).toBe('Cornelius');
    expect((await repo.setPlayerName('x'.repeat(40))).name).toHaveLength(24);
    expect((await repo.setPlayerName('   ')).name).toBe('x'.repeat(24)); // unchanged
  });
});
