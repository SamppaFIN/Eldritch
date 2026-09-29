# BRDC-PROG-003 — Kulttuuri ostaa maan, kopiot kallistuvat

| | |
|---|---|
| **Alue** | `packages/core/src/rules/step.ts, capture.ts, hearthGrowth.ts, build.ts` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | S |
| **Riippuvuudet** | PROG-001 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-Progression.pdf ("Every cell costs more", "Copies get dearer")` |
| **Status** | `todo` |

## 🔴 RED

Askelvaltaus on ilmainen (CLAIM-009/017), joten maa kasvaa niin nopeasti kuin jaksaa kävellä. Dokumentti: `claim(n)=8+3·n^1.15` kulttuuria, kuten Civilizationin rajat. Samaa rakennusta voi rakentaa rajatta samaan hintaan; dokumentti: `cost(k)=base·1.25^(k−1)`.

**Päätös Infiniteltä:** kävely pysyy ainoana tapana, kulttuuri on hinta. Sulautuuko Hearthin kasvatus (100 food/heksa, 0.6.66) tähän vai jääkö rinnalle?

## 🟢 GREEN

- [ ] `claimCost(n)` askelvaltaukseen; ei varaa → heksaa ei vallata ja paneeli kertoo miksi
- [ ] Keepin vaikutusalueella valtaus alkaa vahvempana
- [ ] `copyCost(base,k)` `build.ts`:ään, paneeli näyttää k:nnen hinnan
- [ ] Hearth-kasvatuksen kohtalo päätetty ja toteutettu
- [ ] Vitest + step-claim.spec päivitetty
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

Vitest + e2e: kulttuurin loppuessa valtaus pysähtyy.

## Ei tässä

Rivaalin varastaminen (CLAIM-017 säilyy).
