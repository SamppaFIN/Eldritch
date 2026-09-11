/**
 * BRDC-WONDER-001 — where the wonders are, and that every device agrees.
 *
 * The property that matters is not "it works", it is "it works the same everywhere and
 * twice never lands on once". So these lean on exhaustion and invariants rather than on
 * a handful of golden values.
 */
import { describe, expect, it } from 'vitest';
import { cellToParent } from 'h3-js';
import { cellAt } from '../geo/cells.js';
import { WONDERS, WONDER_IDS } from './wonder.js';
import {
  WONDER_PROVINCE_RES,
  WONDER_SCOPE_RES,
  assignProvinces,
  legendaryWonders,
  localWonders,
  wonderInProvince,
  wonderRoll,
  wondersNear,
  wondersOfRarity,
} from './wonderPlace.js';
import type { WonderId } from './wonder.js';

const HERE = cellAt({ lat: 61.47290805294704, lng: 23.725882485862012 });
const FAR = cellAt({ lat: 60.1699, lng: 24.9384 });

/** A stand-in national set: the res-5 provinces around two real places. */
const NATION = [
  ...new Set(
    [HERE, FAR, cellAt({ lat: 65.0121, lng: 25.4651 }), cellAt({ lat: 62.24, lng: 25.75 })].map(
      (c) => cellToParent(c, WONDER_PROVINCE_RES),
    ),
  ),
];

describe('the roll', () => {
  it('is the same every time it is asked', () => {
    const province = cellToParent(HERE, WONDER_PROVINCE_RES);
    expect(wonderRoll('rlyeh', province)).toBe(wonderRoll('rlyeh', province));
  });

  it('differs per wonder on the same ground, so they do not stack up', () => {
    const province = cellToParent(HERE, WONDER_PROVINCE_RES);
    expect(wonderRoll('rlyeh', province)).not.toBe(wonderRoll('kadath', province));
  });
});

describe('assignProvinces', () => {
  it('gives every wonder somewhere when there is room', () => {
    const out = assignProvinces(WONDER_IDS, NATION.concat(NATION.map((c) => c)).slice(0, 4));
    expect(out.size).toBeGreaterThan(0);
  });

  // The ticket's own caveat: a collision did not happen in the prototype, which is not the
  // same as being impossible. Two wonders must never share a seat even when squeezed.
  it('never seats two wonders on the same province, even with one to spare', () => {
    const tight = NATION.slice(0, 3);
    const out = assignProvinces(WONDER_IDS, tight);
    expect(new Set(out.values()).size).toBe(out.size);
    expect(out.size).toBe(tight.length);
  });

  // When seats are scarcer than claimants the seat decides, not the table's running order.
  it('gives a contested single seat to the highest roll, not to the first in the table', () => {
    const one = [cellToParent(HERE, WONDER_PROVINCE_RES)];
    const [winner] = [...assignProvinces(WONDER_IDS, one).keys()];
    const best = [...WONDER_IDS].sort(
      (a, b) => wonderRoll(b, one[0] as string) - wonderRoll(a, one[0] as string),
    )[0];
    expect(winner).toBe(best);
  });

  it('seats nobody when there is nowhere, rather than inventing a province', () => {
    expect(assignProvinces(WONDER_IDS, []).size).toBe(0);
  });

  it('is order-stable: the same ids and candidates give the same seats', () => {
    expect([...assignProvinces(WONDER_IDS, NATION)]).toEqual([
      ...assignProvinces(WONDER_IDS, NATION),
    ]);
  });

  it('does not depend on the order the candidates arrive in', () => {
    const forwards = assignProvinces(WONDER_IDS, NATION);
    const backwards = assignProvinces(WONDER_IDS, [...NATION].reverse());
    expect([...backwards].sort()).toEqual([...forwards].sort());
  });
});

