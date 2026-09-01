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
import { GlassPanel, RitualButton } from '@es3/ui';
import type { Settings } from './settings.js';
import './settings-menu.css';

export interface SettingsMenuProps {
  settings: Settings;
  onChange: (next: Settings) => void;
  onRetreat: () => void;
  onDeleteProgress: () => void;
  /** Hidden while a cell or the Hearth has the top of the screen. */
  visible?: boolean;
}

export function SettingsMenu({
  settings,
  onChange,
  onRetreat,
  onDeleteProgress,
  visible = true,
}: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
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

  if (!visible) return null;

  const toggle = (key: keyof Settings) => onChange({ ...settings, [key]: !settings[key] });
  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
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
  );
}
