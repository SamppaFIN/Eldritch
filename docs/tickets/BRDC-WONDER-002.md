# BRDC-WONDER-002 — Härmälän yhdeksän ihmettä, lovecraftilaisin nimin

| | |
|---|---|
| **Alue** | `rules/wonder.ts`, `rules/wonderPlace.ts`, siemen (`HexSeed.structure`), ihmeiden vaikutukset useaan sääntöön |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L |
| **Status** | `todo` — päätökset tehty (`BRDC-SEED-000` D4–D6, D9), toteutus alkaa |
| **Riippuvuudet** | `BRDC-SEED-003`, `BRDC-TERRAIN-005`, `BRDC-LANDMARK-001` |
| **Lähde** | `worldseed.ts` (`WONDERS`), `seed.harmala.json` (`wonders`), Worldseed §06 *The Nine Wonders* |

## 🔴 RED

**Nyt:** 12 lovecraftilaista ihmettä (`rules/wonder.ts`: R'lyeh, Hyperborea, Kadath, Leng,
Arkham, Innsmouth…), sijoitettu **provinssin hajautuksella** (`wonderPlace.ts`).

**Worldseed:** 9 paikallista ihmettä, joilla on **paikkapredikaatti** (`require` + painotettu
`prefer`); siementäjä pisteyttää heksat ja kiinnittää ihmeen parhaaseen — mutta niiden nimet
(Sunken Bell, Great Sauna…) ovat mundaaneja, eivätkä sovi pelin muuten läpikotaisin
lovecraftilaiseen sanastoon (§12).

**Päätös (`BRDC-SEED-000` D4, D5): korvaavat, 9 kappaletta, lovecraftilaiset nimet.**
9 paikallista ihmettä korvaavat 12:n hajautetun listan kokonaan seedatulla alueella, ja jokainen
saa mytoksesta ammentavan nimen paikallisen ankkurinsa päälle — sama tyyli kuin nykyisessä
listassa (yksi evokatiivinen erisnimi, ei kuvaileva lause):

| Paikallinen (Worldseed) | **Uusi nimi** | Vaikutus (uutta mekaniikkaa) |
|---|---|---|
| Sunken Bell | **Y'ha-nthlei's Bell** | marsh- ja water-solut tuottavat tuplasti; välimuistit 1 km paljastuvat |
| Drowned Spire | **The Dagon Spire** | +8 mana/h realmin laajuisesti; vesiheksat 2 km paljastuvat |
| Eye of Pyhäjärvi | **The Drowned Eye** | 3 km pysyvä paljastus; kilpailijan piiritys ilmoitetaan · **avautuu tehtävän solmusta 5** |
| Great Sauna | **The Ancient Löyly** | **rappio tauolla 12 h jokaisen kävelyn jälkeen** |
| Ley Observatory | **The Yuggoth Lens** | riitit −25 % manaa |
| Whispering Grove | **The Dunwich Grove** | metsäsolut eivät rapistu alle 200 |
| Iron Bell Foundry | **The Carcosa Foundry** | **valtaukset +40 vahvuutta kilpailijoita vastaan** |
| The Boy Who Waits | **He Who Waits at the Shore** | maamerkin viereiset solut tuplaavat kulttuurin |
| Ten Thousand Steps | **The Thousand Masks Road** | +3 kaikkea/h; kävely 1,5× tietoisuuteen |

**Ristiriita ratkaistu:** dokumentin luovutusosion "exactly 8 wonders" on kirjoitusvirhe;
taulukko ja `expectedCounts` sanovat 9, ja 9 on vahvistettu.

**Ten Thousand Steps / The Thousand Masks Road (D6, D9):** ei siirretä pois, ei DEM:iä.
Vaatimus on "hill", ja seedatulla alueella hill tulee `BRDC-TERRAIN-005`:n nimetyistä
mäkivyöhykkeistä (leirintäalue, Härmälänranta) — Infiniten paikallistuntemus korvaa mittauksen.
Jos yksikään ehdokashekso ei osu nimettyyn mäkivyöhykkeeseen, ihde jää sijoittamatta sillä
ajolla eikä pakoteta väärälle maastolle.

## 🟢 GREEN

- [ ] 9 ihmemäärittelyä yllä olevilla nimillä; seedatulla alueella paikka siemenestä
      (`HexSeed.structure`), joka korvaa `wonderPlace.ts`in hajautuksen **vain seedatulla alueella**
      — muualla 12 vanhaa pysyvät (ei `BRDC-SEED-000`-riippuvuutta, koska aluetta ei ole seedattu)
- [ ] **Sijoitus `harmalaHint`istä, ei pisteytyksestä** (päätös `BRDC-SEED-003`:ssa, joka
      alun perin varasi tämän itselleen): `prefer`-pisteytys tarvitsisi survey-signaaleja
      (`elevation`, `adjacentWater`, `leyCrossings`, `shorelineLength`…) joita
      `zoneOverrides`-datasta ei saa — ne tulisivat vasta täydestä OSM-surveystä. Sijoitus on
      siis `harmalaHint`-koordinaatti käännettynä (`BRDC-SEED-001`) lähimmälle H3-solulle,
      **`require`-maastovaatimus kovana esteenä**: jos hint-solun maasto ei täsmää, ihde jää
      sijoittamatta sillä ajolla eikä pakoteta väärälle maastolle
- [ ] Ihmeen lunastus: maailmassa ainutkertainen, ensimmäinen hinnan maksava realmi
- [ ] **Jokainen vaikutus oma, testattu sääntönsä** — halvimmasta alkaen; piiritykseen tai rappioon
      vaikuttavat (The Ancient Löyly, The Carcosa Foundry, The Dunwich Grove) **mitataan `sim/`issä**
      ennen käyttöönottoa
- [ ] The Drowned Eye avautuu vasta tehtävän solmusta 5 (`BRDC-QUEST-006`)
- [ ] Ihme maamerkin päällä: halo (`BRDC-RES-002`)
- [ ] Lore-teksti jokaiselle: yksi kappale, sitoo mytoksen nimen paikalliseen ankkuriin
      (esim. *The Ancient Löyly*: sauna joka ei koskaan jäähdy, koska jokin allapäin pitää sen kuumana)

## Ei tässä

- Ihmeiden kuvat — `BRDC-RES-002`
- Mäkivyöhykkeiden koordinaatit — `BRDC-SEED-003`:n syöte
