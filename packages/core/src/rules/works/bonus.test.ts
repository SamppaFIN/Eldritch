import { describe, expect, it } from 'vitest';
import { gridDisk, latLngToCell } from 'h3-js';
import { BUILDINGS } from '../build.js';
import { terrainForCell } from '../terrain.js';
import type { Cell } from '../../types/domain.js';
import { worksBonus, worksCapBonus } from './bonus.js';
import type { KindAt } from './bonus.js';

const NOW = Date.UTC(2026, 8, 24, 12);
const CENTRE = latLngToCell(61.4729, 23.7259, 11);

function held(h3: string, extra: Partial<Cell> = {}): Cell {
  return {
    h3,
    ownerId: 'me',
    strength: 100,
    claimedAt: NOW,
    lastVisitedAt: NOW,
    lastReinforcedAt: NOW,
    ...extra,
  } as Cell;
}

const onlyCentre = (kind: ReturnType<KindAt>): KindAt => (c) => (c.h3 === CENTRE ? kind : null);

describe('worksBonus (BRDC-WORKS-002)', () => {
  it('nothing learned, no ring meaning: pays nothing', () => {
    expect(worksBonus([held(CENTRE)], {}, onlyCentre('forge'), NOW)).toEqual({});
  });

  it('a learned produce pays per hour', () => {
    const b = worksBonus([held(CENTRE)], { [CENTRE]: ['forge.hot-hearth'] }, onlyCentre('forge'), NOW);
    expect(b.iron).toBe(2);
  });

  it('a dormant cell earns nothing from its research', () => {
    const cold = held(CENTRE, { lastVisitedAt: NOW - 30 * 86_400_000 });
    expect(worksBonus([cold], { [CENTRE]: ['forge.hot-hearth'] }, onlyCentre('forge'), NOW)).toEqual({});
  });

  it('the Farmstead harvest counts plain cells held in the ring', () => {
    const ring = gridDisk(CENTRE, 1).filter((h) => h !== CENTRE);
    const cells = [held(CENTRE), ...ring.map((h) => held(h))];
    const plains = ring.filter((h) => terrainForCell(held(h)).kind === 'plain').length;
    const b = worksBonus(cells, {}, onlyCentre('farm'), NOW);
    expect(b.food ?? 0).toBe(plains);
  });

  it('the Keep council pays per province', () => {
    const b = worksBonus([held(CENTRE)], { [CENTRE]: ['keep.warded-walls', 'keep.council'] }, onlyCentre('keep'), NOW);
    expect(b.wisdom).toBe(2);
  });

  it('a conversion takes from one and pays the other', () => {
    const learned = ['farm.tilled-rows', 'farm.granary-loft', 'farm.rotation', 'farm.mill-wheel'];
    const b = worksBonus([held(CENTRE)], { [CENTRE]: learned }, onlyCentre('farm'), NOW);
    expect(b.gold).toBe(2);
    expect(b.food).toBe(2 - 10);
  });

  it('Star-Metal pays mana for the forge’s own iron, base included', () => {
    const learned = ['forge.hot-hearth', 'forge.star-metal'];
    const b = worksBonus([held(CENTRE)], { [CENTRE]: learned }, onlyCentre('forge'), NOW);
    expect(b.mana).toBe((BUILDINGS.forge.produces?.iron ?? 0) + 2);
  });

  it('Charcoal Pits raise every forge by a fifth', () => {
    const other = gridDisk(CENTRE, 3).find((h) => h !== CENTRE)!;
    const kindAt: KindAt = (c) => (c.h3 === CENTRE ? 'forge' : c.h3 === other ? 'sawmill' : null);
    const trees = { [CENTRE]: ['forge.hot-hearth'], [other]: ['sawmill.iron-teeth', 'sawmill.log-flume', 'sawmill.charcoal-pits'] };
    const b = worksBonus([held(CENTRE), held(other)], trees, kindAt, NOW);
    const forgeIron = (BUILDINGS.forge.produces?.iron ?? 0) + 2;
    expect(b.iron).toBe(2 + Math.floor((forgeIron * 20) / 100));
  });
});

describe('worksCapBonus', () => {
  it('raises only the resource it names, dormant or not', () => {
    const cold = held(CENTRE, { lastVisitedAt: NOW - 30 * 86_400_000 });
    expect(worksCapBonus([cold], { [CENTRE]: ['farm.tilled-rows', 'farm.granary-loft'] }, onlyCentre('farm'))).toEqual({ food: 200 });
  });
});

describe('a negative rate never takes the pouch below zero', () => {
  it('After-Dark Stalls on an empty larder', async () => {
    const { EMPTY_POOL, settleResources } = await import('../terrain.js');
    const state = { pool: { ...EMPTY_POOL }, since: NOW, sinceDay: NOW };
    const out = settleResources(state, [], NOW + 3 * 3_600_000, 500, { culture: 2, food: -1 });
    expect(out.pool.food).toBe(0);
    expect(out.pool.culture).toBe(6);
  });

  it('a per-resource ceiling holds each resource at its own cap', async () => {
    const { EMPTY_POOL, RESOURCE_KINDS, settleResources } = await import('../terrain.js');
    const cap = Object.fromEntries(RESOURCE_KINDS.map((k) => [k, k === 'gold' ? 1_000 : 500])) as Record<(typeof RESOURCE_KINDS)[number], number>;
    const state = { pool: { ...EMPTY_POOL, gold: 990, food: 495 }, since: NOW, sinceDay: NOW };
    const out = settleResources(state, [], NOW + 3_600_000, cap, { gold: 50, food: 50 });
    expect(out.pool.gold).toBe(1_000);
    expect(out.pool.food).toBe(500);
  });
});
