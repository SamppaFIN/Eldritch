/**
 * Watching the Wager.
 *
 * The fight is over before this renders — it was decided the moment the message was
 * accepted, identically on both phones. This is a replay, and saying so matters: nothing
 * here can change the result, and nothing here is waiting on anything.
 *
 * A round at a time, because two numbers appearing at once is a result, and a result is
 * not a duel. Under `prefers-reduced-motion` it goes straight to the end — the verdict is
 * the information, the stepping is the drama.
 */
import { useEffect, useState } from 'react';
import { HexMandala } from '@es3/ui';
import type { WagerReport } from '@es3/core';
import { fightFrames } from './fight.js';

export interface WagerFightProps {
  report: WagerReport;
  me: string;
}

/** Slow enough to follow while standing, short enough not to be a cutscene. */
const ROUND_MS = 260;

export function WagerFight({ report, me }: WagerFightProps) {
  const frames = fightFrames(report.outcome, me);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduced || frames.length === 0) {
      setShown(frames.length);
      return;
    }

    setShown(0);
    let n = 0;
    const timer = setInterval(() => {
      n += 1;
      setShown(n);
      if (n >= frames.length) clearInterval(timer);
    }, ROUND_MS);
    return () => clearInterval(timer);
    // Restart when a different fight arrives, not on every render.
  }, [report.challenge.sum, frames.length]);

  const frame = frames[Math.max(0, Math.min(shown, frames.length) - 1)];
  const done = shown >= frames.length;
  const iWon = report.outcome.winner === me;

  return (
    <div className="fight">
      <div className="fight__bars">
        <Bar label="You" value={frame?.mine ?? 1} tone="mine" />
        <Bar label={report.challenge.name} value={frame?.theirs ?? 1} tone="theirs" />
      </div>

      <p className="fight__round es-numeric" aria-hidden>
        {done
          ? `${frames.length} ${frames.length === 1 ? 'round' : 'rounds'}`
          : `Round ${frame?.n ?? 1}`}
      </p>

      {/* The mandala is the moment, and it arrives once — not under every round. */}
      {done ? (
        <div className="fight__verdict">
          {iWon ? (
            <HexMandala size={90} animate={900} className="fight__sigil" />
          ) : null}
          <p className="fight__verdict-line">
            {iWon ? 'You hold' : `${report.challenge.name} breaks through`}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Bar({ label, value, tone }: { label: string; value: number; tone: 'mine' | 'theirs' }) {
  return (
    <div className="fight__bar">
      <span className="fight__bar-label">{label}</span>
      {/* The bar is decoration; the percentage is announced to assistive tech, and the
          verdict below says it in words. Colour and length never carry this alone. */}
      <div
        className="fight__bar-track"
        role="progressbar"
        aria-label={`${label}: might remaining`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
      >
        <div
          className="fight__bar-fill"
          data-tone={tone}
          style={{ inlineSize: `${Math.max(0, value) * 100}%` }}
        />
      </div>
    </div>
  );
}
