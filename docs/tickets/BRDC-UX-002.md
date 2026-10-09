# BRDC-UX-002 — Reunakorttien jono — yksi kerrallaan

| | |
|---|---|
| **Alue** | `edge-card.css`, Eureka/Mythos/Dream/GreatBirth |
| **Vaihe** | 3 — Season 3 (haara `season-3`); yleiset korjaukset voidaan poimia `main`iin hotfixinä Infiniten luvalla |
| **Effort** | S–M |
| **Riippuvuudet** | — |
| **Lähde** | Käytettävyyskatselmus 2026-10-09 (27 ruutukaappausta 360 px, rikas valtakunta); Infinite: *"joo, tee tiketti ja jatka"* |
| **Status** | `todo` |

## 🔴 RED

Eureka-, Mythos-, uni- ja syntymäkortit pinoutuvat päällekkäin ruudun yläreunaan ja peittävät paneelien otsikot ja sulkunapit; oppituntikortti tulee vielä niiden päälle.

## 🟢 GREEN

- [ ] Yksi yhteinen jono: näkyy yksi kortti, "Tap for the next · N more" kuten Eurekassa
- [ ] Kortti ei peitä avoimen paneelin otsikkoa eikä sulkunappia
- [ ] Kortit eivät edelleenkään vanhene itsestään (pinoutuvat luettaviksi)
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build; e2e 360 px kuvakaappaus ennen/jälkeen

## Ei tässä

Korttien sisällön muutokset.
