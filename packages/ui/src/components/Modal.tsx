/**
 * A modal that behaves like one.
 *
 * AI-Koulu ch.4 lists the four things a dialog owes a keyboard user, and all four are
 * easy to skip: focus moves in, TAB stays inside, ESC closes, focus returns to whatever
 * opened it. A dialog that does three of them is a trap.
 *
 * Built on <dialog> so the browser handles the top layer, the backdrop and the inert
 * background — no ARIA is better than bad ARIA, and native is better than either.
 */
import { useCallback, useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import './modal.css';

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Buttons. The primary one is focused when the dialog opens. */
  footer?: ReactNode;
}

export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  const ref = useRef<HTMLDialogElement | null>(null);
  const opener = useRef<Element | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      opener.current = document.activeElement;
      // showModal, not show: this is what makes the background inert and traps TAB.
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      // Focus goes back where it came from, or the player is left adrift in the page.
      if (opener.current instanceof HTMLElement) opener.current.focus();
    }
  }, [open]);

  // ESC fires <dialog>'s cancel event; the state has to follow or the two disagree.
  const onCancel = useCallback(
    (e: React.SyntheticEvent<HTMLDialogElement>) => {
      e.preventDefault();
      onClose();
    },
    [onClose],
  );

  return (
    <dialog
      ref={ref}
      className="es-modal"
      aria-labelledby={titleId}
      onCancel={onCancel}
      onClose={onClose}
    >
      <div className="es-modal__panel es-glass">
        <h2 id={titleId} className="es-modal__title">
          {title}
        </h2>
        <div className="es-modal__body">{children}</div>
        {footer ? <div className="es-modal__footer">{footer}</div> : null}
      </div>
    </dialog>
  );
}
