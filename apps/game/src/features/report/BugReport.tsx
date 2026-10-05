/**
 * "Report a bug or improvement" (BRDC-BUGREPORT-001).
 *
 * Opened from the menu. The player writes or speaks what went wrong; the panel bundles it
 * with the build, a rough position and the last few log lines, and hands the lot to the
 * native share sheet — one tap to WhatsApp, no account, no server. Where share is missing
 * (desktop), it copies to the clipboard instead.
 *
 * Not a modal: like the rest of the map's panels, ESC and Cancel close it.
 *
 * Or straight to GitHub (BRDC-BUGREPORT-002): a prefilled issue the player submits under
 * their own account. No token in the client, ever.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { APP_VERSION } from '@es3/core';
import type { GameRepository, LogEntry } from '@es3/core';
import { GlassPanel, RitualButton } from '@es3/ui';
import { buildReport, issueUrl } from './report.js';
import { useDictation } from './useDictation.js';
import { useEscape } from '../hud/useEscape.js';
import './bug-report.css';

export interface BugReportProps {
  open: boolean;
  onClose: () => void;
  repository: GameRepository | null;
  position: { lat: number; lng: number } | null;
}

type Sent = 'idle' | 'shared' | 'copied' | 'failed';

export function BugReport({ open, onClose, repository, position }: BugReportProps) {
  const [note, setNote] = useState('');
  const [log, setLog] = useState<readonly LogEntry[]>([]);
  const [sent, setSent] = useState<Sent>('idle');
  const [kind, setKind] = useState<'bug' | 'enhancement'>('bug');
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const append = useCallback((chunk: string) => {
    setNote((n) => (n ? `${n} ${chunk}` : chunk));
  }, []);
  const dictation = useDictation(append);

  // A fresh page on opening, and only then: `onClose` is a new arrow on every menu render
  // and the menu re-renders on every GPS fix, so keyed on it this wiped the note mid-sentence.
  useEffect(() => {
    if (!open) return;
    setNote('');
    setSent('idle');
    areaRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (open) void repository?.getLog().then(setLog);
  }, [open, repository]);
  useEscape(open, onClose);

  const send = useCallback(async () => {
    const text = buildReport({ version: APP_VERSION, now: Date.now(), position, log, note });
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Eldritch Sanctuary — report', text });
        setSent('shared');
      } else {
        await navigator.clipboard.writeText(text);
        setSent('copied');
      }
      setTimeout(onClose, 900);
    } catch {
      // A cancelled share sheet lands here too; leave the panel open so nothing is lost.
      setSent('failed');
    }
  }, [position, log, note, onClose]);

  if (!open) return null;
  const issue = issueUrl({
    kind,
    note,
    version: APP_VERSION,
    platform: navigator.platform || 'unknown',
    device: `${navigator.userAgent} · ${screen.width}×${screen.height}`,
    view: `${location.pathname}${location.hash}`,
  });
  const empty = note.trim().length === 0;

  return (
    <GlassPanel as="section" className="bug-report" aria-label="Report a bug or improvement">
      <div className="bug-report__head">
        <h2 className="bug-report__title">Report a bug or improvement</h2>
        <RitualButton variant="ghost" className="bug-report__close" onClick={onClose} aria-label="Close">
          <span aria-hidden>✕</span>
        </RitualButton>
      </div>

      <label className="bug-report__label" htmlFor="bug-report-note">
        What happened?
      </label>
      <textarea
        id="bug-report-note"
        ref={areaRef}
        className="bug-report__area"
        rows={5}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="What you expected, and what happened instead."
      />

      <div className="bug-report__actions" role="group" aria-label="Kind of report">
        <RitualButton variant="ghost" className="bug-report__kind" aria-pressed={kind === 'bug'} onClick={() => setKind('bug')}>
          Bug
        </RitualButton>
        <RitualButton variant="ghost" className="bug-report__kind" aria-pressed={kind === 'enhancement'} onClick={() => setKind('enhancement')}>
          Improvement
        </RitualButton>
      </div>

      <div className="bug-report__actions">
        {dictation.supported ? (
          <RitualButton
            variant="ghost"
            aria-pressed={dictation.listening}
            onClick={dictation.toggle}
          >
            {dictation.listening ? '● Listening…' : '🎤 Speak'}
          </RitualButton>
        ) : null}
        <RitualButton variant="primary" onClick={send} disabled={empty}>
          Send
        </RitualButton>
        {/* A link, not a button: it goes somewhere. Without a note it has nowhere to go. */}
        <a
          className="es-btn es-btn--ghost"
          href={empty ? undefined : issue}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={empty}
        >
          Open as GitHub issue
        </a>
      </div>

      <p className="bug-report__note" role="status">
        {sent === 'shared'
          ? 'Shared. Pick WhatsApp from the sheet.'
          : sent === 'copied'
            ? 'Copied to the clipboard — paste it to Infinite.'
            : sent === 'failed'
              ? 'That did not send. Try again, or copy the text by hand.'
              : 'Sends the build, a rough position and your last few actions along with this.'}
      </p>
    </GlassPanel>
  );
}
