/** BRDC-MASKS-001 — the stranger's masks: dealt among the rumours, met, named, and dealt with. */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { maskApi, noteMask } from './maskStore.js';
import { MASK_CARDS, MASK_TELL, isMask } from '../rules/masks.js';
import { rumourAt, cardById } from '../rules/deck.js';
import { FIRST_INVESTIGATOR } from '../rules/investigator.js';
import type { Investigator } from '../rules/investigator.js';
import { hasCondition } from '../rules/condition.js';
import { cellAt, cellsWithin } from '../geo/cells.js';

const T0 = Date.parse('2026-10-08T12:00:00Z');

describe('the masks among the rumours', () => {
  it('six masks, each with the same tell', () => {
    expect(MASK_CARDS).toHaveLength(6);
    for (const c of MASK_CARDS) expect(c.text).toContain(MASK_TELL);
  });
  it('are dealt on about one rumour in five, and found by id like any card', () => {
    const hexes = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 25);
    const rumours = hexes.map((h) => rumourAt('s3', h, 'lake')).filter((c) => c !== null);
    const share = rumours.filter((c) => isMask(c.id)).length / rumours.length;
    expect(share).toBeGreaterThan(0.1);
    expect(share).toBeLessThan(0.32);
    expect(cardById('lake:mask-fisherman')?.mask).toBe('the fisherman');
  });
});

describe('naming the stranger', () => {
  async function metThree() {
    const store = new MemoryStore();
    await store.set(K.investigator, FIRST_INVESTIGATOR(T0));
    await noteMask(store, 'forest:the-path-back'); // not a mask
    for (const c of MASK_CARDS.slice(0, 3)) await noteMask(store, c.id);
    await noteMask(store, MASK_CARDS[0]?.id as string); // met twice counts once
    return store;
  }

  it('is offered once three masks are met, and not before', async () => {
    const store = new MemoryStore();
    await noteMask(store, MASK_CARDS[0]?.id as string);
    expect((await maskApi(() => store).view(T0)).names).toHaveLength(0);
    expect(await maskApi(() => store).name('nyarlathotep', T0)).toEqual({ ok: false, refused: 'not-yet' });
    const three = await metThree();
    const v = await maskApi(() => three).view(T0);
    expect(v.met).toEqual(['the woodcutter', 'the fisherman', 'the preacher']);
    expect(v.names).toHaveLength(3);
  });

  it('a wrong name costs sanity; the true one opens a choice, made once', async () => {
    const store = await metThree();
    const masks = maskApi(() => store);
    expect(await masks.name('the-ferryman', T0)).toMatchObject({ ok: true });
    expect((await store.get<Investigator>(K.investigator))?.sanity).toBe(FIRST_INVESTIGATOR(T0).sanity - 2);
    expect(await masks.name('nyarlathotep', T0)).toMatchObject({ ok: true });
    expect((await masks.view(T0)).choices.map((c) => c.id)).toEqual(['bargain', 'banish']);
    expect(await masks.choose('bargain', T0)).toMatchObject({ ok: true });
    const inv = (await store.get<Investigator>(K.investigator)) as Investigator;
    expect(inv.clues).toBe(FIRST_INVESTIGATOR(T0).clues + 3);
    expect(hasCondition(inv, 'dark-pact', T0)).toBe(true);
    expect(await masks.choose('banish', T0)).toEqual({ ok: false, refused: 'chosen' });
    expect(await masks.name('nyarlathotep', T0)).toEqual({ ok: false, refused: 'named' });
  });
});
