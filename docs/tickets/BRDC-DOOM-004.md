# BRDC-DOOM-004 — The Reckoning: kaikki yhtä vastaan

| | |
|---|---|
| **Alue** | `apps/worker/src/reckoning.ts, packages/core/src/rules/reckoning.ts, features/reckoning` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | L |
| **Riippuvuudet** | DOOM-001, DOOM-002, PROG-006, PROG-007 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-season.pdf (S2, "How a season ends")` |
| **Status** | `todo` |

## 🔴 RED

Kaudella ei ole loppua. Dokumentti: Doom 13 tai päivä 39 → 72 h, jaettu HP `900×activeRealms`, jokainen avoin portti parantaa 1 %/h; Strike (Fight-testi) / Seal / Rite; Fortress lisää vahvuutensa, Cathedral tuplaa riitit. Quiet ×1.2 tai Risen.

**Päätös Infiniteltä (2026-09-29):** boss kyllä, faktiot myöhemmin.

## 🟢 GREEN

- [ ] Worker pitää HP:n; `/reckoning/strike` validoi ja vähentää (palvelin omistaa totuuden, §6.1)
- [ ] Vahinkokaavat ja kertoimet puhtaina funktioina + Vitest
- [ ] S2-ruutu: HP-palkki, oma vahinko + sija, kolme toimintoa
- [ ] Lopputulos → SEASON-003:n kerroin; Risen: Keep 2 ringin sisällä avoimesta portista = fallen
- [ ] Admin voi käynnistää käsin (kauden pituus ei lukittu)
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

Vitest + wrangler dev: kaksi selainta lyö samaa bossia.

## Ei tässä

Faktiot.
