/**
 * "Report a bug or improvement" (BRDC-BUGREPORT-001).
 *
 * Opened from the menu. The player writes or speaks what went wrong; the panel bundles it
 * with the build, a rough position and the last few log lines, and hands the lot to the
 * native share sheet — one tap to WhatsApp, no account, no server. Where share is missing
 * (desktop), it copies to the clipboard instead.
 *
 * Not a modal: like the rest of the map's panels, ESC and Cancel close it.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { APP_VERSION } from '@es3/core';
import type { GameRepository, LogEntry } from '@es3/core';
import { GlassPanel, RitualButton } from '@es3/ui';
import { buildReport } from './report.js';
import { useDictation } from './useDictation.js';
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
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const append = useCallback((chunk: string) => {
    setNote((n) => (n ? `${n} ${chunk}` : chunk));
  }, []);
  const dictation = useDictation(append);

  useEffect(() => {
    if (!open) return;
    setNote('');
    setSent('idle');
    areaRef.current?.focus();
    void repository?.getLog().then(setLog);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, repository, onClose]);

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
        <RitualButton variant="primary" onClick={send} disabled={note.trim().length === 0}>
          Send
        </RitualButton>
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
