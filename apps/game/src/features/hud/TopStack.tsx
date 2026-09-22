/**
 * The one column at the top of the map (BRDC-MAP-005).
 *
 * `FirstLook`, `GuideNews` and `MapNotices` used to each compute their own `position:
 * fixed` and `top` — three floating things with no idea the others existed, so two
 * showing at once drew on top of each other, and `FirstLook`'s hard-coded offset
 * ("below the menu button and a notice row") was only ever a guess at how many rows
 * were really above it. This is their one shared parent: it owns the position, and
 * they stack in the DOM order they are given, in a real flex column instead of a
 * height nobody agreed on.
 *
 * `hidden` while a panel covers the map — an open cell or Keep sheet must never have
 * a hint drawn over its own header, which is exactly what was happening before.
 */
import type { ReactNode } from 'react';
import './top-stack.css';

export interface TopStackProps {
  hidden: boolean;
  children: ReactNode;
}

export function TopStack({ hidden, children }: TopStackProps) {
  if (hidden) return null;
  return <div className="top-stack">{children}</div>;
}
