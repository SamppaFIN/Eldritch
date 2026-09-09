/**
 * The recenter button (BRDC-MAP-004).
 *
 * Bottom-right, above the walking bar. Panning the map by hand unpins the camera; this
 * pins it back and flies to the player. It shows its state in the fill *and* the label,
 * so colour is never the only signal: cyan and "Camera follows you" while pinned, outline
 * and "Recenter the map on you" once you have panned away.
 */
import './camera-control.css';

export interface CameraControlProps {
  following: boolean;
  onRecenter: () => void;
}

export function CameraControl({ following, onRecenter }: CameraControlProps) {
  return (
    <button
      type="button"
      className="camera-control"
      data-following={following}
      aria-pressed={following}
      aria-label={following ? 'Camera follows you' : 'Recenter the map on you'}
      onClick={onRecenter}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
