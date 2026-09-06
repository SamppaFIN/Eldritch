# BRDC-BUILD-007 — Monta Työtä yhdellä heksalla

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | L |
| **Riippuvuudet** | BRDC-BUILD-001…004, BRDC-PERSIST-003, BRDC-WAGER-JSON-006 |
| **Status** | `done` (2026-09-06) |
| **Valmius** | 100 % |
| **Lähde** | Infinite, kenttätesti 2026-09-06: *"haluan, että heksat näyttävät KAIKKI rakennukset mitä siellä on, nyt esim monumentti ei päivity"* + AskUserQuestion 2026-09-06 → *"Monta rakennusta per solu"* |

## 🔴 RED

`Cell.building` on yksikkö — "one cell, one building" oli tietoinen malli. Kentältä:
yksi heksa mahtuu pitämään pienen rypään, ei kaupunkia, mutta yksi on liian vähän.
Ja kun toinen rakennus ei mahdu, karttamerkki ei näytä muuttuvan — koska mikään ei
muutu.

## 🟢 GREEN

### Malli

- [x] **`Cell.building` → `Cell.buildings?: CellBuilding[]`** (`types/domain.ts`).
      `CellBuilding = { id; builtAt }`. Additiivinen luettuna: puuttuva = tyhjä ryväs.
- [x] **`CELL_BUILDING_CAP = 3`** (`constants.ts`). Kolme riittää sahalle + varastolle +
      monumentille, ja on tarpeeksi vähän että sijoittelu on yhä valinta. Pelaajakohtainen
      `buildingCapacity` (Granary) on erillinen ja säilyy.
- [x] **Sääntö per solu:** kukin `BuildingId` korkeintaan kerran (`occupied`); ketjupäivitys
      (`sawmill → lumbermill`) korvaa yhä paikalla eikä osu kumpaankaan kattoon; uusi
      refusal `cell-full` kun ryväs on täynnä.

### Ydin — `packages/core`

- [x] `rules/build.ts`: `worksOn(cell)` ja `hasWork(cell, id)` — se `cell.building?.id ===
      x` jonka BUILD-007 poistaa. `buildingsOf` litistää kaikki, `sumOver` maksaa jokaisen
      Työn ja arvioi horroksen per solu, `canBuild` uusiksi.
- [x] `rules/aura.ts`: `resourceAura` projisoi jokaisen Työn auran; `loyaltySourceCells` ja
      `defenceAura` → `hasWork`.
- [x] `data/buildStore.ts`: `buildOn` liittää rypääseen (upgrade korvaa esiehtonsa),
      `demolishOn` saa valinnaisen `id`:n — ilman sitä viimeksi rakennettu puretaan.
- [x] `data/challenge.ts` + `data/world.ts`: `w.b` on nyt `BuildingId[]`. `CHALLENGE_VERSION`
      3 → 4, `WORLD_VERSION` 1 → 2. Vanha viesti hylätään nimellä.

### Migraatio — kenttätestaajan maa ei katoa

- [x] **`SCHEMA_VERSION` 2 → 3, ja tämä *migratoidaan*** (`data/schema.ts`). `MIGRATIONS[2]`
      käy `cell:`-avaimet läpi ja kirjoittaa `building` → `buildings: [building]`. Solut
      joilla ei ole kumpaakaan kenttää ovat jo kunnossa. 1 → 2 pysyy wipe-polkuna
      (`BRDC-SCALE-001`, ei transformia).
- [x] `schema.test.ts`: migraatiotestit **palauttavat** `MIGRATIONS`in eivätkä tyhjennä —
      nyt siellä on oikea migraatio jonka tyhjennys disarmoisi. Uusi testi 2 → 3:lle.

### Sovellus

- [x] `BuildPanel.tsx`: "Standing here · N/3" -lista, jokaisella rivillä oma Demolish;
      `onBuild`/`onDemolish` saavat `id`:n. `Upgrade`-nappi kun esiehto seisoo solussa.
- [x] `useSelection.ts`: `myBuildings = buildingsOf(cells)`; aura-esikatselu ottaa
      levein Työn; monumentin säde `hasWork`illa. `onDemolish(h3, id)`.
- [x] `territoryFeatures.ts`: tekstimerkki näyttää **uusimman** Työn — se saa juuri
      rakennetun näkyviin. Lippu väistyy jos yksikin Työ seisoo. Kaikki ikoneina: ART-003.
- [x] `NationIdentity.tsx`: `buildingsOf(owned).length`.
- [x] `GameRepository.demolish(h3, now, id?)` läpi `MockRepository`n.

### Portti

- [x] `pnpm test` (986) `&& typecheck && lint:lines && build` vihreät.
- [x] e2e `claim` + `research` + `dialogs` — ajossa.

## Ei tässä

- Ikonit kartalla (`BRDC-ART-003`). Tekstimerkki näyttää toistaiseksi yhden — uusimman.
- Vastustajan rakennusten piirto kartalle. Data tulee jo mukana (`challengeToCells`
  palauttaa `buildings`), mutta piirtotaso on ART-003.
- Per-Työ dwell/horros. Horros on yhä per solu, kuten ennen.
