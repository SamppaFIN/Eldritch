# BRDC-SEASON-006 — Perintökalu ja uusi kausi

| | |
|---|---|
| **Alue** | `features/season (heirloom, join), packages/core/src/rules/heirloom.ts` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | SEASON-004, SEASON-005 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-season.pdf (S7, S8)` |
| **Status** | `done` — 2026-09-29; kosmeettiset reliikit, 24 h ennakko ja Keep-paikan valinta [~] |

## 🔴 RED

Uuteen kauteen liittyessä ei kerrota sääntöjä (jonossa oleva TODO) eikä mitään siirry. Dokumentti: yksi perintökalu 48 h interregnumissa (vaikutus päättyy päivänä 7), kosmeettiset reliikit pysyvät, seuraavan kauden nimi 24 h etukäteen.

## 🟢 GREEN

- [~] Neljä perintökalua (`rules/heirloom.ts`, `data/heirloomStore.ts`, `K.heirloom` FOREVER-avaimena; kulutetaan perustaessa): Foundation Stone (Keep 2), Watchman's Log (60 wisdom + Lookouts), Salt of the Shore (3 vihjettä), Birch Relic **sovitettu** (Kindling + 80 manaa, koska Season 2 omistaa koulun valtakunnalle, ei temppelille). "Päättyy päivänä 7" ei tarvita (kertaetuja); Saltin vihjekatto 10 ei toteutettu. Alkuperäinen: Neljä perintökalua (Foundation Stone, Birch Relic, Watchman’s Log, Salt of the Shore), efektit päättyvät päivänä 7
- [~] S7: valinta sinetöidyn kauden ikkunassa (`HeirloomChoice.tsx`, vaihdettavissa kunnes uusi kausi aukeaa) ✓; tittelit SEASON-005 ✓; sigil-kehys ja banneri ei vielä
- [~] S8: liittyessä "Welcome to <kauden nimi>" + "Same shoreline, new seed" ✓ (ilman faktiovalintaa); Keep-paikan valinta = nykyinen Hearth-valinta; seuraavan kauden nimi 24 h etukäteen ei vielä
- [x] Season 2:n sääntöesittely liittyessä (`SeasonIntro.tsx`, 8 lausetta < 20 sanaa; kertoo kannetun perintökalun). Liittyminen tunnistetaan: tallennus, jonka yksikään käyntipäivä ei ole ennen kauden avausta, liittyy; vanhempi retiroi
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build (1909); e2e season-gate + keep-citizens 24/24

## Todennus

e2e koko ketju: sealed → tally → boards → heirloom → uusi kausi.

## Ei tässä

Faktiot.
