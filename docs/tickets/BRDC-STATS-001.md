# BRDC-STATS-001 — Tilastot ja tuotantoennuste

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-ECON-001, BRDC-BUILD-002, BRDC-INSPECT-001 |
| **Status** | `done` — 2026-09-01 (tuotantoennuste Hearth-paneelissa, `[~]` selaimessa todentamatta) |
| **Valmius** | 90 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §6 (T1–T3) |

## 🔴 RED

`dominionOf` laskee jo läänin luvut, ja `BRDC-INSPECT-001` näyttää ne. Mutta se kertoo
**mitä on nyt**, ei mihin ollaan menossa. Kymmenen resurssin ja kuudentoista rakennuksen
taloudessa pelaaja ei voi päättää mitään ilman ennustetta.

## 🟢 GREEN

- [x] **Tuotantoennuste**: `forecastRates` — `perHour` ja `perDay` resurssikohtaisesti
- [x] Ennuste **ottaa huomioon lepotilan, katon ja talven** — koska se **on settle**
      eteenpäin, ei uudelleenjohdettu luku. Testi: ennuste × N = mitä N tuntia settleä
      maksaa (`forecast.repo.test.ts`)
- [x] **"Milloin minulla on varaa"** — `timeToAfford(pool, perHour, cost)` puhtaana;
      `ResearchPanel` näyttää " · ~N h" per teknologia
- [~] Heksakohtaiset tilastot — CellPanel näyttää jo `historyLine`n + `walked on N days`
      (`BRDC-HEX-001`); tuotettu-per-solu ei vielä
- [x] **Varoitukset ovat toimintoja** — `HearthPanel` "Show the first to fade" tehtiin
      jo `BRDC-INSPECT-001`:ssä, malli jatkuu
- [~] Laskenta **puhtaana**: `timeToAfford` on puhdas. `forecastRates` on data-sauma
      (`pouch.ts`) koska se tarvitsee saman syötteen kuin `settlePouch` — mutta
      deterministinen rakenteeltaan, ei arvausta
- [~] Luettavissa 360 px:llä — `Forecast · N wood/h · …` -rivi + ` · ~N h` per rivi.
      Selaimessa todentamatta

## Toteutettu 2026-09-01

**`MockRepository` jaettu ensin** (tiketin vaatimus): Wager-metodit →
`data/wagerRepo.ts` (`exportChallengeFrom`, `importChallengeInto`, `combatantFrom` +
`Muster`-tyyppi). 399 → 397 riviä ennen kuin lisättiin mitään.

- `data/pouch.ts#forecastRates(store, owned, now): Forecast` — settlaa nykytilan, sitten
  ajaa `settleResources`:n eteenpäin tasan tunnin ja tasan vuorokauden samoilla
  syötteillä (`perHourBonus`, `buildingDayBonus`, `storageCap`, `darkTimeAt().factor`) ja
  raportoi erotuksen. Ei voi olla eri mieltä toteuman kanssa.
- `rules/afford.ts#timeToAfford` (puhdas): ms seuraavaan varaan, `null` jos tarvittavaa
  resurssia ei tuoteta lainkaan. Pyöristää ylös kokonaiseen tuntiin.
- `GameRepository.getForecast` + `MockRepository` (yksirivi).
- UI: `HearthPanel` "Forecast"-rivi (nollasta poikkeavat `perHour`), `ResearchPanel`
  " · ~N h" per teknologia (`waitFor` → `timeToAfford`). `MapView` lukee `getForecast`n
  samassa efektissä kuin `getResources`n.
- Testit: `afford.test.ts` (4), `forecast.repo.test.ts` (4), `ResearchPanel.test.ts` (4).
  **663 vihreää.**

## Toteutus

`dominionOf` on tämän oikea koti; se on jo puhdas ja testattu, ja
`BRDC-INSPECT-001` kirjoitti sen syyn auki:

> *"useampi näistä luvuista on helppo saada hienovaraisesti väärin — tuottoluku joka
> laskee mukaan tuottamattomat solut, tai 'heikoin' joka valitsee solun jonka Tyhjyys
> on jo ottanut. Väärä luku tässä luetaan pelin valheena."*

Sama vaatimus, isommalla taloudella: **ennuste, joka ei vastaa toteumaa, on pahempi
kuin ei ennustetta.** Testi ajaa ennusteen ja kelaa kellon eteenpäin — ennusteen ja
toteuman on täsmättävä.

`dominion.ts` ja `MockRepository.ts` (395/400 riviä) ovat molemmat lähellä rajaa.
Tämä tiketti jakaa ne ennen kuin lisää mitään.

## Ei tässä

- Kaaviot ja historialliset käyrät. Luku riittää; käyrä on työtä ilman päätöstä
- Vertailu muihin pelaajiin. Codex of Dominion, `BRDC-SHARE-001`
