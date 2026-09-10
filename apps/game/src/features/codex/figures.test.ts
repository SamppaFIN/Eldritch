/**
 * BRDC-CODEX-001 — the Codex says each measure in the unit a walker actually reads.
 */
import { describe, expect, it } from 'vitest';
import { METRIC_IDS } from '@es3/core';
import {
  METRIC_BLURB,
  METRIC_NAME,
  formatArea,
  formatDistance,
  formatMetric,
  placeWord,
} from './figures.js';

describe('formatArea', () => {
  /*
   * The reason for the switch rather than one unit: a realm of seven hexes is 11 353 m²,
   * and "0.01 km²" tells a new player nothing at all about what they hold.
   */
  it('stays in m² until there is a square kilometre to show', () => {
    expect(formatArea(11_353)).toBe('11,353 m²');
    expect(formatArea(999_999)).toContain('m²');
    expect(formatArea(2_500_000)).toBe('2.5 km²');
  });
});

describe('formatDistance', () => {
  it('stays in metres under a kilometre', () => {
    expect(formatDistance(840)).toBe('840 m');
    expect(formatDistance(4_200)).toBe('4.2 km');
  });
});

describe('formatMetric', () => {
  it('gives every measure a unit, and none of them a bare float', () => {
    for (const id of METRIC_IDS) {
      const text = formatMetric(id, 1234.567);
      expect(text).not.toContain('.567');
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it('counts footfall in days, singular at one', () => {
    expect(formatMetric('footfall', 1)).toBe('1 day');
    expect(formatMetric('footfall', 15)).toBe('15 days');
  });

  it('leaves the plain counts plain', () => {
    expect(formatMetric('works', 7)).toBe('7');
    expect(formatMetric('consciousness', 3)).toBe('3');
  });
});

describe('placeWord', () => {
  it('reads as a placing, not as a field called rank', () => {
    expect(placeWord(1, 7)).toBe('1st of 7');
    expect(placeWord(2, 7)).toBe('2nd of 7');
    expect(placeWord(3, 7)).toBe('3rd of 7');
    expect(placeWord(4, 7)).toBe('4th of 7');
  });

  // The teens are the case every hand-rolled ordinal gets wrong.
  it('says eleventh, twelfth and thirteenth rather than 11st', () => {
    expect(placeWord(11, 40)).toBe('11th of 40');
    expect(placeWord(12, 40)).toBe('12th of 40');
    expect(placeWord(13, 40)).toBe('13th of 40');
    expect(placeWord(21, 40)).toBe('21st of 40');
  });
});

describe('the copy', () => {
  it('names and explains every measure the core can produce', () => {
    for (const id of METRIC_IDS) {
      expect(METRIC_NAME[id]).toBeTruthy();
      // Read while walking: one sentence, under ninety characters.
      expect(METRIC_BLURB[id].length).toBeLessThan(90);
    }
  });
});
