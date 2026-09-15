# BRDC-WORLD-001 — Maailma kirjoitetaan, ei arvota

| | |
|---|---|
| **Alue** | `data/seed`, `rules/terrain.ts`, `rules/cityState.ts`, `rules/wonder.ts`, editori |
| **Effort** | L |
| **Status** | `todo` — **suunniteltava ennen koodia** |
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
