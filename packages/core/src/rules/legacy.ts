/**
 * What you leave behind — the Legacy tally (BRDC-SEASON-003, Eldritch-season.pdf S4 and
 * "LEGACY SCORE").
 *
 * What a realm built becomes points, line by line, then the season's outcome multiplies
 * the lot: a Quiet lake ×1.2, a Risen one ×1. A Keep standing at the end adds 1 % of the
 * subtotal per Keep level; under a Risen lake a Keep within two rings of an open gate is
 * scored as fallen. A Season 1 realm scores what it has — cells, wonders, quests — and
 * zero for what its season never had.
 */
import { legacyMultiplier } from './season.js';
import type { SeasonOutcome } from './season.js';

export interface LegacyCounts {
  cells: number;
  citizens: number;
  masterworks: number;
  dormantMasterworks: number;
  lore: number;
  spellRanks: number;
  gatesSealed: number;
  quests: number;
  wonders: number;
  damage: number;
  sane: boolean;
  /** The realm's sanity at the end — only the Hall of Records reads the number (SEASON-005). */
  sanity: number;
  keepLevel: number;
  keepStanding: boolean;
}

export interface LegacyLine {
  label: string;
  count: number;
  /** How the count becomes points, as the tally prints it ("× 2", "÷ 2"). */
  rule: string;
  points: number;
}

export interface Legacy {
  /** What was counted — the boards and titles read these (SEASON-005). */
  counts: LegacyCounts;
  lines: LegacyLine[];
  subtotal: number;
  mult: number;
  total: number;
}

export const EMPTY_COUNTS: LegacyCounts = {
  cells: 0, citizens: 0, masterworks: 0, dormantMasterworks: 0, lore: 0, spellRanks: 0,
  gatesSealed: 0, quests: 0, wonders: 0, damage: 0, sane: false, sanity: 0, keepLevel: 0, keepStanding: false,
};

export function legacyOf(c: LegacyCounts, outcome: SeasonOutcome | undefined): Legacy {
  const per = (label: string, count: number, each: number): LegacyLine => ({ label, count, rule: `× ${each}`, points: count * each });
  const lines: LegacyLine[] = [
    per('Cells held', c.cells, 2),
    per('Citizens', c.citizens, 5),
    per('Masterworks', c.masterworks, 40),
    per('Dormant masterworks', c.dormantMasterworks, 20),
    per('Lore learned', c.lore, 6),
    per('Spell ranks', c.spellRanks, 4),
    per('Gates sealed', c.gatesSealed, 25),
    per('Quests finished', c.quests, 15),
    per('Wonders held', c.wonders, 30),
    { label: 'Reckoning damage', count: c.damage, rule: '÷ 2', points: Math.floor(c.damage / 2) },
    { label: 'Realm sane at the end', count: c.sane ? 1 : 0, rule: 'sanity ≥ 0', points: c.sane ? 50 : 0 },
  ].filter((l) => l.count > 0);
  const base = lines.reduce((s, l) => s + l.points, 0);
  if (c.keepStanding && c.keepLevel > 0) {
    lines.push({ label: 'Keep still standing', count: c.keepLevel, rule: `+ ${c.keepLevel} %`, points: Math.round((base * c.keepLevel) / 100) });
  }
  const subtotal = lines.reduce((s, l) => s + l.points, 0);
  const mult = legacyMultiplier(outcome);
  return { counts: c, lines, subtotal, mult, total: Math.round(subtotal * mult) };
}
