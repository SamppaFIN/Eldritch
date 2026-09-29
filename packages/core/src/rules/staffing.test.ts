import { describe, expect, it } from 'vitest';
import { cellAt, neighboursOf } from '../geo/cells.js';
import { assignWorker, isFoodDeposit, slotsFor, staffKey, staffed, staffedBonus, staffedCells, trimStaff } from './staffing.js';
import { feedGranary } from './citizens.js';
import { terrainForCell } from './terrain.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-01T12:00:00Z');
const A = cellAt({ lat: 61.4729, lng: 23.7258 });
const B = neighboursOf(A)[0] as string;
const cell = (h3: string, ...ids: ('farm' | 'forge' | 'granary')[]): Cell => ({
  h3,
  ownerId: 'me',
  strength: 100,
  lastVisitedAt: T0,
  visitDays: [],
  buildings: ids.map((id) => ({ id, builtAt: T0 })),
});

describe('staffing — no hands, no harvest', () => {
  it('an unstaffed building yields nothing; each worker yields the full amount', () => {
    const cells = [cell(A, 'farm'), cell(B, 'forge')];
    expect(staffedBonus(cells, {}, T0)).toEqual({});
    const staff = { [staffKey(A, 'farm')]: 2, [staffKey(B, 'forge')]: 1 };
    expect(staffedBonus(cells, staff, T0)).toEqual({ food: 6, iron: 2, wood: -1 });
    expect(staffedCells(cells, { [staffKey(A, 'farm')]: 1 }).map((c) => c.h3)).toEqual([A]);
  });

  it('a Work the document does not list pays its old rate for one pair of hands', () => {
    expect(slotsFor('granary', 5)).toBe(1);
    expect(staffedBonus([cell(A, 'granary')], { [staffKey(A, 'granary')]: 1 }, T0)).toEqual({ food: 1 });
  });

  it('slots grow with level up to the building ceiling', () => {
    expect([0, 1, 2, 4, 9].map((lv) => slotsFor('farm', lv))).toEqual([1, 1, 2, 3, 3]);
    expect(slotsFor('watchtower', 9)).toBe(2);
  });

  it('sends only idle citizens, only into free slots, and calls them back', () => {
    const one = assignWorker({}, 1, A, 'farm', 1, 0);
    expect(one.ok).toBe(true);
    if (!one.ok) return;
    expect(assignWorker(one.staff, 1, A, 'farm', 1, 9)).toEqual({ ok: false, refused: 'no-idle' });
    expect(assignWorker(one.staff, 5, A, 'farm', 1, 0)).toEqual({ ok: false, refused: 'full' });
    expect(assignWorker({}, 5, A, 'farm', -1, 0)).toEqual({ ok: false, refused: 'none-there' });
    const back = assignWorker(one.staff, 1, A, 'farm', -1, 0);
    expect(back.ok && back.staff).toEqual({});
  });

  it('when citizens leave, the last-assigned hands go first', () => {
    const staff = { [staffKey(A, 'farm')]: 2, [staffKey(B, 'forge')]: 1 };
    expect(trimStaff(staff, 2)).toEqual({ [staffKey(A, 'farm')]: 2 });
    expect(staffed(trimStaff(staff, 0))).toBe(0);
    expect(trimStaff(staff, 5)).toBe(staff);
  });

  it('a starving departure takes a worker with it', () => {
    const keep = { level: 1, granary: { citizens: 2, box: 0, starvedH: 0 }, staff: { [staffKey(A, 'farm')]: 2 } };
    const before = { pool: { food: 0 }, since: 0, keep };
    const r = feedGranary(before, { pool: { food: 0 }, since: 6 * 3_600_000, keep });
    expect(r.keep?.granary.citizens).toBe(1);
    expect(r.keep?.staff).toEqual({ [staffKey(A, 'farm')]: 1 });
  });
});

describe('the ground adds to the hands (the NOTE column)', () => {
  const ring = [A, ...neighboursOf(A)];
  const around = (h: string) => [h, ...neighboursOf(h)];

  it('a Farmstead on a food deposit doubles each worker', () => {
    // Walk outward until a hex with a food bounty turns up.
    const seen = new Set<string>(ring);
    const queue = [...ring];
    let found: string | undefined;
    while (!found && queue.length) {
      const h = queue.shift() as string;
      if (isFoodDeposit(cell(h, 'farm'))) found = h;
      for (const n of around(h)) if (!seen.has(n) && seen.size < 5000) (seen.add(n), queue.push(n));
    }
    expect(found).toBeDefined();
    const c = cell(found as string, 'farm');
    expect(staffedBonus([c], { [staffKey(c.h3, 'farm')]: 1 }, T0)).toEqual({ food: 6 });
  });

  it('a Sawmill gains a timber per held forest hex beside it', () => {
    const mill = { ...cell(A), buildings: [{ id: 'sawmill' as const, builtAt: T0 }] };
    const forests = neighboursOf(A).map((h) => ({ ...cell(h), terrain: { kind: 'forest' as const, source: 'seed' as const } }));
    const staff = { [staffKey(A, 'sawmill')]: 1 };
    const expected = 2 + forests.filter((f) => terrainForCell(f).kind === 'forest').length;
    expect(staffedBonus([mill, ...forests], staff, T0).wood).toBe(expected);
    expect(staffedBonus([mill], staff, T0).wood).toBe(2);
  });

  it('a Market gains a gold per held settlement hex beside it', () => {
    const market = { ...cell(A), buildings: [{ id: 'market' as const, builtAt: T0 }] };
    const towns = neighboursOf(A).slice(0, 2).map((h) => ({ ...cell(h), terrain: { kind: 'settlement' as const, source: 'seed' as const } }));
    const staff = { [staffKey(A, 'market')]: 1 };
    const seen = towns.filter((t) => terrainForCell(t).kind === 'settlement').length;
    expect(staffedBonus([market, ...towns], staff, T0).gold).toBe(3 + seen);
  });
});
