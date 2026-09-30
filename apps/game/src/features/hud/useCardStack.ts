/**
 * Cards pile up instead of timing out (Infinite 2026-09-30: *"älä poista sitä timerillä..
 * kasaa uusia vanhan päälle, jotta käyttäjä voi kävellessä pitää puhelimen taskussa ja sit
 * kun istahtaa alas käydä läpi kaikki kortit mitä löytyi"*).
 *
 * The newest card is on top; closing it shows the one beneath. `aside` hides the pile
 * without losing it — for when a card sends the player somewhere else.
 */
import { useCallback, useState } from 'react';

export interface CardStack<T> {
  top: T | null;
  count: number;
  aside: boolean;
  push: (card: T) => void;
  pop: () => void;
  clear: () => void;
  setAside: (aside: boolean) => void;
}

export function useCardStack<T>(): CardStack<T> {
  const [cards, setCards] = useState<T[]>([]);
  const [aside, setAside] = useState(false);
  const push = useCallback((card: T) => {
    setCards((s) => [...s, card]);
    setAside(false);
  }, []);
  const pop = useCallback(() => setCards((s) => s.slice(0, -1)), []);
  const clear = useCallback(() => setCards([]), []);
  return { top: cards[cards.length - 1] ?? null, count: cards.length, aside, push, pop, clear, setAside };
}
