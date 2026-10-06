/**
 * A retired kingdom's picture (BRDC-HALL-004): a thumbnail on its Hall row, read only when
 * the row is drawn, and the whole image when tapped. ESC or a second tap puts it away.
 *
 * The whole image goes to `document.body`: the Hall sheet's backdrop filter would otherwise
 * be the box a `position: fixed` child fills, and the picture would stay panel-sized.
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { GameRepository } from '@es3/core';
import { useEscape } from '../hud/useEscape.js';

export interface KingdomPictureProps {
  repository: GameRepository;
  id: string;
  name: string;
}

export function KingdomPicture({ repository, id, name }: KingdomPictureProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [full, setFull] = useState(false);
  useEffect(() => {
    void repository.chronicleImages.get(id).then(setSrc);
  }, [repository, id]);
  useEscape(full, () => setFull(false));
  if (!src) return null;

  return (
    <>
      <button type="button" className="hall__picture" onClick={() => setFull(true)} aria-label={`Show ${name} as it stood`}>
        <img src={src} width={320} height={200} alt="" />
      </button>
      {full
        ? createPortal(
            <button type="button" className="hall__picture-full" onClick={() => setFull(false)} aria-label="Close the picture">
              <img src={src} alt={`${name}, the day it was retired`} />
            </button>,
            document.body,
          )
        : null}
    </>
  );
}
