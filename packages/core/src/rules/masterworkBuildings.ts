/**
 * The masterworks as buildings (BRDC-PROG-006) — raised on a host through
 * `masterworkStore`, never built from the list. Costs are paid when raised (`MASTERWORKS`),
 * so their own is empty; each stands where its host already stood. Split from `build.ts`
 * for its line limit. The Fortress is the fifth masterwork and keeps its old entry there.
 */
import type { Building } from './build.js';

export const MASTERWORK_BUILDINGS = {
  manor: { cost: {}, terrain: 'any', tech: null, requires: ['farm'], masterwork: true },
  foundry: { cost: {}, terrain: 'any', tech: null, requires: ['forge'], masterwork: true },
  exchange: { cost: {}, terrain: 'any', tech: null, requires: ['market'], masterwork: true },
  'sunken-cathedral': { cost: {}, terrain: 'any', tech: null, requires: ['temple-grove'], masterwork: true },
} as const satisfies Record<string, Building>;
