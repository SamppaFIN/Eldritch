# BRDC-ALLY-001 — Liittolaiset

| | |
|---|---|
| **Alue** | investigator (`voice`-malli), tehtävät |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | S–M |
| **Riippuvuudet** | QUEST-009, INVEST-001 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus B6; Infinite hyväksyi kaikki |
| **Status** | `done` — 2026-10-06 (haara `season-3`) |

## 🔴 RED

NPC:t (Cornelius, Grug, Merchant) ovat vain tekstiä. Arkham Horrorin liittolaiset tekevät niistä apua.

## 🟢 GREEN

- [x] Tehtävät antavat liittolaisen: *Cornelius Needs Company* → Cornelius +1 Lore-noppa, *Grug's riddle* → Grug +1 Vigor-noppa, *Timber for the Merchant* → Merchant −10 % Workien hinta (`rules/ally.ts`); hinta pinoutuu Dockworkerin kanssa jäljelle jäävästä (100 → 81)
- [x] Yksi kerrallaan; toinen tarjoutuu (`allyOffer`) ja Keepissä valitaan "Take Grug" / "Keep Cornelius" (`investigator.answerAlly`) — `task.repo.test.ts`, e2e `ally.spec.ts`
- [x] Keepin tutkija-osiossa "Walks with you: Cornelius, the hermit · +1 die on Lore tests"
- [x] Puhtaat säännöt + `ally.test.ts`; noppa `diceFor`issa, joten kaikki kokeet (portit, huhut, tehtävät) saavat sen. Season 1 -valtakunta suorittaa tehtävän ilman liittolaista (ei tutkijaa)
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Liittolaisen menettäminen.
