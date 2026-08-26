# BRDC-SETUP-002 — Design-tokenit ja fontit, yksi tiedosto

| | |
|---|---|
| **Vaihe** | 0 — Perustus |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-SETUP-001 |
| **Status** | `done` — 2026-08-26 |
| **Valmius** | 100 % |

## 🔴 RED

v2:ssa oli **34 CSS-tiedostoa, 11 204 riviä ja 15 muuttujaa**. Käytännössä kaikki värit,
välit ja fonttikoot olivat kovakoodattuja. Puuttui kokonaan: väliskaala, typografinen
skaala, kosketuskohteiden minimikoko, `prefers-reduced-motion`, `:focus-visible`.
`Spectral`-fonttia käytettiin kahdessa säännössä, mutta sitä ei ladattu mistään.

## 🟢 GREEN

- [x] **Yksi tiedosto** `packages/ui/styles/tokens.css`, **alle 800 riviä**
- [x] Jokainen väri, väli, fonttikoko ja radius on token — ei kovakoodattuja arvoja komponenteissa
- [x] Fontit self-hostattuina `@fontsource`illa — **ei yhtään Google Fonts -linkkiä**
- [x] `--touch-min: 44px` olemassa ja käytössä jokaisessa painikkeessa
- [x] `@media (prefers-reduced-motion: reduce)` nollaa animaatiot
- [x] `:focus-visible` näkyy jokaisessa interaktiivisessa elementissä
- [x] Teemarakenne on `[data-theme]`-attribuutilla, mutta **vain `cosmic` on toteutettu**
- [x] Void- ja Mystic-arvot talletettu `docs/backlog/themes.md`:hen

## Toteutus

**Paletti v2:sta** (`ANALYSIS.md` §5.1), **typografia v1:stä**:

```css
:root {
  /* Väripohja — v2 main.css */
  --void-black:      #0a0612;
  --cosmic-purple:   #4a1a5c;
  --eldritch-blue:   #1e2a4a;   /* v2:ssa kirjoitusvirhe: --elditch-blue */
  --mystic-cyan:     #00d4ff;
  --sacred-gold:     #ffd700;
  --awareness-green: #00ff88;

  /* Lasi — v2 */
  --glass-bg:     rgba(26, 12, 38, 0.7);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);

  /* UUTTA — puuttui sekä v1:stä että v2:sta */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-6: 24px; --space-8: 32px;
  --text-xs: clamp(0.75rem, 2vw, 0.8rem);
  --text-sm: clamp(0.875rem, 2.5vw, 0.9rem);
  --text-md: clamp(1rem, 3vw, 1.1rem);
  --text-lg: clamp(1.25rem, 4vw, 1.5rem);
  --text-xl: clamp(1.75rem, 6vw, 2.5rem);
  --touch-min: 44px;
  --radius-sm: 6px; --radius-md: 12px; --radius-lg: 20px;
}
```

**Fontit** — v2:n `Courier New` + `Segoe UI` oli oletusarvo, ei valinta:

| Fontti | Käyttö | Paketti |
|---|---|---|
| **Cinzel** | otsikot, mystinen | `@fontsource/cinzel` |
| **Orbitron** | numerot, HUD | `@fontsource/orbitron` |
| **Inter** | leipäteksti | `@fontsource/inter` |

Jokaiselle **oikea fallback-pino**. `Spectral` ei siirry — se ei toiminut v2:ssakaan.

## Testit

- [x] Visuaalinen tarkistus 360 px viewportilla — **ensimmäisenä, ei viimeisenä**
- [x] Muuttujien määrä `tokens.css`:ssä > 30
- [x] Haku heksaväreille komponenttitiedostoista ei löydä osumia — vain `tokens.css` saa
      sisältää raakoja värejä
- [x] Rivimäärä < 800

## Ei kuulu tähän tikettiin

Void- ja Mystic-teemat (`docs/backlog/themes.md`). High-contrast-tila. Karttatyyli
(BRDC-MAP-001) — se on MapLibre-tyyliobjekti, ei CSS.

## Lähde

`EXTRACTION.md` §C · `files/CLAUDE.md` §Design tokens · `MASTERPLAN.md` §3.3 ·
`ANALYSIS.md` §5
