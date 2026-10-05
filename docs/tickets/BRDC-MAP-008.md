# BRDC-MAP-008 — Tuotto kartalla, Civ-tyyliin

| | |
|---|---|
| **Alue** | `features/territory/yieldLayer.ts`, `CELL_MARK_SOURCE` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | M |
| **Riippuvuudet** | YIELD-001 |
| **Lähde** | Infiniten handoff 2026-10-05, F-11 |
| **Status** | `done` — 2026-10-05 |

## 🔴 RED

Kartta ei kerro, mitä heksa tuottaa; se pitää avata.

## 🟢 GREEN

- [x] `symbol`-layer heksan keskipisteeseen, `minzoom YIELD_OVERLAY_MINZOOM = 16` (vakio)
- [x] Ikoni + luku per resurssi: kolme paikkaa (vasen/keski/oikea) kolmena symbol-layerinä yhdestä pistelähteestä (`format` ei salli datasta luettua siirtymää), `addImage`-ikonit SVG:stä, data `repository.yields.all().totals`; rivi maastomerkin alla
- [x] Kytkin kartalla (kameranapin yläpuolella) ja valikossa, tila muistetaan (`Settings.yieldOverlay`)
- [x] Päivittyy kun rakennus tai työntekijä muuttuu
- [x] perf-map vihreä 1027 ja 5000 heksalla (4× CPU); `computeHexYield` valmistelee valtakunnan osat kerran kontekstia kohden — ilman sitä `all` oli neliöllinen ja 5000 heksan ajo kaatui
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

HTML-markerit.
