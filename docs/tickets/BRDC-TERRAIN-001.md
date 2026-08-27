# BRDC-TERRAIN-001 — Maasto, resurssit ja alueen kehittäminen

| | |
|---|---|
| **Vaihe** | 2.5 — suunnanmuutos |
| **Effort** | L (2–3 päivää) |
| **Riippuvuudet** | BRDC-GROW-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | `files/pelin-suunnittelumuistiinpanot.md` · Infinite 2026-08-27 |

## 🔴 RED

Kaikki heksat ovat samanlaisia. Alueen omistaminen ei tuota mitään, eikä sillä voi tehdä
mitään — vain lukumäärä kasvaa.

## 🟢 GREEN

- [ ] Jokaisella solulla on **maastotyyppi**, deterministinen ja pysyvä
- [ ] Maasto klusteroituu alueiksi, ei satunnaiskohinaa solu solulta
- [ ] Maasto tuottaa **resurssin**: vesi, puu, kulta — kertapalkkio valtauksesta
- [ ] Omistetut solut tuottavat **hiljaista tuottoa** ajan myötä
- [ ] Resurssit näkyvät HUDissa
- [ ] Resursseilla voi **vahvistaa solua** ilman kävelyä — ensimmäinen käyttökohde
- [ ] Puhdas funktio, testattu

## Toteutus

**Datalähde on välivaihe ja se sanotaan ääneen.** Nyt maasto on deterministinen hash
H3-indeksistä, klusteroituna niin että se muodostaa metsiä ja järviä eikä kohinaa.
Se ei ole oikea maasto — se on oikean maaston paikka.

Myöhemmin: `map.queryRenderedFeatures` lukee jo ladatuista vektoritiilistä veden,
puiston ja rakennukset. Se on **oikeaa OSM-dataa ilman uutta rajapintaa tai avainta**,
koska tiilet ovat laitteella jo. Ratkaistaan solulle kerran ja tallennetaan.

Rajapinta `terrainOf(h3) → Terrain` pysyy samana; vain toteutus vaihtuu.

## Ei kuulu tähän tikettiin

SimCity-rakentaminen. Kolmiulotteinen näkymä. Muuri vs. örkit.
