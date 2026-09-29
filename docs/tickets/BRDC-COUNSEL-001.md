# BRDC-COUNSEL-001 — Pitäjän neuvo: peli selittää itsensä

| | |
|---|---|
| **Alue** | `packages/core/src/rules/counsel.ts, features/counsel` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | PROG-001…008, DOOM-002 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-Progression.pdf (P6, COUNSEL PRIORITY)` |
| **Status** | `todo` |

## 🔴 RED

Peli ei kerro mitä tehdä seuraavaksi, ja Vaihe 3:n portti vaatii että peli selittää itsensä. Dokumentti: prioriteettilista 01–08 (Starving … Nothing urgent), ensimmäinen tosi voittaa; "first time you see it" -codexkortit.

## 🟢 GREEN

- [ ] `counselOf(realm)` puhtaana funktiona, 8 sääntöä + Vitest
- [ ] P6-ruutu: 1 of 3, CTA-nappi toimii
- [ ] Codexkortti ensimmäisellä näkemällä; luettu-tila `forever`-avaimessa
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

Vitest + e2e.

## Ei tässä

—
