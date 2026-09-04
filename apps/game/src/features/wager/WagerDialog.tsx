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
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, RitualButton } from '@es3/ui';
import type { ChallengeFault, Defence, GameRepository, WagerIdentity, WagerReport } from '@es3/core';
import { regionOf } from '@es3/core';
import { readNation } from '../nation/nation.js';
import { WagerFight } from './WagerFight.js';
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
  'already-fought': 'You have already fought this one. Ask them for a fresh challenge.',
};

type Phase = 'idle' | 'sealed' | 'copied' | 'accepted' | 'refused';

export function WagerDialog({ open, repository, onClose }: WagerDialogProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [text, setText] = useState('');
  const [incoming, setIncoming] = useState('');
  const [fault, setFault] = useState<ChallengeFault | null>(null);
  const [took, setTook] = useState(0);
  const [defence, setDefence] = useState<Defence>('wall');
  const [outcome, setOutcome] = useState<{ report: WagerReport; me: string } | null>(null);
  /*
   * A choice made before `repository` exists yet — the Wager can open while
   * `createRepository()` is still resolving. Holding it here means the load-back
   * effect below writes it through once the repository arrives, instead of silently
   * reading the still-unwritten stored value and reverting the tap.
   */
  const pending = useRef<Defence | null>(null);

  useEffect(() => {
    if (!repository || !open) return;
    if (pending.current) {
      void repository.setDefence(pending.current);
      pending.current = null;
      return;
    }
    void repository.getDefence().then(setDefence);
  }, [repository, open]);

  const chooseDefence = useCallback(
    (next: Defence) => {
      setDefence(next);
      // Written before it can be sealed into a challenge: a defence the other phone does
      // not know about would make the two of them compute different fights.
      if (repository) void repository.setDefence(next);
      else pending.current = next;
      setPhase('idle');
    },
    [repository],
  );

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
      /*
       * One call: their ground arrives, the Wager is fought and the spoils settle
       * together. The fight is resolved on this phone from the message alone — theirs
       * will compute the identical result from the identical inputs, which is the whole
       * point of the rules being deterministic. Nobody sends a result, because a result
       * is a claim and a claim is a thing to be lied about.
       */
      const result = await repository.importChallenge(incoming, Date.now());
      if (!result.ok) {
        setFault(result.fault);
        setPhase('refused');
        return;
      }

      const me = await repository.getProfile();
      setTook(result.report.challenge.cells.length);
      setFault(null);
      setPhase('accepted');
      setOutcome({ report: result.report, me: me.id });
    })();
  }, [repository, incoming]);

  const provinces = outcome
    ? new Set(outcome.report.challenge.cells.map((c) => regionOf(c.h3))).size
    : 0;

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

      <section className="wager__half" aria-labelledby="wager-border">
        <h3 id="wager-border" className="wager__heading">
          Your border
        </h3>
        <p className="wager__aside">
          Chosen before you know who you will face. A wall turns aside every blow; orcs
          bite back harder and guard less.
        </p>
        {/* A radio group in behaviour, so arrow keys move between them and only the
            chosen one is in the tab order. */}
        <div className="wager__row" role="radiogroup" aria-label="Border defence">
          {(['wall', 'orcs'] as const).map((kind) => (
            <RitualButton
              key={kind}
              variant={defence === kind ? 'primary' : 'ghost'}
              role="radio"
              aria-checked={defence === kind}
              onClick={() => chooseDefence(kind)}
            >
              {kind === 'wall' ? 'A wall' : 'Orcs'}
            </RitualButton>
          ))}
        </div>
      </section>

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

        {phase === 'accepted' && outcome ? (
          <p className="wager__note" role="status">
            {outcome.report.challenge.nation ?? outcome.report.challenge.name}&rsquo;s ground
            is on your map — {took} {took === 1 ? 'cell' : 'cells'} across{' '}
            {provinces} {provinces === 1 ? 'province' : 'provinces'}. Walk it to take it.
          </p>
        ) : null}

        {outcome ? (
          <div className="wager__outcome" role="status">
            {/* The replay first, then what it cost. The fight was decided the moment the
                message was accepted; this is a recounting, not a wait. */}
            <WagerFight report={outcome.report} me={outcome.me} />
            <p className="wager__aside">
              {outcome.report.outcome.onPoints
                ? `Neither side broke in ${outcome.report.outcome.rounds.length} rounds — decided on what was left standing.`
                : `Decided in ${outcome.report.outcome.rounds.length} rounds.`}
            </p>
            {outcome.report.weakened > 0 ? (
              <p className="wager__aside">
                Their border is softer for it — {outcome.report.weakened}{' '}
                {outcome.report.weakened === 1 ? 'cell' : 'cells'} weakened. Walk them to
                take them.
              </p>
            ) : (
              <p className="wager__aside">
                Their border stands exactly as it did. Ground is still taken on foot.
              </p>
            )}
            {/* Their phone computes this same line from the same message. There is
                nothing to disagree about, and nothing to send back. */}
            <p className="wager__aside">Their game will read the same result.</p>
          </div>
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
