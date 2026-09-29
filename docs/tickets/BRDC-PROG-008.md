# BRDC-PROG-008 — Sanity: valtakunnan mieliala

| | |
|---|---|
| **Alue** | `packages/core/src/rules/sanity.ts, HUD` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | S |
| **Riippuvuudet** | PROG-001, PROG-002 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-Progression.pdf ("Sanity is the realm’s mood")` |
| **Status** | `todo` |

## 🔴 RED

Valtakunnalla ei ole mielialaa; kasvu ei maksa mitään. Dokumentti: `10+2·temples+3·taverns−(citizens−6)−cells÷8−2·gatesNear`; alle 0 tuotot −20 % ja hulluuskohtaamiset, alle −10 kansalaiset lähtevät.

## 🟢 GREEN

- [ ] `realmSanity(realm)` + Vitest
- [ ] Efektit tuottoihin ja kansalaisiin
- [ ] HUD/Keep näyttää sanityn luvulla ja sanalla (§14: väri ei yksin)
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

Vitest.

## Ei tässä

Tutkijan oma sanity (DOOM-002).
