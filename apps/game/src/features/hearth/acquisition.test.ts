import { describe, expect, it } from 'vitest';
import { destination } from '@es3/core';
import type { TrailPoint } from '@es3/core';
import { PATIENCE_S, STABLE_SAMPLES, acceptance, acquisitionLine, assess } from './acquisition.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };

const at = (metres: number, accuracy: number, t = 0): TrailPoint => ({
  ...destination(ORIGIN, 0, metres),
  t,
  accuracy,
});

/** Four fixes standing in the same spot at the given accuracy. */
function steady(accuracy: number): TrailPoint[] {
  return Array.from({ length: STABLE_SAMPLES }, (_, i) => at(i * 2, accuracy, i * 1000));
}

describe('assess', () => {
  it('has nothing to say before the first fix', () => {
    const a = assess([]);
    expect(a).toMatchObject({ fix: null, tier: 'waiting', ready: false });
  });

  it('keeps the most accurate fix, not the most recent', () => {
    // Losing a satellite does not move the player, and the earlier answer is better.
    const a = assess([at(0, 6, 0), at(3, 40, 1000), at(4, 55, 2000), at(2, 48, 3000)]);
    expect(a.accuracyM).toBe(6);
  });

  it('will not lock on one lucky reading', () => {
    expect(assess([at(0, 5)]).ready).toBe(false);
  });

  it('locks once the fixes are both accurate and agreeing', () => {
    const a = assess(steady(8));
    expect(a.tier).toBe('sharp');
    expect(a.ready).toBe(true);
  });

  it('refuses to lock while the fixes wander, however good they claim to be', () => {
    // A device can report ±8 m while its fixes are forty metres apart. Only the second
    // of those is evidence, and it is the one that decides.
    const wandering = [at(0, 8, 0), at(40, 8, 1000), at(5, 8, 2000), at(38, 8, 3000)];
    const a = assess(wandering);
    expect(a.spreadM).toBeGreaterThan(20);
    expect(a.ready).toBe(false);
  });

  it('refuses to lock on a coarse fix however steady it is', () => {
    // The opening fix from a cell tower is rock steady and wrong by a kilometre.
    expect(assess(steady(800)).ready).toBe(false);
    expect(assess(steady(800)).tier).toBe('coarse');
  });
});

describe('acquisitionLine', () => {
  it('says what to do, not what failed', () => {
    expect(acquisitionLine(assess([]))).toMatch(/Listening/);
    expect(acquisitionLine(assess(steady(800)))).toMatch(/step into the open/);
    expect(acquisitionLine(assess([at(0, 8)]))).toMatch(/hold still/);
    expect(acquisitionLine(assess(steady(8)))).toMatch(/certain/);
  });
});

describe('acceptance', () => {
  it('opens immediately once the device has settled', () => {
    expect(acceptance(assess(steady(8)), 1)).toBe('ready');
  });

  it('holds the button while there is still reason to wait', () => {
    expect(acceptance(assess(steady(800)), PATIENCE_S - 1)).toBe('waiting');
  });

  it('lets a stuck desktop fix through once waiting stops helping', () => {
    /*
     * The screen that got stuck. Two wifi fixes at ±87 m and then silence: the stability
     * window never fills, so `ready` can never become true and nothing else would ever
     * change. Without this the player waits forever on a page that looks alive.
     */
    const wifi = assess([at(0, 87, 0), at(4, 87, 5000)]);
    expect(wifi.ready).toBe(false);
    expect(wifi.spreadM).toBeNull();
    expect(acceptance(wifi, PATIENCE_S)).toBe('settle');
  });

  it('has nothing to offer when no fix ever arrived', () => {
    // There is no ground to accept, so the answer is advice, not a button.
    expect(acceptance(assess([]), PATIENCE_S + 60)).toBe('nothing');
  });
});
