/**
 * Gold for culture, at a Tavern of yours (BRDC-TRADE-001): the rate and what is left today
 * said before anything is bought, and the buying only while standing on it.
 */
import { useEffect, useState } from 'react';
import { RitualButton } from '@es3/ui';
import type { GameRepository, H3Index, ResourcePool, TavernTradeView } from '@es3/core';
import '../keep/keep.css';

const REFUSED: Readonly<Record<string, string>> = {
  'not-here': 'Stand on your Tavern to trade.',
  cap: 'That is the day’s trade. Come back tomorrow.',
  'cannot-afford': 'Not enough gold.',
  none: 'Pick how much culture to buy.',
};

export interface TavernTradeProps {
  repository: GameRepository;
  h3: H3Index;
  /** Standing on this hex — the only place the trade is made. */
  here: boolean;
  now: number;
  onPouch?: ((pool: ResourcePool) => void) | undefined;
}

export function TavernTrade({ repository, h3, here, now, onPouch }: TavernTradeProps) {
  const [view, setView] = useState<TavernTradeView | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  useEffect(() => {
    setSaid(null);
    void repository.tavern.view(Date.now()).then(setView);
  }, [repository, h3]);

  if (!view) return null;
  const buy = async (culture: number) => {
    const r = await repository.tavern.trade(h3, here ? h3 : null, culture, now);
    setSaid(r.ok ? `Bought ${r.culture} culture for ${r.gold} gold.` : (REFUSED[r.refused] ?? 'That did not work.'));
    setView(await repository.tavern.view(now));
    if (r.ok) onPouch?.(await repository.getResources(now));
  };

  return (
    <section className="keep-citizens" aria-label="Gold for culture">
      <p className="hearth-panel__line">
        <strong>Gold for culture.</strong> {view.rate} gold buys one culture — {view.left} more today. Culture raises Monuments.
      </p>
      {here ? (
        <div className="cell-staff__buttons">
          {[1, 5].map((n) => (
            <RitualButton key={n} variant="ghost" disabled={n > view.left} onClick={() => void buy(n)}>
              Buy {n} culture · {n * view.rate} gold
            </RitualButton>
          ))}
        </div>
      ) : (
        <p className="hearth-panel__line">Stand on your Tavern to trade.</p>
      )}
      {said ? (
        <p className="hearth-panel__line" role="status">
          {said}
        </p>
      ) : null}
    </section>
  );
}
