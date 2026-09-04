# BRDC-SCALE-001 — Lukupolku on täysi skannaus

| | |
|---|---|
| **Vaihe** | 2.6 — mobiili ja jaettu maailma |
| **Effort** | L (2–3 päivää) |
| **Riippuvuudet** | BRDC-MOCK-001, BRDC-CLAIM-005, BRDC-CLAIM-006, BRDC-PERSIST-002 (kohta 6) |
| **Status** | `in_progress` — rajattu kysely tehty, `claim.spec.ts` korjattu 2026-09-04; `getOwnedCells`in `owned:`-indeksi jäljellä |
| **Valmius** | 92 % |
| **Lähde** | Koodiauditointi 2026-08-31, ajettu `BRDC-ATLAS-001`:n taustaksi |

## 🔴 RED

Jokainen lukupolku pelissä on **täysi skannaus jokaisesta solusta, jonka laite on
koskaan tallentanut**. Se on kunnossa sadalla solulla ja se on koko peli tuhannella.
`BRDC-ATLAS-001` puhuu Suomesta.

Kaikki alla on **luettu koodista ja tarkistettu erikseen**, ei pääteltyä:

| # | Mitä | Missä |
|---|---|---|
| 1 | ~~`allCells()` on ainoa solunlukuprimitiivi~~ **korjattu** — `getCells` menee nyt `cellsInBBox`:n rajattua polkua; `allCells` jää `runDecay`/`getOwnedCells`:lle | `cellStore.ts` |
| 2 | ~~`getCells(bbox)` ei ole rajattu kysely~~ **korjattu** — lukee vain viewportin peittämät res 6 -alueet | `cellStore.ts:cellsInBBox` |
| 3 | ~~IndexedDB:ssä jokainen `get` on oma transaktionsa~~ **korjattu** | `IdbStore.ts:34-49` |
| 4 | ~~`keys(prefix)` hakee `getAllKeys()`illa koko kannan avaimet ja suodattaa JS:ssä~~ **korjattu** | `IdbStore.ts:59-62` |
| 5 | `cells-fill`-tasolla **ei ole `minzoom`ia**. Zoomilla 5 bbox on koko maa *(siirretty `BRDC-ATLAS-001`:een)* | `TerritoryLayer.ts:41` |
| 6 | ~~`regionOf()` ja `H3_RES_REGION` ovat kuollutta koodia~~ **korjattu** — `K.cell` ja `regionsCoveringBBox` kutsuvat niitä | `geo/cells.ts`, `keys.ts` |

## 🟢 GREEN

- [x] `getCells(bbox)` on **oikeasti rajattu kysely** — `cellsInBBox` lukee vain
      `regionsCoveringBBox`:n antamat res 6 -alueet, ei koko storea. `inBBox`-suodatus jää,
      koska alue (~36 km²) on viewporttia isompi
- [x] Lukeminen käyttää **`IDBKeyRange`ä**, ei `getAllKeys` + JS-suodatusta — `keys(prefix)`
      hakee nyt vain kyseisen prefiksin avaimet DB-tasolla, kaikille kutsujille
      (`cell:`, `trail:`, `run:`), ei vain soluille
- [x] Jokainen `get()` **ei enää avaa omaa transaktiotaan** — `KeyValueStore.getMany`
      lukee koko avainjoukon yhdellä IndexedDB-transaktiolla
- [x] Yksi res 6 -alue luetaan **yhdellä, rajatulla haulla** — avain on
      `cell:${regionOf(h3)}:${h3}`, joten `store.keys('cell:${region}:')` on yhden alueen
      range-skannaus joka ei kosketa muita. Vanhat `cell:${h3}`-avaimet resetoidaan
      `SCHEMA_VERSION = 2`:lla (`BRDC-PERSIST-002`)
- [~] `cells-fill` saa `minzoom`in — **tietoinen ei nyt.** `minzoom` säätelisi vain
      piirtoa, ei kyselyä; ilman rajattua kyselyä (kohta 1) se olisi kosmeettinen
      korjaus, joka samalla regressoisi Vaiheen 2:n läpäisseen käytöksen (oma alue
      näkyy täytettynä hieman uloszoomattunakin). Siirretty `BRDC-ATLAS-001`:een,
      jossa kansallinen näkymä on oma tasonsa eikä sama `cells-fill`
- [x] `regionOf` on **käytössä** — `keys.ts#K.cell` ja `geo/cells.ts#regionsCoveringBBox`
      kutsuvat sitä; uusi `regionAt` on sen sijaintipari
- [x] Skannauksen rajautuminen **mitataan testissä** — `cellStore.test.ts` seedaa soluja
      kahteen kaukana toisistaan olevaan alueeseen, lukee viewportin ja todentaa
      laskurilla ettei kaukaisen alueen avaimia luettu (`< NEAR + FAR`)
