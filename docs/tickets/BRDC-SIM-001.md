# BRDC-SIM-001 — GPS-simulaattori ja reittifixturet

| | |
|---|---|
| **Vaihe** | 1 — Kartta ja ley-line |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-GEO-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |

## 🔴 RED

Aluevaltauspeliä ei voi kehittää, jos jokainen testi vaatii ulos kävelemistä. Ilman
simulaattoria lenkin tunnistusta (BRDC-CLAIM-001) ei pysty rakentamaan eikä testaamaan
lainkaan.

## 🟢 GREEN

- [ ] `packages/core/sim/walk.ts` tuottaa realistisen `TrailPoint[]`-sarjan:
      kävelynopeus, suunta, kuviot `straight` / `curve` / `random` / `stop`
- [ ] Simuloitu data läpäisee `acceptPoint`-suodattimen (ei ole liian täydellistä
      eikä liian huonoa)
- [ ] Konfiguroitava GPS-kohina, jotta kohinankestoa voi testata
- [ ] `packages/core/sim/fixtures/` sisältää **viisi nauhoitettua reittiä**
- [ ] Dev-buildissa WASD-näppäinohjaus liikuttaa pelaajaa kartalla
- [ ] Simulaattori ei ole mukana tuotantobundlessa

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

- [ ] Sama `seed` tuottaa täsmälleen saman reitin
- [ ] `speedMs: 1.4` tuottaa segmenttejä, jotka läpäisevät `MAX_SPEED_MS`-tarkistuksen
- [ ] `pattern: 'stop'` tuottaa pisteitä, jotka suodattuvat `consolidated`-syyllä
- [ ] Jokainen fixture latautuu ja on validia `TrailPoint[]`-dataa

## Ei kuulu tähän tikettiin

Lenkin tunnistuslogiikka (BRDC-CLAIM-001) — tämä tiketti tuottaa vain sen **syötteet**.
Playwrightin geolocation-override (BRDC-TRAIL-001).

## Lähde

`PROMPTS.md` Vaihe 1 kohta 4, Vaihe 2 kohta 1 · `files/CLAUDE.md` §Testing
