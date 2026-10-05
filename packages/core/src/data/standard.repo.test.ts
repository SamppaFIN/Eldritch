import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { standardApi } from './standardStore.js';
import { cellAt, neighboursOf } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-05T12:00:00Z');
const MINE = cellAt({ lat: 61.4729, lng: 23.7258 });
const OTHER = neighboursOf(MINE)[0] as string;
const held: Cell = { h3: MINE, ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [] };

describe('Plant your standard (BRDC-STANDARD-001)', () => {
  it('plants only on your own ground, and the store refuses — not just the button', async () => {
    const store = new MemoryStore();
    const api = standardApi(() => store, async () => [held]);
    expect(await api.plant(null, T0)).toEqual({ ok: false, refused: 'no-position' });
    expect(await api.plant(OTHER, T0)).toEqual({ ok: false, refused: 'not-yours' });
    expect(await api.at()).toBeNull();
    expect(await api.plant(MINE, T0)).toEqual({ ok: true, standard: { h3: MINE, at: T0 } });
    expect(await api.at()).toEqual({ h3: MINE, at: T0 });
  });

  it('one at a time: planting again moves it', async () => {
    const store = new MemoryStore();
    const other: Cell = { ...held, h3: OTHER };
    const api = standardApi(() => store, async () => [held, other]);
    await api.plant(MINE, T0);
    await api.plant(OTHER, T0 + 1);
    expect(await api.at()).toEqual({ h3: OTHER, at: T0 + 1 });
  });
});
