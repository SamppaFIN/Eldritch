# BRDC-PERF-001 — Kartan suorituskyky mitataan oikeaa polkua pitkin

| | |
|---|---|
| **Alue** | `apps/game/e2e/`, `features/dev/`, `features/territory/` (vitest) |
| **Vaihe** | Läpileikkaava — kartan suorituskyky |
| **Effort** | M |
| **Riippuvuudet** | BRDC-SCALE-001 (sen perftestin puute), BRDC-E2E-001 |
| **Status** | `done` — ajettu ja todennettu 2026-09-28 |
| **Valmius** | 100 % |
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

- [x] Jaettu e2e-apuri `e2e/seedRealm.ts` generoi solut Nodessa (`@es3/core/geo`, kuten
      `encounter.spec.ts`) ja kirjoittaa ne IndexedDB:n `es3/kv`-storeen avaimella
      `cell:<res6>:<h3>`, yhdessä transaktiossa. `sigil`- ja `lands`-specien kopiot on
      korvattu sillä. `diplomacy.spec.ts` ei seedannut, vaan haki h3-js:n CDN:stä laiturin
      keskipisteen laskemiseen: se lasketaan nyt Nodessa (`cellCentre(cellAt(QUAY))`).
      Yhtään CDN-tuontia ei ole jäljellä
- [x] `e2e/perf-map.spec.ts` ajaa mobile-360-projektissa CDP:n 4× CPU-hidastuksella,
      1 027 (r = 18) ja 5 000 heksalla, ja mittaa:
  - [x] `sourcedata`-tapahtumat (`sourceDataType === 'content'`) lähdettä kohden 20 s
        kävelyn aikana (1 Hz fixit, `context.setGeolocation`, 1,4 m/s omalla maalla)
  - [x] longtaskit (`PerformanceObserver`): yli 50 ms määrä, summa ja pisin
  - [x] rAF-kuva-ajan p95 ja maksimi 5 s edestakaisen panoroinnin aikana
- [x] Luvut tulostuvat lokiin (`PERF {...}`) ja liitteenä (`perf-<koko>.json`). Baseline
      alla. Spec ei vielä aseta rajoja
- [x] Dev-only-painike "Debug · seed 1000 hexes" asetusvalikon dev-osiossa
      (`features/dev/seedRealm.ts`, suoraan IndexedDB:hen yhdessä transaktiossa, sitten
      sivun uudelleenlataus). Todennettu, ettei merkkijono päädy tuotantobuildin
      `dist/assets`iin

## Todennus

**Baseline 2026-09-28**, `main` @ `07d327d` (v0.6.63), mobile-360, 4× CPU, yksi worker:

| | 1 027 heksaa | 5 000 heksaa |
|---|---:|---:|
| `content`-tapahtumat / 20 s kävely | cells 13 · cell-marks 13 · cell-arcs 13 | cells 5 · cell-marks 5 · cell-arcs 5 · work-icons 2 |
| longtaskit > 50 ms | 66 | 23 |
| longtaskit yhteensä | **19,2 s / 20 s** | **15,0 s / 20 s** |
| pisin longtask | 1 043 ms | 2 692 ms |
| panorointi: kuvia 5 s:ssa | 12 | 20 |
| panorointi: kuva-ajan p95 | **833 ms** | **2 233 ms** |

Luku kertoo saman kuin katselmointi: pääsäie on kävellessä lähes koko ajan varattu, ja
kaikki kolme lähdettä lähetetään uudelleen joka kerta yhdessä. 5 000 heksalla tapahtumia on
vähemmän vain siksi, että yksi uudelleenrakennus kestää pidempään (pisin 2,7 s).

Huom: HUD:n Warded-luku jää hieman alle seedatun (4 967–4 998 / 5 000), koska mock-rivaalit
pitävät muutaman solun Hearthin lähellä. Spec hyväksyy 90 %.

## Ei tässä

- Mitään korjauksia. Tämä tiketti vain mittaa (korjaukset: `BRDC-PERF-002…004`)
- Oikean puhelimen akkumittaus — se kuuluu `BRDC-MOBILE-001`:n ulkoporttiin
