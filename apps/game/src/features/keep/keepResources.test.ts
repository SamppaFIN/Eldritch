/**
 * BRDC-ECON-004 — the Keep's Resources section, pure parts.
 */
import { describe, expect, it } from 'vitest';
import { EMPTY_POOL } from '@es3/core';
import type { ResourcePool } from '@es3/core';
import { shownResources, sinceLabel } from './KeepResources.js';

const pool = (over: Partial<ResourcePool> = {}): ResourcePool => ({ ...EMPTY_POOL, ...over });

describe('shownResources', () => {
  it('lists what you hold and what is coming in, and nothing at zero-zero', () => {
    const rows = shownResources(pool({ wood: 40, stone: 0 }), { food: 3 });
    expect(rows).toContain('wood'); // held
    expect(rows).toContain('food'); // incoming
    expect(rows).not.toContain('stone'); // neither
    expect(rows).not.toContain('gold');
  });

  it('keeps RESOURCE_KINDS order', () => {
    const rows = shownResources(pool({ gold: 1, wood: 1, iron: 1 }), {});
    expect(rows).toEqual(['wood', 'iron', 'gold']);
  });

  it('is empty for an empty pouch with no production', () => {
    expect(shownResources(pool(), {})).toEqual([]);
    expect(shownResources(null, {})).toEqual([]);
  });
});

describe('sinceLabel', () => {
  const now = 10 * 86_400_000;

  it('says "not yet" before the first collect', () => {
    expect(sinceLabel(0, now)).toBe('not yet');
  });

  it('reads the gap in human units once there is one', () => {
    expect(sinceLabel(now, now)).toBe('just now');
    expect(sinceLabel(now - 3 * 3_600_000, now)).toBe('3 h ago');
  });
});
