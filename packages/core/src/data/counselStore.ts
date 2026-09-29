/**
 * The Keeper's Counsel, read from the realm (BRDC-COUNSEL-001).
 *
 * The rules are pure (`rules/counsel.ts`); this gathers what they read — the granary, the
 * gates, the stores, idle hands, the Lore, the masterworks — and keeps which codex cards
 * have been read (`K.codexRead`, a forever key: the Counsel stops explaining what you
 * already know, season after season). Reached through `repository.keep`.
 */
import { CODEX_CARDS, counselOf } from '../rules/counsel.js';
import type { Counsel } from '../rules/counsel.js';
import { foodBalance, keepHousing } from '../rules/citizens.js';
import { growBox } from '../rules/balance.js';
import { staffKey } from '../rules/staffing.js';
import { worksOn } from '../rules/build.js';
import { BUILDING_NAMES_PLAIN } from './counselNames.js';
import { LORE, LORE_IDS, ageOf, loreCost } from '../rules/lore.js';
import { MASTERWORK_IDS, ladder } from '../rules/masterwork.js';
import { STORE_MS } from '../rules/citizens.js';
import { forecastRates, settlePouch } from './pouch.js';
import { readLore } from './loreStore.js';
import { worksViewAt } from './worksStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell } from '../types/domain.js';

const MASTERWORK_NAME: Record<string, string> = {
  fortress: 'The Fortress', manor: 'The Manor', foundry: 'The Foundry', exchange: 'The Exchange', 'sunken-cathedral': 'The Sunken Cathedral',
};

/** Counsel for a Season 2 realm; null on a Season 1 save. */
export async function counselFor(store: KeyValueStore, cells: readonly Cell[], now: number): Promise<Counsel[] | null> {
  const state = await settlePouch(store, cells, now);
  const keep = state.keep;
  if (!keep) return null;
  const lore = await readLore(store);
  const age = ageOf(lore);
  const produced = (await forecastRates(store, cells, now)).perHour.food ?? 0;
  const staff = keep.staff ?? {};
  const busy = Object.values(staff).reduce((s, n) => s + n, 0);
  const empty = cells.flatMap((c) => worksOn(c).filter((w) => (staff[staffKey(c.h3, w.id)] ?? 0) === 0).map((w) => w.id))[0] ?? null;

  const levels = new Map<string, number>();
  for (const c of cells) levels.set(c.h3, (await worksViewAt(store, c))?.level ?? 0);
  let nearly: { name: string; missing: string } | null = null;
  for (const id of MASTERWORK_IDS) {
    const { needs } = ladder(id, cells, lore, (c) => levels.get(c.h3) ?? 0);
    const missing = needs.filter((n) => !n.met);
    if (missing.length === 1) {
      nearly = { name: MASTERWORK_NAME[id] ?? id, missing: (missing[0] as { text: string }).text };
      break;
    }
  }
  const open = LORE_IDS.filter((id) => !lore.includes(id) && LORE[id].age <= age);
  const cheapest = open[0] ? { name: LORE[open[0]].name, cost: loreCost(LORE[open[0]].age) } : null;
  const inAge = LORE_IDS.filter((id) => LORE[id].age === age && lore.includes(id)).length;

  return counselOf({
    foodBalance: foodBalance(produced, keep.granary.citizens),
    granaryBox: keep.granary.box,
    gatesNear: keep.gatesNear ?? 0,
    storesLeftH: keep.titheAt === undefined ? null : Math.max(0, (keep.titheAt + STORE_MS - now) / 3_600_000),
    idle: keep.granary.citizens - busy,
    emptyWork: empty ? BUILDING_NAMES_PLAIN[empty] ?? empty : null,
    toNextAge: age >= 5 ? 99 : Math.max(0, 3 - inAge),
    masterworkNearly: nearly,
    citizens: keep.granary.citizens,
    housing: keepHousing(keep),
    granaryFill: keep.granary.box / growBox(keep.granary.citizens),
    cheapestTech: cheapest,
  });
}

/** The first codex card not yet read, or null. */
export async function unreadCodex(store: KeyValueStore): Promise<(typeof CODEX_CARDS)[number] | null> {
  const read = (await store.get<string[]>(K.codexRead)) ?? [];
  return CODEX_CARDS.find((c) => !read.includes(c.id)) ?? null;
}

export async function markCodexRead(store: KeyValueStore, id: string): Promise<void> {
  const read = (await store.get<string[]>(K.codexRead)) ?? [];
  if (!read.includes(id)) await store.set(K.codexRead, [...read, id]);
}
