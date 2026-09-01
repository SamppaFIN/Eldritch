import { describe, expect, it } from 'vitest';
import { MAX_LOG_ENTRIES } from './constants.js';
import { appendLog } from './log.js';
import type { LogEntry } from './log.js';

const entry = (at: number): LogEntry => ({ at, kind: 'awaken', count: 1 });

describe('appendLog', () => {
  it('adds to the end, oldest first', () => {
    const log = appendLog(appendLog([], entry(1)), entry(2));
    expect(log.map((e) => e.at)).toEqual([1, 2]);
  });

  it('keeps only the last `cap` entries', () => {
    let log: LogEntry[] = [];
    for (let i = 0; i < 10; i++) log = appendLog(log, entry(i), 4);
    expect(log.map((e) => e.at)).toEqual([6, 7, 8, 9]);
  });

  it('defaults the cap to MAX_LOG_ENTRIES', () => {
    let log: LogEntry[] = [];
    for (let i = 0; i < MAX_LOG_ENTRIES + 50; i++) log = appendLog(log, entry(i));
    expect(log).toHaveLength(MAX_LOG_ENTRIES);
    expect(log[0]?.at).toBe(50);
  });

  it('treats undefined as an empty log', () => {
    expect(appendLog(undefined, entry(1))).toEqual([entry(1)]);
  });
});
