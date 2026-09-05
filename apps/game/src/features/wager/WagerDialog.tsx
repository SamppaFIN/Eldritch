/**
 * The Wager, carried by hand.
 *
 * There is no server until Phase 3, so multiplayer is a block of text. You copy your
 * sanctuary, send it through whatever app you already use, and your friend's game reads
 * it back as a rival holding real ground — and where their ground overlaps yours, the
 * cell is shared. Since BRDC-WAGER-JSON-006 there is no duel: accepting a Wager is
 * territory only, and the same message can be accepted again to refresh it.
 *
 * It lives on the title screen rather than in the HUD on purpose: sending and receiving a
 * challenge is something done sitting down, and the walking HUD has a measured budget of
 * thirty per cent of the screen that a fifth control would break.
 */
import { useCallback, useState } from 'react';
import { Modal, RitualButton } from '@es3/ui';
import type { ChallengeFault, GameRepository, WagerIdentity } from '@es3/core';
import { readNation } from '../nation/nation.js';
import './wager.css';

export interface WagerDialogProps {
  open: boolean;
  repository: GameRepository | null;
  onClose: () => void;
  /**
   * Their ground just landed in storage — re-read the map. Optional: opened from the
   * title screen (BRDC-WAGER-JSON-001) there is no map yet to refresh.
   */
  onImported?: () => void;
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

interface Landed {
  name: string;
  imported: number;
  shared: number;
}

export function WagerDialog({ open, repository, onClose, onImported }: WagerDialogProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [text, setText] = useState('');
  const [incoming, setIncoming] = useState('');
  const [fault, setFault] = useState<ChallengeFault | null>(null);
  const [landed, setLanded] = useState<Landed | null>(null);

  const seal = useCallback(() => {
    if (!repository) return;
    const n = readNation();
    const identity: WagerIdentity = { banner: n.bannerId };
    if (n.name.trim()) identity.nation = n.name.trim();
    void repository.exportChallenge(Date.now(), identity).then((json) => {
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
    void (async () => {
      // One call: their ground arrives and overlaps are tagged shared. No duel, and no
      // spent state — the same message can be accepted again to refresh their reach.
      const result = await repository.importChallenge(incoming, Date.now());
      if (!result.ok) {
        setFault(result.fault);
        setPhase('refused');
        return;
      }
      const { challenge, imported, shared } = result.report;
      setFault(null);
      setPhase('accepted');
      setLanded({ name: challenge.nation ?? challenge.name, imported, shared });
      // Their ground is in storage now; nothing else was going to notice until the
      // player's next step happened to refresh the map.
      onImported?.();
    })();
  }, [repository, incoming, onImported]);

  return (
    <Modal
      open={open}
      title="The Wager"
      onClose={onClose}
      footer={<RitualButton onClick={onClose}>Done</RitualButton>}
    >
      <p>
        There is no server. A challenge is a block of text: send yours to a friend, and
        their sanctuary appears on your map — ground to walk over, and where it meets yours,
        ground you share.
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

        {phase === 'accepted' && landed ? (
          <p className="wager__note" role="status">
            {landed.name}&rsquo;s ground is on your map — {landed.imported}{' '}
            {landed.imported === 1 ? 'cell' : 'cells'}
            {landed.shared > 0
              ? `, and ${landed.shared} you now share.`
              : '. Walk it to take it.'}{' '}
            You can accept it again any time to refresh their reach.
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
