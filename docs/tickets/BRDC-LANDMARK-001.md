# BRDC-LANDMARK-001 — Maamerkki: kartta kertoo mitä tässä oikeasti on

| | |
|---|---|
| **Alue** | siemen (`HexSeed.landmark`), `territoryMarks.ts`, `CellPanel` (HERE), tuotto |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `todo` |
| **Riippuvuudet** | `BRDC-SEED-002` (POI:t), `BRDC-SEED-001` (kohdistus) |
| **Lähde** | `worldseed.ts` (`STRUCTURES.landmark`), `seed.harmala.json` (`landmarks`), Worldseed §05 *Two new structures* |

## 🔴 RED

*"Statue of the Boy"* on pelissä vain seikkailun paikan nimi — maamerkkijärjestelmää ei ole.

Worldseed: **Landmark** ei ole rakennettu vaan **paljastuu OpenStreetMapista** (`tourism=*`,
`historic=*`, `artwork_type=*`, `memorial`, `place_of_worship`) oikealla nimellään ja
tarinakortilla. +2 culture, mikä tahansa maasto, voi olla samalla heksalla rakennuksen kanssa.
*"This is where the world stops being generated and starts being Tampere."*

Siemenessä on 6 kirjoitettua maamerkkiä omalla tarinallaan. **Niiden koordinaatit on
projisoitu referenssikuvasta**: dokumentin *Statue of the Boy* `[61.4693, 23.7287]` on noin
400 m etelään ja 150 m itään pelin vahvistetusta patsaasta (`HARMALA_STATUE`,
`61.472913, 23.725988` — Infiniten pitkä painallus). Infinite: *"aiemmat lokaatio tiedot on oikein"*.

## 🟢 GREEN

- [ ] `HexSeed.landmark { name, osmId, lore, kind }` surveyn POI:ista + kirjoitetuista
      (kirjoitettu tarina voittaa generoidun)
- [ ] **Statue of the Boy vahvistetussa paikassa**, ei dokumentin koordinaatissa
- [ ] Muiden viiden sijainti OSM-nimellä haettuna (`BRDC-SEED-001`), ei kuvasta projisoituna
- [ ] Kartalla oma merkki kulttuurin värissä; halo kun ihme on samalla heksalla
- [ ] HERE-kortti näyttää oikean nimen ja tarinan ensimmäisenä (`BRDC-CARD-001`)
- [ ] +2 culture/h hallitulla maamerkkiheksalla
- [ ] Rakennuksen ja maamerkin yhteiselo samalla heksalla ei riko keskustan slottia

## Ei tässä

- *The Boy Who Waits* -ihme — `BRDC-WONDER-002`
