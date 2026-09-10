/**
 * BRDC-BUILD-001 / BRDC-TECH-001 GREEN 8 — a locked building names what would open it.
 */
import { describe, expect, it } from 'vitest';
import type { BuildRefusal, BuildingId } from '@es3/core';
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
    expect(reason('cell-full', 'monument')).toBe('This hex is full');
    expect(reason('cannot-afford', 'market')).toBe('Cannot afford');
  });
});

describe('splitBuildable (BRDC-BUILD-005, BRDC-BUILD-010)', () => {
  type Check = { ok: boolean; refused?: BuildRefusal };

  it('separates what can go up now, what this ground is for, and what belongs elsewhere', () => {
    const checks = new Map<BuildingId, Check>([
      ['sawmill', { ok: true }],
      ['mine', { ok: false, refused: 'locked' }],
      ['granary', { ok: true }],
      ['fortress', { ok: false, refused: 'cannot-afford' }],
      ['fishery', { ok: false, refused: 'wrong-terrain' }],
    ]);
    expect(splitBuildable(checks)).toEqual({
      ready: ['sawmill', 'granary'],
      here: ['mine', 'fortress'],
      elsewhere: ['fishery'],
    });
  });

  /*
   * The reason this became three lists. A player on a mountain saw "Nothing can be built
   * here yet" with the Mine filed alphabetically among fourteen things that could never
   * go there, and concluded the game had no mines in it. Ground says what it is for now,
   * even when the technology for it is thirty hours of wisdom away.
   */
  it('keeps a locked Mine with the mountain it belongs to, not behind the "+ more" wall', () => {
    const checks = new Map<BuildingId, Check>([
      ['mine', { ok: false, refused: 'locked' }],
      ['fishery', { ok: false, refused: 'wrong-terrain' }],
    ]);
    const { here, elsewhere } = splitBuildable(checks);
    expect(here).toEqual(['mine']);
    expect(elsewhere).toEqual(['fishery']);
  });

  // A Library needs a temple beside it, which is a fact about the neighbourhood rather
  // than about this hex — so it belongs with the ground that cannot hold it.
  it('files a missing temple with the wrong ground, not with what this hex is for', () => {
    const checks = new Map<BuildingId, Check>([['library', { ok: false, refused: 'needs-a-temple' }]]);
    expect(splitBuildable(checks).elsewhere).toEqual(['library']);
  });

  it('handles a cell where nothing at all can go', () => {
    const checks = new Map<BuildingId, Check>([
      ['sawmill', { ok: false, refused: 'wrong-terrain' }],
      ['market', { ok: false, refused: 'wrong-terrain' }],
    ]);
    expect(splitBuildable(checks)).toEqual({
      ready: [],
      here: [],
      elsewhere: ['sawmill', 'market'],
    });
  });
});
