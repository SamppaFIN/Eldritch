/**
 * Glass panel and the primary button.
 *
 * Composition over configuration (AI-Koulu ch.6): these take children, not a
 * dozen props. A component with 12 props is two components.
 */
import type {
  ButtonHTMLAttributes,
  ElementType,
  HTMLAttributes,
  ReactNode,
  Ref,
} from 'react';

export interface GlassPanelProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children: ReactNode;
  /**
   * React 19 passes `ref` as an ordinary prop, so no forwardRef is needed — only the
   * type, because HTMLAttributes does not carry it. A caller that puts focus on a panel
   * when it opens needs this and nothing else.
   */
  ref?: Ref<HTMLElement>;
}

export function GlassPanel({ as: Tag = 'div', children, className, ...rest }: GlassPanelProps) {
  return (
    <Tag className={['es-glass', 'es-panel', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </Tag>
  );
}

export interface RitualButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  children: ReactNode;
}

/**
 * Semantic <button>, always. "No ARIA is better than bad ARIA" — a div with
 * role="button" is the anti-pattern the course opens ch.4 with.
 */
export function RitualButton({
  variant = 'primary',
  children,
  className,
  type = 'button',
  ...rest
}: RitualButtonProps) {
  return (
    <button
      type={type}
      className={['es-btn', `es-btn--${variant}`, className].filter(Boolean).join(' ')}
      {...rest}
    >
      <span className="es-btn__label">{children}</span>
    </button>
  );
}
