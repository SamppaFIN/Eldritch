# BRDC-DOOM-001 — Doom-rata ja Mythos-kortti

| | |
|---|---|
| **Alue** | `packages/core/src/rules/doom.ts, apps/worker/src/doom.ts, home screen` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | SEASON-002 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-season.pdf (S1), Eldritch-pelin uusi design systeemi/Eldritch-Progression.pdf (LAW IV, Doom Track, Mythos Card)` |
| **Status** | `done` — 2026-09-29; kortin sääntöefektit ja kartan varoitus [~] |

## 🔴 RED

Kaudella ei ole kelloa jonka kaikki näkevät. Dokumentti: jaettu rata 0→13, +1 joka kolmas aamunkoitto, +1 jokaisesta 48 h auki olleesta portista; klo 06 kortti koko serverille (otsikko + 24 h sääntö, voi avata portin).

## 🟢 GREEN

- [x] (Doom johdetaan puhtaasti: `doomAt(season, now)` = aamunkoitot ÷ `doomEveryNDawns` + `doomShift`, 0…13; `advanceSeason` kantaa sen ja herättää Reckoningin 13:ssa. Aamunkoittokello on **valinnainen** kauden asetus (`/season/open` `doomEveryNDawns`), koska Infinite jätti kauden pituuden auki; Mythos-kortti = hash(siemen, aamunkoitto) — sama kaikille ilman Worker-kirjoitusta) Worker pitää radan ja kortin (opportunistinen kirjoitus kuten season.ts)
- [~] `MYTHOS`-pakka 10 korttia ✓; säännöistä yksikään ei vielä vaikuta peliin (odottavat noppia, portteja, vihjeitä, päiväsääntöjä) ja kortti sanoo sen. Alkuperäinen: `MYTHOS`-pakka (sääntöefektit: mana −1, Will −1 die, …)
- [~] Keep-paneelin "The Doom track" (kauden nimi, n/13, palkki, varoitus Doom 9:stä, päivän kortti) ✓ + e2e mockatulla `/season`illa. **Ei vielä:** varoitus kartan päällä (MapView 397/400) ja OPEN GATES -lista (DOOM-002). Alkuperäinen: Kotiruutu: THE DOOM TRACK n/13, varoitukset Doomista 9, OPEN GATES nearest first (S1)
- [x] Vitest (`doom.test.ts` 5)
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

Vitest + wrangler dev käsin.

## Ei tässä

Portit itse (DOOM-002).
