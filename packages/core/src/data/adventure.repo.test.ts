/**
 * BRDC-QUEST-001 — the Fuming Lake through the repository.
 *
 * The seam resolves the gate context from the ground the player holds, advances the
 * pure engine, pays XP, logs `kind:'quest'`, and unlocks a codex slug at the end.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_POOL, siteCell } from '@es3/core';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-09-01T12:00:00Z');

let repo: MockRepository;
let store: MemoryStore;

beforeEach(async () => {
  store = new MemoryStore();
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  await store.set('resources', {
    pool: { ...EMPTY_POOL, wisdom: 100, gold: 100, iron: 100 },
    since: T0,
    sinceDay: T0,
  });
  repo = new MockRepository({ store, newId: () => 'me', seed: 7 });
});

const own = (h3: string, terrain?: Cell['terrain']): Promise<void> =>
  store.set(K.cell(h3), {
    h3,
    ownerId: 'me',
    strength: 100,
    lastVisitedAt: T0,
    visitDays: [],
    ...(terrain ? { terrain } : {}),
  } as Cell);

const fuming = async () => (await repo.getAdventures(T0)).find((a) => a.id === 'fuming-lake');

describe('the Fuming Lake', () => {
  it('starts available and then active at the statue', async () => {
    expect((await fuming())?.state).toBe('available');
    expect(await repo.startAdventure('fuming-lake', T0)).toEqual({ ok: true });
    const a = await fuming();
    expect(a?.state).toBe('active');
    expect(a?.speaker).toBe('Narrator');
    expect((a?.choices?.length ?? 0)).toBeGreaterThan(0);
  });

  it('the opening choice is always open — the walk to the lake is the gate', async () => {
    await repo.startAdventure('fuming-lake', T0);
    const a = await fuming();
    expect(a?.stageId).toBe('statue');
    expect(a?.choices?.[0]?.locked).toBe(false);

    expect((await repo.chooseInAdventure('fuming-lake', 0, T0)).ok).toBe(true);
    expect((await fuming())?.stageId).toBe('lake');
  });

  it('refuses a second start on a running adventure', async () => {
    await repo.startAdventure('fuming-lake', T0);
    expect(await repo.startAdventure('fuming-lake', T0)).toEqual({ ok: false, refused: 'already-begun' });
  });

  it('the wisdom route beats the troll, pays XP, logs, and the ending unlocks the codex', async () => {
    await repo.startAdventure('fuming-lake', T0);
    await own(siteCell('wisdom'));

    const step = (i: number) => repo.chooseInAdventure('fuming-lake', i, T0);
    expect((await step(0)).ok).toBe(true); // statue -> lake
    expect((await step(0)).ok).toBe(true); // lake -> hermit
    expect((await step(0)).ok).toBe(true); // hermit -> troll

    const troll = await step(2); // wisdom stone
    expect(troll).toMatchObject({ ok: true, ended: false });

    expect((await step(0)).ok).toBe(true); // deep -> servitude
    const end = await step(0); // accept your post
    expect(end).toMatchObject({ ok: true, ended: true, unlocks: 'cthulhu-awakening' });

    expect((await fuming())?.state).toBe('done');
    expect((await repo.getProfile()).xp).toBe(560); // 60 at the troll + 500 at the end
    expect(await store.get<string[]>(K.unlocked)).toContain('cthulhu-awakening');
    expect((await repo.getResources(T0)).wisdom).toBe(80); // 20 spent to outwit
    expect((await repo.getLog()).some((e) => e.kind === 'quest')).toBe(true);
  });

  it('a reset wipes an adventure back to available', async () => {
    await repo.startAdventure('fuming-lake', T0);
    await repo.resetAll();
    expect((await fuming())?.state).toBe('available');
  });

  it('records a secret find once, and a reset clears it', async () => {
    expect(await repo.getQuestFinds()).toEqual([]);
    expect(await repo.recordQuestFind('wisdom', T0)).toBe('wisdom');
    expect(await repo.recordQuestFind('wisdom', T0)).toBeNull(); // already had it
    expect(await repo.getQuestFinds()).toEqual(['wisdom']);
    expect((await repo.getLog()).some((e) => e.kind === 'quest' && e.ref === 'found:wisdom')).toBe(true);

    await repo.resetAll();
    expect(await repo.getQuestFinds()).toEqual([]);
  });
});
