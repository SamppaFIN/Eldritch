# BRDC-FX-004 — SVG-animaatiot

| | |
|---|---|
| **Alue** | DOM-SVG + kartan layerit |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | M |
| **Riippuvuudet** | ART-007 |
| **Lähde** | Infiniten handoff 2026-10-05, F-51 |
| **Status** | `todo` |

## 🔴 RED

Merkittävät hetket ovat staattisia.

## 🟢 GREEN

- [ ] CSS-animaatiot DOM-SVG:lle (`transform`, `opacity`, `stroke-dashoffset`): sinetin lyönti, Keepin sigillit, asukas listassa
- [ ] Kartalla (GL-spritet eivät ota CSS:ää) temppelin hehku ja anomalian pulssi yhdellä paint-ajastimella per layer
- [ ] `prefers-reduced-motion` → pois; tauko kun piilossa; ei mittavaa idle-kuormaa
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

SMIL, JS-silmukat ikoneille.
