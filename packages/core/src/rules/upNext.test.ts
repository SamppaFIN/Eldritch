/** BRDC-NEXT-001 — what finishes next, soonest first. */
import { describe, expect, it } from 'vitest';
import { hoursToAfford, rankUpNext, upNextText, whenText } from './upNext.js';

describe('hoursToAfford', () => {
  it('counts the hours to the price, and says now or never', () => {
    expect(hoursToAfford(60, 20, 10)).toBe(4);
    expect(hoursToAfford(60, 60, 10)).toBe(0);
    expect(hoursToAfford(60, 20, 0)).toBeNull();
  });
});

describe('rankUpNext', () => {
  it('puts clocks first, soonest first, then progress furthest along, three at most', () => {
    const ranked = rankUpNext([
      { id: 'task-a', label: 'Task A', have: 1, need: 5 },
      { id: 'lore', label: 'Lookouts', hours: 2 },
      { id: 'task-b', label: 'Task B', have: 4, need: 5 },
      { id: 'citizen', label: 'Next citizen', hours: 0.5 },
    ]);
    expect(ranked.map((i) => i.id)).toEqual(['citizen', 'lore', 'task-b']);
  });

  it('drops a row with neither a clock nor progress', () => {
    expect(rankUpNext([{ id: 'x', label: 'Nothing' }])).toEqual([]);
  });
});

describe('text', () => {
  it('says the clock the short way', () => {
    expect(whenText(0)).toBe('now');
    expect(whenText(0.4)).toBe('24 min');
    expect(whenText(5.2)).toBe('5 h');
    expect(whenText(60)).toBe('3 d');
    expect(upNextText({ id: 'l', label: 'Lookouts', hours: 2 })).toBe('Lookouts 2 h');
    expect(upNextText({ id: 't', label: 'Cornelius', have: 3, need: 5 })).toBe('Cornelius 3/5');
  });
});
