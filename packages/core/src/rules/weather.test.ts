/** BRDC-WEATHER-001 — the day's weather from the calendar. */
import { describe, expect, it } from 'vitest';
import { sightRings, skyLine, weatherAt } from './weather.js';

const DAY = 86_400_000;
const T = Date.parse('2026-10-08T00:00:00Z');

describe('weatherAt', () => {
  it('is the same all day, on every phone', () => {
    expect(weatherAt(T + 1_000)).toBe(weatherAt(T + DAY - 1_000));
  });
  it('is calm most days, and every kind turns up over a hundred', () => {
    const days = Array.from({ length: 100 }, (_, i) => weatherAt(T + i * DAY));
    const n = (w: string) => days.filter((d) => d === w).length;
    expect(n('calm')).toBeGreaterThan(35);
    for (const w of ['fog', 'clear', 'storm']) expect(n(w)).toBeGreaterThan(0);
    for (const w of ['fog', 'clear', 'storm']) expect(n(w)).toBeLessThan(n('calm'));
  });
});

describe('sightRings and skyLine', () => {
  it('fog shows your ground only, clear two rings, otherwise one', () => {
    expect([sightRings('fog'), sightRings('calm'), sightRings('storm'), sightRings('clear')]).toEqual([0, 1, 1, 2]);
  });
  it('says the sky only when there is something to say', () => {
    expect(skyLine('fog', 'full')).toBe('Full moon · Fog');
    expect(skyLine('calm', 'new')).toBe('New moon');
    expect(skyLine('calm', null)).toBe('');
  });
});
