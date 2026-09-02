# BRDC-DWELL-002 — Dwell-kello ei hyppää GPS-hälystä

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | S (puoli päivää) |
| **Riippuvuudet** | BRDC-DWELL-001, BRDC-PERSIST-002 |
| **Status** | `done` — 2026-09-02 (v0.5.8), kenttätodennus `[~]` |
| **Valmius** | 85 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"Koitin kukkulalla odotella että ruudusta tulisi temppeli, mutta jonkun
refreshin jälkeen 1.4 tuntia muuttuikin 6 minuutiksi."*

Pelaaja seisoi paikallaan tunnin ja neljäkymmentä minuuttia — juuri sen mitä
`BRDC-DWELL-001` pyytää — ja lukema nollautui melkein alusta. Se on pahin mahdollinen
bugiluokka tässä pelissä: **se rankaisee juuri siitä tekemisestä, jota mekaniikka pyytää**,
ja se maksaa pelaajan oikeaa aikaa ulkona.

## Juurisyy — luettu koodista, ei arvattu

**Dwell ei katoa.** `planWalk` (`data/walking.ts`) lataa `K.dwell`-kartan ja kasaa sen
päälle (`let dwell = context.dwell`), `walkWriter.ts` kirjoittaa takaisin. Kertymä on
oikein ja pysyvä.

**Vika on attribuutiossa.** Res 11 -solu on ~46 m leveä. Seisovan pelaajan GPS-fixit
(±8–50 m) pomppivat naapuriheksaan ja takaisin. `accrueDwell` krediittaa jokaisen fixin
*edellisen* solun mukaan ilman jitter-sietoa, joten 1,4 h hajoaa 2–3 heksaan. Sama koski
`standingOn`ia (`MapView`, `cellAt(point)`): reloadin jälkeinen ensimmäinen fix osui
naapuriin → `getDwellFor(standingOn)` näytti sen ~6 min, ei alkuperäisen solun 1,4 h.
`BRDC-DWELL-001` osasi jo kysyä "pysyitkö paikallasi", muttei sietänyt vierekkäisten
heksojen välistä nykimistä paikallaan seistessä. Jälkipisteillä on `CONSOLIDATE_RADIUS_M`;
dwellillä ei ollut vastaavaa.

## 🟢 GREEN

- [x] **Toistava testi** (`dwell.test.ts`): A/B-jitter 10 s välein 90 min → kaikki aika
      solulle A, B saa 0. Lisäksi `stickyDwell`-yksikkötestit: pysyy paikallaan, committaa
      naapuriin `DWELL_MOVE_CONFIRM_MS` jälkeen, committaa heti kokonaisen solun päähän,
      ei pidättele liikkeessä. 851 vihreää.
- [x] **`stickyDwell(anchor, raw, t, stationary)`** puhtaana funktiona `rules/dwell.ts`:ssä
      + `DWELL_MOVE_CONFIRM_MS` / `DWELL_JITTER_GAP_MS` / `STILL_SPEED_MS` `constants.ts`:iin.
      `planWalk` folddaa raa'at fixit sen läpi → `accrueDwell` efektiivisellä solulla.
      Kasvu ja `steps[].h3` pysyvät raa'assa solussa (jitter ei valtaa naapuria).
- [x] **Sauma reloadin yli:** `WalkPlan.lastReading` = viimeinen efektiivinen reading;
      `walkWriter` kirjoittaa `K.lastReading`in siitä, ei raa'asta `steps[last].h3`:sta.
- [x] **`useStandingCell(point, pace)`** (`features/map/`): sama `stickyDwell`-sääntö,
      `stationary = pace < STILL_SPEED_MS`. `MapView` `standingOn` käyttää sitä →
      `getDwellFor(standingOn)` palauttaa nyt oikean solun ilman muutosta itse metodiin.
- [x] `pnpm test && typecheck && lint:lines && build` vihreä.
- [~] **Kenttätodennus:** seiso oikealla GPS:llä 20+ min → lukema ei hyppää; reload kesken
      → sama solu, sama kertymä. Ajetaan seuraavana testipäivänä.

## Ei tässä

- Dwell-kynnysten säätö. Tämä korjaa attribuution, ei numeroita.
- Jitterin esto **kasvulle** — `growInto`illa on omat vartijansa; oma tikettinsä jos kenttä
  osoittaa naapureiden valtautuvan kohinasta.
- Taustaseuranta lukitussa puhelimessa — `BRDC-VIGIL-002`.

## Ei tässä

- Dwell-kynnysten säätö. Tämä korjaa kellon, ei numeroita.
- Taustaseuranta lukitussa puhelimessa — `BRDC-VIGIL-002`.
