/**
 * "Eureka" (BRDC-EUREKA-001): the moment a Lore's condition comes true, said once. Piled
 * like every find and waiting to be tapped, but an edge card, not the temple's full-screen
 * reveal: a half price is good news, not a reason to stop the walker's thumb.
 */
import { useEffect } from 'react';
import { FlowerOfLife } from '@es3/ui';
import type { Cell, Eureka, GameRepository, LoreId } from '@es3/core';
import { useCardStack } from '../hud/useCardStack.js';
import './eureka.css';

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
    <button type="button" className="eureka es-glass" onClick={stack.pop} aria-label={`Eureka · ${shown.name} — dismiss`}>
      <span className="eureka__sigil" aria-hidden>
        <FlowerOfLife size={40} animate={1_200} />
      </span>
      <span className="eureka__text">
        <span className="eureka__name">Eureka · {shown.name}</span>
        <span className="eureka__line">{shown.eureka.text} — done. It now costs half its wisdom.</span>
        <span className="eureka__hint">{stack.count > 1 ? `Tap for the next · ${stack.count - 1} more` : 'Tap to dismiss'}</span>
      </span>
    </button>
  );
}
