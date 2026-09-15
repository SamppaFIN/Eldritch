/**
 * The nav bar, drawn to the Sigil document's screen 02.
 *
 * Five equal columns, a glyph over a wide-tracked label, the one you are on in cyan and
 * the rest dim. It is its own glass bar below the walking sheet rather than a row of ghost
 * buttons inside it — the document draws them as two surfaces because they answer two
 * different questions: the sheet is *how am I doing*, this is *where do I go*.
 *
 * MAP is the item the old HUD never had. Every other screen could be opened from here and
 * only ESC could get back, which is fine at a desk and poor on a phone; it closes whatever
 * is over the map, and reads as the current place when nothing is.
 */
import type { ReactNode } from 'react';
import './hud-nav.css';

export interface HudNavProps {
  /** True when a sheet is over the map — MAP becomes the way back rather than the state. */
  covered: boolean;
  onShowMap?: (() => void) | undefined;
  /** Only offered while the game knows which cell is underfoot. */
  onInspectHere?: (() => void) | undefined;
  onOpenKeep?: (() => void) | undefined;
  onOpenResearch?: (() => void) | undefined;
  onOpenCharacter?: (() => void) | undefined;
}

function Item({
  glyph,
  label,
  active,
  onClick,
}: {
  glyph: string;
  label: string;
  active?: boolean;
  onClick?: (() => void) | undefined;
}): ReactNode {
  return (
    <button
      type="button"
      className={`hud-nav__item${active ? ' hud-nav__item--on' : ''}`}
      aria-current={active ? 'page' : undefined}
      disabled={!onClick}
      onClick={onClick}
    >
      <span className="hud-nav__glyph" aria-hidden>
        {glyph}
      </span>
      <span className="hud-nav__label">{label}</span>
    </button>
  );
}

export function HudNav({
  covered,
  onShowMap,
  onInspectHere,
  onOpenKeep,
  onOpenResearch,
  onOpenCharacter,
}: HudNavProps) {
  return (
    <nav className="hud-nav" aria-label="Go to">
      <Item glyph="◉" label="Map" active={!covered} onClick={covered ? onShowMap : undefined} />
      <Item glyph="◈" label="Here" onClick={onInspectHere} />
      <Item glyph="⌂" label="Keep" onClick={onOpenKeep} />
      <Item glyph="✳" label="Research" onClick={onOpenResearch} />
      <Item glyph="◇" label="You" onClick={onOpenCharacter} />
    </nav>
  );
}
