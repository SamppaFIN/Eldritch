# BRDC-SCALE-001 — Lukupolku on täysi skannaus

| | |
|---|---|
| **Vaihe** | 2.6 — mobiili ja jaettu maailma |
| **Effort** | L (2–3 päivää) |
| **Riippuvuudet** | BRDC-MOCK-001, BRDC-CLAIM-005, BRDC-CLAIM-006 |
| **Status** | `todo` |
| **Valmius** | 0 % |
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
| 3 | IndexedDB:ssä jokainen `get` on **oma transaktionsa** | `IdbStore.ts:34-49` |
| 4 | `keys(prefix)` hakee `getAllKeys()`illa **koko kannan avaimet** — jäljet ja juoksut mukaan lukien — ja suodattaa JS:ssä | `IdbStore.ts:59-62` |
| 5 | `cells-fill`-tasolla **ei ole `minzoom`ia**. Zoomilla 5 bbox on koko maa | `TerritoryLayer.ts:41` |
| 6 | `regionOf()` ja `H3_RES_REGION` ovat **kuollutta koodia** — määritelty, viety, testattu, eikä yksikään tuotantotiedosto kutsu niitä | `geo/cells.ts:41`, `constants.ts:14` |

## 🟢 GREEN

- [ ] `getCells(bbox)` on **oikeasti rajattu kysely** — se ei saa lukea sitä, mitä se
      ei palauta
- [ ] Lukeminen käyttää **`IDBKeyRange`ä**, ei `getAllKeys` + JS-suodatusta
- [ ] Yksi res 6 -alue luetaan **yhdellä transaktiolla**, ei tuhannella
- [ ] `cells-fill` saa `minzoom`in; kansallisella zoomilla ei piirretä res 11 -soluja
- [ ] `regionOf` on **käytössä** eikä testattua koristetta
- [ ] Skannausten määrä kävelyn aikana **mitataan ennen ja jälkeen** ja luku kirjataan tänne
- [ ] Suorituskykytesti `packages/core`issa — sellaista ei tällä hetkellä ole yhtään

## Avain osaa jo sen, mitä tarvitaan

Tämä on tiketin paras uutinen. Avainmuoto on `cell:${h3}` (`keys.ts:16`), ja **H3:n
merkkijonoesitys on hierarkkinen**: res 6 -solun kaikki 16 807 res 11 -lasta jakavat
kahdeksan ensimmäistä merkkiä.

Mitattu `h3-js` 4.5.0:lla: vanhempi `86088a2d…`, kaikki lapset alkavat `8b088a2d`.

Eli kokonainen alue on yksi rajattu haku:

```ts
IDBKeyRange.bound('cell:8b088a2d', 'cell:8b088a2e')
```

**Mitään ei tarvitse muuttaa tietomallissa.** `regionOf` on jo olemassa ja tekee juuri
tämän avaimen. Se vain ei ole koskaan päässyt tuotantoon — se kirjoitettiin Vaihetta 3
varten ja Vaihe 3 vaihtui.

## 🔴 Se, joka ei ole nopeusongelma vaan sääntöongelma

`getCells` ja `getOwnedCells` **kirjoittavat levylle kesken lukemisen**: ne poistavat
nollaan rappeutuneet solut (`MockRepository.ts:287, :295`).

Se on tarkoituksellista, ja tiketin oma perustelu on hyvä:

> *"a cell that has reached zero is genuinely unowned again, and leaving it on disk
> would keep a ghost nobody can take."*

Yksinpelissä se on oikein. **Jaetussa maailmassa se ei ole**, ja syy on hienovarainen:
`allCells()` ei erottele omia ja vieraita soluja, joten kartan katsominen **ajaa
rappeutumisen myös toisten pelaajien soluihin sinun laitteellasi.** Omistaja käveli
siellä eilen; sinun puhelimesi ei nähnyt sitä ja päättää, että solu on vapautunut.

Kaksi laitetta, kaksi eri totuutta samasta solusta — ja `world.json` yhdistäisi ne.

- [ ] Rappeutuminen ajetaan **vain omiin soluihin**
- [ ] Vieraiden solujen tila tulee `world.json`ista sellaisenaan, ei paikallisesti laskettuna
- [ ] Testi: vieras solu ei muutu, vaikka karttaa katsottaisiin viikko

Tämä on sama juurisyy kuin golden rule 1:ssä (*"the server owns the truth"*), vaikka
palvelinta ei ole. Omistaja omistaa totuuden omasta maastaan.

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
