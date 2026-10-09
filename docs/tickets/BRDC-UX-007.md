# BRDC-UX-007 — Valinnat tiiviiksi listaksi

| | |
|---|---|
| **Alue** | KeepWeek, KeepAmbition, KeepStranger, RiteSchools, AgeCharacter |
| **Vaihe** | 3 — Season 3 (haara `season-3`); yleiset korjaukset voidaan poimia `main`iin hotfixinä Infiniten luvalla |
| **Effort** | S–M |
| **Riippuvuudet** | — |
| **Lähde** | Käytettävyyskatselmus 2026-10-09 (27 ruutukaappausta 360 px, rikas valtakunta); Infinite: *"joo, tee tiketti ja jatka"* |
| **Status** | `todo` |

## 🔴 RED

Valinnat (viikon edut, ambitiot, muukalaisen nimet, temppelikoulut, aikakaudet) ovat kukin koko levyisiä kaksirivisiä nappeja: kolme valintaa vie koko ruudun.

## 🟢 GREEN

- [ ] Yksi yhteinen valintakomponentti: tiivis lista (radio-tyyli, ≥ 44 px kohteet) + yksi vahvistusnappi
- [ ] Kaksi napautusta lukitulle valinnalle säilyy (valitse → vahvista)
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build; e2e 360 px kuvakaappaus ennen/jälkeen

## Ei tässä

Valintojen sisältö.
