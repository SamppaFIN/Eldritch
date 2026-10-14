# BRDC-WORLD-001 — Maailma kirjoitetaan, ei arvota

| | |
|---|---|
| **Alue** | `data/seed`, `rules/terrain.ts`, `rules/cityState.ts`, `rules/wonder.ts`, editori |
| **Effort** | L |
| **Status** | `todo` — aineisto saapui 2026-10-14; kohdistus tarkistettava ennen koodia |
| **Lähde** | Infinite 2026-09-15: *"voisin myös antaa uuden kartan ja suunnitella maaston sen mukaan mitä siellä oikeasti on.. eli esigeneroidaan heksojen tiedot ja resurssit.. haluan myös että saan asetella maailman ihmeet ja resurssit ja kaupunkivaltion kartalle.. haluan, että voin antaa kaupunkivaltiolle myös rakennuksia esim temppelin ja fortifikaatioita."* |

## 🔴 RED

Maailma on tällä hetkellä **johdettu**: maasto kartan vektorilaatoista tai determinististä
hajautuksesta (`terrainOf`), bonusresurssit hajautuksesta (`bountyOn`), wonderit
provinssin hajautuksesta, kaupunkivaltiot siemenestä. Se oli oikea valinta tyhjästä
aloittaessa — peli toimii missä tahansa maailmassa ilman että kukaan kirjoittaa mitään.

Mutta se tarkoittaa myös ettei kukaan **voi** kirjoittaa mitään.

## Mitä tämä koskee, ja miksi se ei ole pieni

1. **Esigeneroitu heksadata — millä avaimella?** h3 res-11 on tarkka mutta sitoo yhteen
   paikkaan; koko Suomi on 157 M solua (`BRDC-ATLAS-001`). Kirjoitettu maailma on siis
   *alue*, ei planeetta — ja pelin lupaus tähän asti on ollut että se toimii missä
   tahansa. **Kumpi voittaa?**
2. **Mistä se luetaan?** Tiedosto repossa (kuten `supabase/seed/`) vai Workerin
   `world.json`in sisar? Ensimmäinen on versioitu ja tarkistettavissa, jälkimmäinen
   päivittyy ilman julkaisua.
3. **Mikä voittaa ristiriidassa?** `terrainOf`illa on jo ketju: käsinmaalattu → siemen →
   laatat → hajautus. Kirjoitettu data menee kärkeen, mutta se pitää sanoa ääneen.
4. **Editori on jo olemassa** (`BRDC-MAP-EDIT-001`, dev-only). Onko tämä sen laajennus
   vai erillinen työkalu?
5. **Kaupunkivaltion rakennukset** ovat uutta dataa `CityState`iin ja ne vaikuttavat
   piiritykseen — eli tämä ei ole pelkkä sisältö vaan sääntö. Ks. `BRDC-BUILD-012`.

## Ei tässä

Koodia ennen kuin 1 ja 3 on vastattu. Ne ratkaisevat mitä rakennetaan.

## Päätös 2026-10-13 (kysely)

Infinite: *"Mä teen claude designilla tavan millä härmälän kartta tehdään fixed positioina.. jos lähtöpiste on yli 5 km lentäjäpatsaasta, arvotaan pelaajalle random maasto."*

- Härmälä kirjoitetaan **kiinteinä paikkoina** Claude Designilla tehtynä aineistona — se voittaa kaiken muun ketjussa (`terrainOf`).
- **Yli 5 km lentäjäpatsaasta** (Statue of the Boy) aloittava pelaaja saa arvotun maaston, kuten nyt.
- Toteutus alkaa, kun aineisto ja sen muoto ovat olemassa.

## Aineisto 2026-10-14

Infinite lisäsi Claude Designissa tehdyn kartan kansioon `Eldritch-pelin uusi design systeemi/`:
`harmala-hex-terrain.json` (varsinainen data), `harmala-data.js` (sen lähde),
`Harmalanranta Pelikartta.dc.html` (katselusivu), `harmala-sat.png`, `support.js`.

- **1 917 heksaa**, kukin `lat/lng` + maasto (9 pelin maastolajia `terrain.ts`:stä):
  asutus 538 · metsä 511 · järvi 423 · ranta 139 · kukkula 108 · tasanko 87 · kauppa 80 · suo 31.
  Lähde: satelliittikuvan koneellinen luokittelu (1 681) + käsin rajatut vyöhykkeet (236:
  kukkulat, suot, kauppapaikat).
- **Ruudukko ei ole H3**: kuvaan sidottu pointy-top-ruudukko kahdessa koossa (karkea ≈ 115 m,
  tarkka ≈ 46 m). Peli muuntaa jokaisen pisteen `cellAt`-kutsulla.
- **Alue** 61.4624–61.4873 N, 23.6780–23.7715 E (≈ 2,8 × 5 km, Pere–Härmälä–Hatanpää).
- **30 POI:ta** luottamustasoineen (*pelin oma* / *kuvasta* / *tarkista*): patsas, piiput,
  venelaituri, kylät (Pere, Loukonlahti, Partola, Härmälä, Rantaperkiö, Pakkalankulma, Killo),
  kauppa-alueet, metsät, saari, suot.

## 🔴 Kohdistus — ratkaistava ennen koodia

Aineiston koordinaatit on *arvioitu* kuvan ankkureista. Ainoa todellinen vertailukohta on
patsas, jonka Infinite valitsi kartalta (`HARMALA_STATUE` 61.472913, 23.725988): aineistossa
se on **≈ 111 m sivussa** (59 m etelään, 94 m länteen). Se on yli kaksi heksaa — järvi
osuisi rannalle. Yhdellä pisteellä voi korjata vain siirron, ei mittakaavaa.

## Suunnitelma (kun kohdistus on varmistettu)

1. **Muunnos skriptillä** (`scripts/gen-harmala.mjs`): jokaiselle alueen H3 res-11 -solulle
   lähimmän aineistoheksan maasto (tarkka voittaa karkean), kohdistuskorjaus mukaan →
   tiivis taulukko `packages/core/src/rules/harmalaTerrain.json`. Testi: patsaan, rannan ja
   järven solut saavat oikean maaston.
2. **Ketjun kärkeen**: `terrainForCell` lukee Härmälän aineiston ensin (editorin käsin
   maalaama voittaa yhä), ennen Worldseediä ja vanhaa kartoitusta (TERRAIN-003).
3. **5 km:n raja**: yli 5 km lentäjäpatsaasta aloittava saa arvotun maaston kuten nyt.
4. **POI:t erikseen**: aineiston kylät ovat ehdokkaita uusiksi kaupunkivaltioiksi
   (BRDC-CITY-001) — se on oma päätöksensä, ei osa maastoa.
