# BRDC-PERF-002 — Kartta rakennetaan uudelleen joka renderöinnillä

| | |
|---|---|
| **Alue** | `app/MapView`, `features/map/{MapCanvas,useCameraFollow,useTerrainResolver,useMap}`, `features/time/useGameClock`, `features/territory/{useTerritory,territoryFeatures,useSpells,useTradeRoutes}`, `features/trail/useTrail` |
| **Vaihe** | Läpileikkaava — kartan suorituskyky |
| **Effort** | M |
| **Riippuvuudet** | BRDC-PERF-001 (mittari ensin) |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite 2026-09-28 (ks. `BRDC-PERF-001`); koodikatselmointi samana päivänä |

## 🔴 RED

Koko alue rakennetaan alusta ja lähetetään kartalle **joka kerta kun `MapView` renderöityy**,
eli noin 3–4 kertaa sekunnissa kävellessä. Lähteet eivät ehdi koskaan asettua, ja se näkyy
flickerinä ja hitautena noin 1 000 heksasta alkaen.

| # | Mitä | Missä |
|---|---|---|
| 1 | `now={clock.now()}` on joka renderöinnillä uusi luku, ja se on territory-efektin riippuvuus → `setTerritoryData` + `setArcData` (kolme lähdettä) joka renderöinnillä. `now`ia käytetään vain blightiin ja kaaren väriin, jotka ovat tuntitason asioita | `MapView.tsx:227`, `MapCanvas.tsx:193-197` |
| 2 | `easeTo` jokaisella GPS-fixillä → `moveend` noin joka fixillä → `setBbox` (uusi olio) → `refresh` (kaksi täyttä IndexedDB-skannausta) | `useCameraFollow.ts:81-83`, `MapCanvas.tsx:284-300`, `MapView.tsx:144` |
| 3 | `refresh` asettaa `cells`in ja `owned`in erikseen `await`in yli → kaksi renderöintiä, ja aina uudet taulukot vaikka mikään ei muuttunut | `useTerritory.ts:89-94` |
| 4 | `runDecay`-efekti riippuu `refresh`in identiteetistä, joka vaihtuu bboxin mukana → kolmas täysi skannaus | `useTerritory.ts:172-181` |
| 5 | **Flicker:** `withFogOfWar` rakentaa hakutaulun vain viewportin soluista. Omat solut ladatun alueen ulkopuolella piirtyvät vaaleina tyhjinä, kunnes `refresh` ehtii, ja muuttuvat sitten violeteiksi | `territoryFeatures.ts:266` |
| 6 | `clock`-olio on uusi joka renderöinnillä → `seedAround` ja Hearthin lataus ajetaan joka kerta | `useGameClock.ts:63-69`, `MapView.tsx:93-96`, `useBoot.ts:86-96` |
| 7 | `spell.active`, `places`, `revealed` ja trade routes saavat uuden taulukon joka trail-versiolla → uusi `shownCells` → täysi uudelleenrakennus | `useSpells.ts:36-46`, `MapView.tsx:100-104`, `useTrail.ts:154`, `useTradeRoutes.ts:30-39` |
| 8 | Fortified-, pinta-ala- ja rival bearing -laskenta kaikille omille soluille joka renderöinnillä | `useTerritory.ts:191-212` |
| 9 | Terrain resolver tekee `queryRenderedFeatures`in jokaiselle ratkaisemattomalle solulle yhdessä synkronisessa silmukassa, kaikista tasoista | `useTerrainResolver.ts:38-55` |
| 10 | Oman lähteen virhe osuu `/source/i`-testiin ja kääntää basemapin tilaan `void` → koko näkymän uudelleenrenderöinti | `useMap.ts:119-132` |
| 11 | Jokainen tyhjä oma solu piirtää bannerin zoomista 13 alkaen | `territoryMarks.ts:218-238` |

## 🟢 GREEN

- [ ] Kartalle menevä `now` on minuuttitikki (`features/time/useMinuteNow.ts`): lukee heti
      kun `clock.now` vaihtaa identiteettiä (dev-kellon `t`/`T`), sitten 60 s välein ja
      `visibilitychange`-tapahtumassa. `useGameClock`in paluuarvo on memoisoitu
- [ ] `refresh` hakee molemmat `Promise.all`illa ja asettaa tilan vain, jos sisältö muuttui.
      `runDecay` luetaan refin kautta
- [ ] `withFogOfWar` alustaa hakutaulun myös `owned`-soluilla, joten omat solut eivät
      koskaan piirry tyhjinä
- [ ] Spells, places, revealed ja trade routes säilyttävät identiteettinsä, kun sisältö on sama
- [ ] `useTerritory`n per-render-laskenta memoisoitu `owned`in mukaan
- [ ] Viewport-hysteresis: pehmustettu bbox ladataan, ja uusi haku tehdään vasta kun näkymä
      poistuu siitä (`features/map/viewportHysteresis.ts`). Pehmustus rajataan
      `NATION_MAXZOOM`in alapuolella
- [ ] Kameran seuraus ei tee `easeTo`a, kun fixi on lähellä näkymän keskustaa
- [ ] Terrain resolver pilkottu paloihin idle-kutsuihin (kuten `useNearbySurvey`in
      `SURVEY_CHUNK`), ja kyselyt rajattu basemap-tasoihin
- [ ] `useMap`in `onError` reagoi vain basemapin lähteeseen
- [ ] Lipun minzoom nostettu
- [ ] `perf-map.spec.ts`: 20 s kävelyllä ilman valtausta `cells`-lähteen
      `content`-tapahtumia enintään 1; yli 50 ms longtaskeja 0 (1 027 heksaa, 4× CPU)
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` vihreä, `pnpm e2e` vihreä

## Todennus

_Kirjataan toteutuksen jälkeen: perf-specin luvut ennen/jälkeen._

## Ei tässä

- `text-ignore-placement: false` tasoilla `cells-neighbour` ja `cells-strength` **säilyy**:
  se on tarkoituksellinen, jotta paikannimet väistävät numeroita (`cellMarks.ts:206-220`)
- Diff-päivitykset ja geometriavälimuisti → `BRDC-PERF-003`
- Näkyvät muutokset kartan ulkoasuun → `BRDC-PERF-004`
