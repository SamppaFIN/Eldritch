# BRDC-SIGIL-006 — Heksan merkit: kerran, omissa paikoissaan, specin mukaan

| | |
|---|---|
| **Alue** | `territory/cellMarks.ts`, `territoryMarks.ts`, `TerritoryLayer.ts`, `strengthArcs.ts`, `BuildingIconLayer.ts`, `CastleMarker.ts`, `PlaceMarkers.ts`, `QuestMarkers.ts`, `core/geo/strengthArc.ts`, sprite-rasterit |
| **Vaihe** | 3 — Sivilisaatio |
| **Status** | `done` (v0.6.20–0.6.23) — osittaiset kohdat merkitty `[~]`, lippu odottaa päätöstä |
| **Lähde** | Infinite 2026-09-15, kuvakaappaukset puhelimesta ja dev-serveriltä, vertailu Sigil §03:een |

## 🔴 RED

Infinite: *"heksat jotenkin tuplana… pelaajan logot ja resurssit saisivat olla suurempia.. ei
vastaa specsin mittoja… isometriset rakennukset saa olla kans paljon isompia… laita joku
malli millä tiedot ei rendaa päällekkäin."* Spec-vertailun jälkeen: *"lähempänä, mutta
silti kaukana halutusta."*

1. **Renkaat joka kulmassa.** Naapurikiekko ja löydön merkki olivat `circle`-tasoja
   polygonilähteellä — MapLibre piirtää circle-tason polygonin **jokaiseen kärkeen**.
2. **Luvut kahdesti.** Symbolien ankkurit johdettiin polygoneista. Infiniten datalla
   pistelähde poisti sen (*"nyt näyttäisi toimivan"*); paikallisesti ei toistunut.
3. **Kaikki liian pienet.** `pixelRatio: 2` puolitti jokaisen koon, ja ensimmäinen korjaus
   laski heksan koon 256 px -laattakonventiolla — sekin puolet todellisesta.
4. **Päällekkäisyys.** Jokainen taso keksi oman offsetinsa: *"THE 100 KEEP"*,
   *"100 THE KEEP 100"*, questin nimi naapurikiekon päällä.
5. **Poikkeamat §03:sta.** Vahvuusluku väärässä paikassa, naapurimäärä violetti rengas,
   kaari ohut ja **vasemmalla kyljellä** eikä pohjan V:ssä, oma reunaviiva raidoitettu.
6. **Questin merkki liikkuu yhä.** v0.6.13 kiinnitti säännöt (`siteCell`), mutta kartta piirsi
   yhä `questSiteAt`illa — merkki liukui Hearthin mukana, ja napautus avasi eri heksan.
7. **Temppelillä ei ole kuvaa.** Infinite: *"ei ole isometristä temppelin kuvaa.."* Temppeli ja
   Ankkurikivi olivat kultainen tai vihreä piste ja nimi, kun jokainen Työ seisoi
   isometrisenä. §03 piirtää ne heksan rakennelmana. Lisäksi lippu piirtyi niiden heksalle —
   myös Keepin omalle heksalle, koska Ankkurikivi on Hearth-solu (`placesWithHome`).

## 🟢 GREEN

- [x] Merkit omalla **pistelähteellä** (`cell-marks`) — probe: 0 toistoa zoomeilla 16–21
- [x] `cellsToGeoJson` takaa **yhden featuren per heksa** — `cellMarks.test.ts`
- [x] Heksan säde **mitattu** `map.project()`:lla: 43.5 / 86.9 / 173.9 / 347.8 px (z16–19)
- [x] **Slottitaulu**: keskusta rakennus/lippu · NW naapurimäärä · NE löydön kiekko ·
      SW löydön sprite · S vahvuusluku · N nimet — kuvakaappaukset z16/17/19
- [x] Slotit ja koot **eksponentiaalisesti** (kanta 2) mitatusta säteestä
- [~] Koot heksan osuutena, pixelRatio huomioiden. Lippu ja löytö todennettu; **rakennusta
      ei nähty** — tuoreella profiililla ei ole Työtä. Loppuosa: profiili jossa on Työ
