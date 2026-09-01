/**
 * The adventure dialogue, over the map (BRDC-QUEST-001).
 *
 * Not a modal — the player may be walking, so ESC and "Later" dismiss it and it never
 * traps focus. Two shapes: a shelf of adventures to begin, or one open story — a portrait,
 * the speaker, the narration, and the choices. A locked choice stays visible and says why.
 */
import { useEffect } from 'react';
import { GlassPanel, RitualButton } from '@es3/ui';
import type { AdventureView } from '@es3/core';
import { Portrait } from './portraits.js';
import type { AdventureBinding } from './useAdventure.js';
import './adventure-dialog.css';

const REFUSAL: Readonly<Record<string, string>> = {
  gate: 'You are not ready for that yet — walk, and claim the ground it asks for.',
  'cannot-afford': 'Your pouch is too light for that.',
  'already-begun': 'That tale is already underway.',
  'no-such-adventure': 'That tale is not here.',
  'not-active': 'That tale is not open.',
};

function Shelf({ list, onStart }: { list: readonly AdventureView[]; onStart: (id: string) => void }) {
  return (
    <ul className="adventure__shelf">
      {list.map((a) => (
        <li key={a.id} className="adventure__shelf-row">
          <span>{a.title}</span>
          {a.state === 'done' ? (
            <span className="adventure__done" aria-label="finished">
              ✦ finished
            </span>
          ) : (
            <RitualButton variant="ghost" onClick={() => onStart(a.id)}>
              Begin
            </RitualButton>
          )}
        </li>
      ))}
    </ul>
  );
}

export interface AdventureDialogProps {
  binding: AdventureBinding;
  onClose: () => void;
}

export function AdventureDialog({ binding, onClose }: AdventureDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const a = binding.active;

  return (
    <GlassPanel as="section" className="adventure" aria-label={a ? a.title : 'Adventures'}>
      <div className="adventure__head">
        <h2 className="adventure__title">{a ? a.title : 'Adventures'}</h2>
        <RitualButton variant="ghost" className="adventure__close" onClick={onClose} aria-label="Close">
          <span aria-hidden>✕</span>
        </RitualButton>
      </div>

      {a ? (
        <>
          <div className="adventure__speaker">
            <span className="adventure__portrait" aria-hidden>
              <Portrait speaker={a.speaker ?? 'Narrator'} />
            </span>
            <span className="adventure__name">{a.speaker}</span>
          </div>
          {(a.text ?? []).map((line, i) => (
            <p key={i} className="adventure__line">
              {line}
            </p>
          ))}
          <div className="adventure__choices">
            {(a.choices ?? []).map((c, i) => (
              <RitualButton
                key={i}
                variant="ghost"
                disabled={c.locked}
                title={c.locked ? 'Not yet — walk and claim what it needs.' : undefined}
                onClick={() => binding.onChoose(i)}
              >
                {c.locked ? `🔒 ${c.text}` : c.text}
              </RitualButton>
            ))}
          </div>
          <RitualButton variant="ghost" className="adventure__abandon" onClick={() => binding.onAbandon(a.id)}>
            Abandon this tale
          </RitualButton>
        </>
      ) : (
        <Shelf list={binding.list} onStart={binding.onStart} />
      )}

      {binding.refusal ? (
        <p className="adventure__refusal" role="status">
          {REFUSAL[binding.refusal] ?? 'That did not work.'}
        </p>
      ) : null}
    </GlassPanel>
  );
}
