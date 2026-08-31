# BRDC-SCALE-001 — Lukupolku on täysi skannaus

| | |
|---|---|
| **Vaihe** | 2.6 — mobiili ja jaettu maailma |
| **Effort** | L (2–3 päivää) |
| **Riippuvuudet** | BRDC-MOCK-001, BRDC-CLAIM-005, BRDC-CLAIM-006 |
| **Status** | `in_progress` — kolme kohtaa kuudesta korjattu, katso *Toteutettu* |
| **Valmius** | 40 % |
| **Lähde** | Koodiauditointi 2026-08-31, ajettu `BRDC-ATLAS-001`:n taustaksi |

## 🔴 RED

Jokainen lukupolku pelissä on **täysi skannaus jokaisesta solusta, jonka laite on
koskaan tallentanut**. Se on kunnossa sadalla solulla ja se on koko peli tuhannella.
`BRDC-ATLAS-001` puhuu Suomesta.

Kaikki alla on **luettu koodista ja tarkistettu erikseen**, ei pääteltyä:

| # | Mitä | Missä |
|---|---|---|
| 1 | `allCells()` on ainoa solunlukuprimitiivi: `keys()` ja sitten **yksi `get` per solu peräkkäin** *(korjattu — ks. Toteutettu)* | `MockRepository.ts:360-368` |
| 2 | `getCells(bbox)` **ei ole rajattu kysely.** Se lukee kaiken ja suodattaa vasta sitten *(yhä totta — kysely itse on yhä täysi skannaus, vain sen hinta laski)* | `MockRepository.ts:285` |
| 3 | ~~IndexedDB:ssä jokainen `get` on oma transaktionsa~~ **korjattu** | `IdbStore.ts:34-49` |
| 4 | ~~`keys(prefix)` hakee `getAllKeys()`illa koko kannan avaimet ja suodattaa JS:ssä~~ **korjattu** | `IdbStore.ts:59-62` |
| 5 | `cells-fill`-tasolla **ei ole `minzoom`ia**. Zoomilla 5 bbox on koko maa | `TerritoryLayer.ts:41` |
| 6 | `regionOf()` ja `H3_RES_REGION` ovat **kuollutta koodia** — määritelty, viety, testattu, eikä yksikään tuotantotiedosto kutsu niitä | `geo/cells.ts:41`, `constants.ts:14` |

## 🟢 GREEN

- [ ] `getCells(bbox)` on **oikeasti rajattu kysely** — se ei saa lukea sitä, mitä se
      ei palauta *(ei vielä — ks. Toteutettu, kohta jää tarkoituksella auki)*
- [x] Lukeminen käyttää **`IDBKeyRange`ä**, ei `getAllKeys` + JS-suodatusta — `keys(prefix)`
      hakee nyt vain kyseisen prefiksin avaimet DB-tasolla, kaikille kutsujille
      (`cell:`, `trail:`, `run:`), ei vain soluille
- [x] Jokainen `get()` **ei enää avaa omaa transaktiotaan** — `KeyValueStore.getMany`
      lukee koko avainjoukon yhdellä IndexedDB-transaktiolla. Ei poista täyttä
      skannausta (kohta yllä), mutta poistaa sen todellisen hinnan: N transaktiota → 1
- [ ] Yksi res 6 -alue luetaan **yhdellä, rajatulla haulla**, joka ei kosketa muita
      alueita *(ei vielä — vaatii kohdan yllä olevan lisäksi turvallisen avainmuodon,
      ks. Toteutettu)*
- [~] `cells-fill` saa `minzoom`in — **tietoinen ei nyt.** `minzoom` säätelisi vain
      piirtoa, ei kyselyä; ilman rajattua kyselyä (kohta 1) se olisi kosmeettinen
      korjaus, joka samalla regressoisi Vaiheen 2:n läpäisseen käytöksen (oma alue
      näkyy täytettynä hieman uloszoomattunakin). Siirretty `BRDC-ATLAS-001`:een,
      jossa kansallinen näkymä on oma tasonsa eikä sama `cells-fill`
- [ ] `regionOf` on **käytössä** eikä testattua koristetta *(ei vielä — ks. Toteutettu)*
- [ ] Skannausten määrä kävelyn aikana **mitataan ennen ja jälkeen** — ei mitattu vielä,
      koska kysely itse ei ole vielä rajattu
- [ ] Suorituskykytesti `packages/core`issa — ei vielä kirjoitettu

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

**Kohta 6 ei ole vielä korjattu, ja tämän version aiempi suunnitelma sille oli väärä.**
Ei arvailtu — testattu ja kumottu samana iltana. Tästä kannattaa lukea alla oleva
kokonaan, koska se on suoraan varoitus seuraavalle, joka avaa tämän tiketin.

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
   `SAVE_VERSION`-noston** (`persist/save.ts:19`) — avainmuodon muutos on täsmälleen se
   tapaus, jota varten se olekassa. Järkevintä yhdistää `BRDC-ECON-001`:n jo
   suunnittelemaan versionostoon (`water`→`food`), ei tehdä kahta erillistä resetiä
   peräkkäin ilman syytä
2. **`h3.cellToChildren(region, 11)[0]`** yhden todellisen lapsen hakemiseen ja sen
   merkkijonon käyttämiseen etuliitteenä. Oikein, koska se on oikea data eikä arvaus —
   mutta vaatii silti tietämään *kuinka monta merkkiä* on jaettu, mikä vaihtelee
   resoluutioerojen mukaan eikä ole sama kaikilla väleillä (nähtiin yllä), joten senkin
   pituus pitäisi joko todistaa tai laskea ajossa vertaamalla useampaa lasta keskenään
   — monimutkaisempi kuin näyttää, ja hyöty verrattuna kohtaan 1 on pieni

**Suositus: kohta 1**, tehtynä `BRDC-ECON-001`:n version noston kanssa samalla.

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

- [ ] Testi mittaa **oikean polun**: `cellsToGeoJson` → `setData` → `idle`
- [ ] `yield`-ominaisuus mukana, jotta kaikki neljä tasoa piirtyvät
- [ ] Tikettien väite korjataan vastaamaan sitä, mitä testi mittaa

## Ei tässä

- Web Worker geometrian rakentamiseen. Ensin rajattu kysely — se poistaa suurimman
  osan työstä sen sijaan että siirtäisi sen toiseen säikeeseen
- `world.json`:n sharding. Se on `BRDC-SHARE-001`, ja se käyttää samaa `regionOf`ia
- Kansallinen näkymä → `BRDC-ATLAS-001`. Tämä tiketti on sen edellytys
