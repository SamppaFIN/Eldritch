import { describe, expect, it } from 'vitest';
import { MemoryStore } from '../data/kv.js';
import { K } from '../data/keys.js';
import { yieldContext } from '../data/pouch.js';
import { yieldApi } from '../data/yieldStore.js';
import { EMPTY_POOL, RESOURCE_KINDS } from './terrain.js';
import { TECHS } from './tech.js';
import { cellAt, cellsWithin } from '../geo/cells.js';
import { staffKey } from './staffing.js';
import { computeHexYield, realmBonus, realmOnlyYield } from './hexYield.js';
import type { HexYield } from './hexYield.js';
import type { ResourceKind } from './terrain.js';
import type { BuildingId, Cell } from '../types/domain.js';

const NOW = Date.parse('2026-10-05T12:00:00Z');
const H = 3_600_000;
const ring = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 2);
const cell = (i: number, works: BuildingId[] = []): Cell => ({
  h3: ring[i] as string, ownerId: 'me', strength: 300, lastVisitedAt: NOW - H, visitDays: [],
  buildings: works.map((id) => ({ id, builtAt: NOW - 10 * H })),
});
const realm = (): Cell[] => [cell(0, ['monument']), cell(1, ['farm']), cell(2, ['sawmill']), cell(3, ['library']), cell(4, ['market']), cell(5, ['forge']), ...ring.slice(6).map((_, i) => cell(6 + i))];

async function store(cells: Cell[], keep: boolean) {
  const s = new MemoryStore();
  await s.set(K.home, cells[0]?.h3);
  await s.set(K.revealed, Object.fromEntries(cells.map((c) => [c.h3, NOW - 5 * H])));
  await s.set(K.worksTree, { [cells[1]?.h3 as string]: ['farm.tilled-rows'] });
  await s.set(K.researched, Object.keys(TECHS).slice(0, 6));
  await s.set(K.spells, [{ id: 'insight', castAt: NOW - H }]);
  const staff = { [staffKey(cells[1]?.h3 as string, 'farm')]: 2, [staffKey(cells[2]?.h3 as string, 'sawmill')]: 2 };
  await s.set('resources', {
    pool: { ...EMPTY_POOL }, since: NOW, sinceDay: NOW,
    ...(keep ? { keep: { level: 2, granary: { citizens: 30, box: 0 }, staff, gatesNear: 2, boons: [{ rite: 'high-water', scope: 'workers', value: 2, until: NOW + H }] } } : {}),
  });
  return s;
}

/** Σ of every hex's non-terrain lines and the realm-only lines, per resource. */
function summed(yields: HexYield[], realmOnly: { resource: ResourceKind; amount: number }[]) {
  const out: Partial<Record<ResourceKind, number>> = {};
  for (const y of yields) for (const c of y.contributions) if (!c.label.startsWith('Terrain:')) out[c.resource] = (out[c.resource] ?? 0) + c.amount;
  for (const c of realmOnly) out[c.resource] = (out[c.resource] ?? 0) + c.amount;
  return out;
}

describe('computeHexYield (BRDC-YIELD-001)', () => {
  it('a hex totals exactly its own lines', async () => {
    const cells = realm();
    const { ctx } = await yieldContext(await store(cells, true), cells, NOW);
    for (const c of cells) {
      const y = computeHexYield(c, ctx);
      for (const k of RESOURCE_KINDS) {
        const lines = y.contributions.filter((l) => l.resource === k).reduce((s, l) => s + l.amount, 0);
        expect(y.totals[k] ?? 0).toBeCloseTo(lines, 9);
      }
    }
  });

  it('Season 1: the hexes and the realm-only lines sum to exactly what the settle pays', async () => {
    const cells = realm();
    const { ctx } = await yieldContext(await store(cells, false), cells, NOW);
    const sum = summed(cells.map((c) => computeHexYield(c, ctx)), realmOnlyYield(ctx));
    const paid = realmBonus(ctx);
    for (const k of RESOURCE_KINDS) expect(sum[k] ?? 0).toBeCloseTo(paid[k] ?? 0, 9);
  });

  it('Season 2: within the rounding the realm does once, on its total', async () => {
    const cells = realm();
    const { ctx } = await yieldContext(await store(cells, true), cells, NOW);
    const sum = summed(cells.map((c) => computeHexYield(c, ctx)), realmOnlyYield(ctx));
    const paid = realmBonus(ctx);
    for (const k of RESOURCE_KINDS) expect(Math.abs((sum[k] ?? 0) - (paid[k] ?? 0))).toBeLessThan(1);
  });

  it('names what pays: the workers, the sanity of the realm, a rite', async () => {
    const cells = realm();
    const { ctx } = await yieldContext(await store(cells, true), cells, NOW);
    const farm = computeHexYield(cells[1] as Cell, ctx).contributions.map((c) => `${c.source}:${c.label}`);
    expect(farm).toContain('citizen:Farmstead · 2 workers');
    expect(farm).toContain('other:Sanity');
    expect(farm).toContain('other:Rite: High Water');
  });

  it('the repository answers for your own hex only', async () => {
    const cells = realm();
    const s = await store(cells, true);
    const api = yieldApi(() => s, async () => cells);
    expect(await api.at(cells[1]?.h3 as string, NOW)).not.toBeNull();
    expect(await api.at(cellAt({ lat: 60.17, lng: 24.94 }), NOW)).toBeNull();
    expect(Object.keys(await api.all(NOW))).toHaveLength(cells.length);
  });
});

describe('the Librarian (BRDC-INVEST-001)', () => {
  async function librarian(cells: Cell[], keep: boolean) {
    const s = await store(cells, keep);
    await s.set(K.investigator, { stamina: 7, sanity: 6, clues: 0, skills: { lore: 4, will: 2, fight: 2, observe: 2 }, restedAt: NOW, archetype: 'librarian' });
    return s;
  }

  it('the settle pays a fifth more wisdom, and nothing more of anything else', async () => {
    const cells = realm();
    const plain = realmBonus((await yieldContext(await store(cells, false), cells, NOW)).ctx);
    const read = realmBonus((await yieldContext(await librarian(cells, false), cells, NOW)).ctx);
    expect(plain.wisdom ?? 0).toBeGreaterThan(0);
    expect(read.wisdom).toBeCloseTo((plain.wisdom as number) * 1.2, 9);
    for (const k of RESOURCE_KINDS) if (k !== 'wisdom') expect(read[k] ?? 0).toBe(plain[k] ?? 0);
  });

  it('the hex cards say so on a line of its own, and still sum to the settle', async () => {
    const cells = realm();
    const { ctx } = await yieldContext(await librarian(cells, false), cells, NOW);
    const yields = cells.map((c) => computeHexYield(c, ctx));
    expect(yields.some((y) => y.contributions.some((c) => c.label === 'Librarian'))).toBe(true);
    const sum = summed(yields, realmOnlyYield(ctx));
    const paid = realmBonus(ctx);
    for (const k of RESOURCE_KINDS) expect(sum[k] ?? 0).toBeCloseTo(paid[k] ?? 0, 9);
  });
});
