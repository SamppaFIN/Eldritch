import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { legacyApi } from './legacyTally.js';
import { keepApi } from './citizenStore.js';
import { K } from './keys.js';
import { cellAt, cellsWithin } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-01T12:00:00Z');
const hexes = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 2);
const cells: Cell[] = hexes.map((h3, i) => ({
  h3, ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [], ...(i === 0 ? { anomaly: { startedAt: T0, done: true as const } } : {}),
}));

describe('legacyApi (BRDC-SEASON-003)', () => {
  it('a Season 1 realm scores its cells, wonders and quests', async () => {
    const store = new MemoryStore();
    await store.set(K.wonderFinds, { stone: { h3: hexes[1], at: T0 }, far: { h3: 'nope', at: T0 } });
    const legacy = await legacyApi(() => store, async () => cells).tally(T0, 'risen');
    expect(legacy.lines.map((l) => [l.label, l.count])).toEqual([['Cells held', cells.length], ['Quests finished', 1], ['Wonders held', 1]]);
    expect(legacy.total).toBe(cells.length * 2 + 15 + 30);
  });

  it('a Season 2 realm adds citizens, Lore, a sane realm and its standing Keep, then the outcome', async () => {
    const store = new MemoryStore();
    await keepApi(() => store, async () => cells).found(T0);
    await store.set(K.lore, ['husbandry', 'woodcraft']);
    await store.set(K.reckoning, { unsent: 0, dealt: 300 });
    const quiet = await legacyApi(() => store, async () => cells).tally(T0, 'quiet');
    const labels = quiet.lines.map((l) => l.label);
    expect(labels).toEqual(expect.arrayContaining(['Citizens', 'Lore learned', 'Reckoning damage', 'Realm sane at the end', 'Keep still standing']));
    expect(quiet.mult).toBe(1.2);
  });
});

describe('titles outlive the season (BRDC-SEASON-005)', () => {
  it('are awarded once each and kept', async () => {
    const store = new MemoryStore();
    const legacy = legacyApi(() => store, async () => []);
    await legacy.award(['Season 2 · The Wide Reach']);
    await legacy.award(['Season 2 · The Wide Reach', 'Season 2 · The Learned']);
    expect(await legacy.titles()).toEqual(['Season 2 · The Wide Reach', 'Season 2 · The Learned']);
  });
});
