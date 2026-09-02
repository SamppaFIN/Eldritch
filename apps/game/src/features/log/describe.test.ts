import { describe, expect, it } from 'vitest';
import type { LogEntry, LogKind } from '@es3/core';
import { HELP } from '../help/help.js';
import { describeLogEntry, relativeTime } from './describe.js';

const ALL_KINDS: LogKind[] = [
  'awaken',
  'corrupt',
  'reinforce',
  'reclaim',
  'build',
  'demolish',
  'research',
  'spell',
  'ward',
  'route',
  'expand',
  'mana',
  'anomaly',
  'quest',
  'wager',
  'hearth',
];

describe('describeLogEntry', () => {
  it('renders a non-empty sentence for every kind', () => {
    for (const kind of ALL_KINDS) {
      const entry: LogEntry = { at: 0, kind, count: 2, ref: 'sawmill', won: true };
      expect(describeLogEntry(entry).text.length).toBeGreaterThan(3);
    }
  });

  it('only ever points at a codex topic that exists', () => {
    for (const kind of ALL_KINDS) {
      const { topic } = describeLogEntry({ at: 0, kind });
      if (topic) expect(HELP[topic]).toBeDefined();
    }
  });

  it('uses the display name for a building and falls back to title case', () => {
    expect(describeLogEntry({ at: 0, kind: 'build', ref: 'sawmill' }).text).toBe('Built a Sawmill');
    expect(describeLogEntry({ at: 0, kind: 'build', ref: 'temple-grove' }).text).toBe(
      'Built a Temple Grove',
    );
  });

  it('tells consecrating a temple apart from the Altar', () => {
    expect(describeLogEntry({ at: 0, kind: 'mana', ref: 'consecrate' }).text).toBe(
      'Consecrated a temple',
    );
    expect(describeLogEntry({ at: 0, kind: 'mana' }).text).toBe('Raised the Altar');
  });

  it('names the opponent and the result of a Wager', () => {
    expect(describeLogEntry({ at: 0, kind: 'wager', ref: 'Seeker', won: false }).text).toBe(
      'Fought the Wager against Seeker — lost',
    );
  });

  it('names a quest find and falls back for a plain step', () => {
    expect(describeLogEntry({ at: 0, kind: 'quest', ref: 'found:wisdom' }).text).toBe(
      'Found The Wisdom Stone',
    );
    expect(describeLogEntry({ at: 0, kind: 'quest', ref: 'fuming-lake' }).text).toBe(
      'Took a step in an adventure',
    );
  });
});

describe('relativeTime', () => {
  it('reads the gap in human units', () => {
    const now = 10 * 86_400_000;
    expect(relativeTime(now, now)).toBe('just now');
    expect(relativeTime(now - 5 * 60_000, now)).toBe('5 min ago');
    expect(relativeTime(now - 3 * 3_600_000, now)).toBe('3 h ago');
    expect(relativeTime(now - 86_400_000, now)).toBe('yesterday');
    expect(relativeTime(now - 4 * 86_400_000, now)).toBe('4 days ago');
  });
});
