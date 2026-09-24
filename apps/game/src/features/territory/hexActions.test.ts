import { describe, expect, it } from 'vitest';
import { ACTION_ORDER, cellActions } from './hexActions.js';

describe('cellActions (BRDC-DETAIL-003)', () => {
  it('lists only what the hex offers', () => {
    expect(cellActions({})).toEqual([]);
    expect(cellActions({ ward: { label: 'Ward' } }).map((a) => a.id)).toEqual(['ward']);
  });

  it('keeps one fixed order whatever order the offer is written in', () => {
    const ids = cellActions({
      anomaly: 'Anomaly',
      works: 'Works',
      quest: { label: 'Begin' },
      ward: { label: 'Ward' },
      reveal: { label: 'Reveal' },
      city: 'Trade',
    }).map((a) => a.id);
    expect(ids).toEqual(['quest', 'reveal', 'ward', 'works', 'city', 'anomaly']);
    expect(ids).toEqual(ACTION_ORDER.filter((id) => ids.includes(id)));
  });

  it('presses act at once, sections open', () => {
    const [ward, works] = cellActions({ ward: { label: 'Ward' }, works: 'Works' });
    expect(ward?.opens).toBe(false);
    expect(works?.opens).toBe(true);
  });

  it('a disabled press carries its reason; an enabled one never does', () => {
    const [a] = cellActions({ ward: { label: 'Ward', disabled: true, why: 'Short 25 timber.' } });
    expect(a).toMatchObject({ disabled: true, why: 'Short 25 timber.' });
    const [b] = cellActions({ ward: { label: 'Ward', disabled: false, why: 'stale' } });
    expect(b).toMatchObject({ disabled: false, why: null });
  });
});
