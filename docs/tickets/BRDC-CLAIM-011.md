# BRDC-CLAIM-011 — Jo omistettu maa ei näy ennen ensimmäistä askelta, ja e2e kävelee sen

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | S (yksi juurisyy + e2e-kattavuus, jota CLAIM-009:ssä ei ollut) |
| **Riippuvuudet** | BRDC-CLAIM-009 |
| **Status** | `done` (v0.5.25) |
| **Valmius** | 100 % |
| **Lähde** | Infinite, kenttähavainto 2026-09-03: *"ruudulle ei tullut saatujen heksojen detailsseja"* + *"tehdään myös playwright testit millä voit simuloida pelin testausta"* |

## 🔴 RED

Uuden pelin alussa dev-serverillä: kartalla ei näy yhtään heksaa, warded-luku on `—`,
ja `FirstLook` roikkuu ruudulla. Kävelet uusiin heksoihin, ne **kirjoittuvat storeen**
(XP, pouch, loki), mutta kartta ja HUD pysyvät tyhjinä kunnes jokin muu asia sattuu
päivittämään ne.

**Juurisyy.** `useTerritory.refresh()` (lukee `getCells` + `getOwnedCells` Reactiin) on
ainoa asia joka täyttää `cells`/`owned`. Sitä kutsutaan vain:

- `attempt()`:n lopussa — mutta CLAIM-009 lisäsi `if (!repository || !runId ||
  !loopClosure) return;` sen alkuun, joten lenkki pois päältä `attempt()` palaa ennen
  `refresh()`iä;
- rappeutumispyyhkäisystä — vain `if (sweep.released.length > 0)`;
- askel-valtauksen `onChanged` → `syncHud` → `refreshTerritory` — eli **vasta kun
  ensimmäinen askel on jo vallannut jotain**.

Ennen CLAIM-009:ää lenkki oli oletus, `attempt()` ajoi joka reittieräpätkällä ja kutsui
`refresh()`in ehdoitta lopussa — kartta pysyi täytettynä. CLAIM-009:n `|| !loopClosure`
-vartija tappoi sen. Palaava pelaaja avasi tyhjän kartan; uusi pelaaja ei nähnyt Hearthin
rengasta ennen kuin käveli sen ohi.

**Toissijaisesti** (`claim.spec.ts` rivit 77–92 varoittaa tästä luokasta lenkkipolulla):
`useDiscovery` piti `alive`-lippua ja nollasi sen cleanupissa. Askel-valtaus on kirjoitus
joka on jo tapahtunut kun lupaus täyttyy; jos `standingOn` vaihtuu lennossa (nopea
kävely, rajajitteri), valmis valtaus putosi ilman modaalia ja ilman HUD-päivitystä.

## 🟢 GREEN

- [x] **`useTerritory` lukee jo omistetun maan sisään.** Uusi efekti kutsuu `refresh()`
      kun `refresh` (siis `bbox`), `home` tai `runId` muuttuu. `refresh` no-oppaa ilman
      `bbox`ia, joten se osuu heti kun kartalla on näkymä. Hearthin rengas ja palaavan
      pelaajan koko kartta ovat ruudulla ennen ensimmäistä askelta.
- [x] **`useDiscovery` sitoo valmiin valtauksen aina, kerran.** `alive`-lippu ja cleanup
      pois. Dedupe `claimed`-setillä, `inFlight`-setti estää StrictModen/jitterin toisen
      `claimStep`-kutsun. Päätöslogiikka puhtaaksi funktioksi `nextDiscovery(result,
      seen)` + yksikkötesti (`useDiscovery.test.ts`, 3).
- [x] **`DiscoveryModal`in auto-sulkeutuminen viritetään `shown`sta**, ei samasta
      efektistä kuin `setShown`/`playChime` — StrictModen ajo virittää sen uudelleen sen
      sijaan että jättäisi modaalin auki.
- [x] **`step-claim.spec.ts` (uusi e2e), lenkki pois (oletus), 5 testiä ×
      mobile-360 + desktop:**
  - [x] Uusi peli näyttää Hearthin renkaan (`warded ≥ 7`, `cells` kartalla ≥ 7) ennen
        askelta.
  - [x] Renkaan ohi käveleminen nostaa *"New ground"* -ruudun (napit *Reveal what it
        holds*, *Open its card*), joka sulkeutuu itsestään.
  - [x] Yhdeksän peräkkäistä askelta: warded-luku seuraa jokaista (≥ 4 kirjautui,
        loppusumma ≥ start+4).
  - [x] *"Open its card"* avaa `CellPanel`in; *"Reveal this ground"* vaihtuu tier-riviksi.
  - [x] Karttaa napauttamalla avautuu `CellPanel` kun maata on piirretty vähän
        (CLAIM-009:n klikkausregressio).
- [x] StrictMode todennettu erikseen dev-serveriä vasten (heittotesti): renkaan ohi
      käveleminen nostaa ruudun ja liikuttaa lukua siellä missä `main.tsx` ajaa
      `<StrictMode>`ssa.
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` vihreä. `pnpm build` vihreä.
      `pnpm --filter @es3/game e2e step-claim` vihreä (10/10).

## Toteutus

`useTerritory.ts`: efekti `[refresh, home, runId]`. `useDiscovery.ts`: `nextDiscovery`
vietiin ulos, `alive`/cleanup poistettiin, `inFlight` lisättiin. `DiscoveryModal.tsx`:
yksi efekti kahdeksi. E2e nojaa `hearth.ts`:n `openMap`iin, kävelee pohjoiseen 45 m/fixi
(yksi res-11 solu per askel, 6,4 m/s), `mode: 'serial'` ettei rinnakkaisajo sekoita
5 s GPS-kelloa ja 4,5 s itsestään sulkeutuvaa ruutua.

## Ei tässä

- Lenkin opetus takaisin, modaalin frekvenssin porrastus — `BRDC-CLAIM-010`.
- `useTerritory`n `refresh()` joka `bbox`-muutoksella on hyväksytty hinta: se on
  harvempaa kuin CLAIM-009:ää edeltänyt "joka reittieräpätkä". Jos panorointi osoittautuu
  ongelmaksi, se on oma tikettinsä.
- Dev-serverin oma e2e-projekti: juurisyy on lukukerroksessa, ei StrictModessa, joten
  preview-buildin e2e kattaa saman. Ei kannata pystyttää kahta serveriä.
- **Lenkkipohjaiset e2e-spekit korjaamatta.** `claim.spec.ts`, `decay.spec.ts` ja
  `wager.spec.ts` kävelevät korttelin ja odottavat lenkkivaltausta. CLAIM-009 teki
  `loopClosure`sta oletuksena `false` päivittämättä näitä, joten ne ovat punaisella jo
  `367f8ca`:ssa — ei tämän tiketin tuomaa. Korjaus (spekit kytkevät asetuksen päälle tai
  siirtyvät askel-valtaukseen) on oma siivoustikettinsä.
