import { describe, expect, it } from 'vitest';
import { keepIfSame } from './keepIfSame.js';

describe('keepIfSame (BRDC-PERF-002)', () => {
  it('keeps the old identity when the content is the same', () => {
    const prev = [{ a: 1 }];
    expect(keepIfSame(prev, [{ a: 1 }])).toBe(prev);
    const empty: number[] = [];
    expect(keepIfSame(empty, [])).toBe(empty);
  });

  it('takes the new value when anything differs', () => {
    const next = [{ a: 2 }];
    expect(keepIfSame([{ a: 1 }], next)).toBe(next);
  });
});
