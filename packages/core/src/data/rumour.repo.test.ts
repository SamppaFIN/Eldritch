import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { rumourApi } from './deckStore.js';
import { keepApi } from './citizenStore.js';
import { settlePouch } from './pouch.js';
import { K } from './keys.js';
import { cellAt, cellsWithin } from '../geo/cells.js';
import { rumourAt } from '../rules/deck.js';
import { terrainOf } from '../rules/terrain.js';

const T0 = Date.parse('2026-10-01T12:00:00Z');
const faces = (...f: number[]) => {
  let i = 0;
  return () => ((f[i++ % f.length] as number) - 1) / 6 + 0.01;
};
const hexes = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 10);
const withRumour = hexes.find((h) => rumourAt('s2', h, terrainOf(h).kind)) as string;

async function realm() {
  const store = new MemoryStore();
  const rumours = rumourApi(() => store, async () => []);
  await keepApi(() => store, async () => []).found(T0);
  return { store, rumours };
}

describe('rumourApi (BRDC-DOOM-003)', () => {
  it('is absent on a Season 1 save and on a hex without one', async () => {
    const store = new MemoryStore();
    expect(await rumourApi(() => store, async () => []).at(withRumour, 's2', T0)).toBeNull();
    const { rumours } = await realm();
    const bare = hexes.find((h) => !rumourAt('s2', h, terrainOf(h).kind)) as string;
    expect(await rumours.at(bare, 's2', T0)).toBeNull();
  });

  it('is faced standing on it, once: a pass pays and the rumour is spent', async () => {
    const { store, rumours } = await realm();
    const view = await rumours.at(withRumour, 's2', T0);
    expect(view?.card).toBeDefined();
    expect(await rumours.face(withRumour, null, 's2', T0)).toEqual({ ok: false, refused: 'not-there' });
    const r = await rumours.face(withRumour, withRumour, 's2', T0, faces(6, 6, 6, 6, 6, 6, 6));
    expect(r).toMatchObject({ ok: true, roll: { pass: true } });
    const done = await rumours.accept(T0);
    expect(done).toMatchObject({ ok: true, said: view?.card.pass.text });
    expect(await rumours.at(withRumour, 's2', T0)).toBeNull();
    const inv = await store.get<{ stamina: number; clues: number; skills: Record<string, number> }>(K.investigator);
    expect(inv?.stamina).toBe(6);
    const card = view?.card;
    if (card?.pass.clues) expect(inv?.clues).toBe(card.pass.clues);
    if (card?.pass.skillUp) expect(inv?.skills[card.pass.skillUp]).toBeGreaterThan(2);
    if (card?.pass.gain) {
      const [k, v] = Object.entries(card.pass.gain)[0] as [string, number];
      expect((await settlePouch(store, [], T0)).pool[k as 'food']).toBeGreaterThanOrEqual(v);
    }
  });

  it('a fail costs what the card says', async () => {
    const { store, rumours } = await realm();
    const card = (await rumours.at(withRumour, 's2', T0))?.card;
    await rumours.face(withRumour, withRumour, 's2', T0, faces(1, 1, 1, 1, 1, 1, 1));
    expect(await rumours.accept(T0)).toMatchObject({ ok: true, said: card?.fail.text });
    const inv = await store.get<{ stamina: number; sanity: number }>(K.investigator);
    expect(inv?.stamina).toBe(7 - 1 - (card?.fail.stamina ?? 0));
    expect(inv?.sanity).toBe(6 - (card?.fail.sanity ?? 0));
  });
});
