# BRDC-UX-003 — Päällekkäisyysbugit: menu-nappi, Ledgerin otsikko, leikkautuvat napit

| | |
|---|---|
| **Alue** | `SettingsMenu`, `LandsPanel`, `lands-panel.css` |
| **Vaihe** | 3 — Season 3 (haara `season-3`); yleiset korjaukset voidaan poimia `main`iin hotfixinä Infiniten luvalla |
| **Effort** | S |
| **Riippuvuudet** | — |
| **Lähde** | Käytettävyyskatselmus 2026-10-09 (27 ruutukaappausta 360 px, rikas valtakunta); Infinite: *"joo, tee tiketti ja jatka"* |
| **Status** | `todo` |

## 🔴 RED

Menu-nappi (≡) piirtyy paneelien otsikoiden päälle ("≡WALK INTO…", "Your lands", Guide). Ledgerin otsikkopalkki ei ole läpinäkymätön: rivit näkyvät sen läpi vieritettäessä. Viimeisen rivin Reveal-nappi leikkautuu oikeasta reunasta.

## 🟢 GREEN

- [ ] Menu-nappi ei peitä yhdenkään paneelin otsikkoa 360 px:ssä
- [ ] Ledgerin otsikko läpinäkymätön, sisältö ei näy sen läpi
- [ ] Rivien napit eivät leikkaudu
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build; e2e 360 px kuvakaappaus ennen/jälkeen

## Ei tässä

—
