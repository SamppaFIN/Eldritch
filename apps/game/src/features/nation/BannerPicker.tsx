/**
 * Pick one of the preset banners (BRDC-BANNER-001).
 *
 * A grid of the six, the current one marked. Keyboard-reachable, one thumb, no modal —
 * it opens inline under the flag in the Keep and closes on a pick.
 */
import { Banner } from './Banner.js';
import { BANNER_IDS } from './nation.js';
import type { BannerId } from './nation.js';

export interface BannerPickerProps {
  current: BannerId;
  onPick: (id: BannerId) => void;
}

export function BannerPicker({ current, onPick }: BannerPickerProps) {
  return (
    <div className="nation__picker" role="group" aria-label="Choose a banner">
      {BANNER_IDS.map((id) => (
        <button
          key={id}
          type="button"
          className={`nation__banner-choice${id === current ? ' nation__banner-choice--on' : ''}`}
          aria-pressed={id === current}
          aria-label={id}
          onClick={() => onPick(id)}
        >
          <Banner id={id} size={40} />
        </button>
      ))}
    </div>
  );
}
