/**
 * Is another dialog open — a Modal, the Settings menu, the Research dialog, a confirmation
 * (BRDC-TUTOR-004)?
 *
 * A lesson card arriving on top of one made two dialogs at once: focus and ESC did not
 * know which they belonged to, and the card took taps meant for the dialog beneath. The
 * lesson's own `busy` named the side panels and the cell card and missed the rest, so this
 * reads the page instead of a list that drifts: an open `<dialog>`, or anything else that
 * says `role="dialog"`, other than the lesson card itself — and a moment being celebrated
 * (`MomentFx`), which takes the taps over the whole screen until it is read.
 *
 * Re-checked on the next frame after the DOM changes, so a busy map does not pay for it
 * once per mutation.
 */
import { useEffect, useState } from 'react';

const OTHER_DIALOG = 'dialog[open]:not(.unlock), [role="dialog"]:not(.unlock), .moment-fx';

export function useOtherDialogOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      setOpen(document.querySelector(OTHER_DIALOG) !== null);
    };
    check();
    const watch = new MutationObserver(() => {
      if (!frame) frame = requestAnimationFrame(check);
    });
    watch.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'role'] });
    return () => {
      watch.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return open;
}
