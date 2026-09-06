# BRDC-HEX-002 — Heksa kertoo montako kertaa siellä on käyty

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | S |
| **Riippuvuudet** | BRDC-HEX-001, BRDC-DWELL-002 |
| **Status** | `done` (2026-09-06) |
| **Valmius** | 100 % |
| **Lähde** | Infinite, kenttätesti 2026-09-06: *"Haluan, että heksalla näkyy montako kertaa olet siellä käynyt (eri kerroilla).. layline trigeröi counteria"* |

## 🔴 RED

Solu tietää jo `visitDays`in (kalenteripäivät, päiväbonuksen pohja) ja `ownedDays`in
(uskollisuus), mutta kumpikaan ei vastaa kysymykseen jonka pelaaja kysyy seistessään
omalla heksallaan: *montako erillistä kertaa olen käynyt täällä?* Viisi käyntiä saman
päivän aikana on `visitDays`ille yksi.

Naiivi laskuri — kasvata joka GPS-fixillä — olisi väärä kahdesti: paikallaan seisova
puhelin tikittäisi ikuisesti, ja `stickyDwell`in (`BRDC-DWELL-002`) absorboima
heksojen välinen jitter laskettaisiin edestakaisin kävelyksi.

## 🟢 GREEN

- [x] **`Cell.visits?: number`** (`types/domain.ts`). Additiivinen, ei migraatiota —
      puuttuva arvo tarkoittaa "ei vielä laskettu", ei "nolla käyntiä".
- [x] **`recordVisit(cell)`** (`rules/growth.ts`) — puhdas, ei mutatoi syötettä.
      Kutsuja päättää *milloin* soluun on saavuttu; tämä vain kasvattaa.
- [x] **`planWalk` laskee saavumiset** (`data/walking.ts`): `lastSettled` seuraa
      **settlattua** solua, ei raakaa — juuri se tekee laskurista jitter-immuunin.
      Siemenenä `context.previous?.h3`, joten kymmenen sekunnin flush kesken seisomisen
      ei keksi toista käyntiä. Bumppaus **kasvun jälkeen**: `resolveCapture` rakentaa
      valtauksessa uuden olion kentät erikseen ja pudottaisi laskurin jos järjestys
      olisi toisin päin.
- [x] **Näkyy heksakortilla**: `cell-panel__owner` → *"Yours · 12 visits"*. Ei uutta
      CSS-luokkaa (`cell-panel.css` on 397/400).
- [x] **Testit** (`data/visits.test.ts`, 6 kpl): `recordVisit` aloittaa ykkösestä eikä
      mutatoi · 200 fixiä paikallaan = 1 käynti · pois ja takaisin = 2 · suora kävely ei
      laske samaa heksaa kahdesti · batchin sauma ei keksi käyntiä.
- [x] `pnpm test` (980) `&& typecheck && lint:lines` vihreät.

## Vaikutus

- Laskuri kirjautuu vain soluihin jotka ovat tallessa — omat, ja rappion vapauttamat
  joilla on yhä tietue. Vieraalla maalla kävely ei kirjaa mitään, koska `growInto`
  palauttaa `cell: null` eikä solua synny. Sama omistajakeskeinen rajaus kuin
  `visitDays`illa.
- Jitterin takia yksittäinen läpikuljettu heksa voi jäädä laskematta: se ehti raaka-
  soluksi muttei koskaan settlatuksi. Se on tarkoitus — vaihtoehto on laskea seisominen
  kävelyksi.

## Ei tässä

- Käyntihistoria aikaleimoineen. Yksi luku riittää; `history` kantaa jo omistajanvaihdot.
- Käyntien palkitseminen. `visitDays` maksaa päiväbonuksen, tämä on lukema.
