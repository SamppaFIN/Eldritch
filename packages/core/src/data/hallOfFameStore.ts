/**
 * Retiring a kingdom, in the store (BRDC-HALL-001).
 *
 * "Delete progress" (`resetAll`) is the panic button: everything gone, nothing kept,
 * exactly as its own dialog says. Retiring is a different, designed act — the kingdom
 * ends on purpose, and what it became is worth keeping. So this snapshots the figures a
 * walker would actually recognise as "what I built" (ground, souls, provinces,
 * achievements, the things found), archives them, and only then does the same wipe
 * `resetAll` does — restoring the one key the wipe would otherwise have taken with it.
 */
import { buildingsOf } from '../rules/build.js';
import { levelState } from '../rules/level.js';
import { population, provinceCount } from '../rules/nation.js';
import { totalAreaM2 } from '../geo/cells.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, PlayerProfile } from '../types/domain.js';

export interface HallOfFameEntry {
  id: string;
  name: string;
  retiredAt: number;
  level: number;
  xp: number;
  cells: number;
  areaM2: number;
  population: number;
  provinces: number;
  achievements: number;
  secretSites: number;
  wonders: number;
  cipherShards: number;
  /** The chronicle shown for this kingdom — AI-written, or `kingdomChronicle.js`'s local
   *  fallback if the Worker could not be reached. Absent until first revealed
   *  (BRDC-HALL-002), so revealing costs nothing for a kingdom nobody looks back at. */
  story?: string;
}

export async function readHallOfFame(store: KeyValueStore): Promise<HallOfFameEntry[]> {
  return (await store.get<HallOfFameEntry[]>(K.hallOfFame)) ?? [];
}

/** Attach a chronicle to one archived kingdom, once — read back on every later visit. */
export async function setKingdomStory(
  store: KeyValueStore,
  id: string,
  story: string,
): Promise<void> {
  const archive = await readHallOfFame(store);
  const next = archive.map((e) => (e.id === id ? { ...e, story } : e));
  await store.set(K.hallOfFame, next);
}

async function countAt(store: KeyValueStore, key: string): Promise<number> {
  const value = await store.get<Record<string, unknown> | unknown[]>(key);
  if (value === undefined) return 0;
  return Array.isArray(value) ? value.length : Object.keys(value).length;
}

export async function retireKingdom(
  store: KeyValueStore,
  profile: PlayerProfile,
  owned: readonly Cell[],
  now: number,
  newId: () => string,
): Promise<HallOfFameEntry> {
  const buildings = buildingsOf(owned).length;
  const [achievements, secretSites, wonders, cipherShards] = await Promise.all([
    countAt(store, K.achievements),
    countAt(store, K.questFinds),
    countAt(store, K.wonderFinds),
    countAt(store, K.cipherShards),
  ]);

  const entry: HallOfFameEntry = {
    id: newId(),
    name: profile.name,
    retiredAt: now,
    level: levelState(profile.xp).level,
    xp: profile.xp,
    cells: owned.length,
    areaM2: totalAreaM2(owned.map((c) => c.h3)),
    population: population(owned.length, buildings),
    provinces: provinceCount(owned),
    achievements,
    secretSites,
    wonders,
    cipherShards,
  };

  const archive = [...(await readHallOfFame(store)), entry];
  await store.clear();
  await store.set(K.hallOfFame, archive);
  return entry;
}
