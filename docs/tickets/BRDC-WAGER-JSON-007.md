# BRDC-WAGER-JSON-007 — Omistus aina näkyvissä, ja kaksi näkyvyysmoodia

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | M |
| **Riippuvuudet** | BRDC-WAGER-JSON-004, BRDC-WAGER-JSON-006, BRDC-MAP-002 |
| **Status** | `done` (2026-09-06, v0.5.40) |
| **Valmius** | 100 % |
| **Lähde** | Infinite, kenttätesti 2026-09-06: *"Nyt tuo heksa ei näytä omistuksen graafia"* + *"wagerissa on kaksi moodia, ota käyttöön näkyvää.. saat kaikki vihun tiedot ruudulle, tai kuten nyt että näkyy punaisena"* + AskUserQuestion → *"Vastaanottaja togglettaa"* |

## 🔴 RED

`SharedNote` — omistusdonitsi — renderöityi vain kun `cell.shared` oli asetettu, eli
**vain päällekkäisillä soluilla**. Yksin omistettu heksa ei näyttänyt omistusta lainkaan,
vaikka juuri sitä katsottiin.

Ja vastustajan solu vuoti aina koko tietonsa: vahvuuspalkki, rappioaika,
`ImportedNote` — ei valintaa nähdäänkö ne vai ei.

## 🟢 GREEN

- [x] **`SharedNote` → `OwnershipNote`**, renderöi **jokaiselle omistetulle solulle**
      (`cell.ownerId !== null`). Yksin omistettu = täysi violetti rengas, "Yours · 100%".
      Jaettu = nykyinen jaettu donitsi + "walk it on a new day" -teksti. Vastustajan solu
      = täysi punainen rengas, "Held by {name}". Ei uutta väriä, ei uutta luokkaa —
      `wager__shared*` `wager.css`:stä.
- [x] **`OwnershipNote.test.ts`**: renkaan prosentti — 100 yksin, 0 vastustajalla,
      vahvuusjako importissa (300/100 → 75%), päiväjako tasapelissä (3/1 → 75%).
- [x] **`settings.revealRivals`** (oletus **päällä** — kavereiden kesken tarkoitus on
      nähdä toistensa ulottuvuus). `SettingsMenu`-rivi "Show a rival cell's full detail".
- [x] **`CellPanel` `revealRivals`-propsi.** `showDetail = mine || revealRivals` portittaa
      vastustajan solulla: vahvuuspalkki + rappio, ja `ImportedNote`. Pois → "Held by
      another" + punainen rengas, ei erittelyä. Maan arvo (`m²`, yield, naapurit) jää
      aina — se on maastotietoa, ei omistajan.
- [x] `MapView` välittää `revealRivals={settings.revealRivals}`.
- [x] `pnpm test` (994) `&& typecheck && lint:lines && build` vihreät; e2e `dialogs`
      (asetusvalikko, kaksi uutta riviä) + `wager`.
- [x] `CellPanel` (405 → trimmattu 400) ja `MapView` (401 → 400): yksi kommentti kumpikin.

## Vaikutus

- Data kulkee yhä kokonaan mukana `world.json`issa ja haasteessa (päätös 3:
  vastaanottaja togglettaa). Toggle ei suojaa mitään — se on katselutila, ei salaus.
  Lähettäjän valinta mitä paljastaa on eri tiketti jos joskus tarvitaan.
- `territoryFeatures.cellProperties.shared` ei muutu — kartan ruutu piirtyy kuten ennen.

## Ei tässä

- Lähettäjän valinta paljastuksesta (päätös 3 sulki tämän pois).
- Vastustajan rakennusten piirto — se tuli `BRDC-ART-003`:ssa (`buildings` on jo datassa).
- Scrying / manalla paljastus (`BRDC-SPELL-002`).
