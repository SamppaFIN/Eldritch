/**
 * The day's weather (BRDC-WEATHER-001, with MOON-001) — from the calendar, not a service:
 * the same weather on every phone on the same (UTC) day. It changes what you see and how
 * forgiving the sky is, never what the ground makes; that is the dark time's business.
 *
 * Fog: the map shows only your own ground. Clear: two rings past it. Storm: a fix with
 * half again the usual GPS error is still taken — the speed limit is not loosened.
 *
 * Pure.
 */
export type Weather = 'calm' | 'fog' | 'clear' | 'storm';

export const STORM_ACCURACY = 1.5;

export const WEATHER_NAME: Readonly<Record<Weather, string>> = { calm: 'Calm', fog: 'Fog', clear: 'Clear skies', storm: 'Storm' };
export const WEATHER_LINE: Readonly<Record<Weather, string>> = {
  calm: '',
  fog: 'you see only your own ground',
  clear: 'you see far today',
  storm: 'GPS is forgiven a little',
};

function fnv(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Dates differ only in their last characters; mix those into the high bits too.
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

export function weatherAt(now: number): Weather {
  const u = fnv(`weather:${new Date(now).toISOString().slice(0, 10)}`);
  if (u < 0.55) return 'calm';
  if (u < 0.7) return 'fog';
  if (u < 0.88) return 'clear';
  return 'storm';
}

/** How many rings past your ground the map shows today: 0 in fog, 2 when clear, else 1. */
export const sightRings = (w: Weather): number => (w === 'fog' ? 0 : w === 'clear' ? 2 : 1);

/** The day's sky as the HUD says it — "Full moon · Fog" — or '' on a calm, ordinary day. */
export function skyLine(w: Weather, moon: 'full' | 'new' | null): string {
  return [moon === 'full' ? 'Full moon' : moon === 'new' ? 'New moon' : '', w === 'calm' ? '' : WEATHER_NAME[w]].filter(Boolean).join(' · ');
}
