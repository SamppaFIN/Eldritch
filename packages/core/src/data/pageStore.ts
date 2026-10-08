/**
 * The Book's pages, in the store (BRDC-PAGES-001).
 *
 * Found in order, one per rumour passed or anomaly finished whose hex turns one up; read
 * one at a time into the rite book (`K.rites`), each read taking a point of sanity for
 * good from the investigator. Season 2 realms only — the pages need an investigator.
 */
import { PAGES, afterReading, canReadPage, pageFoundAt, readPageInto } from '../rules/pages.js';
import type { Page } from '../rules/pages.js';
import { EMPTY_BOOK } from '../rules/rites.js';
import type { RiteBook } from '../rules/rites.js';
import { FIRST_INVESTIGATOR, recover, sanityCap } from '../rules/investigator.js';
import type { Investigator } from '../rules/investigator.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { H3Index } from '../types/domain.js';

interface PageBook {
  found: string[];
  read: string[];
}

export interface PageView {
  pages: readonly (Page & { read: boolean })[];
  /** Pages still lost on the ground. */
  missing: number;
  canRead: boolean;
  /** The sanity the investigator can hold now. */
  sanityCap: number;
}

export type PageOutcome = { ok: true; said: string } | { ok: false; refused: 'unknown' | 'not-found' | 'read' | 'mind-full' | 'mastered' };

export interface PageApi {
  view(now: number): Promise<PageView>;
  read(id: string, now: number): Promise<PageOutcome>;
}

const book = async (store: KeyValueStore): Promise<PageBook> => (await store.get<PageBook>(K.pages)) ?? { found: [], read: [] };

/** A rumour passed or an anomaly finished on `h3`: the next page, if this hex turns one up. */
export async function findPage(store: KeyValueStore, h3: H3Index, now: number): Promise<Page | null> {
  if (!pageFoundAt(h3)) return null;
  const b = await book(store);
  const next = PAGES[b.found.length];
  if (!next) return null;
  await store.set(K.pages, { ...b, found: [...b.found, next.id] });
  await writeLogEntry(store, { at: now, kind: 'anomaly', ref: `page:${next.id}` });
  return next;
}

export function pageApi(store: () => KeyValueStore): PageApi {
  const inv = async (now: number) => recover((await store().get<Investigator>(K.investigator)) ?? FIRST_INVESTIGATOR(now), now);
  return {
    async view(now) {
      const b = await book(store());
      const i = await inv(now);
      return {
        pages: PAGES.filter((p) => b.found.includes(p.id)).map((p) => ({ ...p, read: b.read.includes(p.id) })),
        missing: PAGES.length - b.found.length,
        canRead: canReadPage(i),
        sanityCap: sanityCap(i),
      };
    },

    async read(id, now) {
      const page = PAGES.find((p) => p.id === id);
      if (!page) return { ok: false, refused: 'unknown' };
      const b = await book(store());
      if (!b.found.includes(id)) return { ok: false, refused: 'not-found' };
      if (b.read.includes(id)) return { ok: false, refused: 'read' };
      const i = await inv(now);
      if (!canReadPage(i)) return { ok: false, refused: 'mind-full' };
      const rites = (await store().get<RiteBook>(K.rites)) ?? EMPTY_BOOK;
      const r = readPageInto(rites, page);
      if (!r.ok) return r;
      await store().set(K.rites, r.book);
      await store().set(K.investigator, afterReading(i));
      await store().set(K.pages, { ...b, read: [...b.read, id] });
      return { ok: true, said: r.said };
    },
  };
}
