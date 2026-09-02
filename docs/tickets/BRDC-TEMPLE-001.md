# BRDC-TEMPLE-001 — Temppelin voi rakentaa resursseilla, dwell antaa alennusta

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (mekaniikkamuutos + persistointi + testit) |
| **Riippuvuudet** | BRDC-MANA-001, BRDC-DWELL-001, BRDC-DWELL-002, BRDC-BUILD-005 |
| **Status** | `done` (v0.5.21) |
| **Valmius** | 100 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 (irrotettu `BRDC-BUILD-005`:stä) |
| **Jatko** | `BRDC-TEMPLE-002` — temppeli tutkimusrakennuksena, koulukunnat |

## 🔴 RED

Infinite: *"tehdään niin, että temppelinkin voi rakentaa resursseilla, mutta käytetty
aika antaa alennusta."*

Tällä hetkellä temppeli on **vain** dwell-paljastettu Place: seiso solussa
`TEMPLE_THRESHOLD_MS` (90 min) ja se saa nimen. `build.ts:141` sanoo tämän ääneen —
*"the one thing resources cannot buy, only time in a place"* — ja `library` /
`temple-grove` -rakennukset gettaavat `needs-a-temple`. Manan ainoa lähde on siis
90 min paikallaanoloa per temppeli. Se on liian jyrkkä sisäänkäynti manaan ja
teknologiaan, varsinkin kun dwell-kello on juuri vakautettu (`BRDC-DWELL-002`) mutta
kenttäkokemus on yhä ohut.

Tämä on **tietoinen mekaniikkamuutos**, ei bugikorjaus — siksi oma tikettinsä ja oma
plan-mode-suunnitelmansa.

## 🟢 GREEN

- [x] **"Consecrate a temple" -toiminto** solulla jonka omistat: maksaa `stone + gold`
      (`TEMPLE_CONSECRATE_COST = { stone: 120, gold: 80 }` `constants.ts`:ssä).
      `ConsecratePanel.tsx` renderöi `CellPanel`in `mine`-haarassa kun `place.kind === null`.
      Ei `BUILDINGS`-rivi.
- [x] **Dwell antaa lineaarisen alennuksen.** `consecrateCost(dwellMs)` (`mana.ts`):
      0 dwell → täysi hinta, `>= TEMPLE_THRESHOLD_MS` → `{}` (ilmainen, = nykyinen
      paljastus), väliltä `ceil(v * (1 - dwellMs/threshold))` per laji. Ei paneelissa
      muuta kuin "your time here has paid N%".
- [x] **Vihitty temppeli on kaikin puolin temppeli.** `consecrateAt` kirjoittaa
      `K.dwell[h3] = max(dwell, TEMPLE_THRESHOLD_MS)` — se *on* koko temppelin luonti.
      `placesWithHome` / `revealPlaces` / `manaBonus` johtavat temppelit `K.dwell`:istä,
      joten solu on nyt identtinen dwell-paljastetun temppelin kanssa: tuottaa manaa
      (todennettu `temple.repo.test.ts`), laajennettavissa (`expandTempleAt` lukee
      `getPlaces`istä, sama polku kuin `mana.repo.test.ts`:n testaama), täyttää
      `needs-a-temple`-gaten, rappeutuu omistuksen mukana.
- [x] **Ei tuplatemppeliä.** `dwell[h3] >= TEMPLE_THRESHOLD_MS` → `already-a-place`;
      `h3 === home` → `is-hearth`. `ConsecratePanel` näkyy vain kun `place.kind === null`.
- [x] Persistointi: ei uutta avainta — `K.dwell` on yhä `Record<h3, number>`, vain arvo
      nousee. `resetAll` siivoaa sen jo. Ei `SCHEMA_VERSION`-nostoa.
- [x] Puhtaat funktiot + testit: `consecrateCost` — täysi 0:lla, `{}` kynnyksellä,
      monotoninen väliltä, negatiivinen dwell = 0 (`mana.test.ts`, 5 testiä) ·
      `temple.repo.test.ts` (8 testiä): vihkiminen luo temppelin, veloittaa pouchin,
      tuottaa manaa, alennus laskee hintaa, refusalit köyhä / Hearth / vieras maa /
      jo place. `describe.ts` `mana` + `ref:'consecrate'` → "Consecrated a temple".
- [~] Lore-rivi `docs/backlog/`:iin — ohitettu, "mekaniikka ensin". Siirtyy
      `BRDC-TEMPLE-002`:n yhteyteen jos koulukunnat tuovat vihkimisrituaalille tekstiä.

## Ei tässä

- Temppelien visuaalinen tyyli kartalla (Place-markkeri on jo olemassa).
- Manan tasapaino / `manaRate`-numerot.
- `BUILDINGS`-taulun uudet rakennukset.
