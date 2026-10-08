/** BRDC-AGE-001 — the week in the store: turned over on first look, a golden boon chosen once, the settle scaled. */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { weekApi } from './ageStore.js';
import { forecastRates } from './pouch.js';
import { EMPTY_COUNTS, legacyOf } from '../rules/legacy.js';
import { weekKey } from '../rules/age.js';
import { cellAt, cellsWithin } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';

const MON = Date.parse('2026-10-05T08:00:00Z');
const WEEK = 7 * 86_400_000;
const cells: Cell[] = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 1).map((h3) => ({ h3, ownerId: 'me', strength: 100, lastVisitedAt: MON, visitDays: [] }));

function api(store: MemoryStore, subtotal: { v: number }) {
  return weekApi(() => store, async () => cells, async () => legacyOf({ ...EMPTY_COUNTS, cells: subtotal.v / 2 }, undefined));
}

describe('weekApi', () => {
  it('judges the week on its first look, and offers a golden week’s boons once', async () => {
    const store = new MemoryStore();
    const legacy = { v: 0 };
    const weeks = api(store, legacy);
    expect((await weeks.view(MON)).kind).toBe('plain');
    legacy.v = 100;
    await weeks.view(MON + WEEK);
    legacy.v = 300;
    const golden = await weeks.view(MON + 2 * WEEK);
    expect(golden).toMatchObject({ kind: 'golden', name: 'A golden week', boon: null });
    expect(golden.choices.map((c) => c.id)).toEqual(['tithe', 'harvest', 'vision']);
    expect(await weeks.chooseBoon('harvest', MON + 2 * WEEK)).toEqual({ ok: true });
    expect(await weeks.chooseBoon('tithe', MON + 2 * WEEK)).toEqual({ ok: false, refused: 'chosen' });
    expect((await weeks.view(MON + 2 * WEEK)).boon).toEqual({ id: 'harvest', name: 'Long Harvest' });
  });

  it('refuses a boon outside a golden week', async () => {
    const store = new MemoryStore();
    expect(await api(store, { v: 0 }).chooseBoon('tithe', MON)).toEqual({ ok: false, refused: 'not-golden' });
  });

  it('a golden week makes a tenth more, a dark week a tenth less', async () => {
    const rate = async (kind?: 'golden' | 'dark') => {
      const store = new MemoryStore();
      if (kind) await store.set(K.week, { week: weekKey(MON), kind, marks: {} });
      // A day, not an hour: the settle pays whole units, and 8 × 1.1 is still 8.
      return (await forecastRates(store, cells, MON)).perDay;
    };
    const plain = await rate();
    const [kind, amount] = Object.entries(plain).find(([, v]) => (v ?? 0) > 0) as [keyof typeof plain, number];
    const near = (v: number | undefined, want: number) => expect(Math.abs((v ?? 0) - want)).toBeLessThanOrEqual(1);
    near((await rate('golden'))[kind], amount * 1.1);
    near((await rate('dark'))[kind], amount * 0.9);
  });
});
