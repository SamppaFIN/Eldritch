/**
 * This season's rules, told once on joining (BRDC-SEASON-006; Infinite 2026-09-28:
 * *"kun liittyy season 2:lle, niin kerrotaan tän seasonin säännöt"*).
 *
 * Short sentences (§14: under twenty words): what this season adds, in the order a player
 * meets it — Season 3's own since the 4X + Arkham round; the Guide carries the detail.
 */
import { Modal, RitualButton } from '@es3/ui';
import { HEIRLOOMS } from '@es3/core';
import type { HeirloomId, Season } from '@es3/core';

const RULES: readonly string[] = [
  'Walking claims: step into a hex beside yours and it is yours.',
  'Your Keep houses citizens. A building yields only while a citizen works in it.',
  'Choose an ambition in the Keep. Met when the season closes, it lifts your Legacy.',
  'A strong week turns golden. A weak one turns dark — and promises the next.',
  'Libraries, Markets and Temple Groves call great people, each with one great deed.',
  'Walk from one of your Markets to another, and the road pays gold.',
  'Step through an open gate into the world beyond it.',
  'Gates left open frighten the town, and some let creatures out.',
  'Clues and sealed gates solve the town’s three mysteries — everyone together.',
  'At Doom 13 the Ancient One wakes. Every realm fights it together.',
];

export interface SeasonIntroProps {
  season: Season;
  heirloom: HeirloomId | null;
  onClose: () => void;
}

export function SeasonIntro({ season, heirloom, onClose }: SeasonIntroProps) {
  return (
    <Modal open title={`Welcome to ${season.name}`} onClose={onClose} footer={<RitualButton onClick={onClose}>Begin</RitualButton>}>
      <p>Same shoreline, new seed. This season plays by new rules.</p>
      <ul className="season-gate__rules">
        {RULES.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <p>Every new thing has its own page in the Guide, under This season.</p>
      {heirloom ? (
        <p>
          <strong>{HEIRLOOMS[heirloom].name}</strong> came with you: {HEIRLOOMS[heirloom].text}
        </p>
      ) : null}
    </Modal>
  );
}
