# BRDC-CLAIM-006 — Heksojen renderöinti kartalle

| | |
|---|---|
| **Vaihe** | 2 — Aluevaltaus |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-CLAIM-005, BRDC-MAP-001 |
| **Status** | `done` — 2026-08-27 (1 kohta auki) |
| **Valmius** | 95 % |

## 🔴 RED

Alue on dataa IndexedDB:ssä. Kartalla ei näy mitään. Tämä on se hetki, joka tekee
projektista pelin — ilman sitä Vaihe 2 ei ole todennettavissa.

## 🟢 GREEN

- [x] Omat solut: `--cosmic-purple`, täyttö 0.35, viiva 0.9
- [x] Muiden pelaajien solut: generoitu sävy, **desaturoituna palettiin päin**
- [x] **Strength näkyy opasiteettina** — heikko solu on himmeämpi
- [x] Valtaushetki saa **laajenevan heksamandalan** (`claude.md` §12) ja `+N`-laskurin.
      Solukohtaista ilmestymisanimaatiota ei ole — mandala sanoo saman halvemmalla
- [~] Piiritetty solu saa **katkoviivan**, ei pulssia. Katkoviiva on parempi:
      se toimii myös `prefers-reduced-motion`issa ja lukuu paremmin päivänvalossa
- [~] "The Void reclaims" näkyy HUDissa. **Häviämisanimaatiota ei ole** — Vaihe 6
- [x] **Yksi GeoJSON-lähde**, päivitys `setData()`llä
- [x] 5 000 heksan `setData` **mitattu**: < 400 ms, pääsäie ei jumitu, kartta pysyy elossa
- [~] Ei kytkettäviä animaatioita — ei siis mitään mitä sammuttaa

## Toteutus

**Yksi lähde, ei layeria per solu.** Omistajuus ja strength menevät featuren
propertyihin, ja layerien maalaus lukee ne data-driven-lausekkeilla:

```ts
{ id: 'cells-fill', type: 'fill', source: 'cells',
  paint: {
    'fill-color': ['get', 'color'],
    'fill-opacity': ['interpolate', ['linear'], ['get', 'strength'],
                     0, 0.12,  500, 0.35],
  } }
```

Tämä on se kohta, jossa MapLibren valinta Leafletin sijaan maksaa itsensä takaisin:
5 000 monikulmiota GPU:lla on triviaali, DOM:issa mahdoton. v2 törmäsi tähän ja joutui
rajoittamaan markkerien määrää sekä kytkemään klusteroinnin pois.

**Värit muille pelaajille:** sävy johdetaan pelaajan id:stä deterministisesti ja
**desaturoidaan palettiin päin** — kartta ei saa muuttua sateenkaareksi. Kirkkaus
ja kylläisyys tulevat tokeneista, vain sävy vaihtelee.

**Näkyvyysalue:** haetaan vain näkyvän bboxin solut. **Zoom-tason 13 alapuolella
solukohtaiset viivat piilotetaan** — res-11-solu on silloin sormenpäätä pienempi eikä
enää kanna tietoa. Täyttö jää, jotta alueen muoto näkyy ylhäältä. Testattu.

## Testit

- [x] `square.json`-lenkki → heksat ilmestyvät kartalle
- [x] Voima kulkee featuren propertyyn ja erottaa heikon vahvasta (`territoryFeatures.test.ts`)
- [x] Jokainen kilpailija saa oman sävynsä, sama joka sessiossa, aina paletin sisällä
- [x] Layerien määrä pysyy vakiona kun soluja lisätään
- [x] 5 000 solun renderöinti mitattu (`claim.spec.ts`)
- [~] Ei animaatioita joita sammuttaa
- [x] 360 px viewport ajetaan ensin

> **Täytön läpinäkyvyys ei ole lineaarinen.** Suora ramppi nollasta jätti juuri
> vallatun solun (voima 100/500) arvoon 0,17 lähes mustaa vasten — se on lähes
> näkymätön palkinto pelin ainoasta palkitsevasta hetkestä. Käyrä nousee nyt nopeasti
> perusvoimaan ja sitten loivemmin.
>
> **Piiritetty solu saa katkoviivan**, ei vain eri värin. Väri ei koskaan yksin kanna
> merkitystä (AI-Koulu luku 4), ja tämä on se karttatila jonka pelaajan pitää lukea
> yhdellä silmäyksellä päivänvalossa.
>
> `cellBoundary` siirrettiin `@es3/core`en: h3 palauttaa `[lat, lng]`, GeoJSON haluaa
> päinvastoin, ja väärinpäin koko alue piirtyy Afrikan rannikolle **ilman virhettä**.
> Nyt vaihto tehdään kerran, eikä mikään `packages/core`n ulkopuolella riipu h3-js:stä.

> **`TerritoryLayer` jaettiin kahtia.** Kaikki päätökset — kuka saa minkä värin, milloin
> solu on piiritetty, mitkä ominaisuudet paint-lausekkeet lukevat — ovat nyt
> `territoryFeatures.ts`:ssä, jossa ne testataan ilman selainta. Layeriin jäi
> MapLibre-putkitus. 16 uutta testiä.
>
> Testit paljastivat yhden pienen vian, mutta **eivät sitä jonka ensin väitin**:
> vapautuneen solun väri oli jo oikein. Todellinen löytö oli `mine`-lippu — vanha
> `cell.ownerId === me` antoi `null === null` → **tosi**, joten ennen profiilin
> latautumista jokainen vapaa solu piirtyi hetken pelaajan omana. Nyt `mine` vaatii
> omistajan.
>
> Auki: solujen häviämisanimaatio (Vaihe 6).

Realtime-päivitykset muilta pelaajilta (Vaihe 3). Anchor Stone -visualisointi (Vaihe 6).
Wager-areena (Vaihe 4).

## Lähde

`PROMPTS.md` Vaihe 2 kohta 6 · `files/CLAUDE.md` §Design tokens ·
`ANALYSIS.md` §8 kohta 1

## Löydös 2026-08-31 — "5 000 heksaa alle 400 ms" ei mittaa renderöintiä

Tämän tiketin oma suorituskykyväite (`claim.spec.ts:195-242`) on luettu uudelleen
tarkkaan: se ajastaa **vain `setData()`-kutsun** 5 000 käsintehdyllä monikulmiolla,
joita ei ole rakennettu `cellToBoundary`lla, eikä odota kartan `idle`-tilaa eikä
sisällä `yield`-ominaisuutta. Se on totta siitä, mitä se mittaa, mutta se ei mittaa
sitä, mitä `BRDC-REGRESSION-000` #4 ja tämä tiketti väittävät sen mittaavan.

Korjaus, oikea skannausongelma (`getCells` ei ole rajattu kysely) ja rappeutumisen
sivuvaikutus vieraisiin soluihin on koottu `BRDC-SCALE-001`:een — se on ennakkoehto
`BRDC-ATLAS-001`:lle, joka puhuu jo koko Suomesta.
