/**
 * BRDC-BUILD-001 / BRDC-TECH-001 GREEN 8 — a locked building names what would open it.
 */
import { describe, expect, it } from 'vitest';
import type { BuildingId } from '@es3/core';
import { reason, splitBuildable, titleCase } from './BuildPanel.js';

describe('titleCase', () => {
  it('turns a tech slug into a label', () => {
    expect(titleCase('early-farming')).toBe('Early Farming');
    expect(titleCase('masonry')).toBe('Masonry');
  });
});

describe('reason', () => {
  it('names the technology for a locked building, not just "locked"', () => {
    expect(reason('locked', 'granary')).toBe('Needs Early Farming');
    expect(reason('locked', 'storehouse')).toBe('Needs Masonry');
  });

  it('phrases the other refusals plainly', () => {
    expect(reason('wrong-terrain', 'granary')).toBe('Wrong ground');
    expect(reason('at-capacity', 'monument')).toBe('No room — build a Granary');
    expect(reason('cannot-afford', 'market')).toBe('Cannot afford');
  });
});

describe('splitBuildable (BRDC-BUILD-005)', () => {
  it('partitions the catalogue into what can be built now and what is blocked', () => {
    const checks = new Map<BuildingId, { ok: boolean }>([
      ['sawmill', { ok: true }],
      ['market', { ok: false }],
      ['granary', { ok: true }],
      ['fortress', { ok: false }],
    ]);
    expect(splitBuildable(checks)).toEqual({
      ready: ['sawmill', 'granary'],
      locked: ['market', 'fortress'],
    });
  });

  it('handles an all-blocked cell — nothing ready', () => {
    const checks = new Map<BuildingId, { ok: boolean }>([
      ['sawmill', { ok: false }],
      ['market', { ok: false }],
    ]);
    expect(splitBuildable(checks)).toEqual({ ready: [], locked: ['sawmill', 'market'] });
  });
});
