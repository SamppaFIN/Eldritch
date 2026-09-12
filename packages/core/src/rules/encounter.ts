/**
 * Something happens when you step somewhere new (BRDC-EVENT-002).
 *
 * From the field: *"En saanut myöskään yhtään random encounteria tai yllätystä, vaikka
 * kuljin pitkän matkan."* A long walk outdoors and the game said nothing surprising once.
 * Anomalies exist but they are rare and bound to a place; to somebody walking, the game
 * was silent. Without encounters a walk is bookkeeping, and bookkeeping gets nobody back
 * out of the door.
 *
 * Three rules, and the first two are the same ones `reveal.ts` and `bounty.ts` follow:
 *
 * 1. **Deterministic from the hex and the day.** Never `Math.random()`. Two players on the
 *    same street on the same day meet the same thing, a reload does not re-roll it, and
 *    Phase 5's golden fixtures have something to agree about.
 * 2. **Bound to its ground** where it makes sense. A fisherman is not met on a mountain.
 * 3. **Capped.** A walk must not become a run of popups, so the caps are checked against
 *    what actually fired. They are the caller's to count, which is why they are arguments
 *    here rather than state.
 *
 * The stories are `data/encounters.json`, validated on load the way `chains.json` is. This
 * file is the machinery and holds none of them.
 */
import { DAILY_OMEN_CHANCE, ENCOUNTER_CHANCE } from './constants.js';
import type { ChainEffect } from './chain.js';
import type { TerrainKind } from './terrain.js';
import type { H3Index } from '../types/domain.js';

/**
 * The five kinds the ticket asks for, and they are a writing brief as much as a type:
 * a find, a person, weather and sound, the wrong place, a small choice.
 */
export type EncounterKind = 'find' | 'person' | 'weather' | 'wrong-place' | 'choice';

export interface EncounterChoice {
  text: string;
  effect?: ChainEffect;
}

export interface Encounter {
  id: string;
  kind: EncounterKind;
  /** Ground it can happen on. Absent means anywhere. */
  where?: readonly TerrainKind[];
  /** Who is speaking, when anybody is. */
  speaker?: string;
  text: string;
  /**
   * At least one, and none of them continues anywhere: an encounter is a moment, not a
   * chain. `chains.json` is where a story with stages belongs.
   */
  choices: readonly EncounterChoice[];
  /**
   * True when this one points at a wonder (BRDC-WONDER-001).
   *
   * The app turns it into a bearing and a distance, never a coordinate — the ticket is
   * explicit, and a hex index handed over in dialogue would end the search rather than
   * start it.
   */
  hint?: boolean;
}

/** FNV-1a over the salted key — the same spread every other roll in this codebase uses. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/**
 * Whether this hex, on this day, has anything to say.
 *
 * Pure and free of caps on purpose: this is the half that must be identical on every
 * device, and a cap depends on what that particular player has already seen today.
 */
export function rollsEncounter(h3: H3Index, day: string): boolean {
  return hash(`encounter:${day}:${h3}`) < ENCOUNTER_CHANCE;
}

/** Whether the day itself has something, for a player who never left the house. */
export function rollsDailyOmen(playerId: string, day: string): boolean {
  return hash(`omen:${day}:${playerId}`) < DAILY_OMEN_CHANCE;
}

/**
 * The encounters that could happen on this ground, in table order.
 *
 * An encounter with no `where` fits anywhere, which is most of them: tying every story to
 * a terrain would make a city player meet the same six things forever.
 */
export function encountersFor(
  library: readonly Encounter[],
  terrain: TerrainKind,
): Encounter[] {
  return library.filter((e) => !e.where || e.where.includes(terrain));
}

/**
 * Which encounter this hex holds today, or null when the library has nothing for it.
 *
 * Chosen by a second, differently salted roll so that *whether* something happens and
 * *what* happens are independent — sharing one roll would make the rarest ground always
 * draw from the same end of the table.
 */
export function encounterAt(
  library: readonly Encounter[],
  h3: H3Index,
  day: string,
  terrain: TerrainKind,
): Encounter | null {
  if (!rollsEncounter(h3, day)) return null;
  return pickEncounter(library, `${day}:${h3}`, terrain);
}

/**
 * Draw one encounter that fits this ground, keyed by whatever the caller salts it with.
 *
 * Separate from `encounterAt` because the daily omen has already decided that something
 * happens and only needs to know what. Routing it through `encounterAt` made it roll the
 * *hex* dice as well — one chance in seven on top of its own — so an omen fired about five
 * times in a hundred days instead of thirty-five. It is the one thing in this ticket a
 * player is supposed to be waiting for, and it was almost silent. Caught by its own test.
 */
export function pickEncounter(
  library: readonly Encounter[],
  key: string,
  terrain: TerrainKind,
): Encounter | null {
  const fitting = encountersFor(library, terrain);
  if (fitting.length === 0) return null;
  const pick = Math.floor(hash(`pick:${key}`) * fitting.length);
  return fitting[Math.min(pick, fitting.length - 1)] ?? null;
}

/**
 * Read an encounter library, throwing on anything malformed.
 *
 * At load, not at play — the same discipline `parseChains` and `parseAdventures` take. A
 * story that breaks should break the build, not a walk in the rain.
 */
export function parseEncounters(raw: unknown): Encounter[] {
  if (!Array.isArray(raw)) throw new Error('encounters: not an array');
  const kinds: EncounterKind[] = ['find', 'person', 'weather', 'wrong-place', 'choice'];
  const seen = new Set<string>();

  return raw.map((value, i) => {
    const e = value as Partial<Encounter>;
    if (typeof e.id !== 'string' || e.id === '') throw new Error(`encounter ${i}: needs an id`);
    if (seen.has(e.id)) throw new Error(`encounter "${e.id}": duplicate id`);
    seen.add(e.id);
    if (!kinds.includes(e.kind as EncounterKind)) {
      throw new Error(`encounter "${e.id}": kind must be one of ${kinds.join(', ')}`);
    }
    if (typeof e.text !== 'string' || e.text === '') {
      throw new Error(`encounter "${e.id}": needs text`);
    }
    if (!Array.isArray(e.choices) || e.choices.length === 0) {
      throw new Error(`encounter "${e.id}": needs at least one choice`);
    }
    for (const [c, choice] of e.choices.entries()) {
      if (typeof choice?.text !== 'string' || choice.text === '') {
        throw new Error(`encounter "${e.id}" choice ${c}: needs text`);
      }
    }
    return e as Encounter;
  });
}
