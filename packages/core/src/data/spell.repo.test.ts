/**
 * BRDC-SPELL-001 — casting through the repository: research yields, protection shelters.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_POOL, MANA_ANCHOR_RATE, SPELLS, cellsWithin, neighboursOf } from '@es3/core';
import type { ResourcePool } from '@es3/core';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
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
  let store: MemoryStore;
  let home: string;

  beforeEach(async () => {
    ({ repo, store, home } = await repoWith({ mana: 500 }, ['astronomy', 'fortification']));
  });

  it('casts a research spell, spends mana, and wisdom then accrues to the domain', async () => {
    const cast = await repo.castSpell('insight', null, T0);
    expect(cast).toMatchObject({ ok: true, spell: { id: 'insight' } });
    expect((await repo.getResources(T0)).mana).toBe(500 - SPELLS.insight.cost);

    // Six awake hours. The spell pays its per-hour wisdom, and since PIVOT-2026-09-09 P3
    // the Hearth's Anchor pays wisdom at its mana rate as well — both, every hour.
    const perH = SPELLS.insight.domainBonusPerH?.wisdom ?? 0;
    expect((await repo.getResources(T0 + 6 * HOUR)).wisdom).toBe(6 * (perH + MANA_ANCHOR_RATE));
  });

  it('stops counting a research spell the moment it has expired (GREEN 6)', async () => {
    await repo.castSpell('insight', null, T0);
    const perH = SPELLS.insight.domainBonusPerH?.wisdom ?? 0;
    const settled = (await repo.getResources(T0 + 6 * HOUR)).wisdom;
    expect(settled).toBe(6 * (perH + MANA_ANCHOR_RATE));

    // Insight lasts 12 h. Reading eight hours later banks those eight hours of the
    // Anchor's wisdom and *none* of the spell's — that is the whole claim, and it is
    // worth stating as the spell's own share rather than as a frozen total.
    const later = T0 + SPELLS.insight.durationMs + 2 * HOUR;
    const after = (await repo.getResources(later)).wisdom;
    expect(after - settled).toBe(8 * MANA_ANCHOR_RATE);
  });

  it('a protection spell shelters its cell from decay, and the hours outlast the spell', async () => {
    // Not the Hearth — it no longer decays at all (BRDC-HEARTH-002), so it cannot
    // show a Bulwark's slowdown. A held cell one step away does.
    const ward = neighboursOf(home)[0] as string;
    const seedWard = (s: MemoryStore) =>
      s.set(K.cell(ward), { h3: ward, ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [] });

    const bareSetup = await repoWith({ mana: 0 }, []);
    await seedWard(store);
    await seedWard(bareSetup.store);
    await repo.castSpell('bulwark', ward, T0);

    const at = T0 + GRACE + 72 * HOUR;
    const shielded = (await repo.getOwnedCells(at)).find((c) => c.h3 === ward);
    const exposed = (await bareSetup.repo.getOwnedCells(at)).find((c) => c.h3 === ward);

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

describe('the two Rites that reach past your feet (PIVOT-2026-09-09 §7)', () => {
  const ALL = ['guild-craft', 'fortification'];

  /**
   * The first free hex outward from the Hearth.
   *
   * `setHome` claims the Hearth *and its ring* (BRDC-HEARTH-002), so ring 1 is already
   * yours and Quickening rightly refuses it. Ring 2 is where the border actually is.
   */
  const firstFree = (home: string): string =>
    cellsWithin(home, 2).find((h3) => !cellsWithin(home, 1).includes(h3)) as string;

  it('Farsight puts the ground two rings out on the map, without a step', async () => {
    const { repo, store, home } = await repoWith({ mana: 500 }, ALL);
    const far = cellsWithin(home, 6)[20] as string;
    expect(await store.get(K.cell(far))).toBeUndefined();

    const out = await repo.castSpell('farsight', far, T0);
    expect(out.ok).toBe(true);
    if (!out.ok) return;

    // It reports what it actually put there, and every one of those is an unowned cell —
    // the map's neutral seen-not-held tone. Cells that were already in the store are not
    // in the list, which is the next test.
    const reached = out.reached ?? [];
    expect(reached.length).toBeGreaterThan(0);
    expect(reached.every((h3) => cellsWithin(far, SPELLS.farsight.reach ?? 0).includes(h3))).toBe(true);
    for (const h3 of reached) {
      expect((await store.get<{ ownerId: string | null }>(K.cell(h3)))?.ownerId).toBeNull();
    }
  });

  it('and never overwrites a hex that already exists — including one you hold', async () => {
    const { repo, store, home } = await repoWith({ mana: 500 }, ALL);
    const before = await store.get<{ strength: number }>(K.cell(home));

    await repo.castSpell('farsight', home, T0);
    expect(await store.get<{ strength: number }>(K.cell(home))).toEqual(before);
  });

  it('Quickening takes the free ground beside yours, and it is ground like any other', async () => {
    const { repo, home } = await repoWith({ mana: 500 }, ALL);
    const target = firstFree(home);

    const before = (await repo.getOwnedCells(T0)).length;
    expect(await repo.castSpell('quickening', target, T0)).toMatchObject({ ok: true });

    const owned = await repo.getOwnedCells(T0);
    expect(owned.length).toBeGreaterThan(before);
    expect(owned.find((c) => c.h3 === target)?.strength).toBeGreaterThan(0);
    // Written the way a step-claim writes it: the log calls it an awakening, not a spell
    // effect, because a hex taken this way is not a different kind of hex.
    const log = await repo.getLog();
    expect(log.some((e) => e.kind === 'awaken')).toBe(true);
    expect(log.some((e) => e.kind === 'spell' && e.ref === 'quickening')).toBe(true);
  });

  it('refuses ground already yours by name, rather than charging for it', async () => {
    const { repo, home } = await repoWith({ mana: 500 }, ALL);
    expect(await repo.castSpell('quickening', home, T0)).toEqual({
      ok: false,
      refused: 'already-held',
    });
    expect((await repo.getResources(T0)).mana).toBeGreaterThanOrEqual(500);
  });

  /*
   * The line this Rite must not cross. A siege takes two or three walks on separate days
   * (CLAUDE.md §11); if 120 mana could flip a held cell, that whole model would be
   * optional. Held ground is skipped in silence, whoever holds it.
   */
  it('but it will not touch ground somebody holds', async () => {
    const { repo, store, home } = await repoWith({ mana: 500 }, ALL);
    const target = firstFree(home);
    const rival = neighboursOf(target).find((h) => !cellsWithin(home, 1).includes(h)) as string;
    await store.set(K.cell(rival), {
      h3: rival,
      ownerId: 'the-pale-warden',
      strength: 300,
      lastVisitedAt: T0,
      visitDays: [],
    });

    await repo.castSpell('quickening', target, T0);
    const after = await store.get<{ ownerId: string; strength: number }>(K.cell(rival));
    expect(after?.ownerId).toBe('the-pale-warden');
    expect(after?.strength).toBe(300);
  });

  it('charges its mana — the most expensive thing a Rite costs', async () => {
    const { repo, home } = await repoWith({ mana: 500 }, ALL);
    await repo.castSpell('quickening', firstFree(home), T0);
    expect((await repo.getResources(T0)).mana).toBeLessThanOrEqual(500 - SPELLS.quickening.cost);
  });

  it('neither is stored among the running spells — they are done when they are cast', async () => {
    const { repo, home } = await repoWith({ mana: 500 }, ALL);
    await repo.castSpell('farsight', home, T0);
    await repo.castSpell('quickening', firstFree(home), T0);
    expect(await repo.getActiveSpells(T0)).toEqual([]);
  });
});

