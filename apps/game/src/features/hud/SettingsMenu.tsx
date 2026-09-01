/**
 * The one menu the map has: sound, vibration, and the two ways to leave.
 *
 * Retreat and Delete used to sit in the bottom bar next to Here and Vigil, which put a
 * destructive action one mis-tap from the control you press every few seconds while
 * walking. They move up here, behind a deliberate open; the walking bar keeps only what
 * a walking thumb needs. Both still route through the existing confirmation dialogs
 * (`SanctumDialogs`) — this menu only relocates the trigger.
 *
 * Not a modal: the player may be moving, and a focus trap is the wrong shape for
 * something you flick open and shut. ESC and a tap outside close it.
 */
import { useEffect, useRef, useState } from 'react';
import { APP_VERSION } from '@es3/core';
import type { GameRepository } from '@es3/core';
import { GlassPanel, RitualButton } from '@es3/ui';
import { ChangelogPanel } from '../changelog/ChangelogPanel.js';
import { BugReport } from '../report/BugReport.js';
import type { Settings } from './settings.js';
import './settings-menu.css';

export interface SettingsMenuProps {
  settings: Settings;
  onChange: (next: Settings) => void;
  onRetreat: () => void;
  onDeleteProgress: () => void;
  /** Opens the action log (BRDC-LOG-001). */
  onOpenLog: () => void;
  /** For the field report — the log tail and a rough position (BRDC-BUGREPORT-001). */
  repository: GameRepository | null;
  position: { lat: number; lng: number } | null;
  /** Hidden while a cell or the Hearth has the top of the screen. */
  visible?: boolean;
}

export function SettingsMenu({
  settings,
  onChange,
  onRetreat,
  onDeleteProgress,
  onOpenLog,
  repository,
  position,
  visible = true,
}: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const [changelog, setChangelog] = useState(false);
  const [report, setReport] = useState(false);
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
    </>
  );
  if (!visible) return overlays;

  const toggle = (key: keyof Settings) => onChange({ ...settings, [key]: !settings[key] });
  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

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
        <GlassPanel as="div" className="settings-menu__panel" role="dialog" aria-label="Menu">
          {(['sound', 'vibration'] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="switch"
              aria-checked={settings[key]}
              className="settings-menu__switch"
              onClick={() => toggle(key)}
            >
              <span>{key === 'sound' ? 'Sound' : 'Vibration'}</span>
              <span className="settings-menu__state" aria-hidden>
                {settings[key] ? 'On' : 'Off'}
              </span>
            </button>
          ))}

          <hr className="settings-menu__rule" />

          <button type="button" className="settings-menu__action" onClick={() => run(onOpenLog)}>
            History
          </button>
          <button
            type="button"
            className="settings-menu__action"
            onClick={() => run(() => setReport(true))}
          >
            Report a bug or improvement
          </button>
          <button
            type="button"
            className="settings-menu__action"
            onClick={() => run(() => setChangelog(true))}
          >
            <span>What&rsquo;s new</span>
            <span className="settings-menu__state" aria-hidden>
              v{APP_VERSION}
            </span>
          </button>
          <button
            type="button"
            className="settings-menu__action"
            onClick={() => run(onRetreat)}
          >
            Retreat from the map
          </button>
          <button
            type="button"
            className="settings-menu__action settings-menu__action--danger"
            onClick={() => run(onDeleteProgress)}
          >
            Delete progress
          </button>
        </GlassPanel>
      ) : null}
      </div>
    </>
  );
}
