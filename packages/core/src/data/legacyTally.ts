/**
 * The Legacy tally, read from the store (BRDC-SEASON-003).
 *
 * The scoring is pure (`rules/legacy.ts`); this counts what the realm really has. It works
 * on any save: a Season 1 realm has cells, wonders and finished quests and nothing else,
 * and scores exactly that — which is how Season 1 closes when v0.7.0 opens Season 2.
 */
import { EMPTY_COUNTS, legacyOf } from '../rules/legacy.js';
import type { Legacy } from '../rules/legacy.js';
import type { SeasonOutcome } from '../rules/season.js';
import { MASTERWORKS, MASTERWORK_IDS, isDormant } from '../rules/masterwork.js';
import { worksOn } from '../rules/build.js';
import { realmSanity } from '../rules/sanity.js';
import { isOpen } from '../rules/gate.js';
import type { Gate } from '../rules/gate.js';
import type { RiteBook } from '../rules/rites.js';
import { hexDistance } from '../geo/cells.js';
import { readLore } from './loreStore.js';
import { settlePouch } from './pouch.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index } from '../types/domain.js';

export interface LegacyApi {
  /** What the realm would leave if the season closed now, under `outcome`. */
  tally(now: number, outcome?: SeasonOutcome): Promise<Legacy>;
}

export function legacyApi(store: () => KeyValueStore, owned: (now: number) => Promise<readonly Cell[]>): LegacyApi {
  return {
    tally: async (now, outcome) => {
      const cells = await owned(now);
      const held = new Set(cells.map((c) => c.h3));
      const { keep } = await settlePouch(store(), cells, now);
      const [lore, rites, gatesS, rumoursS, reckoningS, wondersS, homeS] = await Promise.all([
        readLore(store()),
        store().get<RiteBook>(K.rites),
        store().get<{ gates: Gate[] }>(K.gates),
        store().get<{ done: H3Index[] }>(K.rumours),
        store().get<{ dealt: number }>(K.reckoning),
        store().get<Record<string, { h3: H3Index }>>(K.wonderFinds),
        store().get<H3Index>(K.home),
      ]);
      const gates = gatesS?.gates ?? [];
      const standing = (id: (typeof MASTERWORK_IDS)[number]) => cells.some((c) => worksOn(c).some((w) => w.id === MASTERWORKS[id].becomes));
      const raised = MASTERWORK_IDS.filter(standing);
      // Under a Risen lake, a Keep within two rings of an open gate has fallen.
      const fallen = outcome === 'risen' && !!homeS && gates.some((g) => isOpen(g) && hexDistance(g.h3, homeS) <= 2);

      return legacyOf(
        {
          ...EMPTY_COUNTS,
          cells: cells.length,
          citizens: keep?.granary.citizens ?? 0,
          masterworks: raised.filter((id) => !isDormant(id, cells)).length,
          dormantMasterworks: raised.filter((id) => isDormant(id, cells)).length,
          lore: lore.length,
          spellRanks: Object.values(rites?.learned ?? {}).reduce<number>((s, r) => s + (r ?? 0), 0),
          gatesSealed: gates.filter((g) => !isOpen(g)).length,
          quests: cells.filter((c) => c.anomaly?.done).length + (rumoursS?.done.length ?? 0),
          wonders: Object.values(wondersS ?? {}).filter((w) => held.has(w.h3)).length,
          damage: reckoningS?.dealt ?? 0,
          sane: keep ? realmSanity(cells, keep.staff ?? {}, keep.granary.citizens, keep.gatesNear) >= 0 : false,
          keepLevel: keep?.level ?? 0,
          keepStanding: !!keep && !fallen,
        },
        outcome,
      );
    },
  };
}
