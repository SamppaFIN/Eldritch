/**
 * The researched-technology list, in the store (BRDC-TECH-001).
 *
 * The tree and the spend rule are pure (`rules/tech.js`); `researchWith` moves the wisdom
 * (`pouch.js`, beside `wardWith`). This is the thin seam that owns the list itself and the
 * era boundary — split out so MockRepository does not grow a fourth verb inline.
 */
import { TECHS, eraChanged } from '../rules/tech.js';
import type { TechId, TechResult } from '../rules/tech.js';
import { DORMANT_AFTER_MS } from '../rules/terrain.js';
import { placesWithHome } from '../rules/dwell.js';
import type { DwellMap } from '../rules/dwell.js';
import { researchWith } from './pouch.js';
import { readTempleSchools } from './templeStore.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index } from '../types/domain.js';

export async function readResearched(store: KeyValueStore): Promise<TechId[]> {
  return (await store.get<TechId[]>(K.researched)) ?? [];
}

/**
 * Every school with an awake temple behind it (BRDC-TEMPLE-002) — existence, not a count:
 * two fire temples are the same as one. `placesWithHome` already knows which owned cells
 * are temples; "awake" is the same 48 h dormancy clock mana and terrain both use.
 */
async function awakeSchools(
  store: KeyValueStore,
  owned: readonly Cell[],
  home: H3Index | null,
  now: number,
) {
  const dwell = (await store.get<DwellMap>(K.dwell)) ?? {};
  const schools = await readTempleSchools(store);
  const byH3 = new Map(owned.map((c) => [c.h3, c]));
  const open = new Set<string>();
  for (const place of placesWithHome(dwell, home)) {
    if (place.kind !== 'temple') continue;
    const cell = byH3.get(place.h3);
    if (!cell || now - cell.lastVisitedAt > DORMANT_AFTER_MS) continue;
    const school = schools[place.h3];
    if (school) open.add(school);
  }
  return open;
}

/**
 * Research one technology and persist it. `era` is set only when this research completed
 * the previous era — the moment the caller marks with a ceremony.
 *
 * A technology with a school (BRDC-TEMPLE-002) needs an awake temple of that school —
 * checked before the pouch is ever touched, the same order `consecrateAt` refuses in.
 */
export async function researchTech(
  store: KeyValueStore,
  id: TechId,
  owned: readonly Cell[],
  home: H3Index | null,
  now: number,
): Promise<TechResult> {
  const school = TECHS[id].school;
  if (school && !(await awakeSchools(store, owned, home, now)).has(school)) {
    return { ok: false, refused: 'needs-a-temple' };
  }

  const before = await readResearched(store);
  const result = await researchWith(store, before, id, owned, now);
  if (!result.ok) return result;

  await store.set(K.researched, result.researched);
  await writeLogEntry(store, { at: now, kind: 'research', ref: id });
  return { ok: true, researched: result.researched, era: eraChanged(before, result.researched) };
}
