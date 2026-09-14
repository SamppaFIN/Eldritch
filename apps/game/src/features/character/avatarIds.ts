/**
 * The player's personal sigil — twenty faces in five families (Sigil §04, BRDC-SIGIL-005).
 *
 * Distinct from the nation's banner (`features/nation`): a banner marks *ground you
 * hold*, drawn on the map; this marks *you*, shown only on the You screen. Different
 * question, so a different, independent store — the same reason `nation.ts` and this
 * file both exist rather than one growing to cover both.
 *
 * One localStorage key, the same versioned envelope `nation.ts` uses.
 */
import { load, saveNow } from '@es3/core';

export type AvatarFamily = 'silhouette' | 'ocular' | 'aquatic' | 'stroke-sigil' | 'duotone';

export type AvatarId =
  | 'the-seeker'
  | 'the-hollow'
  | 'night-gaunt'
  | 'moon-beast'
  | 'the-watcher'
  | 'many-eyed'
  | 'the-dreamer'
  | 'shoggoth'
  | 'deep-one'
  | 'tentacle-crown'
  | 'the-drowned'
  | 'star-spawn'
  | 'elder-sign'
  | 'the-key'
  | 'the-herald'
  | 'the-colour'
  | 'the-lighthouse'
  | 'mycelium'
  | 'crawling-mist'
  | 'the-scribe';

export const AVATAR_IDS: readonly AvatarId[] = [
  'the-seeker',
  'the-hollow',
  'night-gaunt',
  'moon-beast',
  'the-watcher',
  'many-eyed',
  'the-dreamer',
  'shoggoth',
  'deep-one',
  'tentacle-crown',
  'the-drowned',
  'star-spawn',
  'elder-sign',
  'the-key',
  'the-herald',
  'the-colour',
  'the-lighthouse',
  'mycelium',
  'crawling-mist',
  'the-scribe',
];

export const DEFAULT_AVATAR: AvatarId = 'the-seeker';

const KEY = 'avatar';

export function resolveAvatarId(id: unknown): AvatarId {
  return AVATAR_IDS.includes(id as AvatarId) ? (id as AvatarId) : DEFAULT_AVATAR;
}

export function readAvatarId(): AvatarId {
  return resolveAvatarId(load<AvatarId | null>(KEY, null));
}

export function writeAvatarId(id: AvatarId): AvatarId {
  const clean = resolveAvatarId(id);
  saveNow(KEY, clean);
  return clean;
}
