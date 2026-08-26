# Parked: Void and Mystic themes

Extracted from v2 `game/styles/theme-system.css`. **Do not build before Phase 5 ships**
(`claude.md` golden rule 6). Cosmic is the only theme in the MVP.

The token structure in `packages/ui/src/styles/tokens.css` is already theme-shaped:
adding a theme is one `[data-theme]` block, not a rewrite. These are the values that
block will need, converted to OKLCH the same way the Cosmic palette was.

## v2 originals (hex, as measured)

| Token | 🟣 Cosmic (built) | ⚫ Void | 🔵 Mystic |
|---|---|---|---|
| `--theme-primary` | `#4a1a5c` | `#0a0612` | `#00d4ff` |
| `--theme-secondary` | `#6b2c91` | `#1a0d2e` | `#0099cc` |
| `--theme-accent` | `#8b3a9b` | `#2d1b4e` | `#006699` |
| `--theme-glow` | `#8b3a9b` | `#2d1b4e` | `#00d4ff` |
| `--theme-background` | `linear-gradient(135deg,#1a0d2e,#4a1a5c,#6b2c91)` | `linear-gradient(135deg,#0a0612,#1a0d2e,#2d1b4e)` | `linear-gradient(135deg,#001122,#003366,#006699)` |

## High-contrast mode (v2 `theme-system.css:265`)

```css
--theme-text: #ffffff;
--theme-border: #ffffff;
```

Note that v2's high-contrast mode changed only two values. A real high-contrast theme
has to raise contrast on every surface, not just text and borders — and the current
token set already carries measured contrast ratios, so it can be done properly when
the time comes.

## Warning carried forward

Both Void and Mystic must be **contrast-checked, not eyeballed**, before they ship.
Mystic in particular puts `#006699` accents on a blue gradient; that combination did
not pass AA in v2 and nobody noticed, because v2 never measured. The check script
lives with the Cosmic palette — reuse it.
