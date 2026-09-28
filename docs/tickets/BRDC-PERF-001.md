# BRDC-PERF-001 — Kartan suorituskyky mitataan oikeaa polkua pitkin

| | |
|---|---|
| **Alue** | `apps/game/e2e/`, `features/dev/`, `features/territory/` (vitest) |
| **Vaihe** | Läpileikkaava — kartan suorituskyky |
| **Effort** | M |
| **Riippuvuudet** | BRDC-SCALE-001 (sen perftestin puute), BRDC-E2E-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite 2026-09-28: *"Nyt testeissä 1000 heksan omistaminen sai pelin flickeröimään ja päivitys muuttui todella hitaaksi."* |

## 🔴 RED

Kartan hitautta ei voi korjata eikä todentaa, koska mikään testi ei mittaa sitä polkua,
jolla peli oikeasti piirtää:

- `claim.spec.ts:221-293` ("five thousand hexagons") kirjoittaa synteettiset monikulmiot
  suoraan `getSource('cells').setData`an. Se ohittaa `cellsToGeoJson`in, `cell-marks`- ja
  `cell-arcs`-lähteet, rakennusikonit ja React-renderöinnin — eli juuri sen, mikä on hidasta.
- Mikään testi ei laske, **kuinka usein** karttaa päivitetään. Katselmointi 2026-09-28
  löysi, että koko alue rakennetaan uudelleen noin 3–4 kertaa sekunnissa kävellessä
  (ks. `BRDC-PERF-002`). Yksikään testi ei olisi huomannut sitä.
- Monen omistetun heksan seedaus on kopioitu kolmeen speciin (`sigil.spec.ts:67-99`,
  `lands.spec.ts:74`, `diplomacy.spec.ts:83`), ja kukin lataa h3-js:n **CDN:stä** sivun sisällä.
- Oikealla puhelimella ei ole tapaa tuottaa 1 000 heksan valtakuntaa ilman tuntien kävelyä.

## 🟢 GREEN

- [ ] Jaettu e2e-apuri `e2e/seedRealm.ts` generoi solut Nodessa (`@es3/core/geo`, kuten
      `encounter.spec.ts`) ja kirjoittaa ne IndexedDB:n `es3/kv`-storeen avaimella
      `cell:<res6>:<h3>`. Kolme kopiota korvattu sillä, ei CDN-tuontia
- [ ] `e2e/perf-map.spec.ts` ajaa mobile-360-projektissa CDP:n 4× CPU-hidastuksella,
      1 027 (r = 18) ja 5 000 heksalla, ja mittaa:
  - [ ] `sourcedata`-tapahtumat (`sourceDataType === 'content'`) lähdettä kohden 20 s
        kävelyn aikana (1 Hz fixit, `context.setGeolocation`)
  - [ ] longtaskit (`PerformanceObserver`), summa ja pisin
  - [ ] rAF-kuva-ajan p95 panoroinnin aikana
- [ ] Luvut tulostetaan testin lokiin, ja baseline kirjataan tähän tikettiin
      (Todennus-osio). Budjetit asetetaan vasta baselinen jälkeen
- [ ] Dev-only-painike "Debug · seed 1000 hexes" asetusvalikossa
      (`features/dev/seedRealm.ts` → `IdbStore`) puhelintestejä varten. Ei näy
      tuotantobuildissa

## Todennus

_Baseline kirjataan tähän, kun spec on ajettu._

## Ei tässä

- Mitään korjauksia. Tämä tiketti vain mittaa (korjaukset: `BRDC-PERF-002…004`)
- Oikean puhelimen akkumittaus — se kuuluu `BRDC-MOBILE-001`:n ulkoporttiin
