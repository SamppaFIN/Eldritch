/**
 * Where each held hex's yield comes from, in the store (BRDC-YIELD-001).
 *
 * The context is the settle's own (`yieldContext` in `pouch.ts`), so the card and the map
 * read exactly what the pouch is paid — never a version of their own.
 */
import { computeHexYield } from '../rules/hexYield.js';
import type { HexYield } from '../rules/hexYield.js';
import { yieldContext } from './pouch.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index } from '../types/domain.js';

export interface YieldApi {
  /** One held hex's yield per hour, itemised; null for a hex that is not yours. */
  at(h3: H3Index, now: number): Promise<HexYield | null>;
  /** Every held hex's, keyed by hex — for the map's overlay and the Works list. */
  all(now: number): Promise<Record<H3Index, HexYield>>;
}

export function yieldApi(store: () => KeyValueStore, owned: (now: number) => Promise<readonly Cell[]>): YieldApi {
  return {
    at: async (h3, now) => {
      const cells = await owned(now);
      const cell = cells.find((c) => c.h3 === h3);
      if (!cell) return null;
      const { ctx } = await yieldContext(store(), cells, now);
      return computeHexYield(cell, ctx);
    },
    all: async (now) => {
      const cells = await owned(now);
      const { ctx } = await yieldContext(store(), cells, now);
      return Object.fromEntries(cells.map((c) => [c.h3, computeHexYield(c, ctx)]));
    },
  };
}
