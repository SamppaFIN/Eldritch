/**
 * Raising a masterwork, in the store (BRDC-PROG-006).
 *
 * The rules are pure (`rules/masterwork.ts`); this reads the realm, pays the cost, and
 * turns the host into the masterwork on the same hex — the fifth Watchtower is not
 * consumed, it becomes the Fortress. The host's hands are released (the masterwork is a
 * different building). A Manor adds its housing to the Keep record. Season 2 only.
 */
import { MASTERWORKS, MASTERWORK_IDS, isDormant, ladder } from '../rules/masterwork.js';
import type { Need } from '../rules/masterwork.js';
import type { MasterworkId } from '../rules/lore.js';
import { worksOn } from '../rules/build.js';
import { canAfford, spend } from '../rules/terrain.js';
import type { ResourcePool } from '../rules/terrain.js';
import { staffKey } from '../rules/staffing.js';
import { readLore } from './loreStore.js';
import { commit, settlePouch } from './pouch.js';
import { worksViewAt } from './worksStore.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell } from '../types/domain.js';

export interface MasterworkRow {
  id: MasterworkId;
  needs: Need[];
  met: number;
  cost: Partial<ResourcePool>;
  gives: string;
  /** Standing somewhere in the realm, and whether it has gone dormant. */
  standing: boolean;
  dormant: boolean;
  ready: boolean;
}

export type RaiseOutcome = { ok: true; h3: string } | { ok: false; refused: 'no-keep' | 'not-ready' | 'cannot-afford' };

export interface MasterworkApi {
  view(now: number): Promise<MasterworkRow[] | null>;
  raise(id: MasterworkId, now: number): Promise<RaiseOutcome>;
}

export function masterworkApi(store: () => KeyValueStore, owned: (now: number) => Promise<readonly Cell[]>): MasterworkApi {
  const levels = async (cells: readonly Cell[]) => {
    const out = new Map<string, number>();
    for (const c of cells) out.set(c.h3, (await worksViewAt(store(), c))?.level ?? 0);
    return (c: Cell) => out.get(c.h3) ?? 0;
  };

  return {
    view: async (now) => {
      const cells = await owned(now);
      const state = await settlePouch(store(), cells, now);
      if (!state.keep) return null;
      const lore = await readLore(store());
      const levelOf = await levels(cells);
      return MASTERWORK_IDS.map((id) => {
        const { needs, host } = ladder(id, cells, lore, levelOf);
        const standing = cells.some((c) => worksOn(c).some((w) => w.id === MASTERWORKS[id].becomes));
        return {
          id,
          needs,
          met: needs.filter((n) => n.met).length,
          cost: MASTERWORKS[id].cost,
          gives: MASTERWORKS[id].gives,
          standing,
          dormant: standing && isDormant(id, cells),
          ready: !standing && host !== null && needs.every((n) => n.met),
        };
      });
    },

    raise: async (id, now) => {
      const cells = await owned(now);
      const state = await settlePouch(store(), cells, now);
      const keep = state.keep;
      if (!keep) return { ok: false, refused: 'no-keep' };
      const m = MASTERWORKS[id];
      const { needs, host } = ladder(id, cells, await readLore(store()), await levels(cells));
      if (!host || !needs.every((n) => n.met)) return { ok: false, refused: 'not-ready' };
      if (!canAfford(state.pool, m.cost)) return { ok: false, refused: 'cannot-afford' };
      const pool = spend(state.pool, m.cost);
      if (!pool) return { ok: false, refused: 'cannot-afford' };

      const buildings = worksOn(host).map((w) => (w.id === m.host ? { id: m.becomes, builtAt: now } : w));
      await store().set(K.cell(host.h3), { ...host, buildings });
      const staff = { ...(keep.staff ?? {}) };
      delete staff[staffKey(host.h3, m.host)];
      const extraHousing = (keep.extraHousing ?? 0) + (id === 'manor' ? 3 : 0);
      await commit(store(), now, (cur) => ({ ...cur, pool, keep: { ...(cur.keep ?? keep), staff, extraHousing } }));
      await writeLogEntry(store(), { at: now, kind: 'build', ref: m.becomes });
      return { ok: true, h3: host.h3 };
    },
  };
}
