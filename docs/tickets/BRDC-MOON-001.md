# BRDC-MOON-001 — Kuu ja sää

| | |
|---|---|
| **Alue** | `rules/moon.ts`, `rules/weather.ts` (WEATHER-001), `realmBonus` |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | M |
| **Riippuvuudet** | WEATHER-001 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus C3; Infinite hyväksyi kaikki |
| **Status** | `done` (2026-10-08, haara `season-3`) |

## 🔴 RED

Maailma on sama joka päivä (dark time poislukien). Oikea kuunvaihe ja sää antavat päiville luonteen ilman assetteja.

## 🟢 GREEN

- [x] Kuunvaihe lasketaan päivämäärästä (puhdas, ei verkkoa): täysikuu mana ×1,5 ja Doom +1 sinä päivänä; uusikuu anomaliat näkyvät rengas kauempaa (oletus) — `rules/moon.ts` (Meeus, kuusi termiä, ~1 h tarkkuus; testattu pimennyspäivillä); mana ×1,5 `realmBonus` + hex-rivi "Full moon"; `doomAt` +1; uusikuu: anomaliamerkki myös rajanaapureille
- [x] WEATHER-001 toteutetaan tämän mukana (sumu/kirkas/myrsky kalenterista) — ks. WEATHER-001
- [x] Farmin "Harvest Moon" -solmu kytketään oikeaan täysikuuhun — täysikuun päivänä Farm, jolla solmu, tuottaa kolminkertaisen ruoan (hex-rivi "Harvest Moon", settle lukee saman rivin)
- [x] HUD-rivi "Full moon · fog" ja hex-kortin rivit — nauhassa, napautus → Codex "Moon and Weather"
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 2088/2088, e2e `sky.spec.ts` 360 px vihreä

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Oikea sääpalvelu (verkko).
