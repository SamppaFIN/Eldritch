/** BRDC-SUZERAIN-001 — a village's tasks in the store make a suzerain, and the suzerain is paid. */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { suzerainApi } from './suzerainStore.js';
import { taskApi } from './taskStore.js';
import { yieldContext } from './pouch.js';
import { realmBonus, realmOnlyYield } from '../rules/hexYield.js';
import { cellAt, cellsWithin } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-08T12:00:00Z');
const cells: Cell[] = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 2).map((h3) => ({ h3, ownerId: 'me', strength: 100, lastVisitedAt: T0 + 1, visitDays: [] }));

describe('the village in the store', () => {
  it('a village task done sends envoys; three make you suzerain, alone or against the world', async () => {
    const store = new MemoryStore();
    const tasks = taskApi(() => store, async () => cells, async () => [], async () => undefined);
    expect((await tasks.village('harmala-fishers', T0)).map((v) => v.task.id)).toEqual(['fishers-driftwood', 'fishers-farm']);
    await tasks.take('fishers-driftwood', T0);
    expect(await tasks.finish('fishers-driftwood', T0 + 2)).toMatchObject({ ok: true });

    const suz = suzerainApi(() => store);
    expect(await suz.envoys()).toEqual({ 'harmala-fishers': 1 });
    expect(await suz.standing('harmala-fishers', 'me', null)).toEqual({ mine: 1, need: 3, leader: null });

    await store.set(K.tasks, { taken: {}, outcomes: { 'fishers-driftwood': { status: 'completed' }, 'fishers-eel': { status: 'completed' } } });
    expect(await suz.standing('harmala-fishers', 'me', null)).toMatchObject({ mine: 3, leader: 'you' });
    expect(await store.get(K.suzerain)).toEqual(['harmala-fishers']);

    const ctx = (await yieldContext(store, cells, T0)).ctx;
    expect(realmOnlyYield(ctx)).toContainEqual({ resource: 'food', amount: 4, source: 'other', label: 'Suzerain: Härmälänranta', sourceId: 'harmala-fishers' });
    expect((realmBonus(ctx).food ?? 0) - (realmBonus({ ...ctx, suzerain: [] }).food ?? 0)).toBe(4);

    // Another realm with more envoys takes the village, and the speciality goes with it.
    const rival = [{ playerId: 'rival', name: 'The Pale Warden', envoys: { 'harmala-fishers': 4 } }];
    expect(await suz.standing('harmala-fishers', 'me', rival)).toMatchObject({ leader: 'The Pale Warden' });
    expect(await store.get(K.suzerain)).toEqual([]);
  });
});
