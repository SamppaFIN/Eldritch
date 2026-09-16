/**
 * BRDC-CODEX-001 — the Codex says each measure in the unit a walker actually reads.
 */
import { describe, expect, it } from 'vitest';
import { METRIC_IDS } from '@es3/core';
import type { Metric, PlayerId } from '@es3/core';
import {
  METRIC_BLURB,
  METRIC_NAME,
  METRIC_TITLE,
  barPct,
  formatArea,
  formatDistance,
  formatMetric,
  gapLine,
  overallStanding,
  placeWord,
  titlesHeld,
} from './figures.js';

describe('formatArea', () => {
  /*
   * Three bands, and the Sigil document supplies a figure for each: one cell is
   * `1 622 m²`, a seven-cell realm is `1.1 ha`, the leaders are in km². Two bands put
   * a whole first week of play into five-digit metres — a number you count rather than
   * a size you feel (BRDC-SIGIL-006).
   */
  it('counts a single cell in metres', () => {
    expect(formatArea(1_622)).toBe('1,622 m²');
    expect(formatArea(9_999)).toContain('m²');
  });

  it('turns a realm into hectares, the way the Keep shows it', () => {
    // Seven cells, the Hearth ring — the document's own keepStats figure.
    expect(formatArea(11_353)).toBe('1.1 ha');
    expect(formatArea(999_999)).toContain('ha');
  });

  it('reaches square kilometres for a realm that earns them', () => {
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

/*
 * BRDC-CODEX-003 — the step to the next place.
 *
 * "3rd of 7" is a position; the gap is the part a player can act on. The arithmetic is
 * trivial and the edges are not: ties share a rank, a leader has nobody above, and a
 * realm alone in the world has nobody at all.
 */
describe('gapLine', () => {
  /** A land metric with the given values, best first, as `rankOf` builds them. */
  const landWith = (...values: number[]): Metric => ({
    id: 'land',
    ranked: [...values]
      .sort((a, b) => b - a)
      .map((value, i) => ({ id: `p${i}` as PlayerId, name: `P${i}`, value })),
    best: Math.max(...values),
    worst: Math.min(...values),
    average: values.reduce((s, v) => s + v, 0) / values.length,
  });

  it('says how far behind the place above, in the measure own unit', () => {
    // 3rd of 3 at 5 000; the nearest figure above is 6 200.
    expect(gapLine(landWith(9_000, 6_200, 5_000), 5_000, 3)).toBe('1,200 m² behind 2nd');
  });

  it('says the lead instead when nobody is above', () => {
    expect(gapLine(landWith(9_000, 6_200, 5_000), 9_000, 1)).toBe('2,800 m² ahead');
  });

  it('measures against the nearest distinct figure, not the next row, when realms tie', () => {
    // Two realms level at 5 000 share 2nd; the step up is to 9 000, not to each other.
    expect(gapLine(landWith(9_000, 5_000, 5_000), 5_000, 2)).toBe('4,000 m² behind 1st');
  });

  it('is silent for a realm alone, and for a field all level', () => {
    expect(gapLine(landWith(5_000), 5_000, 1)).toBeNull();
    expect(gapLine(landWith(5_000, 5_000), 5_000, 1)).toBeNull();
  });
});

describe('barPct (BRDC-CARD-005)', () => {
  it('places worst at 0 and best at 100', () => {
    expect(barPct(0, 0, 10)).toBe(0);
    expect(barPct(10, 0, 10)).toBe(100);
  });

  it('is linear in between', () => {
    expect(barPct(5, 0, 10)).toBe(50);
    expect(barPct(3, 0, 10)).toBe(30);
  });

  it('reads full when the field has no spread — nowhere lower to be', () => {
    expect(barPct(7, 7, 7)).toBe(100);
  });

  it('never leaves its own 0–100 range', () => {
    expect(barPct(-5, 0, 10)).toBe(0);
    expect(barPct(15, 0, 10)).toBe(100);
  });
});

describe('overallStanding (BRDC-CARD-005)', () => {
  const metric = (id: Metric['id'], mine: number, others: number[]): Metric => {
    const values = [mine, ...others];
    return {
      id,
      ranked: [{ id: 'me' as PlayerId, name: 'Me', value: mine }, ...others.map((value, i) => ({
        id: `p${i}` as PlayerId,
        name: `P${i}`,
        value,
      }))],
      best: Math.max(...values),
      worst: Math.min(...values),
      average: values.reduce((s, v) => s + v, 0) / values.length,
    };
  };

  it('averages the rank across every measure the realm is listed in', () => {
    // 1st of 3 in land, 3rd of 3 in works — mean rank 2.
    const m = [metric('land', 100, [50, 10]), metric('works', 1, [5, 9])];
    expect(overallStanding(m, 'me' as PlayerId)).toEqual({ rank: 2, of: 3 });
  });

  it('ignores a measure the realm has not published to', () => {
    const listed = metric('land', 100, [50, 10]);
    const notListed: Metric = { ...metric('works', 1, [5, 9]), ranked: [] };
    expect(overallStanding([listed, notListed], 'me' as PlayerId)).toEqual({ rank: 1, of: 3 });
  });

  it('is null for a realm not listed anywhere', () => {
    const notListed: Metric = { ...metric('land', 100, [50, 10]), ranked: [] };
    expect(overallStanding([notListed], 'me' as PlayerId)).toBeNull();
  });
});

describe('METRIC_TITLE and titlesHeld — field report 2026-09-16', () => {
  const metric = (id: Metric['id'], mine: number, others: number[]): Metric => {
    const values = [mine, ...others];
    return {
      id,
      ranked: [{ id: 'me' as PlayerId, name: 'Me', value: mine }, ...others.map((value, i) => ({
        id: `p${i}` as PlayerId,
        name: `P${i}`,
        value,
      }))],
      best: Math.max(...values),
      worst: Math.min(...values),
      average: values.reduce((s, v) => s + v, 0) / values.length,
    };
  };

  it('names every measure the core can produce, "the" lore register throughout', () => {
    for (const id of METRIC_IDS) {
      expect(METRIC_TITLE[id]).toMatch(/^The /);
    }
  });

  it('holds a title only for a measure actually led outright', () => {
    const leading = metric('land', 100, [50, 10]);
    const behind = metric('works', 1, [5, 9]);
    expect(titlesHeld([leading, behind], 'me' as PlayerId)).toEqual(['land']);
  });

  it('shares a title on a tie for the lead, the same rule placementIn already keeps', () => {
    const tied = metric('population', 100, [100, 10]);
    expect(titlesHeld([tied], 'me' as PlayerId)).toEqual(['population']);
  });

  it('holds every title at once when the realm leads more than one measure', () => {
    const land = metric('land', 100, [50]);
    const works = metric('works', 9, [5]);
    expect(titlesHeld([land, works], 'me' as PlayerId)).toEqual(['land', 'works']);
  });

  it('holds nothing while unlisted, or leading nothing', () => {
    const notListed: Metric = { ...metric('land', 100, [50]), ranked: [] };
    expect(titlesHeld([notListed], 'me' as PlayerId)).toEqual([]);
    expect(titlesHeld([metric('land', 10, [50])], 'me' as PlayerId)).toEqual([]);
  });
});