- [~] `icon-anchor: bottom` — lippu nähty; rakennus sama syy kuin yllä
- [x] Naapurimäärä: tumma täytetty kiekko, vihreä luku
- [x] Vahvuuskaaren leveys suhteessa heksaan
- [x] Kaari **pohjan V:ssä** (§03) — `strengthArc.test.ts` 10/10 + kuvakaappaus
- [~] Oma reunaviiva 3.5 px (`cells-own-line`) kiinteänä nähty; **kilpailijan katkoviivan
      päällä ei todennettu** — testiprofiililla ei ole kilpailijanaapuria
- [x] Luvut osallistuvat sijoitteluun, Keepin ja paikkojen nimet niiden alla (live-tyylistä)
- [x] Questin nimi samaan malliin (pohjoisslotti, lukujen alle) — kuvakaappaus z17. **Huom:**
      z16:lla nimet väistyvät kokonaan lukujen tieltä, ja samalla heksalla Keepin nimi väistyy
      questin nimelle (sama slotti) — päällekkäisyys poissa, mutta yksi nimi piiloon
- [x] **Questin merkki kiinnitetyn heksan keskellä** — `QuestMarkers.test.ts`. Vanha rivi takaisin
      → testi kaatuu: merkki piirtyi Helsinkiin (`[24.94, 60.17]`) kiinnitetyn Tampereen heksan sijaan
- [x] **Temppeli ja Ankkurikivi isometrisinä rakennelmina** (`placeSprites.ts`): pohja-ankkuroitu
      keskelle, Työn kokoinen; kultainen kipinä ja vihreä ydin §03:n mukaan; piste vain varalla
      kunnes kuvat ovat atlaksessa; nimi väistyy katon tieltä
- [x] Ei lippua paikan heksalla (`cellsToGeoJson(…, places)`) — `cellMarks.test.ts`
- [~] Teardown poistaa jokaisen tason molemmilta solulähteiltä — koodattu, mikään testi ei aja
- [x] Sprite-latailijat eivät koske poistettuun karttaan (`watchRemoval`, v0.6.21). Infiniten
      konsolissa `reading 'getImage'` kaatumisen jälkeen; `mapLife.test.ts`, ja Infiniten oma
      dev-serveri päästä päähän: 0 virhettä
- [x] `claim.spec.ts`: tasomäärä ei kasva, viivat pois loitonnettaessa — 2/2
- [x] Portti vihreä (1405 testiä, typecheck, build, riviraja), versio 0.6.20 ja changelog

## 🔴 Päätös Infiniteltä

**Lippu heksan keskellä.** §03 ei piirrä lippua heksalle lainkaan — keskusta kuuluu
rakennukselle, ja tyhjä maa pysyy läpinäkyvänä (*"Empty ground keeps the map visible
through it"*). Lippu suurennettiin Infiniten pyynnöstä (*"pelaajan logot… suurempia"*).
Vaihtoehdot: pois heksalta · pieni kulmassa · pysyy suurena.

## Ei tässä

- **Avoin havainto (2026-09-15):** tuoreessa istunnossa kartan `places` jäi tyhjäksi — ei edes
  Ankkurikiveä — vaikka `home` on tallessa, ja myös sivun uudelleenlatauksen jälkeen. `MapView`
  lukee paikat vain `trail.ready`- ja `trail.revealed`-muutoksilla, eli uudella pelaajalla ennen
  Hearthin perustamista. Uudelleenlatauksen tyhjyyttä se ei selitä — syy selvittämättä. Temppelin
  ja Ankkurin kuva todennettiin syöttämällä paikat suoraan lähteeseen; Infiniten omassa
  istunnossa paikat latautuvat. Keepin oman pisteen ja Ankkurin pohjan päällekkäisyyttä ei nähty

- DOM-kerrosten päällekkäisyys (vihje ja ilmoitus paneelin otsikon päällä) — `BRDC-MAP-005`
- Opastusdialogin nappi HUD:n alla — `BRDC-TUTOR-004`
- Orbitron-fontti luvuille kartalla — MapLibre tarvitsee glyph-PBF:t, tyylissä vain Noto Sans
- Rasterien kasvatus yli 2× ylärajan — muistikustannus puhelimella
