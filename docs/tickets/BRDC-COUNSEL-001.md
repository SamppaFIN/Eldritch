# BRDC-COUNSEL-001 — Pitäjän neuvo: peli selittää itsensä

| | |
|---|---|
| **Alue** | `packages/core/src/rules/counsel.ts, features/counsel` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | PROG-001…008, DOOM-002 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-Progression.pdf (P6, COUNSEL PRIORITY)` |
| **Status** | `done` — 2026-09-29; CTA-napit navigoimaan [~] |

## 🔴 RED

Peli ei kerro mitä tehdä seuraavaksi, ja Vaihe 3:n portti vaatii että peli selittää itsensä. Dokumentti: prioriteettilista 01–08 (Starving … Nothing urgent), ensimmäinen tosi voittaa; "first time you see it" -codexkortit.

## 🟢 GREEN

- [x] `counselOf(state)` puhtaana funktiona, dokumentin 8 sääntöä järjestyksessä (+ Vitest 4); `data/counselStore.ts` kerää tilan (aitta, portit, varastot, tyhjät työt, Lore, masterwork yhden puutteen päässä), `repository.keep.counsel`
- [~] P6: Keepin yläosan "The Keeper's Counsel" (`KeepCounsel.tsx`: "1 of N", After that, kertoo missä vastaus on) ✓; **CTA ei avaa toista ruutua** (Keep ei voi avata Researchia tai heksakorttia) — neuvo nimeää paikan
- [x] Codexkortit (4: citizens, hands, lore, doom) Keepissä, "Got it" merkitsee luetuksi `K.codexRead`iin, joka on `FOREVER_KEYS`issä (Vitest: säilyy kauden vaihdon yli)
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build (1923); e2e keep-citizens + season-gate 28/28

## Todennus

Vitest + e2e.

## Ei tässä

—
