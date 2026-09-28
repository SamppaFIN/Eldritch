# BRDC-PERF-002 — Kartta rakennetaan uudelleen joka renderöinnillä

| | |
|---|---|
| **Alue** | `app/MapView`, `features/map/{MapCanvas,useCameraFollow,useTerrainResolver,useMap}`, `features/time/useGameClock`, `features/territory/{useTerritory,territoryFeatures,useSpells,useTradeRoutes}`, `features/trail/useTrail` |
| **Vaihe** | Läpileikkaava — kartan suorituskyky |
| **Effort** | M |
| **Riippuvuudet** | BRDC-PERF-001 (mittari ensin) |
| **Status** | `[~]` — toteutettu ja mitattu 2026-09-28; kaksi budjettia jäi, syyt alla |
| **Valmius** | 85 % |
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

- [x] Kartalle menevä `now` on minuuttitikki (`features/time/useMinuteNow.ts`): lukee heti
      kun `clock.now` vaihtaa identiteettiä, sitten 60 s välein ja `visibilitychange`ssa.
      `useGameClock`in paluuarvo on `useMemo`issa, joten `seedAround` ja `useBoot`in
      Hearth-efekti eivät enää aja joka renderöinnillä
- [x] `refresh` hakee molemmat `Promise.all`illa ja asettaa tilan vain, jos sisältö muuttui
      (`sameCells`). `runDecay` kutsuu `refreshRef`iä, joten panorointi ei käynnistä sweepiä
- [x] `withFogOfWar` alustaa hakutaulun `owned`-soluilla ensin, joten viewportin ulkopuolinen
      oma solu ei piirry tyhjänä
- [x] Spells, places, revealed (trail ja discovery) ja trade routes säilyttävät identiteettinsä
      (`features/map/keepIfSame.ts`, testattu). Lisäksi `useShownCells` riippuu tasosta eikä
      XP:stä: jokainen askeleen XP rakensi koko kartan uudelleen
- [x] `useTerritory`: fading, pinta-ala, vahvin ja rival bearing memoisoitu
- [x] Viewport-hysteresis (`features/map/viewportHysteresis.ts`, 5 testiä): puolen näkymän
      pehmuste, uusi haku vasta kun näkymä poistuu; ei pehmustetta yli 0,4° leveällä
      näkymällä (noin zoom 10 = `NATION_MAXZOOM`); pienennetään, kun ladattu alue on yli
      16× näkymä
- [x] Kameran seuraus ei tee `easeTo`a, jos fixi on alle 32 px keskustasta
      (`FOLLOW_DEADZONE_PX`)
- [x] Terrain resolver: 40 solun paloissa idle-kutsuina (`RESOLVE_CHUNK`), kyselyt rajattu
      `openmaptiles`-lähteen tasoihin
- [x] `useMap`in `onError`: vain `openmaptiles` tai lähteetön tile-/glyph-/sprite-virhe
      kääntää basemapin 'void'-tilaan
- [x] Lipun minzoom 13 → 15 (`FLAG_MINZOOM`)
- [~] `perf-map.spec.ts` (alla): lähteiden uudelleenlähetykset 13 → 2 kävelyssä, mutta
      budjetit "enintään 1" ja "0 longtaskia" eivät täyty. Syyt Todennus-osiossa, ja ne
      kuuluvat PERF-003:lle ja -004:lle
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` vihreä; karttaan liittyvät e2e:t alla

## Todennus

`perf-map.spec.ts`, mobile-360, 4× CPU, yksi worker:

| | 1 027 ennen | 1 027 jälkeen | 5 000 ennen | 5 000 jälkeen |
|---|---:|---:|---:|---:|
| `content`-tapahtumat / lähde / 20 s | 13 | **2** | 5 | 2 |
| longtaskit yhteensä | 19,2 s | 11,1 s | 15,0 s | 14,2 s |
| pisin longtask | 1 043 ms | 878 ms | 2 692 ms | 4 077 ms |
| panorointi p95 | 833 ms | **417 ms** | 2 233 ms | 1 067 ms |

**Miksi budjetit eivät täyty:**
- **2 uudelleenlähetystä, ei 1:** kävely omalla maalla vahvistaa solun, johon astutaan.
  Se on oikea muutos, joka pitää näkyä. Nyt se maksaa koko rakennuksen, ja PERF-003:n diffit
  tekevät siitä muutaman featuren päivityksen.
- **Longtaskit:** CPU-profiili 20 s kävelystä (1 027 heksaa) näyttää, että noin 12,7 s on
  natiivia "(program)"-aikaa. Se on pääosin headless-Chromen ohjelmistopohjaista WebGL:ää
  (SwiftShader), jota puhelimen GPU ei maksa CPU:lla. Todellisesta JS:stä suurin erä on
  noin 3 s IndexedDB-hakuja: `getOwnedCells` käy koko storen läpi joka kerta. Tämä on
  PERF-003:n `owned:`-indeksi.
- 5 000 heksan pisin tehtävä on yksi koko rakennus (4 s). Sen poistaa PERF-003:n diffi.

## Ei tässä

- `text-ignore-placement: false` tasoilla `cells-neighbour` ja `cells-strength` **säilyy**:
  se on tarkoituksellinen, jotta paikannimet väistävät numeroita (`cellMarks.ts:206-220`)
- Diff-päivitykset ja geometriavälimuisti → `BRDC-PERF-003`
- Näkyvät muutokset kartan ulkoasuun → `BRDC-PERF-004`
