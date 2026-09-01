/**
 * Adventure state, in the store (BRDC-QUEST-001).
 *
 * `adventures.json` is data, validated once at load. This seam holds the player's
 * position in each one (`K.adventures`), advances it through the pure engine
 * (`rules/adventure.js`), applies the pouch/XP effect, and logs. It also resolves the
 * gate context from the player's ground, so the repository stays a thin caller.
 * `resetAll` clears it with the store.
 */
import { advanceAdventure, gateMet, parseAdventures } from '../rules/adventure.js';
import type { Adventure, AdventureContext } from '../rules/adventure.js';
import { terrainForCell } from '../rules/terrain.js';
import type { ResourceKind, ResourcePool } from '../rules/terrain.js';
import { settlePouch, writePouch } from './pouch.js';
import { writeLogEntry } from './logStore.js';
import { QUEST_SITE_IDS, siteCell, type SecretSiteId } from './questSites.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell } from '../types/domain.js';
import raw from './adventures.json';

const ADVENTURES: Readonly<Record<string, Adventure>> = parseAdventures(raw);

type State = { stage: string; done?: true };
type Book = Record<string, State>;

export interface AdventureChoiceView {
  text: string;
  locked: boolean;
}
export interface AdventureView {
  id: string;
  title: string;
  state: 'available' | 'active' | 'done';
  /** The current stage id, while `state` is 'active'. Drives the map's landmark reveal. */
  stageId?: string | undefined;
  speaker?: string | undefined;
  text?: readonly string[] | undefined;
  choices?: readonly AdventureChoiceView[] | undefined;
}

export type StartOutcome = { ok: true } | { ok: false; refused: 'no-such-adventure' | 'already-begun' };
export type AdventureChoiceOutcome =
  | { ok: true; xp: number; unlocks?: string; ended: boolean }
  | { ok: false; refused: 'not-active' | 'no-such-stage' | 'no-such-choice' | 'gate' | 'cannot-afford' };

const readBook = async (store: KeyValueStore): Promise<Book> =>
  (await store.get<Book>(K.adventures)) ?? {};

/** The gate context from the ground the player holds. */
function ctxOf(owned: readonly Cell[], pool: ResourcePool): AdventureContext {
  const heldH3 = new Set(owned.map((c) => c.h3));
  return {
    pool,
    terrains: new Set(owned.map((c) => terrainForCell(c).kind)),
    ownedCount: owned.length,
    heldSites: new Set(QUEST_SITE_IDS.filter((id) => heldH3.has(siteCell(id)))),
  };
}

/** Everything the Hearth panel and the dialogue need. */
export async function listAdventures(
  store: KeyValueStore,
  owned: readonly Cell[],
  pool: ResourcePool,
): Promise<AdventureView[]> {
  const book = await readBook(store);
  const ctx = ctxOf(owned, pool);
  return Object.values(ADVENTURES).map((adv) => {
    const s = book[adv.id];
    if (!s) return { id: adv.id, title: adv.title, state: 'available' };
    if (s.done) return { id: adv.id, title: adv.title, state: 'done' };
    const stage = adv.stages[s.stage];
    return {
      id: adv.id,
      title: adv.title,
      state: 'active',
      stageId: s.stage,
      speaker: stage?.speaker,
      text: stage?.text ?? [],
      choices: (stage?.choices ?? []).map((c) => ({ text: c.text, locked: !gateMet(c.requires, ctx) })),
    };
  });
}

export async function startAt(store: KeyValueStore, id: string, now: number): Promise<StartOutcome> {
  const adv = ADVENTURES[id];
  if (!adv) return { ok: false, refused: 'no-such-adventure' };
  const book = await readBook(store);
  if (book[id]) return { ok: false, refused: 'already-begun' };

  await store.set(K.adventures, { ...book, [id]: { stage: adv.start } });
  await writeLogEntry(store, { at: now, kind: 'quest', ref: id });
  return { ok: true };
}

export async function chooseAt(
  store: KeyValueStore,
  id: string,
  choiceIndex: number,
  owned: readonly Cell[],
  now: number,
): Promise<AdventureChoiceOutcome> {
  const adv = ADVENTURES[id];
  const book = await readBook(store);
  const s = book[id];
  if (!adv || !s || s.done) return { ok: false, refused: 'not-active' };

  const pool = (await settlePouch(store, owned, now)).pool;
  const r = advanceAdventure(adv, s.stage, choiceIndex, ctxOf(owned, pool));
  if (!r.ok) return r;

  const delta = r.effect.pool ?? {};
  if (Object.keys(delta).length > 0) {
    const next = { ...pool };
    for (const [k, v] of Object.entries(delta) as [ResourceKind, number][]) next[k] += v;
    await writePouch(store, next, now);
  }

  const ended = r.next === 'end';
  await store.set(K.adventures, {
    ...book,
    [id]: ended ? { stage: s.stage, done: true } : { stage: r.next as string },
  });
  if (r.unlocks) {
    const unlocked = (await store.get<string[]>(K.unlocked)) ?? [];
    if (!unlocked.includes(r.unlocks)) await store.set(K.unlocked, [...unlocked, r.unlocks]);
  }
  await writeLogEntry(store, { at: now, kind: 'quest', ref: id });
  return { ok: true, xp: r.effect.xp ?? 0, ...(r.unlocks ? { unlocks: r.unlocks } : {}), ended };
}

export async function abandonAt(store: KeyValueStore, id: string): Promise<void> {
  const book = await readBook(store);
  if (!book[id]) return;
  const { [id]: _gone, ...rest } = book;
  await store.set(K.adventures, rest);
}

/** The secret quest sites the player has walked onto. */
export async function readFinds(store: KeyValueStore): Promise<SecretSiteId[]> {
  return (await store.get<SecretSiteId[]>(K.questFinds)) ?? [];
}

/** Record a walk onto a secret site. Returns the id if it is new, `null` if already found. */
export async function recordFind(
  store: KeyValueStore,
  id: SecretSiteId,
  now: number,
): Promise<SecretSiteId | null> {
  const finds = await readFinds(store);
  if (finds.includes(id)) return null;
  await store.set(K.questFinds, [...finds, id]);
  await writeLogEntry(store, { at: now, kind: 'quest', ref: `found:${id}` });
  return id;
}
