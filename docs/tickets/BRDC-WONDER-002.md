# BRDC-WONDER-002 — Härmälän yhdeksän ihmettä

| | |
|---|---|
| **Alue** | `rules/wonder.ts`, `rules/wonderPlace.ts`, siemen (`HexSeed.structure`), ihmeiden vaikutukset useaan sääntöön |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L |
| **Status** | `todo` — päätös D6 ensin |
| **Riippuvuudet** | `BRDC-SEED-003`, `BRDC-TERRAIN-005`, `BRDC-LANDMARK-001` |
| **Lähde** | `worldseed.ts` (`WONDERS`), `seed.harmala.json` (`wonders`), Worldseed §06 *The Nine Wonders* |

## 🔴 RED

**Nyt:** 12 lovecraftilaista ihmettä (`rules/wonder.ts`: R'lyeh, Hyperborea, Kadath, Leng,
Arkham, Innsmouth…), sijoitettu **provinssin hajautuksella** (`wonderPlace.ts`).

**Worldseed:** 9 paikallista ihmettä, joilla on **paikkapredikaatti** (`require` + painotettu
`prefer`); siementäjä pisteyttää heksat ja kiinnittää ihmeen parhaaseen. Jokaisella hinta ja
vaikutus — ja **jokainen vaikutus on uusi sääntö**:

| Ihme | Vaikutus joka on uutta mekaniikkaa |
|---|---|
| Sunken Bell | marsh- ja water-solut tuottavat tuplasti; välimuistit 1 km paljastuvat |
| Drowned Spire | +8 mana/h realmin laajuisesti; vesiheksat 2 km paljastuvat |
| Eye of Pyhäjärvi | 3 km pysyvä paljastus; kilpailijan piiritys ilmoitetaan · **avautuu tehtävän solmusta 5** |
| Great Sauna | **rappio tauolla 12 h jokaisen kävelyn jälkeen** |
| Ley Observatory | riitit −25 % manaa |
| Whispering Grove | metsäsolut eivät rapistu alle 200 |
| Iron Bell Foundry | **valtaukset +40 vahvuutta kilpailijoita vastaan** |
| The Boy Who Waits | maamerkin viereiset solut tuplaavat kulttuurin |
| Ten Thousand Steps | +3 kaikkea/h; kävely 1,5× tietoisuuteen |

**Ristiriidat dokumentissa:** luovutusosio sanoo *"exactly 8 wonders"*, `expectedCounts` ja
taulukko sanovat **9**. *Ten Thousand Steps* vaatii mäen, ja dokumentti itse: *"Härmälä is flat.
Confirm against a DEM or move this wonder out of the area."*

## 🟢 GREEN

- [ ] 9 ihmemäärittelyä; seedatulla alueella paikka siemenestä (`HexSeed.structure`)
- [ ] Ihmeen lunastus: maailmassa ainutkertainen, ensimmäinen hinnan maksava realmi
- [ ] **Jokainen vaikutus oma, testattu sääntönsä** — halvimmasta alkaen; piiritykseen tai rappioon
      vaikuttavat (Great Sauna, Iron Bell, Whispering Grove) **mitataan `sim/`issä** ennen käyttöönottoa
- [ ] Eye of Pyhäjärvi avautuu vasta tehtävän solmusta 5 (`BRDC-QUEST-006`)
- [ ] Ihme maamerkin päällä: halo (`BRDC-RES-002`)

## Päätös Infiniteltä

- **D6** (`BRDC-SEED-000`): korvaavatko 9 paikallista ihmettä nykyiset 12 seedatulla alueella,
  vai elävätkö rinnakkain?
- 8 vai 9
- *Ten Thousand Steps*: siirretään pois alueelta, vai hyväksytään mäki ilman korkeusmallia

## Ei tässä

- Ihmeiden kuvat — `BRDC-RES-002`