describe('the two Rites of BRDC-SPELL-002', () => {
  const TIDE = ['tide-lore'];
  const GUILD = ['guild-craft'];

  /*
   * The line the whole ticket turns on: walking and a watchtower reveal for good, magic
   * shows and forgets. Farsight writes cells; Scrying must not, or the two have merged
   * and one of them is dead weight.
   */
  it('Scrying reports what it sees and writes nothing at all', async () => {
    const { repo, store, home } = await repoWith({ mana: 500 }, TIDE);
    const far = cellsWithin(home, 9)[30] as string;
    const before = (await store.keys('cell:')).length;

    const out = await repo.castSpell('scrying', far, T0);
    expect(out.ok).toBe(true);
    if (!out.ok) return;

    expect((out.reached ?? []).length).toBeGreaterThan(0);
    // "Writes nothing" is a claim about the store, not about the report: the mock world
    // seeds neighbours, so some of what a scry sees legitimately exists already. The test
    // is that the scry added none of it — a first version asserted the reported cells were
    // absent and failed on a seeded rival, which was the test being wrong, not the Rite.
    expect((await store.keys('cell:')).length).toBe(before);
  });

  it('Scrying keeps running, so the ground it showed can go dark again', async () => {
    const { repo } = await repoWith({ mana: 500 }, TIDE);
    await repo.castSpell('scrying', cellsWithin(await repo.getHome() as string, 9)[30] as string, T0);

    expect((await repo.getActiveSpells(T0)).some((s) => s.id === 'scrying')).toBe(true);
    const after = T0 + SPELLS.scrying.durationMs + 1;
    expect((await repo.getActiveSpells(after)).some((s) => s.id === 'scrying')).toBe(false);
  });

  it('Aegis buys decay-clock time for every cell of yours in reach, not just one', async () => {
    const { repo, store, home } = await repoWith({ mana: 500 }, GUILD);
    const ring = cellsWithin(home, 1).filter((h3) => h3 !== home);

    expect(await repo.castSpell('aegis', home, T0)).toMatchObject({ ok: true });
    for (const h3 of [home, ...ring]) {
      const cell = await store.get<{ shelteredMs?: number }>(K.cell(h3));
      expect(cell?.shelteredMs ?? 0).toBeGreaterThan(0);
    }
  });

  // Ground it does not hold is none of its business — the same rule Farsight follows.
  it('Aegis leaves ground you do not hold alone', async () => {
    const { repo, store, home } = await repoWith({ mana: 500 }, GUILD);
    const outside = cellsWithin(home, 2).find((h3) => !cellsWithin(home, 1).includes(h3)) as string;

    await repo.castSpell('aegis', home, T0);
    expect(await store.get(K.cell(outside))).toBeUndefined();
  });
});
