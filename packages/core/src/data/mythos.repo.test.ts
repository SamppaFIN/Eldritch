/** BRDC-MYTHOS-001 — the store keeps the season's clock and the day the headline was read. */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { mythosApi, mythosToday } from './mythosStore.js';

const T0 = Date.parse('2026-10-01T06:00:00Z');
const DAY = 86_400_000;

describe('mythosApi', () => {
  it('no season remembered: no card, and no effect anywhere', async () => {
    const store = new MemoryStore();
    expect(await mythosApi(() => store).today(T0)).toBeNull();
    expect(await mythosToday(store, T0)).toBeNull();
  });

  it('remembers the clock; the headline is read once a day', async () => {
    const store = new MemoryStore();
    const api = mythosApi(() => store);
    await api.remember({ seed: 'season-3', opensAt: T0 });
    const today = await api.today(T0 + DAY / 2);
    expect(today?.seen).toBe(false);
    await api.markSeen(T0 + DAY / 2);
    expect((await api.today(T0 + DAY / 2 + 1_000))?.seen).toBe(true);
    expect((await api.today(T0 + DAY + DAY / 2))?.seen).toBe(false);
    expect((await mythosToday(store, T0 + DAY / 2))?.id).toBe(today?.card.id);
  });
});
