# BRDC-UX-002 — Reunakorttien jono — yksi kerrallaan

| | |
|---|---|
| **Alue** | `edge-card.css`, Eureka/Mythos/Dream/GreatBirth |
| **Vaihe** | 3 — Season 3 (haara `season-3`); yleiset korjaukset voidaan poimia `main`iin hotfixinä Infiniten luvalla |
| **Effort** | S–M |
| **Riippuvuudet** | — |
| **Lähde** | Käytettävyyskatselmus 2026-10-09 (27 ruutukaappausta 360 px, rikas valtakunta); Infinite: *"joo, tee tiketti ja jatka"* |
| **Status** | `done` — 2026-10-09 |

## 🔴 RED

Eureka-, Mythos-, uni- ja syntymäkortit pinoutuvat päällekkäin ruudun yläreunaan ja peittävät paneelien otsikot ja sulkunapit; oppituntikortti tulee vielä niiden päälle.

## 🟢 GREEN

- [x] Yksi yhteinen jono: näkyy yksi kortti, "Tap for the next · N more" kuten Eurekassa
- [x] Kortti ei peitä avoimen paneelin otsikkoa eikä sulkunappia — kortit odottavat piilossa kun paneeli on auki (`html:has(.hud[data-compact])`); keep-citizensin Eureka-kortti peitti välilehdet ennen tätä
- [x] Kortit eivät edelleenkään vanhene itsestään (pinoutuvat luettaviksi)
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build; e2e 360 px kuvakaappaus ennen/jälkeen — `pnpm test` 2154 ✓, `typecheck` ✓, `lint:lines` ✓, build ✓; e2e 360 px: muutoksen speksit vihreinä (dream, masks, week, up-next, task-board, era, ambition, cell-actions, yield-card, opening 41/90/187, lands, nation 35/69, share); punaiset (dialogs, gpx, diplomacy, keep-citizens, season-gate 77/101, nation 107, guide 41, opening 66, claim 67/222) punaisia myös HEADissa d493c4b, rinnakkaisella worktree-ajolla

## Ei tässä

Korttien sisällön muutokset.
