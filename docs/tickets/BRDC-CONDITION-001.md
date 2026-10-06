# BRDC-CONDITION-001 — Tilat: Velka, Vainoharha, Kirous…

| | |
|---|---|
| **Alue** | `rules/condition.ts`, investigator, deck |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | M |
| **Riippuvuudet** | INVEST-001 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus B1; Infinite hyväksyi kaikki |
| **Status** | `done` — 2026-10-06 (haara `season-3`) |

## 🔴 RED

Epäonnistuminen maksaa vain sanityä tai healthia. Eldritch Horrorin tilat (Conditions) tekevät seurauksista tarinoita, joilla on hinta ja purkutapa.

## 🟢 GREEN

- [x] 6 tilaa (`rules/condition.ts`): Debt (maksa 50 gold Keepissä, muuten heikoin ei-Hearth-heksa viedään 72 h:ssa), Paranoia (Wit −1 noppa; kävele Hearth-heksasi), Cursed (vain 6 onnistuu; kävele temppeli), Amnesia (vihjettä ei voi käyttää uusintaan; 24 h), Blessed (4+ onnistuu; 24 h), Dark Pact (Lore +2 noppaa, lopussa −3 sanity; 72 h). Kävelyparannus luetaan solujen `lastVisitedAt`ista — ei askelkoukkua
- [x] 5 huhukorttia ja 2 tehtävää antavat tilan epäonnistuessa, Sanity Shrine siunauksen onnistuessa; Keepin "Conditions"-lista kertoo vaikutuksen, purkutavan ja ajan; nopat/onni `diceFor`/`luckFor`issa → kaikki kokeet — e2e `condition.spec.ts`
- [x] Puhtaat säännöt + `condition.test.ts`, `condition.repo.test.ts`; `conditions` valinnainen kenttä tutkijan tietueessa
- [x] Jokaisella aikaraja (24–72 h); hinnat (velka, sopimus) toteutuvat `settle`ssa, jota kartta kutsuu kävellessä ja Keep avatessa
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Kortit fyysisenä pakkana; tilat muille pelaajille.
