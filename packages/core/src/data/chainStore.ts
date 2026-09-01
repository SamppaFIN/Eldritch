/**
 * The event-chain bundle (BRDC-EVENT-001).
 *
 * `chains.json` is data — stages and choices, no code. It is validated once here, at
 * module load, so a malformed chain fails the build and never a walk. Adding a chain is
 * editing that file.
 */
import { parseChains } from '../rules/chain.js';
import type { Chain } from '../rules/chain.js';
import raw from './chains.json';

const CHAINS: Readonly<Record<string, Chain>> = parseChains(raw);
const IDS = Object.keys(CHAINS).sort();

export function getChain(id: string): Chain | null {
  return CHAINS[id] ?? null;
}

export function chainIds(): readonly string[] {
  return IDS;
}

/** FNV-1a over the salted index, in [0, 1). */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/**
 * Which chain a `'chain'` anomaly at `h3` runs. Deterministic from the index, so the
 * same cell tells the same story on every phone.
 */
export function chainForCell(h3: string): Chain {
  return CHAINS[IDS[Math.floor(hash(`chain:pick:${h3}`) * IDS.length)] as string] as Chain;
}
