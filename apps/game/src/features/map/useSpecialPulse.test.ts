import { describe, expect, it } from 'vitest';
import { PULSE_PERIOD_MS, pulseOpacity } from './useSpecialPulse.js';
import { floatPx } from './useFocusFloat.js';

describe('the one pulse (BRDC-FX-003)', () => {
  it('breathes between 0.3 and 0.9 over one period', () => {
    const samples = Array.from({ length: 64 }, (_, i) => pulseOpacity((i / 64) * PULSE_PERIOD_MS));
    expect(Math.min(...samples)).toBeGreaterThanOrEqual(0.3 - 1e-9);
    expect(Math.max(...samples)).toBeLessThanOrEqual(0.9 + 1e-9);
    expect(pulseOpacity(0)).toBeCloseTo(pulseOpacity(PULSE_PERIOD_MS));
  });

  it('the floating building follows the icon ramp, capped both ways', () => {
    expect(floatPx(16)).toBe(48);
    expect(floatPx(17)).toBe(96);
    expect(floatPx(20)).toBe(192);
    expect(floatPx(12)).toBe(24);
  });
});
