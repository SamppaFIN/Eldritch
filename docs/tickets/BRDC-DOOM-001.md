# BRDC-DOOM-001 — Doom-rata ja Mythos-kortti

| | |
|---|---|
| **Alue** | `packages/core/src/rules/doom.ts, apps/worker/src/doom.ts, home screen` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | SEASON-002 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-season.pdf (S1), Eldritch-pelin uusi design systeemi/Eldritch-Progression.pdf (LAW IV, Doom Track, Mythos Card)` |
| **Status** | `todo` |

## 🔴 RED

Kaudella ei ole kelloa jonka kaikki näkevät. Dokumentti: jaettu rata 0→13, +1 joka kolmas aamunkoitto, +1 jokaisesta 48 h auki olleesta portista; klo 06 kortti koko serverille (otsikko + 24 h sääntö, voi avata portin).

## 🟢 GREEN

- [ ] Worker pitää radan ja kortin (opportunistinen kirjoitus kuten season.ts)
- [ ] `MYTHOS`-pakka (sääntöefektit: mana −1, Will −1 die, …)
- [ ] Kotiruutu: THE DOOM TRACK n/13, varoitukset Doomista 9, OPEN GATES nearest first (S1)
- [ ] Vitest radan laskennalle
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

Vitest + wrangler dev käsin.

## Ei tässä

Portit itse (DOOM-002).
