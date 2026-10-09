# BRDC-UX-007 — Valinnat tiiviiksi listaksi

| | |
|---|---|
| **Alue** | KeepWeek, KeepAmbition, KeepStranger, RiteSchools, AgeCharacter |
| **Vaihe** | 3 — Season 3 (haara `season-3`); yleiset korjaukset voidaan poimia `main`iin hotfixinä Infiniten luvalla |
| **Effort** | S–M |
| **Riippuvuudet** | — |
| **Lähde** | Käytettävyyskatselmus 2026-10-09 (27 ruutukaappausta 360 px, rikas valtakunta); Infinite: *"joo, tee tiketti ja jatka"* |
| **Status** | `done` — 2026-10-09 |

## 🔴 RED

Valinnat (viikon edut, ambitiot, muukalaisen nimet, temppelikoulut, aikakaudet) ovat kukin koko levyisiä kaksirivisiä nappeja: kolme valintaa vie koko ruudun.

## 🟢 GREEN

- [x] Yksi yhteinen valintakomponentti (`ChoiceList`: viikon etu, ambitio, aikakausi, temppelikoulu, muukalaisen nimi ja ratkaisu): tiivis lista (radio-tyyli, ≥ 44 px kohteet) + yksi vahvistusnappi
- [x] Kaksi napautusta lukitulle valinnalle säilyy (valitse → vahvista)
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build; e2e 360 px kuvakaappaus ennen/jälkeen — `pnpm test` 2154 ✓, `typecheck` ✓, `lint:lines` ✓, build ✓; e2e 360 px: muutoksen speksit vihreinä (dream, masks, week, up-next, task-board, era, ambition, cell-actions, yield-card, opening 41/90/187, lands, nation 35/69, share); punaiset (dialogs, gpx, diplomacy, keep-citizens, season-gate 77/101, nation 107, guide 41, opening 66, claim 67/222) punaisia myös HEADissa d493c4b, rinnakkaisella worktree-ajolla

## Ei tässä

Valintojen sisältö.