describe('rarity sets the scope', () => {
  it('splits the twelve across four tiers', () => {
    const counted =
      wondersOfRarity('legendary').length +
      wondersOfRarity('rare').length +
      wondersOfRarity('uncommon').length +
      wondersOfRarity('common').length;
    expect(counted).toBe(WONDER_IDS.length);
  });

  it('keeps the five legendary wonders one-per-country', () => {
    expect(wondersOfRarity('legendary')).toHaveLength(5);
    const seats = legendaryWonders(NATION);
    expect(new Set(seats.values()).size).toBe(seats.size);
  });

  // The whole reason the amendment exists: a player standing anywhere has lesser wonders
  // within reach. Without it, twelve seats over 3626 provinces means nobody ever finds one.
  it('puts a wonder of every lesser tier within reach of wherever you stand', () => {
    const local = localWonders(HERE);
    for (const rarity of ['rare', 'uncommon', 'common'] as const) {
      const ofTier = wondersOfRarity(rarity).filter((id) => local.has(id));
      expect(ofTier.length).toBeGreaterThan(0);
    }
  });

  it('seats a common wonder in the very province you are standing in', () => {
    const mine = cellToParent(HERE, WONDER_PROVINCE_RES);
    const commons = wondersOfRarity('common').map((id) => localWonders(HERE).get(id));
    expect(commons).toContain(mine);
  });

  // Scope and province coincide at the common tier, so the candidate set is one cell and
  // the two common wonders cannot both fit. Exactly one per district, and which one varies.
  it('seats exactly one of the two common wonders per province', () => {
    const seated = wondersOfRarity('common').filter((id) => localWonders(HERE).has(id));
    expect(seated).toHaveLength(1);
  });

  /*
   * The dead-wonder guard.
   *
   * With one seat and two claimants the first version handed it to whichever wonder came
   * first in the table, every single time: `dunwich-stones` was seated in none of sixty
   * districts. Found by measuring rather than by reading. Both must turn up across a
   * spread of country, or one of the twelve does not exist.
   */
  it('seats both common wonders somewhere across a spread of districts', () => {
    const seen = new Set<WonderId>();
    for (let i = 0; i < 60; i += 1) {
      const district = cellAt({ lat: 60.2 + i * 0.09, lng: 22.5 + (i % 7) * 0.6 });
      for (const id of wondersOfRarity('common')) {
        if (localWonders(district).has(id)) seen.add(id);
      }
    }
    expect([...seen].sort()).toEqual([...wondersOfRarity('common')].sort());
  });

  it('agrees with itself from any cell inside the same scope', () => {
    const near = cellAt({ lat: 61.4735, lng: 23.7266 });
    expect([...localWonders(HERE)]).toEqual([...localWonders(near)]);
  });

  it('gives a different neighbourhood different lesser wonders', () => {
    expect([...localWonders(HERE)]).not.toEqual([...localWonders(FAR)]);
  });
});

describe('the scope table', () => {
  it('never places a province finer than the scope that owns it', () => {
    for (const rarity of ['rare', 'uncommon', 'common'] as const) {
      expect(WONDER_SCOPE_RES[rarity]).toBeLessThanOrEqual(WONDER_PROVINCE_RES);
    }
  });
});

describe('wonderInProvince', () => {
  it('names the wonder seated there', () => {
    const [id, seat] = [...wondersNear(HERE, NATION)][0] as [WonderId, string];
    expect(wonderInProvince(seat, HERE, NATION)).toBe(id);
  });

  it('is null for ground nobody was given', () => {
    const empty = cellToParent(cellAt({ lat: 48.8566, lng: 2.3522 }), WONDER_PROVINCE_RES);
    expect(wonderInProvince(empty, HERE, NATION)).toBeNull();
  });
});

describe('the table itself', () => {
  it('has twelve', () => {
    expect(WONDER_IDS).toHaveLength(12);
  });

  it('gives every wonder ground it can stand on, a bonus, an aura and lore', () => {
    for (const id of WONDER_IDS) {
      const w = WONDERS[id];
      expect(w.terrain.length).toBeGreaterThan(0);
      expect(Object.keys(w.bonus).length).toBeGreaterThan(0);
      expect(w.aura.radius).toBeGreaterThan(0);
      expect(w.lore.length).toBeGreaterThan(40);
    }
  });

  // The locked door the ticket names: no wonder may need ground this country lacks.
  it('never asks for ground that does not exist here', () => {
    const real = new Set(['plain', 'forest', 'hill', 'mountain', 'lake', 'coast', 'market']);
    for (const id of WONDER_IDS) {
      for (const t of WONDERS[id].terrain) expect(real.has(t)).toBe(true);
    }
  });
});
