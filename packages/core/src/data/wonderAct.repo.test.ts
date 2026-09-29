import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { wonderActApi } from './wonderActStore.js';
import { gateApi } from './gateStore.js';
import { reckoningApi } from './reckoningStore.js';
import { keepApi } from './citizenStore.js';
import { settlePouch } from './pouch.js';
import { K } from './keys.js';
import { cellAt } from '../geo/cells.js';
import { WONDER_ACTS, WONDER_ACT_COOLDOWN_MS } from '../rules/wonderActs.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-01T12:00:00Z');
const AT = cellAt({ lat: 61.4729, lng: 23.7258 });

async function realm(found: string | null, own: boolean) {
  const store = new MemoryStore();
  const mine: Cell[] = own ? [{ h3: AT, ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [] }] : [];
  const owned = async () => mine;
  if (found) await store.set(K.wonderFinds, { [found]: { h3: AT, at: T0 } });
  await keepApi(() => store, owned).found(T0);
  const acts = wonderActApi(() => store, owned, () => gateApi(() => store, owned), () => reckoningApi(() => store, owned));
  return { store, acts };
}

describe('wonder actions (BRDC-SEASON-008)', () => {
  it('stand where the realm found the wonder, and nowhere else', async () => {
    expect(await (await realm(null, true)).acts.at(AT, T0)).toBeNull();
    expect((await (await realm('innsmouth', true)).acts.at(AT, T0))?.id).toBe('innsmouth');
  });

  it('once a day, only for whoever holds the hex', async () => {
    expect(await (await realm('innsmouth', false)).acts.use(AT, T0, false)).toEqual({ ok: false, refused: 'not-yours' });
    const { store, acts } = await realm('innsmouth', true);
    expect(await acts.use(AT, T0, false)).toEqual({ ok: true, said: WONDER_ACTS.innsmouth?.text });
    expect((await settlePouch(store, [], T0)).pool.food).toBeGreaterThanOrEqual(60);
    expect(await acts.use(AT, T0 + 1_000, false)).toEqual({ ok: false, refused: 'resting' });
    expect((await acts.at(AT, T0))?.readyAt).toBe(T0 + WONDER_ACT_COOLDOWN_MS);
    expect((await acts.use(AT, T0 + WONDER_ACT_COOLDOWN_MS, false)).ok).toBe(true);
  });

  it('the Dunwich Stones answer only in the Reckoning', async () => {
    const { acts } = await realm('dunwich-stones', true);
    expect(await acts.use(AT, T0, false)).toEqual({ ok: false, refused: 'not-now' });
    expect((await acts.use(AT, T0, true)).ok).toBe(true);
  });

  it('The Temple calms the realm for a day', async () => {
    const { store, acts } = await realm('the-temple', true);
    await acts.use(AT, T0, false);
    expect((await store.get<{ keep: { calm?: { value: number } } }>('resources'))?.keep.calm?.value).toBe(3);
  });
});
