# BRDC-PAGES-001 — Kirjan sivut

| | |
|---|---|
| **Alue** | rites, huhut |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | M |
| **Riippuvuudet** | PROG-007, DOOM-003 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus C7; Infinite hyväksyi kaikki |
| **Status** | `done` (2026-10-08, haara `season-3`) |

## 🔴 RED

Riitit opitaan temppeleissä. Kirja, joka palasi useammalla sivulla (Agnesin tarina), antaa kielletyn tiedon reitin — hinnalla.

## 🟢 GREEN

- [x] 10 sivua löytyy huhuista ja anomalioista; jokainen sivu = uusi riitti tai riitin vahvistus — `rules/pages.ts`: läpäisty huhu tai valmis anomalia löytää seuraavan sivun ~40 %:lla heksoista (deterministinen); sivu opettaa riitin ilman temppeliä tai syventää sitä (max III)
- [x] Jokainen luettu sivu −1 max sanity (oletus) — valinta, ei pakko — `sanityCap(inv)` korvaa `SANITY_MAX`:n levossa ja palautuksissa; mieli kantaa 5 sivua (max sanity ≥ 1), joten 10:stä valitaan puolet
- [x] Sivut näkyvät Codexissa "kirjana" — **poikkeama:** Keepissä tutkijan vieressä (`KeepBook`, "The Book That Came Back"), ei Codexissa: pelin Codexit ovat Codex of Dominion (tulostaulu) ja staattinen ohje, eikä kumpikaan kanna löydettyä sisältöä ja lukutekoa. Siirrettävissä, jos Infinite haluaa
- [x] Testit: sivun hinta, riitin avautuminen — `pages.test.ts`, `pages.repo.test.ts`
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 2120/2120, e2e `pages.spec.ts` 360 px 3/3

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Kirjan jakaminen muille.
