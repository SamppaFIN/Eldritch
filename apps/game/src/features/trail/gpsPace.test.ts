import { beforeEach, describe, expect, it } from 'vitest';
import { GPS_MIN_GAP_MS, gpsRates, platformName, resetGpsPace, takeFix } from './gpsPace.js';

beforeEach(() => resetGpsPace());

const HERE = { lat: 61.4729, lng: 23.7258, accuracy: 8 };

describe('GPS pace (field report 2026-09-30)', () => {
  it('never holds back a step or a signal turning weak', () => {
    expect(takeFix(0, HERE)).toBe(true);
    expect(takeFix(1_000, { ...HERE, lat: HERE.lat + 0.0001 })).toBe(true); // ~11 m on
    expect(takeFix(2_000, { ...HERE, lat: HERE.lat + 0.0001, accuracy: 60 })).toBe(true); // weak
    expect(takeFix(2_500, { ...HERE, lat: HERE.lat + 0.0001, accuracy: 60 })).toBe(false);
  });

  it('uses the first fix, then at most one every 3 s', () => {
    expect(takeFix(0)).toBe(true);
    expect(takeFix(1_000)).toBe(false);
    expect(takeFix(2_999)).toBe(false);
    expect(takeFix(GPS_MIN_GAP_MS)).toBe(true);
  });

  it('counts what an iPhone sends against what the game uses, over a minute', () => {
    for (let t = 0; t < 60_000; t += 1_000) takeFix(t);
    expect(gpsRates(59_999)).toEqual({ received: 60, used: 20 });
    expect(gpsRates(200_000)).toEqual({ received: 0, used: 0 });
  });

  it('names the platform from the user agent', () => {
    expect(platformName('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe('iOS');
    expect(platformName('Mozilla/5.0 (Linux; Android 15; SM-S918B)')).toBe('Android');
    expect(platformName('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('Desktop');
  });
});
