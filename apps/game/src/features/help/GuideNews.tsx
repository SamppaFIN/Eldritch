/**
 * "The Guide has a new page" (BRDC-WIKI-002).
 *
 * When a mechanic fires for the first time its codex page becomes available, and this
 * says so — once, quietly, no sound. Tapping it opens the page. It clears itself after a
 * few seconds if left alone, the same shape as the waypoint line.
 */
import { useEffect } from 'react';
import { HELP } from './help.js';
import type { HelpTopic } from './help.js';
import './guide-news.css';

export interface GuideNewsProps {
  topic: HelpTopic | null;
  onOpen: (topic: HelpTopic) => void;
  onDismiss: () => void;
}

export function GuideNews({ topic, onOpen, onDismiss }: GuideNewsProps) {
  useEffect(() => {
    if (!topic) return;
    const timer = setTimeout(onDismiss, 8_000);
    return () => clearTimeout(timer);
  }, [topic, onDismiss]);

  if (!topic) return null;

  return (
    <button
      type="button"
      className="guide-news"
      onClick={() => {
        onOpen(topic);
        onDismiss();
      }}
    >
      <span aria-hidden>❋</span> The Guide has a new page · {HELP[topic].title}
    </button>
  );
}
