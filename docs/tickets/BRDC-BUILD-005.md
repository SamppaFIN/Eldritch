# BRDC-BUILD-005 — Heksa näyttää vain sen mitä siinä voi tehdä

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-BUILD-001, BRDC-INSPECT-001, BRDC-MANA-001, BRDC-DWELL-001 |
| **Status** | `done` — 2026-09-02 (v0.5.11), kenttätodennus `[~]` |
| **Valmius** | 80 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"Näytä joka heksalla toiminnot mitä siellä on"* ja *"näytä heksan tiedoissa
vain toiminnot mitä VOI rakentaa.. joku + nappi, mikä sitten aukaisee kaikki missä ei
resurssit tai teknologia riitä."*

Solupaneelin `BuildPanel` listaa kaikki 11 rakennusta aina, useimmat lukemalla "Wrong
ground". Kentällä, kävellessä, yhdellä peukalolla se on seinä harmaita rivejä joista
yksikään ei kerro mitä *nyt* voi tehdä. Pelaaja lakkaa lukemasta sitä — ja lakkaa siis
rakentamasta.

## 🟢 GREEN

- [x] **Oletuksena vain se mikä onnistuu nyt.** `BuildPanel` näyttää oletuksena vain
      rakennukset joiden `canBuild` on `ok`. Ei buildattavaa → rivi *"Nothing can be built
      here yet."* — v0.5.11.
- [x] **`+`-nappi avaa loput** — `+ N more` paljastaa lukitut rivit, jokainen `reason()`illa
      (yksi lause: *Wrong ground* / *Needs Masonry* / *Cannot afford* / …). "Show less"
      sulkee. `splitBuildable(checks)` puhtaana apurina, testattu (`BuildPanel.test.ts`).
- [~] **Sama sääntö muille heksatoiminnoille** (warding, loitsu, anomalia, seikkailu) —
      ne ovat omia alipaneelejaan `CellPanel`issa (`SpellPanel`, `AnomalyPanel`,
      `QuestCellPanel`) ja kukin on jo pieni (1 nappi tai lyhyt lista). Yhtenäinen `+`
      kaikkien yli on `CellPanel`-restrukturointi → `BRDC-KEEP-004`:n hengessä, oma
      harkintansa. Rakennusseinä oli se konkreettinen ongelma, ja se on korjattu.
- [x] 360 px: oletusnäkymä on 0–3 riviä + `+`, mahtuu ilman vieritystä.
- [x] Puhdas `splitBuildable`, testattu. `available`/`blockedBy`-nimet: `canBuild` +
      `reason()` täyttävät saman roolin, ei uutta rinnakkaista APIa.

## Siirretty omaan tikettiin — `BRDC-TEMPLE-001`

*"tehdään niin, että temppelinkin voi rakentaa resursseilla, mutta käytetty aika antaa
alennusta."* Temppeli on nyt **dwell-paljastettu Place**, ei `BUILDINGS`-rivi
(`rules/dwell.ts` `revealPlaces`), ja `build.ts:141` sanoo eksplisiittisesti *"the one
thing resources cannot buy, only time in a place"*. Sen tekeminen ostettavaksi on
tietoinen mekaniikkamuutos — oma tikettinsä ja oma suunnitelmansa, ei UI-korjauksen
kylkiäinen. Manan umpisolmu on jo väljempi: `BRDC-ECON-003`:n versiolahja antaa 30 manaa
testiin, ja dwell paljastaa temppelin normaalisti.

## Ei tässä

- Uusia rakennuksia. Tämä on olemassa olevien esittäminen.
- Rakennusten tasapaino tai hinnat.
- Temppeli resursseilla → `BRDC-TEMPLE-001`.
