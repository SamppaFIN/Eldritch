import { describe, expect, it } from 'vitest';
import type { Cell } from '@es3/core';
import { ago, historyLine } from './cellHistory.js';

const NOW = Date.parse('2026-09-10T12:00:00Z');
const DAY = 86_400_000;
const base = (over: Record<string, unknown>): Cell =>
  ({ h3: 'h', ownerId: 'me', strength: 100, lastVisitedAt: NOW, visitDays: [], ...over }) as Cell;

describe('ago', () => {
  it('reads a day count in words', () => {
    expect(ago(0)).toBe('today');
    expect(ago(1)).toBe('yesterday');
    expect(ago(4)).toBe('4 days ago');
  });
});

describe('historyLine', () => {
  it('names a claim from the Void, yours and a stranger’s', () => {
    const mine = base({ history: [{ at: NOW - 2 * DAY, from: null, to: 'me' }] });
    expect(historyLine(mine, 'me', NOW)).toBe('You claimed this from the Void 2 days ago');
    const theirs = base({ history: [{ at: NOW - DAY, from: null, to: 'you' }] });
    expect(historyLine(theirs, 'me', NOW)).toBe('Claimed from the Void yesterday');
  });

  it('names a capture', () => {
    const taken = base({ history: [{ at: NOW, from: 'you', to: 'me' }] });
    expect(historyLine(taken, 'me', NOW)).toBe('You took this today');
  });

  it('falls back to who revealed it', () => {
    expect(historyLine(base({ finder: 'me' }), 'me', NOW)).toBe('You revealed this');
    expect(historyLine(base({ finder: 'you' }), 'me', NOW)).toBe('Revealed by another wanderer');
    expect(historyLine(base({}), 'me', NOW)).toBeNull();
  });
});
