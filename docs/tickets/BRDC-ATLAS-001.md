# BRDC-ATLAS-001 — Koko Suomi: kaupungit, rajat ja laajeneminen yhdellä ruudulla

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L (2–3 päivää) |
| **Riippuvuudet** | BRDC-SHARE-001, BRDC-CASTLE-001, BRDC-CLAIM-006 |
| **Status** | `done` — kaikki GREEN-kohdat todennettu; keskimmäinen kaupunkitaso (res 8)
  rajattu tietoisesti pois, ks. "Amended 2026-09-23" GREENin alla. 2026-09-23 (v0.6.53) |
| **Valmius** | 100 % siitä mitä tiketti lopulta pyytää — ks. "Tilanne 2026-09-23" alla |
| **Lähde** | Infinite 2026-08-31: *"tarkoitus on että lopulta näemme koko Suomen eri kaupungit ja niiden laajenemisen.. tavallaan niin kuin pelaisit Civilization vitosta kavereiden kanssa"* |

## 🔴 RED

Kartta on aina yhdessä mittakaavassa: res 11 -heksat sen ympärillä, missä seisot. Se on
oikea näkymä kävelijälle ja **väärä näkymä sille, mitä tästä on tulossa**.

Civilizationissa on kaksi näkymää: maailmankartta, jolla näet valtakuntien rajat, ja
kaupunkinäkymä, jolla näet ruudut. Tässä pelissä on vain jälkimmäinen. Kysymykseen
*"mitä Suomessa tapahtuu"* ei ole mitään tapaa vastata.

Ja res 11 ei voi vastata siihen. **Suomi on 157 miljoonaa res 11 -solua** (mitattu:
`getHexagonAreaAvg(11) = 2 150 m²`, Suomi 338 455 km²; Suomen leveysasteella soluja on
lähemmäs 200 miljoonaa, koska ne ovat siellä pienempiä — Tampereella 1 622 m²).

## 🟢 GREEN

