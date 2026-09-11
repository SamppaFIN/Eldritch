/**
 * BRDC-SURVEY-001 — the batching rule. The hook itself needs a GL map; this does not.
 */
import { describe, expect, it } from 'vitest';
import { cellAt, cellsWithin } from '@es3/core';
import { SURVEY_CHUNK, SURVEY_RADIUS, pendingSurvey } from './useNearbySurvey.js';

const HERE = cellAt({ lat: 61.47290805294704, lng: 23.725882485862012 });
const none = new Set<string>();

describe('pendingSurvey', () => {
  it('never hands back more than one pass will fit in a frame', () => {
    expect(pendingSurvey(HERE, none)).toHaveLength(SURVEY_CHUNK);
  });

  it('reads the ground under the next step before the edge of the ring', () => {
    expect(pendingSurvey(HERE, none)[0]).toBe(HERE);
  });

  it('skips what was already read', () => {
    const first = pendingSurvey(HERE, none);
    const second = pendingSurvey(HERE, new Set(first));
    expect(second.some((h3) => first.includes(h3))).toBe(false);
  });

  it('runs out once the whole ring is read, so the sweep ends', () => {
    const whole = new Set(cellsWithin(HERE, SURVEY_RADIUS));
    expect(pendingSurvey(HERE, whole)).toEqual([]);
  });

  it('covers the ring in a bounded number of passes', () => {
    const done = new Set<string>();
    let passes = 0;
    for (let batch = pendingSurvey(HERE, done); batch.length > 0; batch = pendingSurvey(HERE, done)) {
      for (const h3 of batch) done.add(h3);
      passes += 1;
      expect(passes).toBeLessThan(20);
    }
    expect(done.size).toBe(cellsWithin(HERE, SURVEY_RADIUS).length);
  });
});
