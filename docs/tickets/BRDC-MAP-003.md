# BRDC-MAP-003 — Sumu peittää myös maaston

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | S (puoli päivää) |
| **Riippuvuudet** | BRDC-MAP-002, BRDC-REVEAL-001 |
| **Status** | `done` — 2026-09-02 (v0.5.7), kaksi kohtaa `[~]` jatkoon |
| **Valmius** | 80 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä, kahdesti: *"Fog of war antaa sinun silti nähdä mikä piilossa olevan heksan
tyyppi on.. näytä silloin ohje ?, not explored tms."* ja *"fog of war on klikattavissa,
tutkimattoman alueen ei kuulu näyttää tietoja"*.

Sumu piilottaa omistajuuden mutta ei maastoa: paljastamattoman heksan ikoni kertoo yhä
onko se metsää, vettä vai vuorta, ja sen napautus avaa täyden `CellPanel`in
maastoineen, tuotto­lukuineen ja area-tietoineen. Pelaaja näkee kartalta mitä kannattaa
vallata kävelemättä sinne — ja koko sumun tarkoitus on juuri se, että sinne pitää kävellä.

Se on myös epärehellistä toiseen suuntaan: peli näyttää tietoa jota se väittää
piilottavansa.

## Havainto koodista

`withFogOfWar` piirtää vain omat solut + niiden yhden renkaan naapurit. Kävelemällä
mutta valtaamatta jäänyt solu ei tallennu (`recordWalk` kirjoittaa vain kasvavat/dwell-
solut), joten **kartan `REVEAL_FILL`-tason solut ovat rakenteellisesti juuri ne
"nähty koska vieressä, ei kävelty"**. `explored` voidaan siis nyt johtaa: `mine || here`
— ei uutta `Cell`-kenttää eikä migraatiota. Kunnollinen käveltypohjainen `explored`
(jälki­pisteet per solu, pysyvä) on `BRDC-BUILD-006`:n vartiotornin ja mahdollisen
oman tikettinsä asia.

## 🟢 GREEN

- [x] **Paljastamaton heksa ei kerro maastoaan kartalla.** `cellProperties`: maastoglyfi
      vain omille soluille; rivaalin solu ei näytä glyfiä (puna + vahvuus kantavat intel-
      tiedon); pelkkä reveal-solu näyttää dimin `?`. — v0.5.7
- [x] **Napautus kertoo että se on tuntematon**, ei näytä paneelia tiedoilla: uusi
      `UnexploredNote` — *"Not explored — walk here to see what it holds."* + sulkunappi.
      `MapView` valitsee sen `CellPanel`in tilalle kun valittu solu ei ole `explored`.
- [~] Rivaalin rajasolun `CellPanel` näyttää yhä maaston — se on `explored`-mielessä
      "tiedät kenen se on". Maaston piilotus siitäkin on erillinen harkinta; RED:in
      painopiste oli pelkän sumun solut.
- [~] Kerran kävelty, valtaamaton solu **pysyvästi** paljastettuna — tarvitsee jälki­-
      pohjaisen `explored`in (per-solu-leima). Nyt `here` kattaa "seison siinä nyt";
      pysyvyys jää jatkoon.
      **Infiniten tarkennus 2026-09-02:** *"? heksojen sisältä tiedetään, mutta
      tutkimattomien ei"* — pelaaja tietää mitä kävelemässään `?`-solussa on, ja peli
      sanoo silti "Not explored". Seuraava askel: `exploredH3 = Set(trail.points ⇒ cellAt)`
      MapView:ssä → `hasDetail` ja `cellProperties`n `?`/maastoglyfi lukevat sitä;
      `withFogOfWar` pitää käveltyä solua näkyvissä vaikka siitä kävelisi pois.
- [x] Puhdas `explored(cell, me, standingOn)` `territoryFeatures.ts`:ssä, testattu:
      oma solu · rivaali · pelkkä reveal · seisottu.
- [ ] Todennus kentällä: uusi peli, katso karttaa — mikään rengas ei paljasta maastoa
      ennen kävelyä; napauta rengasta → "Not explored".

## Ei tässä

- Paljastuskortti ja harvinaisuus (`BRDC-REVEAL-001`) — tämä tiketti vain lopettaa vuodon.
- Vartiotornin paljastus (`BRDC-BUILD-006`) rakentuu tämän päälle, ei tässä.
