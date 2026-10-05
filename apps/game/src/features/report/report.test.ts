import { describe, expect, it } from 'vitest';
import type { LogEntry } from '@es3/core';
import { buildReport, issueUrl } from './report.js';

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

describe('issueUrl (BRDC-BUGREPORT-002)', () => {
  const base = { version: '0.9.0', platform: 'Linux armv8l', device: 'Mozilla/5.0 (Android) · 412×915', view: '/#map' };

  it('prefills a new issue on the game repo with title, label and context', () => {
    const url = new URL(issueUrl({ ...base, kind: 'bug', note: 'The flag stayed on the old hex\nafter planting it again' }));
    expect(url.origin + url.pathname).toBe('https://github.com/SamppaFIN/Eldritch/issues/new');
    expect(url.searchParams.get('title')).toBe('Bug: The flag stayed on the old hex');
    expect(url.searchParams.get('labels')).toBe('bug');
    const body = url.searchParams.get('body') ?? '';
    expect(body).toContain('after planting it again');
    expect(body).toContain('- Version: v0.9.0');
    expect(body).toContain('- Platform: Linux armv8l');
    expect(body).toContain('- Device: Mozilla/5.0 (Android) · 412×915');
    expect(body).toContain('- View: /#map');
  });

  it('labels an improvement as an enhancement, and cuts a long title', () => {
    const url = new URL(issueUrl({ ...base, kind: 'enhancement', note: 'x'.repeat(200) }));
    expect(url.searchParams.get('labels')).toBe('enhancement');
    expect(url.searchParams.get('title')).toMatch(/^Idea: x{69}…$/);
  });

  it('never carries a position, and stays a URL GitHub will open', () => {
    const url = issueUrl({ ...base, kind: 'bug', note: 'ä'.repeat(20_000) });
    expect(url).not.toMatch(/near|61\.47/);
    expect(url.length).toBeLessThan(8000);
  });
});
