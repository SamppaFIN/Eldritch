# BRDC-SEASON-002 — Kausi on olio: vaihe, siemen ja mikä nollautuu

| | |
|---|---|
| **Alue** | `packages/core/src/rules/season.ts, apps/worker/src/season.ts, persist` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | BRDC-SEASON-001 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-season.pdf (HANDOFF season.ts, "what resets, what stays")` |
| **Status** | `todo` |

## 🔴 RED

Peli ei tiedä missä kaudessa se on. SEASON-001:n "viikkoturnaus" on liittymishetken lähtöviiva, ei kausi: kartta, rakennukset ja resurssit elävät ikuisesti. Season-dokumentti vaatii vaiheet `open → reckoning → sealed → interregnum → next`, siemenen ja tarkan listan siitä mikä nollautuu, mikä säilyy ja mikä ylittää kerran.

**Päätös Infiniteltä (2026-09-29):** kauden pituutta ei lukita — *"season kestää kunnes saadaan uusi versio tulille"*. Kausi päättyy joko Doomista (DOOM-004) tai käsin (admin-kytkin Workerissa).

## 🟢 GREEN

- [ ] `rules/season.ts`: `SeasonPhase`, `Season {n,name,seed,opensAt,reckoningAt?,sealedAt?,doom,bossHp,bossMaxHp,outcome?}`, puhtaat siirtymät + Vitest
- [ ] Worker `GET /season` + admin-kytkin (`POST /season/phase`, Worker-secret), sama KV kuin SEASON-001
- [ ] Resets / stays / crosses once koodina: `SAVE_VERSION` nousee; `es3:*`-avaimet jaettu `seasonal` vs `forever` (sigil, avatar, tittelit, reliikit, Hall of Ages, luetut codex-merkinnät)
- [ ] Siemen syöttää `terrainSeed`/`wonderPlace`/anomaliat: uusi kausi = uudet esiintymät, sama rantaviiva
- [ ] Client lukee vaiheen bootissa (`useBoot`), offline = viimeksi nähty
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

Vitest siirtymille ja resets/stays-listalle; `wrangler dev` käsin: vaiheen vaihto näkyy clientille.

## Ei tässä

Doom (DOOM-001), ruudut (SEASON-003…006), faktiot.
