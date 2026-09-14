/**
 * Pick one of the twenty faces (BRDC-SIGIL-005).
 *
 * A grid grouped by family, the current one marked — the same shape `BannerPicker.tsx`
 * takes for the nation's flag, because it is the same act: open inline, tap to choose,
 * close on a pick.
 */
import { AVATAR_IDS } from './avatarIds.js';
import type { AvatarId } from './avatarIds.js';
import { AVATAR_META, Avatar } from './Avatar.js';

export interface AvatarPickerProps {
  current: AvatarId;
  onPick: (id: AvatarId) => void;
}

export function AvatarPicker({ current, onPick }: AvatarPickerProps) {
  return (
    <div className="character__avatar-picker" role="group" aria-label="Choose a sigil">
      {AVATAR_IDS.map((id) => (
        <button
          key={id}
          type="button"
          className={`character__avatar-choice${id === current ? ' character__avatar-choice--on' : ''}`}
          aria-pressed={id === current}
          aria-label={AVATAR_META[id].name}
          onClick={() => onPick(id)}
        >
          <Avatar id={id} size={40} />
        </button>
      ))}
    </div>
  );
}
