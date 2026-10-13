/**
 * "The Keep has a new page" (BRDC-ONBOARD-005): a surface the Keeper's Charter has just
 * opened, said once, in the Guide's own card (`guide-news`) — same act, same look. It
 * waits to be tapped away; cards here never time out (field report 2026-09-30).
 */
import type { Surface } from '@es3/core';
import '../help/guide-news.css';

const SAID: Readonly<Record<Surface, string>> = {
  lands: 'Your lands is open · beside the Vigil',
  research: 'Research is open · on the bar below',
  'realm-tab': 'The Keep has a new page · Realm',
  standard: 'Your standard · plant it from the walking sheet',
  'investigator-tab': 'The Keep has a new page · Investigator',
  'season-tab': 'The Keep has a new page · Season',
};

export function SurfaceNews({ news, onDismiss }: { news: Surface | null; onDismiss: () => void }) {
  if (!news) return null;
  return (
    <button type="button" className="guide-news" aria-label={`${SAID[news]} — dismiss`} onClick={onDismiss}>
      <span aria-hidden>❋</span> {SAID[news]}
    </button>
  );
}
