/**
 * The ledger of held ground — what you have, and what it wants (BRDC-LANDS-001).
 *
 * The map answers "where am I". Past a few dozen hexes it cannot answer "what have I got",
 * and Infinite holds three hundred and forty: auditing those by scrolling a map is not
 * something a person does. So this is a list, and its order is its opinion — unrevealed
 * first, because revealing is free, pays every time, and is the one thing here that can be
 * done without walking anywhere; then whatever is closest to being lost.
 *
 * Same sheet as `CodexPanel` and `LogPanel`: non-modal, ESC closes, capped clear of the
 * HUD and scrolling inside.
 */
import { useRef, useState } from 'react';
import { EmptyState, FlowerOfLife, GlassPanel, RitualButton } from '@es3/ui';
import type { Collected, GameRepository, H3Index } from '@es3/core';
import { useEscape } from '../hud/useEscape.js';
import { useLands } from './useLands.js';
import { WonderMoment } from '../wonder/WonderMoment.js';
import { HexesTab } from './HexesTab.js';
import { WorksTab } from './WorksTab.js';
import { TemplesTab } from './TemplesTab.js';
import { AnomaliesTab } from './AnomaliesTab.js';
import { RoutesTab } from './RoutesTab.js';
import './lands-panel.css';

export interface LandsPanelProps {
  open: boolean;
  repository: GameRepository | null;
  now: () => number;
  /** Show this hex on the map, and close. A different act from revealing it. */
  onShowCell: (h3: string) => void;
  /** A payout from this page, for the toast and the pling the map already owns. */
  onGain: (collected: Collected) => void;
  onClose: () => void;
  /** A hand moved from the Works tab: the map re-reads (BRDC-LEDGER-002). */
  onChanged?: (() => void) | undefined;
  /** Tour the temples, the card open on each (BRDC-LEDGER-003). */
  onTour?: ((h3s: readonly H3Index[]) => void) | undefined;
}

/** The Ledger's tabs (BRDC-LEDGER-001): every collection you hold, one list each. */
const TABS = [
  { id: 'hexes', label: 'Hexes' },
  { id: 'works', label: 'Works' },
  { id: 'temples', label: 'Temples' },
  { id: 'anomalies', label: 'Anomalies' },
  { id: 'routes', label: 'Routes' },
] as const;
type Tab = (typeof TABS)[number]['id'];

export function LandsPanel({ open, repository, now, onShowCell, onGain, onClose, onChanged = () => {}, onTour = () => {} }: LandsPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const [tab, setTab] = useState<Tab>('hexes');
  const { list, summary, loading, reveal, revealAll, found, gain, wonder, clearWonder } = useLands(
    repository,
    open,
    now,
  );

  // One toast and one pling for every payout in the game, wherever it was earned (§14).
  const lastGain = useRef<number>(0);
  if (gain && gain.at !== lastGain.current) {
    lastGain.current = gain.at;
    onGain(gain);
  }
  useEscape(open, onClose);

  if (!open) return null;

  return (
    <GlassPanel as="section" ref={panelRef} className="lands" aria-label="Your lands" tabIndex={-1}>
      <div className="lands__bar">
        <h2 className="lands__title">Your lands</h2>
        <RitualButton variant="ghost" className="lands__close" onClick={onClose} aria-label="Close">
          <span aria-hidden>✕</span>
        </RitualButton>
      </div>

      <div className="ledger__tabs" role="tablist" aria-label="What to list">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" className="ledger__tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hexes' ? (
        <>
          {loading && list.length === 0 ? <p className="lands__note">Counting your ground…</p> : null}
          {!loading && list.length === 0 ? (
            <EmptyState
              mark={<FlowerOfLife size={56} />}
              ink="var(--awareness-green)"
              title="No ground yet"
              body="Walk into the hex beside you and it is yours. The first one costs nothing."
              action={{ label: 'Back to the map', onClick: onClose }}
            />
          ) : null}
          {list.length > 0 ? (
            <HexesTab list={list} summary={summary} found={found} reveal={reveal} revealAll={revealAll} onShowCell={onShowCell} />
          ) : null}
        </>
      ) : null}
      {tab === 'works' ? <WorksTab repository={repository} open={open} now={now} onShowCell={onShowCell} onChanged={onChanged} /> : null}
      {tab === 'temples' ? <TemplesTab repository={repository} open={open} now={now} onShowCell={onShowCell} onTour={onTour} /> : null}
      {tab === 'anomalies' ? <AnomaliesTab repository={repository} open={open} now={now} onShowCell={onShowCell} /> : null}
      {tab === 'routes' ? <RoutesTab repository={repository} open={open} now={now} onShowCell={onShowCell} /> : null}

      {/* A ledger reveal reaches any hex you hold, so a wonder can be found from here.
          The moment is the same one the map shows — finding one in silence because it was
          the wrong screen would be the worst place in the game to be inconsistent. */}
      {wonder ? <WonderMoment id={wonder} onClose={clearWonder} /> : null}
    </GlassPanel>
  );
}
