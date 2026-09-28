/**
 * Seed a held realm straight into IndexedDB (BRDC-PERF-001).
 *
 * The cells are worked out here in Node with the game's own geometry — no h3-js from a
 * CDN inside the page, which three specs used to do (§7: no runtime CDN). Walking a
 * thousand hexes is not a test; writing them is the shortcut `lands.spec.ts` always took.
 * The page must be reloaded afterwards for the app to read them.
 */
import { cellAt, cellsWithin, regionOf } from '@es3/core/geo';
import type { Page } from '@playwright/test';

export interface SeedOptions {
  /** Where the realm is centred. */
  at: { latitude: number; longitude: number };
  /** Rings around the centre — 6 is 127 cells, 18 is 1 027. */
  rings?: number;
  /** Or an exact count, taken ring by ring outwards (e.g. 5 000). */
  count?: number;
  /** Also mark every cell revealed. */
  reveal?: boolean;
  /** How long ago each cell was last walked — old enough and it is fading. */
  visitedAgoMs?: number;
  /** Strength to seed at. */
  strength?: number;
}

/** The h3 cells a seed covers, nearest first. Exported so a spec can reason about them. */
export function realmCells({ at, rings, count }: SeedOptions): string[] {
  const home = cellAt({ lat: at.latitude, lng: at.longitude });
  if (count === undefined) return cellsWithin(home, rings ?? 6);
  let r = 0;
  while (3 * r * (r + 1) + 1 < count) r += 1;
  // `cellsWithin` is gridDisk: centre first, then ring by ring — so a slice is a disc.
  return cellsWithin(home, r).slice(0, count);
}

export async function seedRealm(page: Page, opts: SeedOptions): Promise<number> {
  const cells = realmCells(opts);
  const rows = cells.map((h3) => [h3, `cell:${regionOf(h3)}:${h3}`] as const);
  await page.evaluate(
    async ({ rows, reveal, ago, strength }: { rows: (readonly [string, string])[]; reveal: boolean; ago: number; strength: number }) => {
      const now = Date.now();
      const walked = now - ago;
      const db = await new Promise<IDBDatabase>((res, rej) => {
        const req = indexedDB.open('es3');
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
      });
      const me = await new Promise<string>((res) => {
        const g = db.transaction('kv', 'readonly').objectStore('kv').get('profile');
        g.onsuccess = () => res((g.result as { id: string }).id);
      });
      await new Promise<void>((res, rej) => {
        const tx = db.transaction('kv', 'readwrite');
        const st = tx.objectStore('kv');
        const revealed: Record<string, number> = {};
        for (const [h3, key] of rows) {
          st.put(
            { h3, ownerId: me, strength, claimedAt: walked, lastVisitedAt: walked, lastReinforcedAt: walked, visitDays: [], ownedDays: 2 },
            key,
          );
          revealed[h3] = now;
        }
        if (reveal) st.put(revealed, 'revealed');
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      });
      db.close();
    },
    { rows: rows as (readonly [string, string])[], reveal: opts.reveal ?? false, ago: opts.visitedAgoMs ?? 0, strength: opts.strength ?? 300 },
  );
  return cells.length;
}
