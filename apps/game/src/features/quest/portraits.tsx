/**
 * Speaker sigils for the adventure dialogue (BRDC-QUEST-001).
 *
 * Minimal inline SVG — stroke, no fill, one motif per voice (§12). A slice of ART-001,
 * not the whole thing. The propeller-boy keeps the spinning cross from v2; the hermit is
 * a vesica (two minds, one lonely); the troll is a blunt stack of triangles; the Deep is
 * a nine-pointed star of chords — too many angles, on purpose.
 *
 * Motion is CSS and honours `prefers-reduced-motion` (see `adventure-dialog.css`).
 */
import type { ReactNode } from 'react';

const BOX = '0 0 48 48';

function ring(cx: number, cy: number, r: number, n: number, offset = -90): string {
  return Array.from({ length: n }, (_, i) => {
    const a = ((offset + (360 * i) / n) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

function Frame({ size, label, children }: { size: number; label: string; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox={BOX} role="img" aria-label={label} className="quest-portrait">
      <g fill="none" stroke="currentColor" strokeWidth={1.2} vectorEffect="non-scaling-stroke">
        {children}
      </g>
    </svg>
  );
}

function Statue({ size }: { size: number }) {
  return (
    <Frame size={size} label="The boy and his propeller">
      <circle cx="24" cy="24" r="20" opacity={0.4} />
      <g className="quest-portrait__spin" style={{ transformOrigin: '24px 24px' }}>
        <line x1="6" y1="24" x2="42" y2="24" />
        <line x1="24" y1="6" x2="24" y2="42" />
        <line x1="12" y1="12" x2="36" y2="36" opacity={0.5} />
        <line x1="36" y1="12" x2="12" y2="36" opacity={0.5} />
      </g>
      <circle cx="24" cy="24" r="3" />
    </Frame>
  );
}

function Vesica({ size }: { size: number }) {
  return (
    <Frame size={size} label="Cornelius the hermit">
      <circle cx="19" cy="24" r="13" />
      <circle cx="29" cy="24" r="13" />
      <circle cx="24" cy="24" r="20" opacity={0.3} />
    </Frame>
  );
}

function Trollstack({ size }: { size: number }) {
  return (
    <Frame size={size} label="Grug the troll">
      <polygon points="24,8 40,38 8,38" />
      <polygon points="24,18 33,36 15,36" opacity={0.55} />
      <line x1="8" y1="42" x2="40" y2="42" opacity={0.4} />
    </Frame>
  );
}

function Deep({ size }: { size: number }) {
  const pts = ring(24, 24, 19, 9);
  const order = [0, 4, 8, 3, 7, 2, 6, 1, 5, 0];
  const path = order.map((i) => pts.split(' ')[i]).join(' ');
  return (
    <Frame size={size} label="The Deep">
      <polygon points={path} className="quest-portrait__breathe" style={{ transformOrigin: '24px 24px' }} />
      <circle cx="24" cy="24" r="4" />
    </Frame>
  );
}

export function Portrait({ speaker, size = 72 }: { speaker: string; size?: number }) {
  switch (speaker) {
    case 'Cornelius':
      return <Vesica size={size} />;
    case 'Grug':
      return <Trollstack size={size} />;
    case 'The Deep':
      return <Deep size={size} />;
    case 'Narrator':
      return <Statue size={size} />;
    default:
      return (
        <Frame size={size} label={speaker}>
          <circle cx="24" cy="24" r="18" />
        </Frame>
      );
  }
}
