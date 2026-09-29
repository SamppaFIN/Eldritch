import { describe, expect, it } from 'vitest';
import { EMPTY_COUNTS, legacyOf } from './legacy.js';

describe('the Legacy tally (BRDC-SEASON-003)', () => {
  it('reproduces the document’s worked tally', () => {
    // Eldritch-season.pdf S4: 64 cells, 19 citizens, 3 masterworks, 15 lore, 11 ranks,
    // 9 gates, 7 quests, 2 wonders, 4 120 damage, sane — subtotal 2 977 before the Keep.
    const c = {
      ...EMPTY_COUNTS,
      cells: 64, citizens: 19, masterworks: 3, lore: 15, spellRanks: 11, gatesSealed: 9,
      quests: 7, wonders: 2, damage: 4_120, sane: true,
    };
    const noKeep = legacyOf(c, undefined);
    expect(noKeep.subtotal).toBe(128 + 95 + 120 + 90 + 44 + 225 + 105 + 60 + 2_060 + 50);
    const quiet = legacyOf({ ...c, keepLevel: 3, keepStanding: true }, 'quiet');
    expect(quiet.lines.at(-1)).toMatchObject({ label: 'Keep still standing', points: Math.round(noKeep.subtotal * 0.03) });
    expect(quiet.mult).toBe(1.2);
    expect(quiet.total).toBe(Math.round(quiet.subtotal * 1.2));
  });

  it('a Season 1 realm scores what it has, and a fallen Keep adds nothing', () => {
    const s1 = legacyOf({ ...EMPTY_COUNTS, cells: 40, wonders: 1, quests: 2 }, 'risen');
    expect(s1.lines.map((l) => l.label)).toEqual(['Cells held', 'Quests finished', 'Wonders held']);
    expect(s1.total).toBe(80 + 30 + 30);
    const fallen = legacyOf({ ...EMPTY_COUNTS, cells: 10, keepLevel: 3, keepStanding: false }, 'risen');
    expect(fallen.total).toBe(20);
  });
});
