# BRDC-MAP-009 — Asukas näkyy työpaikallaan

| | |
|---|---|
| **Alue** | `features/territory/citizenLayer.ts` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | S |
| **Riippuvuudet** | PROG-002 |
| **Lähde** | Infiniten handoff 2026-10-05, F-12 |
| **Status** | `done` — 2026-10-05 |

## 🔴 RED

Miehitys näkyy vain kortilla; kartalla ei näe, missä väki on töissä.

## 🟢 GREEN

- [x] Ukkeli-ikoni miehitetyllä heksalla, useampi → ikoni + luku
- [x] Kaksi framea, yksi ajastin koko layerille (`icon-image`), ei per-heksa DOMia
- [x] Tauko kun sivu piilossa tai `prefers-reduced-motion`
- [x] Näkyy hieman ennen MAP-008:aa (zoom 15.5), heksan vasemmassa yläkulmassa; `keep.handsByHex` (kevyt luku ilman settleä); miehitys kortilta päivittää kartan heti (`CellStaff.onChanged` → sama uudelleenluku kuin rakentamisessa). e2e `keep-citizens.spec.ts` (kun Keepin siemennys pitää — vanha kilpailutilanne)
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

Nimetyt asukkaat.
