# BRDC-FX-002 — Kun saat jotain, kaiken pitää rähähtää

| | |
|---|---|
| **Alue** | `features/hud/PouchGain`, `features/territory/TerritoryLayer` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `in_progress` — palkinnon räjähdys ja maamerkit tehty; jakaminen muille jäljellä |
| **Lähde** | Infinite 2026-09-13 |

## 🔴 RED

> *"toi kartta on ihan tissiposki.. pop up pop up tyylisesti (5th element) kun saat jotain
> niin kaiken pitää rähähtää.. tajuatko?"*
>
> *"eli se heksa grafiikka, jos sulla on temppeli, niin se näkyy.. saa olla isompi kun se
> alkuperäinen heksa.. tai jos siinä on joku kalastuskylä.. korvaa siis koko heksa
> näillä.. mä löysin jonkun secretin, mut haluan et se näkyy muillekin."*

Kolme erillistä asiaa, ja kaksi ensimmäistä ovat mitattavissa:

**1. Palkinto on pelin hiljaisin asia ja se laukeaa useimmin.** `pouch-gain.css` käytti
`--text-sm`:ää — **järjestelmän pienintä tyyppiä** — nousi 32 pikseliä ja haihtui. Kerää
viikon tuotanto ja ruutu kuiskaa. Sama komponentti palvelee valtausta, paljastusta kartalta,
paljastusta kirjanpidosta ja Collectia, eli *jokaista* kertaa kun jotain tulee.

**2. Maamerkki on täplä.** Rakennus piirtyy 10–19 px:n glyyfinä maastomerkin alle. Heksa on
kävelyzoomilla noin **80 pikseliä leveä**. Monumentti, majakka ja kalastuskylä lukevat
samankokoisina kuin maatila, eli eivät miltään.

**3. Löydöt eivät näy muille.** `world.json` ei kanna ihmeitä eikä salaisuuksia
(`BRDC-WONDER-001` jätti tämän auki, 35 % kesken). Löysit jotain eikä kukaan muu tiedä.

## 🟢 GREEN

- [x] **Palkinto räjähtää:** kuusikulmainen shokkiaalto keskeltä karttaa, kolme rengasta
      peräkkäin, ja jokainen resurssi omana isona sirunaan joka heitetään ulos porrastetusti
- [x] Numero on `--text-h2` eikä `--text-sm`. Sana on versaalina, harvennettuna
- [x] Väri on resurssin oma ja **ne kaikki olivat jo paletissa** (§13) — muutos on että
      niitä käytetään koossa eikä kymmenessä pikselissä. Aalto ottaa suurimman erän värin,
      joten räjähdys on *jostakin* eikä vain yleisesti värikäs
- [x] Istuu HUDin yläpuolella. Kolme kertaa tässä projektissa on peitetty jotain footerilla
- [x] `prefers-reduced-motion`: koko räjähdys tulee, se vain saapuu eikä lennä
- [x] **Maamerkkikerros:** monumentti, temppelilehto, majakka, linnoitus, kirjasto ja
      **kylä** korvaavat heksan — keskitettynä, ilman siirtymää, 54 px zoomilla 17 ja
      96 px zoomilla 19. Siis isompi kuin heksa, kuten pyydettiin
- [x] Viisi eikä viisitoista: jos kaikki on maamerkki, kartta on taas glyyfimuuri
- [x] Solu ei koskaan piirry kahdesti: `cellProperties` tyhjentää `building`in kun se
      asettaa `landmark`in
- [ ] **Löydöt `world.json`iin** — *"haluan et se näkyy muillekin"*. Tämä on
      `BRDC-WONDER-001`:n jäljellä oleva kolmannes ja se tehdään siellä

## Todennus

`territoryFeatures.test.ts`: kylä saa merkkinsä · monumentti nousee omaan kerrokseensa ·
tavallinen maatila jää entiselleen · paljas maa ei saa kumpaakaan. 1325 vitest,
mobile-360 `standards` 8/8 (kosketuskoot, CLS ja CWV kestävät uuden kerroksen).

Räjähdyksen mitat ovat **silmällä säädettäviä** ja tarkoituksella yhdessä paikassa
(`pouch-gain.css`, `text-size`-interpolaatio `TerritoryLayer`issa). Infinite näkee ne
kentällä ennen kuin niitä lukitaan.

## Ei tässä

- Koko pelin uudelleenvärjäys. *"5th element"* luettiin **rekisteriksi** — kerroksellinen,
  kirkas, iso — ei paletinvaihdoksi: §13 sanoo ettei uusia värejä keksitä, ja pyyntö
  koski sitä hetkeä kun saat jotain, ei pohjakarttaa.
