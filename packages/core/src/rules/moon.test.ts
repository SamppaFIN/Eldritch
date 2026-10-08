/** BRDC-MOON-001 — the real moon from the date. */
import { describe, expect, it } from 'vitest';
import { isFullMoon, isNewMoon, moonDay } from './moon.js';

const day = (iso: string) => Date.parse(`${iso}T12:00:00Z`);

describe('moonDay', () => {
  it('knows real full and new moons', () => {
    // Eclipses fall on them: lunar 2026-03-03 and 2026-08-28 (full), solar 2026-02-17 and 2026-08-12 (new).
    expect(moonDay(day('2026-03-03'))).toBe('full');
    expect(isFullMoon(day('2026-08-28'))).toBe(true);
    expect(isNewMoon(day('2026-02-17'))).toBe(true);
    expect(isNewMoon(day('2026-08-12'))).toBe(true);
    expect(moonDay(day('2026-08-20'))).toBeNull();
  });
  it('gives one full and one new day a month', () => {
    const days = Array.from({ length: 365 }, (_, i) => moonDay(day('2026-01-01') + i * 86_400_000));
    expect(days.filter((d) => d === 'full').length).toBeGreaterThanOrEqual(12);
    expect(days.filter((d) => d === 'full').length).toBeLessThanOrEqual(13);
    expect(days.filter((d) => d === 'new').length).toBeGreaterThanOrEqual(12);
  });
});
