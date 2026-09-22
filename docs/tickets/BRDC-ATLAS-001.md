# BRDC-ATLAS-001 — Koko Suomi: kaupungit, rajat ja laajeneminen yhdellä ruudulla

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L (2–3 päivää) |
| **Riippuvuudet** | BRDC-SHARE-001, BRDC-CASTLE-001, BRDC-CLAIM-006 |
| **Status** | `[~]` osittain — datakerros, kansallinen taso ja kamera-lento valmis ja
  todennettu; kaupunkitaso, jatkuva zoomi ja historia vielä auki. 2026-09-23 (v0.6.52) |
| **Valmius** | ~60 % — ks. "Tilanne 2026-09-23" alla |
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

- [~] **Kolme mittakaavaa** — kaksi on piirretty (kansallinen res 5, lähizoomi res 11);
      keskimmäinen kaupunkitaso (res 8) puuttuu yhä, ks. "Tilanne 2026-09-22"
- [x] Kansallinen näkymä piirtää **kaupungit ja niiden rajat**, ei soluja —
      `nationLayer.ts`, väri sama kahden sävyn laki kuin lähizoomissa (§13: oma
      `--cosmic-purple`, kaikki muut yksi kiinteä `--danger`, ei sävyä per kansa).
      Todennettu: `nationLayer.test.ts` (6 testiä, puhdas GeoJSON-rakennus) +
      `atlas.spec.ts` (Playwright, 360 px, kaksi mockattua kuntaa piirtyy oikein)
- [ ] Laajeneminen näkyy **ajassa**: sama kaupunki viikko sitten ja nyt — vaatii
      historiasnapshotit, ei aloitettu
- [ ] Siirtymä mittakaavojen välillä on **jatkuva**, ei kahden erillisen näytön vaihto
      — tänään se on kova raja `NATION_MAXZOOM`illa (zoom 10): lähizoomin tasot saavat
      `minzoom`, kansallinen taso `maxzoom`, sama luku. Vaihto on hetkellinen, ei liuku
- [x] Kansallinen näkymä latautuu **yhdestä pienestä tiedostosta** eikä vaadi koko
      maailmaa — `GET /atlas`, sama kylmäkäynnistys-pelastus kuin `/demographics`illa
- [~] Piirtomäärä mitattu **kansallisella tasolla**: `atlas.spec.ts` todentaa
      `queryRenderedFeatures`illa täsmälleen syötettyjen kuntien määrän, ei enempää —
      ei vielä stressitestattu oikealla mittakaavalla (1 338 mahdollista kuntaa)
- [x] Toimii 360 px:llä — `atlas.spec.ts` ajetaan `mobile-360`-projektilla
      (360×780), molemmat testit vihreää

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
suunnitelman kerralla (data-driven liput + tap-to-fly + historia), neljä palaa:

- [x] **`BRDC-HEX-003`** (oma tikettinsä, `done`, v0.6.49) — `cells-flag` data-driven,
      esiehto sille että toisen kansan Keep voi ylipäätään näyttää mitään kartalla
- [x] **Datakerros** (tässä, v0.6.50): `H3_RES_NATION = 5`, `nationRegionOf()`,
      `packages/core/src/data/worldStats.ts`in `atlasOf()` (puhdas, 6 testiä), Worker
      `GET /atlas` (`rebuild()`in yhteydessä kirjoitettu, sama kylmäkäynnistys-pelastus
      kuin `/demographics`/`clan-codex`illa). Todennettu käsin `wrangler dev`illä:
      kaksi pelaajaa eri kunnissa, oikea hallitseva pelaaja per alue, oikea pinta-ala
- [~] **Kartan piirto** (v0.6.51): `nationLayer.ts` piirtää res-5-tason
      (`nation-fill`/`nation-line`), `useNationLayer.ts` hakee `/atlas`in ja syöttää sen
      sisään, `TerritoryLayer.ts`in lähizoomin tasot saivat `minzoom: NATION_MAXZOOM`
      niin että raja on yksi luku molemmin puolin, ei kaksi joita voi unohtaa
      synkronoida. Puuttuu yhä: keskimmäinen kaupunkitaso (res 8), ja siirtymä on kova
      raja eikä jatkuva liuku — ks. GREEN yllä
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
- [ ] **Laajeneminen ajassa** ("sama kaupunki viikko sitten ja nyt") — vaatisi
      Workeriin kokonaan uuden historiasnapshot-mekanismin, jota ei ole olemassa missään
      muodossa tänään. Ei aloitettu, ei edes suunniteltu tarkemmin

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
tuotantobugi tähän asti — mutta jokainen jatkossa kirjoitettava tasoklikkaus (esim.
kaupunkitaso res 8:lla) tarvitsee saman kaavan: laske kohde napautuksen
**koordinaateista** (`nationRegionAt`, `cellAt`), älä koskaan `feature.id`:stä.

## Ei tässä

- Realtime. Cron riittää; kaupungit eivät laajene sekunneissa
- Suomen ulkopuoli. Rajaus on Suomi, koska pelaajat ovat Suomessa. Mikään yllä ei
  kuitenkaan sido maahan — H3 on globaali, ja `atlas.json` kasvaa vain asutuilla soluilla
