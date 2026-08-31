# BRDC-SCALE-001 — Lukupolku on täysi skannaus

| | |
|---|---|
| **Vaihe** | 2.6 — mobiili ja jaettu maailma |
| **Effort** | L (2–3 päivää) |
| **Riippuvuudet** | BRDC-MOCK-001, BRDC-CLAIM-005, BRDC-CLAIM-006 |
| **Status** | `in_progress` — kaksi kohtaa kuudesta korjattu, katso *Toteutettu* |
| **Valmius** | 30 % |
| **Lähde** | Koodiauditointi 2026-08-31, ajettu `BRDC-ATLAS-001`:n taustaksi |

## 🔴 RED

Jokainen lukupolku pelissä on **täysi skannaus jokaisesta solusta, jonka laite on
koskaan tallentanut**. Se on kunnossa sadalla solulla ja se on koko peli tuhannella.
`BRDC-ATLAS-001` puhuu Suomesta.

Kaikki alla on **luettu koodista ja tarkistettu erikseen**, ei pääteltyä:

| # | Mitä | Missä |
|---|---|---|
| 1 | `allCells()` on ainoa solunlukuprimitiivi: `keys()` ja sitten **yksi `get` per solu peräkkäin** | `MockRepository.ts:360-368` |
| 2 | `getCells(bbox)` **ei ole rajattu kysely.** Se lukee kaiken ja suodattaa vasta sitten | `MockRepository.ts:285` |
| 3 | IndexedDB:ssä jokainen `get` on **oma transaktionsa** *(yhä totta — korjaa vasta alueperusteinen kysely)* | `IdbStore.ts:34-49` |
| 4 | ~~`keys(prefix)` hakee `getAllKeys()`illa koko kannan avaimet ja suodattaa JS:ssä~~ **korjattu** | `IdbStore.ts:59-62` |
| 5 | `cells-fill`-tasolla **ei ole `minzoom`ia**. Zoomilla 5 bbox on koko maa | `TerritoryLayer.ts:41` |
| 6 | `regionOf()` ja `H3_RES_REGION` ovat **kuollutta koodia** — määritelty, viety, testattu, eikä yksikään tuotantotiedosto kutsu niitä | `geo/cells.ts:41`, `constants.ts:14` |

## 🟢 GREEN

- [ ] `getCells(bbox)` on **oikeasti rajattu kysely** — se ei saa lukea sitä, mitä se
      ei palauta *(ei vielä — ks. Toteutettu, kohta jää tarkoituksella auki)*
- [x] Lukeminen käyttää **`IDBKeyRange`ä**, ei `getAllKeys` + JS-suodatusta — `keys(prefix)`
      hakee nyt vain kyseisen prefiksin avaimet DB-tasolla, kaikille kutsujille
      (`cell:`, `trail:`, `run:`), ei vain soluille
- [ ] Yksi res 6 -alue luetaan **yhdellä transaktiolla**, ei tuhannella *(ei vielä —
      vaatii kohdan yllä olevan lisäksi)*
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

**Kohta 6 ei ole vielä korjattu, ja tässä on miksi ei kiireessä.** Alla oleva
alueperusteinen kysely on oikea seuraava askel, mutta sen turvallinen toteutus vaatii
enemmän kuin avaimen keksimisen — ks. *Miksi rajattu kysely odottaa*.

## Avain osaa jo sen, mitä tarvitaan — mutta ei vielä käytössä

Avainmuoto on `cell:${h3}` (`keys.ts:16`), ja **H3:n merkkijonoesitys on hierarkkinen**:
res 6 -solun kaikki 16 807 res 11 -lasta jakavat kahdeksan ensimmäistä merkkiä.

Mitattu `h3-js` 4.5.0:lla, 3 000 satunnaisella solulla ympäri maapallon — ei yksikään
poikkeus: vanhempi `86088a2d…`, kaikki lapset alkavat `8b088a2d`, eikä kahdella eri
alueella ollut koskaan samaa kahdeksan merkin etuliitettä.

Eli kokonainen alue **näyttäisi olevan** yksi rajattu haku:

```ts
IDBKeyRange.bound('cell:8b088a2d', 'cell:8b088a2e')
```

**Mitään ei tarvitsisi muuttaa tietomallissa.** `regionOf` on jo olemassa ja tekee juuri
tämän avaimen. Se vain ei ole koskaan päässyt tuotantoon — se kirjoitettiin Vaihetta 3
varten ja Vaihe 3 vaihtui.

### Miksi rajattu kysely odottaa

Mittaus yllä on **empiirinen, ei todistettu.** H3-indeksin bittiasettelu (1 varattu +
4 tila + 3 varattu + 4 resoluutio + 7 peruskennon bittiä = 19 bittiä ennen ensimmäistä
tarkennusdigittiä) ei jakaudu tasan heksamerkkirajalle, joten "kahdeksan merkkiä on aina
jaettu" on havainto kolmestatuhannesta otoksesta, ei taattu ominaisuus jota voisin
perustella luvuista käsin.

Tämä on täsmälleen sitä dataa, josta `BRDC-REGRESSION-000` ja koko tämän tiketin RED
puhuvat: väärä oletus omistajuusdatasta on hiljainen ja löytyy vasta tuotannossa. Ennen
kuin tähän nojaa yhtään kyselyä, tarvitaan **ominaisuustesti** (property test): satoja
tai tuhansia satunnaisia H3-indeksejä, jokaiselle varmistus että
`cellToParent(cell, 6).slice(0,8)` on sama kaikilla `cellToChildren(parent,11)`-soluilla
eikä törmää toisen alueen etuliitteeseen. Vasta sen jälkeen `cellsInBBox` voidaan
kirjoittaa alueperusteiseksi ilman että se on toivottu oikeaksi.

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
