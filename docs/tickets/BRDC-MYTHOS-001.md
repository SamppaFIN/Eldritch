# BRDC-MYTHOS-001 — Mythos-kortti jatkumoksi

| | |
|---|---|
| **Alue** | `rules/doom.ts` |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | S–M |
| **Riippuvuudet** | DOOM-001 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus B7; Infinite hyväksyi kaikki |
| **Status** | `done` — 2026-10-06 (haara `season-3`) |

## 🔴 RED

Päivän Mythos-kortti on yksittäinen sääntö ilman jatkumoa. Arkham Horrorin mythos-vaihe kertoo kaupungin tarinaa päivä päivältä.

## 🟢 GREEN

- [x] 5 kolmen päivän ketjua (15 korttia, vanhat 10 mukana): kalastajan vene → järvi seisoo → kellot soivat; sato → varikset → yömarkkinat; sumu → kulkue → ovi; tähdet → kaukoputki → hiljainen yö; johdot → potkuripoika → tyyni taivas. Siemen + päivä, sama kaikilla (`mythos.test.ts`)
- [x] Uutisotsikko reunakorttina kerran päivässä (`MythosHeadline`, `mythos.markSeen`); ei näy uudelleen saman päivän reloadissa — e2e `mythos.spec.ts`. Keepin Doom-osio näyttää kortin kuten ennen
- [~] Vaikutukset kytketty niille, joilla on järjestelmä: nopat (Will/Wit/Lore ±1 portit, huhut, tehtävät, Reckoning), kädet (Farm +1 food, Market +2 gold per käsi), valtakunnan mana −1/h — hex-kortti näyttää rivin "Mythos: …" ja settle maksaa saman (`hexYield.test.ts`). **Odottaa yhä** (`waits`): varikset/vihjeet, kulkue/sanity, ovi/portti, tähdet/riittien hinta. Kauden kello opitaan Workerin seasonista (`K.mythos`); ilman sitä ei korttia eikä vaikutusta
- [x] Testit: ketju etenee päivittäin, sama kaikilla (`mythos.test.ts`, `mythos.repo.test.ts`)
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 2029 testiä

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Pelaajien kirjoittamat uutiset.
