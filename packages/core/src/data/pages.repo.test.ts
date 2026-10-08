/** BRDC-PAGES-001 — pages found on the ground and read into the rite book. */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { findPage, pageApi } from './pageStore.js';
import { pageFoundAt } from '../rules/pages.js';
import { FIRST_INVESTIGATOR } from '../rules/investigator.js';
import type { Investigator } from '../rules/investigator.js';
import type { RiteBook } from '../rules/rites.js';
import { cellAt, cellsWithin } from '../geo/cells.js';

const T0 = Date.parse('2026-10-08T12:00:00Z');
const hexes = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 6);
const lucky = hexes.filter(pageFoundAt);
const unlucky = hexes.find((h) => !pageFoundAt(h)) as string;

describe('the Book in the store', () => {
  it('finds pages in order where the ground turns them up, and nowhere else', async () => {
    const store = new MemoryStore();
    expect(await findPage(store, unlucky, T0)).toBeNull();
    expect((await findPage(store, lucky[0] as string, T0))?.id).toBe('p1');
    expect((await findPage(store, lucky[1] as string, T0))?.id).toBe('p2');
    const view = await pageApi(() => store).view(T0);
    expect(view.pages.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(view.missing).toBe(8);
  });

  it('a page read teaches its rite and takes sanity for good; it is read once', async () => {
    const store = new MemoryStore();
    await store.set(K.investigator, FIRST_INVESTIGATOR(T0));
    await findPage(store, lucky[0] as string, T0);
    const pages = pageApi(() => store);
    expect(await pages.read('p2', T0)).toEqual({ ok: false, refused: 'not-found' });
    expect(await pages.read('p1', T0)).toEqual({ ok: true, said: 'Salt Circle is yours, without a temple.' });
    expect((await store.get<RiteBook>(K.rites))?.learned['salt-circle']).toBe(1);
    expect(await store.get<Investigator>(K.investigator)).toMatchObject({ pagesRead: 1, sanity: 5 });
    expect(await pages.read('p1', T0)).toEqual({ ok: false, refused: 'read' });
    expect((await pages.view(T0)).sanityCap).toBe(5);
  });

  it('a mind that holds five refuses a sixth', async () => {
    const store = new MemoryStore();
    await store.set(K.investigator, { ...FIRST_INVESTIGATOR(T0), pagesRead: 5, sanity: 1 });
    await findPage(store, lucky[0] as string, T0);
    expect(await pageApi(() => store).read('p1', T0)).toEqual({ ok: false, refused: 'mind-full' });
  });
});
