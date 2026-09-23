/**
 * Settings, drawn to the Sigil document's screen 01.
 *
 * The document replaced this screen rather than tidied it, and said why in its own note:
 * *"Eleven scrolling rows became three named groups and a 2-up destination grid. Only the
 * loop toggle keeps its helper text — the one setting that changes how the game is played.
 * History and GPX import are rare, so they drop behind Advanced, and the whole pane fits
 * one screen with nothing to scroll."*
 *
 * So: a sheet, not a dropdown. Named groups with real pill switches instead of a column of
 * identical rows reading "On"/"Off". Destinations as a 2-up grid of cards, each with a
 * word about what it is. Everything rare or destructive behind one **Advanced** row.
 *
 * Nothing was removed — every action the old menu reached is still reachable, and both
 * confirmation dialogs (`SanctumDialogs`, `PouchResetDialog`) are untouched. This moves
 * where things sit, which is the whole of what the screen needed.
 *
 * Not a modal: the player may be moving, and a focus trap is the wrong shape for something
 * flicked open and shut. ESC and a tap outside close it.
 */
import { useEffect, useRef, useState } from 'react';
import { APP_VERSION } from '@es3/core';
import type { GameRepository } from '@es3/core';
import { GlassPanel, RitualButton } from '@es3/ui';
import { ChangelogPanel } from '../changelog/ChangelogPanel.js';
import { BugReport } from '../report/BugReport.js';
import { PouchResetDialog } from './Sanctum.js';
import type { Settings } from './settings.js';
import './settings-menu.css';

export interface SettingsMenuProps {
  settings: Settings;
  onChange: (next: Settings) => void;
  onRetreat: () => void;
  onDeleteProgress: () => void;
  /** Ends the current kingdom on purpose, archiving it first (BRDC-HALL-001). Absent
   *  for a route-mode save, which has no kingdom in that sense (BRDC-MODE-001). */
  onRetireKingdom?: (() => void) | undefined;
  /** Opens the action log (BRDC-LOG-001). */
  onOpenLog: () => void;
  /** Opens the Codex of Dominion (BRDC-CODEX-001). Absent for a route-mode save, which
   *  a Codex measuring consciousness and works never has anything to say about — it gets
   *  `onOpenRouteCodex` instead (BRDC-MODE-002). */
  onOpenCodex?: (() => void) | undefined;
  /** Opens Route mode's own leaderboard — distance and hexes only (BRDC-MODE-002). */
  onOpenRouteCodex?: (() => void) | undefined;
  /** Opens the ledger of held ground (BRDC-LANDS-001). */
  onOpenLands: () => void;
  /** Opens the Hall of Fame — kingdoms already retired (BRDC-HALL-001). Absent for a
   *  route-mode save (BRDC-MODE-001). */
  onOpenHallOfFame?: (() => void) | undefined;
  /** Opens the clan screen — create, join, or leave (BRDC-CLAN-001). Absent for a
   *  route-mode save (BRDC-MODE-001). */
  onOpenClan?: (() => void) | undefined;
  /** Opens the clan league — every clan measured (BRDC-CLAN-002). Absent for a
   *  route-mode save (BRDC-MODE-001). */
  onOpenClanCodex?: (() => void) | undefined;
  /** Import a recorded walk (BRDC-GPX-001). */
  onOpenGpx: () => void;
  /** The Wager — a destination in the document's grid, not only a Keep button. */
  onWager?: (() => void) | undefined;
  /** Dev only: the map editor (BRDC-MAP-EDIT-001). Absent in a player's build. */
  onOpenEditor?: (() => void) | undefined;
  /** Opens the in-game guide's front page (BRDC-WIKI-001). */
  onOpenGuide: () => void;
  /** For the field report — the log tail and a rough position (BRDC-BUGREPORT-001). */
  repository: GameRepository | null;
  position: { lat: number; lng: number } | null;
  /** Dev only: top the pouch up (BRDC-ECON-002). Absent in a production build. */
  onDebugGrant?: () => void;
  /** Empty the pouch, after a confirmation (BRDC-ECON-005). */
  onResetPouch?: () => void;
  /** Hidden while a cell or the Hearth has the top of the screen. */
  visible?: boolean;
}

