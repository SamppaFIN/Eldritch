import { describe, expect, it } from 'vitest';
import { DESIGN_SPRITES, KEEP_BODY, TEMPLE_BODY, designSvg } from './designSprites.js';
import { spriteSvg } from './buildingSprites.js';
import { placeSvg } from './placeSprites.js';

const ALL = [...Object.values(DESIGN_SPRITES), KEEP_BODY, TEMPLE_BODY];

describe('Works Codex sprites (BRDC-ART-006)', () => {
  it('are plain pictures a detached <img> can decode: hex fills, no tokens, no filters, no motion', () => {
    for (const body of ALL) {
      expect(body).not.toMatch(/var\(|oklch\(|currentColor|<filter|<animate|@keyframes|<use/);
    }
  });

  it('the six Codex Works draw their new picture; the others keep the old block', () => {
    for (const id of ['farm', 'sawmill', 'quarry', 'forge', 'market', 'tavern', 'watchtower'] as const) {
      expect(spriteSvg(id)).toBe(designSvg(id, 192));
    }
    expect(designSvg('granary', 192)).toBeNull();
    expect(spriteSvg('granary')).toContain('<g stroke=');
  });

  it('the Anchor Stone draws as the Keep, the Temple as the Codex temple', () => {
    expect(placeSvg('anchor')).toContain(KEEP_BODY);
    expect(placeSvg('temple')).toContain(TEMPLE_BODY);
  });
});
