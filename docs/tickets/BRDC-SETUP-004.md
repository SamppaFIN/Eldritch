# BRDC-SETUP-004 — Aloitusnäkymä "Begin the Awakening"

| | |
|---|---|
| **Vaihe** | 0 — Perustus |
| **Effort** | S (tunteja) |
| **Riippuvuudet** | BRDC-SETUP-002 |
| **Status** | `done` — 2026-08-26 |
| **Valmius** | 100 % |

## 🔴 RED

Buildattu sivu on tyhjä. Ei ole mitään, mistä näkisi että tokenit ja fontit toimivat
oikeasti selaimessa oikealla puhelimella.

## 🟢 GREEN

- [x] Tähtitaivastausta, sävytettynä `--void-black`iin
- [x] Cinzel-otsikko **"Eldritch Sanctuary"**
- [x] Lasipaneeli (`--glass-bg`, `--glass-border`) jossa painike **"Begin the Awakening"**
- [x] Painike on vähintään `--touch-min` korkea ja saa näkyvän `:focus-visible`-kehyksen
- [x] Tausta-animaatio pysähtyy `prefers-reduced-motion: reduce` -tilassa
- [x] 360 px viewportilla mikään ei mene päällekkäin eikä leikkaudu
- [x] Painike ei tee vielä mitään — se on tarkoituksellista

## Toteutus

Tämä on **tokeniston savutesti**, ei ominaisuus. Sen tehtävä on todistaa että
`tokens.css` toimii oikeassa selaimessa oikealla puhelimella ennen kuin sen päälle
rakennetaan mitään.

Tähtitaivas: CSS-gradientti + muutama animoitu pseudo-elementti. **Ei canvasia,
ei WebGL:ää, ei kirjastoa.**

## Testit

- [x] Playwright: sivu latautuu, otsikko näkyy, painike on fokusoitavissa näppäimistöllä
- [x] Playwright-viewport **360 px ajetaan ensin**
- [x] Kontrastitarkistus: otsikko ja painiketeksti läpäisevät WCAG AA:n

## Ei kuulu tähän tikettiin

Kirjautuminen, profiili, reititys pelinäkymään. Painike aktivoituu BRDC-MAP-001:ssä.

## Lähde

`PROMPTS.md` Vaihe 0
