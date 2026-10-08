/**
 * The propeller in hand (BRDC-AERODROME-001): finishing the Skyward Runway leaves one gate
 * to seal from afar, used whenever the player chooses — through the gates' own seal, the
 * same one Sink the Door and the Mystic use.
 */
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { GateApi } from './gateStore.js';

export type PropellerOutcome = { ok: true } | { ok: false; refused: 'none' | 'nothing-to-do' };

export interface PropellerApi {
  /** Gate seals in hand. */
  charges(): Promise<number>;
  /** Seal the nearest open gate from afar, spending one. */
  use(now: number): Promise<PropellerOutcome>;
}

export function propellerApi(store: () => KeyValueStore, gates: () => GateApi): PropellerApi {
  const charges = async () => (await store().get<{ charges: number }>(K.propeller))?.charges ?? 0;
  return {
    charges,
    async use(now) {
      const held = await charges();
      if (held <= 0) return { ok: false, refused: 'none' };
      if (!(await gates().sealFromAfar(now))) return { ok: false, refused: 'nothing-to-do' };
      await store().set(K.propeller, { charges: held - 1 });
      return { ok: true };
    },
  };
}
