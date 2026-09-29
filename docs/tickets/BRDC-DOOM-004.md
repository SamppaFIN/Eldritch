# BRDC-DOOM-004 — The Reckoning: kaikki yhtä vastaan

| | |
|---|---|
| **Alue** | `apps/worker/src/reckoning.ts, packages/core/src/rules/reckoning.ts, features/reckoning` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | L |
| **Riippuvuudet** | DOOM-001, DOOM-002, PROG-006, PROG-007 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-season.pdf (S2, "How a season ends")` |
| **Status** | `done` — 2026-09-29; porttien paraneminen ja Seal-vahinko [~] |

## 🔴 RED

Kaudella ei ole loppua. Dokumentti: Doom 13 tai päivä 39 → 72 h, jaettu HP `900×activeRealms`, jokainen avoin portti parantaa 1 %/h; Strike (Fight-testi) / Seal / Rite; Fortress lisää vahvuutensa, Cathedral tuplaa riitit. Quiet ×1.2 tai Risen.

**Päätös Infiniteltä (2026-09-29):** boss kyllä, faktiot myöhemmin.

## 🟢 GREEN

- [x] (`POST /season/strike` {realm, damage}: vain Reckoningin aikana, ≤ 2000/kutsu, 1 isku / 20 min / valtakunta; `GET /season/reckoning` HP + jokaisen valtakunnan vahinko; `damageBoss` + `advanceSeason` → Quiet kun HP 0) Worker pitää HP:n; `/reckoning/strike` validoi ja vähentää (palvelin omistaa totuuden, §6.1)
- [x] `rules/reckoning.ts`: Strike 100/onnistuminen + 50/Fortress, Rite 150 (×2 Cathedral), Lamp +25/40/60 % — **oletusluvut** (dokumentti antaa muodon, ei lukuja); Vitest 3 + `reckoning.repo.test.ts` 3. Lähettämätön vahinko jonossa (`unsent`) kunnes Worker ottaa sen
- [x] S2-ruutu: Keepin "The Reckoning" (HP-palkki, oma vahinko + sija, tunnit jäljellä, Strike/Rite, nopat); e2e mockatulla Workerilla. Alkuperäinen: S2-ruutu: HP-palkki, oma vahinko + sija, kolme toimintoa
- [~] Lopputulos: Quiet/Risen syntyy `advanceSeason`issa ✓ ja `legacyMultiplier` on olemassa (SEASON-002) ✓. **Ei vielä:** avoimet portit parantavat 1 %/h (Worker ei tiedä pelaajien paikallisia portteja) eikä Seal-vahinkoa lähetetä; "Risen: Keep 2 renkaan sisällä portista = fallen" siirtyy SEASON-003:n tilinpäätökseen; Risen: Keep 2 ringin sisällä avoimesta portista = fallen
- [x] Admin voi käynnistää käsin (`POST /season/phase` reckoning, SEASON-002) (kauden pituus ei lukittu)
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build (1898)

## Todennus

Vitest + wrangler dev: kaksi selainta lyö samaa bossia.

## Ei tässä

Faktiot.