- [x] Suorituskykytesti `packages/core`issa — `cellStore.test.ts` (rajautuminen) +
      `cells.test.ts`:n `regionsCoveringBBox`-lohko (peittävyys ja koko)

## Toteutettu 2026-08-31

**Kohta 3 ja osa kohdasta 4 korjattu — `IdbStore.keys()`.** Käytti ennen `getAllKeys()`ää
koko kannasta ja suodatti JavaScriptissa. Nyt `IDBKeyRange.bound(prefix, prefix + '￿')`
antaa selaimen oman indeksin tehdä suodatuksen. Ei muutosta rajapintaan eikä
tietomalliin — sama korjaus hyödyttää jokaista `keys(prefix)`-kutsua (`cell:`, `trail:`,
`run:`), ei vain soluja. Ei testattu suoraan (`IdbStore` on tarkoituksella testaamaton,
ks. sen oma kommentti — "worth testing sits in MockRepository, which runs against
MemoryStore"); oikeuttaminen on IndexedDB:n oma, hyvin tunnettu `IDBKeyRange`-idiomi.

**Valmistelu tehty: `MockRepository.ts` jaettu.** Se oli 395/400 riviä — ensimmäinen
uusi metodi olisi kaatanut portin. `allCells`, `hasGround`, bbox-suodatus ja soluosoitteen
keskipistevälimuisti siirtyivät uuteen `data/cellStore.ts`iin, samaan saumaan kuin
`pouch.ts`, `hearth.ts` ja `wager.ts` jo ovat. **Käytös ei muuttunut**: kaikki 415 testiä
vihreinä ennen ja jälkeen, byte-for-byte samat kyselyt.

Samalla poistui kolmen paikan kopio samasta säännöstä: `getCells`, `getOwnedCells` ja
`runDecay` tekivät kukin erikseen "`sweepDecay` ja poista vapautuneet" -parin. Nyt se on
yksi funktio, `sweepAndPersist`. `claiming.test.ts`:n *"removes released cells from
storage, not just from the answer"* kattaa sen jo suoraan.

**Kohta 6 ratkaistiin myöhemmin samana päivänä, `BRDC-PERSIST-002`:n jälkeen — ks. seuraava osio.**
Alla oleva analyysi siitä, miksi merkkijonotemppu ei toimi, on säilytetty tarkoituksella:
se on varoitus, ja se perustelee miksi valittu ratkaisu on eksplisiittinen yhdistelmäavain.

## Toteutettu 2026-08-31 (jatko) — rajattu kysely

**Avainmuoto vaihdettu: `cell:${h3}` → `cell:${regionOf(h3)}:${h3}`** (`keys.ts#K.cell`,
"Kaksi kelvollista tapaa" -listan kohta 1). `K.cell` ottaa yhä pelkän `h3`:n ja laskee
alueen itse, joten yksikään kutsupaikka ei muuttunut. `SCHEMA_VERSION` nostettu 1 → 2:
vanha `cell:${h3}`-arvo ei löydy uudella avaimella, joten v1-store resetoidaan
`BRDC-PERSIST-002`:n `versioned()`-portilla, ei migratoida.

**`getCells(bbox)` on nyt rajattu.** `geo/cells.ts` sai `regionAt(position)` ja
`regionsCoveringBBox(bbox)` — jälkimmäinen unioi `polygonToCells`in (kaikki alueet joiden
keskipiste on laatikossa), nurkkien+keskipisteen alueet, ja nurkka-alueiden `gridDisk(_, 1)`
-naapurit. `cellStore.ts#cellsInBBox` lukee näiden alueiden `cell:${region}:`-avaimet
range-skannauksella eikä koskaan koko storea. `allCells` jäi ennalleen — `runDecay` ja
`getOwnedCells` haluavat jokaisen solun, eikä kumpikaan ole paikkaan rajattu.

**Testit:** `cells.test.ts` +6 (`regionAt`, `regionsCoveringBBox`), uusi `cellStore.test.ts`
+3 (rajautuminen laskuri-storella). Koko sarja **451 vihreää**, typecheck + lint:lines
puhtaat.

**Jäljellä, tarkoituksella tämän paketin ulkopuolella:**

- **`getOwnedCells` on yhä täysi skannaus.** Omat solut eivät ole paikkaan rajattuja;
  oikea korjaus vaatii `owned:${playerId}`-indeksin joka pidetään ajan tasalla joka
  valtauksessa ja menetyksessä — oma liikkuva osansa, ja juuri se "toinen eriävä kopio"
  -riski josta `keys.ts` varoittaa. Käytännössä rajattu yhden pelaajan omistuksiin.
- **`claim.spec.ts`-perf­testin uusiksi kirjoittaminen** (osio "5 000 heksaa"): e2e,
  Playwright, vaatii selainajon; riippumaton tästä työstä.
- **`cells-fill` minzoom**: jo `[~]`, siirretty `BRDC-ATLAS-001`:een.

## Avain **ei** osaa sitä mitä tämä tiketti aiemmin väitti

Edellinen versio tästä osiosta ehdotti: koska res 6 -alueen kaikki res 11 -lapset
jakavat kahdeksan merkin etuliitteen keskenään, se etuliite saataisiin suoraan
**vanhemman omasta merkkijonosta** — `region.slice(0, 8)`. Ensimmäinen puolisko
(lapset jakavat etuliitteen keskenään) on totta ja todennettu 3 000 satunnaisotoksella
ilman poikkeusta. **Jälkimmäinen (se saadaan vanhemman merkkijonosta) on väärin,** ja
tässä on todiste, ei väite:

```
cell (res11): 8b112492eb03fff
region(res6): 86112492fffffff
                ^
     merkki 1 eroaa: '6' vs 'b' — JOKAISEN lapsen merkki 1 on 'b', vanhemman '6'
```

Merkki indeksissä 1 **on aina** resoluutio heksana — todennettu kaikilla 16 resoluutiolla
0–15 samasta sijainnista: res 0 → `'0'`, res 6 → `'6'`, res 11 → `'b'`, res 15 → `'f'`,
täydellinen 1:1-vastaavuus joka kerta. Se ei ole sattuma vaan H3-indeksin muoto. Koska
tämä merkki muuttuu vanhemmasta lapseen, **mikä tahansa suora osajono vanhemman
merkkijonosta menee väärin heti toisesta merkistä eteenpäin** — ja laajemmalla otannalla
(eri resoluutioväleillä, ei vain res6→res11) sama koe epäonnistui toistuvasti:

```
region(res8): 88eee80439fffff → derivoitu (väärä) etuliite: '88eee80439'
oikea lapsi:  8aeee8043807fff → ei ala millään yllä lasketulla etuliitteellä
```

**Mitä tästä opittiin, sanottuna suoraan:** H3:n merkkijonoesitys ei ole tasan jaettu
heksamerkkirajoille (otsikko on 19 bittiä: 1 varattu + 4 tila + 3 varattu + 4 resoluutio
+ 7 peruskenno), ja resoluutionumero istuu juuri sillä kohdalla, missä yksinkertaisin
etuliiteoletus olisi. Kahdeksan merkin osuma res6→res11-kokeessa oli oikea havainto
*lasten keskinäisestä* yhteneväisyydestä, mutta tästä tehty hyppäys "siis se lasketaan
vanhemman merkkijonosta" ei koskaan ollut todistettu — se oli lukemisvirhe omasta
datasta, joka olisi päätynyt tuotantoon ilman toista tarkistuskierrosta.

### Kaksi kelvollista tapaa eteenpäin, kumpikaan ei ole merkkijonotemppu

1. **Eksplisiittinen yhdistelmäavain.** `cell:${regionOf(h3)}:${h3}` sen sijaan että
   alue yritettäisiin lukea `h3`:n omasta merkkijonosta. Oikein rakenteensa puolesta,
   ei vaadi mitään tietoa H3:n bittiasettelusta, testattavissa suoraan. **Vaatii
   IndexedDB-puolen skeemaversion**, joka ei ollut olemassa tätä kirjoitettaessa —
   ks. `BRDC-PERSIST-002`, avattu `BRDC-ECON-001`:n sivulöydöstä 2026-08-31:
   `persist/save.ts`:n `SAVE_VERSION` suojaa vain `localStorage`a, ei mitään tässä
   koskettavaa. Tämä kohta odottaa `BRDC-PERSIST-002`:ta, ei enää `BRDC-ECON-001`:tä,
   joka valmistui ilman versionostoa (pooli korjattiin muotoa tunnistamalla, ei numerolla)
2. **`h3.cellToChildren(region, 11)[0]`** yhden todellisen lapsen hakemiseen ja sen
   merkkijonon käyttämiseen etuliitteenä. Oikein, koska se on oikea data eikä arvaus —
   mutta vaatii silti tietämään *kuinka monta merkkiä* on jaettu, mikä vaihtelee
   resoluutioerojen mukaan eikä ole sama kaikilla väleillä (nähtiin yllä), joten senkin
   pituus pitäisi joko todistaa tai laskea ajossa vertaamalla useampaa lasta keskenään
   — monimutkaisempi kuin näyttää, ja hyöty verrattuna kohtaan 1 on pieni

**Suositus: kohta 1**, tehtynä `BRDC-PERSIST-002`:n jälkeen.

## 🟡 Tarkennus: rappeutumisen "väärä puoli" ei ole väärin tänään — se on ajallisesti pommi

Alkuperäinen RED puhui tästä liian ehdottomasti. `getCells`, `getOwnedCells` ja
`runDecay` (nyt `sweepAndPersist`in kautta) **kirjoittavat levylle kesken lukemisen**:
ne poistavat nollaan rappeutuneet solut. Tämän hetken pelissä **kaikki muut solut ovat
paikallisesti simuloituja naapureita** (`seed.ts`), ei oikeita etäpelaajia — niitä ei
synkronoida mistään, joten niiden rappeuttaminen paikallisesti on juuri niin oikein
kuin yhden laitteen simulaatiolta voi odottaa. **Tässä ei ole bugia tänään**, ja tiketin
oma perustelu on hyvä sellaisenaan: *"a cell that has reached zero is genuinely unowned
again, and leaving it on disk would keep a ghost nobody can take."*

Bugi syntyy **sinä päivänä, kun `BRDC-SHARE-001` tuo oikean etäpelaajan datan**
`world.json`ista samaan `allCells()`-joukkoon ilman merkintää siitä, kumpi on kumpaa.
Sen jälkeen kartan katsominen alkaisi rappeuttaa dataa, jota tämä laite ei omista eikä
näe päivittyvän mistään — kaksi laitetta, kaksi totuutta samasta solusta, ja
`world.json` yhdistäisi ne. Sama juurisyy kuin golden rule 1:ssä (*"the server owns the
truth"*), vaikka palvelinta ei ole: omistaja omistaa totuuden omasta maastaan.

**Tämä on siis `BRDC-SHARE-001`:n avausehto, ei tämän tiketin kohta.** Kunnes
tietomallissa on jokin merkintä "tämä solu tuli `world.json`ista, älä rappeuta sitä
paikallisesti", ei ole mitään konkreettista koodattavaa — vain sääntö, joka pitää
muistaa kirjoittaa `BRDC-SHARE-001`:n ensimmäisenä testinä. Siirretty sinne:

- [ ] *(siirretty `BRDC-SHARE-001`:een)* Tuontidata ei rappeudu paikallisesti
- [ ] *(siirretty `BRDC-SHARE-001`:een)* Testi: tuotu solu ei muutu, vaikka karttaa
      katsottaisiin viikko

## 🔴 "5 000 heksaa alle 400 ms" ei mittaa sitä, miltä se kuulostaa

`claim.spec.ts:195-242` on siteerattu todisteena kahdessa tiketissä
(`BRDC-CLAIM-006`, `BRDC-REGRESSION-000` #4). Luettuna se tekee tämän:

- rakentaa **5 000 käsintehtyä synteettistä monikulmiota** — ei `cellToBoundary`ä,
  ei `h3`:a lainkaan (`:215-230`)
- ajastaa **vain `setData()`-kutsun** (`:232-234`)
- **ei odota kartan valmistumista** — ei `map.once('idle')`
- jättää `yield`-ominaisuuden pois, joten `cells-yield`-taso ei piirry kertaakaan

Se siis mittaa MapLibren datan vastaanoton, ei renderöintiä eikä sitä polkua, jolla
sovellus oikeasti rakentaa piirrettävän datan.

Tämä on sama virheluokka kuin `BRDC-REGRESSION-000` #10 — v2 julkaisi coverage-raportin,
jossa oli nolla osumaa. Luku oli totta; se ei vain mitannut sitä, mitä otsikko lupasi.

- [x] **Korjattu 2026-09-04.** Testi odottaa nyt `map.once('idle')`ia `setData`in jälkeen
      ja mittaa molemmat — ei enää pelkkää synkronista `setData`-kutsua. `cellsToGeoJson`
      itseään ei kutsuta (se on sovelluspuolen moduuli, ei tuotu e2e:hen — riski jätettiin
      ottamatta), mutta jokainen ominaisuus jonka kahdeksan `cells-*`-tasoa lukee on
      mukana (`icon` mukaan lukien, raskain niistä — symbolitason tekstinasettelu). Budjetti
      400 ms → 6 000 ms: vanha luku kattoi vain datan luovutuksen workerille, ei
      symbolien asettelua tai `idle`ä asti odottamista. "Neljä tasoa" ja "3" olivat myös
      vanhentuneita — tasoja on nyt kahdeksan; `claim.spec.ts`in oma testi tästä
      kirjoitettiin uusiksi vertailemaan lukumäärää ennen/jälkeen vallauksen sen sijaan
      että se pinnaisi tarkan luvun, joka rikkoutuu taas seuraavan tason myötä.

## Ei tässä

- Web Worker geometrian rakentamiseen. Ensin rajattu kysely — se poistaa suurimman
  osan työstä sen sijaan että siirtäisi sen toiseen säikeeseen
- `world.json`:n sharding. Se on `BRDC-SHARE-001`, ja se käyttää samaa `regionOf`ia
- Kansallinen näkymä → `BRDC-ATLAS-001`. Tämä tiketti on sen edellytys
