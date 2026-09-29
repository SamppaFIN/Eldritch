/**
 * How often the phone's GPS is listened to, and a count to compare phones by
 * (field report 2026-09-30: *"iOS se seuranta on paljon nopeempi ja akkua kuluttavampi"*).
 *
 * iOS delivers `watchPosition` fixes about once a second; Android far less often. Every
 * fix re-renders the map, yet the trail only keeps one point in five seconds
 * (`MIN_POINT_INTERVAL_MS`), so most of iOS's fixes cost battery and buy nothing. A fix is
 * used at most every `GPS_MIN_GAP_MS`, on every platform alike. The counts behind the
 * settings line ("iOS · 58 fixes/min, 20 used") are the field comparison Infinite asked for.
 */

/** Use a fix at most this often. Under the trail's own 5 s, so no point it keeps is lost. */
export const GPS_MIN_GAP_MS = 3_000;
const WINDOW_MS = 60_000;

/** A fix this far from the last used one, or this much surer or vaguer, is never held back. */
const MOVED_M = 5;
const ACCURACY_SHIFT_M = 10;

const received: number[] = [];
const used: number[] = [];
let lastUsed: { at: number; lat: number; lng: number; accuracy: number } | null = null;

/** Metres between two points — plenty good at walking scale. */
function metres(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = (b.lat - a.lat) * 111_320;
  const dLng = (b.lng - a.lng) * 111_320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

const trim = (list: number[], now: number) => {
  while (list.length > 0 && now - (list[0] as number) > WINDOW_MS) list.shift();
};

/**
 * Count a fix and say whether to use it. `now` is the wall clock, not the fix's own stamp.
 * Held back only when it is soon after the last one *and* says nothing new: the same place
 * within 5 m and the same certainty within 10 m. A walker's steps and a signal turning
 * weak always get through.
 */
export function takeFix(now: number, fix: { lat: number; lng: number; accuracy: number } = { lat: 0, lng: 0, accuracy: 0 }): boolean {
  received.push(now);
  trim(received, now);
  const same =
    lastUsed !== null &&
    metres(lastUsed, fix) < MOVED_M &&
    Math.abs(lastUsed.accuracy - fix.accuracy) < ACCURACY_SHIFT_M;
  if (lastUsed !== null && now - lastUsed.at < GPS_MIN_GAP_MS && same) return false;
  lastUsed = { at: now, ...fix };
  used.push(now);
  trim(used, now);
  return true;
}

/** Fixes the phone gave and the game used, over the last minute. */
export function gpsRates(now: number): { received: number; used: number } {
  trim(received, now);
  trim(used, now);
  return { received: received.length, used: used.length };
}

export function platformName(ua: string = typeof navigator === 'undefined' ? '' : navigator.userAgent): 'iOS' | 'Android' | 'Desktop' {
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && /Mobile/.test(ua))) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  return 'Desktop';
}

/** For tests: forget everything counted so far. */
export function resetGpsPace(): void {
  received.length = 0;
  used.length = 0;
  lastUsed = null;
}
