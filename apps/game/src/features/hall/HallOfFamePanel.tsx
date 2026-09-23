/**
 * The Hall of Fame — every kingdom retired on this device (BRDC-HALL-001).
 *
 * Infinite's own field report: kingdoms that are deliberately ended should not just
 * vanish — what they became is worth keeping, "saavutukset ja demografiat mitä on saatu
 * aikaiseksi". This is that record: local to the device, newest kingdom first, no
 * comparison against anyone else's. Same sheet as `LandsPanel` and `CodexPanel`.
 */
import { useRef, useState } from 'react';
import { EmptyState, GlassPanel, HexMandala, RitualButton } from '@es3/ui';
import type { GameRepository, HallOfFameEntry } from '@es3/core';
import type { LegacyEntry } from '../../data/legacy.js';
import { useEscape } from '../hud/useEscape.js';
import { relativeTime } from '../log/describe.js';
import { formatArea } from '../codex/figures.js';
import { useHallOfFame } from './useHallOfFame.js';
import { useLegacy } from './useLegacy.js';
import './hall-of-fame.css';

export interface HallOfFamePanelProps {
  open: boolean;
  repository: GameRepository | null;
  now: () => number;
  onClose: () => void;
}

function row(
  entry: HallOfFameEntry,
  now: number,
  revealing: boolean,
  onReveal: (id: string) => void,
  sharing: boolean,
  onShare: (id: string) => void,
) {
  return (
    <li key={entry.id} className="hall__row">
      <div className="hall__head">
        <span className="hall__name">{entry.name}</span>
        <span className="hall__when">{relativeTime(entry.retiredAt, now)}</span>
      </div>
      {entry.era ? <p className="hall__era">{entry.era}</p> : null}
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
      {/* The reward for retiring (BRDC-HALL-002): a chronicle, fetched only when asked
          for and kept once it arrives — most kingdoms are never revisited. */}
      {entry.story ? (
        <p className="hall__story">{entry.story}</p>
      ) : (
        <RitualButton
          variant="ghost"
          className="hall__reveal"
          disabled={revealing}
          onClick={() => onReveal(entry.id)}
        >
          {revealing ? 'Writing the chronicle…' : 'Reveal the chronicle'}
        </RitualButton>
      )}
      {/* BRDC-HALL-003: a kingdom retired before the Chronicles existed (or on a device
          that was offline at the time) gets a manual way in, not a silent backfill. */}
      {entry.sharedAt ? (
        <p className="hall__shared">Shared to the Chronicles</p>
      ) : (
        <RitualButton
          variant="ghost"
          className="hall__share"
          disabled={sharing}
          onClick={() => onShare(entry.id)}
        >
          {sharing ? 'Sharing…' : 'Share to the Chronicles'}
        </RitualButton>
      )}
    </li>
  );
}

/** A shared entry (BRDC-HALL-003) — the same figures, no reveal button: the chronicle
 *  reveal writes back to the local store, which someone else's row cannot use. */
function legacyRow(entry: LegacyEntry, now: number) {
  return (
    <li key={`${entry.playerId}:${entry.id}`} className="hall__row">
      <div className="hall__head">
        <span className="hall__name">{entry.name}</span>
        <span className="hall__when">{relativeTime(entry.retiredAt, now)}</span>
      </div>
      {entry.era ? <p className="hall__era">{entry.era}</p> : null}
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
    </li>
  );
}

export function HallOfFamePanel({ open, repository, now, onClose }: HallOfFamePanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const [tab, setTab] = useState<'mine' | 'shared'>('mine');
  const { entries, loading, revealing, reveal, sharing, share } = useHallOfFame(repository, open);
  const { state: legacy, reload: reloadLegacy } = useLegacy(open && tab === 'shared');
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

      <div className="hall__tabs" role="tablist">
        <RitualButton
          variant={tab === 'mine' ? 'primary' : 'ghost'}
          aria-pressed={tab === 'mine'}
          onClick={() => setTab('mine')}
        >
          This device
        </RitualButton>
        <RitualButton
          variant={tab === 'shared' ? 'primary' : 'ghost'}
          aria-pressed={tab === 'shared'}
          onClick={() => setTab('shared')}
        >
          Chronicles
        </RitualButton>
      </div>

      {tab === 'mine' ? (
        <>
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
            <ul className="hall__list">
              {entries.map((e) =>
                row(e, now(), revealing.has(e.id), reveal, sharing.has(e.id), share),
              )}
            </ul>
          ) : null}
        </>
      ) : (
        <>
          {legacy.status === 'loading' ? <p className="hall__note">Reading the Chronicles…</p> : null}

          {legacy.status === 'empty' ? (
            <EmptyState
              mark={<HexMandala size={56} />}
              ink="var(--sacred-gold)"
              title="No kingdom has been shared yet"
              body="Retire a kingdom from the menu, and it joins the Chronicles for every realm to see."
            />
          ) : null}

          {legacy.status === 'unreachable' ? (
            <>
              <p className="hall__note">
                The Chronicles could not be reached. Kingdoms retired on this device are safe
                either way — this is the shared world being quiet, not your record.
              </p>
              <RitualButton variant="ghost" onClick={reloadLegacy}>
                Try again
              </RitualButton>
            </>
          ) : null}

          {legacy.status === 'ready' ? (
            <ul className="hall__list">{legacy.entries.map((e) => legacyRow(e, now()))}</ul>
          ) : null}
        </>
      )}
    </GlassPanel>
  );
}
