import { describe, expect, it } from 'vitest';
import type { LogEntry } from '@es3/core';
import { buildReport } from './report.js';

const NOW = Date.parse('2026-09-01T12:00:00Z');

describe('buildReport', () => {
  it('leads with the note, then the context block', () => {
    const text = buildReport({
      version: '0.4.2',
      now: NOW,
      position: { lat: 61.4729131, lng: 23.7259881 },
      log: [],
      note: '  the trail vanished after a tunnel  ',
    });
    expect(text.split('\n')[0]).toBe('Eldritch Sanctuary — field report');
    expect(text).toContain('the trail vanished after a tunnel');
    expect(text).toContain('build: v0.4.2');
    // Position is coarsened to three decimals — a report is not a check-in.
    expect(text).toContain('near: 61.473, 23.726');
    expect(text).not.toContain('61.4729131');
  });

  it('stands in for an empty note and an empty log', () => {
    const text = buildReport({ version: '0.4.2', now: NOW, position: null, log: [], note: '   ' });
    expect(text).toContain('(no description given)');
    expect(text).toContain('near: unknown');
    expect(text).toContain('(nothing recorded yet)');
  });

  it('lists the five most recent actions, newest first', () => {
    const log: LogEntry[] = Array.from({ length: 8 }, (_, i) => ({
      at: NOW - i * 60_000,
      kind: 'awaken',
      count: 1,
    }));
    const text = buildReport({ version: '0.4.2', now: NOW, position: null, log, note: 'x' });
    const lines = text.split('\n').filter((l) => l.startsWith('  · '));
    expect(lines).toHaveLength(5);
    expect(lines[0]).toContain('just now');
  });
});
