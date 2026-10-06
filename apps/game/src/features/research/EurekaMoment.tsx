/**
 * "Eureka" (BRDC-EUREKA-001): the moment a Lore's condition comes true, said once — the
 * same card a temple's reveal uses, piled like every find (cards wait, never time out).
 */
import { useEffect } from 'react';
import { FlowerOfLife } from '@es3/ui';
import type { Cell, Eureka, GameRepository, LoreId } from '@es3/core';
import { useCardStack } from '../hud/useCardStack.js';
import '../territory/place-reveal.css';

interface Found {
  id: LoreId;
  name: string;
  eureka: Eureka;
}

export interface EurekaMomentProps {
  repository: GameRepository | null;
  /** Your ground: a eureka is looked for whenever it changes. */
  owned: readonly Cell[];
}

export function EurekaMoment({ repository, owned }: EurekaMomentProps) {
  const stack = useCardStack<Found>();
  useEffect(() => {
    if (!repository) return;
    void repository.lore.announce(Date.now()).then((found) => {
      for (const f of found) stack.push(f);
    });
  }, [repository, owned, stack.push]);

  const shown = stack.top;
  if (!shown) return null;
  return (
    <button type="button" className="reveal" onClick={stack.pop} aria-label="Dismiss">
      <span className="reveal__sigil" aria-hidden>
        <FlowerOfLife size={150} animate={1_800} />
      </span>
      <span className="reveal__name">Eureka · {shown.name}</span>
      <span className="reveal__line">{shown.eureka.text} — done. {shown.name} now costs half its wisdom.</span>
      <span className="reveal__hint">{stack.count > 1 ? `Tap for the next · ${stack.count - 1} more` : 'Tap to dismiss'}</span>
    </button>
  );
}
