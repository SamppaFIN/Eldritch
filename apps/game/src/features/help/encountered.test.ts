/**
 * BRDC-WIKI-002 — the "topics met" registry.
 */
import { describe, expect, it } from 'vitest';
import { ALWAYS_SEEN, markSeen, readSeen } from './encountered.js';
import { GROUPS } from './help.js';
import type { HelpTopic } from './help.js';

describe('readSeen', () => {
  it('always includes the three instruction pages', () => {
    const seen = readSeen();
    for (const t of ALWAYS_SEEN) expect(seen.has(t)).toBe(true);
  });

  it('does not include a mechanic page before it is met', () => {
    expect(readSeen().has('corruption')).toBe(false);
  });
});

describe('markSeen', () => {
  it('records a topic once and reports it new, then never again', () => {
    const seen = readSeen();
    expect(markSeen(seen, ['corruption'])).toEqual(['corruption']);
    expect(seen.has('corruption')).toBe(true);
    expect(markSeen(seen, ['corruption'])).toEqual([]);
  });

  it('never reports an always-seen page as new', () => {
    expect(markSeen(readSeen(), ['how-to-play', 'vocabulary'])).toEqual([]);
  });

  it('reports only the genuinely new ones from a mixed batch', () => {
    const seen = readSeen();
    markSeen(seen, ['decay']);
    expect(markSeen(seen, ['decay', 'work', 'rite'])).toEqual(['work', 'rite']);
  });
});

describe('the index shows only met topics (BRDC-WIKI-002)', () => {
  const visible = (seen: ReadonlySet<HelpTopic>) =>
    GROUPS.map((g) => g.topics.filter((t) => seen.has(t))).filter((ts) => ts.length > 0);

  it('a fresh player sees only the Getting started group', () => {
    const groups = visible(readSeen());
    expect(groups.flat().sort()).toEqual([...ALWAYS_SEEN].sort());
  });

  it('a met topic brings its group into view', () => {
    const seen = readSeen();
    markSeen(seen, ['awakening']);
    expect(visible(seen).flat()).toContain('awakening');
  });
});
