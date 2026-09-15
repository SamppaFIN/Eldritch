# BRDC-SEED-000 — Päätökset: Worldseed pelin siemeneksi

| | |
|---|---|
| **Alue** | — (päätöspöytäkirja, ei koodia) |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | — |
| **Status** | `todo` — kaikki muut SEED/TERRAIN/RES/WONDER/QUEST/TAVERN/BUILD-tiketit odottavat tätä |
| **Riippuvuudet** | — |
| **Lähde** | Infinite 2026-09-16: *"tee ensin suunnitelma ja tiketit kaikista heksan alustuksista ja uusista resursseista"* |

## 🔴 RED

`worldseed.ts` ja `seed.harmala.json` tuovat pelin nykyiseen malliin yhdeksän ristiriitaa,
joita ei voi ratkaista koodaamalla — ne ovat suunnittelupäätöksiä. Ne on listattu erikseen
niissä tiketeissä joissa ne tulevat vastaan; tämä tiketti on niiden yhteinen pöytäkirja,
jotta yksikään ei ratkea hiljaa oletuksena.

## 🟢 GREEN — päätökset, yksi rivi kukin

| # | Tiketti | Kysymys | Suositus |
|---|---|---|---|
| **D1** | `TERRAIN-005` | Worldseedin 7 maastolajia korvaavat pelin 7 (2 poistuu, 2 uutta) — hyväksytäänkö? | Kyllä — kahden sanaston kääntäminen on pysyvä virhelähde |
| **D2** | `RES-001` | Seedatun alueen ulkopuolella: hajautus uudella 28-poolilla, vai ei bonusresursseja ennen seedausta? | Hajautus samalla ~5 % tiheydellä |
| **D3** | `RES-001` | herd/furs/amber/spice: muunnetaanko lähimpään uuteen resurssiin vai jätetäänkö perintönä? | Muunna (herd→cattle), loput perintönä kunnes seedattu alue korvaa |
| **D4** | `WONDER-002` | 9 paikallista ihmettä korvaavat 12 lovecraftilaista seedatulla alueella, vai elävätkö rinnakkain? | Korvaavat — kaksi ihmejärjestelmää samalla kartalla on lukijalle kaksi eri peliä |
| **D5** | `WONDER-002` | 8 vai 9 ihmettä (dokumentti on epäjohdonmukainen itsensä kanssa) | 9 — taulukko ja `expectedCounts` pitävät paikkansa, luovutustekstin "8" on kirjoitusvirhe |
| **D6** | `WONDER-002` | *Ten Thousand Steps* vaatii mäen; Härmälä on tasainen. Siirretäänkö ihme pois alueelta? | Siirrä pois, kunnes DEM (D9) ratkeaa |
| **D7** | `TAVERN-001` | Tavernan Wager-rooli (respawn, viestit) poistuu Wagerin mukana — vahvistus | Kyllä, `BRDC-WAGER-008`:n mukaisesti |
| **D8** | `QUEST-006` | Seedatun alueen ulkopuolella säilyykö nykyinen Keep-ankkurointi (`BRDC-QUEST-004`)? | Kyllä — muuten muualla asuva ei voi pelata |
| **D9** | `TERRAIN-005` | Korkeusmalli (DEM) `hill`-luokittelulle ja Ten Thousand Steps -ihmeelle | Ei vielä — ei riippuvuutta repossa; hill jää OSM-tageista päätellyksi kunnes joku pyytää DEM:n |

## Ei tässä

- Itse toteutus — jokainen päätös toteutetaan sen omassa tiketissä
