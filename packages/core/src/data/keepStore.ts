/**
 * The Keep's economy, in the store (BRDC-KEEP-002).
 *
 * The maths is pure (`rules/mana.js`): `manaRate` and `expandTemple`. This is
 * the seam that touches the store — the same shape as `templeStore.js` and `wagerRepo.js`,
 * lifted out of MockRepository to keep it under its line limit.
 *
 * The Altar is the Anchor invested in: raising it moves the Anchor cell's entry in
 * `K.expansions`, which `manaRate` already reads.
 * A place pays its rate into mana **and** wisdom (PIVOT-2026-09-09 P3); channelling one
 * into the other is gone with it.
 */
import { expandTemple, placesWithMana } from '../rules/mana.js';
import type { ExpandRefusal } from '../rules/mana.js';
import { placesWithHome } from '../rules/dwell.js';
import type { DwellMap } from '../rules/dwell.js';
import { readExpansions } from './templeStore.js';
import { settlePouch, writePouch } from './pouch.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index, RevealedPlace } from '../types/domain.js';

export type AltarOutcome =
  | { ok: true; level: number }
  | { ok: false; refused: ExpandRefusal | 'not-the-altar' };

/** The public reads a Keep verb needs — MockRepository is passed as `this`. */
export interface KeepDeps {
  getHome(): Promise<H3Index | null>;
  getPlaces(): Promise<RevealedPlace[]>;
  getOwnedCells(now: number): Promise<Cell[]>;
}

/** The Anchor and any revealed temples, each with its expansion level and mana rate. */
export async function readPlaces(
  store: KeyValueStore,
  getHome: () => Promise<H3Index | null>,
): Promise<RevealedPlace[]> {
  const dwell = (await store.get<DwellMap>(K.dwell)) ?? {};
  return placesWithMana(placesWithHome(dwell, await getHome()), await readExpansions(store));
}

export async function readDwellFor(store: KeyValueStore, h3: string): Promise<number> {
  return ((await store.get<DwellMap>(K.dwell)) ?? {})[h3] ?? 0;
}

/** Raise the Altar (the Anchor cell) one expansion step, paying stone and gold. */
export async function raiseAltarFor(
  store: KeyValueStore,
  d: KeepDeps,
  now: number,
): Promise<AltarOutcome> {
  const home = await d.getHome();
  const anchor = (await d.getPlaces()).find((p) => p.h3 === home && p.kind === 'anchor');
  if (!home || !anchor) return { ok: false, refused: 'not-the-altar' };

  const state = await settlePouch(store, await d.getOwnedCells(now), now);
  const expansions = await readExpansions(store);
  const r = expandTemple(expansions[home] ?? 0, state.pool);
  if (!r.ok) return r;

  await writePouch(store, r.pool, now);
  await store.set(K.expansions, { ...expansions, [home]: r.level });
  await writeLogEntry(store, { at: now, kind: 'mana', ref: 'altar', count: r.level });
  return { ok: true, level: r.level };
}

