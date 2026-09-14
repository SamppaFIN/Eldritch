/**
 * Avatar shapes, second half: Aquatic, Stroke sigil and Duotone (BRDC-SIGIL-005).
 *
 * See `avatarShapesA.tsx` — same convention, split for line budget only.
 */
import type { ReactNode } from 'react';
import type { AvatarId } from './avatarIds.js';

export const AVATAR_SHAPE_B: Partial<Record<AvatarId, ReactNode>> = {
  'deep-one': (
    <>
      <path
        d="M22,14 q16,-6 26,6 q8,12 2,26 q-12,12 -28,6 q-12,-8 -8,-22 q2,-12 8,-16 z"
        fill="currentColor"
        opacity=".85"
      />
      <path d="M48,20 q10,-6 12,-2 q-4,6 -10,8 z" fill="currentColor" opacity=".6" />
      <g stroke="#123" strokeWidth="1.8" fill="none" strokeLinecap="round">
        <path d="M40,38 l10,2 M40,43 l9,4 M39,48 l7,5" />
      </g>
      <ellipse cx="26" cy="28" rx="8" ry="8.5" fill="#e8f4f2" />
      <circle cx="26" cy="28" r="4" fill="#123" />
      <path d="M14,42 q10,6 20,2" fill="none" stroke="#123" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  'tentacle-crown': (
    <>
      <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
        <path d="M32,52 q-2,-18 -12,-26 q-6,-5 -10,0" />
        <path d="M32,52 q-6,-20 -2,-32 q1,-7 6,-6" />
        <path d="M32,52 q6,-18 14,-24 q6,-5 10,1" />
        <path d="M32,52 q10,-14 12,-26" />
        <path d="M32,52 q-10,-12 -14,-22" />
      </g>
      <ellipse cx="32" cy="53" rx="16" ry="6" fill="currentColor" />
      <circle cx="10" cy="26" r="2.4" fill="var(--awareness-green)" />
      <circle cx="56" cy="27" r="2.4" fill="var(--awareness-green)" />
      <circle cx="36" cy="14" r="2.4" fill="var(--awareness-green)" />
    </>
  ),
  'the-drowned': (
    <>
      <circle cx="32" cy="28" r="15" fill="currentColor" opacity=".8" />
      <ellipse cx="26" cy="26" rx="3.4" ry="4.4" fill="#e8f4f2" />
      <ellipse cx="38" cy="26" rx="3.4" ry="4.4" fill="#e8f4f2" />
      <circle cx="26" cy="27" r="1.7" fill="#0a1520" />
      <circle cx="38" cy="27" r="1.7" fill="#0a1520" />
      <path d="M27,35 q5,4 10,0" fill="none" stroke="#0a1520" strokeWidth="1.6" strokeLinecap="round" />
      <g stroke="var(--mystic-cyan)" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity=".9">
        <path d="M4,42 q8,-5 16,0 q8,5 16,0 q8,-5 16,0 q8,5 12,0" />
        <path d="M4,50 q8,-5 16,0 q8,5 16,0 q8,-5 16,0 q8,5 12,0" />
        <path d="M8,58 q8,-4 16,0 q8,4 16,0 q8,-4 16,0" />
      </g>
    </>
  ),
  'star-spawn': (
    <>
      <path
        d="M32,4 L40,24 L60,32 L40,40 L32,60 L24,40 L4,32 L24,24 Z"
        fill="currentColor"
        opacity=".35"
      />
      <path d="M32,12 L37,27 L52,32 L37,37 L32,52 L27,37 L12,32 L27,27 Z" fill="currentColor" />
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M32,52 q-4,8 -10,9" />
        <path d="M32,52 q4,8 10,9" />
        <path d="M32,52 q0,8 0,10" />
      </g>
      <circle cx="32" cy="32" r="6" fill="#0f0f10" />
      <circle cx="32" cy="32" r="2.6" fill="var(--sacred-gold)" />
    </>
  ),
  'elder-sign': (
    <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32,8 L32,56" />
      <path d="M32,24 L14,14" />
      <path d="M32,24 L50,14" />
      <path d="M32,40 L14,50" />
      <path d="M32,40 L50,50" />
      <circle cx="32" cy="32" r="8" />
      <circle cx="32" cy="32" r="3" fill="currentColor" stroke="none" />
    </g>
  ),
  'the-key': (
    <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <circle cx="32" cy="18" r="11" />
      <circle cx="32" cy="18" r="4.5" />
      <path d="M32,29 L32,56" />
      <path d="M32,44 L43,44" />
      <path d="M32,50 L40,50" />
      <path d="M22,10 L42,26" opacity=".5" />
      <circle cx="32" cy="56" r="2.6" fill="currentColor" stroke="none" />
    </g>
  ),
  'the-herald': (
    <g fill="none" stroke="currentColor" strokeLinecap="round">
      <g strokeWidth="2.2">
        <path d="M12,48 q0,-26 24,-30 q18,-3 20,10 q2,10 -10,12 q-9,1 -9,-6 q0,-5 5,-5" />
        <path d="M12,48 l-6,6" />
      </g>
      <path d="M18,52 q22,-6 30,-22" strokeWidth="1.3" opacity=".55" />
      <circle cx="42" cy="34" r="2.4" fill="currentColor" stroke="none" />
    </g>
  ),
  'the-colour': (
    <>
      <g fill="none" strokeWidth="2" strokeLinecap="round">
        <path d="M32,32 L32,6" stroke="var(--r-culture)" />
        <path d="M32,32 L50,14" stroke="var(--mystic-cyan)" />
        <path d="M32,32 L58,32" stroke="var(--awareness-green)" />
        <path d="M32,32 L50,50" stroke="var(--sacred-gold)" />
        <path d="M32,32 L32,58" stroke="var(--r-culture)" />
        <path d="M32,32 L14,50" stroke="var(--mystic-cyan)" />
        <path d="M32,32 L6,32" stroke="var(--awareness-green)" />
        <path d="M32,32 L14,14" stroke="var(--sacred-gold)" />
      </g>
      <circle cx="32" cy="32" r="9" fill="#0a0612" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="32" cy="32" r="4" fill="currentColor" />
    </>
  ),
  'the-lighthouse': (
    <>
      <path d="M32,14 L58,4 L58,26 Z" fill="currentColor" opacity=".24" />
      <path d="M32,14 L6,4 L6,26 Z" fill="currentColor" opacity=".24" />
      <path d="M25,52 L28,20 L36,20 L39,52 Z" fill="#e6e3ea" />
      <path d="M32,20 L32,52 L39,52 L36,20 Z" fill="#928fa0" />
      <rect x="27" y="12" width="10" height="9" rx="1.5" fill="currentColor" />
      <path d="M28,9 L32,4 L36,9 Z" fill="#928fa0" />
      <path
        d="M4,56 q8,-4 16,0 q8,4 16,0 q8,-4 16,0 q6,3 12,0"
        stroke="var(--eldritch-blue)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity=".9"
      />
    </>
  ),
  mycelium: (
    <>
      <g stroke="#3a5c2e" strokeWidth="2.4" fill="none" strokeLinecap="round">
        <path d="M32,56 L32,34" />
        <path d="M22,56 L24,40" />
        <path d="M42,56 L40,40" />
      </g>
      <path d="M32,34 q-18,0 -18,-10 q0,-14 18,-14 q18,0 18,14 q0,10 -18,10 z" fill="currentColor" />
      <path d="M32,10 q18,0 18,14 q0,10 -18,10 z" fill="#000" opacity=".28" />
      <path
        d="M24,40 q-11,0 -11,-6 q0,-8 11,-8 q11,0 11,8 q0,6 -11,6 z"
        fill="currentColor"
        opacity=".75"
      />
      <circle cx="26" cy="20" r="2.2" fill="var(--awareness-green)" />
      <circle cx="38" cy="24" r="1.8" fill="var(--awareness-green)" />
      <circle cx="20" cy="31" r="1.6" fill="var(--awareness-green)" />
    </>
  ),
  'crawling-mist': (
    <>
      <path
        d="M4,20 q10,-8 20,-2 q10,-7 20,0 q10,-5 16,4 q-8,6 -18,3 q-10,5 -20,-1 q-10,4 -18,-4 z"
        fill="currentColor"
        opacity=".28"
      />
      <path
        d="M6,34 q12,-9 22,-2 q12,-7 22,1 q8,5 12,2 q-8,8 -20,4 q-12,5 -22,-2 q-9,4 -14,-3 z"
        fill="currentColor"
        opacity=".45"
      />
      <path
        d="M8,49 q12,-8 22,-1 q12,-6 22,2 q-10,8 -22,4 q-12,4 -22,-5 z"
        fill="currentColor"
        opacity=".7"
      />
      <circle cx="24" cy="33" r="2" fill="var(--mystic-cyan)" opacity=".9" />
      <circle cx="40" cy="36" r="2" fill="var(--mystic-cyan)" opacity=".9" />
    </>
  ),
  'the-scribe': (
    <>
      <path d="M32,16 q-12,-6 -24,-3 L8,49 q12,-3 24,3 z" fill="currentColor" opacity=".85" />
      <path d="M32,16 q12,-6 24,-3 L56,49 q-12,-3 -24,3 z" fill="currentColor" opacity=".55" />
      <path d="M32,16 L32,52" stroke="#0a0612" strokeWidth="2" fill="none" />
      <g stroke="#0a0612" strokeWidth="1.2" fill="none" opacity=".55">
        <path d="M13,24 h13 M13,30 h13 M38,24 h13 M38,30 h13 M38,36 h10" />
      </g>
      <ellipse cx="21" cy="39" rx="7" ry="4.4" fill="#0a0612" />
      <circle cx="21" cy="39" r="2.2" fill="var(--sacred-gold)" />
    </>
  ),
};
