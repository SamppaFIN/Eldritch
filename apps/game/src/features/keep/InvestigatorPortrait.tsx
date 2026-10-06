/**
 * The four investigators' portraits (BRDC-INVEST-001) — sacred geometry, stroke and no fill
 * (§12): a circle for the face of each, and the one thing they carry drawn inside it.
 */
import type { ArchetypeId } from '@es3/core';

const MARK: Readonly<Record<ArchetypeId, string>> = {
  // An open book with an eye over its spine.
  librarian: 'M16 40 L32 44 L48 40 V26 L32 30 L16 26 Z M32 30 V44 M24 20 Q32 13 40 20 Q32 27 24 20 Z',
  // A theodolite: three legs and a sighting line to a star.
  surveyor: 'M32 30 L22 48 M32 30 L42 48 M32 30 V48 M26 26 H38 V30 H26 Z M38 27 L47 18 M47 14 V22 M43 18 H51',
  // An anchor.
  dockworker: 'M32 16 V46 M26 22 H38 M32 13 A3 3 0 1 1 32 19 M20 36 Q22 47 32 47 Q42 47 44 36 M20 36 L17 39 M44 36 L47 39',
  // Three rings closing on an eye.
  medium: 'M32 14 A18 18 0 1 1 31.9 14 M32 21 A11 11 0 1 1 31.9 21 M24 32 Q32 25 40 32 Q32 39 24 32 Z M32 30 V34',
};

export function InvestigatorPortrait({ id, size = 64 }: { id: ArchetypeId; size?: number }) {
  return (
    <svg className="investigator__portrait" viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="none" stroke="var(--sacred-gold)" strokeWidth="1.5" />
      <path d={MARK[id]} fill="none" stroke="var(--mystic-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
