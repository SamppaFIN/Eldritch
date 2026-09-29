# BRDC-SEASON-004 — Kausi sinetöidään: pakotettu retire ja historia

| | |
|---|---|
| **Alue** | `features/season, features/hall; apps/worker/src/legacy.ts` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | SEASON-003 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-season.pdf (S3, "The map becomes a fossil")` |
| **Status** | `todo` |

## 🔴 RED

Retire (HALL-001) on vapaaehtoinen, eikä eläköityneiden lista päädy historiaan (jonossa oleva TODO). Dokumentti: sinetöinnissä kartta jäätyy, 48 h fossiilina luku-tilassa, sitten tilinpäätös.

## 🟢 GREEN

- [ ] Vaiheessa `sealed` peli on luku-tilassa (ei valtausta eikä rakentamista); S3-ruutu Quiet/Risen + sija + Legacy
- [ ] Pakotettu retire: valtakunta Hall of Fameen (HALL-003 Chronicles), tallennus nollautuu kaudelle
- [ ] Eläköityneiden lista historiaan (Atlas history / Chronicles)
- [ ] Rivaalien viimeiset valtakunnat avattavissa read-only
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

e2e: admin sinetöi → pelaaja näkee S3:n eikä voi vallata.

## Ei tässä

—
