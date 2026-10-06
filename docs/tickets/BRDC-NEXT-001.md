# BRDC-NEXT-001 — Seuraavaksi valmistuu -nauha

| | |
|---|---|
| **Alue** | HUD / Counsel, vain luku |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | S |
| **Riippuvuudet** | — |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus A9; Infinite hyväksyi kaikki |
| **Status** | `done` — 2026-10-06 (haara `season-3`) |

## 🔴 RED

Monta asiaa valmistuu (Lore, granary, tehtävät, ihmeteot), mutta mikään ei kerro mitä seuraavaksi. 4X:n "vielä yksi vuoro" syntyy siitä, että seuraava asia on aina näkyvissä.

## 🟢 GREEN

- [x] Yksi rivi kävelyarkissa: kolme lähintä valmistuvaa ("Next citizen 5 h · Learn Husbandry 5 h · Stores run out 12 h"); Lore-rivi avaa Researchin, Keepin rivit Keepin (e2e `up-next.spec.ts`), tehtävärivi on pelkkä teksti (ei omaa kohdetta). Season 1 -tallennuksella vain tehtävät (Lore ja Keep ovat kauden 2)
- [x] Puhdas `rankUpNext(items)` + `hoursToAfford`, `upNextText` (`rules/upNext.ts`, `upNext.test.ts`): kellot ensin lyhin ensin, sitten edistyminen pisimmälle ensin, max 3
- [x] Ei uutta tilaa — `useUpNext` lukee Loren, ennusteen, Keepin ja tehtävätaulun; MapView välittää yhden `useSheetLinks`-olion (pysyy 399 rivissä)
- [x] Mahtuu 360 px:iin yhdelle riville: ylivuoto pyyhkäistään sivuttain (HUDin korkeusbudjetti), kohteet 44 px korkeita
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 2009 testiä

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Ilmoitukset puhelimen ilmoituskeskukseen.
