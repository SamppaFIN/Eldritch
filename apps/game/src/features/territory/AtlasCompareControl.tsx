/**
 * "Then" vs "now" for the Atlas (BRDC-ATLAS-001) — the RED's own example is a single
 * municipality, a few weeks apart. Shown only once the camera has zoomed into the band
 * the Atlas itself draws in, and only once a snapshot old enough to compare against
 * actually exists; otherwise there is nothing behind the button to show.
 *
 * Text carries the state, not colour alone (AI-Koulu ch.4) — "Now" and "Then" read
 * correctly even to someone who cannot see the pressed-cyan fill `CameraControl` uses
 * for the same purpose.
 */
import './atlas-compare-control.css';

export interface AtlasCompareControlProps {
  comparing: boolean;
  onToggle: () => void;
}

export function AtlasCompareControl({ comparing, onToggle }: AtlasCompareControlProps) {
  return (
    <button
      type="button"
      className="atlas-compare"
      data-comparing={comparing}
      aria-pressed={comparing}
      aria-label={comparing ? 'Showing the Atlas from a few weeks ago — tap to return to now' : 'Compare the Atlas to a few weeks ago'}
      onClick={onToggle}
    >
      {comparing ? 'Then' : 'Now'}
    </button>
  );
}
