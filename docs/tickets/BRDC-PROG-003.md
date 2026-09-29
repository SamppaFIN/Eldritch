# BRDC-PROG-003 — Kulttuuri ostaa maan, kopiot kallistuvat

| | |
|---|---|
| **Alue** | `packages/core/src/rules/step.ts, capture.ts, hearthGrowth.ts, build.ts` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | S |
| **Riippuvuudet** | PROG-001 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-Progression.pdf ("Every cell costs more", "Copies get dearer")` |
| **Status** | `in-progress` — kaikki paitsi BuildPanelin kopiohinta (2026-09-29) |

**KUMOTTU 2026-09-30 (kenttähavainto, Infinite):** *"jos kaveri oli monta tuntia ja monta laylinee, niin ei tuntunut kivalta kun ei saanutkaan maata.. Eikös täs nyt pitäny olla säännöissä, et aina saat maan kun kävelet sinne?"* — kulttuurihinta poistettu kokonaan (v0.7.2): kävely valtaa aina, kuten CLAUDE.md lupaa. Kasvun jarru on PROG-008:n sanity (−1 / 8 heksaa). Kopiohinnat (`copyCost`) jäävät.

## 🔴 RED

Askelvaltaus on ilmainen (CLAIM-009/017), joten maa kasvaa niin nopeasti kuin jaksaa kävellä. Dokumentti: `claim(n)=8+3·n^1.15` kulttuuria, kuten Civilizationin rajat. Samaa rakennusta voi rakentaa rajatta samaan hintaan; dokumentti: `cost(k)=base·1.25^(k−1)`.

**Päätös Infiniteltä:** kävely pysyy ainoana tapana, kulttuuri on hinta. Sulautuuko Hearthin kasvatus (100 food/heksa, 0.6.66) tähän vai jääkö rinnalle?

## 🟢 GREEN

- [x] (`claimStepAt`: Season 2 -tallennuksella solu n maksaa `claimCost(n)` kulttuuria, ilman varaa `{claimed:null, needsCulture}`; kävelyn kasvu `walkWriter` ottaa vain `affordableClaims`-budjetin verran, järjestyksessä, ja `walkFlow` vähentää `claimsCost`in) `claimCost(n)` askelvaltaukseen; ei varaa → heksaa ei vallata ja paneeli kertoo miksi
- [ ] Keepin vaikutusalueella valtaus alkaa vahvempana
- [~] (`buildCost(id, copies)` + `BuildContext.copies`, `buildStore` laskee kopiot Season 2:lla ja maksaa kalliimman; **BuildPanelin näyttämä hinta ei vielä huomioi kopioita**) `copyCost(base,k)` `build.ts`:ään, paneeli näyttää k:nnen hinnan
- [x] Hearth-kasvatuksen kohtalo: **Infinite 2026-09-29: pysyy ennallaan** (100 food/heksa kulttuurin rinnalla, kaksi reittiä maahan) — ei koodimuutosta
- [x] Vitest (`affordableClaims`/`claimsCost`, `buildCost`-kopiot, `step.repo.test` Season 2 -valtaus); UI: Keepin Citizens-osio kertoo seuraavan heksan hinnan ja sen, ettei kävely ota maata ilman kulttuuria; e2e `keep-citizens.spec.ts` 8/8 (+ step-claim)
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

Vitest + e2e: kulttuurin loppuessa valtaus pysähtyy.

## Ei tässä

Rivaalin varastaminen (CLAIM-017 säilyy).
