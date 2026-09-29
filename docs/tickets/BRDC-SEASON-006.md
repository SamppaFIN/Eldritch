# BRDC-SEASON-006 — Perintökalu ja uusi kausi

| | |
|---|---|
| **Alue** | `features/season (heirloom, join), packages/core/src/rules/heirloom.ts` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | SEASON-004, SEASON-005 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-season.pdf (S7, S8)` |
| **Status** | `todo` |

## 🔴 RED

Uuteen kauteen liittyessä ei kerrota sääntöjä (jonossa oleva TODO) eikä mitään siirry. Dokumentti: yksi perintökalu 48 h interregnumissa (vaikutus päättyy päivänä 7), kosmeettiset reliikit pysyvät, seuraavan kauden nimi 24 h etukäteen.

## 🟢 GREEN

- [ ] Neljä perintökalua (Foundation Stone, Birch Relic, Watchman’s Log, Salt of the Shore), efektit päättyvät päivänä 7
- [ ] S7-ruutu: palkinnot (sigil frame, title, banner) + valinta
- [ ] S8-ruutu: kauden nimi, 'Same shoreline, new seed', Keep-paikan valinta, **ilman faktiovalintaa**
- [ ] Season 2:n sääntöesittely liittyessä (§14: lause < 20 sanaa)
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

e2e koko ketju: sealed → tally → boards → heirloom → uusi kausi.

## Ei tässä

Faktiot.
