/**
 * BRDC-SPELL-001 — the rites sub-panel's small pure parts.
 */
import { describe, expect, it } from 'vitest';
import { SPELLS } from '@es3/core';
import { HOME_SPELLS, spellTimeLeft } from './SpellPanel.js';

describe('HOME_SPELLS', () => {
  it('is exactly the spells that act at home', () => {
    expect([...HOME_SPELLS].sort()).toEqual([
      'bulwark',
      'farsight',
      'forgeheart',
      'greenwake',
      'insight',
      'quickening',
      'wellspring',
    ]);
    for (const id of HOME_SPELLS) expect(SPELLS[id].via).toBe('home');
  });

  // PIVOT-2026-09-09 §7. The panel is a cell card, so a Rite that is not cast on the whole
  // domain is cast on the hex whose card it is — including the two that reach past it.
  it('gives every Rite but a domain one a cell to land on', () => {
    for (const id of HOME_SPELLS) {
      if (SPELLS[id].scope === 'domain') continue;
      expect(SPELLS[id].scope).toMatch(/cell$/);
    }
  });
});

describe('spellTimeLeft', () => {
  it('reads in hours above an hour and minutes below, never zero', () => {
    expect(spellTimeLeft(8 * 3_600_000)).toBe('8 h left');
    expect(spellTimeLeft(90 * 60_000)).toBe('2 h left');
    expect(spellTimeLeft(20 * 60_000)).toBe('20 min left');
    expect(spellTimeLeft(1_000)).toBe('1 min left');
  });
});
