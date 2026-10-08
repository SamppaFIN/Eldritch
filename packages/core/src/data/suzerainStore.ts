/**
 * Envoys and suzerains, in the store (BRDC-SUZERAIN-001).
 *
 * A realm's envoys are read from its finished village tasks (`K.tasks`). Who leads a
 * village is decided against the other realms' envoys from the shared world when there
 * are any, and against nobody when there are not; the villages this realm leads are kept
 * (`K.suzerain`) so the yield model can pay their speciality without a network.
 */
import { SUZERAIN_MIN, envoysFrom, suzerainOf } from '../rules/suzerain.js';
import type { CityStateId } from '../rules/cityState.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';

export interface EnvoyRow {
  playerId: string;
  name?: string;
  envoys: Partial<Record<CityStateId, number>>;
}

export interface VillageStanding {
  mine: number;
  need: number;
  /** Who leads it: `'you'`, another realm's name or id, or null for nobody yet. */
  leader: 'you' | string | null;
}

export interface SuzerainApi {
  /** This realm's envoys to every village. */
  envoys(): Promise<Partial<Record<CityStateId, number>>>;
  /** Decide a village's suzerain against `others` (null: alone) and keep whether it is you. */
  standing(city: CityStateId, me: string, others: readonly EnvoyRow[] | null): Promise<VillageStanding>;
}

export function suzerainApi(store: () => KeyValueStore): SuzerainApi {
  const envoys = async () => envoysFrom((await store().get<{ outcomes: Record<string, { status: string }> }>(K.tasks))?.outcomes ?? {});
  return {
    envoys,
    async standing(city, me, others) {
      const mine = (await envoys())[city] ?? 0;
      const rows = [...(others ?? []).filter((r) => r.playerId !== me).map((r) => ({ playerId: r.playerId, envoys: r.envoys[city] ?? 0 })), { playerId: me, envoys: mine }];
      const leaderId = suzerainOf(rows);
      const led = new Set((await store().get<CityStateId[]>(K.suzerain)) ?? []);
      const before = led.has(city);
      if (leaderId === me) led.add(city);
      else led.delete(city);
      if (led.has(city) !== before) await store().set(K.suzerain, [...led]);
      const other = others?.find((r) => r.playerId === leaderId);
      return { mine, need: SUZERAIN_MIN, leader: leaderId === null ? null : leaderId === me ? 'you' : (other?.name ?? leaderId) };
    },
  };
}
