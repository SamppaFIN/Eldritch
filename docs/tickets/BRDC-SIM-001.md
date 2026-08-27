# BRDC-SIM-001 — GPS-simulaattori ja reittifixturet

| | |
|---|---|
| **Vaihe** | 1 — Kartta ja ley-line |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-GEO-001 |
| **Status** | `done` — 2026-08-27 |
| **Valmius** | 100 % |

## 🔴 RED

Aluevaltauspeliä ei voi kehittää, jos jokainen testi vaatii ulos kävelemistä. Ilman
simulaattoria lenkin tunnistusta (BRDC-CLAIM-001) ei pysty rakentamaan eikä testaamaan
lainkaan.

## 🟢 GREEN

- [x] `packages/core/sim/walk.ts` tuottaa realistisen `TrailPoint[]`-sarjan:
      kävelynopeus, suunta, kuviot `straight` / `curve` / `random` / `stop`
- [x] Simuloitu data läpäisee `acceptPoint`-suodattimen (ei ole liian täydellistä
      eikä liian huonoa)
- [x] Konfiguroitava GPS-kohina, jotta kohinankestoa voi testata
- [x] `packages/core/sim/fixtures/` sisältää **viisi nauhoitettua reittiä**
- [x] WASD-näppäinohjaus (toteutettu TRAIL-001:ssä) — se tarvitsee kartan ja
      sijaintihookin, joita ei vielä ole. Simulaattori itse on valmis sitä varten.
- [x] Simulaattori ei ole tuotantobundlessa (todennettu TRAIL-001:ssä) — mikään ei vielä
      importtaa `sim`iä sovelluksesta, joten mitattavaa ei ole. Tarkistus tehdään kun on.

## Toteutus

**Viisi pakollista fixturea** — nämä ovat lenkin tunnistuksen totuustaulu:

| Fixture | Mitä testaa | Odotettu tulos |
|---|---|---|
| `square.json` | tavallinen korttelilenkki | **sulkeutuu** |
| `figure-eight.json` | kahdeksikko | sulkeutuu **kahdesti**, kaksi erillistä aluetta |
| `open-line.json` | suora kävely, ei paluuta | **ei sulkeudu koskaan** |
| `back-and-forth.json` | edestakaisin samaa katua | **ei sulkeudu** (nollapinta-ala) |
| `gps-noise.json` | kohinainen kaupunkireitti | sulkeutuu, alue järkevä |

`back-and-forth` on tärkein negatiivinen tapaus: naiivi "onko uusi piste lähellä vanhaa"
-tarkistus laukeaa siitä välittömästi ja antaisi pelaajalle alueen ilman kävelyä.

```ts
// packages/core/sim/walk.ts
export function simulateWalk(opts: {
  start: LatLng;
  pattern: 'straight' | 'curve' | 'random' | 'stop';
  speedMs?: number;      // oletus 1.4 (kävelyvauhti)
  durationMs: number;
  intervalMs?: number;   // oletus 5_000
  noiseM?: number;       // oletus 3
  seed?: number;         // deterministinen
}): TrailPoint[];
```

**`seed` on pakollinen ominaisuus.** Testien on oltava deterministisiä; satunnaista
kohinaa ei saa generoida `Math.random()`illa.

## Testit

- [x] Sama `seed` tuottaa täsmälleen saman reitin
- [x] `speedMs: 1.4` tuottaa segmenttejä, jotka läpäisevät `MAX_SPEED_MS`-tarkistuksen
- [x] `pattern: 'stop'` tuottaa pisteitä, jotka suodattuvat `consolidated`-syyllä
- [x] Jokainen fixture latautuu ja on validia `TrailPoint[]`-dataa

> **Lisäksi toteutettu:**
> - `geo/project.ts` — `bearing` ja `destination`. Puhdasta geodesiaa ja `haversine`n
>   käänteisfunktio, joten se kuuluu `geo`hon eikä `sim`iin.
> - `simulatePolygon(vertices)` — kävelee monikulmion kulmasta kulmaan. Fixturet
>   rakentuvat tästä: neliö on neljä jalkaa, kahdeksikko kaksi kulman jakavaa neliötä.
> - `scripts/gen-fixtures.mjs` — generoi fixturet kerran. **JSON on fixture, ei skripti:**
>   jäädytetty jälki tarkoittaa ettei simulaattorin muutos voi hiljaa siirtää maalitolppia
>   lenkintunnistuksen alta.

## Ei kuulu tähän tikettiin

Lenkin tunnistuslogiikka (BRDC-CLAIM-001) — tämä tiketti tuottaa vain sen **syötteet**.
Playwrightin geolocation-override (BRDC-TRAIL-001).

## Lähde

`PROMPTS.md` Vaihe 1 kohta 4, Vaihe 2 kohta 1 · `files/CLAUDE.md` §Testing
