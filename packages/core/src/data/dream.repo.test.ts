/** BRDC-DREAM-001 — the dream in the store: drawn at the waking, once a day, faced once on Will. */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { dreamApi, noteWaking } from './dreamStore.js';
import { recordWalk } from './walkWriter.js';
import { EMPTY_POOL } from '../rules/terrain.js';
import { FIRST_INVESTIGATOR } from '../rules/investigator.js';
import type { Investigator } from '../rules/investigator.js';
import { cellAt } from '../geo/cells.js';

const HOME = cellAt({ lat: 61.4729, lng: 23.7258 });
// Local times: the condition reads the walker's own clock.
const NIGHT = new Date(2026, 9, 7, 23, 0).getTime();
const MORNING = new Date(2026, 9, 8, 7, 30).getTime();

async function realm() {
  const store = new MemoryStore();
  await store.set('resources', { pool: { ...EMPTY_POOL }, since: MORNING, sinceDay: MORNING, keep: { level: 1, granary: { citizens: 1, box: 0 } } });
  return store;
}

describe('noteWaking', () => {
  it('draws one dream a day, and only for a realm with a Keep', async () => {
    const store = await realm();
    await noteWaking(store, { h3: HOME, t: NIGHT }, { h3: HOME, t: MORNING });
    const first = await store.get<{ day: string; cardId: string }>(K.dream);
    expect(first?.day).toBe('2026-10-08');
    await store.set(K.dream, { ...first, cardId: 'kept' });
    await noteWaking(store, { h3: HOME, t: MORNING }, { h3: HOME, t: MORNING + 7 * 3_600_000 });
    expect((await store.get<{ cardId: string }>(K.dream))?.cardId).toBe('kept');

    const s1 = new MemoryStore();
    await noteWaking(s1, { h3: HOME, t: NIGHT }, { h3: HOME, t: MORNING });
    expect(await s1.get(K.dream)).toBeUndefined();
  });
});

describe('dreamApi', () => {
  it('a passed dream pays and is sealed; it cannot be faced twice', async () => {
    const store = await realm();
    await noteWaking(store, { h3: HOME, t: NIGHT }, { h3: HOME, t: MORNING });
    const api = dreamApi(() => store);
    const view = await api.waiting(MORNING);
    expect(view?.outcome).toBeNull();
    const r = await api.face(MORNING, () => 0.99);
    expect(r).toMatchObject({ ok: true, pass: true, text: view?.card.pass.text });
    expect(await api.face(MORNING, () => 0.99)).toEqual({ ok: false, refused: 'faced' });
    expect((await api.waiting(MORNING))?.outcome?.pass).toBe(true);
  });

  it('a failed dream costs sanity', async () => {
    const store = await realm();
    await store.set(K.investigator, FIRST_INVESTIGATOR(MORNING));
    await noteWaking(store, { h3: HOME, t: NIGHT }, { h3: HOME, t: MORNING });
    const api = dreamApi(() => store);
    const card = (await api.waiting(MORNING))?.card;
    const r = await api.face(MORNING, () => 0);
    expect(r).toMatchObject({ ok: true, pass: false });
    const inv = await store.get<Investigator>(K.investigator);
    expect(inv?.sanity).toBe(FIRST_INVESTIGATOR(MORNING).sanity - (card?.fail.sanity ?? 0));
  });

  it('yesterday’s dream is not today’s', async () => {
    const store = await realm();
    await noteWaking(store, { h3: HOME, t: NIGHT }, { h3: HOME, t: MORNING });
    expect(await dreamApi(() => store).waiting(MORNING + 24 * 3_600_000)).toBeNull();
  });
});

describe('the walk writer notes the waking', () => {
  it('a morning batch after a still night draws the dream', async () => {
    const store = await realm();
    await store.set(K.lastReading, { h3: HOME, t: NIGHT });
    const here = { lat: 61.4729, lng: 23.7258, accuracy: 5 };
    await recordWalk(store, [{ ...here, t: MORNING }, { ...here, t: MORNING + 10_000 }], { id: 'me', level: 1, hasTerritory: true });
    expect((await store.get<{ day: string }>(K.dream))?.day).toBe('2026-10-08');
  });
});
