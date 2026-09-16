# BRDC-WONDER-012 — The Drowned Eye

| | |
|---|---|
| **Alue** | `rules/harmalaWonder.ts`, `data/wonderStore.ts` (löytöportti), `sim/` (paljastusmittaus), jaetun maailman synkronointi |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | XL |
| **Status** | `todo` — luonnos, ei toteutettu. **Kalleimpana viimeinen tässä sarjassa** |
| **Riippuvuudet** | `BRDC-WONDER-003`, `BRDC-WONDER-011`in paljastusmittaus (isompi versio samasta), `BRDC-SHARE-001` (jaettu maailma) |
| **Lähde** | `worldseed.ts` (`eye_of_the_lake`), `rules/harmalaWonder.ts`in `drowned-eye` |

## 🔴 RED — kolme erillistä, aitoa ongelmaa, ei yksi

Dokumentti: *"Reveals all cells within 3 km, permanently. A rival siege on your ground
is announced. Opens only once the tale reaches its fifth stop."* Sekä `harmalaWonder.ts`
että `BRDC-WONDER-002`in oma GREEN mainitsevat tämän jo erikseen kaikkein rajoitetuimpana
(sijoittumaton tähän mennessä, vaatii `island`-lipun jota yksikään vyöhyke ei kanna).

**Kolme riippumatonta estettä, ei yksi:**

1. **3 km paljastus.** `BRDC-WONDER-011`in oma mittaus (~4 921 solua 2 km:llä) skaalautuu
   tästä vielä ylöspäin — `3n(n+1)+1` 60 renkaalla on **10 981 solua**. Jos 2 km jo
   vaatii mittauksen ja mahdollisen joukkokirjoituksen, 3 km ei ole "sama asia isommin" —
   se on saman ongelman pahin tapaus
2. **"Rival siege announced" on uusi ilmoitusjärjestelmä, ei paljastus.** Peli ei ole
   reaaliaikainen moninpeli — rivaalin piiritys näkyy vasta kun laite synkronoi
   `world.json`in (`BRDC-SHARE-001`) ja huomaa oman solun vahvuuden pudonneen jostain
   muusta syystä kuin rappiosta. Tämä vaatisi **uuden vertailun** kahden peräkkäisen
   synkronoinnin välillä — ei ole olemassa mitään joka tänään huomaisi "tämä muutos oli
   hyökkäys, ei rappio"
3. **Portti viidenteen tarinan pysähdykseen** on ainoa helppo osa: `FUMING_PATH`
   (`questSites.ts:154`) on `['statue','lake','hermit','troll','deep']` — täsmälleen
   viisi, ja `'deep'` on viides. Ehto on `adventures.find(a=>a.id==='fuming-lake')?.state
   === 'done'` tai `stageId === 'deep'` — yksi rivi, jo olemassa olevalla tiedolla

## 🟢 GREEN — ehdotus, ei toteutettu

- [ ] **Löytöportti ensin, halvin osa:** `findWonderAt` (`wonderStore.ts:45`) saa uuden
      ehdon `drowned-eye`ille: ei löydettävissä ennen kuin *Fuming Lake* on `state ===
      'done'`. Testattavissa heti, ei riipu muusta tässä tiketissä
- [ ] **3 km paljastus vasta `BRDC-WONDER-011`in mittauksen ja ratkaisun jälkeen** —
      sama koneisto, isompi luku. Ei toteuteta ennen kuin se ticket on mitannut ja
      ratkaissut skaalautuvuuden
- [ ] **"Rival siege announced" on oma, aidosti uusi ominaisuutensa:** uusi vertailu
      `world.json`in kahden peräkkäisen luvun välillä (nykyinen vs. edellinen), joka
      merkitsee minkä solun vahvuus laski enemmän kuin rappio yksin selittäisi. Tämä on
      **lähempänä uutta ilmoitusjärjestelmää kuin ihteen liittyvää sääntöä** — kannattaa
      harkita omaksi tiketikseen (esim. `BRDC-SHARE-00X`) riippumatta tästä ihmeestä,
      koska "milloin rivaali hyökkää maahani" on hyödyllinen tieto ilman Drowned Eyeäkin

## Päätös Infiniteltä

- **Onko "rival siege announced" arvokas tarpeeksi omaksi, ihmeestä riippumattomaksi
  ilmoitusominaisuudekseen?** Jos kyllä, se kannattaa irrottaa tästä ihmeestä kokonaan
  omaksi tiketikseen jaetun maailman alle, ja Drowned Eye vain avaisi sen käyttöön
  löytäjälleen pysyvästi hyökkäysvaroituksena
- 3 km:n paljastus tässä pelin mittakaavassa (Härmälänranta) kattaisi käytännössä
  suuren osan koko seedatusta alueesta kerralla — onko se tarkoitus, vai pienempi luku?

## Ei tässä

- Kaikki muu tämän sarjan yhdeksästä — jokainen mitattu ja toteutettu ennen tätä,
  halvimmasta kalleimpaan, tämän tiketin oman metatietotaulukon mukaisesti