/** The document's groups. Only the loop toggle earns a note — it changes how the game plays. */
const WALKING: [keyof Settings, string][] = [
  ['sound', 'Sound'],
  ['vibration', 'Vibration'],
  ['loopClosure', 'Claim by closing a loop'],
];

const MAP: [keyof Settings, string][] = [
  ['buildingIcons', 'Building icons'],
  ['revealRivals', 'Rival cell detail'],
  ['daylight', 'Daylight mode'],
  ['shareWorld', 'Share your realm'],
];

export function SettingsMenu({
  settings,
  onChange,
  onRetreat,
  onDeleteProgress,
  onRetireKingdom,
  onOpenLog,
  onOpenCodex,
  onOpenRouteCodex,
  onOpenLands,
  onOpenHallOfFame,
  onOpenClan,
  onOpenClanCodex,
  onOpenGpx,
  onWager,
  onOpenEditor,
  onOpenGuide,
  repository,
  position,
  onDebugGrant,
  onResetPouch,
  visible = true,
}: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [changelog, setChangelog] = useState(false);
  const [report, setReport] = useState(false);
  const [emptying, setEmptying] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  const overlays = (
    <>
      <ChangelogPanel open={changelog} onClose={() => setChangelog(false)} />
      <BugReport
        open={report}
        onClose={() => setReport(false)}
        repository={repository}
        position={position}
      />
      <PouchResetDialog
        open={emptying}
        onConfirm={() => {
          setEmptying(false);
          onResetPouch?.();
        }}
        onCancel={() => setEmptying(false)}
      />
    </>
  );
  if (!visible) return overlays;

  const toggle = (key: keyof Settings) => onChange({ ...settings, [key]: !settings[key] });

  const run = (action: () => void) => {
    /*
     * Move focus to the ☰ button before the sheet unmounts.
     *
     * The clicked row is about to leave the DOM in the same render that opens the
     * confirmation Modal, and a focused element that is removed drops focus to <body> —
     * before Modal's own effect ever runs. Modal captures document.activeElement to give
     * focus back on close; with nothing meaningful focused, closing the confirmation
     * dropped a keyboard user at the top of the document instead of back at the menu.
     */
    rootRef.current?.querySelector<HTMLButtonElement>('.settings-menu__button')?.focus();
    setOpen(false);
    action();
  };

  /** A row with a real pill switch, the way the document draws it. */
  const row = ([key, label]: [keyof Settings, string]) => (
    <button
      key={key}
      type="button"
      role="switch"
      aria-checked={settings[key]}
      className="settings__row"
      onClick={() => toggle(key)}
    >
      <span className="settings__row-label">{label}</span>
      <span className="settings__pill" aria-hidden>
        <span className="settings__knob" />
      </span>
    </button>
  );

  /** One destination card: what it is, and a word about why you would open it. */
  const link = (name: string, sub: string, go: () => void, ink?: string) => (
    <button type="button" className="settings__link" onClick={() => run(go)}>
      <span className="settings__link-name" style={ink ? { color: ink } : undefined}>
        {name}
      </span>
      <span className="settings__link-sub">{sub}</span>
    </button>
  );

  return (
    <>
      {overlays}
      <div className="settings-menu" ref={rootRef}>
        <RitualButton
          variant="ghost"
          className="settings-menu__button"
          aria-expanded={open}
          aria-haspopup="true"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden>☰</span>
        </RitualButton>

        {open ? (
          <GlassPanel as="div" className="settings" role="dialog" aria-label="Settings">
            <div className="settings__head">
              {advanced ? (
                <button
                  type="button"
                  className="settings__close"
                  aria-label="Back to settings"
                  onClick={() => setAdvanced(false)}
                >
                  <span aria-hidden>‹</span>
                </button>
              ) : null}
              <h2 className="settings__title">{advanced ? 'Advanced' : 'Settings'}</h2>
              <button
                type="button"
                className="settings__close"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <span aria-hidden>✕</span>
              </button>
            </div>

            {advanced ? null : (
              <>
            <div className="settings__group">
              <p className="settings__group-label">Walking</p>
              <div className="settings__rows">{WALKING.map(row)}</div>
              {/* The one setting that changes how the game is played keeps its sentence. */}
              <p className="settings__note">
                Off: you take ground by stepping into a hex beside yours.
              </p>
            </div>

            <div className="settings__group">
              <p className="settings__group-label">The map</p>
              <div className="settings__rows">{MAP.map(row)}</div>
            </div>

            <div className="settings__group">
              <p className="settings__group-label">Go to</p>
              <div className="settings__grid">
                {link('Guide', 'How it plays', onOpenGuide)}
                {link('Your lands', 'The ground you hold', onOpenLands)}
                {onOpenCodex ? link('Codex', 'Where you stand', onOpenCodex, 'var(--sacred-gold)') : null}
                {onOpenRouteCodex
                  ? link('Route Ledger', 'Distance and hexes measured', onOpenRouteCodex, 'var(--sacred-gold)')
                  : null}
                {onOpenHallOfFame
                  ? link('Hall of Fame', 'Kingdoms retired', onOpenHallOfFame, 'var(--sacred-gold)')
                  : null}
                {onOpenClan ? link('Clan', 'Join or start a friend circle', onOpenClan) : null}
                {onOpenClanCodex
                  ? link('Clan Codex', 'Clans measured against each other', onOpenClanCodex)
                  : null}
                {onWager ? link('The Wager', 'Challenge a friend', onWager, 'var(--r-token)') : null}
              </div>
            </div>

            {/* Rare and destructive both live behind one row, so the pane above it fits a
                screen. The document drops History and import here; Retreat, the pouch and
                Delete progress belong with them rather than a mis-tap from a destination. */}
            <button
              type="button"
              className="settings__advanced"
              aria-expanded={advanced}
              onClick={() => setAdvanced((v) => !v)}
            >
              <span>Advanced · history · import a walk</span>
              <span className="settings__chevron" aria-hidden>
                ›
              </span>
            </button>
              </>
            )}

            {advanced ? (
              <div className="settings__rows">
                <button type="button" className="settings__action" onClick={() => run(onOpenLog)}>
                  History
                </button>
                <button type="button" className="settings__action" onClick={() => run(onOpenGpx)}>
                  Import a walk
                </button>
                <button
                  type="button"
                  className="settings__action"
                  onClick={() => run(() => setReport(true))}
                >
                  Report a bug or improvement
                </button>
                <button
                  type="button"
                  className="settings__action"
                  onClick={() => run(() => setChangelog(true))}
                >
                  <span>What&rsquo;s new</span>
                  <span className="settings__version es-numeric">v{APP_VERSION}</span>
                </button>
                <button type="button" className="settings__action" onClick={() => run(onRetreat)}>
                  Retreat from the map
                </button>
                {onRetireKingdom ? (
                  <button
                    type="button"
                    className="settings__action"
                    onClick={() => run(onRetireKingdom)}
                  >
                    Retire this kingdom
                  </button>
                ) : null}
                {onResetPouch ? (
                  <button
                    type="button"
                    className="settings__action settings__action--danger"
                    onClick={() => run(() => setEmptying(true))}
                  >
                    Empty the pouch
                  </button>
                ) : null}
                <button
                  type="button"
                  className="settings__action settings__action--danger"
                  onClick={() => run(onDeleteProgress)}
                >
                  Delete progress
                </button>
                {import.meta.env.DEV && onOpenEditor ? (
                  <button
                    type="button"
                    className="settings__action settings__action--dev"
                    onClick={() => run(onOpenEditor)}
                  >
                    Map editor
                  </button>
                ) : null}
                {import.meta.env.DEV && onDebugGrant ? (
                  <button
                    type="button"
                    className="settings__action settings__action--dev"
                    onClick={() => run(onDebugGrant)}
                  >
                    Debug · +200 every resource
                  </button>
                ) : null}
              </div>
            ) : null}
          </GlassPanel>
        ) : null}
      </div>
    </>
  );
}
