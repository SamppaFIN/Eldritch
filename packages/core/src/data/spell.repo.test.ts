/**
 * BRDC-SPELL-001 — casting through the repository: research yields, protection shelters.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_POOL, SPELLS } from '@es3/core';
import type { ResourcePool } from '@es3/core';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-09-01T12:00:00Z');
const HOUR = 3_600_000;
const GRACE = 48 * HOUR;

async function repoWith(pool: Partial<ResourcePool>, researched: string[]) {
  const store = new MemoryStore();
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  await store.set('resources', { pool: { ...EMPTY_POOL, ...pool }, since: T0, sinceDay: T0 });
  await store.set('researched', researched);
  const repo = new MockRepository({ store, newId: () => 'me', seed: 3 });
  const home = await repo.setHome(ORIGIN, T0);
  return { repo, store, home };
}

describe('spells through the repository', () => {
  let repo: MockRepository;
  let home: string;

  beforeEach(async () => {
    ({ repo, home } = await repoWith({ mana: 500 }, ['astronomy', 'fortification']));
  });

  it('casts a research spell, spends mana, and wisdom then accrues to the domain', async () => {
    const cast = await repo.castSpell('insight', null, T0);
    expect(cast).toMatchObject({ ok: true, spell: { id: 'insight' } });
    expect((await repo.getResources(T0)).mana).toBe(500 - SPELLS.insight.cost);

    // Six awake hours under the spell: six times the per-hour wisdom.
    const perH = SPELLS.insight.domainBonusPerH?.wisdom ?? 0;
    expect((await repo.getResources(T0 + 6 * HOUR)).wisdom).toBe(6 * perH);
  });

  it('stops counting a research spell the moment it has expired (GREEN 6)', async () => {
    await repo.castSpell('insight', null, T0);
    const perH = SPELLS.insight.domainBonusPerH?.wisdom ?? 0;
    const settled = (await repo.getResources(T0 + 6 * HOUR)).wisdom;

    // Insight lasts 12 h; a read past that adds nothing for the hours since.
    const later = T0 + SPELLS.insight.durationMs + 2 * HOUR;
    expect((await repo.getResources(later)).wisdom).toBe(settled);
    expect(settled).toBe(6 * perH);
  });

  it('a protection spell shelters its cell from decay, and the hours outlast the spell', async () => {
    const bare = (await repoWith({ mana: 0 }, [])).repo;
    await repo.castSpell('bulwark', home, T0);

    const at = T0 + GRACE + 72 * HOUR;
    const shielded = (await repo.getOwnedCells(at)).find((c) => c.h3 === home);
    const exposed = (await bare.getOwnedCells(at)).find((c) => c.h3 === home);

    expect(shielded && exposed).toBeTruthy();
    expect((shielded as { strength: number }).strength).toBeGreaterThan(
      (exposed as { strength: number }).strength,
    );
  });

  it('lists running spells with a countdown, and drops them when done', async () => {
    await repo.castSpell('insight', null, T0);
    expect(await repo.getActiveSpells(T0 + HOUR)).toHaveLength(1);
    expect(await repo.getActiveSpells(T0 + SPELLS.insight.durationMs)).toHaveLength(0);
  });

  it('sends the enemy-facing schools back to wait for a Wager', async () => {
    expect(await repo.castSpell('snare', home, T0)).toEqual({
      ok: false,
      refused: 'carry-in-a-wager',
    });
  });

  it('refuses a spell whose tech is not researched', async () => {
    const { repo: unlearned } = await repoWith({ mana: 500 }, []);
    expect(await unlearned.castSpell('insight', null, T0)).toEqual({ ok: false, refused: 'locked' });
  });
});
