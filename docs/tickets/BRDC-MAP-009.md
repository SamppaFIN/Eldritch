# BRDC-MAP-009 — Asukas näkyy työpaikallaan

| | |
|---|---|
| **Alue** | `features/territory/citizenLayer.ts` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | S |
| **Riippuvuudet** | PROG-002 |
| **Lähde** | Infiniten handoff 2026-10-05, F-12 |
| **Status** | `todo` |

## 🔴 RED

Miehitys näkyy vain kortilla; kartalla ei näe, missä väki on töissä.

## 🟢 GREEN

- [ ] Ukkeli-ikoni miehitetyllä heksalla, useampi → ikoni + luku
- [ ] Kaksi framea, yksi ajastin koko layerille (`icon-image`), ei per-heksa DOMia
- [ ] Tauko kun sivu piilossa tai `prefers-reduced-motion`
- [ ] Näkyy samalla zoomilla kuin MAP-008
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

Nimetyt asukkaat.
