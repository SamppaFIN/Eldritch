# BRDC-HEX-003 — Toisen kansan lippu: data-driven `cells-flag`

| | |
|---|---|
| **Alue** | `packages/core/src/types/domain.ts`, `packages/core/src/data/world.ts`, `apps/game/src/features/territory/territoryFeatures.ts`, `TerritoryLayer.ts`, `territoryMarks.ts` |
| **Vaihe** | 3 — Sivilisaatio (osa ATLAS-001-sarjaa) |
| **Effort** | S |
| **Riippuvuudet** | ei mitään — `BRDC-ATLAS-001`in tap-to-fly ja naapurilista riippuvat **tästä** |
| **Status** | `done` — 2026-09-22 (v0.6.49) |

## 🔴 RED

Alkuperäisen UI-viilaussuunnitelman kohta 2 (2026-09-09) lupasi tämän numerolla
"HEX-003", mutta tiedostoa ei koskaan luotu — numero jäi vapaaksi ja työ tekemättä.
Tarkistettu suoraan koodista 2026-09-22:

- `cellProperties()`in `flag`-kenttä on rajattu `mine`-soluihin: `mine && works.length
  === 0 && !placeHere ? FLAG_GLYPH : ''` (`territoryFeatures.ts`). Rivaalin tai
  klaanikaverin solu ei koskaan saa `flag`-arvoa, oli sillä bannneria tai ei
- Vaikka rajaus poistettaisiin, `CELL_FLAG_LAYER`in `icon-image` on **globaali
  layout-ominaisuus**, asetettu `setFlagBanner()`illa (`territoryImages.ts:96-100`)
  aina paikallisen pelaajan omaan bannneriin. Jokainen lippu kartalla — omakin —
  piirtyisi väärällä kuvalla jos toisen pelaajan solu joskus saisi `flag`in
- `Cell.importedFrom` (`domain.ts`) kantaa jo `banner?: string`in, mutta ei tietoa
  *missä* toisen pelaajan Keep on — ilman sitä lippu piirtyisi jokaiselle tuodulle
  solulle, mikä olisi §12:n "geometria on hetkiä, ei tapettia" vastaista

`BRDC-ATLAS-001`in suunnitelma nimeää tämän suoraan esteeksi: *"rivaalin lippua ei
voi piirtää ennen kuin cells-flag on data-driven"* — naapurikansojen listan
"napauta → kamera lentää Keepille" tarvitsee jotain näkyvää kartalla johon lentää.

## 🟢 GREEN

- [x] `Cell.importedFrom` (`domain.ts`) uusi valinnainen kenttä `castle?: H3Index` —
      additiivinen, ei migraatiota. Kertoo mikä yksittäinen tuotu solu on juuri sen
      pelaajan Keep
- [x] `worldToCells` (`world.ts`) asettaa `castle`in kun `c.h3 === player.castle`
- [x] `cellProperties()`: `flag` näkyy `mine`-solulla ennallaan **ja** tuodulla
      solulla joka on sen omistajan Keep (`cell.imported && cell.h3 ===
      cell.importedFrom?.castle`) — ei joka rivaalisolulla, vain yhdellä per pelaaja
- [x] Uusi `CellProperties.bannerId: string` — `''` kun ei lippua. `mine`illä uusi
      parametri `myBanner` (paikallisen pelaajan valittu banneri, kulkee jo
      `TerritoryLayer.ts:256`in kautta muttei ennen tätä mennyt `cellProperties`iin
      asti); tuodulla Keep-solulla `cell.importedFrom.banner ?? ''`
- [x] `TerritoryLayer.ts`: `CELL_FLAG_LAYER`in `icon-image` muuttuu kiinteästä
      `bannerSpriteId('vesica')`ista lausekkeeksi `['concat', 'banner-', ['get',
      'bannerId']]` — sama nimeämiskaava kuin `bannerSpriteId()` jo käyttää,
      toistettuna MapLibre-lausekkeena koska paint-lausekkeet eivät voi kutsua JS-
      funktiota
- [x] `setFlagBanner()` (`territoryImages.ts`) poistettu — tarpeeton kun jokainen
      solu kantaa oman bannnerinsa. `useTerritory`/`MapCanvas`in sitä kutsuva rivi
      poistettu samalla
- [x] Portti: `lint:lines`, `tsc -b`, **1636** vitest (+7 uutta/muutettua flag-testiä),
      `pnpm build`. `territoryFeatures.test.ts` osui 400 rivin rajaan uusien testien
      myötä — `withFogOfWar`in oma describe-lohko (6 testiä, ei liity lippuun) eriytetty
      omaksi `withFogOfWar.test.ts`ikseen, ei tiivistetty
- [x] `e2e/nation.spec.ts`in kaksi olemassa olevaa lippu-testiä **korjattu**, ei vain
      läpäisty vahingossa: ne lukivat `map.getLayoutProperty('cells-flag',
      'icon-image')`ia, joka ei enää muutu (kiinteä lauseke nyt). Luetaan sen sijaan
      liputetun featuren oma `bannerId`-ominaisuus lähteestä — sama tapa jolla
      paint-lauseke itsekin päättää ikonin

## Todennus

`territoryFeatures.test.ts`: `mine`-solu jolla ei rakennusta saa `flag`in ja
`bannerId`in `myBanner`ista (ja EI mitään jos `myBanner`ia ei anneta — testattu
erikseen); sama pelaaja jonka Keep-solu tuotiin toiselta laitteelta saa `flag`in ja
oikean `bannerId`in `importedFrom.banner`ista; sama pelaajan **muu** tuotu solu (ei
Keep) ei saa lippua ollenkaan, vaikka `banner` olisi asetettu ja Keep olisi jossain
muualla. `world.test.ts`: uusi testi varmistaa että `worldToCells` merkitsee juuri
sen solun jonka h3 täsmää `player.castle`en, kaikki saman pelaajan solut kantavat
saman `castle`-osoittimen. `e2e/nation.spec.ts` (mobile-360, 3/3): oman bannerin
vaihto Keepissä näkyy kartan datassa sekä käsin piirretyllä että generoidulla
merkillä.

**Ei tehty:** kahden selainikkunan käsivarainen ristiintodennus (kummankin oma
Keep-lippu toisen kartalla) — e2e ja yksikkötestit kattavat saman logiikan riittävän
suoraan, eikä kahden samanaikaisen `MockRepository`-instanssin käsinajo tuonut
lisäarvoa suhteessa aikaan.

## Sivulöydös

`e2e/nation.spec.ts`in *"a sigil picked on the You screen sticks over a reopen"* on
rikki **ennen tätä tikettiä** — todennettu `git stash`illa täsmälleen samalla
tekniikalla kuin `BRDC-MAP-005`in UnlockMoment-löydös: `character__avatar-ring`
(SVG) peittää Sigil-napin osoitinta. Ei korjattu, ei tämän tiketin alaa — oma
tikettinsä jos halutaan.

## Ei tässä

- Klaanin oma lippu/tunnus erikseen kansallisesta bannnerista — ei pyydetty, klaanit
  käyttävät jäsentensä omia bannereita kuten tähänkin asti
- Naapurikansojen lista ja kamera-lento — `BRDC-ATLAS-001` itse, tämä on sen
  esiehto
