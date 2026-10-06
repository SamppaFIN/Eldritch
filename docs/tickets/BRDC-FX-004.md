# BRDC-FX-004 — SVG-animaatiot

| | |
|---|---|
| **Alue** | DOM-SVG + kartan layerit |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | M |
| **Riippuvuudet** | ART-007 |
| **Lähde** | Infiniten handoff 2026-10-05, F-51 |
| **Status** | `done` — 2026-10-06 |

## 🔴 RED

Merkittävät hetket ovat staattisia.

## 🟢 GREEN

- [x] CSS-animaatiot DOM-SVG:lle (`transform`, `opacity`, `stroke-dashoffset`): sinetin lyönti (`es-stamp`, tarinan ja tehtävän sinetti), Keepin sigillit (tutkijan muotokuva piirtyy `es-draw`), asukas listassa (Ledgerin Works-rivi, `es-bob`)
- [x] Kartalla (GL-spritet eivät ota CSS:ää) temppelin hehku ja anomalian pulssi yhdellä paint-ajastimella per layer — `layerPulse.ts`: kuusi askelta / 2,4 s, ei jatkuvaa transitiota; `e2e/fx-pulse.spec.ts`
- [x] `prefers-reduced-motion` → pois; tauko kun piilossa; ei mittavaa idle-kuormaa — ajastinta ei luoda lainkaan (e2e todentaa), `document.hidden` ohittaa askeleen, ~2,5 uudelleenpiirtoa/s per kerros; CSS-animaatiot kulkevat globaalin 0,01 ms -säännön alla. **Korjattu täyden e2e-ajon jälkeen:** 5 000 heksan valtakunnassa yksi piirto kestää askelta pidempään, ja askeleet pitivät kartan kiireisenä (claim.spec: idle 8,3 s, v0.8.1:ssä 1,3 s). Nyt askel odottaa että kartta on levännyt (`idle`) edellisen jälkeen, ohittaa kerroksen jota zoom ei näytä, ja asukkaat eivät heilu kun kukaan ei ole töissä (`motionGate`) — 2,1–2,9 s. Samalla tuottokerros lasketaan vasta kun kartta on piirtynyt, ja Meedion rajantakaiset anomaliat luetaan vain Meediolle
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 1999 testiä, tsc, rivit OK, build OK

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

SMIL, JS-silmukat ikoneille.
