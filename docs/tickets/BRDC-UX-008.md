# BRDC-UX-008 — Pienet: nauha, You, Tavernan valmiit, kylän laituri, Ledgerin välilehdet

| | |
|---|---|
| **Alue** | HUD-nauha, CharacterPanel, TaskBoard, TradePost, LandsPanel |
| **Vaihe** | 3 — Season 3 (haara `season-3`); yleiset korjaukset voidaan poimia `main`iin hotfixinä Infiniten luvalla |
| **Effort** | S–M |
| **Riippuvuudet** | — |
| **Lähde** | Käytettävyyskatselmus 2026-10-09 (27 ruutukaappausta 360 px, rikas valtakunta); Infinite: *"joo, tee tiketti ja jatka"* |
| **Status** | `done` — 2026-10-09 |

## 🔴 RED

Up next -nauha leikkautuu ("Store…") eikä kerro pyyhkäisystä. Ledgerin välilehdet ylivuotavat ("Anomalie", Routes ei näy). "1 d walked 12 d" on arvoitus. You-paneelin proosa ja saavutuslista pitkiä. Tavernan valmiit tehtävät jäävät tauluun ikuisesti. Kylän laiturilla kauppa, envoyt ja tehtävät yhdessä pitkässä kortissa.

## 🟢 GREEN

- [x] Nauha: kaksi kohdetta + "+N" tai reunan häivytys
- [x] Ledgerin välilehdet mahtuvat (rivittyvät, UX-003) tai näyttävät vieritettävyyden
- [x] Rivien aika selkokielellä ("walked 3 days · fades in 12 d" — `days` on käveltyjen päivien määrä, ei "ago") ("walked 1 d ago · fades in 12 d")
- [x] You: tasoproosa ja saavutukset togglen taakse (ansaitut + seuraava)
- [x] Taverna: valmiit "Done (n)" -togglen taakse
- [x] Kylän tehtävät togglen taakse
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build; e2e 360 px kuvakaappaus ennen/jälkeen — `pnpm test` 2154 ✓, `typecheck` ✓, `lint:lines` ✓, build ✓; e2e 360 px: muutoksen speksit vihreinä (dream, masks, week, up-next, task-board, era, ambition, cell-actions, yield-card, opening 41/90/187, lands, nation 35/69, share); punaiset (dialogs, gpx, diplomacy, keep-citizens, season-gate 77/101, nation 107, guide 41, opening 66, claim 67/222) punaisia myös HEADissa d493c4b, rinnakkaisella worktree-ajolla

## Ei tässä

—
