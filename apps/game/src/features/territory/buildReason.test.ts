/** Field report 2026-09-30: Season 2 building said "Needs Irrigation" after the Lore was studied. */
import { describe, expect, it } from 'vitest';
import { reason } from './BuildPanel.js';

describe('why a Work is locked', () => {
  it('on a Season 2 save names the Lore tech, never the old tree', () => {
    expect(reason('locked', 'farm', [])).toBe('Needs Husbandry (Lore)');
    expect(reason('locked', 'forge', ['husbandry'])).toBe('Needs Stone and Bellows (Lore)');
    // A Work the Lore does not gate, locked only by what must stand first.
    expect(reason('locked', 'lumbermill', ['woodcraft'])).toBe('Needs an earlier building');
  });

  it('on a Season 1 save still names the old tech', () => {
    expect(reason('locked', 'farm', null)).toMatch(/^Needs /);
    expect(reason('locked', 'farm', null)).not.toContain('(Lore)');
  });
});
