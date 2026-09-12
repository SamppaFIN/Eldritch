/**
 * Encounters, through the store (BRDC-EVENT-002).
 *
 * `encounters.json` is data, validated once here at load — the same seam `chainStore` and
 * `adventureStore` use, and for the same reason: a story with a typo in it should break
 * the build rather than a walk in the rain.
 *
 * What this file owns that `rules/encounter.ts` cannot is the counting. Whether a hex has
 * something to say is a pure function of the hex and the day; whether the player is
 * *allowed* to hear it depends on how many they have already heard today, and that is
 * state. The caps live here so the roll stays identical on every device.
 */
import raw from './encounters.json';
import { parseEncounters, encounterAt, pickEncounter, rollsDailyOmen } from '../rules/encounter.js';
import type { Encounter } from '../rules/encounter.js';
import { ENCOUNTER_MAX_PER_DAY, ENCOUNTER_MAX_PER_HOUR } from '../rules/constants.js';
import { terrainForCell, terrainOf } from '../rules/terrain.js';
import { utcDay } from '../rules/day.js';
import { writeLogEntry } from './logStore.js';
import { applyChoice } from '../rules/chain.js';
import type { Chain, ChoiceRefusal } from '../rules/chain.js';
import { settlePouch, writePouch } from './pouch.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index } from '../types/domain.js';

export type ChoiceOutcome =
  | { ok: true; next: 'end'; xp: number }
  | { ok: false; refused: ChoiceRefusal };

const LIBRARY: readonly Encounter[] = parseEncounters(raw);

/** The whole library, for a Guide page and for tests. */
export function encounterLibrary(): readonly Encounter[] {
  return LIBRARY;
}

export function encounterById(id: string): Encounter | null {
  return LIBRARY.find((e) => e.id === id) ?? null;
}

/**
 * When each recent encounter fired, newest last.
 *
 * Timestamps rather than counters, because the hourly cap is a rolling window and a
 * counter would need resetting by something — and something that resets on a timer is the
 * kind of state that survives a reload wrong. Trimmed to a day on every write.
 */
type Fired = number[];

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

export async function recentEncounters(store: KeyValueStore, now: number): Promise<Fired> {
  const all = (await store.get<Fired>(K.encounters)) ?? [];
  return all.filter((at) => now - at < DAY_MS);
}

/** True while the player has room for another one. Both ceilings, cheapest first. */
export function withinCaps(fired: Fired, now: number): boolean {
  if (fired.length >= ENCOUNTER_MAX_PER_DAY) return false;
  return fired.filter((at) => now - at < HOUR_MS).length < ENCOUNTER_MAX_PER_HOUR;
}

async function record(store: KeyValueStore, id: string, now: number): Promise<void> {
  const fired = await recentEncounters(store, now);
  await store.set<Fired>(K.encounters, [...fired, now]);
  // `ref` is a slug the app resolves to a name, the same as a Work or a Rite.
  await writeLogEntry(store, { at: now, kind: 'encounter', ref: id });
}

/**
 * What this newly entered hex has to say, or null.
 *
 * Called on a step-claim, which is the moment "somewhere new" actually means something.
 * Order matters: the caps are checked before the roll so that a capped player's walk does
 * not silently consume the encounters the hexes held — the roll is deterministic, so those
 * hexes still hold them tomorrow.
 */
export async function encounterOnStep(
  store: KeyValueStore,
  h3: H3Index,
  now: number,
): Promise<Encounter | null> {
  const fired = await recentEncounters(store, now);
  if (!withinCaps(fired, now)) return null;

  /*
   * One keyed read, not `getOwnedCells`.
   *
   * The first version took the whole owned set to find one cell, which is a full decay
   * sweep on the hot path of every single step-claim — the exact shape of BRDC-ECON-009,
   * where repeated expensive reads starved everything behind them. `step-claim.spec`
   * noticed: nine legs of a walk committed two instead of four.
   *
   * A missing row falls back to the hash, which is what `terrainForCell` would do anyway.
   */
  const stored = await store.get<Cell>(K.cell(h3));
  const terrain = stored ? terrainForCell(stored).kind : terrainOf(h3).kind;

  const found = encounterAt(LIBRARY, h3, utcDay(now), terrain);
  if (!found) return null;

  await record(store, found.id, now);
  return found;
}

/**
 * The once-a-day roll that needs no feet.
 *
 * Infinite asked for exactly this: *"Kerran päivässä ruudulla voi tapahtua jollain
 * prosentilla jotain."* Keyed on the player and the day, so it is one chance and not one
 * per app launch — the stored day is what stops a player re-rolling it by reopening.
 */
export async function dailyOmen(
  store: KeyValueStore,
  playerId: string,
  home: H3Index | null,
  now: number,
): Promise<Encounter | null> {
  const day = utcDay(now);
  if ((await store.get<string>(K.omenDay)) === day) return null;
  await store.set<string>(K.omenDay, day);

  if (!rollsDailyOmen(playerId, day)) return null;
  // Keyed on the Hearth so the omen belongs to the player's own ground; a player with no
  // Hearth yet has not started, and gets nothing rather than a story about nowhere.
  if (!home) return null;

  // `pickEncounter`, not `encounterAt`: the omen has already decided that something
  // happens, and routing it through the hex roll would gate it a second time.
  const found = pickEncounter(LIBRARY, `omen:${day}:${playerId}`, 'plain');
  if (!found) return null;

  await record(store, found.id, now);
  return found;
}

/**
 * Take one of an encounter's choices, paying and collecting what it says.
 *
 * An encounter is wrapped as a one-stage chain so `applyChoice` does the work: it already
 * knows that a negative entry is a cost that has to be affordable and a positive one is a
 * gain, and having those rules in two places is how two systems quietly stop agreeing.
 *
 * The log line was written when the encounter fired, not here — it happened whether or not
 * the player picked anything, and a moment waved away is still a moment that happened.
 */
export async function takeEncounterChoice(
  store: KeyValueStore,
  id: string,
  choiceIndex: number,
  owned: readonly Cell[],
  now: number,
): Promise<ChoiceOutcome> {
  const encounter = encounterById(id);
  if (!encounter) return { ok: false, refused: 'no-such-stage' };

  const chain: Chain = {
    id: encounter.id,
    stages: [
      {
        text: encounter.text,
        choices: encounter.choices.map((c) => ({
          text: c.text,
          next: 'end' as const,
          ...(c.effect ? { effect: c.effect } : {}),
        })),
      },
    ],
  };

  const state = await settlePouch(store, owned, now);
  const result = applyChoice(chain, 0, choiceIndex, state.pool);
  if (!result.ok) return result;

  await writePouch(store, result.pool, now);
  return { ok: true, next: 'end', xp: result.xp };
}
