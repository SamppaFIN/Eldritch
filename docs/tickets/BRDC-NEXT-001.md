# BRDC-NEXT-001 — Seuraavaksi valmistuu -nauha

| | |
|---|---|
| **Alue** | HUD / Counsel, vain luku |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | S |
| **Riippuvuudet** | — |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus A9; Infinite hyväksyi kaikki |
| **Status** | `todo` |

## 🔴 RED

Monta asiaa valmistuu (Lore, granary, tehtävät, ihmeteot), mutta mikään ei kerro mitä seuraavaksi. 4X:n "vielä yksi vuoro" syntyy siitä, että seuraava asia on aina näkyvissä.

## 🟢 GREEN

- [ ] Yksi rivi kävelyarkissa: kolme lähintä valmistuvaa ("Lore 2 h · Granary täynnä 5 h · Tehtävä 3/5"), napautus avaa kohteen
- [ ] Puhdas `upNext(state, now)` järjestää ajan tai edistymisen mukaan + testit
- [ ] Ei uutta tilaa — lukee olemassa olevista store-näkymistä
- [ ] Mahtuu 360 px:iin yhdelle riville
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Ilmoitukset puhelimen ilmoituskeskukseen.
