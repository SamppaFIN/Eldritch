# BRDC-TERRAIN-001 — Maasto, resurssit ja alueen kehittäminen

| | |
|---|---|
| **Vaihe** | 2.5 — suunnanmuutos |
| **Effort** | L (2–3 päivää) |
| **Riippuvuudet** | BRDC-GROW-001 |
| **Status** | `done` |
| **Valmius** | 100 % |
| **Lähde** | `files/pelin-suunnittelumuistiinpanot.md` · Infinite 2026-08-27 |

## 🔴 RED

Kaikki heksat ovat samanlaisia. Alueen omistaminen ei tuota mitään, eikä sillä voi tehdä
mitään — vain lukumäärä kasvaa.

## 🟢 GREEN

- [x] Jokaisella solulla on **maastotyyppi**, deterministinen ja pysyvä
- [x] Maasto klusteroituu alueiksi, ei satunnaiskohinaa solu solulta — todennettu
      testillä joka mittaa naapurien yksimielisyyden (> 55 %, sattuma olisi ~25 %)
- [x] Maasto tuottaa **resurssin**: vesi, puu, kulta — kertapalkkio `CLAIM_YIELD = 10`
- [x] Omistetut solut tuottavat **hiljaista tuottoa**: `TRICKLE_PER_HOUR = 2` per
      tuottava solu, tilitys tasatunnein
- [x] Resurssit näkyvät HUDissa, ja kartalla omien solujen keskellä värinuppina
- [x] Resursseilla voi **vahvistaa solua** ilman kävelyä — `BRDC-WARD-001`
- [x] Puhdas funktio, testattu (17 yksikkötestiä + 7 repositoriotasolla)

Resurssien käyttö erkani omaksi tikettikseen ja on tehty: `BRDC-WARD-001`.

## Toteutus

**Datalähde on välivaihe ja se sanotaan ääneen.** Nyt maasto on deterministinen hash
H3-indeksistä, klusteroituna niin että se muodostaa metsiä ja järviä eikä kohinaa.
Se ei ole oikea maasto — se on oikean maaston paikka.

Myöhemmin: `map.queryRenderedFeatures` lukee jo ladatuista vektoritiilistä veden,
puiston ja rakennukset. Se on **oikeaa OSM-dataa ilman uutta rajapintaa tai avainta**,
koska tiilet ovat laitteella jo. Ratkaistaan solulle kerran ja tallennetaan.

Rajapinta `terrainOf(h3) → Terrain` pysyy samana; vain toteutus vaihtuu.

## Toteutuksen huomiot

**Kaksi arvontaa, ei yhtä.** Ensimmäinen (res 9 -esivanhempi) päättää mistä koko seutu
on tehty, toinen (solu itse) kysyy onko *tämä* solu oikeasti sitä. Pelkkä ensimmäinen
antaisi kuusikulmioista rakennettuja blokkeja; pelkkä toinen antaisi kohinaa.

**Bugi joka löytyi testillä:** ensimmäinen `settleResources` hyvitti koko kuluneen ajan
mutta siirsi kelloa vain tasatunnein — jokainen tilittämätön minuutti maksettiin
uudestaan seuraavalla lukemalla. HUD joka lukee pussin joka renderöinnillä olisi
painanut rahaa. Nyt maksetaan tasatunnit ja kello siirtyy täsmälleen niillä.

**`MockRepository` ylitti 400 riviä** tämän myötä. Sääntö on jakaa, ei nostaa rajaa:
resurssikirjanpito on nyt `data/pouch.ts`.

## Ei kuulu tähän tikettiin

SimCity-rakentaminen. Kolmiulotteinen näkymä. Muuri vs. örkit.

## Jatko — 2026-08-31

Infiniten kehityssuunnitelma purkaa tämän tiketin molemmat rajaukset kerralla:

- *"Ei kuulu tähän tikettiin: SimCity-rakentaminen"* → `BRDC-BUILD-001`, `-002`, `-003`
- Maasto neljästä yhdeksään tyyppiin, ja **hash korvataan vektoritiilillä** — se on
  tämän tiketin oma lupaus (*"the shape real terrain will fill"*) → `BRDC-TERRAIN-002`
- Kolme resurssia kymmeneksi → `BRDC-ECON-001`

`terrainOf(h3) → Terrain` -rajapinta pysyy. Se oli tämän tiketin tärkein päätös ja se
kestää: vain toteutus vaihtuu, eikä pelisääntö muutu sen mukana.
