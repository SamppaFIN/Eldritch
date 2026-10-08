/** BRDC-CHOIR-001 — the Drowned Choir: its cards, its tale, and the Reckoning's flood. */
import { describe, expect, it } from 'vitest';
import { CHOIR_CARDS, CHOIR_FINALE, floodsAt, isFlooded } from './choir.js';
import { rumourAt, cardById } from './deck.js';
import { terrainForCell } from './terrain.js';
import { RESOURCE_KINDS } from './terrain.js';
import type { ResourceKind } from './terrain.js';
import { computeHexYield, realmBonus, realmOnlyYield } from './hexYield.js';
import { MemoryStore } from '../data/kv.js';
import { K } from '../data/keys.js';
import { yieldContext } from '../data/pouch.js';
import { taskApi } from '../data/taskStore.js';
import { cellAt, cellsWithin } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';

const NOW = Date.parse('2026-10-08T12:00:00Z');
const H = 3_600_000;
// Around the statue, wide enough to reach the shore: some of it lake or coast, some not.
const disk = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 30);
const cell = (h3: string): Cell => ({ h3, ownerId: 'me', strength: 100, lastVisitedAt: NOW - H, visitDays: [] });
const wet = disk.filter((h) => floodsAt(terrainForCell(cell(h)).kind));
const dry = disk.filter((h) => !floodsAt(terrainForCell(cell(h)).kind));

describe('the Choir’s cards', () => {
  it('are dealt on lake ground only, about one rumour in four there', () => {
    const hexes = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 25);
    const lake = hexes.map((h) => rumourAt('s3', h, 'lake')).filter((c) => c !== null);
    const share = lake.filter((c) => c.id.startsWith('lake:choir-')).length / lake.length;
    expect(share).toBeGreaterThan(0.12);
    expect(share).toBeLessThan(0.38);
    expect(hexes.map((h) => rumourAt('s3', h, 'forest')).some((c) => c?.id.startsWith('lake:choir-'))).toBe(false);
    expect(cardById(CHOIR_CARDS[0]?.id as string)).toBe(CHOIR_CARDS[0]);
  });
});

describe('the flood', () => {
  it('comes only in the Reckoning, and only until the tale is done', () => {
    expect(isFlooded('reckoning', false)).toBe(true);
    expect(isFlooded('reckoning', true)).toBe(false);
    expect(isFlooded('open', false)).toBe(false);
    expect(isFlooded(undefined, false)).toBe(false);
  });

  it('halves a lake or coast hex on its card, leaves dry ground alone, and the settle agrees', async () => {
    expect(wet.length).toBeGreaterThan(0);
    expect(dry.length).toBeGreaterThan(0);
    const owned = [...wet.slice(0, 3), ...dry.slice(0, 3)].map(cell);
    const s = new MemoryStore();
    await s.set(K.mythos, { seed: 's3', opensAt: NOW - 30 * 24 * H, phase: 'reckoning' });
    const ctx = (await yieldContext(s, owned, NOW)).ctx;
    expect(ctx.flooded).toBe(true);
    const lake = computeHexYield(owned[0] as Cell, ctx);
    const before = lake.contributions.filter((c) => c.label !== 'Flooded');
    for (const k of RESOURCE_KINDS) {
      const was = before.filter((c) => c.resource === k).reduce((n, c) => n + c.amount, 0);
      if (was > 0) expect(lake.totals[k]).toBeCloseTo(was / 2, 9);
    }
    expect(computeHexYield(owned[3] as Cell, ctx).contributions.some((c) => c.label === 'Flooded')).toBe(false);
    // Card and settle: Σ of the non-terrain lines is what the settle adds to the trickle.
    const sum: Partial<Record<ResourceKind, number>> = {};
    for (const c of [...owned.flatMap((x) => computeHexYield(x, ctx).contributions), ...realmOnlyYield(ctx)]) {
      if (!c.label.startsWith('Terrain:')) sum[c.resource] = (sum[c.resource] ?? 0) + c.amount;
    }
    for (const k of RESOURCE_KINDS) expect(sum[k] ?? 0).toBeCloseTo(realmBonus(ctx)[k] ?? 0, 9);
  });

  it('the tale hangs on the Tavern board a step at a time, and finishing it ends the flood', async () => {
    const s = new MemoryStore();
    const owned = wet.slice(0, 1).map(cell);
    const tasks = taskApi(() => s, async () => owned, async () => [], async () => undefined);
    const board = (await tasks.board(NOW)).map((v) => v.task.id);
    expect(board).toContain('choir-1-listen');
    expect(board).not.toContain('choir-2-study');
    await s.set(K.mythos, { seed: 's3', opensAt: NOW - 30 * 24 * H, phase: 'reckoning' });
    await s.set(K.tasks, { taken: {}, outcomes: { [CHOIR_FINALE]: { status: 'completed' } } });
    expect((await yieldContext(s, owned, NOW)).ctx.flooded).toBe(false);
  });
});
