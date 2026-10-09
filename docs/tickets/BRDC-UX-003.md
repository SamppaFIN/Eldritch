# BRDC-UX-003 — Päällekkäisyysbugit: menu-nappi, Ledgerin otsikko, leikkautuvat napit

| | |
|---|---|
| **Alue** | `SettingsMenu`, `LandsPanel`, `lands-panel.css` |
| **Vaihe** | 3 — Season 3 (haara `season-3`); yleiset korjaukset voidaan poimia `main`iin hotfixinä Infiniten luvalla |
| **Effort** | S |
| **Riippuvuudet** | — |
| **Lähde** | Käytettävyyskatselmus 2026-10-09 (27 ruutukaappausta 360 px, rikas valtakunta); Infinite: *"joo, tee tiketti ja jatka"* |
| **Status** | `done` — 2026-10-09 |

## 🔴 RED

Menu-nappi (≡) piirtyy paneelien otsikoiden päälle ("≡WALK INTO…", "Your lands", Guide). Ledgerin otsikkopalkki ei ole läpinäkymätön: rivit näkyvät sen läpi vieritettäessä. Viimeisen rivin Reveal-nappi leikkautuu oikeasta reunasta.

## 🟢 GREEN

- [x] Menu-nappi ei peitä yhdenkään paneelin otsikkoa 360 px:ssä
- [x] Ledgerin otsikko läpinäkymätön, sisältö ei näy sen läpi
- [x] Rivien napit eivät leikkaudu
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build; e2e 360 px kuvakaappaus ennen/jälkeen — `pnpm test` 2154 ✓, `typecheck` ✓, `lint:lines` ✓, build ✓; e2e 360 px: muutoksen speksit vihreinä (dream, masks, week, up-next, task-board, era, ambition, cell-actions, yield-card, opening 41/90/187, lands, nation 35/69, share); punaiset (dialogs, gpx, diplomacy, keep-citizens, season-gate 77/101, nation 107, guide 41, opening 66, claim 67/222) punaisia myös HEADissa d493c4b, rinnakkaisella worktree-ajolla

## Ei tässä

—
