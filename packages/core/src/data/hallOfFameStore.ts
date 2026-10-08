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
import { resetForSeason } from './seasonReset.js';
import { buildingsOf } from '../rules/build.js';
import { levelState } from '../rules/level.js';
import { population, provinceCount } from '../rules/nation.js';
import { totalAreaM2 } from '../geo/cells.js';
import { K } from './keys.js';
import { PERSONAL_TASKS } from '../rules/personalTasks.js';
import { archetypeOf } from '../rules/archetype.js';
import { eraChain } from '../rules/era.js';
import { greatSaid } from './greatStore.js';
import type { EraId } from '../rules/era.js';
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
  /** A free, player-written label for when this kingdom stood — "Stone Age", or
   *  whatever they choose (BRDC-HALL-003). Purely flavour, never validated. */
  era?: string;
  /** When this entry was last published to the shared Chronicles, if ever
   *  (BRDC-HALL-003) — lets `HallOfFamePanel` offer "Share" once, then "Shared". */
  sharedAt?: number;
  /** A picture of the map was kept at retirement, under `K.chronicleImages` (BRDC-HALL-004). */
  image?: true;
  /** The investigator's own tale, when it was finished (BRDC-INVEST-002): "The Librarian · Where Books Go to Rest". */
  tale?: string;
  /** The season's ambition and whether it was met (BRDC-AMBITION-001): "Keeper of Temples · met". */
  ambition?: string;
  /** The realm's character at each Age, as a chain: "Merchants → Seers" (BRDC-ERA-001). */
  eras?: string;
  /** The great people whose deed was done this season (BRDC-GREAT-001). */
  greats?: string;
}

export async function readHallOfFame(store: KeyValueStore): Promise<HallOfFameEntry[]> {
  return (await store.get<HallOfFameEntry[]>(K.hallOfFame)) ?? [];
}

/** Mark one archived kingdom as shared to the Chronicles (BRDC-HALL-003) — a manual
 *  action, not automatic, so a kingdom retired before this feature existed (or on a
 *  device that stays offline) is only ever published when its player chooses to. */
export async function setKingdomShared(
  store: KeyValueStore,
  id: string,
  sharedAt: number,
): Promise<void> {
  const archive = await readHallOfFame(store);
  const next = archive.map((e) => (e.id === id ? { ...e, sharedAt } : e));
  await store.set(K.hallOfFame, next);
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

/** The investigator's finished tale, said as the Hall keeps it, or null (BRDC-INVEST-002). */
async function finishedTale(store: KeyValueStore): Promise<string | null> {
  const book = await store.get<{ outcomes?: Record<string, { status: string }> }>(K.tasks);
  const done = PERSONAL_TASKS.find((t) => t.finale && book?.outcomes?.[t.id]?.status === 'completed');
  const who = done?.personal ? archetypeOf(done.personal) : null;
  return done && who ? `${who.title} · ${done.title}` : null;
}

export async function retireKingdom(
  store: KeyValueStore,
  profile: PlayerProfile,
  owned: readonly Cell[],
  now: number,
  newId: () => string,
  /** A free label for when this kingdom stood, e.g. "Stone Age" (BRDC-HALL-003). */
  era?: string,
  /** The season's ambition as `ambitionSaid` says it (BRDC-AMBITION-001). */
  ambition?: string | null,
): Promise<HallOfFameEntry> {
  const buildings = buildingsOf(owned).length;
  const [achievements, secretSites, wonders, cipherShards, tale, eras, greats] = await Promise.all([
    countAt(store, K.achievements),
    countAt(store, K.questFinds),
    countAt(store, K.wonderFinds),
    countAt(store, K.cipherShards),
    finishedTale(store),
    store.get<EraId[]>(K.eras),
    greatSaid(store),
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
    ...(era?.trim() ? { era: era.trim().slice(0, 60) } : {}),
    ...(tale ? { tale } : {}),
    ...(ambition ? { ambition } : {}),
    ...(eras?.length ? { eras: eraChain(eras) } : {}),
    ...(greats ? { greats } : {}),
  };

  await store.set(K.hallOfFame, [...(await readHallOfFame(store)), entry]);
  await resetForSeason(store);
  return entry;
}
