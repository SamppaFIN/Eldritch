# BRDC-SEASON-002 — Kausi on olio: vaihe, siemen ja mikä nollautuu

| | |
|---|---|
| **Alue** | `packages/core/src/rules/season.ts, apps/worker/src/season.ts, persist` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | BRDC-SEASON-001 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-season.pdf (HANDOFF season.ts, "what resets, what stays")` |
| **Status** | `done` osin — 3/5 valmis, 2 siirretty (2026-09-29) (2026-09-29) |

## 🔴 RED

Peli ei tiedä missä kaudessa se on. SEASON-001:n "viikkoturnaus" on liittymishetken lähtöviiva, ei kausi: kartta, rakennukset ja resurssit elävät ikuisesti. Season-dokumentti vaatii vaiheet `open → reckoning → sealed → interregnum → next`, siemenen ja tarkan listan siitä mikä nollautuu, mikä säilyy ja mikä ylittää kerran.

**Päätös Infiniteltä (2026-09-29):** kauden pituutta ei lukita — *"season kestää kunnes saadaan uusi versio tulille"*. Kausi päättyy joko Doomista (DOOM-004) tai käsin (admin-kytkin Workerissa).

## 🟢 GREEN

- [x] `rules/season.ts`: `SeasonPhase`, `Season {n,name,seed,opensAt,reckoningAt?,sealedAt?,doom,bossHp,bossMaxHp,outcome?}`, puhtaat siirtymät + Vitest (7 testiä). Kauden pituus: `reckoningByDay` on valinnainen — ilman sitä vain Doom tai `forcePhase` herättää Reckoningin
- [x] Worker `GET /season` + admin-kytkin (`POST /season/phase`, Worker-secret), sama KV kuin SEASON-001 → `apps/worker/src/seasonState.ts`, `x-admin-key` = `wrangler secret put ADMIN_KEY` (ilman secretiä admin-reitit ovat pois). Vaatii Infiniten `wrangler deploy`n
- [x] Resets / stays / crosses once koodina: `data/seasonReset.ts` `FOREVER_KEYS` + `resetForSeason()`, jota myös `retireKingdom` käyttää (ennen oma `clear()`+`set`). Tänään säilyy vain `hallOfFame`; SEASON-005/006 ja COUNSEL-001 lisäävät omansa listaan. `SAVE_VERSION`in nosto tehdään v0.7.0-julkaisussa, ei nyt (nosto nollaisi Season 1 -pelaajat ennen retire-ruutua). Alkuperäinen:: `SAVE_VERSION` nousee; `es3:*`-avaimet jaettu `seasonal` vs `forever` (sigil, avatar, tittelit, reliikit, Hall of Ages, luetut codex-merkinnät)
- [~] → **siirretty SEASON-007:ään** (se nollaa maan ja tarvitsee siemenen ensimmäisenä; ihmeet eivät liiku, SEASON-008). Alkuperäinen: Siemen syöttää `terrainSeed`/`wonderPlace`/anomaliat: uusi kausi = uudet esiintymät, sama rantaviiva
- [~] Client lukee vaiheen: `apps/game/src/data/season.ts` `fetchSeason()` + testit valmiina; kytkentä bootiin ja offline-välimuisti siirtyy SEASON-004:ään, joka on ensimmäinen kuluttaja
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

Vitest siirtymille ja resets/stays-listalle; `wrangler dev` käsin: vaiheen vaihto näkyy clientille.

## Ei tässä

Doom (DOOM-001), ruudut (SEASON-003…006), faktiot.
