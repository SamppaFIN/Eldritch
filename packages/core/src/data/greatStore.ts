/**
 * Great people, in the store (BRDC-GREAT-001).
 *
 * Points gather between reads at the realm's present rate, the way the pouch settles;
 * each read births whoever has been earned. A deed is used once, through the store that
 * owns the thing — sight, the pouch, the gates — and the person is kept for the Hall.
 */
import { GREAT, GREAT_KINDS, greatCost, greatName, greatRate } from '../rules/greatPeople.js';
import type { GreatKind } from '../rules/greatPeople.js';
import type { ResourceKind, ResourceState } from '../rules/terrain.js';
import { sightRings } from './revealStore.js';
import { commit, forecastRates } from './pouch.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { GateApi } from './gateStore.js';
import type { Cell, H3Index } from '../types/domain.js';

export interface GreatPerson {
  id: string;
  kind: GreatKind;
  name: string;
  bornAt: number;
  usedAt?: number;
  /** The birth card was read. */
  seen?: true;
}

interface GreatBook {
  since: number;
  points: Record<GreatKind, number>;
  people: GreatPerson[];
}

export interface GreatView {
  kinds: readonly { kind: GreatKind; title: string; points: number; need: number; perHour: number }[];
  /** Born and not yet used. */
  waiting: readonly (GreatPerson & { deedName: string; deedText: string })[];
  /** Born and not yet announced. */
  unseen: readonly GreatPerson[];
  /** Whose deed is done this season. */
  done: readonly (GreatPerson & { deedName: string })[];
}

export type GreatOutcome = { ok: true; said: string } | { ok: false; refused: 'unknown' | 'used' | 'no-home' | 'nothing-to-do' };

export interface GreatApi {
  view(now: number): Promise<GreatView>;
  markSeen(id: string): Promise<void>;
  use(id: string, now: number): Promise<GreatOutcome>;
}

const ZERO: Record<GreatKind, number> = { scholar: 0, merchant: 0, mystic: 0 };

/** The great people whose deed was done, as the Hall keeps them: "Agnes … (Great Scholar)". */
export async function greatSaid(store: KeyValueStore): Promise<string | null> {
  const used = ((await store.get<GreatBook>(K.great))?.people ?? []).filter((p) => p.usedAt !== undefined);
  return used.length ? used.map((p) => `${p.name} (${GREAT[p.kind].title})`).join(', ') : null;
}

export function greatApi(store: () => KeyValueStore, owned: (now: number) => Promise<readonly Cell[]>, gates: () => GateApi): GreatApi {
  const rateNow = async (now: number) => {
    const keep = (await store().get<ResourceState>('resources'))?.keep;
    return greatRate(await owned(now), now, keep ? (keep.staff ?? {}) : null);
  };
  const accrue = async (now: number): Promise<GreatBook> => {
    const stored = await store().get<GreatBook>(K.great);
    const b = stored ?? { since: now, points: { ...ZERO }, people: [] };
    const rate = await rateNow(now);
    const hours = Math.max(0, now - b.since) / 3_600_000;
    const points = { ...b.points };
    const people = [...b.people];
    for (const kind of GREAT_KINDS) {
      points[kind] += rate[kind] * hours;
      for (let born = people.filter((p) => p.kind === kind).length; points[kind] >= greatCost(born); born += 1) {
        points[kind] -= greatCost(born);
        people.push({ id: `${kind}-${born}`, kind, name: greatName(kind, born), bornAt: now });
      }
    }
    const next = { since: now, points, people };
    // A read writes only when someone is born or an hour has passed: the birth card reads
    // on every change of ground, and each write would queue ahead of a deed.
    if (!stored || people.length > b.people.length || now - b.since >= 3_600_000) await store().set(K.great, next);
    return next;
  };

  // Every read writes, and the birth card and the Keep read at once: one at a time, or a
  // read that began before a deed would write the deed away again.
  let queue: Promise<unknown> = Promise.resolve();
  const serial = <T>(run: () => Promise<T>): Promise<T> => {
    const next = queue.then(run, run);
    queue = next.catch(() => undefined);
    return next;
  };

  return {
    view: (now) => serial(async () => {
      const b = await accrue(now);
      const rate = await rateNow(now);
      return {
        kinds: GREAT_KINDS.map((kind) => ({
          kind,
          title: GREAT[kind].title,
          points: Math.floor(b.points[kind]),
          need: greatCost(b.people.filter((p) => p.kind === kind).length),
          perHour: rate[kind],
        })),
        waiting: b.people.filter((p) => p.usedAt === undefined).map((p) => ({ ...p, deedName: GREAT[p.kind].deedName, deedText: GREAT[p.kind].deedText })),
        unseen: b.people.filter((p) => !p.seen),
        done: b.people.filter((p) => p.usedAt !== undefined).map((p) => ({ ...p, deedName: GREAT[p.kind].deedName })),
      };
    }),

    markSeen: (id) => serial(async () => {
      const b = await store().get<GreatBook>(K.great);
      if (b) await store().set(K.great, { ...b, people: b.people.map((p) => (p.id === id ? { ...p, seen: true as const } : p)) });
    }),

    use: (id, now) => serial(async (): Promise<GreatOutcome> => {
      const b = await accrue(now);
      const person = b.people.find((p) => p.id === id);
      if (!person) return { ok: false, refused: 'unknown' };
      if (person.usedAt !== undefined) return { ok: false, refused: 'used' };
      const deed = GREAT[person.kind].deed;
      switch (deed.kind) {
        case 'reveal': {
          const home = await store().get<H3Index>(K.home);
          if (!home) return { ok: false, refused: 'no-home' };
          await sightRings(store(), home, deed.rings, now);
          break;
        }
        case 'harvest': {
          const day = (await forecastRates(store(), await owned(now), now)).perDay;
          await commit(store(), now, (cur) => {
            const pool = { ...cur.pool };
            for (const [k, v] of Object.entries(day) as [ResourceKind, number][]) pool[k] += Math.round((v * deed.hours) / 24);
            return { ...cur, pool };
          });
          break;
        }
        case 'sealFromAfar':
          if (!(await gates().sealFromAfar(now))) return { ok: false, refused: 'nothing-to-do' };
          break;
      }
      await store().set(K.great, { ...b, people: b.people.map((p) => (p.id === id ? { ...p, usedAt: now, seen: true as const } : p)) });
      return { ok: true, said: `${person.name}: ${GREAT[person.kind].deedText}` };
    }),
  };
}
