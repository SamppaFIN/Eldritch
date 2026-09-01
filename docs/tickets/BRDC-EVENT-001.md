# BRDC-EVENT-001 — Tapahtumaketjut, anomaliat ja pimeät ajat

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-REVEAL-001, BRDC-HEX-001 |
| **Status** | `in_progress` — 2026-09-01: pimeät ajat + anomaliat + tapahtumaketjut tehty; karttamarkkeri jäljellä |
| **Valmius** | 85 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §2.3, §2.4 |

## 🔴 RED

Maailma ei tee mitään itsestään. Kaikki mitä tapahtuu, tapahtuu koska pelaaja käveli.
Sen jälkeen kun lääni on rakennettu, kartta on staattinen kuva, jota rappeutuminen
kalvaa — eikä mikään koskaan **yllätä**.

Suunnitelma nostaa kaksi vaikutetta, jotka korjaavat juuri tämän: Stellariksen
tapahtumaketjut ja Endless Legendin talvi.

## 🟢 GREEN

- [x] **Anomaliat**: `rare`-solu on anomaliapaikka (`revealOf`, oli käyttämättä).
      Tutkiminen maksaa 20 wisdomia ja kestää 3 h (`now`-luettu, ei ajastinta), palkinto
      paljastuu vasta `isResolved`-hetkellä. `rules/anomaly.ts` — puhdas, 7 testiä
- [x] **Tapahtumaketjut**: `rules/chain.ts` tilakone, tila `cell.anomaly.stage`:ssa.
      `applyChoice` soveltaa effektin (resurssit +/-, XP) ja palauttaa `next | 'end'`
- [x] Ketjut ovat **dataa**: `data/chains.json` (2 esimerkkiä — "the hum", "the door"),
      `parseChains` validoi kerran latauksessa. Lisää = tiedostoon, ei käännöstä
- [x] `describeAnomalies` → `getAnomalies` kartalle/paneeliin; `anomalyStore.ts` sauma
      (investigate / resolve / choose), kirjaa `LogKind: 'anomaly'`
- [x] UI: `AnomalyPanel` (CellPanelin alipaneeli, 4 tilaa), `useAnomaly`-hook, tietokirjan
      aihe `anomaly` (WIKI-001 slice 3)
- [~] Karttamarkkeri anomaliasolulle — siirretty: `AnomalyLayer` vaatii `MapCanvas`-
      laajennuksen (400 r), tehdään `BRDC-ART-001`:n visuaalipassissa
- [~] **Pimeät ajat**: tuotanto laskee (`DARK_TIME_FACTOR = 0.6`). *Mystisten tapahtumien
      yleistyminen* odottaa anomalia-/ketjumekaniikkaa
- [x] Pimeä aika on **kalenterista johdettu** — `darkTimeAt(now)`, joulukuun 21. ympärillä
      ±7 pv, deterministinen, ei arvontaa. Sama kaikille
- [x] Pelaaja **näkee talven tulevan** — Hearth-paneeli näyttää "The dark time comes in
      N days" 21 pv ennen, ja aktiivisena jäljellä olevat päivät
- [x] Ei ajastinta — `darkTimeAt` lukee kellon, `settleResources` saa `factor`-parametrin
      (oletus 1, ei muuta olemassa olevaa)

## Toteutettu 2026-09-01 (pimeät ajat)

`rules/darkTime.ts` (puhdas): `darkTimeAt(now): DarkTime` — `{ active, factor, changesAt,
inDays }`. Ikkuna on jouluseisauksen kahden viikon jakso; naapurivuosien seisaukset
tarkistetaan myös, joten vuodenvaihde on oikein. `settleResources` 7. parametri `factor`
kertoo tuotannon (`trickle` + `bonusPerHour` + `bonusPerDay`); `factor = 1` antaa
bittiä myöten saman kuin ennen. `pouch.ts#settlePouch` syöttää `darkTimeAt(now).factor`.
`HearthPanel`-rivi. Testit: `darkTime.test.ts` (7). **651 vihreää.**

Ikkuna ja kerroin ovat viritettäviä — mekanismi on paikallaan, tasapaino kaipaa
Infiniten silmää.

## Toteutus

**Pimeä aika on rappeutumisen serkku, ei uusi järjestelmä.** `decay.ts` laskee jo
kulumisen kellosta; talvi on kerroin tuotantoon samasta kellosta. Jos tämä tiketti
tarvitsee oman ajastimensa, se on toteutettu väärin.

**Ketju on tilakone, jonka tila asuu solussa** (`BRDC-HEX-001`). Se on myös syy tehdä
HEX-001 ensin: ilman solun muistia ketju ei voi olla monivaiheinen.

Tämä on ensimmäinen tiketti, jossa `docs/backlog/`in v2-aineisto pääsee takaisin peliin
— ei ominaisuutena vaan **sisältönä valmiiseen mekaniikkaan**. Se on tarkalleen se
järjestys, jonka golden rule 6 vaatii, ja se on syytä sanoa ääneen tässä.

## Ei tässä

- Seikkailut ja dialogi → `BRDC-QUEST-001`. Tämä on runko, se on tarina
- Satunnaiset tapahtumat, jotka rankaisevat poissaoloa. Peli rankaisee jo
  rappeutumisella; kaksi rangaistusta samasta asiasta on yksi liikaa
