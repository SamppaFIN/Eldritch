# BRDC-MAP-008 — Tuotto kartalla, Civ-tyyliin

| | |
|---|---|
| **Alue** | `features/territory/yieldLayer.ts`, `CELL_MARK_SOURCE` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | M |
| **Riippuvuudet** | YIELD-001 |
| **Lähde** | Infiniten handoff 2026-10-05, F-11 |
| **Status** | `todo` |

## 🔴 RED

Kartta ei kerro, mitä heksa tuottaa; se pitää avata.

## 🟢 GREEN

- [ ] `symbol`-layer heksan keskipisteeseen, `minzoom YIELD_OVERLAY_MINZOOM = 16` (vakio)
- [ ] Ikoni + luku per resurssi (`format` + `addImage`-ikonit SVG:stä), data `getYields().totals`
- [ ] Kytkin kartalla, tila muistetaan (`Settings`)
- [ ] Päivittyy kun rakennus tai työntekijä muuttuu
- [ ] Ei FPS-pudotusta 200 näkyvällä heksalla (perf-map)
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

HTML-markerit.
