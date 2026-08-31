# BRDC-GROW-001 — Vierekkäisyyskasvu: alue laajenee askel askeleelta

| | |
|---|---|
| **Vaihe** | 2.5 — suunnanmuutos |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-CLAIM-003, BRDC-CLAIM-005 |
| **Status** | `done` |
| **Valmius** | 100 % |
| **Lähde** | `files/pelin-suunnittelumuistiinpanot.md` · `PIVOT-2026-08-27.md` |

## 🔴 RED

Kävely ei tee mitään näkyvää ennen kuin lenkki sulkeutuu. Voit kävellä 500 metriä ja
saada viivan. Jos et satu kiertämään mitään — ja useimmat kävelyt eivät kierrä — peli
ei anna mitään koko matkalta.

## 🟢 GREEN

- [x] Ruutu jossa pelaaja seisoo valtautuu, **jos se on vierekkäin jo omistetun kanssa**
- [x] Ensimmäinen valtaus koskaan on siemen: vierekkäisyyttä ei vaadita
- [x] Ei-vierekkäinen ruutu **ohitetaan hiljaa** — se on GPS-hyppy, ei valtaus
- [x] Vieras ruutu ottaa vahinkoa samalla piiritysmallilla kuin lenkissä
- [x] Lenkin sulkeutuminen täyttää **sisäpuolen** yhä — kasvu ei korvaa sitä
- [x] Puhdas funktio `packages/core/rules`issa, aika parametrina

Todennettu ajetulla testijoukolla (`growth.test.ts`, `claiming.test.ts`). Ulkona kävelty
todennus on erikseen, kuten muissakin vaiheen tiketeissä.

**Jälkihuomio (BRDC-VIGIL-001):** vierekkäisyysvahti pysäytti kasvun kokonaan, kun sivu
oli ollut jäätyneenä eikä katkon jälkeinen fix koskettanut mitään omaa. Katko ei ole
hyppy, ja se erotetaan nyt ajasta.

## Toteutus

```ts
growTerritory(cells, standingOn, attacker, now) → CaptureOutcome[]
```

**Vierekkäisyys torjuu GPS-hypyn ilman polygonitarkistusta.** Jos fix hyppää 200 m
sivuun, se ruutu ei kosketa omaa aluetta eikä valtaudu. Kun fix palaa, kasvu jatkuu.
Muistiinpanojen sanoin: *"vierekkäisyyssääntö riittää"*.

**Miksi tämä ei korvaa lenkkiä:** vierekkäisyys antaa ruudut joissa jalka kävi — korttelin
kierto tuottaa **ontton renkaan**. Lenkki täyttää sisuksen. Ne ovat kaksi tasoa samaa
mekaniikkaa, eivät vaihtoehtoja.

## Ei kuulu tähän tikettiin

Maasto ja resurssit (vaatii Overpassin). Rakentaminen.

## Todennettu käytössä — 2026-08-31

> Infinite: *"tuo tämän hetken valtausmekanismi on oikeen kiva käytännössä"*

Ensimmäinen kerta, kun jokin tämän projektin mekaniikoista on arvioitu **käytöstä eikä
testistä**. Se koskee `BRDC-GROW-001`:n ja `BRDC-CLAIM-001`:n yhdistelmää: kävely
laajentaa aluetta askelittain, lenkin sulkeminen täyttää sisuksen.

`PIVOT-2026-08-27.md` §1 päätti pitää molemmat eri rooleissa sen sijaan, että olisi
valittu toinen. Se päätös on nyt vahvistettu käytännössä.

**Seuraus: valtausmekaniikkaan ei kosketa.** Kehityssuunnitelman B1 (*"Flood Fill
-korjaus"*) oli prototyypin bugi, ei tämän — todennettu `BRDC-REGRESSION-000` #13:ssa.
Vaiheen 3 sisältö rakentuu tämän päälle eikä muuta sitä.
