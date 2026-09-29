/**
 * This season's rules, told once on joining (BRDC-SEASON-006; Infinite 2026-09-28:
 * *"kun liittyy season 2:lle, niin kerrotaan tän seasonin säännöt"*).
 *
 * Short sentences (§14: under twenty words): what changed since Season 1, in the order a
 * player meets it on the first walk.
 */
import { Modal, RitualButton } from '@es3/ui';
import { HEIRLOOMS } from '@es3/core';
import type { HeirloomId, Season } from '@es3/core';

const RULES: readonly string[] = [
  'Your Keep houses citizens. Surplus food fills its granary, and a full granary births one.',
  'A building yields only while a citizen works in it. Send them from the hex card.',
  'Stores fill for twelve hours. Walk to your Keep to collect them.',
  'New ground costs culture, and each hex costs more than the last.',
  'Study the Lore to open buildings. Three of an Age opens the next.',
  'Dedicate a temple school, then learn and cast its rites.',
  'Gates open near your border. Walk to one and seal it before the Doom rises.',
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
      {heirloom ? (
        <p>
          <strong>{HEIRLOOMS[heirloom].name}</strong> came with you: {HEIRLOOMS[heirloom].text}
        </p>
      ) : null}
    </Modal>
  );
}
