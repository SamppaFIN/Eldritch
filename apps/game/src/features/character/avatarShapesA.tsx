/**
 * Avatar shapes, first half: Silhouette and Ocular (BRDC-SIGIL-005).
 *
 * Split from `avatarShapesB.tsx` on family lines purely to clear the line ceiling — the
 * two files together are one lookup, `AVATAR_SHAPE`, assembled in `Avatar.tsx`. Every
 * shape is `currentColor`, so the wrapping `<svg>` picks the ink with one CSS property,
 * the same convention `realmMarks.ts` uses for the nation's banners.
 */
import type { ReactNode } from 'react';
import type { AvatarId } from './avatarIds.js';

export const AVATAR_SHAPE_A: Partial<Record<AvatarId, ReactNode>> = {
  'the-seeker': (
    <>
      <path
        d="M32,9 c13,0 20,11 20,24 v22 h-40 v-22 c0,-13 7,-24 20,-24 z"
        fill="currentColor"
        opacity=".9"
      />
      <path
        d="M32,17 c8,0 13,8 13,17 c0,7 -6,12 -13,12 c-7,0 -13,-5 -13,-12 c0,-9 5,-17 13,-17 z"
        fill="#0a0612"
      />
      <ellipse cx="32" cy="33" rx="7" ry="4.5" fill="var(--awareness-green)" />
      <ellipse cx="32" cy="33" rx="2" ry="4" fill="#0a0612" />
    </>
  ),
  'the-hollow': (
    <>
      <path
        d="M32,8 c14,0 21,12 21,26 v21 h-42 v-21 c0,-14 7,-26 21,-26 z"
        fill="currentColor"
        opacity=".55"
      />
      <path
        d="M32,16 c9,0 15,9 15,19 c0,9 -7,15 -15,15 c-8,0 -15,-6 -15,-15 c0,-10 6,-19 15,-19 z"
        fill="#0f0f10"
      />
      <g stroke="currentColor" strokeWidth="1.2" fill="none" opacity=".6">
        <path d="M23,30 q9,6 18,0" />
        <path d="M25,38 q7,5 14,0" />
      </g>
    </>
  ),
  'night-gaunt': (
    <>
      <path
        d="M32,12 c-16,0 -26,10 -29,22 c6,-4 13,-5 18,-2 l-5,18 h32 l-5,-18 c5,-3 12,-2 18,2 c-3,-12 -13,-22 -29,-22 z"
        fill="currentColor"
      />
      <ellipse cx="32" cy="31" rx="12" ry="14" fill="#0f0f10" />
      <path d="M25,25 q7,-4 14,0" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M27,49 l5,7 l5,-7 z" fill="currentColor" />
    </>
  ),
  'moon-beast': (
    <>
      <path
        d="M32,14 c11,0 18,8 18,18 c0,8 -4,13 -6,18 l-24,0 c-2,-5 -6,-10 -6,-18 c0,-10 7,-18 18,-18 z"
        fill="currentColor"
      />
      <path d="M16,20 q-6,-10 -2,-15 q7,3 9,12 z" fill="currentColor" />
      <path d="M48,20 q6,-10 2,-15 q-7,3 -9,12 z" fill="currentColor" />
      <ellipse cx="25" cy="30" rx="4" ry="5.5" fill="#0f0f10" />
      <ellipse cx="39" cy="30" rx="4" ry="5.5" fill="#0f0f10" />
      <path
        d="M24,44 l4,-4 l4,4 l4,-4 l4,4"
        stroke="#0f0f10"
        strokeWidth="1.6"
        fill="none"
      />
    </>
  ),
  'the-watcher': (
    <>
      <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M32,4 v7 M32,53 v7 M4,32 h7 M53,32 h7 M12,12 l5,5 M47,47 l5,5 M52,12 l-5,5 M17,47 l-5,5" />
      </g>
      <path
        d="M8,32 q24,-20 48,0 q-24,20 -48,0 z"
        fill="#0f0f10"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="32" cy="32" r="11" fill="currentColor" />
      <circle cx="32" cy="32" r="5" fill="#0a0612" />
      <circle cx="28" cy="28" r="2.2" fill="#fff" opacity=".6" />
    </>
  ),
  'many-eyed': (
    <>
      <circle
        cx="32"
        cy="32"
        r="25"
        fill="currentColor"
        opacity=".2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <ellipse cx="32" cy="20" rx="7" ry="4.5" fill="currentColor" />
      <circle cx="32" cy="20" r="2" fill="#0f0f10" />
      <ellipse cx="20" cy="30" rx="6" ry="4" fill="currentColor" />
      <circle cx="20" cy="30" r="1.8" fill="#0f0f10" />
      <ellipse cx="44" cy="30" rx="6" ry="4" fill="currentColor" />
      <circle cx="44" cy="30" r="1.8" fill="#0f0f10" />
      <ellipse cx="25" cy="43" rx="5.5" ry="3.6" fill="currentColor" />
      <circle cx="25" cy="43" r="1.6" fill="#0f0f10" />
      <ellipse cx="40" cy="43" rx="5.5" ry="3.6" fill="currentColor" />
      <circle cx="40" cy="43" r="1.6" fill="#0f0f10" />
      <ellipse cx="32" cy="33" rx="6.5" ry="4.2" fill="currentColor" />
      <circle cx="32" cy="33" r="1.9" fill="#0f0f10" />
    </>
  ),
  'the-dreamer': (
    <>
      <circle cx="32" cy="32" r="26" fill="#1c1024" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M12,34 q20,14 40,0"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M17,39 l-3,5 M24,43 l-1.5,6 M32,44 l0,6 M40,43 l1.5,6 M47,39 l3,5" />
      </g>
      <circle cx="22" cy="20" r="1.6" fill="var(--sacred-gold)" />
      <circle cx="32" cy="15" r="2.1" fill="var(--sacred-gold)" />
      <circle cx="43" cy="21" r="1.4" fill="var(--sacred-gold)" />
      <circle cx="15" cy="27" r="1.2" fill="var(--sacred-gold)" />
      <circle cx="49" cy="28" r="1.2" fill="var(--sacred-gold)" />
    </>
  ),
  shoggoth: (
    <>
      <path
        d="M32,8 c14,0 24,9 24,22 c0,16 -10,26 -24,26 c-14,0 -24,-10 -24,-26 c0,-13 10,-22 24,-22 z"
        fill="currentColor"
        opacity=".28"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M20,18 q12,-8 24,0 q8,10 4,22 q-16,10 -32,0 q-4,-12 4,-22 z"
        fill="currentColor"
        opacity=".45"
      />
      <circle cx="24" cy="26" r="4" fill="#0f0f10" />
      <circle cx="38" cy="22" r="3" fill="#0f0f10" />
      <circle cx="44" cy="34" r="3.6" fill="#0f0f10" />
      <circle cx="28" cy="40" r="4.4" fill="#0f0f10" />
      <circle cx="38" cy="44" r="2.6" fill="#0f0f10" />
      <circle cx="18" cy="36" r="2.4" fill="#0f0f10" />
      <circle cx="24" cy="26" r="1.6" fill="currentColor" />
      <circle cx="28" cy="40" r="1.8" fill="currentColor" />
      <circle cx="44" cy="34" r="1.4" fill="currentColor" />
    </>
  ),
};
