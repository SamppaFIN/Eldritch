/** BRDC-FX-004 — the pulse steps from its low to its high and back. */
import { describe, expect, it } from 'vitest';
import { pulseValue } from './layerPulse.js';

describe('pulseValue', () => {
  it('starts low, peaks halfway, and comes back round', () => {
    expect(pulseValue(0, 0.2, 0.8)).toBeCloseTo(0.2, 9);
    expect(pulseValue(3, 0.2, 0.8)).toBeCloseTo(0.8, 9);
    expect(pulseValue(6, 0.2, 0.8)).toBeCloseTo(0.2, 9);
    for (let i = 0; i < 12; i += 1) {
      expect(pulseValue(i, 0.2, 0.8)).toBeGreaterThanOrEqual(0.2 - 1e-9);
      expect(pulseValue(i, 0.2, 0.8)).toBeLessThanOrEqual(0.8 + 1e-9);
    }
  });
});
