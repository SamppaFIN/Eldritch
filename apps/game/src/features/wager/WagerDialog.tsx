/**
 * The Wager, carried by hand.
 *
 * There is no server until Phase 3, so multiplayer is a block of text. You copy your
 * sanctuary, send it through whatever app you already use, and your friend's game reads
 * it back as a rival holding real ground.
 *
 * It lives on the title screen rather than in the HUD on purpose: sending and receiving a
 * challenge is something done sitting down, and the walking HUD has a measured budget of
 * thirty per cent of the screen that a fifth control would break.
 */
import { useCallback, useState } from 'react';
import { Modal, RitualButton } from '@es3/ui';
import type { ChallengeFault, GameRepository } from '@es3/core';
import './wager.css';

export interface WagerDialogProps {
  open: boolean;
  repository: GameRepository | null;
  onClose: () => void;
}

/** Errors say what to do, not what failed. */
const FAULT: Readonly<Record<ChallengeFault, string>> = {
  'not-json': 'That is not a whole challenge. Copy the message again, from { to }.',
  'not-a-challenge': 'That text is not a challenge. Paste what your friend sent you.',
  'wrong-version': 'That challenge came from a different version of the game.',
  damaged: 'The message was changed on the way. Ask for it again.',
  'too-large': 'That challenge carries more ground than a message can hold.',
  yourself: 'That is your own challenge. Send it to someone else.',
};

type Phase = 'idle' | 'sealed' | 'copied' | 'accepted' | 'refused';

export function WagerDialog({ open, repository, onClose }: WagerDialogProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [text, setText] = useState('');
  const [incoming, setIncoming] = useState('');
  const [fault, setFault] = useState<ChallengeFault | null>(null);
  const [took, setTook] = useState(0);

  const seal = useCallback(() => {
    if (!repository) return;
    void repository.exportChallenge(Date.now()).then((json) => {
      setText(json);
      setPhase('sealed');
    });
  }, [repository]);

  const copy = useCallback(() => {
    /*
     * The clipboard can refuse — an insecure origin, a browser that wants a fresh
     * gesture, a permission the user never granted. The text is on screen and
     * selectable either way, so a refusal is not a dead end and does not need an alarm.
     */
    void navigator.clipboard
      ?.writeText(text)
      .then(() => setPhase('copied'))
      .catch(() => setPhase('sealed'));
  }, [text]);

  const accept = useCallback(() => {
    if (!repository) return;
    void repository.importChallenge(incoming, Date.now()).then((result) => {
      if (result.ok) {
        setTook(result.challenge.cells.length);
        setFault(null);
        setPhase('accepted');
      } else {
        setFault(result.fault);
        setPhase('refused');
      }
    });
  }, [repository, incoming]);

  return (
    <Modal
      open={open}
      title="The Wager"
      onClose={onClose}
      footer={<RitualButton onClick={onClose}>Done</RitualButton>}
    >
      <p>
        There is no server. A challenge is a block of text: send yours to a friend, and
        their sanctuary appears on your map as ground to take.
      </p>

      <section className="wager__half" aria-labelledby="wager-send">
        <h3 id="wager-send" className="wager__heading">
          Send yours
        </h3>

        {phase === 'sealed' || phase === 'copied' ? (
          <>
            {/* Read-only rather than disabled: a disabled field cannot be selected, and
                selecting the text by hand is the fallback when the clipboard refuses. */}
            <textarea
              className="wager__text"
              readOnly
              rows={4}
              value={text}
              aria-label="Your challenge"
            />
            <div className="wager__row">
              <RitualButton variant="ghost" onClick={copy}>
                {phase === 'copied' ? 'Copied' : 'Copy'}
              </RitualButton>
            </div>
          </>
        ) : (
          <RitualButton variant="ghost" onClick={seal} disabled={!repository}>
            Seal my sanctuary
          </RitualButton>
        )}
      </section>

      <section className="wager__half" aria-labelledby="wager-take">
        <h3 id="wager-take" className="wager__heading">
          Take theirs
        </h3>
        <textarea
          className="wager__text"
          rows={4}
          value={incoming}
          onChange={(e) => setIncoming(e.target.value)}
          placeholder="Paste the challenge you were sent"
          aria-label="A challenge you were sent"
        />
        <div className="wager__row">
          <RitualButton variant="ghost" onClick={accept} disabled={!repository || !incoming.trim()}>
            Accept the Wager
          </RitualButton>
        </div>

        {phase === 'accepted' ? (
          <p className="wager__note" role="status">
            Their ground is on your map — {took} {took === 1 ? 'cell' : 'cells'}. Walk it to
            take it.
          </p>
        ) : null}
        {phase === 'refused' && fault ? (
          <p className="wager__note wager__note--fault" role="status">
            {FAULT[fault]}
          </p>
        ) : null}
      </section>
    </Modal>
  );
}
