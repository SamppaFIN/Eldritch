# BRDC-BUILD-005 — Heksa näyttää vain sen mitä siinä voi tehdä

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-BUILD-001, BRDC-INSPECT-001, BRDC-MANA-001, BRDC-DWELL-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"Näytä joka heksalla toiminnot mitä siellä on"* ja *"näytä heksan tiedoissa
vain toiminnot mitä VOI rakentaa.. joku + nappi, mikä sitten aukaisee kaikki missä ei
resurssit tai teknologia riitä."*

Solupaneeli listaa kaiken minkä voisi joskus rakentaa. Kentällä, kävellessä, yhdellä
peukalolla, se on seinä harmaita rivejä joista yksikään ei kerro mitä *nyt* voi tehdä.
Pelaaja lakkaa lukemasta sitä — ja lakkaa siis rakentamasta.

Toinen puoli samasta: **temppeliä ei voi rakentaa lainkaan.** Se paljastuu vain dwell-
ajalla (`BRDC-DWELL-001`), ja kun dwell-kello vielä hyppää (`BRDC-DWELL-002`), manaa ei
saa mistään. Infinite: *"tehdään niin, että temppelinkin voi rakentaa resursseilla, mutta
käytetty aika antaa alennusta."* Se avaa manan ja teknologian umpisolmun.

## 🟢 GREEN

- [ ] **Oletuksena vain se mikä onnistuu nyt.** Solupaneeli listaa toiminnot joiden
      resurssit, teknologia ja maasto täyttyvät. Ei harmaita rivejä oletusnäkymässä.
- [ ] **`+`-nappi avaa loput** — samat rivit lukittuina, ja jokainen kertoo *mikä* puuttuu
      (resurssi, Riitti vai maasto). Yksi rivi per este, ei kolmea.
- [ ] Sama sääntö kaikelle mitä heksalla voi tehdä, ei vain rakentamiselle: warding,
      loitsu, anomalia, seikkailun etappi. Yksi lista, yksi sääntö.
- [ ] **Temppeli rakennettavissa resursseilla.** Täysi hinta ilman dwelliä; kertynyt
      dwell-aika antaa alennusta portaittain, ja täysi dwell on yhä ilmainen paljastus.
      Alennuskäyrä `constants.ts`:ään, ei paneeliin.
- [ ] Puhtaat funktiot `packages/core`ssa: mitä tällä solulla voi tehdä (`available`) ja
      mikä estää loput (`blockedBy`). Testit kummallekin.
- [ ] 360 px: oletusnäkymä mahtuu ruudulle ilman vieritystä yhdellä peukalolla.

## Ei tässä

- Uusia rakennuksia. Tämä on olemassa olevien esittäminen.
- Rakennusten tasapaino tai hinnat, paitsi temppelin dwell-alennus.