- [x] **Kolme mittakaavaa** — piirretty kahdella tasolla, ei kolmella. **Amended
      2026-09-23:** suunniteltu erillinen kaupunkitaso (res 8) rajattiin pois tietoisesti.
      Tap-to-fly laskeutuu zoomiin `NATION_FLY_ZOOM = 12`, joka on jo lähizoomin
      `cells-fill`in oman `minzoom`in (9) sisällä — sama res-11-taso joka piirtää omat
      solut piirtää myös "kaupunkinäkymän", koska `useWorld`in näkymäpohjainen
      shard-haku tuo minkä tahansa julkaistun alueen näkyviin heti kun kamera on siellä.
      Erillinen res-8-aggregaatti ratkaisisi ongelman ("satoja pieniä heksoja tiheällä
      alueella") jota tämän pelin nykyisellä pelaajamäärällä ei ole vielä mitattu olevan
      olemassa — spekulatiivinen kerros, jonka rakentaminen etukäteen olisi täsmälleen
      se "abstraktio jota kukaan ei pyytänyt" jota CLAUDE.md §4.2 kieltää. Jos ruuhka
      oikeasti ilmenee, resoluutio on jo mitattu tässä tiketissä (Toteutus-taulukko) ja
      lisääminen on yhden tason verran työtä, ei arkkitehtuurimuutos
- [x] Kansallinen näkymä piirtää **kaupungit ja niiden rajat**, ei soluja —
      `nationLayer.ts`, väri sama kahden sävyn laki kuin lähizoomissa (§13: oma
      `--cosmic-purple`, kaikki muut yksi kiinteä `--danger`, ei sävyä per kansa).
      Todennettu: `nationLayer.test.ts` (6 testiä, puhdas GeoJSON-rakennus) +
      `atlas.spec.ts` (Playwright, 360 px, kaksi mockattua kuntaa piirtyy oikein)
- [x] Laajeneminen näkyy **ajassa**: sama kaupunki viikko sitten ja nyt. Worker ottaa
      yhden `atlas`-tilannekuvan viikossa (`history.ts`, `atlasWeekKey`/`atlasDiff`
      `@es3/core/data`issa, 7 testiä), 12 viikkoa säilössä. `AtlasCompareControl`
      ("Now"/"Then") näyttää vanhimman säilytetyn tilannekuvan sen sijaan kartalla.
      Todennettu käsin `wrangler dev`illä (kaksi julkaisua, sama viikkoavain molemmilla,
      tilannekuva pysyi ensimmäisenä) ja `atlas.spec.ts`illa (kytkin vaihtaa piirretyn
      datan ja takaisin)
- [x] Siirtymä mittakaavojen välillä on **jatkuva**, ei kahden erillisen näytön vaihto —
      `fadeAcrossBand` (`layerIds.ts`) liu'uttaa kansallisen ja lähizoomin läpinäkyvyyttä
      vastakkaisiin suuntiin `NATION_FADE_START..NATION_FADE_END`-kaistalla (zoomit 9–11).
      Todennettu: `atlas.spec.ts`in oma testi zoomissa 10 — molemmat tasot piirtävät
      samaan aikaan, mikä vanhalla kovalla `minzoom`/`maxzoom`-rajalla ei ollut mahdollista
- [x] Kansallinen näkymä latautuu **yhdestä pienestä tiedostosta** eikä vaadi koko
      maailmaa — `GET /atlas`, sama kylmäkäynnistys-pelastus kuin `/demographics`illa
- [x] Piirtomäärä mitattu **kansallisella tasolla**: `atlas.spec.ts` todentaa
      `queryRenderedFeatures`illa täsmälleen syötettyjen kuntien määrän, ei enempää.
      Kaupunkitason oma piirtomäärä ei enää ole erillinen kysymys, ks. "Kolme
      mittakaavaa" yllä — se on `cells-fill`in oma, jo mitattu (BRDC-SCALE-001)
- [x] Toimii 360 px:llä — `atlas.spec.ts` ajetaan `mobile-360`-projektilla
      (360×780), kaikki kuusi testiä vihreää

## Toteutus — mitattu resoluutiotaulukko

`h3-js` 4.5.0, ajettu tässä repossa 2026-08-31:

| Res | Solun ala | Soluja Suomen yli | Mitä se on | Käyttö |
|---:|---:|---:|---|---|
| 4 | 1 770 km² | 191 | maakunta | liian karkea |
| **5** | **253 km²** | **1 338** | kunta | **kansallinen näkymä** |
| **6** | **36 km²** | **9 368** | kaupunginosa | **`world.json`:n sharding-avain** |
| 7 | 5,2 km² | 65 576 | kortteliryhmä | välitaso |
| **8** | **0,74 km²** | **459 029** | kortteli | **julkinen tarkkuus** (`BRDC-CASTLE-001`) |
| 9 | 0,11 km² | 3,2 M | maaston klusteri | `terrainOf` käyttää tätä jo |
| 11 | 2 150 m² | 157 M | omistus | oma lääni, lähizoomi |

**Res 6 on jo `constants.ts`:ssä** nimellä `H3_RES_REGION`, kommentoituna *"realtime
channel shard"*. Se osoittautuu oikeaksi luvuksi myös ilman realtimea: 9 368 mahdollista
lohkoa koko Suomen yli, joista **vain asutut ovat olemassa**. Sadalla pelaajalla
epätyhjiä on kymmeniä, ei tuhansia.

Kolme mittakaavaa:

| Zoom | Piirretään | Mistä |
|---|---|---|
| Koko maa | linnat + kaupunkien rajat res 5:llä | `atlas.json`, yksi pieni tiedosto |
| Kaupunki | alueet res 8:lla | `world/<res6>.json`, vain näkyvät lohkot |
| Lähellä | omat solut res 11:llä | IndexedDB, oma data |

## Miksi yksi `world.json` ei riitä, mitattuna

`Cell` nykymuodossaan on **145 tavua JSONina** (mitattu `JSON.stringify`illä oikealla
solulla). Taulukkomuotoisena karsittuna 39 tavua.

| Pelaajia | Soluja (2 000 / pelaaja) | Yksi `world.json` |
|---:|---:|---:|
| 10 | 20 000 | 0,8 MB |
| 100 | 200 000 | 7,8 MB |
| 1 000 | 2 000 000 | 78 MB |
| 10 000 | 20 000 000 | 780 MB |

**Sadan pelaajan kohdalla yksi tiedosto lakkaa olemasta ladattavissa puhelimella.**
Se ei ole kaukainen ongelma: se on toinen kaupunki. Siksi `BRDC-SHARE-001` shardataan
res 6:lla samalla kun se rakennetaan, ei sen jälkeen — jälkikäteen se on migraatio,
etukäteen se on hakemistorakenne.

`atlas.json` on eri asia: se on **aggregaatti**, ei solulista. 1 338 res 5 -solua,
joissa kussakin omistajajakauma. Muutama kymmenen kilotavua koko maasta, riippumatta
pelaajamäärästä.

## Tilanne 2026-09-23

Tiketti kirjoitettiin 2026-08-31, ennen Workeria (`BRDC-SHARE-003`) ja ennen kuin Keep
muuttui oikeaksi Hearth-soluksi (`BRDC-CASTLE-001`in kumous). "Ei tässä" -kohta alla
*"vieraiden pelaajien solutason data on tarkoituksella karkea"* ei enää pidä
paikkaansa — se on jo julkista. Infinite valitsi 2026-09-22 koko alkuperäisen
suunnitelman kerralla (data-driven liput + tap-to-fly + historia). Kaikki palat valmiit
2026-09-23 (v0.6.53):

- [x] **`BRDC-HEX-003`** (oma tikettinsä, `done`, v0.6.49) — `cells-flag` data-driven,
      esiehto sille että toisen kansan Keep voi ylipäätään näyttää mitään kartalla
- [x] **Datakerros** (tässä, v0.6.50): `H3_RES_NATION = 5`, `nationRegionOf()`,
      `packages/core/src/data/worldStats.ts`in `atlasOf()` (puhdas, 6 testiä), Worker
      `GET /atlas` (`rebuild()`in yhteydessä kirjoitettu, sama kylmäkäynnistys-pelastus
      kuin `/demographics`/`clan-codex`illa). Todennettu käsin `wrangler dev`illä:
      kaksi pelaajaa eri kunnissa, oikea hallitseva pelaaja per alue, oikea pinta-ala
- [x] **Kartan piirto** (v0.6.51, jatkuva zoomi v0.6.53): `nationLayer.ts` piirtää
      res-5-tason (`nation-fill`/`nation-line`), `useNationLayer.ts` hakee `/atlas`in ja
      syöttää sen sisään, `TerritoryLayer.ts`in lähizoomin tasot saivat
      `minzoom: NATION_FADE_START` niin että kansallinen ja lähizoomi liu'uttavat
      läpinäkyvyyttä vastakkain samalla kaistalla eivätkä vaihdu kovalla rajalla
- [x] **Kamera-lento naapurikansaan** (v0.6.52): napautus `nation-fill`-tasolla lentää
      kameran sinne, zoomiin `NATION_FLY_ZOOM = 12` — rajan yli, jolloin tavalliset
      solutasot ottavat piirron ja `useWorld`in näkymäpohjainen shard-haku tuo oikeat
      solut, jos jokin on julkaissut niitä sinne. Ei oma `MapHandle`-metodi lopulta —
      itsenäinen kuuntelija `MapCanvas`issa riitti, koska mikään ei tarvinnut sen
      käynnistämistä ulkopuolelta. Ei myöskään "linnalle" täsmälleen, koska
      `AtlasRegion`illa ei ole hallitsijan Keep-koordinaattia — kunnan oma keskipiste
      kelpaa yhtä hyvin paikaksi jota napauttaa
- [x] `useCameraFollow`iin uusi `unfollow()` — pudottaa seurannan liikuttamatta kameraa,
      jotta seuraava GPS-fiksi ei repisi kameraa takaisin kotiin kesken lennon
- [x] `packages/core/src/geo/cells.ts`iin `nationRegionAt(position)`, `regionAt`in
      sisarfunktio res-5:lle, 2 testiä
- [x] **Jatkuva zoomi** (v0.6.53): `fadeAcrossBand` — ei cron-triggeriä eikä uutta
      infraa, pelkkä MapLibre-ilmaisu joka ratkeaa jokaisella renderöinnillä
- [x] **Laajeneminen ajassa** (v0.6.53): `atlasWeekKey`/`atlasDiff`
      (`packages/core/src/data/worldStats.ts`, 7 testiä), Worker `history.ts`
      (`maybeSnapshot`/`listSnapshotWeeks`/`readSnapshot`, 12 viikkoa säilössä, ei
      cron-triggeriä — kirjoittaa `rebuild()`in yhteydessä samalla tavalla kuin
      `atlas`/`codex`/`clan-codex` jo tekevät), reitit `GET /atlas/history` ja
      `GET /atlas/history/<week>`. Client: `useNationLayer.ts` laajeni kolmella
      palautusarvolla (`visible`, `compareAvailable`, `comparing`/`toggleCompare`),
      uusi `AtlasCompareControl.tsx` (sama malli kuin `CameraControl.tsx`, pinottu sen
      päälle). Todennettu käsin oikeaa Workeria vasten (ks. sivulöydös alla) ja kahdella
      uudella `atlas.spec.ts`-testillä

**Sivulöydös — korjattu omana tikettinään, `BRDC-SHARE-004` (`done`, v0.6.50).**
`atlasOf`/`regionOf` kaatuivat `h3-js`in virheeseen jos joku lähetetty solu ei
koodannut kelvollista res-11-h3-indeksiä — yksi paha solu kaatoi koko `rebuild()`in,
kaikilta, joka pyynnöllä. Kaksikerroksinen korjaus: `parseSubmission` hylkää
virheellisen solun/linnan nimetyllä syyllä ennen tallennusta, ja Worker suodattaa
mahdollisen jo-KV:ssä-olevan pahan rivin pois jokaisella luvulla. Molemmat todennettu
käsin oikeaa Workeria vasten.

**Toinen sivulöydös, 2026-09-23 — MapLibre ei säilytä merkkijono-`id`:tä ehjänä.**
Kamera-lentoa rakentaessa `e.features[0].id` osoittautui typistetyksi: h3-indeksi
`'851126d3fffffff'` tuli takaisin numerona `851126` — ensimmäinen numeroketju ennen
ensimmäistä heksakirjainta, sekä `queryRenderedFeatures`ista että
`querySourceFeatures`ista, GeoJSON-lähteen omasta `id`-kentästä riippumatta. Sama koskee
jo olemassa olevaa `cells-fill`ia (todennettu käsin: pelaajan oma kotisolu palautti
`id: 8`) — koodi ei vain koskaan huomannut, koska `hits(e, [CELL_FILL_LAYER])[0]?.id`in
`typeof id === 'string'` -tarkistus epäonnistuu hiljaa jokaisella oikealla napautuksella
ja koodi putoaa `cellAt(e.lngLat)`iin, joka on aina oikein riippumatta `id`:stä. Ei siis
tuotantobugi tähän asti — mutta jokainen jatkossa kirjoitettava tasoklikkaus tarvitsee
saman kaavan: laske kohde napautuksen **koordinaateista** (`nationRegionAt`, `cellAt`),
älä koskaan `feature.id`:stä.

**Kolmas sivulöydös, 2026-09-23 — MapLibren `["zoom"]` ei siedä sisäkkäisyyttä.**
`fadeAcrossBand`ia rakentaessa `['*', dataAjettuIlmaisu, ['interpolate', ..., ['zoom'],
...]]` läpäisi TypeScriptin mutta kaatoi jokaisen kerroksen ajossa: *"zoom expression may
only be used as input to a top-level step or interpolate expression"* — koko kartan
territorio hävisi hiljaa, `map.on('error', ...)`iin, ei mihinkään mikä olisi kaatanut
buildin. Korjaus: `interpolate` on itse ylin ilmaisu, ja data-ajettu arvo taitetaan sen
*pysäkin arvoksi* (`fadeAcrossBand(atStart, atEnd)`, missä kumpikin voi olla ilmaisu),
ei kertolaskun operandiksi. MapLibren tyyppimäärittelyt eivät pysty vahtimaan tätä sääntöä
käännösaikaan — ainoa tapa löytää tämä on ajaa se selaimessa ja lukea konsoli.

**Neljäs sivulöydös, 2026-09-23 — `pnpm preview` ei rakenna uudelleen.**
`playwright.config.ts`in `webServer` ajaa `pnpm preview`ta `dist/`ia vasten ja käyttää
`reuseExistingServer`ia paikallisesti — jos portti 4173 on jo auki, Playwright ei koske
siihen, vaikka lähdekoodi olisi muuttunut sen jälkeen. Puoli tuntia debug-aikaa meni
siihen että napautus "ei tehnyt mitään", kun oikea syy oli että testi ajoi edellistä
buildia. `pnpm build` ennen jokaista e2e-ajoa uuden ominaisuuden jälkeen, ei vain ennen
porttia — ja jos oireet eivät täsmää koodin kanssa, tarkista ensin onko palvelin vanha.

## Ei tässä

- Realtime. Cron riittää; kaupungit eivät laajene sekunneissa
- Suomen ulkopuoli. Rajaus on Suomi, koska pelaajat ovat Suomessa. Mikään yllä ei
  kuitenkaan sido maahan — H3 on globaali, ja `atlas.json` kasvaa vain asutuilla soluilla
- **Erillinen kaupunkitaso (res 8).** Amended 2026-09-23, ks. GREENin ensimmäinen kohta:
  `cells-fill` palvelee jo kaupunkinäkymää siinä zoomissa jonka kamera-lento tarjoaa.
  Rakennetaan erikseen vain jos oikea pelaajamäärä oikeasti tekee siitä tarpeen — ei
  etukäteen arvattuna
