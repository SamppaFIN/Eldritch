/**
 * The Hall of Fame — every kingdom retired on this device (BRDC-HALL-001).
 *
 * Infinite's own field report: kingdoms that are deliberately ended should not just
 * vanish — what they became is worth keeping, "saavutukset ja demografiat mitä on saatu
 * aikaiseksi". This is that record: local to the device, newest kingdom first, no
 * comparison against anyone else's. Same sheet as `LandsPanel` and `CodexPanel`.
 */
import { useRef } from 'react';
import { EmptyState, GlassPanel, HexMandala, RitualButton } from '@es3/ui';
import type { GameRepository, HallOfFameEntry } from '@es3/core';
import { useEscape } from '../hud/useEscape.js';
import { relativeTime } from '../log/describe.js';
import { formatArea } from '../codex/figures.js';
import { useHallOfFame } from './useHallOfFame.js';
import './hall-of-fame.css';

export interface HallOfFamePanelProps {
  open: boolean;
  repository: GameRepository | null;
  now: () => number;
  onClose: () => void;
}

function row(entry: HallOfFameEntry, now: number) {
  return (
    <li key={entry.id} className="hall__row">
      <div className="hall__head">
        <span className="hall__name">{entry.name}</span>
        <span className="hall__when">{relativeTime(entry.retiredAt, now)}</span>
      </div>
      <p className="hall__level es-numeric">
        Level {entry.level} · {entry.xp.toLocaleString()} XP
      </p>
      <dl className="hall__figures es-numeric">
        <div>
          <dt>Ground</dt>
          <dd>{formatArea(entry.areaM2)}</dd>
        </div>
        <div>
          <dt>Souls</dt>
          <dd>{entry.population.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Provinces</dt>
          <dd>{entry.provinces}</dd>
        </div>
        <div>
          <dt>Achievements</dt>
          <dd>{entry.achievements}</dd>
        </div>
      </dl>
      {entry.wonders > 0 || entry.secretSites > 0 || entry.cipherShards > 0 ? (
        <p className="hall__extra">
          {[
            entry.wonders > 0 ? `${entry.wonders} wonder${entry.wonders === 1 ? '' : 's'} found` : null,
            entry.secretSites > 0 ? `${entry.secretSites} secret site${entry.secretSites === 1 ? '' : 's'}` : null,
            entry.cipherShards > 0 ? `${entry.cipherShards} cipher shard${entry.cipherShards === 1 ? '' : 's'}` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      ) : null}
    </li>
  );
}

export function HallOfFamePanel({ open, repository, now, onClose }: HallOfFamePanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const { entries, loading } = useHallOfFame(repository, open);
  useEscape(open, onClose);

  if (!open) return null;

  return (
    <GlassPanel as="section" ref={panelRef} className="hall" aria-label="Hall of Fame" tabIndex={-1}>
      <div className="hall__bar">
        <h2 className="hall__title">Hall of Fame</h2>
        <RitualButton variant="ghost" className="hall__close" onClick={onClose} aria-label="Close">
          <span aria-hidden>✕</span>
        </RitualButton>
      </div>

      {loading && entries.length === 0 ? <p className="hall__note">Reading the record…</p> : null}

      {!loading && entries.length === 0 ? (
        <EmptyState
          mark={<HexMandala size={56} />}
          ink="var(--sacred-gold)"
          title="No kingdom has retired yet"
          body="Retire from the menu once this one has run its course, and what it became stays here — for good."
        />
      ) : null}

      {entries.length > 0 ? (
        <ul className="hall__list">{entries.map((e) => row(e, now()))}</ul>
      ) : null}
    </GlassPanel>
  );
}
