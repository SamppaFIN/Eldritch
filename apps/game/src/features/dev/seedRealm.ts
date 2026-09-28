/**
 * Dev only: hold a thousand hexes around the Hearth without walking them (BRDC-PERF-001).
 *
 * For testing the map at scale on a real phone. One IndexedDB transaction, the same shape
 * `e2e/seedRealm.ts` writes; the page reloads so the app reads it. Never reachable from a
 * production build — the only caller sits behind `import.meta.env.DEV`.
 */
import { cellsWithin, regionOf } from '@es3/core';

/** 18 rings around the Hearth: 1 027 cells. */
const RINGS = 18;

export async function seedThousand(): Promise<number> {
  const db = await new Promise<IDBDatabase>((res, rej) => {
    const req = indexedDB.open('es3');
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
  const read = <T,>(key: string) =>
    new Promise<T | undefined>((res) => {
      const g = db.transaction('kv', 'readonly').objectStore('kv').get(key);
      g.onsuccess = () => res(g.result as T | undefined);
    });
  const me = (await read<{ id: string }>('profile'))?.id;
  const home = await read<string>('home');
  if (!me || !home) {
    db.close();
    return 0;
  }
  const cells = cellsWithin(home, RINGS);
  const now = Date.now();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction('kv', 'readwrite');
    const st = tx.objectStore('kv');
    for (const h3 of cells) {
      st.put(
        { h3, ownerId: me, strength: 300, claimedAt: now, lastVisitedAt: now, lastReinforcedAt: now, visitDays: [], ownedDays: 2 },
        `cell:${regionOf(h3)}:${h3}`,
      );
    }
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  db.close();
  return cells.length;
}
