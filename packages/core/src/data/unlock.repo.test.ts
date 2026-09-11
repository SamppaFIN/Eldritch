/**
 * BRDC-TUTOR-001 — teaching a mechanic through the repository.
 *
 * The rule half is pure and tested in `rules/unlock.test.ts`. What can actually break
 * here is the pairing: a lesson marked read but never paid, or paid twice.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';
import { UNLOCK_REWARD } from '../rules/unlock.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-09-11T12:00:00Z');

let store: MemoryStore;
let repo: MockRepository;

beforeEach(async () => {
  store = new MemoryStore();
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  repo = new MockRepository({ store, newId: () => 'me', seed: 4 });
  await repo.setHome(ORIGIN, T0);
});

describe('lessons already taught', () => {
  it('start empty', async () => {
    expect(await repo.getUnlocksSeen()).toEqual(new Set());
  });

  it('remember what was read', async () => {
    await repo.markUnlockSeen('resources', T0);
    expect(await repo.getUnlocksSeen()).toEqual(new Set(['resources']));
  });

  it('are never un-taught by losing ground', async () => {
    await repo.markUnlockSeen('neighbours', T0);
    await repo.resetResources(T0);
    expect(await repo.getUnlocksSeen()).toContain('neighbours');
  });
});

describe('the reward', () => {
  it('is paid for reading a lesson', async () => {
    const before = (await repo.getResources(T0)).wisdom;
    expect(await repo.markUnlockSeen('resources', T0)).toBe(true);
    expect((await repo.getResources(T0)).wisdom).toBe(before + UNLOCK_REWARD);
  });

  // A double tap, a reload mid-grant, or the card open in two places. The stamp is
  // written before the grant and the grant is keyed on it, so only the first call pays.
  it('is paid exactly once, however many times the card is tapped', async () => {
    await repo.markUnlockSeen('resources', T0);
    const after = (await repo.getResources(T0)).wisdom;

    expect(await repo.markUnlockSeen('resources', T0)).toBe(false);
    expect(await repo.markUnlockSeen('resources', T0 + 5_000)).toBe(false);
    expect((await repo.getResources(T0)).wisdom).toBe(after);
  });

  it('pays separately for separate lessons', async () => {
    const before = (await repo.getResources(T0)).wisdom;
    await repo.markUnlockSeen('resources', T0);
    await repo.markUnlockSeen('building', T0);
    expect((await repo.getResources(T0)).wisdom).toBe(before + UNLOCK_REWARD * 2);
  });
});
