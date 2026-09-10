/**
 * BRDC-GEO-001 — a slow phone is not a broken phone.
 *
 * The hang itself (`getCurrentPosition` calling neither callback) is an e2e test, in
 * `map.spec.ts`: it is about the map appearing, and that needs a browser. This is the
 * classification the copy hangs off, and it is pure.
 */
import { describe, expect, it } from 'vitest';
import { permissionFor } from './useInitialPosition.js';

const error = (code: number): GeolocationPositionError =>
  ({
    code,
    message: '',
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  }) as GeolocationPositionError;

describe('permissionFor', () => {
  it('calls a refusal a refusal', () => {
    expect(permissionFor(error(1))).toBe('denied');
  });

  /*
   * These two were one state, and the merged one said "No location sensor on this
   * device". About an iPhone that was merely indoors that is a lie, and it sends its
   * owner looking for a hardware problem they do not have.
   */
  it('keeps a timeout apart from a missing sensor', () => {
    expect(permissionFor(error(3))).toBe('timed-out');
    expect(permissionFor(error(2))).toBe('unavailable');
  });

  it('treats an error code it has never seen as unavailable, not as a refusal', () => {
    // Guessing "denied" would tell the player to go and change a setting that is fine.
    expect(permissionFor(error(99))).toBe('unavailable');
  });
});
