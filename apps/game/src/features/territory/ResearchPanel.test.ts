/**
 * BRDC-STATS-001 — the research panel's affordability hint.
 */
import { describe, expect, it } from 'vitest';
import { EMPTY_POOL } from '@es3/core';
import type { ResourcePool } from '@es3/core';
import { waitFor } from './ResearchPanel.js';

const pool = (over: Partial<ResourcePool> = {}): ResourcePool => ({ ...EMPTY_POOL, ...over });

describe('waitFor', () => {
  it('says nothing when the wisdom is already there', () => {
    expect(waitFor(20, pool({ wisdom: 50 }), 0)).toBe('');
  });

  it('estimates the hours from the forecast rate', () => {
    // 45 short at 6/h → ~8 h.
    expect(waitFor(45, pool({ wisdom: 0 }), 6)).toBe(' · ~8 h');
  });

  it('warns when no wisdom is coming in', () => {
    expect(waitFor(45, pool({ wisdom: 10 }), 0)).toBe(' · no wisdom coming in');
  });

  it('is blank without a pouch to judge from', () => {
    expect(waitFor(45, null, 6)).toBe('');
  });
});
